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
const SERVER_VERSION = "0.1.2";
const DEFAULT_PROTOCOL_VERSION = "2024-11-05";
const MAX_JSON_BODY_BYTES = 100 * 1024 * 1024;
const MAX_RECENT_PROJECTS = 12;
const MAX_NODE_TEMPLATES = 200;
const VALID_LANGUAGES = new Set(["zh", "en"]);
const VALID_EFFORT = new Set(["low", "medium", "high", "xhigh"]);
const VALID_CODEX_MODES = new Set(["chat", "plan", "goal"]);
const VALID_RUN_MODES = new Set(["flow", "node"]);
const VALID_GRAPH_WRITE_MODES = new Set(["append-page", "replace-active-page", "replace-document"]);
const VALID_GRAPH_LAYOUTS = new Set(["horizontal", "vertical", "grid"]);
const IMAGE_EXTENSIONS = new Set([".apng", ".avif", ".gif", ".jpg", ".jpeg", ".png", ".svg", ".webp"]);
const DEFAULT_CODEX_APP_BIN = "/Applications/Codex.app/Contents/Resources/codex";
const DEFAULT_CANVASIGHT_HOME = path.join(os.homedir(), ".canvasight");

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const pluginRoot = path.resolve(__dirname, "..");
const distRoot = path.join(pluginRoot, "dist");
const isDaemonMode = process.argv.includes("--daemon");
const isStopDaemonMode = process.argv.includes("--stop-daemon");

const sessions = new Map();
const globalRunWaiters = [];
let httpState = null;
let inputBuffer = Buffer.alloc(0);
let useContentLengthTransport = false;
let daemonAuthToken = process.env.CANVASIGHT_DAEMON_TOKEN || "";
let daemonStartedAt = nowIso();

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

function normalizeGraphWriteMode(value) {
  return VALID_GRAPH_WRITE_MODES.has(value) ? value : "append-page";
}

function normalizeGraphLayout(value) {
  return VALID_GRAPH_LAYOUTS.has(value) ? value : "horizontal";
}

function normalizeCodexMode(value, legacyPlanMode = false) {
  return VALID_CODEX_MODES.has(value) ? value : legacyPlanMode ? "plan" : "chat";
}

function optionalThreadId(threadId) {
  if (typeof threadId !== "string" || !threadId.trim()) return null;
  return threadId.trim();
}

function nativeCodexEnabled() {
  const value = String(process.env.CANVASIGHT_CODEX_NATIVE || "").toLowerCase();
  return value !== "0" && value !== "false" && value !== "off";
}

function nativeCodexTimeoutMs() {
  return Math.max(500, Math.min(toNumber(Number(process.env.CANVASIGHT_CODEX_NATIVE_TIMEOUT_MS), 5000), 30000));
}

function codexAppBin() {
  if (process.env.CANVASIGHT_CODEX_BIN) return process.env.CANVASIGHT_CODEX_BIN;
  return fs.existsSync(DEFAULT_CODEX_APP_BIN) ? DEFAULT_CODEX_APP_BIN : "codex";
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

function canvasightHome() {
  const configured = process.env.CANVASIGHT_HOME;
  return path.resolve(typeof configured === "string" && configured.trim() ? configured : DEFAULT_CANVASIGHT_HOME);
}

function canvasightStatePath() {
  return path.join(canvasightHome(), "state.json");
}

function canvasightDaemonStatePath() {
  return path.join(canvasightHome(), "daemon.json");
}

function canvasightTemplatesPath() {
  return path.join(canvasightHome(), "templates.json");
}

function canvasightTemplateAssetsDir() {
  return path.join(canvasightHome(), "template-assets");
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

function assetUrlForPath(filePath) {
  const tokenQuery = daemonAuthToken ? `&token=${encodeURIComponent(daemonAuthToken)}` : "";
  return `/api/asset?path=${encodeURIComponent(base64UrlEncode(filePath))}${tokenQuery}`;
}

function publicSessionUrl(sessionIdValue) {
  if (!httpState) throw new HttpError(503, "Canvasight daemon is not ready");
  const url = new URL(httpState.origin);
  url.searchParams.set("sessionId", sessionIdValue);
  if (daemonAuthToken) url.searchParams.set("token", daemonAuthToken);
  return url.toString();
}

function daemonSessionUrl(state, sessionIdValue) {
  const url = new URL(state.origin);
  url.searchParams.set("sessionId", sessionIdValue);
  if (state.token) url.searchParams.set("token", state.token);
  return url.toString();
}

function isScatterAssetPath(filePath) {
  return filePath.includes(`${path.sep}.scatter${path.sep}assets${path.sep}`);
}

function isTemplateAssetPath(filePath) {
  const root = `${path.resolve(canvasightTemplateAssetsDir())}${path.sep}`;
  return path.resolve(filePath).startsWith(root);
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
  const now = nowIso();
  const page = defaultScatterPage();
  return {
    version: 1,
    projectName: projectNameFromPath(projectPath),
    updatedAt: now,
    activePageId: page.id,
    pages: [page],
    viewport: page.viewport,
    nodes: page.nodes,
    edges: page.edges
  };
}

function defaultScatterPage(index = 0) {
  const now = nowIso();
  return {
    id: `page-${crypto.randomBytes(5).toString("hex")}`,
    name: `Page ${index + 1}`,
    createdAt: now,
    updatedAt: now,
    viewport: { x: 0, y: 0, zoom: 1 },
    nodes: [],
    edges: []
  };
}

function normalizeRecentLimit(value) {
  return Math.max(1, Math.min(Math.floor(toNumber(Number(value), MAX_RECENT_PROJECTS)), 50));
}

function emptyUserState() {
  return {
    version: 1,
    updatedAt: nowIso(),
    lastProjectPath: null,
    recentProjects: []
  };
}

function normalizeRecentProject(value) {
  if (!isObject(value) || typeof value.path !== "string" || !value.path.trim()) return null;
  const projectPath = path.resolve(value.path);
  return {
    name: typeof value.name === "string" && value.name.trim() ? value.name.trim() : projectNameFromPath(projectPath),
    path: projectPath,
    updatedAt: typeof value.updatedAt === "string" && value.updatedAt ? value.updatedAt : null,
    lastOpenedAt: typeof value.lastOpenedAt === "string" && value.lastOpenedAt ? value.lastOpenedAt : null
  };
}

async function readUserState() {
  try {
    const raw = await fsp.readFile(canvasightStatePath(), "utf8");
    const parsed = JSON.parse(raw);
    const recentProjects = Array.isArray(parsed?.recentProjects)
      ? parsed.recentProjects.map(normalizeRecentProject).filter(Boolean)
      : [];
    return {
      version: 1,
      updatedAt: typeof parsed?.updatedAt === "string" && parsed.updatedAt ? parsed.updatedAt : nowIso(),
      lastProjectPath:
        typeof parsed?.lastProjectPath === "string" && parsed.lastProjectPath.trim()
          ? path.resolve(parsed.lastProjectPath)
          : recentProjects[0]?.path || null,
      recentProjects
    };
  } catch (error) {
    if (error?.code === "ENOENT" || error instanceof SyntaxError) return emptyUserState();
    throw error;
  }
}

async function writeUserState(state) {
  const normalizedRecentProjects = Array.isArray(state.recentProjects)
    ? state.recentProjects.map(normalizeRecentProject).filter(Boolean).slice(0, MAX_RECENT_PROJECTS)
    : [];
  const normalizedState = {
    version: 1,
    updatedAt: nowIso(),
    lastProjectPath: normalizedRecentProjects[0]?.path || null,
    recentProjects: normalizedRecentProjects
  };
  await fsp.mkdir(canvasightHome(), { recursive: true });
  await fsp.writeFile(canvasightStatePath(), `${JSON.stringify(normalizedState, null, 2)}\n`, "utf8");
  return normalizedState;
}

function normalizeNodeTemplate(value) {
  if (!isObject(value) || typeof value.body !== "string" || !value.body.trim()) return null;
  const now = nowIso();
  const body = value.body.trim();
  return {
    id: typeof value.id === "string" && value.id ? value.id : `template-${crypto.randomBytes(8).toString("hex")}`,
    title: typeof value.title === "string" && value.title.trim() ? value.title.trim() : body.slice(0, 40),
    body,
    attachments: Array.isArray(value.attachments) ? value.attachments.map(normalizeAttachment) : [],
    createdAt: typeof value.createdAt === "string" && value.createdAt ? value.createdAt : now,
    updatedAt: typeof value.updatedAt === "string" && value.updatedAt ? value.updatedAt : now
  };
}

async function copyTemplateAttachments(attachments) {
  if (!Array.isArray(attachments) || attachments.length === 0) return [];
  await fsp.mkdir(canvasightTemplateAssetsDir(), { recursive: true });
  const copied = [];

  for (const value of attachments) {
    const attachment = normalizeAttachment(value);
    const sourcePath = typeof value?.storedPath === "string" && value.storedPath ? path.resolve(value.storedPath) : "";
    if (!sourcePath) continue;

    let bytes;
    try {
      bytes = await fsp.readFile(sourcePath);
    } catch {
      continue;
    }

    const originalName = safeFileName(attachment.originalName);
    const uniqueName = `${Date.now()}-${crypto.randomBytes(4).toString("hex")}-${originalName}`;
    const storedPath = path.join(canvasightTemplateAssetsDir(), uniqueName);
    await fsp.writeFile(storedPath, bytes);
    copied.push({
      ...attachment,
      id: crypto.randomUUID(),
      originalName,
      storedPath,
      relativePath: `template-assets/${uniqueName}`,
      fileUrl: assetUrlForPath(storedPath),
      size: bytes.length,
      createdAt: nowIso()
    });
  }

  return copied;
}

async function readNodeTemplates() {
  try {
    const raw = await fsp.readFile(canvasightTemplatesPath(), "utf8");
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalizeNodeTemplate).filter(Boolean).slice(0, MAX_NODE_TEMPLATES);
  } catch (error) {
    if (error?.code === "ENOENT" || error instanceof SyntaxError) return [];
    throw error;
  }
}

async function writeNodeTemplates(templates) {
  const normalized = Array.isArray(templates) ? templates.map(normalizeNodeTemplate).filter(Boolean).slice(0, MAX_NODE_TEMPLATES) : [];
  await fsp.mkdir(canvasightHome(), { recursive: true });
  await fsp.writeFile(canvasightTemplatesPath(), `${JSON.stringify(normalized, null, 2)}\n`, "utf8");
  return normalized;
}

async function createNodeTemplate(input) {
  const attachments = await copyTemplateAttachments(input?.attachments);
  const template = normalizeNodeTemplate({
    ...input,
    attachments,
    id: `template-${crypto.randomBytes(8).toString("hex")}`,
    createdAt: nowIso(),
    updatedAt: nowIso()
  });
  if (!template) throw new HttpError(400, "template body is required");
  const templates = [template, ...(await readNodeTemplates())].slice(0, MAX_NODE_TEMPLATES);
  await writeNodeTemplates(templates);
  return template;
}

function normalizeDaemonState(value) {
  if (!isObject(value) || typeof value.origin !== "string" || !value.origin.startsWith("http://127.0.0.1:")) return null;
  return {
    version: 1,
    pid: Number.isFinite(Number(value.pid)) ? Number(value.pid) : null,
    origin: value.origin,
    port: Number.isFinite(Number(value.port)) ? Number(value.port) : null,
    token: typeof value.token === "string" ? value.token : "",
    pluginRoot: typeof value.pluginRoot === "string" ? value.pluginRoot : "",
    serverVersion: typeof value.serverVersion === "string" ? value.serverVersion : "",
    startedAt: typeof value.startedAt === "string" ? value.startedAt : ""
  };
}

async function readDaemonState() {
  try {
    const raw = await fsp.readFile(canvasightDaemonStatePath(), "utf8");
    return normalizeDaemonState(JSON.parse(raw));
  } catch (error) {
    if (error?.code === "ENOENT" || error instanceof SyntaxError) return null;
    throw error;
  }
}

async function writeDaemonState(state) {
  const normalized = normalizeDaemonState(state);
  if (!normalized) throw new Error("Invalid Canvasight daemon state");
  await fsp.mkdir(canvasightHome(), { recursive: true });
  await fsp.writeFile(canvasightDaemonStatePath(), `${JSON.stringify(normalized, null, 2)}\n`, "utf8");
  return normalized;
}

async function removeDaemonState() {
  await fsp.rm(canvasightDaemonStatePath(), { force: true });
}

function daemonHeaders(state, headers = {}) {
  return {
    ...(state?.token ? { "x-canvasight-token": state.token } : {}),
    ...headers
  };
}

async function daemonJson(state, route, init = {}) {
  const url = new URL(route, state.origin);
  const response = await fetch(url, {
    ...init,
    headers: daemonHeaders(state, {
      ...(init.body ? { "content-type": "application/json" } : {}),
      ...(init.headers || {})
    })
  });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(text || `Canvasight daemon request failed: ${response.status}`);
  }
  return text ? JSON.parse(text) : null;
}

async function healthyDaemonState(state) {
  if (!state) return null;
  try {
    const health = await daemonJson({ ...state, token: "" }, "/api/health");
    if (health?.status !== "ok") return null;
    if (health.pluginRoot !== pluginRoot || health.serverVersion !== SERVER_VERSION) return null;
    return {
      ...state,
      origin: health.origin || state.origin,
      port: health.port || state.port,
      pid: health.pid || state.pid
    };
  } catch {
    return null;
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForReachableUrl(url, label = "Canvasight URL") {
  const deadline = Date.now() + 5000;
  let lastError = null;

  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      await response.arrayBuffer();
      if (response.ok) return;
      lastError = new Error(`${label} returned ${response.status}`);
    } catch (error) {
      lastError = error;
    }
    await sleep(100);
  }

  throw new Error(`${label} was not reachable: ${lastError?.message || "unknown error"}`);
}

async function waitForDaemon(token) {
  const deadline = Date.now() + 8000;
  while (Date.now() < deadline) {
    const state = await readDaemonState();
    if (state && (!token || state.token === token)) {
      const healthy = await healthyDaemonState(state);
      if (healthy) return healthy;
    }
    await sleep(120);
  }
  throw new Error("Canvasight daemon did not start in time");
}

async function ensureDaemonServer() {
  const existing = await healthyDaemonState(await readDaemonState());
  if (existing) return existing;

  const token = crypto.randomBytes(24).toString("base64url");
  const child = spawn(process.execPath, [__filename, "--daemon"], {
    cwd: pluginRoot,
    detached: true,
    stdio: "ignore",
    env: {
      ...process.env,
      CANVASIGHT_DAEMON_TOKEN: token
    }
  });
  child.unref();
  return waitForDaemon(token);
}

async function stopDaemonFromState() {
  const state = await readDaemonState();
  if (!state) return false;
  const healthy = await healthyDaemonState(state);
  if (!healthy?.pid) {
    await removeDaemonState();
    return false;
  }
  try {
    process.kill(healthy.pid, "SIGTERM");
  } catch {
    await removeDaemonState();
    return false;
  }
  return true;
}

async function rememberProject(projectPath, project) {
  if (typeof projectPath !== "string" || !projectPath.trim()) return null;
  const resolvedProjectPath = path.resolve(projectPath);
  const state = await readUserState();
  const now = nowIso();
  const entry = {
    name:
      typeof project?.name === "string" && project.name.trim()
        ? project.name.trim()
        : typeof project?.projectName === "string" && project.projectName.trim()
          ? project.projectName.trim()
          : projectNameFromPath(resolvedProjectPath),
    path: resolvedProjectPath,
    updatedAt: typeof project?.updatedAt === "string" && project.updatedAt ? project.updatedAt : now,
    lastOpenedAt: now
  };
  const rest = state.recentProjects.filter((item) => item.path !== resolvedProjectPath);
  await writeUserState({
    ...state,
    recentProjects: [entry, ...rest]
  });
  return entry;
}

async function rememberProjectBestEffort(projectPath, project) {
  try {
    return await rememberProject(projectPath, project);
  } catch {
    return null;
  }
}

async function recentProjects(limit) {
  const state = await readUserState();
  return state.recentProjects.slice(0, normalizeRecentLimit(limit)).map((project) => ({
    ...project,
    exists: fs.existsSync(project.path),
    hasScatter: fs.existsSync(scatterPath(project.path))
  }));
}

function normalizeAttachment(value) {
  const source = ["upload", "drop", "paste", "clipboard"].includes(value?.source) ? value.source : "upload";
  const storedPath = typeof value?.storedPath === "string" ? value.storedPath : "";
  return {
    id: typeof value?.id === "string" && value.id ? value.id : crypto.randomUUID(),
    kind: value?.kind === "image" ? "image" : "file",
    source,
    originalName: typeof value?.originalName === "string" ? value.originalName : "attachment",
    storedPath,
    relativePath: typeof value?.relativePath === "string" ? value.relativePath : "",
    fileUrl: storedPath ? assetUrlForPath(storedPath) : typeof value?.fileUrl === "string" ? value.fileUrl : "",
    mime: typeof value?.mime === "string" ? value.mime : "application/octet-stream",
    size: toNumber(value?.size, 0),
    createdAt: typeof value?.createdAt === "string" ? value.createdAt : nowIso()
  };
}

function normalizeScatterNode(value, index) {
  const node = isObject(value) ? value : {};
  const data = isObject(node.data) ? node.data : {};
  const codexMode = normalizeCodexMode(data.codexMode, Boolean(data.planMode));
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
      codexMode,
      effort: normalizeEffort(data.effort),
      planMode: codexMode === "plan",
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

function normalizeScatterViewport(value) {
  const viewport = isObject(value) ? value : {};
  return {
    x: toNumber(viewport.x, 0),
    y: toNumber(viewport.y, 0),
    zoom: toNumber(viewport.zoom, 1)
  };
}

function normalizeScatterPage(value, index, fallback) {
  const page = isObject(value) ? value : {};
  const now = nowIso();
  return {
    ...page,
    id: typeof page.id === "string" && page.id ? page.id : `page-${index + 1}`,
    name: typeof page.name === "string" && page.name.trim() ? page.name.trim() : `Page ${index + 1}`,
    createdAt: typeof page.createdAt === "string" && page.createdAt ? page.createdAt : now,
    updatedAt: typeof page.updatedAt === "string" && page.updatedAt ? page.updatedAt : typeof fallback?.updatedAt === "string" ? fallback.updatedAt : now,
    viewport: normalizeScatterViewport(page.viewport || fallback?.viewport),
    nodes: Array.isArray(page.nodes)
      ? page.nodes.map(normalizeScatterNode)
      : Array.isArray(fallback?.nodes)
        ? fallback.nodes.map(normalizeScatterNode)
        : [],
    edges: Array.isArray(page.edges)
      ? page.edges.map(normalizeScatterEdge)
      : Array.isArray(fallback?.edges)
        ? fallback.edges.map(normalizeScatterEdge)
        : []
  };
}

function normalizeScatterDocument(value, projectPath) {
  if (!isObject(value)) {
    throw new HttpError(400, "document must be an object");
  }
  if (value.version !== 1) {
    throw new HttpError(400, "Only .scatter/scatter.json version 1 is supported");
  }

  const legacyFallback = {
    updatedAt: value.updatedAt,
    viewport: value.viewport,
    nodes: value.nodes,
    edges: value.edges
  };
  const rawPages = Array.isArray(value.pages) && value.pages.length > 0 ? value.pages : [legacyFallback];
  const pages = rawPages.map((page, index) => normalizeScatterPage(page, index, index === 0 ? legacyFallback : undefined));
  const activePageId =
    typeof value.activePageId === "string" && pages.some((page) => page.id === value.activePageId) ? value.activePageId : pages[0].id;
  const activePage = pages.find((page) => page.id === activePageId) || pages[0];

  return {
    ...value,
    version: 1,
    projectName: typeof value.projectName === "string" && value.projectName ? value.projectName : projectNameFromPath(projectPath),
    updatedAt: typeof value.updatedAt === "string" && value.updatedAt ? value.updatedAt : nowIso(),
    activePageId,
    pages,
    viewport: activePage.viewport,
    nodes: activePage.nodes,
    edges: activePage.edges
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

function coerceNumber(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function optionalDimension(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : null;
}

function generatedGraphId(prefix, index, usedIds) {
  let id = `${prefix}-${index + 1}`;
  let suffix = 2;
  while (usedIds.has(id)) {
    id = `${prefix}-${index + 1}-${suffix}`;
    suffix += 1;
  }
  return id;
}

function normalizeGraphNodePosition(node, index, layout) {
  const column = layout === "vertical" ? 0 : layout === "grid" ? index % 3 : index;
  const row = layout === "horizontal" ? 0 : layout === "grid" ? Math.floor(index / 3) : index;
  const fallback = {
    x: column * 460,
    y: row * 260
  };
  const position = isObject(node.position) ? node.position : {};
  return {
    x: coerceNumber(position.x ?? node.x, fallback.x),
    y: coerceNumber(position.y ?? node.y, fallback.y)
  };
}

function normalizeGraphNode(value, index, layout, usedNodeIds) {
  if (!isObject(value)) throw new HttpError(400, `nodes[${index}] must be an object`);
  const explicitId = typeof value.id === "string" && value.id.trim() ? value.id.trim() : "";
  const id = explicitId || generatedGraphId("node", index, usedNodeIds);
  if (usedNodeIds.has(id)) throw new HttpError(400, `Duplicate node id: ${id}`);
  usedNodeIds.add(id);

  const data = isObject(value.data) ? value.data : {};
  const codexMode = normalizeCodexMode(value.codexMode || data.codexMode, Boolean(value.planMode ?? data.planMode));
  const width = optionalDimension(value.width);
  const height = optionalDimension(value.height);
  return {
    id,
    type: "task",
    position: normalizeGraphNodePosition(value, index, layout),
    ...(width ? { width } : {}),
    ...(height ? { height } : {}),
    data: {
      ...data,
      title: typeof value.title === "string" ? value.title : typeof data.title === "string" ? data.title : "",
      body: typeof value.body === "string" ? value.body : typeof data.body === "string" ? data.body : "",
      attachments: Array.isArray(value.attachments)
        ? value.attachments.map(normalizeAttachment)
        : Array.isArray(data.attachments)
          ? data.attachments.map(normalizeAttachment)
          : [],
      codexMode,
      effort: normalizeEffort(value.effort || data.effort),
      planMode: codexMode === "plan",
      runMode: normalizeRunMode(value.runMode || data.runMode)
    }
  };
}

function normalizeGraphEdge(value, index, nodeIds, usedEdgeIds, usedTargetIds, usedConnectionPairs) {
  if (!isObject(value)) throw new HttpError(400, `edges[${index}] must be an object`);
  const source = typeof value.source === "string" ? value.source.trim() : "";
  const target = typeof value.target === "string" ? value.target.trim() : "";
  if (!source || !nodeIds.has(source)) throw new HttpError(400, `edges[${index}].source must reference an existing node id`);
  if (!target || !nodeIds.has(target)) throw new HttpError(400, `edges[${index}].target must reference an existing node id`);
  if (source === target) throw new HttpError(400, `edges[${index}] cannot connect a node to itself`);
  const connectionPair = `${source}\u0000${target}`;
  if (usedConnectionPairs.has(connectionPair)) throw new HttpError(400, `Duplicate edge connection: ${source} -> ${target}`);
  if (usedTargetIds.has(target)) throw new HttpError(400, `Node already has a parent edge: ${target}`);
  const id = typeof value.id === "string" && value.id.trim() ? value.id.trim() : generatedGraphId("edge", index, usedEdgeIds);
  if (usedEdgeIds.has(id)) throw new HttpError(400, `Duplicate edge id: ${id}`);
  usedEdgeIds.add(id);
  usedTargetIds.add(target);
  usedConnectionPairs.add(connectionPair);
  return {
    id,
    source,
    target,
    ...(typeof value.label === "string" && value.label.trim() ? { label: value.label.trim() } : {})
  };
}

function graphPageInputs(args) {
  if (Array.isArray(args?.pages) && args.pages.length > 0) return args.pages;
  return [
    {
      id: args?.pageId,
      name: args?.pageName,
      viewport: args?.viewport,
      layout: args?.layout,
      nodes: args?.nodes,
      edges: args?.edges
    }
  ];
}

function buildScatterPageFromGraph(value, index, args) {
  const page = isObject(value) ? value : {};
  const now = nowIso();
  const layout = normalizeGraphLayout(page.layout || args?.layout);
  const rawNodes = Array.isArray(page.nodes) ? page.nodes : [];
  if (rawNodes.length === 0) throw new HttpError(400, `pages[${index}].nodes must contain at least one node`);
  const usedNodeIds = new Set();
  const nodes = rawNodes.map((node, nodeIndex) => normalizeGraphNode(node, nodeIndex, layout, usedNodeIds));
  const nodeIds = new Set(nodes.map((node) => node.id));
  const usedEdgeIds = new Set();
  const usedTargetIds = new Set();
  const usedConnectionPairs = new Set();
  const edges = Array.isArray(page.edges)
    ? page.edges.map((edge, edgeIndex) => normalizeGraphEdge(edge, edgeIndex, nodeIds, usedEdgeIds, usedTargetIds, usedConnectionPairs))
    : [];
  return {
    id: typeof page.id === "string" && page.id.trim() ? page.id.trim() : `page-${crypto.randomBytes(5).toString("hex")}`,
    name:
      typeof page.name === "string" && page.name.trim()
        ? page.name.trim()
        : typeof args?.pageName === "string" && args.pageName.trim()
          ? args.pageName.trim()
          : `AI Canvas ${index + 1}`,
    createdAt: typeof page.createdAt === "string" && page.createdAt ? page.createdAt : now,
    updatedAt: now,
    viewport: normalizeScatterViewport(page.viewport || args?.viewport),
    nodes,
    edges
  };
}

function replaceActivePage(existingDocument, incomingPage) {
  const pages = existingDocument.pages.length ? existingDocument.pages : [defaultScatterPage()];
  const activePageId = existingDocument.activePageId && pages.some((page) => page.id === existingDocument.activePageId) ? existingDocument.activePageId : pages[0].id;
  return pages.map((page) =>
    page.id === activePageId
      ? {
          ...incomingPage,
          id: activePageId,
          name: incomingPage.name || page.name,
          createdAt: page.createdAt || incomingPage.createdAt
        }
      : page
  );
}

async function writeScatterGraph(projectPath, args) {
  const mode = normalizeGraphWriteMode(args?.mode);
  const existingDocument = await readScatterDocument(projectPath);
  const incomingPages = graphPageInputs(args).map((page, index) => buildScatterPageFromGraph(page, index, args));
  const now = nowIso();
  let pages;
  let activePageId;

  if (mode === "replace-document") {
    pages = incomingPages;
    activePageId =
      typeof args?.activePageId === "string" && incomingPages.some((page) => page.id === args.activePageId)
        ? args.activePageId
        : incomingPages[0].id;
  } else if (mode === "replace-active-page") {
    pages = replaceActivePage(existingDocument, incomingPages[0]);
    activePageId = existingDocument.activePageId && pages.some((page) => page.id === existingDocument.activePageId) ? existingDocument.activePageId : pages[0].id;
  } else {
    pages = [...existingDocument.pages, ...incomingPages];
    activePageId = incomingPages[incomingPages.length - 1].id;
  }

  const activePage = pages.find((page) => page.id === activePageId) || pages[0];
  const document = await writeScatterDocument(projectPath, {
    version: 1,
    projectName:
      typeof args?.projectName === "string" && args.projectName.trim()
        ? args.projectName.trim()
        : existingDocument.projectName || projectNameFromPath(projectPath),
    updatedAt: now,
    activePageId: activePage.id,
    pages: pages.map((page) => ({
      ...page,
      updatedAt: page.id === activePage.id ? now : page.updatedAt
    })),
    viewport: activePage.viewport,
    nodes: activePage.nodes,
    edges: activePage.edges
  });

  await rememberProjectBestEffort(projectPath, {
    name: document.projectName,
    updatedAt: document.updatedAt
  });

  return document;
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

function createSession({ projectPath, language, threadId }) {
  const id = sessionId();
  const resolvedProjectPath = optionalProjectPath(projectPath) || defaultProjectPath();
  const session = {
    id,
    projectPath: resolvedProjectPath,
    language: normalizeLanguage(language),
    codexThreadId: optionalThreadId(threadId) || optionalThreadId(process.env.CODEX_THREAD_ID),
    createdAt: nowIso(),
    runQueue: [],
    waiters: []
  };
  sessions.set(id, session);
  return session;
}

function sessionInfo(session) {
  return {
    codexThreadId: session.codexThreadId,
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
  const codexMode = normalizeCodexMode(payload.codexMode, Boolean(payload.planMode));
  return {
    status: "received",
    sessionId: session.id,
    threadName: typeof payload.threadName === "string" ? payload.threadName : "Canvasight Run",
    projectPath,
    markdown: typeof payload.markdown === "string" ? payload.markdown : "",
    imagePaths: Array.isArray(payload.imagePaths) ? payload.imagePaths.filter((item) => typeof item === "string") : [],
    codexMode,
    codexNative: {
      status: "pending",
      threadId: null,
      mode: codexMode
    },
    effort: normalizeEffort(payload.effort),
    planMode: codexMode === "plan",
    runMode: normalizeRunMode(payload.runMode),
    nodeIds: Array.isArray(payload.nodeIds) ? payload.nodeIds.filter((item) => typeof item === "string") : [],
    attachments: Array.isArray(payload.attachments) ? payload.attachments.map(normalizeAttachment) : []
  };
}

function completeWaiter(waiter, payload) {
  clearTimeout(waiter.timer);
  if (waiter.abortSignal && waiter.abortHandler) {
    waiter.abortSignal.removeEventListener("abort", waiter.abortHandler);
  }
  waiter.resolve(payload);
}

function waiterMatches(waiter, session, payload) {
  if (waiter.sessionId && waiter.sessionId !== session.id) return false;
  if (waiter.projectPath && path.resolve(waiter.projectPath) !== path.resolve(payload.projectPath || session.projectPath)) return false;
  return true;
}

function detachWaiter(waiter) {
  clearTimeout(waiter.timer);
  if (waiter.abortSignal && waiter.abortHandler) {
    waiter.abortSignal.removeEventListener("abort", waiter.abortHandler);
  }
  if (waiter.sessionId) {
    const session = sessions.get(waiter.sessionId);
    if (session) {
      const index = session.waiters.indexOf(waiter);
      if (index >= 0) session.waiters.splice(index, 1);
    }
    return;
  }
  const index = globalRunWaiters.indexOf(waiter);
  if (index >= 0) globalRunWaiters.splice(index, 1);
}

function closedRunPayload(sessionIdValue, projectPath = null, threadId = null) {
  return {
    status: "closed",
    sessionId: sessionIdValue || "",
    threadName: "",
    projectPath,
    markdown: "",
    imagePaths: [],
    codexMode: "chat",
    codexNative: {
      status: "not_applicable",
      threadId,
      mode: "chat"
    },
    effort: "xhigh",
    planMode: false,
    runMode: "flow",
    nodeIds: [],
    attachments: []
  };
}

function timeoutRunPayload(sessionIdValue, projectPath = null, threadId = null) {
  return {
    status: "timeout",
    sessionId: sessionIdValue || "",
    threadName: "",
    projectPath,
    markdown: "",
    imagePaths: [],
    codexMode: "chat",
    codexNative: {
      status: "not_applicable",
      threadId,
      mode: "chat"
    },
    effort: "xhigh",
    planMode: false,
    runMode: "flow",
    nodeIds: [],
    attachments: []
  };
}

async function enqueueRun(session, payload) {
  const normalized = normalizeRunPayload(session, payload);
  const waiter = session.waiters.shift() || globalRunWaiters.find((candidate) => waiterMatches(candidate, session, normalized));
  if (waiter) {
    detachWaiter(waiter);
    completeWaiter(waiter, normalized);
  } else {
    session.runQueue.push(normalized);
  }
  return normalized;
}

function takeQueuedRun(sessionIdValue, projectPath) {
  if (sessionIdValue) {
    const session = sessions.get(sessionIdValue);
    if (!session) return null;
    if (projectPath) {
      const index = session.runQueue.findIndex((run) => path.resolve(run.projectPath || session.projectPath) === path.resolve(projectPath));
      return index >= 0 ? session.runQueue.splice(index, 1)[0] : null;
    }
    return session.runQueue.shift() || null;
  }

  const resolvedProjectPath = optionalProjectPath(projectPath);
  for (const session of sessions.values()) {
    const index = session.runQueue.findIndex((run) => {
      if (!resolvedProjectPath) return true;
      return path.resolve(run.projectPath || session.projectPath) === resolvedProjectPath;
    });
    if (index >= 0) return session.runQueue.splice(index, 1)[0];
  }
  return null;
}

function waitForRun(sessionIdValue, timeoutMs, options = {}) {
  const timeout = Math.max(1, Math.min(toNumber(timeoutMs, 60000), 300000));
  const projectPath = optionalProjectPath(options.projectPath);
  const session = sessions.get(sessionIdValue);
  if (sessionIdValue && !session) {
    return Promise.resolve(closedRunPayload(sessionIdValue, projectPath));
  }
  const queued = takeQueuedRun(sessionIdValue || null, projectPath);
  if (queued) return Promise.resolve(queued);

  return new Promise((resolve) => {
    const waiter = {
      sessionId: sessionIdValue || null,
      projectPath,
      resolve,
      timer: setTimeout(() => {
        detachWaiter(waiter);
        resolve(timeoutRunPayload(sessionIdValue, projectPath));
      }, timeout)
    };

    if (options.abortSignal) {
      waiter.abortSignal = options.abortSignal;
      waiter.abortHandler = () => {
        detachWaiter(waiter);
        resolve(closedRunPayload(sessionIdValue, projectPath));
      };
      options.abortSignal.addEventListener("abort", waiter.abortHandler, { once: true });
    }

    if (sessionIdValue) {
      session.waiters.push(waiter);
    } else {
      globalRunWaiters.push(waiter);
    }
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
      codexMode: "chat",
      codexNative: {
        status: "not_applicable",
        threadId: session.codexThreadId,
        mode: "chat"
      },
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

function requestAuthToken(req, url) {
  const header = req.headers["x-canvasight-token"];
  if (typeof header === "string" && header) return header;
  if (Array.isArray(header) && header[0]) return header[0];
  return url.searchParams.get("token") || "";
}

function assertDaemonAuthorized(req, url) {
  if (!daemonAuthToken) return;
  if (requestAuthToken(req, url) !== daemonAuthToken) {
    throw new HttpError(401, "Unauthorized Canvasight daemon request");
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
      fileUrl: assetUrlForPath(storedPath),
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

function appServerRequest(method, params, { experimentalApi = false } = {}) {
  const bin = codexAppBin();
  const timeoutMs = nativeCodexTimeoutMs();

  return new Promise((resolve, reject) => {
    const child = spawn(bin, ["app-server", "--stdio"], {
      stdio: ["pipe", "pipe", "pipe"]
    });
    let stdout = "";
    let stderr = "";
    let settled = false;
    let initialized = false;

    const timer = setTimeout(() => {
      finish(new Error(`Codex app-server request timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    function finish(error, value) {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      child.kill("SIGTERM");
      if (error) {
        reject(error);
      } else {
        resolve(value);
      }
    }

    function send(message) {
      child.stdin.write(`${JSON.stringify(message)}\n`);
    }

    function handleMessage(message) {
      if (!isObject(message) || !Object.prototype.hasOwnProperty.call(message, "id")) return;
      if (message.id === 1) {
        if (message.error) {
          finish(new Error(message.error.message || "Codex app-server initialize failed"));
          return;
        }
        initialized = true;
        send({
          jsonrpc: "2.0",
          id: 2,
          method,
          params
        });
        return;
      }
      if (message.id === 2) {
        if (message.error) {
          finish(new Error(message.error.message || `Codex app-server ${method} failed`));
        } else {
          finish(null, message.result || {});
        }
      }
    }

    function parseStdout() {
      while (stdout.includes("\n")) {
        const newline = stdout.indexOf("\n");
        const line = stdout.slice(0, newline).trim();
        stdout = stdout.slice(newline + 1);
        if (!line) continue;
        try {
          handleMessage(JSON.parse(line));
        } catch (error) {
          finish(error);
        }
      }
    }

    child.stdout.setEncoding("utf8");
    child.stdout.on("data", (chunk) => {
      stdout += chunk;
      parseStdout();
    });
    child.stderr.setEncoding("utf8");
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });
    child.once("error", finish);
    child.once("exit", (code, signal) => {
      if (!settled && initialized) finish(new Error(`Codex app-server exited early: code=${code} signal=${signal} stderr=${stderr}`));
    });

    send({
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: {
        clientInfo: {
          name: "canvasight",
          version: SERVER_VERSION
        },
        capabilities: {
          ...(experimentalApi ? { experimentalApi: true } : {})
        }
      }
    });
  });
}

function codexCollaborationMode(mode) {
  return {
    mode,
    settings: {
      model: null,
      reasoning_effort: mode === "plan" ? "medium" : null,
      developer_instructions: null
    }
  };
}

function goalObjectiveFromRun(payload) {
  const heading = payload.threadName || "Canvasight Goal";
  const projectLine = payload.projectPath ? `Project path: ${payload.projectPath}` : "";
  const markdown = typeof payload.markdown === "string" ? payload.markdown.trim() : "";
  return [heading, projectLine, markdown].filter(Boolean).join("\n\n").slice(0, 12000);
}

async function setCodexCollaborationMode(threadId, mode) {
  return appServerRequest(
    "thread/settings/update",
    {
      threadId,
      collaborationMode: codexCollaborationMode(mode)
    },
    { experimentalApi: true }
  );
}

async function setCodexGoal(threadId, payload) {
  return appServerRequest(
    "thread/goal/set",
    {
      threadId,
      objective: goalObjectiveFromRun(payload),
      status: "active",
      tokenBudget: null
    },
    { experimentalApi: false }
  );
}

async function applyCodexNativeMode(session, payload) {
  if (!nativeCodexEnabled()) {
    return {
      status: "disabled",
      threadId: session.codexThreadId,
      mode: payload.codexMode
    };
  }

  if (!session.codexThreadId) {
    return {
      status: "skipped",
      reason: "missing CODEX_THREAD_ID",
      threadId: null,
      mode: payload.codexMode
    };
  }

  try {
    if (payload.codexMode === "goal") {
      await setCodexGoal(session.codexThreadId, payload);
      await setCodexCollaborationMode(session.codexThreadId, "default");
      return {
        status: "applied",
        action: "thread/goal/set",
        threadId: session.codexThreadId,
        mode: payload.codexMode
      };
    }

    const collaborationMode = payload.codexMode === "plan" ? "plan" : "default";
    await setCodexCollaborationMode(session.codexThreadId, collaborationMode);
    return {
      status: "applied",
      action: "thread/settings/update",
      threadId: session.codexThreadId,
      mode: payload.codexMode,
      collaborationMode
    };
  } catch (error) {
    return {
      status: "failed",
      error: error?.message || "Codex native mode request failed",
      threadId: session.codexThreadId,
      mode: payload.codexMode
    };
  }
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
  if (!isScatterAssetPath(assetPath) && !isTemplateAssetPath(assetPath)) throw new HttpError(403, "Forbidden");
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
    const openedProject = await openProject(projectPath);
    await rememberProjectBestEffort(projectPath, openedProject.project);
    sendJson(res, 200, openedProject);
    return true;
  }

  if (action === "document") {
    assertMethod(req, "POST");
    const body = await readJsonBody(req);
    const projectPath = normalizeProjectPath(body.projectPath || session.projectPath);
    const document = await writeScatterDocument(projectPath, body.document);
    session.projectPath = projectPath;
    await rememberProjectBestEffort(projectPath, {
      name: document.projectName,
      updatedAt: document.updatedAt
    });
    sendJson(res, 200, document);
    return true;
  }

  if (action === "attachments") {
    assertMethod(req, "POST");
    const body = await readJsonBody(req);
    const projectPath = normalizeProjectPath(body.projectPath || session.projectPath);
    const attachments = await saveAttachments(projectPath, body.files);
    session.projectPath = projectPath;
    await rememberProjectBestEffort(projectPath);
    sendJson(res, 200, attachments);
    return true;
  }

  if (action === "run") {
    assertMethod(req, "POST");
    const body = await readJsonBody(req);
    await enqueueRun(session, body);
    sendJson(res, 200, { status: "queued" });
    return true;
  }

  if (action === "close") {
    assertMethod(req, "POST");
    const existed = closeSession(session.id);
    sendJson(res, 200, {
      status: "closed",
      sessionId: session.id,
      existed
    });
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

    if (url.pathname === "/api/health") {
      assertMethod(req, "GET");
      sendJson(res, 200, {
        status: "ok",
        name: SERVER_NAME,
        serverVersion: SERVER_VERSION,
        pluginRoot,
        pid: process.pid,
        origin: httpState?.origin || null,
        port: httpState?.port || null,
        startedAt: daemonStartedAt
      });
      return;
    }

    if (url.pathname === "/api/reveal") {
      assertDaemonAuthorized(req, url);
      assertMethod(req, "POST");
      const body = await readJsonBody(req);
      revealPath(body.targetPath);
      sendJson(res, 200, {});
      return;
    }

    if (url.pathname === "/api/asset") {
      assertDaemonAuthorized(req, url);
      await serveAsset(req, res, url);
      return;
    }

    if (url.pathname === "/api/templates") {
      assertDaemonAuthorized(req, url);
      if (req.method === "GET") {
        sendJson(res, 200, await readNodeTemplates());
        return;
      }
      if (req.method === "POST") {
        const body = await readJsonBody(req);
        const template = await createNodeTemplate(isObject(body.template) ? body.template : body);
        sendJson(res, 200, template);
        return;
      }
      throw new HttpError(405, "Expected GET or POST");
    }

    if (url.pathname === "/api/sessions") {
      assertDaemonAuthorized(req, url);
      assertMethod(req, "POST");
      const body = await readJsonBody(req);
      const session = createSession({
        projectPath: typeof body?.projectPath === "string" && body.projectPath ? body.projectPath : null,
        language: body?.language,
        threadId: body?.threadId
      });
      const openedProject = await openProject(session.projectPath);
      await rememberProjectBestEffort(session.projectPath, openedProject.project);
      sendJson(res, 200, {
        session: sessionInfo(session),
        project: openedProject.project,
        document: openedProject.document
      });
      return;
    }

    if (url.pathname === "/api/runs/await") {
      assertDaemonAuthorized(req, url);
      assertMethod(req, "POST");
      const body = await readJsonBody(req);
      const abortController = new AbortController();
      const abort = () => {
        if (!res.writableEnded) abortController.abort();
      };
      res.on("close", abort);
      const run = await waitForRun(
        typeof body?.sessionId === "string" && body.sessionId ? body.sessionId : "",
        body?.timeoutMs,
        {
          projectPath: body?.projectPath,
          abortSignal: abortController.signal
        }
      );
      res.off("close", abort);
      if (res.destroyed) return;
      sendJson(res, 200, run);
      return;
    }

    if (url.pathname === "/api/daemon/stop") {
      assertDaemonAuthorized(req, url);
      assertMethod(req, "POST");
      sendJson(res, 200, { status: "stopping", pid: process.pid });
      setTimeout(() => {
        void shutdownDaemon().finally(() => process.exit(0));
      }, 20);
      return;
    }

    if (url.pathname.startsWith("/api/sessions/")) {
      assertDaemonAuthorized(req, url);
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
  if (isDaemonMode) {
    await writeDaemonState({
      version: 1,
      pid: process.pid,
      origin: httpState.origin,
      port,
      token: daemonAuthToken,
      pluginRoot,
      serverVersion: SERVER_VERSION,
      startedAt: daemonStartedAt
    });
  }
  return httpState;
}

async function shutdownDaemon() {
  for (const id of Array.from(sessions.keys())) closeSession(id);
  while (globalRunWaiters.length) {
    const waiter = globalRunWaiters.shift();
    completeWaiter(waiter, closedRunPayload(waiter.sessionId, waiter.projectPath));
  }
  if (httpState) {
    await new Promise((resolve) => httpState.server.close(resolve));
    httpState = null;
  }
  if (isDaemonMode) await removeDaemonState();
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
  const daemon = await ensureDaemonServer();
  const opened = await daemonJson(daemon, "/api/sessions", {
    method: "POST",
    body: JSON.stringify({
      projectPath: typeof args?.projectPath === "string" && args.projectPath ? args.projectPath : null,
      language: args?.language,
      threadId: args?.threadId || process.env.CODEX_THREAD_ID || null
    })
  });
  const session = opened.session;
  const url = daemonSessionUrl(daemon, session.sessionId);
  await waitForReachableUrl(url, "Canvasight browser session");
  openBrowser(url);
  return toolResult(
    {
      status: "opened",
      sessionId: session.sessionId,
      url,
      browserUrl: url,
      origin: daemon.origin,
      projectPath: session.projectPath,
      codexThreadId: session.codexThreadId,
      project: opened.project,
      language: session.language
    },
    `Canvasight session opened. Navigate the in-app browser to this full URL: ${url}`
  );
}

async function toolListCanvasightRecentProjects(args) {
  const projects = await recentProjects(args?.limit);
  return toolResult(
    {
      status: "listed",
      count: projects.length,
      statePath: canvasightStatePath(),
      projects
    },
    projects.length
      ? projects.map((project, index) => `${index + 1}. ${project.name} — ${project.path}`).join("\n")
      : "No recent Canvasight projects."
  );
}

async function toolOpenCanvasightRecentProject(args) {
  const explicitProjectPath = optionalProjectPath(args?.projectPath);
  const index = Math.max(1, Math.floor(toNumber(Number(args?.index), 1)));
  const projects = explicitProjectPath ? [] : await recentProjects(Math.max(index, MAX_RECENT_PROJECTS));
  const projectPath = explicitProjectPath || projects[index - 1]?.path;

  if (!projectPath) {
    throw new Error("No recent Canvasight project is available. Call open_canvasight with a projectPath first.");
  }

  return toolOpenCanvasight({
    projectPath,
    language: args?.language,
    threadId: args?.threadId
  });
}

async function toolWriteCanvasightGraph(args) {
  const projectPath = normalizeProjectPath(args?.projectPath || defaultProjectPath());
  const document = await writeScatterGraph(projectPath, args || {});
  const activePage = document.pages.find((page) => page.id === document.activePageId) || document.pages[0];
  const nodeIds = activePage.nodes.map((node) => node.id);
  const edgeIds = activePage.edges.map((edge) => edge.id);
  const summary = [
    `Canvasight graph written: ${scatterPath(projectPath)}`,
    `Active page: ${activePage.name} (${activePage.id})`,
    `Nodes: ${nodeIds.length}`,
    `Edges: ${edgeIds.length}`
  ].join("\n");

  return toolResult(
    {
      status: "written",
      projectPath,
      scatterPath: scatterPath(projectPath),
      mode: normalizeGraphWriteMode(args?.mode),
      activePageId: activePage.id,
      activePageName: activePage.name,
      nodeIds,
      edgeIds,
      document
    },
    summary
  );
}

async function toolAwaitCanvasightRun(args) {
  const sessionIdValue = typeof args?.sessionId === "string" && args.sessionId ? args.sessionId : "";
  let projectPathValue = optionalProjectPath(args?.projectPath);
  if (!sessionIdValue && !projectPathValue) {
    projectPathValue = (await recentProjects(1))[0]?.path || defaultProjectPath();
  }
  const daemon = await ensureDaemonServer();
  const run = await daemonJson(daemon, "/api/runs/await", {
    method: "POST",
    body: JSON.stringify({
      sessionId: sessionIdValue,
      timeoutMs: args.timeoutMs,
      projectPath: projectPathValue
    })
  });
  if (run.status === "received") {
    run.codexNative = await applyCodexNativeMode(
      {
        codexThreadId: optionalThreadId(args.threadId) || optionalThreadId(process.env.CODEX_THREAD_ID)
      },
      run
    );
  }
  const text = run.status === "received" ? run.markdown : `Canvasight run status: ${run.status}`;
  return toolResult(run, text);
}

async function toolCloseCanvasight(args) {
  if (typeof args?.sessionId !== "string" || !args.sessionId) {
    throw new Error("sessionId is required");
  }
  const daemon = await ensureDaemonServer();
  const closed = await daemonJson(daemon, `/api/sessions/${encodeURIComponent(args.sessionId)}/close`, {
    method: "POST",
    body: JSON.stringify({})
  }).catch((error) => {
    if (String(error?.message || "").includes("Session not found")) {
      return {
        status: "closed",
        sessionId: args.sessionId,
        existed: false
      };
    }
    throw error;
  });
  return toolResult(
    {
      status: "closed",
      sessionId: args.sessionId,
      existed: Boolean(closed.existed)
    },
    closed.existed ? `Canvasight session closed: ${args.sessionId}` : `Canvasight session already closed: ${args.sessionId}`
  );
}

const tools = [
  {
    name: "open_canvasight",
    description: "Open a Canvasight browser session and start or reuse the project-level local daemon.",
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
        },
        threadId: {
          type: "string",
          description: "Optional Codex thread id for native Plan/Goal integration. Defaults to CODEX_THREAD_ID when available."
        }
      },
      additionalProperties: false
    }
  },
  {
    name: "list_canvasight_recent_projects",
    description: "List Canvasight projects remembered across Codex threads.",
    inputSchema: {
      type: "object",
      properties: {
        limit: {
          type: "number",
          minimum: 1,
          maximum: 50,
          description: "Maximum number of recent projects to return."
        }
      },
      additionalProperties: false
    }
  },
  {
    name: "open_canvasight_recent_project",
    description: "Open the most recent remembered Canvasight project, or a chosen recent project path/index.",
    inputSchema: {
      type: "object",
      properties: {
        index: {
          type: "number",
          minimum: 1,
          description: "1-based recent project index. Defaults to the most recent project."
        },
        projectPath: {
          type: "string",
          description: "Optional explicit project path. When provided, it is opened and remembered."
        },
        language: {
          type: "string",
          enum: ["zh", "en"],
          description: "Optional UI and markdown language preference."
        },
        threadId: {
          type: "string",
          description: "Optional Codex thread id for native Plan/Goal integration. Defaults to CODEX_THREAD_ID when available."
        }
      },
      additionalProperties: false
    }
  },
  {
    name: "write_canvasight_graph",
    description:
      "Write pages, task nodes, and edges into a project's .scatter/scatter.json so Codex or another AI can create an editable Canvasight graph.",
    inputSchema: {
      type: "object",
      properties: {
        projectPath: {
          type: "string",
          description: "Local project path. Defaults to Canvasight's default project path when omitted."
        },
        projectName: {
          type: "string",
          description: "Optional project name stored in .scatter/scatter.json."
        },
        mode: {
          type: "string",
          enum: ["append-page", "replace-active-page", "replace-document"],
          description: "Write behavior. Defaults to append-page so AI output does not overwrite existing pages."
        },
        pageId: {
          type: "string",
          description: "Optional id for the single page form."
        },
        pageName: {
          type: "string",
          description: "Optional name for the single page form."
        },
        activePageId: {
          type: "string",
          description: "Active page id when mode is replace-document."
        },
        layout: {
          type: "string",
          enum: ["horizontal", "vertical", "grid"],
          description: "Default layout for nodes without explicit x/y or position. Defaults to horizontal."
        },
        viewport: {
          type: "object",
          description: "Optional viewport for generated pages.",
          properties: {
            x: { type: "number" },
            y: { type: "number" },
            zoom: { type: "number" }
          },
          additionalProperties: true
        },
        nodes: {
          type: "array",
          description: "Single page node list. Each node accepts id, title, body, x/y or position, codexMode, runMode, effort, and attachments.",
          items: { type: "object", additionalProperties: true }
        },
        edges: {
          type: "array",
          description: "Single page edge list. source and target must reference node ids.",
          items: { type: "object", additionalProperties: true }
        },
        pages: {
          type: "array",
          description: "Optional multi-page graph input. When provided, top-level nodes/edges are ignored.",
          items: {
            type: "object",
            properties: {
              id: { type: "string" },
              name: { type: "string" },
              layout: { type: "string", enum: ["horizontal", "vertical", "grid"] },
              viewport: { type: "object", additionalProperties: true },
              nodes: { type: "array", items: { type: "object", additionalProperties: true } },
              edges: { type: "array", items: { type: "object", additionalProperties: true } }
            },
            additionalProperties: true
          }
        }
      },
      additionalProperties: false
    }
  },
  {
    name: "await_canvasight_run",
    description: "Wait for a browser run payload from a Canvasight session. The current Codex thread receives and applies the run payload.",
    inputSchema: {
      type: "object",
      properties: {
        sessionId: {
          type: "string",
          description: "Optional session id. When omitted, Canvasight waits for the matching project queue."
        },
        projectPath: {
          type: "string",
          description: "Optional project path filter when attaching from another Codex thread. Defaults to the most recent Canvasight project when sessionId is omitted."
        },
        threadId: {
          type: "string",
          description: "Optional current Codex thread id for native Plan/Goal integration. Defaults to CODEX_THREAD_ID when available."
        },
        timeoutMs: {
          type: "number",
          minimum: 1
        }
      },
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
  if (name === "list_canvasight_recent_projects") return toolListCanvasightRecentProjects(args || {});
  if (name === "open_canvasight_recent_project") return toolOpenCanvasightRecentProject(args || {});
  if (name === "write_canvasight_graph") return toolWriteCanvasightGraph(args || {});
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

async function runDaemon() {
  if (!daemonAuthToken) daemonAuthToken = crypto.randomBytes(24).toString("base64url");
  daemonStartedAt = nowIso();
  await ensureHttpServer();
}

function runMcpStdio() {
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
    // The persistent Canvasight daemon deliberately outlives this thread-local MCP shim.
  });
}

async function handleProcessShutdown() {
  if (isDaemonMode) {
    await shutdownDaemon();
  }
}

process.on("SIGTERM", () => {
  void handleProcessShutdown().finally(() => process.exit(0));
});

process.on("SIGINT", () => {
  void handleProcessShutdown().finally(() => process.exit(0));
});

if (isStopDaemonMode) {
  stopDaemonFromState()
    .then((stopped) => {
      process.stdout.write(`${stopped ? "Canvasight daemon stop requested" : "Canvasight daemon was not running"}\n`);
    })
    .catch((error) => {
      process.stderr.write(`${error?.message || "Failed to stop Canvasight daemon"}\n`);
      process.exitCode = 1;
    });
} else if (isDaemonMode) {
  runDaemon().catch((error) => {
    process.stderr.write(`${error?.message || "Canvasight daemon failed"}\n`);
    process.exitCode = 1;
  });
} else {
  runMcpStdio();
}
