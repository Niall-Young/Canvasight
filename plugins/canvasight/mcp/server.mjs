#!/usr/bin/env node
import { spawn } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import fsp from "node:fs/promises";
import http from "node:http";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { RESOURCE_MIME_TYPE } from "@modelcontextprotocol/ext-apps/server";

const SERVER_NAME = "canvasight";
const SERVER_VERSION = "0.1.31";
const DEFAULT_PROTOCOL_VERSION = "2024-11-05";
const CANVASIGHT_WIDGET_URI = "ui://widget/canvasight/canvas.html";
const MAX_JSON_BODY_BYTES = 100 * 1024 * 1024;
const MAX_RECENT_PROJECTS = 12;
const MAX_NODE_TEMPLATES = 200;
const TEMPLATE_BODY_PREVIEW_CHARS = 240;
const VALID_LANGUAGES = new Set(["zh", "en"]);
const VALID_EFFORT = new Set(["low", "medium", "high", "xhigh"]);
const VALID_CODEX_MODES = new Set(["chat", "plan", "goal"]);
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
const DEFAULT_CANVASIGHT_HOME = path.join(os.homedir(), ".canvasight");
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
const AGENT_TEAM_STATUS_FLOW = ["open", "assigned", "resolved", "archived"];
const AGENT_TEAM_AGENTS_MD_START = "<!-- canvasight-agent-team:start -->";
const AGENT_TEAM_AGENTS_MD_END = "<!-- canvasight-agent-team:end -->";
const AGENT_TEAM_AGENTS_MD_BLOCK = `${AGENT_TEAM_AGENTS_MD_START}
## Canvasight Agent Team

When Canvasight Agent Team mode is enabled, Codex should use persistent role agents instead of creating one-off agents for each task.

### Fixed Roles

- Product Agent: keeps work aligned with product goals and scope.
- Design Agent: checks UI direction, interaction quality, and design consistency.
- Development Agent: implements code, persistence, runtime, and integration changes.
- Test Supervisor Agent: verifies builds, smoke tests, regressions, and browser-visible behavior.
- Customer Support Agent: decides whether user-facing README documentation needs updates.
- Design Standards Expert: maintains \`design.md\` when product UI rules change.
- Development Standards Lead: maintains \`AGENTS.md\` and project working rules.
- Project Management Expert: manages git status, staging scope, and conventional Chinese commit messages.
- Skill Expert Agent: maintains Canvasight and Codex skill instructions when skill behavior changes.

### Agent Reports

Use \`agent-reports/\` for cross-agent communication when a blocking, high-risk, or cross-role issue appears.

- Issue reports: \`YYYYMMDD-HHMM-<role>-issue-<slug>.md\`
- Solution reports: \`YYYYMMDD-HHMM-<role>-solution-<slug>.md\`
- Integration summaries: \`YYYYMMDD-HHMM-integration-summary.md\`

### Operating Rules

- Reuse fixed roles across the project whenever possible.
- Create only the roles needed for the current task; if a later task needs another role, create that missing fixed role and record it in an integration summary.
- Do not create duplicate one-off agents for the same role.
- Preserve existing project rules in this file; target project rules take precedence over Canvasight defaults.
- Role agents must update report status and queue entries when they accept work, find a blocker, solve a task, or hand work to another role.
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
const require = createRequire(import.meta.url);
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

function normalizeCodexMode(value, legacyPlanMode = false) {
  return VALID_CODEX_MODES.has(value) ? value : legacyPlanMode ? "plan" : "chat";
}

function optionalThreadId(threadId) {
  if (typeof threadId !== "string" || !threadId.trim()) return null;
  return threadId.trim();
}

function nativeCodexEnabled() {
  const value = String(process.env.CANVASIGHT_CODEX_NATIVE || "").trim().toLowerCase();
  if (!value) return false;
  return value === "1" || value === "true" || value === "on" || value === "yes";
}

function nativeCodexTimeoutMs() {
  return Math.max(1000, Math.min(toNumber(Number(process.env.CANVASIGHT_CODEX_NATIVE_TIMEOUT_MS), 30000), 120000));
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

  const data = isObject(value.data) ? value.data : {};
  const { template, match } = findTemplateForGraphNode(value, data, templates, index);
  const codexMode = normalizeCodexMode(value.codexMode || data.codexMode, Boolean(value.planMode ?? data.planMode));
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

function createSession({ projectPath, language, threadId }) {
  const id = sessionId();
  const resolvedProjectPath = optionalProjectPath(projectPath) || defaultProjectPath();
  const session = {
    id,
    projectPath: resolvedProjectPath,
    language: normalizeLanguage(language),
    codexThreadId: optionalThreadId(threadId) || optionalThreadId(process.env.CODEX_THREAD_ID),
    documentRevision: projectDocumentRevision(resolvedProjectPath),
    createdAt: nowIso(),
    runQueue: [],
    waiters: []
  };
  sessions.set(id, session);
  if (session.codexThreadId) rememberThreadClaim(session, session.codexThreadId);
  return session;
}

function sessionInfo(session) {
  return {
    codexThreadId: session.codexThreadId,
    threadClaimedAt: session.threadClaimedAt || null,
    documentRevision: projectDocumentRevision(session.projectPath),
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

function claimThreadForProject({ projectPath, sessionId, language, threadId }) {
  const resolvedThreadId = optionalThreadId(threadId) || optionalThreadId(process.env.CODEX_THREAD_ID);
  if (!resolvedThreadId) {
    throw new HttpError(400, "Cannot claim Canvasight without a current Codex thread id.", "missing_thread_id");
  }

  let targetSession = sessionId ? getSession(sessionId) : null;
  const resolvedProjectPath = optionalProjectPath(projectPath) || targetSession?.projectPath || defaultProjectPath();
  const projectSessions = sessionsForProject(resolvedProjectPath);
  if (!targetSession) targetSession = newestSessionForProject(resolvedProjectPath);
  if (!targetSession) {
    targetSession = createSession({
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
  normalized.agentTeam.agentsMd = await ensureAgentTeamAgentsMd(normalized.projectPath, normalized.agentTeam);
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
    normalized.delivery = await dispatchRunToCodexThread(session, normalized);
    if (normalized.delivery.status !== "sent") session.runQueue.push(normalized);
  }
  return normalized;
}

async function prepareWidgetRun(session, payload) {
  const normalized = normalizeRunPayload(session, payload);
  normalized.agentTeam.agentsMd = await ensureAgentTeamAgentsMd(normalized.projectPath, normalized.agentTeam);
  normalized.codexNative = {
    status: "not_applicable",
    reason: "widget_bridge",
    threadId: null,
    mode: normalized.codexMode
  };
  normalized.codexTurn = {
    status: "skipped",
    reason: "widget_bridge",
    threadId: null,
    mode: normalized.codexMode
  };
  normalized.delivery = {
    status: "prepared",
    reason: "widget_bridge",
    via: "widget_bridge",
    threadId: null,
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

let cachedMcpAppsGlobalScript = "";

function escapeInlineScript(source) {
  return source.replaceAll("</script", "<\\/script").replaceAll("</SCRIPT", "<\\/SCRIPT");
}

function parseExportMap(body) {
  const exportMap = new Map();
  for (const rawEntry of body.split(",")) {
    const entry = rawEntry.trim();
    if (!entry) continue;
    const parts = entry.split(/\s+as\s+/);
    const local = parts[0]?.trim();
    const exported = (parts[1] || parts[0])?.trim();
    if (local && exported) exportMap.set(exported, local);
  }
  return exportMap;
}

function mcpAppsGlobalScript() {
  if (cachedMcpAppsGlobalScript) return cachedMcpAppsGlobalScript;

  const sourcePath = require.resolve("@modelcontextprotocol/ext-apps/app-with-deps");
  const source = fs.readFileSync(sourcePath, "utf8");
  const exportStart = source.lastIndexOf("export{");
  if (exportStart === -1) throw new Error("Could not find ext-apps browser export block.");
  const exportBlock = source.slice(exportStart).match(/^export\{([^}]+)\};?\s*$/s);
  if (!exportBlock) throw new Error("Could not parse ext-apps browser export block.");
  const exportMap = parseExportMap(exportBlock[1]);
  const requiredExports = ["App", "applyDocumentTheme", "applyHostFonts", "applyHostStyleVariables"];
  for (const name of requiredExports) {
    if (!exportMap.has(name)) throw new Error(`Missing ext-apps browser export: ${name}`);
  }
  cachedMcpAppsGlobalScript = [
    source.slice(0, exportStart),
    ";globalThis.__CANVASIGHT_MCP_APPS__={",
    requiredExports.map((name) => `${JSON.stringify(name)}:${exportMap.get(name)}`).join(","),
    "};"
  ].join("");
  return cachedMcpAppsGlobalScript;
}

function canvasightWidgetResourceMeta() {
  return {
    ui: {
      prefersBorder: false,
      csp: {
        connectDomains: ["http://127.0.0.1:*", "http://localhost:*"],
        frameDomains: ["http://127.0.0.1:*", "http://localhost:*"],
        resourceDomains: ["http://127.0.0.1:*", "http://localhost:*", "data:", "blob:"]
      }
    },
    "openai/widgetDescription": "Canvasight native Codex widget shell for the project canvas.",
    "openai/widgetPrefersBorder": false,
    "openai/widgetCSP": {
      connect_domains: ["http://127.0.0.1:*", "http://localhost:*"],
      frame_domains: ["http://127.0.0.1:*", "http://localhost:*"],
      resource_domains: ["http://127.0.0.1:*", "http://localhost:*", "data:", "blob:"]
    }
  };
}

function canvasightWidgetBridgeScript() {
  return `(() => {
  "use strict";

  const apps = globalThis.__CANVASIGHT_MCP_APPS__;
  const frame = document.getElementById("canvasight-frame");
  const status = document.getElementById("canvasight-widget-status");
  let mcpApp = null;
  let toolOutput = null;
  let statusTimer = null;

  function setStatus(message, tone = "muted") {
    if (!status) return;
    if (statusTimer) {
      clearTimeout(statusTimer);
      statusTimer = null;
    }
    status.textContent = message || "";
    status.dataset.tone = tone;
    if (message && tone === "ok") {
      statusTimer = setTimeout(() => {
        status.textContent = "";
        statusTimer = null;
      }, 1400);
    }
  }

  function publishHostGlobals(globals) {
    window.openai = Object.assign(window.openai || {}, globals);
    window.dispatchEvent(new CustomEvent("openai:set_globals", {
      detail: { globals: window.openai },
    }));
  }

  function withTimeout(promise, ms, label) {
    let timer;
    const timeout = new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error(label)), ms);
    });
    return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
  }

  function toBridgeError(error) {
    if (error instanceof Error) return error;
    return new Error(String(error || "Canvasight host bridge is unavailable."));
  }

  async function waitForReady() {
    if (mcpApp?.ready) await withTimeout(mcpApp.ready, 4000, "Canvasight host bridge did not become ready.");
    if (globalThis.__CANVASIGHT_MCP_HOST_ERROR__) throw toBridgeError(globalThis.__CANVASIGHT_MCP_HOST_ERROR__);
  }

  function currentSize() {
    const root = document.documentElement;
    const body = document.body;
    return {
      width: Math.ceil(window.innerWidth || root.clientWidth || 0),
      height: Math.ceil(Math.max(root.scrollHeight || 0, root.offsetHeight || 0, body?.scrollHeight || 0, body?.offsetHeight || 0)),
    };
  }

  function sendCurrentSize() {
    try {
      if (mcpApp && typeof mcpApp.sendSizeChanged === "function") mcpApp.sendSizeChanged(currentSize());
    } catch (_error) {
      // Hosts without size notifications can keep the default widget size.
    }
  }

  function applyHostContext(context) {
    if (!context) return;
    try {
      if (context.theme && typeof apps.applyDocumentTheme === "function") apps.applyDocumentTheme(context.theme);
      if (context.styles?.variables && typeof apps.applyHostStyleVariables === "function") apps.applyHostStyleVariables(context.styles.variables);
      if (context.styles?.css?.fonts && typeof apps.applyHostFonts === "function") apps.applyHostFonts(context.styles.css.fonts);
    } catch (_error) {
      // Host styling is a progressive enhancement.
    }
    publishHostGlobals({
      hostContext: context,
      displayMode: context.displayMode,
      availableDisplayModes: context.availableDisplayModes,
      widgetInstanceId: context.widgetInstanceId || context.widgetId,
    });
  }

  function payloadFromToolResult(result) {
    const metadata = result?._meta || {};
    const payload = metadata.widgetData || result?.structuredContent || result || {};
    return { metadata, payload };
  }

  function setFrameSource(payload) {
    if (!payload || !frame) return;
    const url = payload.browserUrl || payload.url;
    if (!url) return;
    toolOutput = payload;
    publishHostGlobals({
      toolOutput: payload,
      toolResponseMetadata: payload,
    });
    const frameUrl = new URL(url);
    frameUrl.searchParams.set("canvasightHost", "widget");
    const href = frameUrl.toString();
    if (frame.src !== href) frame.src = href;
    setStatus("Canvasight ready", "ok");
  }

  function handleToolResult(result) {
    const { metadata, payload } = payloadFromToolResult(result);
    toolOutput = payload;
    publishHostGlobals({
      rawToolResult: result,
      toolOutput: payload,
      toolResponseMetadata: metadata,
    });
    setFrameSource(payload);
    sendCurrentSize();
  }

  async function sendFollowUpMessage(message) {
    const prompt = typeof message?.prompt === "string" ? message.prompt : "";
    const content = Array.isArray(message?.content) ? message.content : [{ type: "text", text: prompt }];
    if (!prompt && !content.length) throw new Error("Missing Canvasight Run prompt.");
    if (!mcpApp || typeof mcpApp.sendMessage !== "function") throw new Error("Host bridge is unavailable.");
    await waitForReady();
    const result = await withTimeout(mcpApp.sendMessage({ role: "user", content }), 8000, "Host did not accept the Canvasight Run.");
    if (result?.isError) throw new Error("Host rejected the Canvasight Run.");
    return result || {};
  }

  async function callServerTool(request, options) {
    if (!mcpApp || typeof mcpApp.callServerTool !== "function") throw new Error("Host tool bridge is unavailable.");
    await waitForReady();
    return withTimeout(mcpApp.callServerTool(request, options), options?.timeoutMs || 30000, "Canvasight server tool call timed out.");
  }

  function installCanvasightApi() {
    const api = window.canvasightMcp || {};
    api.sendFollowUpMessage = sendFollowUpMessage;
    api.callServerTool = callServerTool;
    api.getHostCapabilities = () => {
      try {
        return mcpApp?.getHostCapabilities?.() || null;
      } catch (_error) {
        return null;
      }
    };
    api.toolOutput = () => toolOutput;
    window.canvasightMcp = api;
  }

  window.addEventListener("message", async (event) => {
    const data = event.data || {};
    if (data.source !== "canvasight-web" || data.type !== "canvasight:send-follow-up") return;
    if (frame && event.source !== frame.contentWindow) return;
    try {
      setStatus("Sending Canvasight Run to current thread...", "muted");
      await sendFollowUpMessage(data);
      event.source?.postMessage({
        source: "canvasight-widget",
        type: "canvasight:send-follow-up-result",
        requestId: data.requestId,
        ok: true,
      }, event.origin || "*");
      setStatus("Sent to current Codex thread", "ok");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      event.source?.postMessage({
        source: "canvasight-widget",
        type: "canvasight:send-follow-up-result",
        requestId: data.requestId,
        ok: false,
        error: message,
      }, event.origin || "*");
      setStatus(message, "error");
    }
  });

  window.addEventListener("message", (event) => {
    const result = event.data?.params?.result;
    if (event.data?.method === "ui/notifications/tool-result" && result) handleToolResult(result);
  });

  try {
    if (!apps || typeof apps.App !== "function") throw new Error("Canvasight MCP Apps bridge bundle is unavailable.");
    mcpApp = new apps.App(
      { name: "canvasight", version: ${JSON.stringify(SERVER_VERSION)} },
      { availableDisplayModes: ["inline", "fullscreen"] },
      { autoResize: true },
    );
    globalThis.__CANVASIGHT_MCP_APP__ = mcpApp;
    installCanvasightApi();
    mcpApp.addEventListener("hostcontextchanged", applyHostContext);
    mcpApp.addEventListener("toolresult", handleToolResult);
    mcpApp.ready = mcpApp.connect()
      .then(() => {
        installCanvasightApi();
        publishHostGlobals({
          hostCapabilities: mcpApp.getHostCapabilities && mcpApp.getHostCapabilities(),
          hostInfo: mcpApp.getHostVersion && mcpApp.getHostVersion(),
        });
        applyHostContext(mcpApp.getHostContext && mcpApp.getHostContext());
        mcpApp.requestDisplayMode?.({ mode: "fullscreen" }).catch(() => {});
        sendCurrentSize();
      })
      .catch((error) => {
        globalThis.__CANVASIGHT_MCP_HOST_ERROR__ = error;
        setStatus(error instanceof Error ? error.message : String(error), "error");
      });
    setStatus("Opening Canvasight...", "muted");
  } catch (error) {
    globalThis.__CANVASIGHT_MCP_HOST_ERROR__ = error;
    setStatus(error instanceof Error ? error.message : String(error), "error");
  }
})();`;
}

function canvasightWidgetHtml() {
  const bridgeBundle = escapeInlineScript(mcpAppsGlobalScript());
  const bridgeScript = escapeInlineScript(canvasightWidgetBridgeScript());
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Canvasight</title>
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
    #canvasight-frame {
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
  <script id="canvasightMcpAppsBundle">${bridgeBundle}</script>
</head>
<body>
  <div id="canvasight-widget-root">
    <iframe
      id="canvasight-frame"
      title="Canvasight"
      sandbox="allow-scripts allow-same-origin allow-forms allow-downloads allow-popups allow-modals"
      allow="clipboard-read; clipboard-write"
      referrerpolicy="no-referrer"
    ></iframe>
    <div id="canvasight-widget-status" role="status" aria-live="polite"></div>
  </div>
  <script id="canvasightMcpHostBridge">${bridgeScript}</script>
</body>
</html>`;
}

function appServerRequestSequence(requests, { experimentalApi = false } = {}) {
  const bin = codexAppBin();
  const timeoutMs = nativeCodexTimeoutMs();
  const requestFactories = Array.isArray(requests) ? requests : [];

  return new Promise((resolve, reject) => {
    const child = spawn(bin, ["app-server", "--stdio"], {
      stdio: ["pipe", "pipe", "pipe"]
    });
    let stdout = "";
    let stderr = "";
    let settled = false;
    let initialized = false;
    let currentRequest = null;
    const results = [];

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

    function finish(error, value) {
      if (settled) return;
      settled = true;
      if (timer) clearTimeout(timer);
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
        method: spec.method
      };
      resetTimer(spec.method);
      send({
        jsonrpc: "2.0",
        id: currentRequest.id,
        method: spec.method,
        params: isObject(spec.params) ? spec.params : {}
      });
    }

    function handleMessage(message) {
      if (!isObject(message) || !Object.prototype.hasOwnProperty.call(message, "id")) return;
      if (message.id === 1) {
        if (message.error) {
          finish(new Error(message.error.message || "Codex app-server initialize failed"));
          return;
        }
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
          results.push(message.result || {});
          currentRequest = null;
          nextRequest();
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

function goalObjectiveFromRun(payload) {
  const heading = payload.threadName || "Canvasight Goal";
  const projectLine = payload.projectPath ? `Project path: ${payload.projectPath}` : "";
  const markdown = typeof payload.markdown === "string" ? payload.markdown.trim() : "";
  return [heading, projectLine, markdown].filter(Boolean).join("\n\n").slice(0, 12000);
}

async function setCodexCollaborationMode(threadId, mode) {
  return appServerRequestSequence(
    [
      {
        method: "thread/resume",
        params: {
          threadId
        }
      },
      ([resumeResult]) => {
        const model = typeof resumeResult?.model === "string" && resumeResult.model ? resumeResult.model : "";
        if (!model) throw new Error("Codex thread/resume did not return a model for settings update");
        return {
          method: "thread/settings/update",
          params: {
            threadId,
            collaborationMode: codexCollaborationMode(mode, model)
          }
        };
      }
    ],
    { experimentalApi: true }
  ).then((results) => results[1] || {});
}

async function setCodexGoal(threadId, payload) {
  return appServerRequestSequence(
    [
      {
        method: "thread/resume",
        params: {
          threadId
        }
      },
      {
        method: "thread/goal/set",
        params: {
          threadId,
          objective: goalObjectiveFromRun(payload),
          status: "active"
        }
      }
    ],
    { experimentalApi: false }
  ).then((results) => results[1] || {});
}

function runImageInputs(payload) {
  return (payload.imagePaths || [])
    .filter((imagePath) => typeof imagePath === "string" && imagePath)
    .map((imagePath) => ({
      type: "localImage",
      path: imagePath
    }));
}

function runTurnInput(payload) {
  return [
    {
      type: "text",
      text: payload.markdown || "",
      text_elements: []
    },
    ...runImageInputs(payload)
  ];
}

function turnIdFromResult(result) {
  if (isObject(result?.turn) && typeof result.turn.id === "string") return result.turn.id;
  if (typeof result?.turnId === "string") return result.turnId;
  if (typeof result?.id === "string") return result.id;
  return null;
}

async function startCodexTurn(threadId, payload) {
  const params = {
    threadId,
    clientUserMessageId: `canvasight-${payload.sessionId}-${Date.now().toString(36)}-${crypto.randomBytes(4).toString("hex")}`,
    input: runTurnInput(payload)
  };
  if (payload.projectPath) params.cwd = payload.projectPath;
  if (payload.effort) params.effort = payload.effort;
  const result = await appServerRequestSequence(
    [
      {
        method: "thread/resume",
        params: {
          threadId
        }
      },
      {
        method: "turn/start",
        params
      }
    ],
    { experimentalApi: true }
  ).then((results) => results[1] || {});
  return {
    status: "started",
    action: "turn/start",
    threadId,
    mode: payload.codexMode,
    turnId: turnIdFromResult(result)
  };
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
    if (payload.codexMode === "chat") {
      return {
        status: "applied",
        action: "chat/no-settings-update",
        threadId: session.codexThreadId,
        mode: payload.codexMode,
        collaborationMode: "default"
      };
    }

    if (payload.codexMode === "goal") {
      await setCodexGoal(session.codexThreadId, payload);
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

async function dispatchRunToCodexThread(session, payload) {
  const codexNative = await applyCodexNativeMode(session, payload);
  payload.codexNative = codexNative;

  if (codexNative.status !== "applied") {
    payload.codexTurn = {
      status: "skipped",
      reason: "native_mode_not_applied",
      threadId: codexNative.threadId,
      mode: payload.codexMode
    };
    return {
      status: "queued",
      reason: codexNative.reason || codexNative.error || "native_mode_not_applied",
      via: "await_canvasight_run",
      threadId: codexNative.threadId,
      codexNative,
      codexTurn: payload.codexTurn
    };
  }

  try {
    const codexTurn = await startCodexTurn(codexNative.threadId || session.codexThreadId, payload);
    payload.codexTurn = codexTurn;
    return {
      status: "queued",
      reason: "turn_start_unverified",
      via: "await_canvasight_run",
      threadId: codexTurn.threadId,
      codexNative,
      codexTurn
    };
  } catch (error) {
    const failedMethod = typeof error?.canvasightAppServerMethod === "string" ? error.canvasightAppServerMethod : "turn/start";
    const failedReason = failedMethod === "thread/resume" ? "thread_resume_failed" : "turn_start_failed";
    payload.codexTurn = {
      status: "failed",
      action: failedMethod,
      error: error?.message || "Codex turn/start request failed",
      threadId: codexNative.threadId || session.codexThreadId,
      mode: payload.codexMode
    };
    return {
      status: "queued",
      reason: failedReason,
      via: "await_canvasight_run",
      threadId: codexNative.threadId || session.codexThreadId,
      codexNative,
      codexTurn: payload.codexTurn
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
    const documentRevision = projectDocumentRevision(projectPath);
    session.documentRevision = documentRevision;
    await rememberProjectBestEffort(projectPath, openedProject.project);
    sendJson(res, 200, {
      ...openedProject,
      documentRevision
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
      const projectPath = normalizeProjectPath(body.projectPath || defaultProjectPath());
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
      const claimed = claimThreadForProject({
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
      const session = createSession({
        projectPath: typeof body?.projectPath === "string" && body.projectPath ? body.projectPath : null,
        language: body?.language,
        threadId: body?.threadId
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
  if (isDaemonMode) await removeDaemonState();
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

function readCanvasightResource(uri) {
  if (uri !== CANVASIGHT_WIDGET_URI) {
    throw new HttpError(404, `Unknown Canvasight resource: ${uri}`, "resource_not_found");
  }
  const meta = canvasightWidgetResourceMeta();
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
      threadId: args?.threadId || process.env.CODEX_THREAD_ID || null
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
  return {
    "openai/outputTemplate": CANVASIGHT_WIDGET_URI,
    "ui/resourceUri": CANVASIGHT_WIDGET_URI,
    widgetData
  };
}

async function toolRenderCanvasightCanvasWidget(args) {
  const { daemon, opened, session, url } = await createBrowserSession(args);
  const canvasRouting = canvasRoutingContext();
  const widgetData = {
    status: "opened",
    rendering: "native-widget",
    widget: "canvasight-canvas-widget",
    sessionId: session.sessionId,
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
    {
      ...widgetData,
      openTarget: "codex_native_widget"
    },
    [
      `Canvasight native widget opened for project: ${session.projectPath}`,
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
  let projectPath = optionalProjectPath(args?.projectPath);
  if (!projectPath && typeof args?.sessionId !== "string") {
    projectPath = (await recentProjects(1))[0]?.path || defaultProjectPath();
  }
  const threadId = optionalThreadId(args?.threadId) || optionalThreadId(process.env.CODEX_THREAD_ID);
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
  const projectPath = normalizeProjectPath(args?.projectPath || defaultProjectPath());
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
  if (!sessionIdValue && !projectPathValue) {
    projectPathValue = (await recentProjects(1))[0]?.path || defaultProjectPath();
  }
  const daemon = await ensureDaemonServer();
  const threadId = optionalThreadId(args?.threadId) || optionalThreadId(process.env.CODEX_THREAD_ID);
  const run = await daemonJson(daemon, "/api/runs/await", {
    method: "POST",
    body: JSON.stringify({
      sessionId: sessionIdValue,
      timeoutMs: args.timeoutMs,
      projectPath: projectPathValue,
      threadId
    })
  });
  if (run.status === "received" && run.codexNative?.status !== "applied") {
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
      "Open Canvasight as a native Codex widget for the active project. Prefer this over localhost browser URLs for normal use because the widget has the Codex host bridge and Run buttons can send follow-up messages to the current thread.",
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
          description: "Optional Codex thread id for fallback queue filtering. Native widget Run delivery does not require this when the host bridge is available."
        }
      },
      additionalProperties: false
    },
    _meta: {
      ui: {
        resourceUri: CANVASIGHT_WIDGET_URI,
        visibility: ["model", "app"]
      },
      "ui/resourceUri": CANVASIGHT_WIDGET_URI,
      "openai/outputTemplate": CANVASIGHT_WIDGET_URI,
      "openai/widgetAccessible": true,
      "openai/toolInvocation/invoking": "Opening Canvasight widget...",
      "openai/toolInvocation/invoked": "Canvasight widget ready"
    }
  },
  {
    name: "open_canvasight",
    description:
      "Open Canvasight as the default native Codex widget for the active project. This is the normal path: the widget has the Codex host bridge, so Run buttons can send follow-up messages to the current thread.",
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
    },
    _meta: {
      ui: {
        resourceUri: CANVASIGHT_WIDGET_URI,
        visibility: ["model", "app"]
      },
      "ui/resourceUri": CANVASIGHT_WIDGET_URI,
      "openai/outputTemplate": CANVASIGHT_WIDGET_URI,
      "openai/widgetAccessible": true,
      "openai/toolInvocation/invoking": "Opening Canvasight widget...",
      "openai/toolInvocation/invoked": "Canvasight widget ready"
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
    description:
      "Open the most recent remembered Canvasight project, or a chosen recent project path/index, as the default native Codex widget. The opened project becomes active Canvasight context for later graph-first handling of medium or complex requests.",
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
    },
    _meta: {
      ui: {
        resourceUri: CANVASIGHT_WIDGET_URI,
        visibility: ["model", "app"]
      },
      "ui/resourceUri": CANVASIGHT_WIDGET_URI,
      "openai/outputTemplate": CANVASIGHT_WIDGET_URI,
      "openai/widgetAccessible": true,
      "openai/toolInvocation/invoking": "Opening Canvasight widget...",
      "openai/toolInvocation/invoked": "Canvasight widget ready"
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
    }
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
    }
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
    }
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
            "Single page node list. Each node accepts id, title, body, x/y or position, codexMode, runMode, effort, attachments, templateId, and templateQuery. Use templateId after calling list_canvasight_node_templates when a saved template should provide title, body, and attachments.",
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
  if (name === "render_canvasight_canvas_widget") return toolRenderCanvasightCanvasWidget(args || {});
  if (name === "open_canvasight") return toolOpenCanvasight(args || {});
  if (name === "open_canvasight_browser_fallback") return toolOpenCanvasightBrowserFallback(args || {});
  if (name === "list_canvasight_recent_projects") return toolListCanvasightRecentProjects(args || {});
  if (name === "open_canvasight_recent_project") return toolOpenCanvasightRecentProject(args || {});
  if (name === "claim_canvasight_thread") return toolClaimCanvasightThread(args || {});
  if (name === "list_canvasight_node_templates") return toolListCanvasightNodeTemplates(args || {});
  if (name === "get_canvasight_node_template") return toolGetCanvasightNodeTemplate(args || {});
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
      if (hasId) writeResult(id, readCanvasightResource(params?.uri));
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
