import { createHash, randomUUID } from "node:crypto";
import { spawn } from "node:child_process";
import fsp from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  importHistorySidecar,
  missingHistoryGitObjects,
  pushHistorySidecar,
  readHistorySidecar,
  synchronizeHistorySidecar,
  validatePortableHistory,
  writeHistorySidecar
} from "../infrastructure/git-history-sidecar.mjs";

function hash(value) {
  return createHash("sha256").update(value).digest("hex").slice(0, 24);
}

async function uniqueExportPath(directory, stem) {
  for (let serial = 1; serial < 10_000; serial += 1) {
    const suffix = serial === 1 ? "" : `-${serial}`;
    const candidate = path.join(directory, `${stem}${suffix}.json`);
    try {
      await fsp.access(candidate);
    } catch (error) {
      if (error?.code === "ENOENT") return candidate;
      throw error;
    }
  }
  throw new Error("could not choose a unique Project History export name");
}

async function git(cwd, args, { optionalExitCodes = [] } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn("git", ["-C", cwd, ...args], { stdio: ["ignore", "pipe", "pipe"] });
    const stdout = [];
    const stderr = [];
    child.stdout.on("data", (chunk) => stdout.push(chunk));
    child.stderr.on("data", (chunk) => stderr.push(chunk));
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0 || optionalExitCodes.includes(code)) resolve({ code, stdout: Buffer.concat(stdout).toString("utf8").trim() });
      else reject(new Error(`git ${args.join(" ")} failed (${code}): ${Buffer.concat(stderr).toString("utf8").trim()}`));
    });
  });
}

export class ProjectHistoryPortabilityService {
  constructor(historyService, viewStore) {
    this.history = historyService;
    this.viewStore = viewStore;
    this.projectPath = historyService.projectPath;
    this.settingsPath = path.join(historyService.store.storageDirectory, "portability.json");
    this.importPath = path.join(historyService.store.storageDirectory, "portable-manifest.json");
    this.projectId = historyService.identity.portableProjectId || historyService.identity.localProjectId;
    const suffix = hash(this.projectId);
    this.customRef = `refs/canvasight/history/${suffix}`;
    this.fallbackRef = `refs/heads/canvasight-history/${suffix}`;
  }

  async #remotes() {
    return (await git(this.projectPath, ["remote"])).stdout.split(/\r?\n/u).filter(Boolean).sort();
  }

  async #settings() {
    try {
      const value = JSON.parse(await fsp.readFile(this.settingsPath, "utf8"));
      return {
        authorized: value?.authorized === true,
        remote: typeof value?.remote === "string" ? value.remote : null,
        historyRef: typeof value?.historyRef === "string" ? value.historyRef : this.customRef,
        updatedAt: typeof value?.updatedAt === "string" ? value.updatedAt : null
      };
    } catch (error) {
      if (error?.code === "ENOENT") return { authorized: false, remote: null, historyRef: this.customRef, updatedAt: null };
      throw error;
    }
  }

  async #saveSettings(settings) {
    const value = { ...settings, updatedAt: new Date().toISOString() };
    const temporaryPath = `${this.settingsPath}.${process.pid}.tmp`;
    await fsp.writeFile(temporaryPath, `${JSON.stringify(value, null, 2)}\n`, { encoding: "utf8", mode: 0o600 });
    await fsp.rename(temporaryPath, this.settingsPath);
    return value;
  }

  async status() {
    const settings = await this.#settings();
    const remotes = await this.#remotes();
    const local = await readHistorySidecar(this.projectPath, settings.historyRef).catch(() => null);
    return {
      projectId: this.projectId,
      remotes,
      authorized: settings.authorized && Boolean(settings.remote) && remotes.includes(settings.remote),
      remote: settings.remote,
      historyRef: settings.historyRef,
      localCommit: local?.commit ?? null,
      updatedAt: settings.updatedAt
    };
  }

  async authorize(remote) {
    const remotes = await this.#remotes();
    if (typeof remote !== "string" || !remotes.includes(remote)) throw new Error("selected Git remote does not exist");
    await fsp.mkdir(path.dirname(this.settingsPath), { recursive: true });
    return this.#saveSettings({ authorized: true, remote, historyRef: this.customRef });
  }

  async revoke() {
    await fsp.mkdir(path.dirname(this.settingsPath), { recursive: true });
    return this.#saveSettings({ authorized: false, remote: null, historyRef: this.customRef });
  }

  async manifest() {
    const index = await this.history.readIndex();
    const view = await this.viewStore.read();
    const parentByNode = new Map();
    const baseline = index.nodes.find((node) => node.kind === "baseline");
    const series = new Map();
    for (const node of index.nodes.filter((candidate) => candidate.kind !== "baseline")) {
      const key = node.featureLineId || "unclassified";
      const previous = series.get(key) || baseline?.id || null;
      if (previous) parentByNode.set(node.id, previous);
      series.set(key, node.id);
    }
    return validatePortableHistory({
      schemaVersion: 1,
      projectId: this.projectId,
      events: index.nodes.map((node) => ({
        id: node.id,
        type: node.kind,
        summary: node.summary,
        occurredAt: node.occurredAt,
        status: node.merged
          ? "merged"
          : node.confirmed
            ? "confirmed"
            : node.agentCheck?.status
              ? `agent-${node.agentCheck.status}`
              : node.status,
        source: node.source === "codex" || node.source === "mixed" || node.source === "external" ? node.source : "portable",
        coverage: {
          complete: node.coverage?.complete === true,
          excludedPathspecs: Array.isArray(node.coverage?.excludedPathspecs) ? node.coverage.excludedPathspecs : []
        },
        parents: parentByNode.has(node.id) ? [parentByNode.get(node.id)] : [],
        git: {
          objectId: node.mergeCommit || node.confirmationCommit || node.commit,
          refName: node.confirmationRef || node.snapshotRef
        }
      })),
      layout: index.nodes.map((node) => ({
        eventId: node.id,
        x: view.positions[node.id]?.x ?? 0,
        y: view.positions[node.id]?.y ?? 0,
        collapsed: index.processGroups.some((group) => group.nodeIds.includes(node.id) && view.collapsedGroupIds.includes(group.id)),
        revision: view.revision
      })),
      conflicts: []
    });
  }

  async writeLocal() {
    const settings = await this.#settings();
    const historyRef = settings.historyRef || this.customRef;
    return writeHistorySidecar(this.projectPath, historyRef, await this.manifest());
  }

  async sync() {
    const settings = await this.#settings();
    if (!settings.authorized || !settings.remote) throw new Error("project-scoped sidecar sync authorization is required");
    const remotes = await this.#remotes();
    if (!remotes.includes(settings.remote)) throw new Error("authorized Git remote no longer exists");
    let historyRef = settings.historyRef || this.customRef;
    await writeHistorySidecar(this.projectPath, historyRef, await this.manifest());
    const remoteExists = (await git(this.projectPath, ["ls-remote", "--exit-code", settings.remote, historyRef], { optionalExitCodes: [2] })).code === 0;
    try {
      const result = remoteExists
        ? await synchronizeHistorySidecar(this.projectPath, settings.remote, historyRef, { authorized: true })
        : await pushHistorySidecar(this.projectPath, settings.remote, historyRef, { authorized: true });
      await this.#saveSettings({ ...settings, historyRef });
      return { status: "synced", historyRef, ...result };
    } catch (error) {
      if (historyRef !== this.customRef) throw error;
      historyRef = this.fallbackRef;
      await writeHistorySidecar(this.projectPath, historyRef, await this.manifest());
      const result = await pushHistorySidecar(this.projectPath, settings.remote, historyRef, { authorized: true });
      await this.#saveSettings({ ...settings, historyRef });
      return { status: "synced", fallback: true, historyRef, ...result };
    }
  }

  async importRemote(remote) {
    const remotes = await this.#remotes();
    if (typeof remote !== "string" || !remotes.includes(remote)) throw new Error("selected Git remote does not exist");
    let historyRef = this.customRef;
    let result;
    try {
      result = await importHistorySidecar(this.projectPath, remote, historyRef, { authorized: true });
    } catch {
      historyRef = this.fallbackRef;
      result = await importHistorySidecar(this.projectPath, remote, historyRef, { authorized: true });
    }
    await fsp.mkdir(path.dirname(this.importPath), { recursive: true });
    const temporaryPath = `${this.importPath}.${process.pid}.tmp`;
    await fsp.writeFile(temporaryPath, `${JSON.stringify({ manifest: result.manifest, missingObjectIds: result.missingObjectIds ?? [] }, null, 2)}\n`, { encoding: "utf8", mode: 0o600 });
    await fsp.rename(temporaryPath, this.importPath);
    await this.#saveSettings({ authorized: true, remote, historyRef });
    return { status: "imported", historyRef, ...result };
  }

  async importManifest(input) {
    const manifest = validatePortableHistory(input);
    if (manifest.projectId !== this.projectId) throw new Error("portable history belongs to a different project");
    const missingObjectIds = await missingHistoryGitObjects(this.projectPath, manifest);
    await fsp.mkdir(path.dirname(this.importPath), { recursive: true });
    const temporaryPath = `${this.importPath}.${process.pid}.tmp`;
    await fsp.writeFile(temporaryPath, `${JSON.stringify({ manifest, missingObjectIds }, null, 2)}\n`, { encoding: "utf8", mode: 0o600 });
    await fsp.rename(temporaryPath, this.importPath);
    return { status: "imported-local", manifest, missingObjectIds };
  }

  async exportManifest({ directory = process.env.CANVASIGHT_EXPORT_DIR || path.join(os.homedir(), "Downloads") } = {}) {
    const manifest = await this.manifest();
    const outputDirectory = path.resolve(directory);
    await fsp.mkdir(outputDirectory, { recursive: true });
    const targetPath = await uniqueExportPath(outputDirectory, `canvasight-project-history-${hash(manifest.projectId).slice(0, 12)}`);
    const temporaryPath = path.join(outputDirectory, `.${path.basename(targetPath)}.${randomUUID()}.tmp`);
    try {
      await fsp.writeFile(temporaryPath, `${JSON.stringify(manifest, null, 2)}\n`, { encoding: "utf8", mode: 0o600 });
      await fsp.rename(temporaryPath, targetPath);
    } catch (error) {
      await fsp.rm(temporaryPath, { force: true }).catch(() => undefined);
      throw error;
    }
    return { status: "exported-local", fileName: path.basename(targetPath), targetPath };
  }

  async readImportedManifest() {
    try {
      const value = JSON.parse(await fsp.readFile(this.importPath, "utf8"));
      return validatePortableHistory(value?.manifest ?? value);
    } catch (error) {
      if (error?.code === "ENOENT") return null;
      throw error;
    }
  }

  async readImportStatus() {
    try {
      const value = JSON.parse(await fsp.readFile(this.importPath, "utf8"));
      const manifest = validatePortableHistory(value?.manifest ?? value);
      return { manifest, missingObjectIds: Array.isArray(value?.missingObjectIds) ? value.missingObjectIds.filter((item) => typeof item === "string") : [] };
    } catch (error) {
      if (error?.code === "ENOENT") return null;
      throw error;
    }
  }
}
