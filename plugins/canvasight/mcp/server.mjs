#!/usr/bin/env node
import { spawn } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import fsp from "node:fs/promises";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { RESOURCE_MIME_TYPE } from "@modelcontextprotocol/ext-apps/server";

const SERVER_NAME = "canvasight";
const SERVER_VERSION = "0.3.9+codex.20260711112812";
const DEFAULT_PROTOCOL_VERSION = "2024-11-05";
const CANVASIGHT_WIDGET_URI = "ui://widget/canvasight/canvas.html";
const DEFAULT_MCP_LIFECYCLE_LOG_MAX_BYTES = 5 * 1024 * 1024;
const DAEMON_START_LOCK_STALE_MS = 15_000;
const DAEMON_START_LOCK_WAIT_MS = 12_000;
const MAX_JSON_BODY_BYTES = 100 * 1024 * 1024;
const MAX_RECENT_PROJECTS = 12;
const MAX_NODE_TEMPLATES = 200;
const TEMPLATE_BODY_PREVIEW_CHARS = 240;
const VALID_LANGUAGES = new Set(["zh", "en"]);
const VALID_EFFORT = new Set(["low", "medium", "high", "xhigh"]);
const VALID_RUN_MODES = new Set(["flow", "node"]);
const VALID_GRAPH_WRITE_MODES = new Set(["append-page", "replace-active-page", "replace-document"]);
const VALID_GRAPH_LAYOUTS = new Set(["horizontal", "vertical", "grid"]);
const VALID_GRAPH_TYPES = new Set(["software-product", "article-outline", "codebase-structure", "task-plan", "general"]);
const GRAPH_NODE_WIDTH = 400;
const GRAPH_NODE_HEIGHT = 220;
const GRAPH_LAYER_GAP = 280;
const GRAPH_ROW_GAP = 160;
const GRAPH_GRID_COLUMNS = 3;
const IMAGE_EXTENSIONS = new Set([".apng", ".avif", ".gif", ".jpg", ".jpeg", ".png", ".svg", ".webp"]);
const DEFAULT_CODEX_APP_BIN = "/Applications/Codex.app/Contents/Resources/codex";
const DEFAULT_CHATGPT_APP_BIN = "/Applications/ChatGPT.app/Contents/Resources/codex";
const DEFAULT_CANVASIGHT_HOME = path.join(os.homedir(), ".canvasight");
const CODEX_APP_SERVER_TURN_CONFIRMATION_METHODS = new Set(["turn/started", "item/started", "turn/completed"]);
const AGENT_TEAM_ROLE_IDS = new Set([
  "product-agent",
  "design-agent",
  "design-standards-agent",
  "development-agent",
  "development-standards-agent",
  "test-supervisor-agent",
  "customer-support-agent",
  "project-management-agent",
  "skill-expert-agent"
]);
const AGENT_TEAM_ROLE_NAMES = {
  "product-agent": "Product Agent",
  "design-agent": "Design Agent",
  "design-standards-agent": "Design Standards Expert",
  "development-agent": "Development Agent",
  "development-standards-agent": "Development Standards Lead",
  "test-supervisor-agent": "Test Supervisor Agent",
  "customer-support-agent": "Customer Support Agent",
  "project-management-agent": "Project Management Agent",
  "skill-expert-agent": "Skill Expert Agent"
};
const AGENT_TEAM_STATUS_FLOW = ["open", "assigned", "blocked", "resolved", "archived"];
const AGENT_TEAM_AGENTS_MD_START = "<!-- canvasight-agent-team:start -->";
const AGENT_TEAM_AGENTS_MD_END = "<!-- canvasight-agent-team:end -->";
const AGENT_TEAM_AGENTS_MD_BLOCK = `${AGENT_TEAM_AGENTS_MD_START}
## Canvasight Agent Team

When Canvasight Agent Team mode is enabled, Codex should use role seats that survive thread recreation without treating a transient subagent process as durable state.

### Fixed Roles

- Product Agent: keeps work aligned with product goals and scope.
- Design Agent: checks UI direction, interaction quality, and design consistency.
- Development Agent: implements code, persistence, runtime, and integration changes.
- Test Supervisor Agent: verifies builds, smoke tests, regressions, and browser-visible behavior.
- Customer Support Agent: decides whether user-facing README documentation needs updates.
- Design Standards Expert: maintains \`design.md\` when product UI rules change.
- Development Standards Lead: maintains \`AGENTS.md\` and project working rules.
- Project Management Agent: manages git status, staging scope, and conventional Chinese commit messages.
- Skill Expert Agent: maintains Canvasight and Codex skill instructions when skill behavior changes.

### Agent Reports

Read \`ROSTER.md\` before restoring a role. Report files are authoritative for issue ownership, state, dependencies, and validation evidence; the roster is authoritative only for role-seat/runtime mapping; \`agent-reports/QUEUE.md\` is a derived index.

- Use versioned report filenames: \`issue-<kebab-slug>.md\`, \`solution-<kebab-slug>.md\`, and \`integration-summary-<kebab-slug>.md\`.
- Each issue has one scalar owner. Re-read its owner, status, and version before write; write report -> roster -> queue, with RFC 3339 UTC timestamps and verification evidence.
- Use the packaged \`canvasight-agent-team/references/agent-team-schema.json\` contract and run its validator before delivery.

### Operating Rules

- Reuse a current runtime role only when it matches the roster mapping; otherwise mark the needed seat rebuilding and recreate only that seat.
- Create only the roles needed for the current task. Do not create duplicate seats or use ad hoc role names.
- Preserve existing project rules in this file; target project rules take precedence over Canvasight defaults.
- Resolve a report/roster conflict in favor of the report, then regenerate the queue from the report.
- The main thread owns integration, conflict handling, final verification, and git delivery.
${AGENT_TEAM_AGENTS_MD_END}`;
const SOFTWARE_PRODUCT_GUIDANCE_FILES = [
  {
    canonicalName: "AGENTS.md",
    candidates: ["AGENTS.md", "agents.md", "Agents.md"],
    aliases: ["agents.md", "agents-md", "agents md"],
    nodeId: "project-guidance-agents-md",
    title: "补充 AGENTS.md",
    body:
      "当前项目缺少 AGENTS.md。请创建该文件，写清项目上下文、工作规则、Agent Team 分工、实现标准、设计标准、验证命令和 git 提交规则。已有约定应从项目文件和当前需求中归纳，不要写成空模板。"
  },
  {
    canonicalName: "design.md",
    candidates: ["design.md", "DESIGN.md", "Design.md"],
    aliases: ["design.md", "design-md", "design md"],
    nodeId: "project-guidance-design-md",
    title: "补充 design.md",
    body:
      "当前项目缺少 design.md。请创建该文件，沉淀产品定位、信息架构、布局规则、组件语言、交互状态、视觉约束和后续设计决策。需要基于当前产品目标，而不是复制通用设计系统。"
  }
];

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const pluginRoot = path.resolve(__dirname, "..");
const distRoot = path.join(pluginRoot, "dist");
const isDaemonMode = process.argv.includes("--daemon");
const isStopDaemonMode = process.argv.includes("--stop-daemon");

const sessions = new Map();
const projectThreadClaims = new Map();
const projectDocumentRevisions = new Map();
const projectWriteLocks = new Map();
const globalRunWaiters = [];
let httpState = null;
let inputBuffer = Buffer.alloc(0);
let useContentLengthTransport = false;
let daemonAuthToken = process.env.CANVASIGHT_DAEMON_TOKEN || "";
let daemonStartedAt = nowIso();
let mcpInFlight = 0;
let mcpStdinEnded = false;
let mcpExitTimer = null;
let mcpExitCode = 0;
let mcpStdoutClosed = false;

class HttpError extends Error {
  constructor(statusCode, message, code = "") {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

function projectRevisionKey(projectPath) {
  return path.resolve(projectPath);
}

function projectDocumentRevision(projectPath) {
  return projectDocumentRevisions.get(projectRevisionKey(projectPath)) || 0;
}

function bumpProjectDocumentRevision(projectPath) {
  const key = projectRevisionKey(projectPath);
  const revision = (projectDocumentRevisions.get(key) || 0) + 1;
  projectDocumentRevisions.set(key, revision);
  return revision;
}

async function withProjectWriteLock(projectPath, operation) {
  const key = projectRevisionKey(projectPath);
  const previous = projectWriteLocks.get(key) || Promise.resolve();
  let release = () => {};
  const gate = new Promise((resolve) => {
    release = resolve;
  });
  const current = previous.catch(() => {}).then(() => gate);
  projectWriteLocks.set(key, current);
  await previous.catch(() => {});
  try {
    return await operation();
  } finally {
    release();
    if (projectWriteLocks.get(key) === current) projectWriteLocks.delete(key);
  }
}

function assertCurrentDocumentRevision(projectPath, expectedRevision) {
  if (typeof expectedRevision !== "number" || !Number.isFinite(expectedRevision)) {
    throw new HttpError(409, "Canvasight document revision is required. Reload required.", "stale_document");
  }
  if (expectedRevision !== projectDocumentRevision(projectPath)) {
    throw new HttpError(409, "Canvasight document changed outside this session. Reload required.", "stale_document");
  }
}

function isObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function nowIso() {
  return new Date().toISOString();
}

function serializeError(error) {
  return {
    name: error?.name || "Error",
    message: error?.message || String(error || "Unknown error"),
    stack: typeof error?.stack === "string" ? error.stack : ""
  };
}

function appendMcpLifecycle(event, data = {}) {
  if (isDaemonMode || isStopDaemonMode) return;
  try {
    fs.mkdirSync(canvasightHome(), { recursive: true });
    const logPath = canvasightMcpLifecycleLogPath();
    const configuredMaxBytes = Number(process.env.CANVASIGHT_MCP_LIFECYCLE_LOG_MAX_BYTES);
    const maxBytes = Number.isFinite(configuredMaxBytes) && configuredMaxBytes >= 1024 ? configuredMaxBytes : DEFAULT_MCP_LIFECYCLE_LOG_MAX_BYTES;
    let rotatedBytes = 0;
    try {
      const size = fs.statSync(logPath).size;
      if (size >= maxBytes) {
        rotatedBytes = size;
        fs.truncateSync(logPath, 0);
      }
    } catch (error) {
      if (error?.code !== "ENOENT") throw error;
    }
    fs.appendFileSync(
      logPath,
      `${JSON.stringify({
        ts: nowIso(),
        pid: process.pid,
        version: SERVER_VERSION,
        pluginRoot,
        event,
        ...(rotatedBytes ? { rotatedBytes } : {}),
        ...data
      })}\n`,
      "utf8"
    );
  } catch {
    // Lifecycle logging is diagnostic only; it must never break JSON-RPC.
  }
}

function appendOpenAttemptLifecycle(event, data = {}) {
  try {
    fs.mkdirSync(canvasightHome(), { recursive: true });
    fs.appendFileSync(
      canvasightMcpLifecycleLogPath(),
      `${JSON.stringify({ ts: nowIso(), pid: process.pid, version: SERVER_VERSION, pluginRoot, event, ...data })}\n`,
      "utf8"
    );
  } catch {
    // Open-attempt logging is diagnostic only.
  }
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

function normalizeGraphType(value) {
  return VALID_GRAPH_TYPES.has(value) ? value : "general";
}

function defaultGraphLayoutForType(graphType) {
  if (graphType === "article-outline") return "vertical";
  if (graphType === "software-product" || graphType === "codebase-structure") return "grid";
  return "horizontal";
}

function normalizeCodexMode() {
  // Plan and Goal are intentionally retired until the native widget host
  // exposes a real mode-control acknowledgement. Preserve old node content,
  // but normalize all persisted and incoming mode values to Chat.
  return "chat";
}

function optionalThreadId(threadId) {
  if (typeof threadId !== "string" || !threadId.trim()) return null;
  return threadId.trim();
}

function requiredNativeThreadId(threadId) {
  const resolved = optionalThreadId(threadId) || optionalThreadId(process.env.CODEX_THREAD_ID);
  if (resolved) return resolved;
  throw new HttpError(
    400,
    "Canvasight native open requires the current Codex thread id. Read CODEX_THREAD_ID in the active Codex task and pass it as threadId.",
    { code: "current_thread_id_required" }
  );
}

function nativeCodexEnabled() {
  const value = String(process.env.CANVASIGHT_CODEX_NATIVE || "").trim().toLowerCase();
  if (!value) return true;
  return value !== "0" && value !== "false" && value !== "off" && value !== "no";
}

function nativeCodexTimeoutMs() {
  return Math.max(1000, Math.min(toNumber(Number(process.env.CANVASIGHT_CODEX_NATIVE_TIMEOUT_MS), 30000), 120000));
}

function nativeCodexConfirmationTimeoutMs() {
  return Math.max(250, Math.min(toNumber(Number(process.env.CANVASIGHT_CODEX_NATIVE_CONFIRMATION_TIMEOUT_MS), 1500), 10000));
}

function configuredExecutable(name) {
  const value = process.env[name];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function codexAppRuntime() {
  const explicitBin = configuredExecutable("CANVASIGHT_CODEX_BIN");
  if (explicitBin) return { bin: explicitBin, source: "explicit_override", isDesktop: false };

  // The two candidate overrides make the fixed macOS application locations
  // testable without changing their production preference order.
  const codexDesktopBin = configuredExecutable("CANVASIGHT_CODEX_APP_BIN") || DEFAULT_CODEX_APP_BIN;
  if (fs.existsSync(codexDesktopBin)) return { bin: codexDesktopBin, source: "codex_desktop", isDesktop: true };

  const chatGptDesktopBin = configuredExecutable("CANVASIGHT_CHATGPT_APP_BIN") || DEFAULT_CHATGPT_APP_BIN;
  if (fs.existsSync(chatGptDesktopBin)) return { bin: chatGptDesktopBin, source: "chatgpt_desktop", isDesktop: true };

  return { bin: "codex", source: "path_fallback", isDesktop: false };
}

function codexAppServerArgs() {
  const rawArgs = String(process.env.CANVASIGHT_CODEX_APP_SERVER_ARGS || "").trim();
  if (rawArgs) return rawArgs.split(/\s+/).filter(Boolean);
  return ["app-server", "--listen", "stdio://"];
}

function codexAppServerTransports() {
  // Native mode changes are sent directly to Codex's supported app-server API.
  // Do not probe or proxy a Desktop control socket: it is not a public, stable
  // integration surface and a failed probe used to hide the real request path.
  return [{ kind: "stdio_fallback", args: codexAppServerArgs() }];
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

function isPluginInternalPath(candidate) {
  if (!candidate) return false;
  const resolved = path.resolve(candidate);
  return resolved === pluginRoot || resolved.startsWith(`${pluginRoot}${path.sep}`);
}

async function codexThreadProjectPath(threadId) {
  const resolvedThreadId = optionalThreadId(threadId);
  if (!resolvedThreadId) return null;
  try {
    const result = await appServerRequest("thread/resume", { threadId: resolvedThreadId });
    const cwd = optionalProjectPath(result?.cwd);
    if (!cwd || isPluginInternalPath(cwd)) return null;
    return cwd;
  } catch {
    return null;
  }
}

async function resolveSessionProjectPath(projectPath, threadId, options = {}) {
  const explicitProjectPath = optionalProjectPath(projectPath);
  if (explicitProjectPath) return explicitProjectPath;
  const threadProjectPath = await codexThreadProjectPath(threadId);
  if (threadProjectPath) return threadProjectPath;
  if (options.requireThreadProject === true && optionalThreadId(threadId)) {
    throw new HttpError(
      409,
      "Canvasight could not resolve the current Codex task's project folder. Reopen from a healthy project task or pass projectPath explicitly; Canvasight did not fall back to another project's .scatter workspace.",
      "current_thread_project_unavailable"
    );
  }
  return defaultProjectPath();
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

function canvasightDaemonStartLockPath() {
  return path.join(canvasightHome(), "daemon-start.lock");
}

function canvasightMcpLifecycleLogPath() {
  return path.join(canvasightHome(), "mcp-lifecycle.log");
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
    return parsed.map(normalizeNodeTemplate).filter(Boolean);
  } catch (error) {
    if (error?.code === "ENOENT" || error instanceof SyntaxError) return [];
    throw error;
  }
}

async function writeNodeTemplates(templates) {
  const normalized = Array.isArray(templates) ? templates.map(normalizeNodeTemplate).filter(Boolean) : [];
  await fsp.mkdir(canvasightHome(), { recursive: true });
  await fsp.writeFile(canvasightTemplatesPath(), `${JSON.stringify(normalized, null, 2)}\n`, "utf8");
  return normalized;
}

async function createNodeTemplate(input, options = {}) {
  const body = typeof input?.body === "string" ? input.body.trim() : "";
  if (!body) throw new HttpError(400, "Template body is required");
  const existingTemplates = await readNodeTemplates();
  const replaceOldest = Boolean(options?.replaceOldest);
  if (existingTemplates.length >= MAX_NODE_TEMPLATES && !replaceOldest) {
    throw new HttpError(409, `Template limit reached (${MAX_NODE_TEMPLATES})`, "template_limit_reached");
  }
  const attachments = await copyTemplateAttachments(input?.attachments);
  const template = normalizeNodeTemplate({
    ...input,
    body,
    attachments,
    id: `template-${crypto.randomBytes(8).toString("hex")}`,
    createdAt: nowIso(),
    updatedAt: nowIso()
  });
  if (!template) throw new HttpError(400, "template body is required");
  const templates = replaceOldest ? [template, ...existingTemplates.slice(0, Math.max(0, existingTemplates.length - 1))] : [template, ...existingTemplates];
  await writeNodeTemplates(templates);
  return template;
}

async function deleteTemplateAssets(template) {
  if (!template || !Array.isArray(template.attachments)) return;
  await Promise.all(
    template.attachments.map(async (attachment) => {
      const storedPath = typeof attachment.storedPath === "string" ? path.resolve(attachment.storedPath) : "";
      if (!storedPath || !isTemplateAssetPath(storedPath)) return;
      try {
        await fsp.unlink(storedPath);
      } catch {
        // Best effort cleanup. Template deletion must not fail because an asset is already gone.
      }
    })
  );
}

async function deleteNodeTemplate(templateId) {
  const templates = await readNodeTemplates();
  const template = templates.find((item) => item.id === templateId);
  if (!template) throw new HttpError(404, "Template not found", "template_not_found");
  await writeNodeTemplates(templates.filter((item) => item.id !== templateId));
  await deleteTemplateAssets(template);
  return { status: "deleted", templateId };
}

function getNodeTemplate(templates, templateId) {
  const template = templates.find((item) => item.id === templateId);
  if (!template) throw new HttpError(404, "Template not found", "template_not_found");
  return template;
}

function templateBodyPreview(body) {
  const normalized = String(body || "").replace(/\s+/g, " ").trim();
  if (normalized.length <= TEMPLATE_BODY_PREVIEW_CHARS) return normalized;
  return `${normalized.slice(0, TEMPLATE_BODY_PREVIEW_CHARS).trimEnd()}...`;
}

function summarizeNodeTemplate(template) {
  return {
    id: template.id,
    title: template.title,
    bodyPreview: templateBodyPreview(template.body),
    bodyLength: template.body.length,
    attachmentCount: template.attachments.length,
    createdAt: template.createdAt,
    updatedAt: template.updatedAt
  };
}

function normalizeTemplateQuery(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function templateSearchText(template) {
  return normalizeTemplateQuery(`${template.title} ${template.body}`);
}

function templateMatchesQuery(template, query) {
  const normalizedQuery = normalizeTemplateQuery(query);
  if (!normalizedQuery) return true;
  const searchText = templateSearchText(template);
  return normalizedQuery.split(" ").filter(Boolean).every((token) => searchText.includes(token));
}

function normalizeTemplateListLimit(value) {
  return Math.max(1, Math.min(Math.floor(toNumber(Number(value), 20)), MAX_NODE_TEMPLATES));
}

function findTemplateByQuery(templates, query) {
  const normalizedQuery = normalizeTemplateQuery(query);
  if (!normalizedQuery) return null;
  const titleMatch = templates.find((template) => normalizeTemplateQuery(template.title) === normalizedQuery);
  if (titleMatch) return titleMatch;
  return templates.find((template) => templateMatchesQuery(template, normalizedQuery)) || null;
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

function readDaemonStateSync() {
  try {
    const raw = fs.readFileSync(canvasightDaemonStatePath(), "utf8");
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

async function removeOwnedDaemonState() {
  const state = await readDaemonState();
  if (state?.pid !== process.pid || state.token !== daemonAuthToken) return false;
  await removeDaemonState();
  return true;
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

function processIsAlive(pid) {
  if (!Number.isFinite(pid) || pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

async function canvasightDaemonPidsForPluginRoot() {
  if (process.platform === "win32") return [];
  try {
    const output = await new Promise((resolve) => {
      const ps = spawn("ps", ["-axo", "pid=,command="], {
        stdio: ["ignore", "pipe", "ignore"]
      });
      let text = "";
      ps.stdout.setEncoding("utf8");
      ps.stdout.on("data", (chunk) => {
        text += chunk;
      });
      ps.on("error", () => resolve(""));
      ps.on("exit", () => resolve(text));
    });
    return String(output)
      .split("\n")
      .map((line) => {
        const match = line.trim().match(/^(\d+)\s+(.+)$/);
        if (!match) return null;
        return {
          pid: Number(match[1]),
          command: match[2]
        };
      })
      .filter((entry) => {
        if (!entry || entry.pid === process.pid) return false;
        if (!entry.command.includes("mcp/server.mjs") || !entry.command.includes("--daemon")) return false;
        const currentScript = path.join(pluginRoot, "mcp", "server.mjs");
        const isCurrentCheckout = entry.command.includes(currentScript);
        const isCanvasightCache = /\/\.codex\/plugins\/cache\/canvasight-local\/canvasight\/[^/]+\/mcp\/server\.mjs/.test(entry.command);
        const isCanvasightPluginCheckout = /\/plugins\/canvasight\/mcp\/server\.mjs/.test(entry.command);
        if (!isCurrentCheckout && !isCanvasightCache && !isCanvasightPluginCheckout) return false;
        const homeArg = `--canvasight-home=${canvasightHome()}`;
        if (entry.command.includes(homeArg)) return true;
        return canvasightHome() === path.resolve(DEFAULT_CANVASIGHT_HOME) && !entry.command.includes("--canvasight-home=");
      })
      .map((entry) => entry.pid);
  } catch {
    return [];
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForProcessExit(pid, timeoutMs = 1200) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (!processIsAlive(pid)) return true;
    await sleep(80);
  }
  return !processIsAlive(pid);
}

async function stopDaemonStateProcess(state, reason = "stale") {
  if (!state || state.pluginRoot !== pluginRoot) return false;
  const pid = Number(state.pid);
  const shouldStop =
    Number.isFinite(pid) &&
    pid > 0 &&
    state.serverVersion &&
    state.serverVersion !== SERVER_VERSION &&
    processIsAlive(pid);

  if (!shouldStop) {
    await removeDaemonState();
    return false;
  }

  appendMcpLifecycle("daemon_stop_stale", {
    reason,
    stalePid: pid,
    staleVersion: state.serverVersion,
    expectedVersion: SERVER_VERSION
  });

  try {
    process.kill(pid, "SIGTERM");
    await waitForProcessExit(pid);
  } catch {
    // If the stale process exits between checks, removing state is still correct.
  }
  await removeDaemonState();
  return true;
}

async function stopOrphanDaemonProcesses(keepPid = 0, reason = "orphan") {
  const pids = await canvasightDaemonPidsForPluginRoot();
  const stopped = [];
  for (const pid of pids) {
    if (pid === keepPid) continue;
    try {
      process.kill(pid, "SIGTERM");
      stopped.push(pid);
    } catch {
      // Ignore processes that disappear between ps and kill.
    }
  }
  if (stopped.length) {
    appendMcpLifecycle("daemon_stop_orphans", { reason, pids: stopped });
    await Promise.all(stopped.map((pid) => waitForProcessExit(pid, 1200)));
  }
  return stopped;
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

function daemonNodeExecutableCandidates() {
  const candidates = [];
  const seen = new Set();
  const add = (executable, source) => {
    if (typeof executable !== "string" || !executable.trim()) return;
    const normalized = executable.trim();
    if (seen.has(normalized)) return;
    seen.add(normalized);
    candidates.push({ executable: normalized, source });
  };

  // A configured executable is useful for managed runtimes and gives smoke tests a
  // deterministic way to exercise the fallback path.
  add(process.env.CANVASIGHT_NODE_BIN, "configured");
  // Prefer a fresh PATH lookup. Homebrew's Cellar path in process.execPath can be
  // removed while a long-lived MCP shim is still running.
  add("node", "path");
  add(process.env.npm_node_execpath, "npm_node_execpath");
  add(process.execPath, "process_exec_path");
  return candidates;
}

function daemonSpawnErrorDetails(error) {
  return {
    code: typeof error?.code === "string" ? error.code : "",
    message: error?.message || String(error || "Unknown daemon spawn error")
  };
}

async function spawnDaemonWithNodeFallback(token) {
  const candidates = daemonNodeExecutableCandidates();
  const attempts = [];
  const daemonArgs = [__filename, "--daemon", `--canvasight-home=${canvasightHome()}`];

  for (const candidate of candidates) {
    appendMcpLifecycle("daemon_spawn_attempt", {
      executable: candidate.executable,
      source: candidate.source
    });
    const launched = await new Promise((resolve) => {
      let child;
      try {
        child = spawn(candidate.executable, daemonArgs, {
          cwd: pluginRoot,
          detached: true,
          stdio: "ignore",
          env: {
            ...process.env,
            CANVASIGHT_DAEMON_TOKEN: token
          }
        });
      } catch (error) {
        resolve({ error });
        return;
      }

      child.once("spawn", () => resolve({ child }));
      child.once("error", (error) => resolve({ error }));
    });

    if (launched.child) {
      launched.child.unref();
      appendMcpLifecycle("daemon_spawned", {
        executable: candidate.executable,
        source: candidate.source,
        daemonPid: launched.child.pid
      });
      return {
        executable: candidate.executable,
        source: candidate.source,
        attempts
      };
    }

    const failure = daemonSpawnErrorDetails(launched.error);
    attempts.push({ ...candidate, ...failure });
    appendMcpLifecycle("daemon_spawn_failure", {
      executable: candidate.executable,
      source: candidate.source,
      ...failure
    });
  }

  const summary = attempts
    .map((attempt) => `${attempt.source}=${attempt.executable}${attempt.code ? ` (${attempt.code})` : ""}`)
    .join(", ");
  appendMcpLifecycle("daemon_spawn_exhausted", { attempts });
  throw new Error(`Canvasight daemon could not launch a Node process. Tried: ${summary || "no Node executable candidates"}`);
}

async function readDaemonStartLock() {
  try {
    const raw = await fsp.readFile(canvasightDaemonStartLockPath(), "utf8");
    return JSON.parse(raw);
  } catch (error) {
    if (error?.code === "ENOENT" || error instanceof SyntaxError) return null;
    throw error;
  }
}

async function acquireDaemonStartLock() {
  await fsp.mkdir(canvasightHome(), { recursive: true });
  const deadline = Date.now() + DAEMON_START_LOCK_WAIT_MS;
  while (Date.now() < deadline) {
    const token = crypto.randomBytes(12).toString("base64url");
    try {
      const handle = await fsp.open(canvasightDaemonStartLockPath(), "wx");
      await handle.writeFile(
        `${JSON.stringify({ pid: process.pid, token, serverVersion: SERVER_VERSION, pluginRoot, createdAt: nowIso() })}\n`,
        "utf8"
      );
      return { handle, token, existing: null };
    } catch (error) {
      if (error?.code !== "EEXIST") throw error;
    }

    const existing = await healthyDaemonState(await readDaemonState());
    if (existing) return { handle: null, token: "", existing };

    const lock = await readDaemonStartLock();
    const createdAt = Date.parse(lock?.createdAt || "");
    const stale =
      !lock ||
      !processIsAlive(Number(lock.pid)) ||
      (Number.isFinite(createdAt) && Date.now() - createdAt >= DAEMON_START_LOCK_STALE_MS);
    if (stale) {
      await fsp.rm(canvasightDaemonStartLockPath(), { force: true });
      continue;
    }
    await sleep(100);
  }
  throw new Error("Canvasight daemon start lock timed out");
}

async function releaseDaemonStartLock(lock) {
  if (!lock?.handle) return;
  try {
    await lock.handle.close();
  } finally {
    const current = await readDaemonStartLock();
    if (current?.token === lock.token) await fsp.rm(canvasightDaemonStartLockPath(), { force: true });
  }
}

async function ensureDaemonServer() {
  const initialState = await readDaemonState();
  const existing = await healthyDaemonState(initialState);
  if (existing) {
    await stopOrphanDaemonProcesses(Number(existing.pid), "healthy_state_found");
    return existing;
  }

  const lock = await acquireDaemonStartLock();
  if (lock.existing) {
    await stopOrphanDaemonProcesses(Number(lock.existing.pid), "healthy_state_while_waiting");
    return lock.existing;
  }

  try {
    const state = await readDaemonState();
    const lockedExisting = await healthyDaemonState(state);
    if (lockedExisting) {
      await stopOrphanDaemonProcesses(Number(lockedExisting.pid), "healthy_state_after_lock");
      return lockedExisting;
    }
    const hasCurrentVersionState = state?.pluginRoot === pluginRoot && state.serverVersion === SERVER_VERSION;
    if (state?.pluginRoot === pluginRoot && state.serverVersion && state.serverVersion !== SERVER_VERSION) {
      await stopDaemonStateProcess(state, "version_mismatch_before_spawn");
    }
    if (!hasCurrentVersionState) {
      await stopOrphanDaemonProcesses(0, "before_spawn");
    }

    const token = crypto.randomBytes(24).toString("base64url");
    const launch = await spawnDaemonWithNodeFallback(token);
    try {
      return await waitForDaemon(token);
    } catch (error) {
      const state = await readDaemonState();
      appendMcpLifecycle("daemon_start_timeout", {
        executable: launch.executable,
        source: launch.source,
        daemonPid: state?.pid || null,
        stateVersion: state?.serverVersion || "",
        statePluginRoot: state?.pluginRoot || ""
      });
      throw new Error(
        `${error instanceof Error ? error.message : String(error)} (spawned with ${launch.source}: ${launch.executable}; inspect ${canvasightMcpLifecycleLogPath()} for daemon spawn diagnostics)`
      );
    }
  } finally {
    await releaseDaemonStartLock(lock);
  }
}

async function stopDaemonFromState() {
  const state = await readDaemonState();
  if (!state) return false;
  const healthy = await healthyDaemonState(state);
  if (!healthy?.pid) {
    if (await stopDaemonStateProcess(state, "stop_daemon_unhealthy_state")) return true;
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
  const rawData = isObject(node.data) ? node.data : {};
  const { codexMode: _codexMode, planMode: _planMode, ...data } = rawData;
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

  // A Canvasight document belongs to its containing project folder. Runtime
  // Codex task bindings live only in daemon sessions and must never make a
  // .scatter document portable with a stale thread target.
  const { codexThreadId, threadId, threadClaimedAt, ...documentFields } = value;

  return {
    ...documentFields,
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

function graphNodeFieldText(value, field) {
  const node = isObject(value) ? value : {};
  const data = isObject(node.data) ? node.data : {};
  return normalizeTemplateQuery(typeof node[field] === "string" ? node[field] : typeof data[field] === "string" ? data[field] : "");
}

function graphHasGuidanceIntent(title, guidanceFile) {
  if (!title) return false;
  const aliases = guidanceFile.aliases.map((alias) => normalizeTemplateQuery(alias));
  const directTitles = [normalizeTemplateQuery(guidanceFile.title), normalizeTemplateQuery(`补充 ${guidanceFile.canonicalName}`)];
  if (directTitles.includes(title)) return true;
  return aliases.some((alias) =>
    [
      `补充 ${alias}`,
      `创建 ${alias}`,
      `起草 ${alias}`,
      `新增 ${alias}`,
      `draft ${alias}`,
      `create ${alias}`,
      `add ${alias}`
    ].some((pattern) => title.includes(pattern))
  );
}

function graphHasGuidanceNode(rawNodes, guidanceFile) {
  const canonicalName = normalizeTemplateQuery(guidanceFile.canonicalName);
  const nodeId = normalizeTemplateQuery(guidanceFile.nodeId);
  return rawNodes.some((node) => {
    const data = isObject(node?.data) ? node.data : {};
    const id = graphNodeFieldText(node, "id");
    const title = graphNodeFieldText(node, "title");
    const projectGuidanceFile = normalizeTemplateQuery(data.projectGuidanceFile);
    return id === nodeId || projectGuidanceFile === canonicalName || graphHasGuidanceIntent(title, guidanceFile);
  });
}

function projectHasGuidanceFile(projectPath, guidanceFile) {
  return guidanceFile.candidates.some((candidate) => fs.existsSync(path.join(projectPath, candidate)));
}

function projectGuidanceNodeId(baseId, usedIds) {
  let id = baseId;
  let suffix = 2;
  while (usedIds.has(id)) {
    id = `${baseId}-${suffix}`;
    suffix += 1;
  }
  usedIds.add(id);
  return id;
}

function projectGuidanceEdgeId(index, usedIds) {
  const baseId = `project-guidance-edge-${index + 1}`;
  let id = baseId;
  let suffix = 2;
  while (usedIds.has(id)) {
    id = `${baseId}-${suffix}`;
    suffix += 1;
  }
  usedIds.add(id);
  return id;
}

function guidanceInputNodeIds(rawNodes) {
  const usedIds = new Set();
  rawNodes.forEach((node, index) => {
    const explicitId = typeof node?.id === "string" && node.id.trim() ? node.id.trim() : "";
    usedIds.add(explicitId || `node-${index + 1}`);
  });
  return usedIds;
}

function softwareProductGuidanceNodes(projectPath, graphType, pageIndex, rawNodes) {
  if (graphType !== "software-product" || pageIndex !== 0 || !projectPath) return [];
  const usedIds = guidanceInputNodeIds(rawNodes);
  return SOFTWARE_PRODUCT_GUIDANCE_FILES.filter((guidanceFile) => !projectHasGuidanceFile(projectPath, guidanceFile))
    .filter((guidanceFile) => !graphHasGuidanceNode(rawNodes, guidanceFile))
    .map((guidanceFile) => ({
      id: projectGuidanceNodeId(guidanceFile.nodeId, usedIds),
      title: guidanceFile.title,
      body: guidanceFile.body,
      codexMode: "chat",
      runMode: "flow",
      data: {
        projectGuidanceFile: guidanceFile.canonicalName
      }
    }));
}

function normalizeGraphNodePosition(node, index, layout) {
  const column = layout === "vertical" ? 0 : layout === "grid" ? index % GRAPH_GRID_COLUMNS : index;
  const row = layout === "horizontal" ? 0 : layout === "grid" ? Math.floor(index / GRAPH_GRID_COLUMNS) : index;
  const fallback = {
    x: column * (GRAPH_NODE_WIDTH + GRAPH_LAYER_GAP),
    y: row * (GRAPH_NODE_HEIGHT + GRAPH_ROW_GAP)
  };
  const position = isObject(node.position) ? node.position : {};
  return {
    x: coerceGraphCoordinate(position.x ?? node.x, fallback.x),
    y: coerceGraphCoordinate(position.y ?? node.y, fallback.y)
  };
}

function hasGraphCoordinate(value) {
  if (typeof value === "string" && !value.trim()) return false;
  return Number.isFinite(Number(value));
}

function coerceGraphCoordinate(value, fallback) {
  return hasGraphCoordinate(value) ? Number(value) : fallback;
}

function graphNodePositionAxes(value) {
  const position = isObject(value?.position) ? value.position : {};
  return {
    x: hasGraphCoordinate(position.x ?? value?.x),
    y: hasGraphCoordinate(position.y ?? value?.y)
  };
}

function fallbackGraphNodePosition(index, layout) {
  const stepX = GRAPH_NODE_WIDTH + GRAPH_LAYER_GAP;
  const stepY = GRAPH_NODE_HEIGHT + GRAPH_ROW_GAP;
  if (layout === "vertical") {
    return { x: 0, y: index * stepY };
  }
  if (layout === "grid") {
    return {
      x: (index % GRAPH_GRID_COLUMNS) * stepX,
      y: Math.floor(index / GRAPH_GRID_COLUMNS) * stepY
    };
  }
  return { x: index * stepX, y: 0 };
}

function graphLayoutLayers(nodes, edges) {
  const nodeIds = new Set(nodes.map((node) => node.id));
  const nodeIndex = new Map(nodes.map((node, index) => [node.id, index]));
  const indegree = new Map(nodes.map((node) => [node.id, 0]));
  const children = new Map(nodes.map((node) => [node.id, []]));
  const parent = new Map();

  edges.forEach((edge) => {
    if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) return;
    children.get(edge.source)?.push(edge.target);
    indegree.set(edge.target, (indegree.get(edge.target) || 0) + 1);
    parent.set(edge.target, edge.source);
  });

  const layers = new Map();
  const queue = nodes.filter((node) => (indegree.get(node.id) || 0) === 0).map((node) => node.id);
  queue.forEach((id) => layers.set(id, 0));

  for (let index = 0; index < queue.length; index += 1) {
    const id = queue[index];
    const nextLayer = (layers.get(id) || 0) + 1;
    const childIds = [...(children.get(id) || [])].sort((a, b) => (nodeIndex.get(a) || 0) - (nodeIndex.get(b) || 0));
    childIds.forEach((childId) => {
      layers.set(childId, Math.max(layers.get(childId) || 0, nextLayer));
      const nextIndegree = Math.max(0, (indegree.get(childId) || 0) - 1);
      indegree.set(childId, nextIndegree);
      if (nextIndegree === 0) queue.push(childId);
    });
  }

  nodes.forEach((node, index) => {
    if (!layers.has(node.id)) layers.set(node.id, Math.floor(index / GRAPH_GRID_COLUMNS));
  });

  const grouped = [];
  nodes.forEach((node) => {
    const layer = layers.get(node.id) || 0;
    if (!grouped[layer]) grouped[layer] = [];
    grouped[layer].push(node);
  });

  grouped.forEach((group) => {
    group.sort((a, b) => {
      const parentA = parent.get(a.id);
      const parentB = parent.get(b.id);
      const parentDelta = (parentA ? nodeIndex.get(parentA) || 0 : -1) - (parentB ? nodeIndex.get(parentB) || 0 : -1);
      return parentDelta || (nodeIndex.get(a.id) || 0) - (nodeIndex.get(b.id) || 0);
    });
  });

  return grouped;
}

function edgeAwareGraphNodePositions(nodes, edges, layout) {
  if (!edges.length) return new Map(nodes.map((node, index) => [node.id, fallbackGraphNodePosition(index, layout)]));

  const stepX = GRAPH_NODE_WIDTH + GRAPH_LAYER_GAP;
  const stepY = GRAPH_NODE_HEIGHT + GRAPH_ROW_GAP;
  const connectedIds = new Set(edges.flatMap((edge) => [edge.source, edge.target]));
  const connectedNodes = nodes.filter((node) => connectedIds.has(node.id));
  const isolatedNodes = nodes.filter((node) => !connectedIds.has(node.id));
  const layers = graphLayoutLayers(connectedNodes.length ? connectedNodes : nodes, edges);
  const positions = new Map();

  layers.forEach((group, layerIndex) => {
    group.forEach((node, rowIndex) => {
      const offset = rowIndex - (group.length - 1) / 2;
      positions.set(
        node.id,
        layout === "vertical"
          ? {
              x: offset * stepX,
              y: layerIndex * stepY
            }
          : {
              x: layerIndex * stepX,
              y: offset * stepY
            }
      );
    });
  });

  const values = [...positions.values()];
  const minX = Math.min(...values.map((position) => position.x));
  const minY = Math.min(...values.map((position) => position.y));
  if (minX < 0 || minY < 0) {
    positions.forEach((position, id) => {
      positions.set(id, {
        x: position.x - Math.min(0, minX),
        y: position.y - Math.min(0, minY)
      });
    });
  }

  if (isolatedNodes.length) {
    const currentPositions = [...positions.values()];
    const isolatedStartY = currentPositions.length ? Math.max(...currentPositions.map((position) => position.y)) + stepY : 0;
    isolatedNodes.forEach((node, index) => {
      positions.set(node.id, {
        x: (index % GRAPH_GRID_COLUMNS) * stepX,
        y: isolatedStartY + Math.floor(index / GRAPH_GRID_COLUMNS) * stepY
      });
    });
  }

  return positions;
}

function applyGraphAutoLayout(nodes, edges, layout, positionAxesByNodeId) {
  const autoPositions = edgeAwareGraphNodePositions(nodes, edges, layout);
  return nodes.map((node) => {
    const axes = positionAxesByNodeId.get(node.id) || { x: false, y: false };
    const autoPosition = autoPositions.get(node.id);
    if (!autoPosition || (axes.x && axes.y)) return node;
    return {
      ...node,
      position: {
        x: axes.x ? node.position.x : autoPosition.x,
        y: axes.y ? node.position.y : autoPosition.y
      }
    };
  });
}

function graphNodeTemplateRequest(value, data) {
  const templateId = typeof value.templateId === "string" && value.templateId.trim() ? value.templateId.trim() : typeof data.templateId === "string" ? data.templateId.trim() : "";
  const templateQuery =
    typeof value.templateQuery === "string" && value.templateQuery.trim()
      ? value.templateQuery.trim()
      : typeof data.templateQuery === "string" && data.templateQuery.trim()
        ? data.templateQuery.trim()
        : typeof value.templateTitle === "string" && value.templateTitle.trim()
          ? value.templateTitle.trim()
          : typeof data.templateTitle === "string" && data.templateTitle.trim()
            ? data.templateTitle.trim()
            : "";
  return { templateId, templateQuery };
}

function findTemplateForGraphNode(value, data, templates, index) {
  if (!Array.isArray(templates) || templates.length === 0) return { template: null, match: "" };
  const { templateId, templateQuery } = graphNodeTemplateRequest(value, data);
  if (templateId) {
    const template = templates.find((item) => item.id === templateId);
    if (!template) throw new HttpError(400, `nodes[${index}].templateId does not match a saved node template`);
    return { template, match: "templateId" };
  }
  if (templateQuery) {
    const template = findTemplateByQuery(templates, templateQuery);
    return { template, match: template ? "templateQuery" : "" };
  }
  const title = typeof value.title === "string" && value.title.trim() ? value.title.trim() : typeof data.title === "string" && data.title.trim() ? data.title.trim() : "";
  const template = title ? templates.find((item) => normalizeTemplateQuery(item.title) === normalizeTemplateQuery(title)) : null;
  return { template: template || null, match: template ? "title" : "" };
}

function normalizeGraphNode(value, index, layout, usedNodeIds, templates = [], reusedTemplates = []) {
  if (!isObject(value)) throw new HttpError(400, `nodes[${index}] must be an object`);
  const explicitId = typeof value.id === "string" && value.id.trim() ? value.id.trim() : "";
  const id = explicitId || generatedGraphId("node", index, usedNodeIds);
  if (usedNodeIds.has(id)) throw new HttpError(400, `Duplicate node id: ${id}`);
  usedNodeIds.add(id);

  const rawData = isObject(value.data) ? value.data : {};
  const { codexMode: _codexMode, planMode: _planMode, ...data } = rawData;
  const { template, match } = findTemplateForGraphNode(value, data, templates, index);
  const width = optionalDimension(value.width);
  const height = optionalDimension(value.height);
  const title = typeof value.title === "string" && value.title.trim() ? value.title.trim() : typeof data.title === "string" && data.title.trim() ? data.title.trim() : template?.title || "";
  const body = typeof value.body === "string" && value.body.trim() ? value.body : typeof data.body === "string" && data.body.trim() ? data.body : template?.body || "";
  const attachments = Array.isArray(value.attachments)
    ? value.attachments.map(normalizeAttachment)
    : Array.isArray(data.attachments)
      ? data.attachments.map(normalizeAttachment)
      : template
        ? template.attachments.map(normalizeAttachment)
        : [];
  if (template) {
    reusedTemplates.push({
      nodeId: id,
      templateId: template.id,
      templateTitle: template.title,
      match
    });
  }
  return {
    id,
    type: "task",
    position: normalizeGraphNodePosition(value, index, layout),
    ...(width ? { width } : {}),
    ...(height ? { height } : {}),
    data: {
      ...data,
      ...(template
        ? {
            templateId: template.id,
            templateTitle: template.title
          }
        : {}),
      title,
      body,
      attachments,
      effort: normalizeEffort(value.effort || data.effort),
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

function buildScatterPageFromGraph(value, index, args, projectPath, templates = [], reusedTemplates = [], projectGuidanceNodes = []) {
  const page = isObject(value) ? value : {};
  const now = nowIso();
  const graphType = normalizeGraphType(args?.graphType);
  const layout = normalizeGraphLayout(page.layout || args?.layout || defaultGraphLayoutForType(graphType));
  const rawNodes = Array.isArray(page.nodes) ? page.nodes : [];
  if (rawNodes.length === 0) throw new HttpError(400, `pages[${index}].nodes must contain at least one node`);
  const guidanceNodes = softwareProductGuidanceNodes(projectPath, graphType, index, rawNodes);
  const rawNodeInputs = [...rawNodes, ...guidanceNodes];
  const usedNodeIds = new Set();
  const nodes = rawNodeInputs.map((node, nodeIndex) => normalizeGraphNode(node, nodeIndex, layout, usedNodeIds, templates, reusedTemplates));
  const positionAxesByNodeId = new Map(nodes.map((node, nodeIndex) => [node.id, graphNodePositionAxes(rawNodeInputs[nodeIndex])]));
  const nodeIds = new Set(nodes.map((node) => node.id));
  const usedEdgeIds = new Set();
  const usedTargetIds = new Set();
  const usedConnectionPairs = new Set();
  const rawEdges = Array.isArray(page.edges) ? page.edges : [];
  const autoEdgeIds = new Set(rawEdges.map((edge) => (typeof edge?.id === "string" && edge.id.trim() ? edge.id.trim() : "")).filter(Boolean));
  const autoGuidanceEdges =
    guidanceNodes.length && nodes.length > guidanceNodes.length
      ? guidanceNodes.map((node, guidanceIndex) => ({
          id: projectGuidanceEdgeId(guidanceIndex, autoEdgeIds),
          source: nodes[0].id,
          target: node.id
        }))
      : [];
  const edges = [...rawEdges, ...autoGuidanceEdges].map((edge, edgeIndex) => normalizeGraphEdge(edge, edgeIndex, nodeIds, usedEdgeIds, usedTargetIds, usedConnectionPairs));
  const layoutedNodes = applyGraphAutoLayout(nodes, edges, layout, positionAxesByNodeId);
  guidanceNodes.forEach((node) => {
    projectGuidanceNodes.push({
      pageIndex: index,
      nodeId: node.id,
      fileName: node.data.projectGuidanceFile
    });
  });
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
    nodes: layoutedNodes,
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
  return withProjectWriteLock(projectPath, async () => {
    const mode = normalizeGraphWriteMode(args?.mode);
    const existingDocument = await readScatterDocument(projectPath);
    const reusedTemplates = [];
    const projectGuidanceNodes = [];
    const templates = args?.reuseTemplates === false ? [] : await readNodeTemplates();
    const incomingPages = graphPageInputs(args).map((page, index) =>
      buildScatterPageFromGraph(page, index, args, projectPath, templates, reusedTemplates, projectGuidanceNodes)
    );
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
    const documentRevision = bumpProjectDocumentRevision(projectPath);

    await rememberProjectBestEffort(projectPath, {
      name: document.projectName,
      updatedAt: document.updatedAt
    });

    return { document, documentRevision, reusedTemplates, projectGuidanceNodes };
  });
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

function openAttemptId() {
  return `open-${Date.now().toString(36)}-${crypto.randomBytes(6).toString("hex")}`;
}

const STARTUP_STAGE_RANK = new Map([
  ["starting", 0],
  ["connecting_bridge", 1],
  ["connecting_session", 2],
  ["hydrating_project", 3],
  ["ready", 4],
  ["failed", 5]
]);

function normalizeStartupStage(value, fallback = "starting") {
  return typeof value === "string" && STARTUP_STAGE_RANK.has(value) ? value : fallback;
}

function newOpenAttempt(session, targetDisplayMode = "fullscreen") {
  const attempt = {
    id: openAttemptId(),
    sessionId: session.id,
    threadId: session.codexThreadId || null,
    targetDisplayMode,
    status: "opening",
    stage: "starting",
    createdAt: nowIso(),
    updatedAt: nowIso(),
    instances: new Map(),
    waiters: []
  };
  session.openAttempts.set(attempt.id, attempt);
  session.currentOpenAttemptId = attempt.id;
  appendOpenAttemptLifecycle("canvasight_open_attempt_created", {
    openAttemptId: attempt.id,
    sessionId: session.id,
    threadId: attempt.threadId,
    targetDisplayMode
  });
  return attempt;
}

async function createSession({ projectPath, language, threadId, targetDisplayMode = null }) {
  const id = sessionId();
  const resolvedThreadId = optionalThreadId(threadId) || optionalThreadId(process.env.CODEX_THREAD_ID);
  const resolvedProjectPath = await resolveSessionProjectPath(projectPath, resolvedThreadId, {
    // Native widgets must never silently open the daemon's default project
    // when Codex cannot read the active task. That fallback caused unrelated
    // project windows to show and run the same .scatter workspace.
    requireThreadProject: targetDisplayMode === "fullscreen"
  });
  const session = {
    id,
    projectPath: resolvedProjectPath,
    language: normalizeLanguage(language),
    codexThreadId: resolvedThreadId,
    documentRevision: projectDocumentRevision(resolvedProjectPath),
    createdAt: nowIso(),
    runQueue: [],
    waiters: [],
    openAttempts: new Map(),
    currentOpenAttemptId: null
  };
  sessions.set(id, session);
  if (session.codexThreadId) rememberThreadClaim(session, session.codexThreadId);
  if (targetDisplayMode) newOpenAttempt(session, targetDisplayMode);
  return session;
}

function summarizeOpenAttempt(attempt) {
  if (!attempt) return null;
  return {
    openAttemptId: attempt.id,
    sessionId: attempt.sessionId,
    threadId: attempt.threadId,
    targetDisplayMode: attempt.targetDisplayMode,
    status: attempt.status,
    stage: attempt.stage,
    createdAt: attempt.createdAt,
    updatedAt: attempt.updatedAt,
    instances: Array.from(attempt.instances.values()).map((instance) => ({ ...instance }))
  };
}

function sessionInfo(session) {
  return {
    codexThreadId: session.codexThreadId,
    threadClaimedAt: session.threadClaimedAt || null,
    documentRevision: projectDocumentRevision(session.projectPath),
    language: session.language,
    projectPath: session.projectPath,
    sessionId: session.id,
    openAttempt: summarizeOpenAttempt(session.openAttempts.get(session.currentOpenAttemptId))
  };
}

function openAttemptResult(session, attempt, instance, value = {}) {
  const status = value.status === "failed" ? "failed" : value.status === "timeout" ? "timeout" : "ready";
  return {
    status,
    verified: status === "ready",
    openAttemptId: attempt?.id || value.openAttemptId || "",
    sessionId: session.id,
    threadId: attempt?.threadId || session.codexThreadId || null,
    projectPath: session.projectPath,
    widgetInstanceId: instance?.widgetInstanceId || value.widgetInstanceId || null,
    displayMode: instance?.displayMode || value.displayMode || null,
    stage: normalizeStartupStage(value.stage, status === "ready" ? "ready" : "failed"),
    reactMounted: instance?.reactMounted === true || value.reactMounted === true,
    projectHydrated: instance?.projectHydrated === true || value.projectHydrated === true,
    canvasRendered: instance?.canvasRendered === true || value.canvasRendered === true,
    canvasVisible: instance?.canvasVisible === true || value.canvasVisible === true,
    canvasWidth: instance?.canvasWidth || value.canvasWidth || 0,
    canvasHeight: instance?.canvasHeight || value.canvasHeight || 0,
    error: (status === "failed" || status === "timeout") && typeof value.error === "string" ? value.error : null,
    reportedAt: value.reportedAt || instance?.reportedAt || nowIso()
  };
}

function completeOpenAttemptWaiter(waiter, result) {
  clearTimeout(waiter.timer);
  if (waiter.abortSignal && waiter.abortHandler) {
    waiter.abortSignal.removeEventListener("abort", waiter.abortHandler);
  }
  waiter.resolve(result);
}

function detachOpenAttemptWaiter(attempt, waiter) {
  clearTimeout(waiter.timer);
  if (waiter.abortSignal && waiter.abortHandler) {
    waiter.abortSignal.removeEventListener("abort", waiter.abortHandler);
  }
  const index = attempt.waiters.indexOf(waiter);
  if (index >= 0) attempt.waiters.splice(index, 1);
}

function requireOpenAttempt(session, attemptId) {
  const attempt = session.openAttempts.get(typeof attemptId === "string" ? attemptId : "");
  if (!attempt) throw new HttpError(409, "Canvasight open attempt does not match this session.", "open_attempt_mismatch");
  if (attempt.sessionId !== session.id) throw new HttpError(409, "Canvasight open attempt session mismatch.", "open_attempt_session_mismatch");
  return attempt;
}

function registerOpenAttemptInstance(session, identity = {}) {
  const attempt = requireOpenAttempt(session, identity.openAttemptId);
  const widgetInstanceId = typeof identity.widgetInstanceId === "string" ? identity.widgetInstanceId.trim() : "";
  if (!widgetInstanceId) throw new HttpError(400, "widgetInstanceId is required.", "missing_widget_instance_id");
  if (attempt.threadId && identity.threadId && identity.threadId !== attempt.threadId) {
    throw new HttpError(409, "Canvasight widget belongs to a different Codex task.", "widget_thread_mismatch");
  }
  const incomingStage = normalizeStartupStage(identity.startupStage);
  const existing = attempt.instances.get(widgetInstanceId);
  if (existing && STARTUP_STAGE_RANK.get(incomingStage) < STARTUP_STAGE_RANK.get(existing.stage)) return { attempt, instance: existing };
  if (existing?.stage === "failed" || existing?.stage === "ready") return { attempt, instance: existing };
  const instance = {
    widgetInstanceId,
    displayMode: typeof identity.displayMode === "string" ? identity.displayMode : existing?.displayMode || "unknown",
    stage: incomingStage,
    reactMounted: identity.reactMounted === true || existing?.reactMounted === true,
    projectHydrated: identity.projectHydrated === true || existing?.projectHydrated === true,
    canvasRendered: identity.canvasRendered === true || existing?.canvasRendered === true,
    canvasVisible: identity.canvasVisible === true || existing?.canvasVisible === true,
    canvasWidth: Math.max(0, toNumber(identity.canvasWidth, existing?.canvasWidth || 0)),
    canvasHeight: Math.max(0, toNumber(identity.canvasHeight, existing?.canvasHeight || 0)),
    registeredAt: existing?.registeredAt || nowIso(),
    reportedAt: nowIso(),
    error: typeof identity.error === "string" ? identity.error : existing?.error || null
  };
  attempt.instances.set(widgetInstanceId, instance);
  if (STARTUP_STAGE_RANK.get(instance.stage) >= STARTUP_STAGE_RANK.get(attempt.stage)) attempt.stage = instance.stage;
  attempt.updatedAt = nowIso();
  appendOpenAttemptLifecycle("canvasight_widget_instance_stage", {
    openAttemptId: attempt.id,
    sessionId: session.id,
    threadId: attempt.threadId,
    widgetInstanceId,
    displayMode: instance.displayMode,
    stage: instance.stage
  });
  return { attempt, instance };
}

function assertVerifiedFullscreenInstance(attempt, instance) {
  if (instance.displayMode !== attempt.targetDisplayMode || instance.displayMode !== "fullscreen") {
    throw new HttpError(409, "Only the fullscreen Canvasight instance can become ready or Run.", "fullscreen_instance_required");
  }
  if (!instance.reactMounted || !instance.projectHydrated || !instance.canvasRendered || !instance.canvasVisible || instance.canvasWidth <= 0 || instance.canvasHeight <= 0) {
    throw new HttpError(409, "Canvasight fullscreen instance is missing required ready evidence.", "widget_ready_evidence_incomplete");
  }
}

function setOpenAttemptReady(session, value) {
  const { attempt, instance } = registerOpenAttemptInstance(session, {
    ...value,
    startupStage: value.status === "ready" ? "hydrating_project" : "failed"
  });
  if (value.status === "ready") {
    assertVerifiedFullscreenInstance(attempt, instance);
    instance.stage = "ready";
    attempt.status = "ready";
    attempt.stage = "ready";
  } else {
    instance.stage = "failed";
    instance.error = typeof value.error === "string" ? value.error : "Canvasight widget failed to start.";
    if (instance.displayMode === "fullscreen") {
      attempt.status = "failed";
      attempt.stage = "failed";
    }
  }
  instance.reportedAt = nowIso();
  attempt.updatedAt = instance.reportedAt;
  const result = openAttemptResult(session, attempt, instance, value);
  if (instance.displayMode === "fullscreen") {
    const matched = attempt.waiters.filter((waiter) => !waiter.widgetInstanceId || waiter.widgetInstanceId === instance.widgetInstanceId);
    attempt.waiters = attempt.waiters.filter((waiter) => !matched.includes(waiter));
    for (const waiter of matched) completeOpenAttemptWaiter(waiter, result);
  }
  appendOpenAttemptLifecycle(`canvasight_open_attempt_${result.status}`, result);
  return result;
}

function waitForOpenAttemptReady(sessionIdValue, openAttemptIdValue, timeoutMs, options = {}) {
  const session = sessions.get(sessionIdValue);
  const threadId = optionalThreadId(options.threadId);
  if (!session) {
    return Promise.resolve({
      status: "failed",
      verified: false,
      openAttemptId: openAttemptIdValue || "",
      sessionId: sessionIdValue || "",
      threadId,
      projectPath: null,
      stage: "failed",
      reactMounted: false,
      error: "Canvasight session not found.",
      reportedAt: nowIso()
    });
  }
  const attempt = session.openAttempts.get(openAttemptIdValue);
  if (!attempt) {
    return Promise.resolve(openAttemptResult(session, null, null, {
      status: "failed",
      openAttemptId: openAttemptIdValue,
      stage: "failed",
      error: "Canvasight open attempt not found."
    }));
  }
  if (threadId && session.codexThreadId && threadId !== session.codexThreadId) {
    return Promise.resolve(openAttemptResult(session, attempt, null, { status: "failed", stage: "failed", error: "Canvasight widget belongs to a different Codex task." }));
  }
  if (attempt.threadId && threadId !== attempt.threadId) {
    return Promise.resolve(openAttemptResult(session, attempt, null, { status: "failed", stage: "failed", error: "Canvasight open attempt belongs to a different Codex task." }));
  }
  const requestedInstanceId = typeof options.widgetInstanceId === "string" ? options.widgetInstanceId.trim() : "";
  const readyInstance = Array.from(attempt.instances.values()).find((instance) =>
    instance.stage === "ready" && instance.displayMode === "fullscreen" && (!requestedInstanceId || instance.widgetInstanceId === requestedInstanceId)
  );
  if (readyInstance) return Promise.resolve(openAttemptResult(session, attempt, readyInstance));
  if (attempt.status === "failed") {
    const failedInstance = Array.from(attempt.instances.values()).find((instance) => instance.displayMode === "fullscreen" && instance.stage === "failed");
    return Promise.resolve(openAttemptResult(session, attempt, failedInstance, { status: "failed", error: failedInstance?.error || "Canvasight fullscreen instance failed." }));
  }

  const timeout = Math.max(1, Math.min(toNumber(timeoutMs, 15_000), 300_000));
  return new Promise((resolve) => {
    const waiter = {
      resolve,
      timer: setTimeout(() => {
        detachOpenAttemptWaiter(attempt, waiter);
        resolve(openAttemptResult(session, attempt, null, { status: "timeout", stage: attempt.stage, error: `Canvasight fullscreen widget did not report ready within ${timeout}ms.` }));
      }, timeout)
    };
    if (options.abortSignal) {
      waiter.abortSignal = options.abortSignal;
      waiter.abortHandler = () => {
        detachOpenAttemptWaiter(attempt, waiter);
        resolve(openAttemptResult(session, attempt, null, { status: "failed", stage: attempt.stage, error: "Canvasight widget ready wait was cancelled." }));
      };
      options.abortSignal.addEventListener("abort", waiter.abortHandler, { once: true });
    }
    waiter.widgetInstanceId = requestedInstanceId || null;
    attempt.waiters.push(waiter);
  });
}

function getSession(id) {
  const session = sessions.get(id);
  if (!session) throw new HttpError(404, "Session not found");
  return session;
}

function projectThreadClaimKey(projectPath) {
  return path.resolve(projectPath);
}

function sessionsForProject(projectPath) {
  const resolved = path.resolve(projectPath);
  return Array.from(sessions.values()).filter((session) => path.resolve(session.projectPath) === resolved);
}

function sessionSortTime(session) {
  return Date.parse(session.threadClaimedAt || session.createdAt || "") || 0;
}

function newestSessionForProject(projectPath) {
  return sessionsForProject(projectPath).sort((a, b) => sessionSortTime(b) - sessionSortTime(a))[0] || null;
}

function rememberThreadClaim(session, threadId) {
  const claimedAt = nowIso();
  session.codexThreadId = threadId;
  session.threadClaimedAt = claimedAt;
  projectThreadClaims.set(projectThreadClaimKey(session.projectPath), {
    projectPath: session.projectPath,
    sessionId: session.id,
    threadId,
    claimedAt
  });
  return claimedAt;
}

function resolvedThreadClaim(projectPath) {
  const claim = projectThreadClaims.get(projectThreadClaimKey(projectPath));
  if (claim) {
    const session = sessions.get(claim.sessionId);
    if (session && path.resolve(session.projectPath) === path.resolve(projectPath) && session.codexThreadId === claim.threadId) {
      return {
        claim,
        session
      };
    }
  }
  const newestClaimed = sessionsForProject(projectPath)
    .filter((session) => session.codexThreadId)
    .sort((a, b) => sessionSortTime(b) - sessionSortTime(a))[0];
  if (!newestClaimed) return null;
  return {
    claim: {
      projectPath: newestClaimed.projectPath,
      sessionId: newestClaimed.id,
      threadId: newestClaimed.codexThreadId,
      claimedAt: newestClaimed.threadClaimedAt || newestClaimed.createdAt
    },
    session: newestClaimed
  };
}

async function claimThreadForProject({ projectPath, sessionId, language, threadId }) {
  const resolvedThreadId = optionalThreadId(threadId) || optionalThreadId(process.env.CODEX_THREAD_ID);
  if (!resolvedThreadId) {
    throw new HttpError(400, "Cannot claim Canvasight without a current Codex thread id.", "missing_thread_id");
  }

  let targetSession = sessionId ? getSession(sessionId) : null;
  const resolvedProjectPath =
    optionalProjectPath(projectPath) ||
    targetSession?.projectPath ||
    (await resolveSessionProjectPath(null, resolvedThreadId, { requireThreadProject: Boolean(resolvedThreadId) }));
  if (targetSession && path.resolve(targetSession.projectPath) !== path.resolve(resolvedProjectPath)) {
    targetSession = null;
  }
  const projectSessions = sessionsForProject(resolvedProjectPath);
  if (!targetSession) targetSession = newestSessionForProject(resolvedProjectPath);
  if (!targetSession) {
    targetSession = await createSession({
      projectPath: resolvedProjectPath,
      language,
      threadId: resolvedThreadId
    });
    projectSessions.push(targetSession);
  }

  const claimedSessionIds = [];
  for (const session of projectSessions) {
    if (path.resolve(session.projectPath) !== path.resolve(resolvedProjectPath)) continue;
    rememberThreadClaim(session, resolvedThreadId);
    claimedSessionIds.push(session.id);
  }
  if (!claimedSessionIds.includes(targetSession.id)) {
    rememberThreadClaim(targetSession, resolvedThreadId);
    claimedSessionIds.push(targetSession.id);
  }

  const claim = projectThreadClaims.get(projectThreadClaimKey(targetSession.projectPath));
  return {
    status: "claimed",
    projectPath: targetSession.projectPath,
    sessionId: targetSession.id,
    claimedSessionIds,
    codexThreadId: resolvedThreadId,
    claimedAt: claim?.claimedAt || targetSession.threadClaimedAt || nowIso(),
    session: sessionInfo(targetSession)
  };
}

function normalizeAgentTeamPayload(value) {
  const agentTeam = isObject(value) ? value : {};
  const enabled = agentTeam.enabled === true;
  const recommendedRoles = Array.isArray(agentTeam.recommendedRoles)
    ? agentTeam.recommendedRoles
        .filter((role) => isObject(role))
        .map((role) => ({
          id: typeof role.id === "string" && AGENT_TEAM_ROLE_IDS.has(role.id) ? role.id : "",
          label: typeof role.label === "string" ? role.label : "",
          reason: typeof role.reason === "string" ? role.reason : ""
        }))
        .filter((role) => role.id && role.label)
    : [];
  return {
    enabled,
    skillName: "canvasight-agent-team",
    recommendedRoles: enabled ? recommendedRoles : [],
    reportProtocol: {
      root: "agent-reports",
      roster: "ROSTER.md",
      schema: "references/agent-team-schema.json",
      statuses: AGENT_TEAM_STATUS_FLOW
    }
  };
}

function disabledAgentTeamAgentsMdResult(projectPath, reason) {
  return {
    status: "skipped",
    reason,
    path: projectPath ? path.join(projectPath, "AGENTS.md") : null
  };
}

function agentTeamTimestamp() {
  return nowIso().replace(/\.\d{3}Z$/, "Z");
}

function initialAgentTeamRoster(agentTeam) {
  const timestamp = agentTeamTimestamp();
  const roleNames = Array.from(
    new Set(agentTeam.recommendedRoles.map((role) => AGENT_TEAM_ROLE_NAMES[role.id]).filter(Boolean))
  );
  const roles = (roleNames.length ? roleNames : ["Product Agent"]).map((role) => [
    `  - role: ${role}`,
    "    status: missing",
    "    agent_id: null",
    "    thread_id: null",
    `    created_at: ${timestamp}`,
    `    last_seen: ${timestamp}`,
    "    handoff_source: AGENTS.md",
    "    last_report: AGENTS.md",
    "    rebuild_on_new_thread: true",
    "    replaced_by: null",
    "    notes: Created by Canvasight; assign only when this role is needed."
  ].join("\n"));
  return `# Canvasight Agent Team Roster\n\nThis registry stores role-seat runtime mappings. Issue reports remain authoritative for issue ownership.\n\n\`\`\`yaml\nschema_version: 1\nroles:\n${roles.join("\n")}\n\`\`\`\n`;
}

async function ensureAgentTeamRoster(projectPath, agentTeam, agentsMd) {
  const rosterPath = path.join(projectPath, "ROSTER.md");
  if (!agentTeam.enabled) return { status: "skipped", reason: "agent_team_disabled", path: rosterPath };
  if (agentsMd.status === "skipped" || agentsMd.status === "failed") {
    return { status: "skipped", reason: "agents_md_unavailable", path: rosterPath };
  }
  try {
    await fsp.access(rosterPath);
    return { status: "unchanged", reason: "existing_roster", path: rosterPath };
  } catch (error) {
    if (error?.code !== "ENOENT") return { status: "failed", reason: "read_failed", path: rosterPath, error: error?.message || String(error) };
  }
  try {
    await fsp.writeFile(rosterPath, initialAgentTeamRoster(agentTeam), "utf8");
    return { status: "created", reason: "missing_roster", path: rosterPath };
  } catch (error) {
    return { status: "failed", reason: "write_failed", path: rosterPath, error: error?.message || String(error) };
  }
}

async function ensureAgentTeamAgentsMd(projectPath, agentTeam) {
  const agentsPath = path.join(projectPath, "AGENTS.md");
  if (!agentTeam.enabled) return disabledAgentTeamAgentsMdResult(projectPath, "agent_team_disabled");

  try {
    await fsp.mkdir(projectPath, { recursive: true });
    let existing = "";
    let existed = true;
    try {
      existing = await fsp.readFile(agentsPath, "utf8");
    } catch (error) {
      if (error?.code !== "ENOENT") throw error;
      existed = false;
    }

    if (/canvasight-agent-team\s*:\s*(disable|disabled|off|false)/i.test(existing)) {
      return {
        status: "skipped",
        reason: "disabled_by_project",
        path: agentsPath
      };
    }

    const startIndex = existing.indexOf(AGENT_TEAM_AGENTS_MD_START);
    const endIndex = existing.indexOf(AGENT_TEAM_AGENTS_MD_END);
    if (startIndex >= 0 && endIndex > startIndex) {
      const before = existing.slice(0, startIndex).replace(/\s*$/, "");
      const after = existing.slice(endIndex + AGENT_TEAM_AGENTS_MD_END.length).replace(/^\s*/, "");
      const next = [before, AGENT_TEAM_AGENTS_MD_BLOCK, after].filter(Boolean).join("\n\n") + "\n";
      if (next !== existing) {
        await fsp.writeFile(agentsPath, next, "utf8");
        return {
          status: "updated",
          reason: "managed_block_refreshed",
          path: agentsPath
        };
      }
      return {
        status: "unchanged",
        reason: "managed_block_present",
        path: agentsPath
      };
    }

    const next = existed && existing.trim()
      ? `${existing.replace(/\s*$/, "")}\n\n${AGENT_TEAM_AGENTS_MD_BLOCK}\n`
      : `${AGENT_TEAM_AGENTS_MD_BLOCK}\n`;
    await fsp.writeFile(agentsPath, next, "utf8");
    return {
      status: existed ? "appended" : "created",
      reason: existed ? "missing_managed_block" : "missing_agents_md",
      path: agentsPath
    };
  } catch (error) {
    return {
      status: "failed",
      reason: "write_failed",
      path: agentsPath,
      error: error?.message || String(error)
    };
  }
}

function normalizeRunPayload(session, value) {
  const payload = isObject(value) ? value : {};
  const projectPath = typeof payload.projectPath === "string" && payload.projectPath ? path.resolve(payload.projectPath) : session.projectPath;
  const codexMode = normalizeCodexMode();
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
    runMode: normalizeRunMode(payload.runMode),
    agentTeam: normalizeAgentTeamPayload(payload.agentTeam),
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
  if (waiter.threadId && session.codexThreadId && waiter.threadId !== session.codexThreadId) return false;
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
    runMode: "flow",
    nodeIds: [],
    attachments: []
  };
}

async function enqueueRun(session, payload) {
  const normalized = normalizeRunPayload(session, payload);
  normalized.agentTeam.agentsMd = await ensureAgentTeamAgentsMd(normalized.projectPath, normalized.agentTeam);
  normalized.agentTeam.roster = await ensureAgentTeamRoster(normalized.projectPath, normalized.agentTeam, normalized.agentTeam.agentsMd);
  const sessionWaiterIndex = session.waiters.findIndex((candidate) => waiterMatches(candidate, session, normalized));
  const sessionWaiter = sessionWaiterIndex >= 0 ? session.waiters.splice(sessionWaiterIndex, 1)[0] : null;
  const waiter = sessionWaiter || globalRunWaiters.find((candidate) => waiterMatches(candidate, session, normalized));
  if (waiter) {
    detachWaiter(waiter);
    normalized.delivery = {
      status: "awaited",
      via: "await_canvasight_run",
      threadId: null
    };
    completeWaiter(waiter, normalized);
  } else {
    normalized.codexNative = {
      status: "pending",
      reason: "await_canvasight_run_required",
      threadId: session.codexThreadId || null,
      mode: normalized.codexMode
    };
    normalized.codexTurn = {
      status: "skipped",
      reason: "browser_fallback_requires_await",
      threadId: session.codexThreadId || null,
      mode: normalized.codexMode
    };
    normalized.delivery = {
      status: "queued",
      reason: "browser_fallback_requires_await",
      via: "await_canvasight_run",
      threadId: session.codexThreadId || null,
      codexNative: normalized.codexNative,
      codexTurn: normalized.codexTurn
    };
    session.runQueue.push(normalized);
  }
  return normalized;
}

async function prepareWidgetRun(session, payload) {
  const normalized = normalizeRunPayload(session, payload);
  normalized.agentTeam.agentsMd = await ensureAgentTeamAgentsMd(normalized.projectPath, normalized.agentTeam);
  normalized.agentTeam.roster = await ensureAgentTeamRoster(normalized.projectPath, normalized.agentTeam, normalized.agentTeam.agentsMd);
  normalized.codexNative = await applyWidgetCodexMode(session, normalized);
  normalized.codexTurn = {
    status: "skipped",
    reason: "widget_bridge_sendMessage",
    threadId: normalized.codexNative.threadId || null,
    mode: normalized.codexMode
  };
  normalized.delivery = {
    status: "prepared",
    reason: "widget_bridge_mode_applied",
    via: "widget_bridge",
    threadId: normalized.codexNative.threadId || null,
    codexNative: normalized.codexNative,
    codexTurn: normalized.codexTurn
  };
  return normalized;
}

function queuedRunMatchesThread(run, threadId) {
  if (!threadId) return true;
  const runThreadId = run?.delivery?.threadId || run?.codexNative?.threadId || run?.codexTurn?.threadId || null;
  return !runThreadId || runThreadId === threadId;
}

function takeQueuedRun(sessionIdValue, projectPath, threadId = null) {
  if (sessionIdValue) {
    const session = sessions.get(sessionIdValue);
    if (!session) return null;
    if (projectPath) {
      const index = session.runQueue.findIndex(
        (run) => queuedRunMatchesThread(run, threadId) && path.resolve(run.projectPath || session.projectPath) === path.resolve(projectPath)
      );
      return index >= 0 ? session.runQueue.splice(index, 1)[0] : null;
    }
    const index = session.runQueue.findIndex((run) => queuedRunMatchesThread(run, threadId));
    return index >= 0 ? session.runQueue.splice(index, 1)[0] : null;
  }

  const resolvedProjectPath = optionalProjectPath(projectPath);
  for (const session of sessions.values()) {
    const index = session.runQueue.findIndex((run) => {
      if (!queuedRunMatchesThread(run, threadId)) return false;
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
  const threadId = optionalThreadId(options.threadId);
  const session = sessions.get(sessionIdValue);
  if (sessionIdValue && !session) {
    return Promise.resolve(closedRunPayload(sessionIdValue, projectPath));
  }
  const queued = takeQueuedRun(sessionIdValue || null, projectPath, threadId);
  if (queued) return Promise.resolve(queued);

  return new Promise((resolve) => {
    const waiter = {
      sessionId: sessionIdValue || null,
      projectPath,
      threadId,
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
  const claimKey = projectThreadClaimKey(session.projectPath);
  const claim = projectThreadClaims.get(claimKey);
  if (claim?.sessionId === sessionIdValue) projectThreadClaims.delete(claimKey);
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
      runMode: "flow",
      nodeIds: [],
      attachments: []
    });
  }
  for (const attempt of session.openAttempts.values()) {
    while (attempt.waiters.length) {
      completeOpenAttemptWaiter(
        attempt.waiters.shift(),
        openAttemptResult(session, attempt, null, {
          status: "failed",
          stage: "failed",
          error: "Canvasight session closed before the fullscreen widget became ready."
        })
      );
    }
  }
  return true;
}

function responseHeaders(headers = {}) {
  return {
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET, POST, DELETE, OPTIONS",
    "access-control-allow-headers": "content-type, x-canvasight-token, x-canvasight-open-attempt-id, x-canvasight-widget-instance-id, x-canvasight-startup-stage, x-canvasight-display-mode, x-canvasight-thread-id, x-canvasight-react-mounted",
    "access-control-allow-private-network": "true",
    ...headers
  };
}

function sendJson(res, statusCode, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(statusCode, responseHeaders({
    "content-type": "application/json; charset=utf-8",
    "content-length": Buffer.byteLength(body)
  }));
  res.end(body);
}

function sendNoContent(res) {
  res.writeHead(204, responseHeaders());
  res.end();
}

function sendText(res, statusCode, text, contentType = "text/plain; charset=utf-8") {
  res.writeHead(statusCode, responseHeaders({
    "content-type": contentType,
    "content-length": Buffer.byteLength(text)
  }));
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

function openExternalBrowser(url) {
  const explicit = process.env.CANVASIGHT_OPEN_EXTERNAL_BROWSER || process.env.CANVASIGHT_OPEN_BROWSER;
  if (explicit !== "1" && String(explicit).toLowerCase() !== "true") {
    return {
      status: "skipped",
      reason: "codex_in_app_browser_default"
    };
  }

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
  return {
    status: "opened",
    reason: "explicit_external_browser"
  };
}

let cachedInlineCanvasightApp = null;

function escapeInlineScript(source) {
  return source.replaceAll("</script", "<\\/script").replaceAll("</SCRIPT", "<\\/SCRIPT");
}

function escapeInlineStyle(source) {
  return source.replaceAll("</style", "<\\/style").replaceAll("</STYLE", "<\\/STYLE");
}

function inlineCanvasightApp() {
  if (cachedInlineCanvasightApp) return cachedInlineCanvasightApp;
  const indexPath = path.join(distRoot, "index.html");
  const indexHtml = fs.readFileSync(indexPath, "utf8");
  const scriptMatch = indexHtml.match(/<script[^>]+src="([^"]+)"[^>]*><\/script>/);
  const styleMatch = indexHtml.match(/<link[^>]+rel="stylesheet"[^>]+href="([^"]+)"[^>]*>/);
  if (!scriptMatch) throw new Error("Could not find Canvasight app bundle in dist/index.html.");
  const scriptPath = path.join(distRoot, scriptMatch[1].replace(/^\//, ""));
  const stylePath = styleMatch ? path.join(distRoot, styleMatch[1].replace(/^\//, "")) : "";
  cachedInlineCanvasightApp = {
    script: fs.readFileSync(scriptPath, "utf8"),
    style: stylePath ? fs.readFileSync(stylePath, "utf8") : ""
  };
  return cachedInlineCanvasightApp;
}

function canvasightWidgetConnectDomains(extraOrigins = []) {
  const domains = new Set();
  for (const origin of extraOrigins) {
    if (typeof origin === "string" && origin.startsWith("http://127.0.0.1:")) domains.add(origin);
    if (typeof origin === "string" && origin.startsWith("http://localhost:")) domains.add(origin);
  }
  if (httpState?.origin) domains.add(httpState.origin);
  const daemonState = readDaemonStateSync();
  if (daemonState?.origin) domains.add(daemonState.origin);
  domains.add("http://127.0.0.1:*");
  domains.add("http://localhost:*");
  return Array.from(domains);
}

function canvasightWidgetResourceMeta(extraOrigins = []) {
  const connectDomains = canvasightWidgetConnectDomains(extraOrigins);
  return {
    ui: {
      prefersBorder: false,
      csp: {
        connectDomains,
        frameDomains: connectDomains,
        resourceDomains: [...connectDomains, "data:", "blob:"]
      }
    },
    "openai/widgetDescription": "Canvasight native Codex widget shell for the project canvas.",
    "openai/widgetPrefersBorder": false,
    "openai/widgetCSP": {
      connect_domains: connectDomains,
      frame_domains: connectDomains,
      resource_domains: [...connectDomains, "data:", "blob:"]
    }
  };
}

function canvasightWidgetHtml() {
  const app = inlineCanvasightApp();
  const appScript = escapeInlineScript(app.script);
  const appStyle = escapeInlineStyle(app.style);
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Canvasight</title>
  <style id="canvasightAppStyles">${appStyle}</style>
  <style>
    html, body {
      width: 100%;
      height: 100%;
      margin: 0;
      overflow: hidden;
      background: #f7f7f7;
      color: #333;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }
    #canvasight-widget-root {
      position: fixed;
      inset: 0;
      min-width: 0;
      min-height: 0;
      background: #f7f7f7;
    }
    #root, #canvasight-frame {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      border: 0;
      background: #f7f7f7;
    }
    #canvasight-widget-status {
      position: absolute;
      left: 50%;
      top: 18px;
      z-index: 2;
      max-width: min(560px, calc(100% - 48px));
      transform: translateX(-50%);
      padding: 8px 12px;
      border: 1px solid rgba(0, 0, 0, 0.08);
      border-radius: 12px;
      background: rgba(255, 255, 255, 0.94);
      color: #666;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.12);
      font-size: 13px;
      line-height: 18px;
      pointer-events: none;
      opacity: 0;
      transition: opacity 160ms ease;
    }
    #canvasight-widget-status:not(:empty) {
      opacity: 1;
    }
    #canvasight-widget-status[data-tone="ok"] {
      color: #146c2e;
    }
    #canvasight-widget-status[data-tone="error"] {
      color: #a62626;
    }
  </style>
  <script>
    globalThis.__CANVASIGHT_WIDGET_SHELL__ = true;
    globalThis.__CANVASIGHT_WIDGET_SERVER_VERSION__ = ${JSON.stringify(SERVER_VERSION)};
  </script>
</head>
<body>
  <div id="canvasight-widget-root">
    <div id="root"></div>
    <div id="canvasight-widget-status" role="status" aria-live="polite">Starting Canvasight...</div>
  </div>
  <script>
    window.addEventListener("error", (event) => {
      const status = document.getElementById("canvasight-widget-status");
      if (!status) return;
      status.textContent = event.error?.message || event.message || "Canvasight module failed to start.";
      status.dataset.tone = "error";
    });
    window.addEventListener("unhandledrejection", (event) => {
      const status = document.getElementById("canvasight-widget-status");
      if (!status) return;
      status.textContent = event.reason?.message || String(event.reason || "Canvasight startup promise failed.");
      status.dataset.tone = "error";
    });
  </script>
  <script id="canvasightAppModule" type="module">${appScript}</script>
</body>
</html>`;
}

function messageField(value, keys) {
  if (!isObject(value)) return null;
  for (const key of keys) {
    if (typeof value[key] === "string" && value[key]) return value[key];
  }
  return null;
}

function turnConfirmationFromNotification(message, expected = {}) {
  if (!isObject(message) || Object.prototype.hasOwnProperty.call(message, "id")) return null;
  if (typeof message.method !== "string" || !CODEX_APP_SERVER_TURN_CONFIRMATION_METHODS.has(message.method)) return null;
  const params = isObject(message.params) ? message.params : {};
  const turn = isObject(params.turn) ? params.turn : null;
  const item = isObject(params.item) ? params.item : null;
  const threadId =
    messageField(params, ["threadId", "thread_id"]) ||
    messageField(turn, ["threadId", "thread_id"]) ||
    messageField(item, ["threadId", "thread_id"]) ||
    null;
  const turnId =
    messageField(params, ["turnId", "turn_id"]) ||
    messageField(turn, ["id", "turnId", "turn_id"]) ||
    messageField(item, ["turnId", "turn_id"]) ||
    null;
  const clientUserMessageId =
    messageField(params, ["clientUserMessageId", "client_user_message_id"]) ||
    messageField(turn, ["clientUserMessageId", "client_user_message_id"]) ||
    messageField(item, ["clientUserMessageId", "client_user_message_id"]) ||
    null;
  const expectedThreadId = expected.threadId || null;
  const expectedTurnId = expected.turnId || null;
  const expectedClientUserMessageId = expected.clientUserMessageId || null;
  const threadMatches = expectedThreadId && threadId === expectedThreadId;
  const turnMatches = expectedTurnId && turnId === expectedTurnId;
  const messageMatches = expectedClientUserMessageId && clientUserMessageId === expectedClientUserMessageId;

  if (expectedThreadId && threadId && threadId !== expectedThreadId) return null;
  if (expectedTurnId && turnId && turnId !== expectedTurnId) return null;
  if (expectedClientUserMessageId && clientUserMessageId && clientUserMessageId !== expectedClientUserMessageId) return null;
  if ((expectedThreadId || expectedTurnId || expectedClientUserMessageId) && !threadMatches && !turnMatches && !messageMatches) return null;

  return {
    method: message.method,
    threadId: threadId || expectedThreadId || null,
    turnId: turnId || expectedTurnId || null,
    clientUserMessageId: clientUserMessageId || expectedClientUserMessageId || null
  };
}

async function appServerRequestSequence(requests, options = {}) {
  const transports = codexAppServerTransports();
  const transport = transports[0];
  // Resolve once for the entire native operation. In particular, never retry a
  // Desktop request through PATH after its handshake or request fails: PATH may
  // point at an older CLI that cannot read this Desktop task's rollout format.
  const runtime = codexAppRuntime();
  const results = await appServerRequestSequenceViaTransport(requests, options, transport, runtime);
  Object.defineProperty(results, "canvasightAppServerTransport", {
    value: transport.kind,
    enumerable: false
  });
  Object.defineProperty(results, "canvasightCodexRuntime", {
    value: results.canvasightCodexRuntime || runtime,
    enumerable: false
  });
  return results;
}

function appServerRequestSequenceViaTransport(requests, { experimentalApi = false } = {}, transport, runtime) {
  const bin = runtime.bin;
  const args = transport.args;
  const timeoutMs = nativeCodexTimeoutMs();
  const confirmationTimeoutMs = nativeCodexConfirmationTimeoutMs();
  const requestFactories = Array.isArray(requests) ? requests : [];

  return new Promise((resolve, reject) => {
    const child = spawn(bin, args, {
      stdio: ["pipe", "pipe", "pipe"]
    });
    let stdout = "";
    let stderr = "";
    let settled = false;
    let initialized = false;
    let runtimeVersion = null;
    let currentRequest = null;
    let confirmationTimer = null;
    const results = [];
    const turnConfirmations = [];

    let timer = null;
    let timeoutLabel = "initialize";

    function resetTimer(label) {
      timeoutLabel = label;
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        const error = new Error(`Codex app-server ${timeoutLabel} timed out after ${timeoutMs}ms`);
        error.canvasightAppServerMethod = timeoutLabel;
        finish(error);
      }, timeoutMs);
    }

    function clearConfirmationTimer() {
      if (confirmationTimer) {
        clearTimeout(confirmationTimer);
        confirmationTimer = null;
      }
    }

    function decorateError(error) {
      if (!error || typeof error !== "object") return error;
      error.canvasightAppServerArgs = args.join(" ");
      error.canvasightAppServerTransport = transport.kind;
      error.canvasightAppServerPhase = initialized ? "request" : "initialize";
      error.canvasightCodexRuntimeBin = runtime.bin;
      error.canvasightCodexRuntimeSource = runtime.source;
      error.canvasightCodexRuntimeVersion = runtimeVersion;
      error.canvasightCodexRuntimeIsDesktop = runtime.isDesktop;
      if (stderr) error.canvasightAppServerStderr = stderr.slice(-4000);
      if (!error.canvasightAppServerMethod) error.canvasightAppServerMethod = timeoutLabel;
      return error;
    }

    function finish(error, value) {
      if (settled) return;
      settled = true;
      if (timer) clearTimeout(timer);
      clearConfirmationTimer();
      child.kill("SIGTERM");
      if (error) {
        reject(decorateError(error));
      } else {
        Object.defineProperty(value, "canvasightCodexRuntime", {
          value: { ...runtime, version: runtimeVersion },
          enumerable: false,
          configurable: true
        });
        resolve(value);
      }
    }

    function send(message) {
      child.stdin.write(`${JSON.stringify(message)}\n`);
    }

    function nextRequest() {
      if (results.length >= requestFactories.length) {
        finish(null, results);
        return;
      }
      const specFactory = requestFactories[results.length];
      let spec;
      try {
        spec = typeof specFactory === "function" ? specFactory(results) : specFactory;
      } catch (error) {
        finish(error);
        return;
      }
      if (!isObject(spec) || typeof spec.method !== "string" || !spec.method) {
        finish(new Error("Invalid Codex app-server request sequence item"));
        return;
      }
      currentRequest = {
        id: results.length + 2,
        method: spec.method,
        confirmTurnStart: Boolean(spec.confirmTurnStart),
        threadId: typeof spec.threadId === "string" && spec.threadId ? spec.threadId : isObject(spec.params) ? spec.params.threadId : null,
        clientUserMessageId:
          typeof spec.clientUserMessageId === "string" && spec.clientUserMessageId
            ? spec.clientUserMessageId
            : isObject(spec.params)
              ? spec.params.clientUserMessageId
              : null,
        pendingResult: null,
        pendingTurnId: null
      };
      resetTimer(spec.method);
      send({
        jsonrpc: "2.0",
        id: currentRequest.id,
        method: spec.method,
        params: isObject(spec.params) ? spec.params : {}
      });
    }

    function matchingConfirmation(request, turnId = null) {
      return (
        turnConfirmations.find((confirmation) => {
          if (request.threadId && confirmation.threadId && confirmation.threadId !== request.threadId) return false;
          if (turnId && confirmation.turnId && confirmation.turnId !== turnId) return false;
          if (request.clientUserMessageId && confirmation.clientUserMessageId && confirmation.clientUserMessageId !== request.clientUserMessageId) return false;
          return Boolean(
            (request.threadId && confirmation.threadId === request.threadId) ||
              (turnId && confirmation.turnId === turnId) ||
              (request.clientUserMessageId && confirmation.clientUserMessageId === request.clientUserMessageId)
          );
        }) || null
      );
    }

    function completeCurrentRequest(result, confirmation = null) {
      const finalResult = confirmation ? { ...result, canvasightConfirmation: confirmation } : result;
      results.push(finalResult);
      currentRequest = null;
      nextRequest();
    }

    function waitForTurnConfirmation(result) {
      const request = currentRequest;
      if (!request) return;
      request.pendingResult = result;
      request.pendingTurnId = turnIdFromResult(result);
      const confirmation = matchingConfirmation(request, request.pendingTurnId);
      if (confirmation) {
        completeCurrentRequest(result, confirmation);
        return;
      }
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      clearConfirmationTimer();
      confirmationTimer = setTimeout(() => {
        completeCurrentRequest(result, null);
      }, confirmationTimeoutMs);
    }

    function handleMessage(message) {
      if (!isObject(message)) return;
      if (!Object.prototype.hasOwnProperty.call(message, "id")) {
        const confirmation = turnConfirmationFromNotification(message, {
          threadId: currentRequest?.threadId || null,
          turnId: currentRequest?.pendingTurnId || null,
          clientUserMessageId: currentRequest?.clientUserMessageId || null
        });
        if (!confirmation) return;
        turnConfirmations.push(confirmation);
        if (currentRequest?.pendingResult) {
          const matched = matchingConfirmation(currentRequest, currentRequest.pendingTurnId);
          if (matched) {
            clearConfirmationTimer();
            completeCurrentRequest(currentRequest.pendingResult, matched);
          }
        }
        return;
      }
      if (message.id === 1) {
        if (message.error) {
          finish(new Error(message.error.message || "Codex app-server initialize failed"));
          return;
        }
        runtimeVersion = typeof message.result?.userAgent === "string" && message.result.userAgent.trim() ? message.result.userAgent.trim() : null;
        initialized = true;
        nextRequest();
        return;
      }
      if (currentRequest && message.id === currentRequest.id) {
        if (message.error) {
          const error = new Error(message.error.message || `Codex app-server ${currentRequest.method} failed`);
          error.canvasightAppServerMethod = currentRequest.method;
          finish(error);
        } else {
          const result = message.result || {};
          if (currentRequest.confirmTurnStart) {
            waitForTurnConfirmation(result);
          } else {
            completeCurrentRequest(result);
          }
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
    child.once("error", (error) => finish(error));
    child.once("exit", (code, signal) => {
      if (!settled) finish(new Error(`Codex app-server exited early: code=${code} signal=${signal} stderr=${stderr}`));
    });

    resetTimer("initialize");
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

function appServerRequest(method, params, { experimentalApi = false } = {}) {
  return appServerRequestSequence([{ method, params }], { experimentalApi }).then((results) => results[0] || {});
}

function codexCollaborationMode(mode, model) {
  const settings = { model };
  if (mode === "plan") settings.reasoning_effort = "medium";
  return {
    mode,
    settings
  };
}

function isRetryableThreadResumeError(error) {
  if (error?.canvasightAppServerMethod !== "thread/resume") return false;
  const message = String(error?.message || "");
  return /failed to read thread|rollout does not start with session metadata|thread-store internal error/i.test(message);
}

async function retryThreadResumeSequence(operation, attempts = 4) {
  let lastError = null;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (!isRetryableThreadResumeError(error) || attempt === attempts) throw error;
      await sleep(150 * 2 ** (attempt - 1));
    }
  }
  throw lastError;
}

async function setCodexChatMode(threadId) {
  return retryThreadResumeSequence(() =>
    appServerRequestSequence(
      [
        { method: "thread/resume", params: { threadId } },
        ([resumeResult]) => {
          const model = typeof resumeResult?.model === "string" && resumeResult.model ? resumeResult.model : "";
          if (!model) throw new Error("Codex thread/resume did not return a model for settings update");
          return {
            method: "thread/settings/update",
            params: { threadId, collaborationMode: codexCollaborationMode("default", model) }
          };
        }
      ],
      { experimentalApi: true }
    ).then((results) => ({
      result: results[1] || {},
      transport: results.canvasightAppServerTransport || "stdio_fallback",
      model: typeof results[0]?.model === "string" ? results[0].model : "",
      runtime: results.canvasightCodexRuntime || null
    }))
  );
}

function turnIdFromResult(result) {
  if (isObject(result?.turn) && typeof result.turn.id === "string") return result.turn.id;
  if (typeof result?.turnId === "string") return result.turnId;
  if (typeof result?.id === "string") return result.id;
  return null;
}

function codexRuntimeDiagnostics(runtime = {}) {
  return {
    runtimeBin: runtime.bin || runtime.path || null,
    runtimeSource: runtime.source || null,
    runtimeVersion: runtime.version || null,
    runtimeIsDesktop: runtime.isDesktop === true
  };
}

function codexNativeFailureDiagnostics(error) {
  const message = error?.message || "Codex native mode request failed";
  const runtime = {
    bin: error?.canvasightCodexRuntimeBin || null,
    source: error?.canvasightCodexRuntimeSource || null,
    version: error?.canvasightCodexRuntimeVersion || null,
    isDesktop: error?.canvasightCodexRuntimeIsDesktop === true
  };
  const threadStoreIncompatible = /failed to read thread|rollout does not start with session metadata|thread-store internal error/i.test(message);
  const desktopUnavailable = runtime.isDesktop && error?.canvasightAppServerPhase === "initialize";
  const errorCode = threadStoreIncompatible
    ? "thread_archive_incompatible"
    : desktopUnavailable
      ? "desktop_runtime_unavailable"
      : "codex_native_mode_request_failed";
  const userMessage =
    errorCode === "thread_archive_incompatible"
      ? `Canvasight could not read the current Desktop task archive with the selected runtime. Reload or restart Codex Desktop, create a new task, then reopen Canvasight. Diagnostic: ${message}`
      : errorCode === "desktop_runtime_unavailable"
        ? `Canvasight could not start the selected Desktop runtime. Reload or restart Codex Desktop, then reopen Canvasight. Diagnostic: ${message}`
        : message;
  return { error: userMessage, rawError: message, errorCode, ...codexRuntimeDiagnostics(runtime) };
}

async function applyCodexNativeMode(session, payload) {
  if (!nativeCodexEnabled()) {
    return {
      status: "disabled",
      reason: "native_direct_disabled",
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
    const nativeResult = await setCodexChatMode(session.codexThreadId);
    return {
      status: "applied",
      action: "thread/settings/update",
      threadId: session.codexThreadId,
      mode: "chat",
      collaborationMode: "default",
      transport: nativeResult.transport,
      codexModel: nativeResult.model,
      ...codexRuntimeDiagnostics(nativeResult.runtime)
    };
  } catch (error) {
    return {
      status: "failed",
      ...codexNativeFailureDiagnostics(error),
      transport: error?.canvasightAppServerTransport || null,
      transportPhase: error?.canvasightAppServerPhase || null,
      threadId: session.codexThreadId,
      mode: payload.codexMode
    };
  }
}

function codexNativeModeApplied(status) {
  return status === "applied" || status === "applied_chat";
}

async function applyWidgetCodexMode(session, payload) {
  const codexNative = await applyCodexNativeMode(session, payload);
  if (codexNative.status !== "applied") {
    if (isRetryableThreadResumeError({
      canvasightAppServerMethod: "thread/resume",
      message: codexNative.error
    })) {
      return {
        ...codexNative,
        status: "preflight_degraded_chat",
        reason: "thread_store_preflight_unavailable"
      };
    }
    const reason = codexNative.error || codexNative.reason || "Codex native mode was not applied";
    throw new HttpError(502, `Canvasight Run blocked before sendMessage: ${reason}`, {
      code: "codex_mode_not_applied",
      codexNative
    });
  }
  return {
    ...codexNative,
    status: "applied_chat"
  };
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
    res.writeHead(200, responseHeaders({
      "content-type": mimeFromPath(target),
      "content-length": stat.size
    }));
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
  res.writeHead(200, responseHeaders({
    "content-type": mimeFromPath(assetPath),
    "content-length": stat.size
  }));
  fs.createReadStream(assetPath).pipe(res);
}

async function handleSessionApi(req, res, url) {
  const match = url.pathname.match(/^\/api\/sessions\/([^/]+)(?:\/([^/]+))?$/);
  if (!match) return false;
  const session = getSession(decodeURIComponent(match[1]));
  const action = match[2] || "";
  const requestIdentity = {
    openAttemptId: req.headers["x-canvasight-open-attempt-id"],
    widgetInstanceId: req.headers["x-canvasight-widget-instance-id"],
    startupStage: req.headers["x-canvasight-startup-stage"],
    displayMode: req.headers["x-canvasight-display-mode"],
    threadId: req.headers["x-canvasight-thread-id"],
    reactMounted: req.headers["x-canvasight-react-mounted"] === "true"
  };
  if (session.currentOpenAttemptId && requestIdentity.openAttemptId) {
    registerOpenAttemptInstance(session, requestIdentity);
  }

  if (!action) {
    assertMethod(req, "GET");
    sendJson(res, 200, sessionInfo(session));
    return true;
  }

  if (action === "widget-ready") {
    if (req.method === "GET") {
      const attempt = session.openAttempts.get(session.currentOpenAttemptId);
      const instance = attempt?.instances.get(String(requestIdentity.widgetInstanceId || ""));
      sendJson(res, 200, instance?.stage === "ready" ? openAttemptResult(session, attempt, instance) : {
        status: "pending",
        verified: false,
        openAttemptId: attempt?.id || "",
        sessionId: session.id,
        threadId: session.codexThreadId || null,
        projectPath: session.projectPath,
        widgetInstanceId: instance?.widgetInstanceId || null,
        displayMode: instance?.displayMode || null,
        stage: instance?.stage || "starting",
        reactMounted: instance?.reactMounted === true,
        projectHydrated: instance?.projectHydrated === true,
        canvasRendered: instance?.canvasRendered === true,
        canvasVisible: instance?.canvasVisible === true,
        error: null,
        reportedAt: null
      });
      return true;
    }
    assertMethod(req, "POST");
    const body = await readJsonBody(req);
    if (body?.status !== "ready" && body?.status !== "failed") {
      throw new HttpError(400, "Widget ready status must be ready or failed.", "invalid_widget_ready_status");
    }
    sendJson(res, 200, setOpenAttemptReady(session, { ...requestIdentity, ...body }));
    return true;
  }

  if (action === "open-project") {
    assertMethod(req, "POST");
    const body = await readJsonBody(req);
    const projectPath = normalizeProjectPath(body.projectPath || session.projectPath);
    session.projectPath = projectPath;
    const openedProject = await openProject(projectPath);
    const documentRevision = projectDocumentRevision(projectPath);
    session.documentRevision = documentRevision;
    await rememberProjectBestEffort(projectPath, openedProject.project);
    sendJson(res, 200, {
      ...openedProject,
      documentRevision
    });
    return true;
  }

  if (action === "resolve-thread-project") {
    assertMethod(req, "POST");
    const body = await readJsonBody(req);
    // Do not inherit a session's previous thread here. A reopened Canvasight
    // page must use the task that opened it, otherwise its project resolution
    // and Run preflight can keep targeting an unrelated stale task.
    const threadId = optionalThreadId(body?.threadId) || optionalThreadId(process.env.CODEX_THREAD_ID);
    const explicitProjectPath = optionalProjectPath(body?.projectPath);
    // A session opened with an explicit project path already has an authoritative
    // .scatter location. Hydration may refresh its task claim, but must not
    // replace that folder by attempting a second thread/resume lookup.
    const projectPath = explicitProjectPath || session.projectPath || (await resolveSessionProjectPath(null, threadId, { requireThreadProject: Boolean(threadId) }));
    session.projectPath = projectPath;
    if (threadId) rememberThreadClaim(session, threadId);
    const openedProject = await openProject(projectPath);
    const documentRevision = projectDocumentRevision(projectPath);
    session.documentRevision = documentRevision;
    await rememberProjectBestEffort(projectPath, openedProject.project);
    sendJson(res, 200, {
      ...openedProject,
      documentRevision,
      session: sessionInfo(session)
    });
    return true;
  }

  if (action === "document") {
    assertMethod(req, "POST");
    const body = await readJsonBody(req);
    const projectPath = normalizeProjectPath(body.projectPath || session.projectPath);
    const { document, documentRevision } = await withProjectWriteLock(projectPath, async () => {
      assertCurrentDocumentRevision(projectPath, body.expectedRevision);
      const savedDocument = await writeScatterDocument(projectPath, body.document);
      const nextRevision = bumpProjectDocumentRevision(projectPath);
      return {
        document: savedDocument,
        documentRevision: nextRevision
      };
    });
    session.projectPath = projectPath;
    session.documentRevision = documentRevision;
    await rememberProjectBestEffort(projectPath, {
      name: document.projectName,
      updatedAt: document.updatedAt
    });
    sendJson(res, 200, {
      document,
      documentRevision
    });
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
    if (body?.deliveryMode === "widget_bridge_prepare") {
      const attempt = requireOpenAttempt(session, requestIdentity.openAttemptId);
      const instance = attempt.instances.get(String(requestIdentity.widgetInstanceId || ""));
      if (!instance || instance.stage !== "ready" || attempt.status !== "ready") {
        throw new HttpError(409, "Canvasight Run requires the verified fullscreen widget instance.", "widget_instance_not_ready");
      }
      assertVerifiedFullscreenInstance(attempt, instance);
      const prepared = await prepareWidgetRun(session, body);
      sendJson(res, 200, {
        status: "prepared",
        delivery: prepared.delivery,
        codexNative: prepared.codexNative,
        codexTurn: prepared.codexTurn,
        agentTeam: prepared.agentTeam
      });
      return true;
    }
    const queued = await enqueueRun(session, body);
    sendJson(res, 200, {
      status: queued.delivery?.status === "sent" ? "sent" : "queued",
      delivery: queued.delivery,
      codexNative: queued.codexNative,
      codexTurn: queued.codexTurn,
      agentTeam: queued.agentTeam
    });
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
        codexNativeEnabled: nativeCodexEnabled(),
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

    if (url.pathname === "/api/templates" || url.pathname.startsWith("/api/templates/")) {
      assertDaemonAuthorized(req, url);
      const templateId = url.pathname.startsWith("/api/templates/")
        ? decodeURIComponent(url.pathname.slice("/api/templates/".length))
        : "";
      if (templateId) {
        if (req.method === "GET") {
          sendJson(res, 200, getNodeTemplate(await readNodeTemplates(), templateId));
          return;
        }
        if (req.method === "DELETE") {
          sendJson(res, 200, await deleteNodeTemplate(templateId));
          return;
        }
        throw new HttpError(405, "Expected GET or DELETE");
      }
      if (req.method === "GET") {
        sendJson(res, 200, await readNodeTemplates());
        return;
      }
      if (req.method === "POST") {
        const body = await readJsonBody(req);
        const template = await createNodeTemplate(isObject(body.template) ? body.template : body, {
          replaceOldest: Boolean(body.replaceOldest)
        });
        sendJson(res, 200, template);
        return;
      }
      throw new HttpError(405, "Expected GET or POST");
    }

    if (url.pathname === "/api/graphs/write") {
      assertDaemonAuthorized(req, url);
      assertMethod(req, "POST");
      const body = await readJsonBody(req);
      const threadId = optionalThreadId(body?.threadId) || optionalThreadId(body?.args?.threadId);
      const projectPath = await resolveSessionProjectPath(body.projectPath || body?.args?.projectPath, threadId, { requireThreadProject: Boolean(threadId) });
      const { document, documentRevision, reusedTemplates, projectGuidanceNodes } = await writeScatterGraph(projectPath, body.args || body);
      sendJson(res, 200, {
        document,
        documentRevision,
        reusedTemplates,
        projectGuidanceNodes
      });
      return;
    }

    if (url.pathname === "/api/sessions/claim") {
      assertDaemonAuthorized(req, url);
      assertMethod(req, "POST");
      const body = await readJsonBody(req);
      const claimed = await claimThreadForProject({
        projectPath: body?.projectPath,
        sessionId: typeof body?.sessionId === "string" && body.sessionId ? body.sessionId : "",
        language: body?.language,
        threadId: body?.threadId
      });
      await rememberProjectBestEffort(claimed.projectPath);
      sendJson(res, 200, claimed);
      return;
    }

    if (url.pathname === "/api/sessions/resolve") {
      assertDaemonAuthorized(req, url);
      assertMethod(req, "POST");
      const body = await readJsonBody(req);
      const projectPath = normalizeProjectPath(body.projectPath || defaultProjectPath());
      const resolved = resolvedThreadClaim(projectPath);
      if (!resolved) {
        sendJson(res, 200, {
          status: "unbound",
          projectPath,
          session: null,
          claim: null
        });
        return;
      }
      sendJson(res, 200, {
        status: "resolved",
        projectPath,
        session: sessionInfo(resolved.session),
        claim: resolved.claim
      });
      return;
    }

    if (url.pathname === "/api/sessions") {
      assertDaemonAuthorized(req, url);
      assertMethod(req, "POST");
      const body = await readJsonBody(req);
      const session = await createSession({
        projectPath: typeof body?.projectPath === "string" && body.projectPath ? body.projectPath : null,
        language: body?.language,
        threadId: body?.threadId,
        targetDisplayMode: body?.targetDisplayMode === "fullscreen" ? "fullscreen" : null
      });
      const openedProject = await openProject(session.projectPath);
      session.documentRevision = projectDocumentRevision(session.projectPath);
      await rememberProjectBestEffort(session.projectPath, openedProject.project);
      sendJson(res, 200, {
        session: sessionInfo(session),
        project: openedProject.project,
        document: openedProject.document,
        documentRevision: session.documentRevision
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
          threadId: body?.threadId,
          abortSignal: abortController.signal
        }
      );
      res.off("close", abort);
      if (res.destroyed) return;
      sendJson(res, 200, run);
      return;
    }

    if (url.pathname === "/api/widget-ready/await") {
      assertDaemonAuthorized(req, url);
      assertMethod(req, "POST");
      const body = await readJsonBody(req);
      const sessionIdValue = typeof body?.sessionId === "string" ? body.sessionId.trim() : "";
      if (!sessionIdValue) throw new HttpError(400, "sessionId is required", "missing_session_id");
      const abortController = new AbortController();
      const abort = () => {
        if (!res.writableEnded) abortController.abort();
      };
      res.on("close", abort);
      const openAttemptIdValue = typeof body?.openAttemptId === "string" ? body.openAttemptId.trim() : "";
      if (!openAttemptIdValue) throw new HttpError(400, "openAttemptId is required", "missing_open_attempt_id");
      const result = await waitForOpenAttemptReady(sessionIdValue, openAttemptIdValue, body?.timeoutMs, {
        threadId: body?.threadId,
        widgetInstanceId: body?.widgetInstanceId,
        abortSignal: abortController.signal
      });
      res.off("close", abort);
      if (res.destroyed) return;
      sendJson(res, 200, result);
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
    sendJson(res, statusCode, {
      error: error?.message || "Internal server error",
      ...(error instanceof HttpError && error.code ? { code: error.code } : {})
    });
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
  if (isDaemonMode) await removeOwnedDaemonState();
}

function toolResult(structuredContent, text = "", meta) {
  return {
    content: [
      {
        type: "text",
        text: text || structuredContent.markdown || ""
      }
    ],
    structuredContent,
    ...(meta ? { _meta: meta } : {})
  };
}

function widgetResourceDescriptor() {
  return {
    uri: CANVASIGHT_WIDGET_URI,
    name: "canvasight-canvas-widget",
    title: "Canvasight",
    description: "Native Codex widget shell for the Canvasight project canvas.",
    mimeType: RESOURCE_MIME_TYPE,
    _meta: canvasightWidgetResourceMeta()
  };
}

function listCanvasightResources() {
  return {
    resources: [widgetResourceDescriptor()]
  };
}

async function readCanvasightResource(uri) {
  if (uri !== CANVASIGHT_WIDGET_URI) {
    throw new HttpError(404, `Unknown Canvasight resource: ${uri}`, "resource_not_found");
  }
  const daemon = await ensureDaemonServer();
  const meta = canvasightWidgetResourceMeta([daemon.origin]);
  return {
    contents: [
      {
        uri: CANVASIGHT_WIDGET_URI,
        mimeType: RESOURCE_MIME_TYPE,
        text: canvasightWidgetHtml(),
        _meta: meta
      }
    ]
  };
}

function canvasRoutingContext() {
  return {
    status: "active",
    activeCanvasContext: true,
    preferredTool: "write_canvasight_graph",
    preferredMode: "append-page",
    templateDiscoveryTool: "list_canvasight_node_templates",
    fullTemplateTool: "get_canvasight_node_template",
    templateLookup: "Call list_canvasight_node_templates with targeted queries before graph writing, then get_canvasight_node_template only for likely matches.",
    preferCanvasFor: [
      "medium_or_large_multi_step_requests",
      "product_or_feature_planning",
      "codebase_architecture_analysis",
      "article_or_document_structure_mapping",
      "task_plans_with_dependencies_or_risks"
    ],
    bypassCanvasFor: [
      "small_direct_commands",
      "simple_questions_or_explanations",
      "canvasight_run_payloads",
      "requests_that_explicitly_ask_for_direct_execution",
      "requests_that_explicitly_disable_canvas_use"
    ],
    userFacingInstruction:
      "Canvasight is now active for this project. For later medium or complex work, prepare or update an editable canvas page first when breakdown would help. Keep small direct tasks, Run payloads, and explicit direct-execution requests on their normal path.",
    instruction:
      "Canvasight is active for this project. For later medium or complex requests that benefit from decomposition, prefer creating or updating the canvas with write_canvasight_graph before direct execution. Do not force Canvasight for small direct tasks, Run payloads, or requests that ask to execute immediately."
  };
}

async function createBrowserSession(args) {
  const daemon = await ensureDaemonServer();
  const opened = await daemonJson(daemon, "/api/sessions", {
    method: "POST",
    body: JSON.stringify({
      projectPath: typeof args?.projectPath === "string" && args.projectPath ? args.projectPath : null,
      language: args?.language,
      threadId: args?.threadId || process.env.CODEX_THREAD_ID || null,
      targetDisplayMode: args?.targetDisplayMode === "fullscreen" ? "fullscreen" : null
    })
  });
  const session = opened.session;
  const url = daemonSessionUrl(daemon, session.sessionId);
  await waitForReachableUrl(url, "Canvasight browser session");
  return {
    daemon,
    opened,
    session,
    url
  };
}

function widgetToolMeta(widgetData) {
  return { widgetData };
}

const openCanvasightWidgetOutputSchema = {
  type: "object",
  properties: {
    status: { type: "string" },
    openAttemptId: { type: "string" },
    sessionId: { type: "string" },
    targetDisplayMode: { type: "string" },
    rendering: { type: "string" },
    widget: { type: "string" },
    canvasightHost: { type: "string" },
    openTarget: { type: "string" },
    projectPath: { type: ["string", "null"] },
    codexThreadId: { type: ["string", "null"] }
  },
  additionalProperties: true
};

const openCanvasightBrowserFallbackOutputSchema = {
  type: "object",
  properties: {
    status: { type: "string" },
    sessionId: { type: "string" },
    url: { type: "string" },
    browserUrl: { type: "string" },
    openTarget: { type: "string" },
    origin: { type: "string" },
    projectPath: { type: ["string", "null"] },
    codexThreadId: { type: ["string", "null"] }
  },
  additionalProperties: true
};

const canvasightRunOutputSchema = {
  type: "object",
  properties: {
    status: { type: "string" },
    sessionId: { type: "string" },
    threadName: { type: "string" },
    projectPath: { type: ["string", "null"] },
    markdown: { type: "string" },
    delivery: {
      type: "object",
      additionalProperties: true
    },
    codexNative: {
      type: "object",
      additionalProperties: true
    },
    codexTurn: {
      type: "object",
      additionalProperties: true
    }
  },
  additionalProperties: true
};

const looseObjectOutputSchema = {
  type: "object",
  additionalProperties: true
};

function publicWidgetOpenResult(widgetData) {
  return {
    status: widgetData.status,
    openAttemptId: widgetData.openAttemptId,
    rendering: widgetData.rendering,
    widget: widgetData.widget,
    sessionId: widgetData.sessionId,
    targetDisplayMode: widgetData.targetDisplayMode,
    canvasightHost: widgetData.canvasightHost,
    projectPath: widgetData.projectPath,
    codexThreadId: widgetData.codexThreadId,
    project: widgetData.project,
    language: widgetData.language,
    activeCanvasContext: widgetData.activeCanvasContext,
    canvasRouting: widgetData.canvasRouting,
    activeCanvasRouting: widgetData.activeCanvasRouting,
    openTarget: "codex_native_widget"
  };
}

async function toolRenderCanvasightCanvasWidget(args) {
  const threadId = requiredNativeThreadId(args?.threadId);
  const { daemon, opened, session, url } = await createBrowserSession({
    ...(args || {}),
    threadId,
    targetDisplayMode: "fullscreen"
  });
  const canvasRouting = canvasRoutingContext();
  const widgetData = {
    status: "opening",
    rendering: "native-widget",
    widget: "canvasight-canvas-widget",
    sessionId: session.sessionId,
    openAttemptId: session.openAttempt?.openAttemptId,
    targetDisplayMode: "fullscreen",
    apiBaseUrl: daemon.origin,
    canvasightHost: "widget",
    token: daemon.token || "",
    url,
    browserUrl: url,
    origin: daemon.origin,
    projectPath: session.projectPath,
    codexThreadId: session.codexThreadId,
    project: opened.project,
    language: session.language,
    activeCanvasContext: true,
    canvasRouting,
    activeCanvasRouting: canvasRouting
  };
  return toolResult(
    publicWidgetOpenResult(widgetData),
    [
      `Canvasight native widget session created for project: ${session.projectPath}. Await await_canvasight_widget_ready before reporting that the canvas is open.`,
      canvasRouting.userFacingInstruction
    ].join("\n\n"),
    widgetToolMeta(widgetData)
  );
}

async function toolOpenCanvasight(args) {
  return toolRenderCanvasightCanvasWidget(args);
}

async function toolOpenCanvasightBrowserFallback(args) {
  const { daemon, opened, session, url } = await createBrowserSession(args);
  const externalBrowser = openExternalBrowser(url);
  const canvasRouting = canvasRoutingContext();
  return toolResult(
    {
      status: "opened",
      sessionId: session.sessionId,
      url,
      browserUrl: url,
      openTarget: "codex_in_app_browser",
      externalBrowser,
      origin: daemon.origin,
      projectPath: session.projectPath,
      codexThreadId: session.codexThreadId,
      project: opened.project,
      language: session.language,
      activeCanvasContext: true,
      canvasRouting,
      activeCanvasRouting: canvasRouting
    },
    [
      `Canvasight browser fallback opened. Open this URL in the Codex in-app browser sidebar: ${url}`,
      canvasRouting.userFacingInstruction
    ].join("\n\n")
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

async function toolClaimCanvasightThread(args) {
  const threadId = optionalThreadId(args?.threadId) || optionalThreadId(process.env.CODEX_THREAD_ID);
  let projectPath = optionalProjectPath(args?.projectPath);
  if (!projectPath && typeof args?.sessionId !== "string") {
    projectPath = await resolveSessionProjectPath(null, threadId, { requireThreadProject: Boolean(threadId) });
  }
  const daemon = await ensureDaemonServer();
  const claimed = await daemonJson(daemon, "/api/sessions/claim", {
    method: "POST",
    body: JSON.stringify({
      projectPath,
      sessionId: typeof args?.sessionId === "string" && args.sessionId ? args.sessionId : "",
      language: args?.language,
      threadId
    })
  });
  const canvasRouting = canvasRoutingContext();
  return toolResult(
    {
      ...claimed,
      activeCanvasContext: true,
      canvasRouting,
      activeCanvasRouting: canvasRouting
    },
    [
      `Canvasight project claimed by the current Codex thread: ${claimed.projectPath}`,
      `Run target thread: ${claimed.codexThreadId}`,
      canvasRouting.userFacingInstruction
    ].join("\n")
  );
}

async function toolListCanvasightNodeTemplates(args) {
  const templates = await readNodeTemplates();
  const query = typeof args?.query === "string" ? args.query : "";
  const limit = normalizeTemplateListLimit(args?.limit);
  const matchedTemplates = templates.filter((template) => templateMatchesQuery(template, query));
  const limitedTemplates = matchedTemplates.slice(0, limit);
  return toolResult(
    {
      status: "ok",
      query,
      resultMode: "summary",
      count: limitedTemplates.length,
      total: matchedTemplates.length,
      maxTemplates: MAX_NODE_TEMPLATES,
      templates: limitedTemplates.map(summarizeNodeTemplate)
    },
    limitedTemplates.length
      ? `Canvasight node templates: ${limitedTemplates.length}/${matchedTemplates.length}`
      : "No Canvasight node templates matched."
  );
}

async function toolGetCanvasightNodeTemplate(args) {
  const templateId = typeof args?.templateId === "string" ? args.templateId.trim() : "";
  if (!templateId) throw new HttpError(400, "templateId is required");
  const template = getNodeTemplate(await readNodeTemplates(), templateId);
  return toolResult(
    {
      status: "ok",
      template
    },
    `Canvasight node template: ${template.title}`
  );
}

async function toolWriteCanvasightGraph(args) {
  const threadId = optionalThreadId(args?.threadId) || optionalThreadId(process.env.CODEX_THREAD_ID);
  const projectPath = await resolveSessionProjectPath(args?.projectPath, threadId, { requireThreadProject: Boolean(threadId) });
  const daemon = await ensureDaemonServer();
  const { document, documentRevision, reusedTemplates, projectGuidanceNodes } = await daemonJson(daemon, "/api/graphs/write", {
    method: "POST",
    body: JSON.stringify({
      projectPath,
      args: {
        ...(args || {}),
        projectPath
      }
    })
  });
  const activePage = document.pages.find((page) => page.id === document.activePageId) || document.pages[0];
  const nodeIds = activePage.nodes.map((node) => node.id);
  const edgeIds = activePage.edges.map((edge) => edge.id);
  const graphType = normalizeGraphType(args?.graphType);
  const summary = [
    `Canvasight graph written: ${scatterPath(projectPath)}`,
    `Graph type: ${graphType}`,
    `Active page: ${activePage.name} (${activePage.id})`,
    `Nodes: ${nodeIds.length}`,
    `Edges: ${edgeIds.length}`,
    `Templates reused: ${reusedTemplates.length}`,
    `Project guidance nodes: ${projectGuidanceNodes.length}`
  ].join("\n");

  return toolResult(
    {
      status: "written",
      projectPath,
      scatterPath: scatterPath(projectPath),
      mode: normalizeGraphWriteMode(args?.mode),
      graphType,
      activePageId: activePage.id,
      activePageName: activePage.name,
      documentRevision,
      nodeIds,
      edgeIds,
      reusedTemplates,
      projectGuidanceNodes,
      document
    },
    summary
  );
}

async function toolAwaitCanvasightRun(args) {
  const sessionIdValue = typeof args?.sessionId === "string" && args.sessionId ? args.sessionId : "";
  let projectPathValue = optionalProjectPath(args?.projectPath);
  const threadId = optionalThreadId(args?.threadId) || optionalThreadId(process.env.CODEX_THREAD_ID);
  if (!sessionIdValue && !projectPathValue) {
    projectPathValue = await resolveSessionProjectPath(null, threadId, { requireThreadProject: Boolean(threadId) });
  }
  const daemon = await ensureDaemonServer();
  const run = await daemonJson(daemon, "/api/runs/await", {
    method: "POST",
    body: JSON.stringify({
      sessionId: sessionIdValue,
      timeoutMs: args.timeoutMs,
      projectPath: projectPathValue,
      threadId
    })
  });
  if (run.status === "received" && !codexNativeModeApplied(run.codexNative?.status)) {
    run.codexNative = await applyCodexNativeMode(
      {
        codexThreadId: threadId
      },
      run
    );
  }
  const text = run.status === "received" ? run.markdown : `Canvasight run status: ${run.status}`;
  return toolResult(run, text);
}

async function toolAwaitCanvasightWidgetReady(args) {
  const sessionIdValue = typeof args?.sessionId === "string" ? args.sessionId.trim() : "";
  if (!sessionIdValue) throw new Error("sessionId is required");
  const openAttemptIdValue = typeof args?.openAttemptId === "string" ? args.openAttemptId.trim() : "";
  if (!openAttemptIdValue) throw new Error("openAttemptId is required");
  const threadId = optionalThreadId(args?.threadId);
  if (!threadId) throw new Error("threadId is required");
  const daemon = await ensureDaemonServer();
  const result = await daemonJson(daemon, "/api/widget-ready/await", {
    method: "POST",
    body: JSON.stringify({
      sessionId: sessionIdValue,
      openAttemptId: openAttemptIdValue,
      threadId,
      widgetInstanceId: args?.widgetInstanceId,
      timeoutMs: args?.timeoutMs
    })
  });
  const text =
    result.status === "ready"
      ? `Canvasight widget ready: ${result.sessionId}`
      : `Canvasight widget ${result.status}: ${result.error || result.stage || "unknown"}`;
  return toolResult(result, text);
}

function widgetApiRoute(pathValue) {
  if (typeof pathValue !== "string" || !pathValue.startsWith("/api/")) {
    throw new Error("Canvasight widget API path must start with /api/.");
  }
  const parsed = new URL(pathValue, "http://canvasight.local");
  if (parsed.origin !== "http://canvasight.local" || parsed.search || parsed.hash || parsed.pathname.includes("..")) {
    throw new Error("Canvasight widget API path is invalid.");
  }
  const allowed =
    /^\/api\/sessions(?:\/|$)/.test(parsed.pathname) ||
    /^\/api\/templates(?:\/|$)/.test(parsed.pathname) ||
    parsed.pathname === "/api/reveal";
  if (!allowed) throw new Error("Canvasight widget API path is not allowed.");
  return parsed.pathname;
}

async function toolCanvasightWidgetApi(args) {
  const route = widgetApiRoute(args?.path);
  const method = typeof args?.method === "string" ? args.method.toUpperCase() : "GET";
  if (!new Set(["GET", "POST", "DELETE"]).has(method)) {
    throw new Error(`Canvasight widget API method is not allowed: ${method}`);
  }
  const openAttemptIdValue = typeof args?.openAttemptId === "string" ? args.openAttemptId.trim() : "";
  const widgetInstanceId = typeof args?.widgetInstanceId === "string" ? args.widgetInstanceId.trim() : "";
  const startupStage = normalizeStartupStage(args?.startupStage);
  if (!openAttemptIdValue || !widgetInstanceId) throw new Error("Canvasight widget API requires openAttemptId and widgetInstanceId.");
  const daemon = await ensureDaemonServer();
  const response = await fetch(new URL(route, daemon.origin), {
    method,
    headers: daemonHeaders(daemon, {
      ...(args?.body === null || args?.body === undefined ? {} : { "content-type": "application/json" }),
      "x-canvasight-open-attempt-id": openAttemptIdValue,
      "x-canvasight-widget-instance-id": widgetInstanceId,
      "x-canvasight-startup-stage": startupStage,
      "x-canvasight-display-mode": typeof args?.displayMode === "string" ? args.displayMode : "unknown",
      "x-canvasight-thread-id": typeof args?.threadId === "string" ? args.threadId : "",
      "x-canvasight-react-mounted": args?.reactMounted === true ? "true" : "false"
    }),
    ...(args?.body === null || args?.body === undefined ? {} : { body: JSON.stringify(args.body) })
  });
  const text = await response.text();
  let payload = null;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = text || null;
  }
  const error =
    response.ok
      ? null
      : payload && typeof payload === "object" && typeof payload.error === "string"
        ? payload.error
        : text || `Canvasight daemon request failed: ${response.status}`;
  const code = payload && typeof payload === "object" && typeof payload.code === "string" ? payload.code : null;
  return toolResult(
    {
      ok: response.ok,
      status: response.status,
      data: response.ok ? payload : null,
      error,
      code
    },
    response.ok ? "Canvasight widget API request completed." : error
  );
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
    name: "render_canvasight_canvas_widget",
    description:
      "Open Canvasight as a native Codex widget for the active project. Pass the active task's CODEX_THREAD_ID as threadId so Chat Run targets the same thread. Prefer this over localhost browser URLs for normal use because the widget has the Codex host bridge and Run buttons can send follow-up messages to the current thread.",
    inputSchema: {
      type: "object",
      properties: {
        projectPath: {
          type: "string",
          description: "Optional local project path to associate with the widget session."
        },
        language: {
          type: "string",
          enum: ["zh", "en"],
          description: "Optional UI and markdown language preference."
        },
        threadId: {
          type: "string",
          description: "Current Codex thread id. Read CODEX_THREAD_ID in the active task and pass it so native mode preflight targets the same thread."
        }
      },
      required: ["threadId"],
      additionalProperties: false
    },
    outputSchema: openCanvasightWidgetOutputSchema,
    _meta: {
      ui: {
        resourceUri: CANVASIGHT_WIDGET_URI,
        visibility: ["model", "app"]
      },
      "openai/toolInvocation/invoking": "Opening Canvasight widget...",
      "openai/toolInvocation/invoked": "Canvasight widget session created"
    }
  },
  {
    name: "open_canvasight",
    description:
      "Open Canvasight as the default native Codex widget for the active project. Pass the active task's CODEX_THREAD_ID as threadId so Chat Run targets the same thread. This is the normal path: the widget has the Codex host bridge, so Run buttons can send follow-up messages to the current thread.",
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
          description: "Current Codex thread id. Read CODEX_THREAD_ID in the active task and pass it for native Chat Run."
        }
      },
      required: ["threadId"],
      additionalProperties: false
    },
    outputSchema: openCanvasightWidgetOutputSchema,
    _meta: {
      ui: {
        resourceUri: CANVASIGHT_WIDGET_URI,
        visibility: ["model", "app"]
      },
      "openai/toolInvocation/invoking": "Opening Canvasight widget...",
      "openai/toolInvocation/invoked": "Canvasight widget session created"
    }
  },
  {
    name: "open_canvasight_browser_fallback",
    description:
      "Open a Canvasight browser fallback URL in Codex's in-app browser/sidebar. Use only for debugging or when native widget rendering is unavailable; browser fallback pages queue Run payloads for await_canvasight_run instead of direct widget delivery.",
    inputSchema: {
      type: "object",
      properties: {
        projectPath: {
          type: "string",
          description: "Optional local project path to associate with the browser fallback session."
        },
        language: {
          type: "string",
          enum: ["zh", "en"],
          description: "Optional UI and markdown language preference."
        },
        threadId: {
          type: "string",
          description: "Optional Codex thread id for fallback queue filtering. Defaults to CODEX_THREAD_ID when available."
        }
      },
      additionalProperties: false
    },
    outputSchema: openCanvasightBrowserFallbackOutputSchema
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
    },
    outputSchema: looseObjectOutputSchema
  },
  {
    name: "open_canvasight_recent_project",
    description:
      "Open the most recent remembered Canvasight project, or a chosen recent project path/index, as the default native Codex widget. Pass the active task's CODEX_THREAD_ID as threadId so Chat Run targets the same thread. The opened project becomes active Canvasight context for later graph-first handling of medium or complex requests.",
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
          description: "Current Codex thread id. Read CODEX_THREAD_ID in the active task and pass it for native Chat Run."
        }
      },
      required: ["threadId"],
      additionalProperties: false
    },
    outputSchema: openCanvasightWidgetOutputSchema,
    _meta: {
      ui: {
        resourceUri: CANVASIGHT_WIDGET_URI,
        visibility: ["model", "app"]
      },
      "openai/toolInvocation/invoking": "Opening Canvasight widget...",
      "openai/toolInvocation/invoked": "Canvasight widget session created"
    }
  },
  {
    name: "claim_canvasight_thread",
    description:
      "Claim an already-open Canvasight project or session for the current Codex thread without opening a new browser tab. Use this from a new thread when a Canvasight browser/daemon is already running and future Run clicks should go to this current thread.",
    inputSchema: {
      type: "object",
      properties: {
        projectPath: {
          type: "string",
          description: "Optional project path to claim. Defaults to the most recent Canvasight project when sessionId is omitted."
        },
        sessionId: {
          type: "string",
          description: "Optional existing Canvasight session id to claim. When omitted, Canvasight claims active sessions for the project."
        },
        language: {
          type: "string",
          enum: ["zh", "en"],
          description: "Optional UI and markdown language preference for a session created during claim."
        },
        threadId: {
          type: "string",
          description: "Optional current Codex thread id. Defaults to CODEX_THREAD_ID when available."
        }
      },
      additionalProperties: false
    },
    outputSchema: looseObjectOutputSchema
  },
  {
    name: "list_canvasight_node_templates",
    description: "List lightweight summaries of saved global Canvasight node templates so AI graph generation can choose reusable prompts without loading full template bodies.",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Optional search text matched against template title and body."
        },
        limit: {
          type: "number",
          minimum: 1,
          maximum: 200,
          description: "Maximum number of templates to return. Defaults to 20."
        }
      },
      additionalProperties: false
    },
    outputSchema: looseObjectOutputSchema
  },
  {
    name: "get_canvasight_node_template",
    description: "Read one saved global Canvasight node template by id, including full prompt body and attachment metadata, after list_canvasight_node_templates identifies a useful match.",
    inputSchema: {
      type: "object",
      properties: {
        templateId: {
          type: "string",
          description: "Template id returned by list_canvasight_node_templates."
        }
      },
      required: ["templateId"],
      additionalProperties: false
    },
    outputSchema: looseObjectOutputSchema
  },
  {
    name: "write_canvasight_graph",
    description:
      "Write pages, task nodes, and edges into a project's .scatter/scatter.json so Codex or another AI can create an editable Canvasight graph. Prefer this when Canvasight is active and a later user request is medium, complex, multi-step, architectural, product-planning, article-mapping, or otherwise benefits from decomposition before direct execution. Can reuse saved global node templates through templateId or templateQuery.",
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
        graphType: {
          type: "string",
          enum: ["software-product", "article-outline", "codebase-structure", "task-plan", "general"],
          description:
            "Task generation strategy metadata. It affects how AI should organize nodes and default layout, but does not decide page creation or replacement."
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
          description: "Preferred fallback orientation for nodes without explicit x/y or position. When omitted, Canvasight chooses a default from graphType and uses edge-aware dependency layers when edges exist."
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
        reuseTemplates: {
          type: "boolean",
          description: "Whether to allow saved global node templates to be reused. Defaults to true."
        },
        nodes: {
          type: "array",
          description:
            "Single page node list. Each node accepts id, title, body, x/y or position, runMode, effort, attachments, templateId, and templateQuery. Use templateId after calling list_canvasight_node_templates when a saved template should provide title, body, and attachments.",
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
    },
    outputSchema: looseObjectOutputSchema
  },
  {
    name: "canvasight_widget_api",
    description: "Internal app-only proxy for Canvasight native widget session APIs. The widget uses this instead of fetching localhost directly.",
    inputSchema: {
      type: "object",
      properties: {
        path: { type: "string" },
        method: { type: "string", enum: ["GET", "POST", "DELETE"] },
        body: {},
        openAttemptId: { type: "string" },
        widgetInstanceId: { type: "string" },
        startupStage: { type: "string", enum: ["starting", "connecting_bridge", "connecting_session", "hydrating_project", "ready", "failed"] },
        displayMode: { type: "string", enum: ["inline", "fullscreen", "pip", "unknown"] },
        threadId: { type: "string" },
        reactMounted: { type: "boolean" }
      },
      required: ["path", "method", "openAttemptId", "widgetInstanceId", "startupStage", "displayMode"],
      additionalProperties: false
    },
    outputSchema: looseObjectOutputSchema,
    _meta: {
      ui: { visibility: ["app"] }
    }
  },
  {
    name: "await_canvasight_widget_ready",
    description:
      "Wait for the real Canvasight native widget client to mount React, reach its daemon session API, and acknowledge ready. Call this after open_canvasight; only status=ready confirms that the canvas is visibly initialized.",
    inputSchema: {
      type: "object",
      properties: {
        sessionId: {
          type: "string",
          description: "Session id returned by open_canvasight."
        },
        openAttemptId: {
          type: "string",
          description: "Open attempt id returned by open_canvasight."
        },
        threadId: {
          type: "string",
          description: "Current Codex task id used to reject readiness from a different task."
        },
        widgetInstanceId: {
          type: "string",
          description: "Optional exact fullscreen widget instance id when the caller already observed it."
        },
        timeoutMs: {
          type: "number",
          minimum: 1,
          maximum: 300000,
          description: "Maximum wait in milliseconds. Defaults to 15000."
        }
      },
      required: ["sessionId", "openAttemptId", "threadId"],
      additionalProperties: false
    },
    outputSchema: looseObjectOutputSchema
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
          description: "Optional current Codex thread id for native Chat Run. Defaults to CODEX_THREAD_ID when available."
        },
        timeoutMs: {
          type: "number",
          minimum: 1
        }
      },
      additionalProperties: false
    },
    outputSchema: canvasightRunOutputSchema
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
  if (name === "render_canvasight_canvas_widget") return toolRenderCanvasightCanvasWidget(args || {});
  if (name === "open_canvasight") return toolOpenCanvasight(args || {});
  if (name === "open_canvasight_browser_fallback") return toolOpenCanvasightBrowserFallback(args || {});
  if (name === "list_canvasight_recent_projects") return toolListCanvasightRecentProjects(args || {});
  if (name === "open_canvasight_recent_project") return toolOpenCanvasightRecentProject(args || {});
  if (name === "claim_canvasight_thread") return toolClaimCanvasightThread(args || {});
  if (name === "list_canvasight_node_templates") return toolListCanvasightNodeTemplates(args || {});
  if (name === "get_canvasight_node_template") return toolGetCanvasightNodeTemplate(args || {});
  if (name === "write_canvasight_graph") return toolWriteCanvasightGraph(args || {});
  if (name === "canvasight_widget_api") return toolCanvasightWidgetApi(args || {});
  if (name === "await_canvasight_widget_ready") return toolAwaitCanvasightWidgetReady(args || {});
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
  if (mcpStdoutClosed || process.stdout.destroyed || !process.stdout.writable) return false;
  try {
    process.stdout.write(encodeJsonRpc(message));
    return true;
  } catch (error) {
    markMcpStdoutClosed(error);
    return false;
  }
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
  appendMcpLifecycle("request", {
    id: hasId ? id : null,
    method: typeof method === "string" ? method : "",
    toolName: method === "tools/call" ? params?.name || "" : ""
  });

  try {
    if (method === "initialize") {
      if (hasId) {
        writeResult(id, {
          protocolVersion: params?.protocolVersion || DEFAULT_PROTOCOL_VERSION,
          capabilities: {
            tools: {},
            resources: {}
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

    if (method === "resources/list") {
      if (hasId) writeResult(id, listCanvasightResources());
      return;
    }

    if (method === "resources/templates/list") {
      if (hasId) writeResult(id, { resourceTemplates: [] });
      return;
    }

    if (method === "resources/read") {
      if (hasId) writeResult(id, await readCanvasightResource(params?.uri));
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
    appendMcpLifecycle("request_error", {
      id: hasId ? id : null,
      method: typeof method === "string" ? method : "",
      toolName: method === "tools/call" ? params?.name || "" : "",
      error: serializeError(error)
    });
    if (hasId) writeError(id, -32000, error?.message || "Tool call failed");
  } finally {
    appendMcpLifecycle("request_complete", {
      id: hasId ? id : null,
      method: typeof method === "string" ? method : "",
      toolName: method === "tools/call" ? params?.name || "" : ""
    });
  }
}

function maybeExitMcpStdio() {
  if (!mcpStdinEnded || mcpInFlight > 0 || isDaemonMode || isStopDaemonMode) return;
  if (mcpExitTimer) return;
  appendMcpLifecycle("stdio_exit_scheduled", { inFlight: mcpInFlight });
  mcpExitTimer = setTimeout(() => {
    appendMcpLifecycle("stdio_exit", { code: mcpExitCode });
    process.exit(mcpExitCode);
  }, 25);
}

function markMcpStdoutClosed(error) {
  if (mcpStdoutClosed) return;
  mcpStdoutClosed = true;
  appendMcpLifecycle("stdout_closed", { error: serializeError(error), inFlight: mcpInFlight });
  mcpStdinEnded = true;
  maybeExitMcpStdio();
}

function dispatchJsonRpc(message) {
  mcpInFlight += 1;
  Promise.resolve(handleJsonRpc(message))
    .catch((error) => {
      appendMcpLifecycle("dispatch_error", { error: serializeError(error) });
      try {
        writeError(isObject(message) && Object.prototype.hasOwnProperty.call(message, "id") ? message.id : null, -32000, error?.message || "Tool call failed");
      } catch {
        // The stdout failure is already logged in writeMessage.
      }
    })
    .finally(() => {
      mcpInFlight = Math.max(0, mcpInFlight - 1);
      maybeExitMcpStdio();
    });
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
  dispatchJsonRpc(JSON.parse(body));
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
    dispatchJsonRpc(JSON.parse(line));
  }
}

async function runDaemon() {
  if (!daemonAuthToken) daemonAuthToken = crypto.randomBytes(24).toString("base64url");
  daemonStartedAt = nowIso();
  await ensureHttpServer();
}

function runMcpStdio() {
  appendMcpLifecycle("stdio_start", {
    argv: process.argv.slice(2),
    cwd: process.cwd(),
    canvasightHome: canvasightHome()
  });

  process.stdin.on("data", (chunk) => {
    inputBuffer = Buffer.concat([inputBuffer, Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)]);
    try {
      drainInputBuffer();
    } catch (error) {
      appendMcpLifecycle("parse_error", { error: serializeError(error) });
      writeError(null, -32700, error?.message || "Parse error");
      inputBuffer = Buffer.alloc(0);
    }
  });

  process.stdin.on("end", () => {
    mcpStdinEnded = true;
    appendMcpLifecycle("stdin_end", { inFlight: mcpInFlight });
    maybeExitMcpStdio();
  });

  process.stdin.on("error", (error) => {
    appendMcpLifecycle("stdin_error", { error: serializeError(error), inFlight: mcpInFlight });
    mcpStdinEnded = true;
    maybeExitMcpStdio();
  });

  process.stdin.resume();
}

async function handleProcessShutdown() {
  appendMcpLifecycle("process_shutdown", {
    isDaemonMode,
    isStopDaemonMode,
    inFlight: mcpInFlight
  });
  if (isDaemonMode) {
    await shutdownDaemon();
  }
}

process.on("SIGTERM", () => {
  appendMcpLifecycle("signal", { signal: "SIGTERM", inFlight: mcpInFlight });
  void handleProcessShutdown().finally(() => process.exit(0));
});

process.on("SIGINT", () => {
  appendMcpLifecycle("signal", { signal: "SIGINT", inFlight: mcpInFlight });
  void handleProcessShutdown().finally(() => process.exit(0));
});

process.on("uncaughtException", (error) => {
  appendMcpLifecycle("uncaught_exception", { error: serializeError(error), inFlight: mcpInFlight });
  if (isDaemonMode || isStopDaemonMode) {
    process.stderr.write(`${error?.message || "Canvasight process failed"}\n`);
    process.exit(1);
    return;
  }
  if (error?.code === "EPIPE") {
    markMcpStdoutClosed(error);
    return;
  }
  mcpExitCode = 1;
  mcpStdinEnded = true;
  maybeExitMcpStdio();
});

process.on("unhandledRejection", (reason) => {
  appendMcpLifecycle("unhandled_rejection", { error: serializeError(reason), inFlight: mcpInFlight });
  if (!isDaemonMode && !isStopDaemonMode) {
    mcpExitCode = 1;
    mcpStdinEnded = true;
    maybeExitMcpStdio();
  }
});

process.stdout.on("error", (error) => {
  markMcpStdoutClosed(error);
});

process.on("exit", (code) => {
  appendMcpLifecycle("process_exit", {
    code,
    isDaemonMode,
    isStopDaemonMode,
    inFlight: mcpInFlight
  });
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
