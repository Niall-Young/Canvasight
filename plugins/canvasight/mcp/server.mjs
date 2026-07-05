#!/usr/bin/env node
import { spawn } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import fsp from "node:fs/promises";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SERVER_NAME = "canvasight";
const SERVER_VERSION = "0.1.0";
const DEFAULT_PROTOCOL_VERSION = "2024-11-05";
const MAX_JSON_BODY_BYTES = 100 * 1024 * 1024;
const VALID_LANGUAGES = new Set(["zh", "en"]);
const VALID_EFFORT = new Set(["low", "medium", "high", "xhigh"]);
const VALID_RUN_MODES = new Set(["flow", "node"]);
const IMAGE_EXTENSIONS = new Set([".apng", ".avif", ".gif", ".jpg", ".jpeg", ".png", ".svg", ".webp"]);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const pluginRoot = path.resolve(__dirname, "..");
const distRoot = path.join(pluginRoot, "dist");

const sessions = new Map();
let httpState = null;
let inputBuffer = Buffer.alloc(0);
let useContentLengthTransport = false;

class HttpError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
  }
}

function isObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function nowIso() {
  return new Date().toISOString();
}

function toNumber(value, fallback) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function normalizeLanguage(value) {
  return VALID_LANGUAGES.has(value) ? value : "zh";
}

function normalizeEffort(value) {
  return VALID_EFFORT.has(value) ? value : "xhigh";
}

function normalizeRunMode(value) {
  return VALID_RUN_MODES.has(value) ? value : "flow";
}

function normalizeProjectPath(projectPath) {
  if (typeof projectPath !== "string" || !projectPath.trim()) {
    throw new HttpError(400, "projectPath is required");
  }
  return path.resolve(projectPath);
}

function optionalProjectPath(projectPath) {
  if (typeof projectPath !== "string" || !projectPath.trim()) return null;
  return path.resolve(projectPath);
}

function defaultProjectPath() {
  const envNames = [
    "CANVASIGHT_DEFAULT_PROJECT_PATH",
    "CANVASIGHT_PROJECT_PATH",
    "CODEX_WORKSPACE_DIR",
    "CODEX_WORKSPACE",
    "WORKSPACE",
    "INIT_CWD",
    "PWD"
  ];

  for (const envName of envNames) {
    const candidate = optionalProjectPath(process.env[envName]);
    if (candidate && candidate !== pluginRoot) return candidate;
  }

  if (path.basename(path.dirname(pluginRoot)) === "plugins") {
    return path.resolve(pluginRoot, "../..");
  }

  return path.join(os.homedir(), "Canvasight");
}

function projectNameFromPath(projectPath) {
  return path.basename(projectPath) || projectPath;
}

function scatterDir(projectPath) {
  return path.join(projectPath, ".scatter");
}

function scatterPath(projectPath) {
  return path.join(scatterDir(projectPath), "scatter.json");
}

function scatterAssetsDir(projectPath) {
  return path.join(scatterDir(projectPath), "assets");
}

function toRelativeProjectPath(projectPath, targetPath) {
  return path.relative(projectPath, targetPath).split(path.sep).join("/");
}

function base64UrlEncode(value) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function base64UrlDecode(value) {
  try {
    return Buffer.from(String(value || ""), "base64url").toString("utf8");
  } catch {
    throw new HttpError(400, "Invalid asset path");
  }
}

function isScatterAssetPath(filePath) {
  return filePath.includes(`${path.sep}.scatter${path.sep}assets${path.sep}`);
}

function safeFileName(name) {
  const base = path.basename(typeof name === "string" && name.trim() ? name : "attachment");
  const sanitized = base.replace(/[<>:"/\\|?*\x00-\x1f]/g, "-").replace(/\s+/g, " ").trim();
  return sanitized.slice(0, 140) || "attachment";
}

function extensionFromName(name) {
  return path.extname(name || "").toLowerCase();
}

function mimeFromPath(filePath) {
  const ext = extensionFromName(filePath);
  const map = {
    ".css": "text/css; charset=utf-8",
    ".gif": "image/gif",
    ".html": "text/html; charset=utf-8",
    ".ico": "image/x-icon",
    ".jpeg": "image/jpeg",
    ".jpg": "image/jpeg",
    ".js": "text/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".mjs": "text/javascript; charset=utf-8",
    ".png": "image/png",
    ".svg": "image/svg+xml",
    ".txt": "text/plain; charset=utf-8",
    ".wasm": "application/wasm",
    ".webp": "image/webp"
  };
  return map[ext] || "application/octet-stream";
}

function attachmentKind(name, mime) {
  if (typeof mime === "string" && mime.toLowerCase().startsWith("image/")) return "image";
  return IMAGE_EXTENSIONS.has(extensionFromName(name)) ? "image" : "file";
}

function defaultScatterDocument(projectPath) {
  return {
    version: 1,
    projectName: projectNameFromPath(projectPath),
    updatedAt: nowIso(),
    viewport: { x: 0, y: 0, zoom: 1 },
    nodes: [],
    edges: []
  };
}

function normalizeAttachment(value) {
  const source = ["upload", "drop", "paste", "clipboard"].includes(value?.source) ? value.source : "upload";
  return {
    id: typeof value?.id === "string" && value.id ? value.id : crypto.randomUUID(),
    kind: value?.kind === "image" ? "image" : "file",
    source,
    originalName: typeof value?.originalName === "string" ? value.originalName : "attachment",
    storedPath: typeof value?.storedPath === "string" ? value.storedPath : "",
    relativePath: typeof value?.relativePath === "string" ? value.relativePath : "",
    fileUrl: typeof value?.fileUrl === "string" ? value.fileUrl : "",
    mime: typeof value?.mime === "string" ? value.mime : "application/octet-stream",
    size: toNumber(value?.size, 0),
    createdAt: typeof value?.createdAt === "string" ? value.createdAt : nowIso()
  };
}

function normalizeScatterNode(value, index) {
  const node = isObject(value) ? value : {};
  const data = isObject(node.data) ? node.data : {};
  return {
    ...node,
    id: typeof node.id === "string" && node.id ? node.id : `node-${index + 1}`,
    type: "task",
    position: {
      x: toNumber(node.position?.x, index * 460),
      y: toNumber(node.position?.y, 0)
    },
    data: {
      ...data,
      title: typeof data.title === "string" ? data.title : "",
      body: typeof data.body === "string" ? data.body : "",
      attachments: Array.isArray(data.attachments) ? data.attachments.map(normalizeAttachment) : [],
      effort: normalizeEffort(data.effort),
      planMode: Boolean(data.planMode),
      runMode: normalizeRunMode(data.runMode)
    }
  };
}

function normalizeScatterEdge(value, index) {
  const edge = isObject(value) ? value : {};
  return {
    ...edge,
    id: typeof edge.id === "string" && edge.id ? edge.id : `edge-${index + 1}`,
    source: typeof edge.source === "string" ? edge.source : "",
    target: typeof edge.target === "string" ? edge.target : ""
  };
}

function normalizeScatterDocument(value, projectPath) {
  if (!isObject(value)) {
    throw new HttpError(400, "document must be an object");
  }
  if (value.version !== 1) {
    throw new HttpError(400, "Only .scatter/scatter.json version 1 is supported");
  }

  const viewport = isObject(value.viewport) ? value.viewport : {};
  return {
    ...value,
    version: 1,
    projectName: typeof value.projectName === "string" && value.projectName ? value.projectName : projectNameFromPath(projectPath),
    updatedAt: typeof value.updatedAt === "string" && value.updatedAt ? value.updatedAt : nowIso(),
    viewport: {
      x: toNumber(viewport.x, 0),
      y: toNumber(viewport.y, 0),
      zoom: toNumber(viewport.zoom, 1)
    },
    nodes: Array.isArray(value.nodes) ? value.nodes.map(normalizeScatterNode) : [],
    edges: Array.isArray(value.edges) ? value.edges.map(normalizeScatterEdge) : []
  };
}

async function ensureScatterLayout(projectPath) {
  await fsp.mkdir(projectPath, { recursive: true });
  await fsp.mkdir(scatterAssetsDir(projectPath), { recursive: true });
}

async function readScatterDocument(projectPath) {
  await ensureScatterLayout(projectPath);
  const target = scatterPath(projectPath);
  try {
    const raw = await fsp.readFile(target, "utf8");
    return normalizeScatterDocument(JSON.parse(raw), projectPath);
  } catch (error) {
    if (error?.code === "ENOENT") {
      const document = defaultScatterDocument(projectPath);
      await writeScatterDocument(projectPath, document);
      return document;
    }
    if (error instanceof SyntaxError) {
      throw new HttpError(400, "Invalid .scatter/scatter.json");
    }
    throw error;
  }
}

async function writeScatterDocument(projectPath, document) {
  await ensureScatterLayout(projectPath);
  const normalized = normalizeScatterDocument(document, projectPath);
  await fsp.writeFile(scatterPath(projectPath), `${JSON.stringify(normalized, null, 2)}\n`, "utf8");
  return normalized;
}

async function openProject(projectPath) {
  const document = await readScatterDocument(projectPath);
  return {
    project: {
      name: projectNameFromPath(projectPath),
      path: projectPath,
      updatedAt: document.updatedAt
    },
    document
  };
}

function sessionId() {
  return `session-${Date.now().toString(36)}-${crypto.randomBytes(4).toString("hex")}`;
}

function createSession({ projectPath, language }) {
  const id = sessionId();
  const resolvedProjectPath = optionalProjectPath(projectPath) || defaultProjectPath();
  const session = {
    id,
    projectPath: resolvedProjectPath,
    language: normalizeLanguage(language),
    createdAt: nowIso(),
    runQueue: [],
    waiters: []
  };
  sessions.set(id, session);
  return session;
}

function sessionInfo(session) {
  return {
    language: session.language,
    projectPath: session.projectPath,
    sessionId: session.id
  };
}

function getSession(id) {
  const session = sessions.get(id);
  if (!session) throw new HttpError(404, "Session not found");
  return session;
}

function normalizeRunPayload(session, value) {
  const payload = isObject(value) ? value : {};
  const projectPath = typeof payload.projectPath === "string" && payload.projectPath ? path.resolve(payload.projectPath) : session.projectPath;
  return {
    status: "received",
    sessionId: session.id,
    threadName: typeof payload.threadName === "string" ? payload.threadName : "Canvasight Run",
    projectPath,
    markdown: typeof payload.markdown === "string" ? payload.markdown : "",
    imagePaths: Array.isArray(payload.imagePaths) ? payload.imagePaths.filter((item) => typeof item === "string") : [],
    effort: normalizeEffort(payload.effort),
    planMode: Boolean(payload.planMode),
    runMode: normalizeRunMode(payload.runMode),
    nodeIds: Array.isArray(payload.nodeIds) ? payload.nodeIds.filter((item) => typeof item === "string") : [],
    attachments: Array.isArray(payload.attachments) ? payload.attachments.map(normalizeAttachment) : []
  };
}

function completeWaiter(waiter, payload) {
  clearTimeout(waiter.timer);
  waiter.resolve(payload);
}

function enqueueRun(session, payload) {
  const normalized = normalizeRunPayload(session, payload);
  const waiter = session.waiters.shift();
  if (waiter) {
    completeWaiter(waiter, normalized);
  } else {
    session.runQueue.push(normalized);
  }
  return normalized;
}

function waitForRun(sessionIdValue, timeoutMs) {
  const timeout = Math.max(1, Math.min(toNumber(timeoutMs, 60000), 300000));
  const session = sessions.get(sessionIdValue);
  if (!session) {
    return Promise.resolve({
      status: "closed",
      sessionId: sessionIdValue,
      threadName: "",
      projectPath: null,
      markdown: "",
      imagePaths: [],
      effort: "xhigh",
      planMode: false,
      runMode: "flow",
      nodeIds: [],
      attachments: []
    });
  }
  const queued = session.runQueue.shift();
  if (queued) return Promise.resolve(queued);

  return new Promise((resolve) => {
    const waiter = {
      resolve,
      timer: setTimeout(() => {
        const index = session.waiters.indexOf(waiter);
        if (index >= 0) session.waiters.splice(index, 1);
        resolve({
          status: "timeout",
          sessionId: sessionIdValue,
          threadName: "",
          projectPath: session.projectPath,
          markdown: "",
          imagePaths: [],
          effort: "xhigh",
          planMode: false,
          runMode: "flow",
          nodeIds: [],
          attachments: []
        });
      }, timeout)
    };
    session.waiters.push(waiter);
  });
}

function closeSession(sessionIdValue) {
  const session = sessions.get(sessionIdValue);
  if (!session) return false;
  sessions.delete(sessionIdValue);
  while (session.waiters.length) {
    completeWaiter(session.waiters.shift(), {
      status: "closed",
      sessionId: sessionIdValue,
      threadName: "",
      projectPath: session.projectPath,
      markdown: "",
      imagePaths: [],
      effort: "xhigh",
      planMode: false,
      runMode: "flow",
      nodeIds: [],
      attachments: []
    });
  }
  return true;
}

function sendJson(res, statusCode, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(statusCode, {
    "content-type": "application/json; charset=utf-8",
    "content-length": Buffer.byteLength(body)
  });
  res.end(body);
}

function sendNoContent(res) {
  res.writeHead(204);
  res.end();
}

function sendText(res, statusCode, text, contentType = "text/plain; charset=utf-8") {
  res.writeHead(statusCode, {
    "content-type": contentType,
    "content-length": Buffer.byteLength(text)
  });
  res.end(text);
}

function readRequestBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > MAX_JSON_BODY_BYTES) {
        reject(new HttpError(413, "Request body too large"));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

async function readJsonBody(req) {
  const raw = await readRequestBody(req);
  if (!raw.trim()) return {};
  try {
    return JSON.parse(raw);
  } catch {
    throw new HttpError(400, "Invalid JSON body");
  }
}

function assertMethod(req, expected) {
  if (req.method !== expected) {
    throw new HttpError(405, `Expected ${expected}`);
  }
}

async function saveAttachments(projectPath, files) {
  if (!Array.isArray(files)) throw new HttpError(400, "files must be an array");
  await ensureScatterLayout(projectPath);
  const assetsDir = scatterAssetsDir(projectPath);

  const saved = [];
  for (const input of files) {
    if (!isObject(input)) throw new HttpError(400, "attachment input must be an object");
    const originalName = safeFileName(input.name);
    const mime = typeof input.mime === "string" && input.mime ? input.mime : mimeFromPath(originalName);
    const uniqueName = `${Date.now()}-${crypto.randomBytes(4).toString("hex")}-${originalName}`;
    const storedPath = path.join(assetsDir, uniqueName);
    let bytes;

    if (typeof input.dataBase64 === "string") {
      bytes = Buffer.from(input.dataBase64, "base64");
    } else if (typeof input.path === "string" && input.path.trim()) {
      bytes = await fsp.readFile(path.resolve(input.path));
    } else {
      throw new HttpError(400, "attachment requires dataBase64 or path");
    }

    await fsp.writeFile(storedPath, bytes);
    saved.push({
      id: crypto.randomUUID(),
      kind: attachmentKind(originalName, mime),
      source: ["upload", "drop", "paste", "clipboard"].includes(input.source) ? input.source : "upload",
      originalName,
      storedPath,
      relativePath: toRelativeProjectPath(projectPath, storedPath),
      fileUrl: `/api/asset?path=${encodeURIComponent(base64UrlEncode(storedPath))}`,
      mime,
      size: bytes.length,
      createdAt: nowIso()
    });
  }

  return saved;
}

function revealPath(targetPath) {
  if (typeof targetPath !== "string" || !targetPath.trim()) return;
  const resolved = path.resolve(targetPath);
  let command;
  let args;

  if (process.platform === "darwin") {
    command = "open";
    args = ["-R", resolved];
  } else if (process.platform === "win32") {
    command = "explorer.exe";
    args = ["/select,", resolved];
  } else {
    command = "xdg-open";
    args = [fs.existsSync(resolved) && fs.statSync(resolved).isDirectory() ? resolved : path.dirname(resolved)];
  }

  const child = spawn(command, args, {
    detached: true,
    stdio: "ignore"
  });
  child.on("error", () => undefined);
  child.unref();
}

function openBrowser(url) {
  if (process.env.CANVASIGHT_OPEN_BROWSER === "0") return;
  let command;
  let args;
  if (process.platform === "darwin") {
    command = "open";
    args = [url];
  } else if (process.platform === "win32") {
    command = "cmd";
    args = ["/c", "start", "", url];
  } else {
    command = "xdg-open";
    args = [url];
  }
  const child = spawn(command, args, {
    detached: true,
    stdio: "ignore"
  });
  child.on("error", () => undefined);
  child.unref();
}

function staticTarget(urlPath) {
  const decodedPath = decodeURIComponent(urlPath);
  const requested = decodedPath === "/" ? "/index.html" : decodedPath;
  const normalized = path.normalize(requested).replace(/^(\.\.[/\\])+/, "");
  const target = path.join(distRoot, normalized);
  const resolved = path.resolve(target);
  if (!resolved.startsWith(path.resolve(distRoot))) {
    throw new HttpError(403, "Forbidden");
  }
  return resolved;
}

async function serveStatic(req, res, url) {
  let target = staticTarget(url.pathname);
  try {
    const stat = await fsp.stat(target);
    if (stat.isDirectory()) target = path.join(target, "index.html");
  } catch {
    const indexPath = path.join(distRoot, "index.html");
    try {
      await fsp.access(indexPath);
      target = indexPath;
    } catch {
      sendText(res, 503, "Canvasight dist is not built. Run the plugin build before opening the UI.");
      return;
    }
  }

  try {
    const stat = await fsp.stat(target);
    if (!stat.isFile()) {
      sendText(res, 404, "Not found");
      return;
    }
    res.writeHead(200, {
      "content-type": mimeFromPath(target),
      "content-length": stat.size
    });
    fs.createReadStream(target).pipe(res);
  } catch {
    sendText(res, 404, "Not found");
  }
}

async function serveAsset(req, res, url) {
  assertMethod(req, "GET");
  const assetPath = path.resolve(base64UrlDecode(url.searchParams.get("path")));
  if (!isScatterAssetPath(assetPath)) throw new HttpError(403, "Forbidden");
  const stat = await fsp.stat(assetPath);
  if (!stat.isFile()) throw new HttpError(404, "Asset not found");
  res.writeHead(200, {
    "content-type": mimeFromPath(assetPath),
    "content-length": stat.size
  });
  fs.createReadStream(assetPath).pipe(res);
}

async function handleSessionApi(req, res, url) {
  const match = url.pathname.match(/^\/api\/sessions\/([^/]+)(?:\/([^/]+))?$/);
  if (!match) return false;
  const session = getSession(decodeURIComponent(match[1]));
  const action = match[2] || "";

  if (!action) {
    assertMethod(req, "GET");
    sendJson(res, 200, sessionInfo(session));
    return true;
  }

  if (action === "open-project") {
    assertMethod(req, "POST");
    const body = await readJsonBody(req);
    const projectPath = normalizeProjectPath(body.projectPath || session.projectPath);
    session.projectPath = projectPath;
    sendJson(res, 200, await openProject(projectPath));
    return true;
  }

  if (action === "document") {
    assertMethod(req, "POST");
    const body = await readJsonBody(req);
    const projectPath = normalizeProjectPath(body.projectPath || session.projectPath);
    const document = await writeScatterDocument(projectPath, body.document);
    session.projectPath = projectPath;
    sendJson(res, 200, document);
    return true;
  }

  if (action === "attachments") {
    assertMethod(req, "POST");
    const body = await readJsonBody(req);
    const projectPath = normalizeProjectPath(body.projectPath || session.projectPath);
    const attachments = await saveAttachments(projectPath, body.files);
    session.projectPath = projectPath;
    sendJson(res, 200, attachments);
    return true;
  }

  if (action === "run") {
    assertMethod(req, "POST");
    const body = await readJsonBody(req);
    enqueueRun(session, body);
    sendJson(res, 200, { status: "queued" });
    return true;
  }

  throw new HttpError(404, "API route not found");
}

async function handleHttp(req, res) {
  try {
    const url = new URL(req.url || "/", "http://127.0.0.1");
    if (req.method === "OPTIONS") {
      sendNoContent(res);
      return;
    }

    if (url.pathname === "/api/reveal") {
      assertMethod(req, "POST");
      const body = await readJsonBody(req);
      revealPath(body.targetPath);
      sendJson(res, 200, {});
      return;
    }

    if (url.pathname === "/api/asset") {
      await serveAsset(req, res, url);
      return;
    }

    if (url.pathname.startsWith("/api/sessions/")) {
      if (!(await handleSessionApi(req, res, url))) {
        throw new HttpError(404, "API route not found");
      }
      return;
    }

    if (url.pathname.startsWith("/api/")) {
      throw new HttpError(404, "API route not found");
    }

    await serveStatic(req, res, url);
  } catch (error) {
    if (res.headersSent) {
      res.destroy(error);
      return;
    }
    const statusCode = error instanceof HttpError ? error.statusCode : 500;
    sendJson(res, statusCode, { error: error?.message || "Internal server error" });
  }
}

async function ensureHttpServer() {
  if (httpState) return httpState;
  const server = http.createServer((req, res) => {
    void handleHttp(req, res);
  });
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      server.off("error", reject);
      resolve();
    });
  });
  const address = server.address();
  const port = typeof address === "object" && address ? address.port : 0;
  httpState = {
    server,
    port,
    origin: `http://127.0.0.1:${port}`
  };
  return httpState;
}

function toolResult(structuredContent, text = "") {
  return {
    content: [
      {
        type: "text",
        text: text || structuredContent.markdown || ""
      }
    ],
    structuredContent
  };
}

async function toolOpenCanvasight(args) {
  const session = createSession({
    projectPath: typeof args?.projectPath === "string" && args.projectPath ? args.projectPath : null,
    language: args?.language
  });
  const openedProject = await openProject(session.projectPath);
  const server = await ensureHttpServer();
  const url = `${server.origin}/?sessionId=${encodeURIComponent(session.id)}`;
  openBrowser(url);
  return toolResult(
    {
      status: "opened",
      sessionId: session.id,
      url,
      origin: server.origin,
      projectPath: session.projectPath,
      project: openedProject.project,
      language: session.language
    },
    `Canvasight session opened: ${url}`
  );
}

async function toolAwaitCanvasightRun(args) {
  if (typeof args?.sessionId !== "string" || !args.sessionId) {
    throw new Error("sessionId is required");
  }
  const run = await waitForRun(args.sessionId, args.timeoutMs);
  const text = run.status === "received" ? run.markdown : `Canvasight run status: ${run.status}`;
  return toolResult(run, text);
}

async function toolCloseCanvasight(args) {
  if (typeof args?.sessionId !== "string" || !args.sessionId) {
    throw new Error("sessionId is required");
  }
  const existed = closeSession(args.sessionId);
  return toolResult(
    {
      status: "closed",
      sessionId: args.sessionId,
      existed
    },
    existed ? `Canvasight session closed: ${args.sessionId}` : `Canvasight session already closed: ${args.sessionId}`
  );
}

const tools = [
  {
    name: "open_canvasight",
    description: "Open a Canvasight browser session and start or reuse the local HTTP server.",
    inputSchema: {
      type: "object",
      properties: {
        projectPath: {
          type: "string",
          description: "Optional local project path to associate with the session."
        },
        language: {
          type: "string",
          enum: ["zh", "en"],
          description: "Optional UI and markdown language preference."
        }
      },
      additionalProperties: false
    }
  },
  {
    name: "await_canvasight_run",
    description: "Wait for a browser run payload from a Canvasight session.",
    inputSchema: {
      type: "object",
      properties: {
        sessionId: {
          type: "string"
        },
        timeoutMs: {
          type: "number",
          minimum: 1
        }
      },
      required: ["sessionId"],
      additionalProperties: false
    }
  },
  {
    name: "close_canvasight",
    description: "Close a Canvasight session. This operation is idempotent.",
    inputSchema: {
      type: "object",
      properties: {
        sessionId: {
          type: "string"
        }
      },
      required: ["sessionId"],
      additionalProperties: false
    }
  }
];

async function callTool(name, args) {
  if (name === "open_canvasight") return toolOpenCanvasight(args || {});
  if (name === "await_canvasight_run") return toolAwaitCanvasightRun(args || {});
  if (name === "close_canvasight") return toolCloseCanvasight(args || {});
  throw new Error(`Unknown tool: ${name}`);
}

function encodeJsonRpc(message) {
  const body = JSON.stringify(message);
  if (useContentLengthTransport) {
    return `Content-Length: ${Buffer.byteLength(body, "utf8")}\r\n\r\n${body}`;
  }
  return `${body}\n`;
}

function writeMessage(message) {
  process.stdout.write(encodeJsonRpc(message));
}

function writeResult(id, result) {
  writeMessage({
    jsonrpc: "2.0",
    id,
    result
  });
}

function writeError(id, code, message, data) {
  writeMessage({
    jsonrpc: "2.0",
    id,
    error: {
      code,
      message,
      ...(data === undefined ? {} : { data })
    }
  });
}

async function handleJsonRpc(message) {
  if (Array.isArray(message)) {
    await Promise.all(message.map(handleJsonRpc));
    return;
  }
  if (!isObject(message)) return;
  const { id, method, params } = message;
  const hasId = Object.prototype.hasOwnProperty.call(message, "id");

  try {
    if (method === "initialize") {
      if (hasId) {
        writeResult(id, {
          protocolVersion: params?.protocolVersion || DEFAULT_PROTOCOL_VERSION,
          capabilities: {
            tools: {}
          },
          serverInfo: {
            name: SERVER_NAME,
            version: SERVER_VERSION
          }
        });
      }
      return;
    }

    if (method === "notifications/initialized" || method === "initialized") {
      return;
    }

    if (method === "tools/list") {
      if (hasId) writeResult(id, { tools });
      return;
    }

    if (method === "tools/call") {
      const name = params?.name;
      const args = params?.arguments || {};
      const result = await callTool(name, args);
      if (hasId) writeResult(id, result);
      return;
    }

    if (method === "ping") {
      if (hasId) writeResult(id, {});
      return;
    }

    if (hasId) writeError(id, -32601, `Method not found: ${method}`);
  } catch (error) {
    if (hasId) writeError(id, -32000, error?.message || "Tool call failed");
  }
}

function consumeContentLengthMessage() {
  const headerEnd = inputBuffer.indexOf("\r\n\r\n");
  if (headerEnd < 0) return false;
  const header = inputBuffer.subarray(0, headerEnd).toString("ascii");
  const match = header.match(/content-length:\s*(\d+)/i);
  if (!match) {
    inputBuffer = inputBuffer.subarray(headerEnd + 4);
    return true;
  }
  const length = Number(match[1]);
  const start = headerEnd + 4;
  const end = start + length;
  if (inputBuffer.length < end) return false;
  const body = inputBuffer.subarray(start, end).toString("utf8");
  inputBuffer = inputBuffer.subarray(end);
  void handleJsonRpc(JSON.parse(body));
  return true;
}

function drainInputBuffer() {
  while (inputBuffer.length) {
    if (/^\s*$/.test(inputBuffer.toString("utf8"))) {
      inputBuffer = Buffer.alloc(0);
      return;
    }
    if (/^content-length:/i.test(inputBuffer.subarray(0, Math.min(inputBuffer.length, 32)).toString("ascii"))) {
      useContentLengthTransport = true;
      if (!consumeContentLengthMessage()) return;
      continue;
    }

    const newline = inputBuffer.indexOf("\n");
    if (newline < 0) return;
    const line = inputBuffer.subarray(0, newline).toString("utf8").trim();
    inputBuffer = inputBuffer.subarray(newline + 1);
    if (!line) continue;
    void handleJsonRpc(JSON.parse(line));
  }
}

process.stdin.on("data", (chunk) => {
  inputBuffer = Buffer.concat([inputBuffer, Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)]);
  try {
    drainInputBuffer();
  } catch (error) {
    writeError(null, -32700, error?.message || "Parse error");
    inputBuffer = Buffer.alloc(0);
  }
});

process.stdin.on("end", () => {
  for (const id of Array.from(sessions.keys())) closeSession(id);
  if (httpState) httpState.server.close();
});

process.on("SIGTERM", () => {
  if (httpState) httpState.server.close();
  process.exit(0);
});

process.on("SIGINT", () => {
  if (httpState) httpState.server.close();
  process.exit(0);
});
