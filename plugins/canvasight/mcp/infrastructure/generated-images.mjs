import crypto from "node:crypto";
import fs from "node:fs";
import fsp from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const MAX_GENERATED_IMAGE_COUNT = 16;
const MAX_GENERATED_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_GENERATED_IMAGE_BATCH_BYTES = 100 * 1024 * 1024;
const GENERATED_IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp"]);

export function createGeneratedImageWriter(dependencies) {
  const {
    GRAPH_LAYER_GAP,
    GRAPH_ROW_GAP,
    MAX_DOCUMENT_MUTATION_RECEIPTS,
    HttpError,
    assetUrlForPath,
    assertDocumentEdgeMutationAllowed,
    createConflictPage,
    deterministicUniqueId,
    documentFingerprint,
    documentObjectWriters,
    ensureProjectRevisionState,
    graphNodeBounds,
    isObject,
    isPathInside,
    normalizeAttachment,
    normalizeScatterDocument,
    nowIso,
    persistProjectRevisionState,
    readGraphContextSnapshot,
    readScatterDocument,
    rebuildDocumentMirrors,
    rememberProjectBestEffort,
    safeFileName,
    scatterAssetsDir,
    scatterPath,
    toRelativeProjectPath,
    withProjectWriteLock,
    writeScatterDocument
  } = dependencies;

  function generatedImagesRoot() {
    const configuredHome = typeof process.env.CODEX_HOME === "string" && process.env.CODEX_HOME.trim()
      ? process.env.CODEX_HOME.trim()
      : path.join(os.homedir(), ".codex");
    return path.resolve(configuredHome, "generated_images");
  }

  function normalizeGeneratedImageRequests(value) {
    if (!Array.isArray(value) || value.length === 0) {
      throw new HttpError(400, "images must contain at least one generated image.", "generated_images_required");
    }
    if (value.length > MAX_GENERATED_IMAGE_COUNT) {
      throw new HttpError(413, `Canvasight accepts at most ${MAX_GENERATED_IMAGE_COUNT} generated images per import.`, "generated_image_count_exceeded");
    }
    return value.map((image, index) => {
      if (!isObject(image) || typeof image.path !== "string" || !image.path.trim()) {
        throw new HttpError(400, `images[${index}].path is required.`, "generated_image_path_required");
      }
      if (!path.isAbsolute(image.path.trim())) {
        throw new HttpError(400, `images[${index}].path must be absolute.`, "generated_image_path_not_absolute");
      }
      const sourcePath = path.resolve(image.path.trim());
      const extension = path.extname(sourcePath).toLowerCase();
      if (!GENERATED_IMAGE_EXTENSIONS.has(extension)) {
        throw new HttpError(415, `images[${index}] must be PNG, JPEG, or WebP.`, "generated_image_format_unsupported");
      }
      const title = typeof image.title === "string" ? image.title.trim().slice(0, 200) : "";
      return { sourcePath, title };
    });
  }

  function generatedImageFormat(header) {
    if (header.length >= 8 && header.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "png";
    if (header.length >= 3 && header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff) return "jpeg";
    if (header.length >= 12 && header.subarray(0, 4).toString("ascii") === "RIFF" && header.subarray(8, 12).toString("ascii") === "WEBP") return "webp";
    return "";
  }

  function generatedImageMime(format) {
    if (format === "png") return "image/png";
    if (format === "jpeg") return "image/jpeg";
    if (format === "webp") return "image/webp";
    return "application/octet-stream";
  }

  function generatedImageExtensionMatches(extension, format) {
    if (format === "jpeg") return extension === ".jpg" || extension === ".jpeg";
    return extension === `.${format}`;
  }

  async function readFileHeader(filePath, length = 12) {
    const handle = await fsp.open(filePath, "r");
    try {
      const header = Buffer.alloc(length);
      const { bytesRead } = await handle.read(header, 0, length, 0);
      return header.subarray(0, bytesRead);
    } finally {
      await handle.close();
    }
  }

  async function sha256File(filePath) {
    const hash = crypto.createHash("sha256");
    await new Promise((resolve, reject) => {
      const stream = fs.createReadStream(filePath);
      stream.on("data", (chunk) => hash.update(chunk));
      stream.on("end", resolve);
      stream.on("error", reject);
    });
    return hash.digest("hex");
  }

  async function generatedImageAllowedRoots(projectPath) {
    const candidates = [projectPath, generatedImagesRoot()];
    const roots = [];
    for (const candidate of candidates) {
      try {
        const realPath = await fsp.realpath(candidate);
        if (!roots.includes(realPath)) roots.push(realPath);
      } catch (error) {
        if (error?.code !== "ENOENT") throw error;
      }
    }
    return roots;
  }

  async function inspectGeneratedImages(projectPath, requests) {
    const allowedRoots = await generatedImageAllowedRoots(projectPath);
    const inspected = [];
    let totalBytes = 0;
    for (let index = 0; index < requests.length; index += 1) {
      const request = requests[index];
      let stat;
      try {
        stat = await fsp.lstat(request.sourcePath);
      } catch (error) {
        if (error?.code === "ENOENT") throw new HttpError(404, `Generated image does not exist: ${path.basename(request.sourcePath)}`, "generated_image_not_found");
        throw error;
      }
      if (!stat.isFile() || stat.isSymbolicLink()) {
        throw new HttpError(403, `Generated image must be a regular non-symlink file: ${path.basename(request.sourcePath)}`, "generated_image_not_regular_file");
      }
      const realSourcePath = await fsp.realpath(request.sourcePath);
      if (!allowedRoots.some((root) => isPathInside(realSourcePath, root))) {
        throw new HttpError(403, `Generated image is outside the current project and Codex generated_images directory: ${path.basename(request.sourcePath)}`, "generated_image_path_forbidden");
      }
      if (stat.size <= 0 || stat.size > MAX_GENERATED_IMAGE_BYTES) {
        throw new HttpError(413, `Generated image must be between 1 byte and ${MAX_GENERATED_IMAGE_BYTES} bytes: ${path.basename(request.sourcePath)}`, "generated_image_too_large");
      }
      totalBytes += stat.size;
      if (totalBytes > MAX_GENERATED_IMAGE_BATCH_BYTES) {
        throw new HttpError(413, `Generated image batch exceeds ${MAX_GENERATED_IMAGE_BATCH_BYTES} bytes.`, "generated_image_batch_too_large");
      }
      const extension = path.extname(realSourcePath).toLowerCase();
      const format = generatedImageFormat(await readFileHeader(realSourcePath));
      if (!format || !generatedImageExtensionMatches(extension, format)) {
        throw new HttpError(415, `Generated image extension does not match its file signature: ${path.basename(request.sourcePath)}`, "generated_image_signature_mismatch");
      }
      inspected.push({
        ...request,
        sourcePath: realSourcePath,
        extension,
        format,
        mime: generatedImageMime(format),
        size: stat.size,
        digest: await sha256File(realSourcePath)
      });
    }
    return { images: inspected, allowedRoots };
  }

  function prepareGeneratedImageAssets(projectPath, inspectedImages, clientMutationId, existingDocument) {
    const assetsRoot = scatterAssetsDir(projectPath);
    const usedAssetIds = new Set(
      existingDocument.pages.flatMap((page) => page.nodes.flatMap((node) => {
        if (node.type === "asset") return [node.data?.asset?.id].filter(Boolean);
        if (node.type === "task") return (node.data?.attachments || []).map((attachment) => attachment.id).filter(Boolean);
        return [];
      }))
    );
    const now = nowIso();
    return inspectedImages.map((image, index) => {
      const originalName = safeFileName(path.basename(image.sourcePath));
      const uniqueName = `${Date.now()}-${crypto.randomBytes(4).toString("hex")}-${originalName}`;
      const storedPath = path.join(assetsRoot, uniqueName);
      const attachment = normalizeAttachment({
        id: deterministicUniqueId("generated-asset", clientMutationId, `${index + 1}:${image.digest}`, usedAssetIds),
        kind: "image",
        source: "generated",
        originalName,
        storedPath,
        relativePath: toRelativeProjectPath(projectPath, storedPath),
        fileUrl: assetUrlForPath(storedPath),
        mime: image.mime,
        size: image.size,
        createdAt: now
      });
      return { ...image, attachment, storedPath, title: image.title || originalName };
    });
  }

  async function commitGeneratedImageAssets(prepared, allowedRoots) {
    const committedPaths = [];
    try {
      for (const image of prepared) {
        const stat = await fsp.lstat(image.sourcePath);
        if (!stat.isFile() || stat.isSymbolicLink()) {
          throw new HttpError(409, `Generated image changed before import: ${path.basename(image.sourcePath)}`, "generated_image_changed");
        }
        const realSourcePath = await fsp.realpath(image.sourcePath);
        if (!allowedRoots.some((root) => isPathInside(realSourcePath, root))) {
          throw new HttpError(403, `Generated image moved outside an allowed directory: ${path.basename(image.sourcePath)}`, "generated_image_path_forbidden");
        }
        await fsp.mkdir(path.dirname(image.storedPath), { recursive: true });
        const temporaryPath = `${image.storedPath}.${process.pid}.${crypto.randomBytes(4).toString("hex")}.tmp`;
        try {
          await fsp.copyFile(realSourcePath, temporaryPath, fs.constants.COPYFILE_EXCL);
          const copiedFormat = generatedImageFormat(await readFileHeader(temporaryPath));
          const copiedDigest = await sha256File(temporaryPath);
          if (copiedFormat !== image.format || copiedDigest !== image.digest) {
            throw new HttpError(409, `Generated image changed while being imported: ${path.basename(image.sourcePath)}`, "generated_image_changed");
          }
          await fsp.rename(temporaryPath, image.storedPath);
        } catch (error) {
          await fsp.rm(temporaryPath, { force: true }).catch(() => undefined);
          throw error;
        }
        committedPaths.push(image.storedPath);
      }
      return committedPaths;
    } catch (error) {
      await Promise.all(committedPaths.map((storedPath) => fsp.rm(storedPath, { force: true }).catch(() => undefined)));
      throw error;
    }
  }

  function addGeneratedImageNodes(page, prepared, clientMutationId, existingDocument) {
    const usedNodeIds = new Set(existingDocument.pages.flatMap((item) => item.nodes.map((node) => node.id)));
    const bounds = page.nodes.map((node) => graphNodeBounds(node, page.nodes));
    const x = bounds.length ? Math.max(...bounds.map((item) => item.right)) + GRAPH_LAYER_GAP : 0;
    const baseY = bounds.length ? Math.min(...bounds.map((item) => item.y)) : 0;
    const nodes = prepared.map((image, index) => ({
      id: deterministicUniqueId("generated-image", clientMutationId, `${index + 1}:${image.digest}`, usedNodeIds),
      type: "asset",
      position: { x, y: baseY + index * (360 + GRAPH_ROW_GAP) },
      selected: false,
      data: {
        title: image.title,
        description: "",
        asset: image.attachment,
        role: "output"
      }
    }));
    return {
      page: { ...page, updatedAt: nowIso(), nodes: [...page.nodes, ...nodes] },
      nodes
    };
  }

  async function writeGeneratedImages(projectPath, args) {
    const requests = normalizeGeneratedImageRequests(args?.images);
    const contextId = typeof args?.contextId === "string" ? args.contextId.trim() : "";
    const clientMutationId = typeof args?.clientMutationId === "string" ? args.clientMutationId.trim() : "";
    if (!contextId) throw new HttpError(400, "contextId is required.", "generated_image_context_required");
    if (!clientMutationId) throw new HttpError(400, "clientMutationId is required.", "client_mutation_id_required");
    const requestFingerprint = documentFingerprint({
      tool: "add_canvasight_generated_images",
      contextId,
      expectedRevision: args?.expectedRevision,
      images: requests.map((image) => ({ path: image.sourcePath, title: image.title }))
    });

    return withProjectWriteLock(projectPath, async () => {
      const existingDocument = await readScatterDocument(projectPath);
      const revisionState = await ensureProjectRevisionState(projectPath, existingDocument);
      const currentRevision = revisionState.revision;
      const priorReceipt = revisionState.receipts.find((receipt) => receipt.clientMutationId === clientMutationId);
      if (priorReceipt) {
        if (priorReceipt.requestFingerprint !== requestFingerprint) {
          throw new HttpError(409, "Canvasight mutation id was reused for a different generated-image payload.", "mutation_id_reused");
        }
        return { ...priorReceipt.result, written: false, replayed: true, documentRevision: currentRevision, documentVersion: revisionState.documentVersion };
      }
      const context = readGraphContextSnapshot(projectPath, contextId);
      if (!context) throw new HttpError(409, "Canvasight graph context expired or belongs to a prior daemon process.", "context_expired");
      if (typeof args?.expectedRevision !== "number" || args.expectedRevision !== context.documentRevision) {
        throw new HttpError(409, "expectedRevision does not match the bound graph context.", "context_revision_mismatch");
      }

      const inspected = await inspectGeneratedImages(projectPath, requests);
      const prepared = prepareGeneratedImageAssets(projectPath, inspected.images, clientMutationId, existingDocument);
      const currentPage = existingDocument.pages.find((page) => page.id === context.page.id);
      const createdAt = nowIso();
      let pages;
      let targetPageId;
      let targetPageName;
      let createdNodes;
      let status;
      let conflictCopies = [];
      if (currentPage) {
        const added = addGeneratedImageNodes(currentPage, prepared, clientMutationId, existingDocument);
        pages = existingDocument.pages.map((page) => (page.id === currentPage.id ? added.page : page));
        targetPageId = currentPage.id;
        targetPageName = currentPage.name;
        createdNodes = added.nodes;
        status = currentRevision === context.documentRevision ? "written" : "merged";
      } else {
        const added = addGeneratedImageNodes(context.page, prepared, clientMutationId, existingDocument);
        const copy = createConflictPage(added.page, {
          baseRevision: context.documentRevision,
          priorRevision: currentRevision,
          clientMutationId,
          copyKind: "recovery",
          createdAt,
          existingNames: new Set(existingDocument.pages.map((page) => page.name)),
          incomingIntent: "edit",
          language: args?.language === "en" ? "en" : "zh",
          reasons: [`page-deleted:${context.page.id}`],
          usedEdgeIds: new Set(existingDocument.pages.flatMap((page) => page.edges.map((edge) => edge.id))),
          usedNodeIds: new Set(existingDocument.pages.flatMap((page) => page.nodes.map((node) => node.id))),
          usedPageIds: new Set(existingDocument.pages.map((page) => page.id))
        });
        copy.page.conflict.source = "ai";
        pages = [...existingDocument.pages, copy.page];
        targetPageId = copy.page.id;
        targetPageName = copy.page.name;
        createdNodes = added.nodes.map((node) => ({ ...node, id: copy.nodeIdMap[node.id] }));
        status = "conflict-copy";
        conflictCopies = [{
          sourcePageId: context.page.id,
          conflictPageId: copy.page.id,
          originalPageId: context.page.id,
          originalPageAvailable: false,
          copyKind: "recovery",
          source: "ai",
          reasons: [`page-deleted:${context.page.id}`],
          nodeIdMap: copy.nodeIdMap,
          edgeIdMap: copy.edgeIdMap
        }];
      }

      const activePage = pages.find((page) => page.id === existingDocument.activePageId) || pages[0];
      const candidateDocument = rebuildDocumentMirrors({
        ...existingDocument,
        version: 2,
        updatedAt: createdAt,
        activePageId: activePage.id,
        pages
      }, projectPath);
      assertDocumentEdgeMutationAllowed(existingDocument, candidateDocument);

      const documentRevision = currentRevision + 1;
      let committedPaths = [];
      let documentWritten = false;
      let savedDocument;
      try {
        committedPaths = await commitGeneratedImageAssets(prepared, inspected.allowedRoots);
        savedDocument = await writeScatterDocument(projectPath, candidateDocument);
        documentWritten = true;
        // Fingerprint the JSON-persisted shape, not the in-memory object. JSON
        // serialization drops undefined values, so using the pre-serialization
        // object can make the next daemon treat its own write as an external
        // document change and discard the persisted mutation receipt.
        const persistedDocument = normalizeScatterDocument(
          JSON.parse(await fsp.readFile(scatterPath(projectPath), "utf8")),
          projectPath
        );
        const documentVersion = documentFingerprint(persistedDocument);
        const assetNodes = createdNodes.map((node) => ({
          nodeId: node.id,
          assetId: node.data.asset.id,
          originalName: node.data.asset.originalName,
          relativePath: node.data.asset.relativePath
        }));
        const resultSummary = {
          status,
          written: true,
          replayed: false,
          projectPath,
          capturedPageId: context.page.id,
          targetPageId,
          targetPageName,
          documentRevision,
          documentVersion,
          rebasedFromRevision: context.documentRevision,
          conflictCopies,
          assetNodes
        };
        await persistProjectRevisionState(projectPath, {
          ...revisionState,
          revision: documentRevision,
          documentVersion,
          receipts: [...revisionState.receipts, {
            clientMutationId,
            requestFingerprint,
            result: resultSummary,
            createdAt,
            source: "imagegen"
          }].slice(-MAX_DOCUMENT_MUTATION_RECEIPTS),
          lastSource: "ai",
          objectWriters: documentObjectWriters(revisionState.objectWriters, existingDocument, savedDocument, "ai")
        });
        await rememberProjectBestEffort(projectPath, { name: savedDocument.projectName, updatedAt: savedDocument.updatedAt });
        return resultSummary;
      } catch (error) {
        if (documentWritten) {
          try {
            await writeScatterDocument(projectPath, existingDocument);
          } catch (rollbackError) {
            throw new Error(`Canvasight generated-image import failed and document rollback also failed: ${rollbackError?.message || rollbackError}`, { cause: error });
          }
        }
        await Promise.all(committedPaths.map((storedPath) => fsp.rm(storedPath, { force: true }).catch(() => undefined)));
        throw error;
      }
    });
  }


  return writeGeneratedImages;
}
