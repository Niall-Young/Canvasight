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
import { strToU8, zipSync } from "fflate";

const SERVER_NAME = "canvasight";
const SERVER_VERSION = "0.4.34";
const DEFAULT_PROTOCOL_VERSION = "2024-11-05";
const CANVASIGHT_WIDGET_URI = "ui://widget/canvasight/canvas.html";
const CANVASIGHT_FRAMEWORK_QUESTIONS_URI = "ui://widget/canvasight/framework-questions.html";
const DEFAULT_MCP_LIFECYCLE_LOG_MAX_BYTES = 5 * 1024 * 1024;
const DAEMON_START_LOCK_STALE_MS = 15_000;
const DAEMON_START_LOCK_WAIT_MS = 12_000;
const DAEMON_START_LOCK_UNREADABLE_STALE_MS = 1_000;
const MAX_JSON_BODY_BYTES = 100 * 1024 * 1024;
const MAX_WIDGET_IMAGE_PREVIEW_BYTES = 10 * 1024 * 1024;
const MAX_RECENT_PROJECTS = 12;
const MAX_NODE_TEMPLATES = 200;
const MAX_SKILL_SUMMARIES = 200;
const MAX_DOCUMENT_MUTATION_RECEIPTS = 200;
const MAX_GRAPH_CONTEXTS_PER_PROJECT = 64;
const GRAPH_CONTEXT_TTL_MS = 60 * 60 * 1000;
const TEMPLATE_BODY_PREVIEW_CHARS = 240;
const VALID_LANGUAGES = new Set(["zh", "en"]);
const VALID_EFFORT = new Set(["low", "medium", "high", "xhigh"]);
const VALID_RUN_MODES = new Set(["flow", "node"]);
const VALID_GRAPH_WRITE_MODES = new Set(["append-page", "merge-active-page", "replace-active-page", "replace-document"]);
const VALID_GRAPH_LAYOUTS = new Set(["horizontal", "vertical", "grid"]);
const VALID_GRAPH_LAYOUT_POLICIES = new Set(["auto", "preserve-explicit"]);
const VALID_SEMANTIC_RELATIONSHIP_TYPES = new Set(["dependency", "sequence", "containment", "evidence", "decision", "navigation", "flow"]);
const VALID_GRAPH_TYPES = new Set(["software-product", "article-outline", "codebase-structure", "task-plan", "general"]);
const VALID_FRAMEWORK_INTENTS = new Set(["create", "analyze", "organize", "refine", "decide", "execute"]);
const VALID_FRAMEWORK_DOMAINS = new Set(["software-product", "ux-design", "codebase", "article", "research", "task-execution"]);
const VALID_FRAMEWORK_MATURITY = new Set(["explore", "define", "decide", "deliver"]);
const VALID_FRAMEWORK_OUTPUTS = new Set(["exploration-map", "structured-outline", "system-map", "decision-map", "execution-plan"]);
const FRAMEWORK_DOMAIN_COVERAGE = {
  "software-product": [
    "product.goal", "product.users", "product.value", "product.capabilities", "product.scope", "product.journey",
    "product.informationArchitecture", "product.rules", "product.design", "product.success", "product.risks",
    "product.technicalConstraints", "product.testingRelease", "product.deliverables"
  ],
  "ux-design": [
    "ux.goal", "ux.context", "ux.taskFlow", "ux.informationArchitecture", "ux.pageHierarchy", "ux.components",
    "ux.states", "ux.feedbackRecovery", "ux.visualDirection", "ux.accessibilityResponsive", "ux.acceptance"
  ],
  codebase: [
    "codebase.purposeEntry", "codebase.directories", "codebase.modulesEvidence", "codebase.executionFlow", "codebase.dataState",
    "codebase.dependenciesInterfaces", "codebase.tooling", "codebase.extensionPoints", "codebase.risksDebt",
    "codebase.epistemicStatus", "codebase.relevantFiles"
  ],
  article: [
    "article.purpose", "article.audience", "article.thesis", "article.narrative", "article.sections", "article.evidence",
    "article.objections", "article.openingClosing", "article.gaps"
  ],
  research: [
    "research.question", "research.scope", "research.factsSources", "research.dimensions", "research.hypotheses",
    "research.evidenceCounterevidence", "research.uncertainty", "research.patterns", "research.conclusions", "research.implications"
  ],
  "task-execution": [
    "task.goalDone", "task.currentEvidence", "task.constraints", "task.workDependencies", "task.parallelWork",
    "task.deliverables", "task.risksRecovery", "task.stageVerification", "task.acceptanceDelivery"
  ]
};
const FRAMEWORK_MATURITY_COVERAGE = {
  explore: ["maturity.explore.boundary", "maturity.explore.knownUnknown", "maturity.explore.directions", "maturity.explore.nextQuestions"],
  define: ["maturity.define.definitions", "maturity.define.rules", "maturity.define.flows", "maturity.define.boundaries", "maturity.define.acceptance"],
  decide: ["maturity.decide.question", "maturity.decide.criteria", "maturity.decide.options", "maturity.decide.tradeoffs", "maturity.decide.result", "maturity.decide.rejected"],
  deliver: ["maturity.deliver.steps", "maturity.deliver.deliverables", "maturity.deliver.acceptance", "maturity.deliver.risks", "maturity.deliver.ownership", "maturity.deliver.handoff"]
};
const GRAPH_NODE_WIDTH = 400;
const GRAPH_NODE_HEIGHT = 220;
const GRAPH_LAYER_GAP = 280;
const GRAPH_ROW_GAP = 160;
const GRAPH_GRID_COLUMNS = 3;
const IMAGE_EXTENSIONS = new Set([".apng", ".avif", ".gif", ".jpg", ".jpeg", ".png", ".svg", ".webp"]);
const DEFAULT_CODEX_APP_BIN = "/Applications/Codex.app/Contents/Resources/codex";
const DEFAULT_CHATGPT_APP_BIN = "/Applications/ChatGPT.app/Contents/Resources/codex";
const DEFAULT_CANVASIGHT_HOME = path.join(os.homedir(), ".canvasight");
const CLI_CANVASIGHT_HOME = (() => {
  let configured = "";
  for (const argument of process.argv.slice(2)) {
    if (argument.startsWith("--canvasight-home=")) configured = argument.slice("--canvasight-home=".length).trim();
  }
  return configured ? path.resolve(configured) : null;
})();
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
    agentTeamOnlyTitle: "完善 AGENTS.md",
    body:
      "当前项目缺少 AGENTS.md。请创建该文件，基于现有项目内容和当前需求，写清项目上下文、工作规则、实现约束、验证命令与 git 提交约定。不要默认加入 Agent Team 等未启用的可选流程，也不要写成空模板。",
    agentTeamOnlyBody:
      "当前 AGENTS.md 仅包含 Canvasight Agent Team 受管协议，仍缺少项目通用规则。请保留受管段落，并基于现有项目内容和当前需求，补充项目上下文、工作规则、实现约束、验证命令与 git 提交约定。不要重复创建或扩写 Agent Team 分工，也不要写成空模板。"
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
const revisionPollLeases = new Map();
const projectRevisionStates = new Map();
const projectWriteLocks = new Map();
const projectGraphContexts = new Map();
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

const REVISION_POLL_INTERVAL_MS = 5_000;
const REVISION_POLL_LEASE_MS = 10_000;

function revisionPollLeaseKey(projectPath, threadId) {
  return JSON.stringify([path.resolve(projectPath), optionalThreadId(threadId) || ""]);
}

function revisionPollOwner(session, identity) {
  return {
    sessionId: session.id,
    openAttemptId: String(identity.openAttemptId || ""),
    widgetInstanceId: String(identity.widgetInstanceId || "")
  };
}

function sameRevisionPollOwner(left, right) {
  return Boolean(
    left &&
      right &&
      left.sessionId === right.sessionId &&
      left.openAttemptId === right.openAttemptId &&
      left.widgetInstanceId === right.widgetInstanceId
  );
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

function setProjectDocumentRevision(projectPath, revision) {
  projectDocumentRevisions.set(projectRevisionKey(projectPath), Math.max(0, Math.floor(toNumber(revision, 0))));
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
  return "horizontal";
}

function normalizeGraphLayoutPolicy(value) {
  return VALID_GRAPH_LAYOUT_POLICIES.has(value) ? value : "auto";
}

function normalizeGraphType(value) {
  return VALID_GRAPH_TYPES.has(value) ? value : "general";
}

function defaultGraphLayoutForType(graphType) {
  return "horizontal";
}

function deprecatedGraphLayoutAdvisories(args) {
  const requested = [
    { path: "layout", value: args?.layout },
    ...(Array.isArray(args?.pages)
      ? args.pages.map((page, index) => ({ path: `pages[${index}].layout`, value: page?.layout }))
      : [])
  ];
  return requested
    .filter(({ value }) => value === "vertical" || value === "grid")
    .map(({ path, value }) => ({
      code: "deprecated_graph_layout",
      path,
      message: `Graph layout ${value} is deprecated for AI writes and was normalized to horizontal.`
    }));
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

function commandAvailableOnPath(command) {
  const pathEntries = String(process.env.PATH || "").split(path.delimiter).filter(Boolean);
  const extensions = process.platform === "win32"
    ? String(process.env.PATHEXT || ".EXE;.CMD;.BAT;.COM").split(";").filter(Boolean)
    : [""];
  return pathEntries.some((entry) =>
    extensions.some((extension) => fs.existsSync(path.join(entry, `${command}${extension.toLowerCase()}`)) || fs.existsSync(path.join(entry, `${command}${extension.toUpperCase()}`)))
  );
}

function codexSkillsRuntime() {
  const explicitSkillsBin = configuredExecutable("CANVASIGHT_SKILLS_CODEX_BIN");
  if (explicitSkillsBin) return { bin: explicitSkillsBin, source: "skills_explicit_override", isDesktop: false };

  const explicitBin = configuredExecutable("CANVASIGHT_CODEX_BIN");
  if (explicitBin) return { bin: explicitBin, source: "explicit_override", isDesktop: false };

  const codexDesktopBin = configuredExecutable("CANVASIGHT_CODEX_APP_BIN") || DEFAULT_CODEX_APP_BIN;
  if (fs.existsSync(codexDesktopBin)) return { bin: codexDesktopBin, source: "codex_desktop", isDesktop: true };

  if (commandAvailableOnPath("codex")) return { bin: "codex", source: "path_fallback", isDesktop: false };

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
  if (CLI_CANVASIGHT_HOME) return CLI_CANVASIGHT_HOME;
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

function canvasightPreferencesPath() {
  return path.join(canvasightHome(), "preferences.json");
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

function scatterRevisionStatePath(projectPath) {
  return path.join(scatterDir(projectPath), "revision-state.json");
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

function exportFileStem(value) {
  const stem = safeFileName(value || "scatter-prompt").replace(/^[. ]+|[. ]+$/g, "");
  return stem || "scatter-prompt";
}

function uniqueAssetExportName(originalName, usedNames) {
  const safeName = safeFileName(originalName || "attachment");
  const extension = path.extname(safeName);
  const stem = extension ? safeName.slice(0, -extension.length) : safeName;
  let candidate = safeName;
  let serial = 2;
  while (usedNames.has(candidate.toLocaleLowerCase())) {
    candidate = `${stem}-${serial}${extension}`;
    serial += 1;
  }
  usedNames.add(candidate.toLocaleLowerCase());
  return candidate;
}

function isPathInside(targetPath, parentPath) {
  const relative = path.relative(parentPath, targetPath);
  return relative !== "" && !relative.startsWith(`..${path.sep}`) && relative !== ".." && !path.isAbsolute(relative);
}

function archiveExportMarkdown(markdown, assetPaths, attachments) {
  let result = markdown;
  for (const attachment of attachments) {
    const assetPath = assetPaths.get(attachment.id);
    if (!assetPath) continue;
    if (attachment.storedPath) {
      result = result
        .split("\n")
        .filter((line) => !line.includes(attachment.storedPath))
        .join("\n");
    }
    if (attachment.relativePath) result = result.split(attachment.relativePath).join(assetPath);
  }
  return result;
}

async function uniqueDownloadPath(directory, stem, extension) {
  for (let serial = 1; serial < 10_000; serial += 1) {
    const suffix = serial === 1 ? "" : `-${serial}`;
    const candidate = path.join(directory, `${stem}${suffix}${extension}`);
    try {
      await fsp.access(candidate);
    } catch (error) {
      if (error?.code === "ENOENT") return candidate;
      throw error;
    }
  }
  throw new HttpError(409, "Could not choose a unique export file name.", "export_name_conflict");
}

async function exportMarkdownToDownloads(session, input) {
  if (!session.projectPath) throw new HttpError(409, "Canvasight project is not open.", "project_not_open");
  if (typeof input?.markdown !== "string") throw new HttpError(400, "markdown must be a string", "invalid_export_markdown");
  if (!Array.isArray(input?.attachments)) throw new HttpError(400, "attachments must be an array", "invalid_export_attachments");

  const projectPath = normalizeProjectPath(session.projectPath);
  const assetsDirectory = path.resolve(scatterAssetsDir(projectPath));
  const templateAssetsDirectory = path.resolve(canvasightTemplateAssetsDir());
  const attachments = input.attachments.map(normalizeAttachment);
  const files = {};
  const usedAssetNames = new Set();
  const assetPaths = new Map();

  for (const attachment of attachments) {
    const storedPath = path.resolve(attachment.storedPath);
    if (!attachment.storedPath || (!isPathInside(storedPath, assetsDirectory) && !isPathInside(storedPath, templateAssetsDirectory))) {
      throw new HttpError(400, `Attachment is not a Canvasight project asset: ${attachment.originalName}`, "invalid_export_attachment_path");
    }
    let stat;
    try {
      stat = await fsp.lstat(storedPath);
    } catch {
      throw new HttpError(404, `Attachment is unavailable: ${attachment.originalName}`, "export_attachment_missing");
    }
    if (!stat.isFile() || stat.isSymbolicLink()) throw new HttpError(400, `Attachment is not a regular file: ${attachment.originalName}`, "invalid_export_attachment_path");
    const archivePath = `assets/${uniqueAssetExportName(attachment.originalName, usedAssetNames)}`;
    files[archivePath] = await fsp.readFile(storedPath);
    assetPaths.set(attachment.id, archivePath);
  }

  const stem = exportFileStem(typeof input?.title === "string" ? input.title : "scatter-prompt");
  const markdown = attachments.length ? archiveExportMarkdown(input.markdown, assetPaths, attachments) : input.markdown;
  const extension = attachments.length ? ".zip" : ".md";
  if (attachments.length) files[`${stem}.md`] = strToU8(markdown);
  const bytes = attachments.length ? zipSync(files) : Buffer.from(markdown, "utf8");
  const downloadsDirectory = path.resolve(process.env.CANVASIGHT_EXPORT_DIR || path.join(os.homedir(), "Downloads"));
  await fsp.mkdir(downloadsDirectory, { recursive: true });
  const targetPath = await uniqueDownloadPath(downloadsDirectory, stem, extension);
  const temporaryPath = path.join(downloadsDirectory, `.${path.basename(targetPath)}.${crypto.randomUUID()}.tmp`);
  try {
    await fsp.writeFile(temporaryPath, bytes);
    await fsp.rename(temporaryPath, targetPath);
  } catch (error) {
    await fsp.rm(temporaryPath, { force: true }).catch(() => undefined);
    throw error;
  }
  return {
    fileName: path.basename(targetPath),
    targetPath
  };
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

function defaultPreferences() {
  return {
    aiSkillAssignmentEnabled: false
  };
}

function normalizePreferences(value) {
  return {
    aiSkillAssignmentEnabled: value?.aiSkillAssignmentEnabled === true
  };
}

async function readPreferences() {
  try {
    const raw = await fsp.readFile(canvasightPreferencesPath(), "utf8");
    return normalizePreferences(JSON.parse(raw));
  } catch (error) {
    if (error?.code === "ENOENT" || error instanceof SyntaxError) return defaultPreferences();
    throw error;
  }
}

async function writePreferences(value) {
  const preferences = normalizePreferences(value);
  await fsp.mkdir(canvasightHome(), { recursive: true });
  const targetPath = canvasightPreferencesPath();
  const temporaryPath = `${targetPath}.${process.pid}.${crypto.randomBytes(4).toString("hex")}.tmp`;
  try {
    await fsp.writeFile(temporaryPath, `${JSON.stringify(preferences, null, 2)}\n`, "utf8");
    await fsp.rename(temporaryPath, targetPath);
  } catch (error) {
    await fsp.rm(temporaryPath, { force: true }).catch(() => undefined);
    throw error;
  }
  return preferences;
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
      await fsp.writeFile(
        canvasightDaemonStartLockPath(),
        `${JSON.stringify({ pid: process.pid, token, serverVersion: SERVER_VERSION, pluginRoot, createdAt: nowIso() })}\n`,
        { encoding: "utf8", flag: "wx" }
      );
      return { acquired: true, token, existing: null };
    } catch (error) {
      if (error?.code !== "EEXIST") throw error;
    }

    const existing = await healthyDaemonState(await readDaemonState());
    if (existing) return { handle: null, token: "", existing };

    const lock = await readDaemonStartLock();
    const createdAt = Date.parse(lock?.createdAt || "");
    let unreadableLockAgeMs = null;
    if (!lock) {
      try {
        const stat = await fsp.stat(canvasightDaemonStartLockPath());
        unreadableLockAgeMs = Math.max(0, Date.now() - stat.mtimeMs);
      } catch (error) {
        if (error?.code !== "ENOENT") throw error;
      }
    }
    const stale = lock
      ? !processIsAlive(Number(lock.pid)) ||
        (Number.isFinite(createdAt) && Date.now() - createdAt >= DAEMON_START_LOCK_STALE_MS)
      : unreadableLockAgeMs !== null && unreadableLockAgeMs >= DAEMON_START_LOCK_UNREADABLE_STALE_MS;
    if (stale) {
      await fsp.rm(canvasightDaemonStartLockPath(), { force: true });
      continue;
    }
    await sleep(100);
  }
  throw new Error("Canvasight daemon start lock timed out");
}

async function releaseDaemonStartLock(lock) {
  if (!lock?.acquired) return;
  const current = await readDaemonStartLock();
  if (current?.token === lock.token) await fsp.rm(canvasightDaemonStartLockPath(), { force: true });
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
    const document = normalizeScatterDocument(JSON.parse(raw), projectPath);
    await ensureProjectRevisionState(projectPath, document);
    return document;
  } catch (error) {
    if (error?.code === "ENOENT") {
      const document = defaultScatterDocument(projectPath);
      await writeScatterDocument(projectPath, document);
      await ensureProjectRevisionState(projectPath, document);
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
  await writeJsonAtomic(scatterPath(projectPath), normalized);
  return normalized;
}

function documentFingerprint(document) {
  return crypto.createHash("sha256").update(JSON.stringify(document)).digest("hex");
}

async function writeJsonAtomic(targetPath, value) {
  await fsp.mkdir(path.dirname(targetPath), { recursive: true });
  const temporaryPath = path.join(path.dirname(targetPath), `.${path.basename(targetPath)}.${process.pid}.${crypto.randomUUID()}.tmp`);
  try {
    await fsp.writeFile(temporaryPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
    await fsp.rename(temporaryPath, targetPath);
  } catch (error) {
    await fsp.rm(temporaryPath, { force: true }).catch(() => undefined);
    throw error;
  }
}

function normalizeRevisionState(value) {
  const receipts = Array.isArray(value?.receipts)
    ? value.receipts.filter((receipt) => isObject(receipt) && typeof receipt.clientMutationId === "string").slice(-MAX_DOCUMENT_MUTATION_RECEIPTS)
    : [];
  return {
    version: 1,
    revision: Math.max(0, Math.floor(toNumber(value?.revision, 0))),
    documentVersion: typeof value?.documentVersion === "string" ? value.documentVersion : "",
    history: Array.isArray(value?.history)
      ? value.history
          .filter((entry) => isObject(entry) && typeof entry.revision === "number" && typeof entry.documentVersion === "string")
          .slice(-MAX_DOCUMENT_MUTATION_RECEIPTS)
      : [],
    objectWriters: isObject(value?.objectWriters) ? { ...value.objectWriters } : {},
    lastSource: value?.lastSource === "ai" ? "ai" : "manual",
    receipts
  };
}

async function ensureProjectRevisionState(projectPath, document) {
  const key = projectRevisionKey(projectPath);
  const fingerprint = documentFingerprint(document);
  const cached = projectRevisionStates.get(key);
  if (cached?.documentVersion === fingerprint) {
    setProjectDocumentRevision(projectPath, cached.revision);
    return cached;
  }
  let state;
  try {
    state = normalizeRevisionState(JSON.parse(await fsp.readFile(scatterRevisionStatePath(projectPath), "utf8")));
  } catch (error) {
    if (error?.code !== "ENOENT" && !(error instanceof SyntaxError)) throw error;
    state = normalizeRevisionState(null);
  }
  if (state.documentVersion && state.documentVersion !== fingerprint) {
    state.revision += 1;
    state.receipts = [];
  }
  state.documentVersion = fingerprint;
  if (!state.history.some((entry) => entry.revision === state.revision && entry.documentVersion === fingerprint)) {
    state.history = [...state.history, { revision: state.revision, documentVersion: fingerprint }].slice(-MAX_DOCUMENT_MUTATION_RECEIPTS);
  }
  projectRevisionStates.set(key, state);
  setProjectDocumentRevision(projectPath, state.revision);
  await writeJsonAtomic(scatterRevisionStatePath(projectPath), state);
  return state;
}

async function persistProjectRevisionState(projectPath, state) {
  const normalized = normalizeRevisionState(state);
  if (!normalized.history.some((entry) => entry.revision === normalized.revision && entry.documentVersion === normalized.documentVersion)) {
    normalized.history = [...normalized.history, { revision: normalized.revision, documentVersion: normalized.documentVersion }].slice(-MAX_DOCUMENT_MUTATION_RECEIPTS);
  }
  projectRevisionStates.set(projectRevisionKey(projectPath), normalized);
  setProjectDocumentRevision(projectPath, normalized.revision);
  await writeJsonAtomic(scatterRevisionStatePath(projectPath), normalized);
  return normalized;
}

function comparableNode(node) {
  if (!node) return null;
  const { selected: _selected, data, ...rest } = node;
  const { lastRunAt: _lastRunAt, ...dataRest } = isObject(data) ? data : {};
  return { ...rest, data: dataRest };
}

function comparableNodeSemantic(node) {
  if (!node) return null;
  const { position: _position, ...semantic } = comparableNode(node);
  return semantic;
}

function documentObjectWriters(previousWriters, beforeDocument, afterDocument, source) {
  const writers = { ...(isObject(previousWriters) ? previousWriters : {}) };
  const beforePages = itemMap(beforeDocument?.pages);
  const afterPages = itemMap(afterDocument?.pages);
  for (const pageId of new Set([...beforePages.keys(), ...afterPages.keys()])) {
    const beforePage = beforePages.get(pageId);
    const afterPage = afterPages.get(pageId);
    if (!beforePage || !afterPage || beforePage.name !== afterPage.name) writers[`page:${pageId}`] = source;
    const beforeNodes = itemMap(beforePage?.nodes);
    const afterNodes = itemMap(afterPage?.nodes);
    for (const nodeId of new Set([...beforeNodes.keys(), ...afterNodes.keys()])) {
      if (!sameValue(comparableNodeSemantic(beforeNodes.get(nodeId)), comparableNodeSemantic(afterNodes.get(nodeId)))) {
        writers[`node:${pageId}:${nodeId}`] = source;
      }
    }
    const beforeEdges = itemMap(beforePage?.edges);
    const afterEdges = itemMap(afterPage?.edges);
    for (const edgeId of new Set([...beforeEdges.keys(), ...afterEdges.keys()])) {
      if (!sameValue(beforeEdges.get(edgeId), afterEdges.get(edgeId))) writers[`edge:${pageId}:${edgeId}`] = source;
    }
  }
  return writers;
}

function sameValue(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function changedFromBase(base, value, comparable = (item) => item) {
  return !sameValue(comparable(base), comparable(value));
}

function itemMap(items) {
  return new Map((Array.isArray(items) ? items : []).map((item) => [item.id, item]));
}

function mergeAtomicItems(baseItems, currentItems, localItems, comparable, kind, reasons, conflictWinner = "none") {
  const base = itemMap(baseItems);
  const current = itemMap(currentItems);
  const local = itemMap(localItems);
  const result = [];
  const ids = [...new Set([...base.keys(), ...current.keys(), ...local.keys()])];
  for (const id of ids) {
    const baseItem = base.get(id);
    const currentItem = current.get(id);
    const localItem = local.get(id);
    const currentChanged = changedFromBase(baseItem, currentItem, comparable);
    const localChanged = changedFromBase(baseItem, localItem, comparable);
    if (currentChanged && localChanged && !sameValue(comparable(currentItem), comparable(localItem))) {
      reasons.push(`${kind}:${id}`);
      const winner = conflictWinner === "current" ? currentItem : conflictWinner === "local" ? localItem : null;
      if (winner) result.push(winner);
      continue;
    }
    const chosen = localChanged ? localItem : currentItem;
    if (chosen) result.push(chosen);
  }
  return result;
}

function pageContentChanged(basePage, page) {
  if (!basePage || !page) return basePage !== page;
  if (basePage.name !== page.name) return true;
  if (changedFromBase(basePage.nodes, page.nodes, (items) => (items || []).map(comparableNode))) return true;
  return changedFromBase(basePage.edges, page.edges);
}

function comparablePage(page) {
  if (!page) return null;
  return {
    id: page.id,
    name: page.name,
    createdAt: page.createdAt,
    nodes: page.nodes.map(comparableNode),
    edges: page.edges
  };
}

function documentsContentEqual(left, right) {
  if (!left || !right || left.projectName !== right.projectName) return false;
  return sameValue(left.pages.map(comparablePage), right.pages.map(comparablePage));
}

function documentWithCurrentNavigation(currentDocument, localDocument, projectPath) {
  const currentPages = itemMap(currentDocument.pages);
  const pages = localDocument.pages.map((page) => {
    const currentPage = currentPages.get(page.id);
    return currentPage ? { ...page, viewport: currentPage.viewport } : page;
  });
  return rebuildDocumentMirrors({
    ...localDocument,
    activePageId: currentDocument.activePageId,
    pages
  }, projectPath);
}

function edgeIncidentConflict(basePage, currentPage, localPage, reasons) {
  const baseNodes = itemMap(basePage?.nodes);
  const currentNodes = itemMap(currentPage?.nodes);
  const localNodes = itemMap(localPage?.nodes);
  const currentEdges = Array.isArray(currentPage?.edges) ? currentPage.edges : [];
  const localEdges = Array.isArray(localPage?.edges) ? localPage.edges : [];
  for (const [nodeId, baseNode] of baseNodes) {
    const currentDeleted = !currentNodes.has(nodeId);
    const localDeleted = !localNodes.has(nodeId);
    if (currentDeleted && localEdges.some((edge) => (edge.source === nodeId || edge.target === nodeId) && !sameValue(itemMap(basePage.edges).get(edge.id), edge))) {
      reasons.push(`node-edge:${nodeId}`);
    }
    if (localDeleted && currentEdges.some((edge) => (edge.source === nodeId || edge.target === nodeId) && !sameValue(itemMap(basePage.edges).get(edge.id), edge))) {
      reasons.push(`node-edge:${nodeId}`);
    }
    void baseNode;
  }
}

function conflictCopyName(sourceName, language, createdAt, existingNames, copyKind = "manual") {
  const stamp = new Intl.DateTimeFormat(language === "en" ? "en-CA" : "zh-CN", {
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).format(new Date(createdAt)).replace(/\//g, "-").replace(",", "");
  const label = copyKind === "recovery"
    ? language === "en" ? "AI recovery copy" : "AI 恢复副本"
    : copyKind === "conflict"
      ? language === "en" ? "AI conflict copy" : "AI 冲突副本"
      : language === "en" ? "Conflict copy" : "冲突副本";
  const base = `${sourceName} · ${label} · ${stamp}`;
  let candidate = base;
  let serial = 2;
  while (existingNames.has(candidate)) candidate = `${base} (${serial++})`;
  existingNames.add(candidate);
  return candidate;
}

function deterministicUniqueId(prefix, mutationId, sourceId, usedIds) {
  const digest = crypto.createHash("sha256").update(`${mutationId}:${sourceId}`).digest("hex").slice(0, 12);
  const safeSource = String(sourceId || "item").replace(/[^a-zA-Z0-9_-]+/g, "-").slice(0, 48);
  let candidate = `${prefix}-${safeSource}-${digest}`;
  let serial = 2;
  while (usedIds.has(candidate)) candidate = `${prefix}-${safeSource}-${digest}-${serial++}`;
  usedIds.add(candidate);
  return candidate;
}

function createConflictPage(sourcePage, options) {
  const { baseRevision, clientMutationId, copyKind = "manual", createdAt, existingNames, incomingIntent, language, priorRevision, reasons, usedEdgeIds, usedNodeIds, usedPageIds } = options;
  const pageId = deterministicUniqueId("conflict-page", clientMutationId, sourcePage.id, usedPageIds);
  const nodeIds = new Map();
  const nodes = sourcePage.nodes.map((node) => {
    const id = deterministicUniqueId("conflict-node", clientMutationId, `${sourcePage.id}:${node.id}`, usedNodeIds);
    nodeIds.set(node.id, id);
    return { ...node, id, selected: false };
  });
  const edges = sourcePage.edges
    .filter((edge) => nodeIds.has(edge.source) && nodeIds.has(edge.target))
    .map((edge) => ({
      ...edge,
      id: deterministicUniqueId("conflict-edge", clientMutationId, `${sourcePage.id}:${edge.id}`, usedEdgeIds),
      source: nodeIds.get(edge.source),
      target: nodeIds.get(edge.target)
    }));
  const page = {
    ...sourcePage,
    id: pageId,
    name: conflictCopyName(sourcePage.name, language, createdAt, existingNames, copyKind),
    createdAt,
    updatedAt: createdAt,
    nodes,
    edges,
    conflict: {
      sourcePageId: sourcePage.id,
      baseRevision,
      priorRevision,
      reasons: [...new Set(reasons)],
      incomingIntent,
      ...(copyKind === "manual" ? {} : { copyKind }),
      createdAt,
      incomingFingerprint: documentFingerprint(sourcePage)
    }
  };
  return {
    page,
    nodeIdMap: Object.fromEntries(nodeIds),
    edgeIdMap: Object.fromEntries(sourcePage.edges.map((edge, index) => [edge.id, edges[index]?.id]).filter((entry) => entry[1]))
  };
}

function rebuildDocumentMirrors(document, projectPath) {
  const pages = document.pages;
  const activePageId = pages.some((page) => page.id === document.activePageId) ? document.activePageId : pages[0].id;
  const activePage = pages.find((page) => page.id === activePageId) || pages[0];
  return normalizeScatterDocument({
    ...document,
    projectName: document.projectName || projectNameFromPath(projectPath),
    activePageId,
    viewport: activePage.viewport,
    nodes: activePage.nodes,
    edges: activePage.edges
  }, projectPath);
}

function mergeConcurrentDocuments({ baseDocument, currentDocument, deletedPageSnapshots, localDocument, baseRevision, priorRevision, clientMutationId, language, objectWriters, projectPath }) {
  const basePages = itemMap(baseDocument.pages);
  const currentPages = itemMap(currentDocument.pages);
  const localPages = itemMap(localDocument.pages);
  const deletedSnapshots = isObject(deletedPageSnapshots) ? deletedPageSnapshots : {};
  const pageIds = [...new Set([...basePages.keys(), ...currentPages.keys(), ...localPages.keys()])];
  const pages = [];
  const conflictCopies = [];
  const mergedPageIds = [];
  const createdAt = nowIso();
  const usedPageIds = new Set(currentDocument.pages.map((page) => page.id));
  const usedNodeIds = new Set(currentDocument.pages.flatMap((page) => page.nodes.map((node) => node.id)));
  const usedEdgeIds = new Set(currentDocument.pages.flatMap((page) => page.edges.map((edge) => edge.id)));
  const existingNames = new Set(currentDocument.pages.map((page) => page.name));
  let localActivePageId = localDocument.activePageId;

  for (const pageId of pageIds) {
    const basePage = basePages.get(pageId);
    const currentPage = currentPages.get(pageId);
    const localPage = localPages.get(pageId);
    const currentChanged = pageContentChanged(basePage, currentPage);
    const localChanged = pageContentChanged(basePage, localPage);
    if (!basePage) {
      if (currentPage && localPage && !sameValue(currentPage, localPage)) {
        pages.push(currentPage);
        const reasons = [`page-add:${pageId}`];
        const copy = createConflictPage(localPage, { baseRevision, clientMutationId, createdAt, existingNames, incomingIntent: "edit", language, priorRevision, reasons, usedEdgeIds, usedNodeIds, usedPageIds });
        pages.push(copy.page);
        conflictCopies.push({ sourcePageId: pageId, conflictPageId: copy.page.id, originalPageId: pageId, originalPageAvailable: true, incomingIntent: "edit", reasons, nodeIdMap: copy.nodeIdMap, edgeIdMap: copy.edgeIdMap });
        localActivePageId = copy.page.id;
      } else if (localPage) pages.push(localPage);
      else if (currentPage) pages.push(currentPage);
      continue;
    }
    if (!localPage && !currentPage) continue;
    if (!localPage) {
      if (!currentChanged) continue;
      pages.push(currentPage);
      const snapshot = deletedSnapshots[pageId] ? normalizeScatterPage(deletedSnapshots[pageId], 0, basePage) : basePage;
      const reasons = [`page-delete-edit:${pageId}`];
      const copy = createConflictPage(snapshot, { baseRevision, clientMutationId, createdAt, existingNames, incomingIntent: "delete", language, priorRevision, reasons, usedEdgeIds, usedNodeIds, usedPageIds });
      pages.push(copy.page);
      conflictCopies.push({ sourcePageId: pageId, conflictPageId: copy.page.id, originalPageId: pageId, originalPageAvailable: true, incomingIntent: "delete", reasons, nodeIdMap: copy.nodeIdMap, edgeIdMap: copy.edgeIdMap });
      localActivePageId = copy.page.id;
      continue;
    }
    if (!currentPage) {
      if (!localChanged) continue;
      const reasons = [`page-delete-edit:${pageId}`];
      const copy = createConflictPage(localPage, { baseRevision, clientMutationId, createdAt, existingNames, incomingIntent: "edit", language, priorRevision, reasons, usedEdgeIds, usedNodeIds, usedPageIds });
      pages.push(copy.page);
      conflictCopies.push({ sourcePageId: pageId, conflictPageId: copy.page.id, originalPageId: pageId, originalPageAvailable: false, incomingIntent: "edit", reasons, nodeIdMap: copy.nodeIdMap, edgeIdMap: copy.edgeIdMap });
      localActivePageId = copy.page.id;
      continue;
    }
    if (!localChanged) {
      pages.push(currentPage);
      continue;
    }
    if (!currentChanged) {
      pages.push({ ...localPage, viewport: currentPage.viewport });
      continue;
    }
    if (!pageContentChanged(currentPage, localPage)) {
      pages.push(currentPage);
      continue;
    }
    const reasons = [];
    if (basePage.name !== currentPage.name && basePage.name !== localPage.name && currentPage.name !== localPage.name) reasons.push(`page-name:${pageId}`);
    const mergedNodes = mergeAtomicItems(basePage.nodes, currentPage.nodes, localPage.nodes, comparableNode, "node", reasons);
    const mergedEdges = mergeAtomicItems(basePage.edges, currentPage.edges, localPage.edges, (edge) => edge, "edge", reasons);
    edgeIncidentConflict(basePage, currentPage, localPage, reasons);
    const mergedNodeIds = new Set(mergedNodes.map((node) => node.id));
    if (mergedEdges.some((edge) => !mergedNodeIds.has(edge.source) || !mergedNodeIds.has(edge.target))) reasons.push(`dangling-edge:${pageId}`);
    if (reasons.length) {
      const directConflictReasons = reasons.filter((reason) => /^(node|edge|page-name):/.test(reason));
      const conflictOwnedByAi = directConflictReasons.length > 0 && directConflictReasons.every((reason) => {
        const [kind, id] = reason.split(":");
        if (kind === "node") return objectWriters?.[`node:${pageId}:${id}`] === "ai";
        if (kind === "edge") return objectWriters?.[`edge:${pageId}:${id}`] === "ai";
        if (kind === "page-name") return objectWriters?.[`page:${pageId}`] === "ai";
        return false;
      });
      if (conflictOwnedByAi) {
        const humanReasons = [];
        const humanNodes = mergeAtomicItems(basePage.nodes, localPage.nodes, currentPage.nodes, comparableNode, "node", humanReasons, "current");
        const humanEdges = mergeAtomicItems(basePage.edges, localPage.edges, currentPage.edges, (edge) => edge, "edge", humanReasons, "current");
        const humanNodeIds = new Set(humanNodes.map((node) => node.id));
        const validHumanEdges = humanEdges.filter((edge) => humanNodeIds.has(edge.source) && humanNodeIds.has(edge.target));
        pages.push({
          ...currentPage,
          name: localPage.name !== basePage.name ? localPage.name : currentPage.name,
          viewport: localPage.viewport,
          updatedAt: createdAt,
          nodes: humanNodes,
          edges: validHumanEdges
        });
        const humanPositions = itemMap(localPage.nodes);
        const aiCandidate = {
          ...currentPage,
          nodes: currentPage.nodes.map((node) => humanPositions.has(node.id) ? { ...node, position: humanPositions.get(node.id).position } : node)
        };
        const copy = createConflictPage(aiCandidate, {
          baseRevision,
          clientMutationId,
          copyKind: "conflict",
          createdAt,
          existingNames,
          incomingIntent: "edit",
          language,
          priorRevision,
          reasons,
          usedEdgeIds,
          usedNodeIds,
          usedPageIds
        });
        copy.page.conflict.source = "ai";
        pages.push(copy.page);
        conflictCopies.push({ sourcePageId: pageId, conflictPageId: copy.page.id, originalPageId: pageId, originalPageAvailable: true, incomingIntent: "edit", source: "ai", reasons: [...new Set(reasons)], nodeIdMap: copy.nodeIdMap, edgeIdMap: copy.edgeIdMap });
        continue;
      }
      pages.push(currentPage);
      const copy = createConflictPage(localPage, { baseRevision, clientMutationId, createdAt, existingNames, incomingIntent: "edit", language, priorRevision, reasons, usedEdgeIds, usedNodeIds, usedPageIds });
      pages.push(copy.page);
      conflictCopies.push({ sourcePageId: pageId, conflictPageId: copy.page.id, originalPageId: pageId, originalPageAvailable: true, incomingIntent: "edit", reasons: [...new Set(reasons)], nodeIdMap: copy.nodeIdMap, edgeIdMap: copy.edgeIdMap });
      if (localDocument.activePageId === pageId) localActivePageId = copy.page.id;
      continue;
    }
    pages.push({
      ...currentPage,
      name: localPage.name !== basePage.name ? localPage.name : currentPage.name,
      updatedAt: createdAt,
      nodes: mergedNodes,
      edges: mergedEdges
    });
    mergedPageIds.push(pageId);
  }
  if (!pages.length) pages.push(defaultScatterPage());
  const document = sameValue(pages, currentDocument.pages)
    ? currentDocument
    : rebuildDocumentMirrors({
        ...currentDocument,
        updatedAt: createdAt,
        pages
      }, projectPath);
  return { document, conflictCopies, mergedPageIds, localActivePageId };
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
  const directTitles = [
    normalizeTemplateQuery(guidanceFile.title),
    normalizeTemplateQuery(guidanceFile.agentTeamOnlyTitle),
    normalizeTemplateQuery(`补充 ${guidanceFile.canonicalName}`)
  ].filter(Boolean);
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

function projectGuidanceFileStatus(projectPath, guidanceFile) {
  const existingPath = guidanceFile.candidates.map((candidate) => path.join(projectPath, candidate)).find((candidate) => fs.existsSync(candidate));
  if (!existingPath) return "missing";
  if (guidanceFile.canonicalName !== "AGENTS.md") return "present";
  try {
    const existing = fs.readFileSync(existingPath, "utf8");
    const startIndex = existing.indexOf(AGENT_TEAM_AGENTS_MD_START);
    const endIndex = existing.indexOf(AGENT_TEAM_AGENTS_MD_END);
    if (startIndex >= 0 && endIndex > startIndex) {
      const outsideManagedBlock = `${existing.slice(0, startIndex)}${existing.slice(endIndex + AGENT_TEAM_AGENTS_MD_END.length)}`;
      if (!outsideManagedBlock.trim()) return "agent-team-only";
    }
  } catch {
    return "present";
  }
  return "present";
}

function projectHasGuidanceFile(projectPath, guidanceFile) {
  return projectGuidanceFileStatus(projectPath, guidanceFile) === "present";
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

function requiresSoftwareProductGuidance(args) {
  if (Object.prototype.hasOwnProperty.call(args || {}, "frameworkManifest")) {
    const manifest = isObject(args?.frameworkManifest) ? args.frameworkManifest : null;
    return manifest?.primaryDomain === "software-product" && manifest.intent !== "refine";
  }
  return normalizeGraphType(args?.graphType) === "software-product";
}

function softwareProductGuidanceNodes(projectPath, args, pageIndex, rawNodes) {
  if (!requiresSoftwareProductGuidance(args) || pageIndex !== 0 || !projectPath) return [];
  const usedIds = guidanceInputNodeIds(rawNodes);
  return SOFTWARE_PRODUCT_GUIDANCE_FILES.map((guidanceFile) => ({ guidanceFile, status: projectGuidanceFileStatus(projectPath, guidanceFile) }))
    .filter(({ status }) => status !== "present")
    .filter(({ guidanceFile }) => !graphHasGuidanceNode(rawNodes, guidanceFile))
    .map(({ guidanceFile, status }) => ({
      id: projectGuidanceNodeId(guidanceFile.nodeId, usedIds),
      title: status === "agent-team-only" ? guidanceFile.agentTeamOnlyTitle : guidanceFile.title,
      body: status === "agent-team-only" ? guidanceFile.agentTeamOnlyBody : guidanceFile.body,
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

  const connectedIds = new Set(edges.flatMap((edge) => [edge.source, edge.target]));
  const connectedNodes = nodes.filter((node) => connectedIds.has(node.id));
  const isolatedNodes = nodes.filter((node) => !connectedIds.has(node.id));
  const nodeIndex = new Map(nodes.map((node, index) => [node.id, index]));
  const children = new Map(connectedNodes.map((node) => [node.id, []]));
  const parentIds = new Set();
  edges.forEach((edge) => {
    if (!children.has(edge.source) || !children.has(edge.target)) return;
    children.get(edge.source).push(edge.target);
    parentIds.add(edge.target);
  });
  children.forEach((ids) => ids.sort((a, b) => (nodeIndex.get(a) || 0) - (nodeIndex.get(b) || 0)));
  const roots = connectedNodes.filter((node) => !parentIds.has(node.id));
  const positions = new Map();
  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const vertical = layout === "vertical";
  const crossGap = vertical ? GRAPH_LAYER_GAP : GRAPH_ROW_GAP;
  const mainGap = vertical ? GRAPH_ROW_GAP : GRAPH_LAYER_GAP;
  const crossSize = (nodeId) => {
    const node = nodeById.get(nodeId);
    return vertical ? optionalDimension(node?.width) || GRAPH_NODE_WIDTH : optionalDimension(node?.height) || GRAPH_NODE_HEIGHT;
  };
  const mainSize = (nodeId) => {
    const node = nodeById.get(nodeId);
    return vertical ? optionalDimension(node?.height) || GRAPH_NODE_HEIGHT : optionalDimension(node?.width) || GRAPH_NODE_WIDTH;
  };
  const spans = new Map();
  const measuring = new Set();
  const measure = (nodeId) => {
    if (spans.has(nodeId)) return spans.get(nodeId);
    if (measuring.has(nodeId)) return crossSize(nodeId);
    measuring.add(nodeId);
    const childSpans = (children.get(nodeId) || []).map(measure);
    const childrenSpan = childSpans.length ? childSpans.reduce((sum, span) => sum + span, 0) + crossGap * (childSpans.length - 1) : 0;
    const span = Math.max(crossSize(nodeId), childrenSpan);
    measuring.delete(nodeId);
    spans.set(nodeId, span);
    return span;
  };
  const depths = new Map();
  const placed = new Set();
  const place = (nodeId, depth, start) => {
    if (placed.has(nodeId)) return;
    placed.add(nodeId);
    depths.set(nodeId, depth);
    const span = measure(nodeId);
    const size = crossSize(nodeId);
    const crossPosition = start + (span - size) / 2;
    positions.set(nodeId, vertical ? { x: crossPosition, y: 0 } : { x: 0, y: crossPosition });
    const childIds = children.get(nodeId) || [];
    const childTotal = childIds.length
      ? childIds.reduce((sum, childId) => sum + measure(childId), 0) + crossGap * (childIds.length - 1)
      : 0;
    let childStart = start + (span - childTotal) / 2;
    childIds.forEach((childId) => {
      place(childId, depth + 1, childStart);
      childStart += measure(childId) + crossGap;
    });
  };
  let forestStart = 0;
  [...roots, ...connectedNodes.filter((node) => !roots.includes(node))].forEach((node) => {
    if (placed.has(node.id)) return;
    place(node.id, 0, forestStart);
    forestStart += measure(node.id) + crossGap;
  });
  const layerSizes = new Map();
  depths.forEach((depth, nodeId) => layerSizes.set(depth, Math.max(layerSizes.get(depth) || 0, mainSize(nodeId))));
  const layerOffsets = new Map();
  let mainOffset = 0;
  [...layerSizes.keys()].sort((a, b) => a - b).forEach((depth) => {
    layerOffsets.set(depth, mainOffset);
    mainOffset += layerSizes.get(depth) + mainGap;
  });
  positions.forEach((position, nodeId) => {
    const mainPosition = layerOffsets.get(depths.get(nodeId)) || 0;
    positions.set(nodeId, vertical ? { ...position, y: mainPosition } : { ...position, x: mainPosition });
  });

  if (isolatedNodes.length) {
    const positionedNodes = [...positions.keys()].map((nodeId) => ({ node: nodeById.get(nodeId), position: positions.get(nodeId) }));
    const isolatedStart = positionedNodes.length
      ? Math.max(...positionedNodes.map(({ node, position }) => (vertical ? position.x + (optionalDimension(node?.width) || GRAPH_NODE_WIDTH) : position.y + (optionalDimension(node?.height) || GRAPH_NODE_HEIGHT)))) + crossGap
      : 0;
    let isolatedCursor = isolatedStart;
    isolatedNodes.forEach((node) => {
      const size = vertical ? optionalDimension(node.width) || GRAPH_NODE_WIDTH : optionalDimension(node.height) || GRAPH_NODE_HEIGHT;
      positions.set(node.id, vertical ? { x: isolatedCursor, y: 0 } : { x: 0, y: isolatedCursor });
      isolatedCursor += size + crossGap;
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

function relayoutGraphPage(page, layout, layoutPolicy = "auto") {
  const preserveExplicit = normalizeGraphLayoutPolicy(layoutPolicy) === "preserve-explicit";
  const positionAxes = new Map(page.nodes.map((node) => [node.id, preserveExplicit ? { x: true, y: true } : { x: false, y: false }]));
  return {
    ...page,
    nodes: applyGraphAutoLayout(page.nodes, page.edges, layout, positionAxes)
  };
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
  const layoutPolicy = normalizeGraphLayoutPolicy(page.layoutPolicy || args?.layoutPolicy);
  const rawNodes = Array.isArray(page.nodes) ? page.nodes : [];
  if (rawNodes.length === 0) throw new HttpError(400, `pages[${index}].nodes must contain at least one node`);
  const guidanceNodes = softwareProductGuidanceNodes(projectPath, args, index, rawNodes);
  const rawNodeInputs = [...rawNodes, ...guidanceNodes];
  const usedNodeIds = new Set();
  const nodes = rawNodeInputs.map((node, nodeIndex) => normalizeGraphNode(node, nodeIndex, layout, usedNodeIds, templates, reusedTemplates));
  const positionAxesByNodeId = new Map(
    nodes.map((node, nodeIndex) => [
      node.id,
      layoutPolicy === "preserve-explicit" ? graphNodePositionAxes(rawNodeInputs[nodeIndex]) : { x: false, y: false }
    ])
  );
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

function graphViolation(code, pathValue, message, repair) {
  return {
    code,
    path: pathValue,
    message,
    repair
  };
}

function validationFailure(documentRevision, violations, advisories = []) {
  return {
    status: "validation_failed",
    written: false,
    documentRevision,
    validation: {
      passed: false,
      violations,
      advisories
    }
  };
}

function activeScatterPage(document) {
  return document.pages.find((page) => page.id === document.activePageId) || document.pages[0];
}

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value));
}

function mergeGraphNodeChanges(node, changes) {
  const rawChanges = isObject(changes) ? changes : {};
  const {
    id: _id,
    title,
    body,
    attachments,
    effort,
    runMode,
    codexMode: _codexMode,
    data: rawData,
    position: rawPosition,
    ...nodeChanges
  } = rawChanges;
  const dataChanges = isObject(rawData) ? rawData : {};
  const { codexMode: _dataCodexMode, planMode: _planMode, ...safeDataChanges } = dataChanges;
  return {
    ...node,
    ...nodeChanges,
    ...(isObject(rawPosition)
      ? {
          position: {
            ...node.position,
            ...(hasGraphCoordinate(rawPosition.x) ? { x: Number(rawPosition.x) } : {}),
            ...(hasGraphCoordinate(rawPosition.y) ? { y: Number(rawPosition.y) } : {})
          }
        }
      : {}),
    data: {
      ...node.data,
      ...safeDataChanges,
      ...(typeof title === "string" ? { title: title.trim() } : {}),
      ...(typeof body === "string" ? { body } : {}),
      ...(Array.isArray(attachments) ? { attachments: attachments.map(normalizeAttachment) } : {}),
      ...(effort !== undefined ? { effort: normalizeEffort(effort) } : {}),
      ...(runMode !== undefined ? { runMode: normalizeRunMode(runMode) } : {})
    }
  };
}

function mergeGraphEdgeChanges(edge, changes) {
  const rawChanges = isObject(changes) ? changes : {};
  const { id: _id, ...safeChanges } = rawChanges;
  return {
    ...edge,
    ...safeChanges,
    ...(typeof safeChanges.source === "string" ? { source: safeChanges.source.trim() } : {}),
    ...(typeof safeChanges.target === "string" ? { target: safeChanges.target.trim() } : {}),
    ...(typeof safeChanges.label === "string" ? { label: safeChanges.label.trim() } : {})
  };
}

function nextMergedNodePosition(page, nodeId, addedNodeIds, explicitPositionIds, layout = "horizontal") {
  if (explicitPositionIds.has(nodeId)) return null;
  const incoming = page.edges.find((edge) => edge.target === nodeId);
  const parent = incoming ? page.nodes.find((node) => node.id === incoming.source) : null;
  const occupied = page.nodes.filter((node) => node.id !== nodeId).map((node) => node.position || { x: 0, y: 0 });
  const vertical = layout === "vertical";
  const maxX = occupied.length ? Math.max(...occupied.map((position) => toNumber(position.x, 0))) : 0;
  const maxY = occupied.length ? Math.max(...occupied.map((position) => toNumber(position.y, 0))) : 0;
  const base = parent?.position
    ? vertical
      ? { x: toNumber(parent.position.x, 0), y: toNumber(parent.position.y, 0) + GRAPH_NODE_HEIGHT + GRAPH_ROW_GAP }
      : { x: toNumber(parent.position.x, 0) + GRAPH_NODE_WIDTH + GRAPH_LAYER_GAP, y: toNumber(parent.position.y, 0) }
    : vertical
      ? { x: 0, y: maxY + GRAPH_NODE_HEIGHT + GRAPH_ROW_GAP }
      : { x: maxX + GRAPH_NODE_WIDTH + GRAPH_LAYER_GAP, y: 0 };
  let candidate = base;
  let row = 0;
  const collides = (position) =>
    occupied.some(
      (other) =>
        Math.abs(toNumber(other.x, 0) - position.x) < GRAPH_NODE_WIDTH &&
        Math.abs(toNumber(other.y, 0) - position.y) < GRAPH_NODE_HEIGHT
    );
  while (collides(candidate)) {
    row += 1;
    candidate = vertical
      ? { x: base.x + row * (GRAPH_NODE_WIDTH + GRAPH_LAYER_GAP), y: base.y }
      : { x: base.x, y: base.y + row * (GRAPH_NODE_HEIGHT + GRAPH_ROW_GAP) };
  }
  addedNodeIds.delete(nodeId);
  return candidate;
}

function applyMergeOperations(existingPage, args, templates, reusedTemplates) {
  const page = cloneJson(existingPage);
  const operations = Array.isArray(args?.operations) ? args.operations : [];
  const violations = [];
  const addedNodeIds = new Set();
  const explicitPositionIds = new Set();
  const removedNodeIds = [];
  const removedEdgeIds = [];
  let relayoutRequested = false;
  const summary = {
    addedNodeIds: [],
    updatedNodeIds: [],
    removedNodeIds,
    addedEdgeIds: [],
    updatedEdgeIds: [],
    removedEdgeIds,
    relayoutApplied: false
  };

  if (operations.length === 0) {
    violations.push(graphViolation("operations_required", "operations", "merge-active-page requires at least one operation.", "Add explicit node or edge operations."));
    return { page, violations, summary };
  }

  operations.forEach((operation, index) => {
    const opPath = `operations[${index}]`;
    if (!isObject(operation) || typeof operation.op !== "string") {
      violations.push(graphViolation("invalid_operation", opPath, "Operation must be an object with an op field.", "Use add/update/remove node or edge operations."));
      return;
    }
    const nodeIndex = typeof operation.nodeId === "string" ? page.nodes.findIndex((node) => node.id === operation.nodeId.trim()) : -1;
    const edgeIndex = typeof operation.edgeId === "string" ? page.edges.findIndex((edge) => edge.id === operation.edgeId.trim()) : -1;
    try {
      if (operation.op === "relayout-page") {
        relayoutRequested = true;
        return;
      }
      if (operation.op === "add-node") {
        if (!isObject(operation.node)) {
          violations.push(graphViolation("node_required", `${opPath}.node`, "add-node requires a node object.", "Provide the node to add."));
          return;
        }
        const usedIds = new Set(page.nodes.map((node) => node.id));
        const node = normalizeGraphNode(operation.node, page.nodes.length, normalizeGraphLayout(args?.layout), usedIds, templates, reusedTemplates);
        page.nodes.push(node);
        addedNodeIds.add(node.id);
        if (graphNodePositionAxes(operation.node).x && graphNodePositionAxes(operation.node).y) explicitPositionIds.add(node.id);
        summary.addedNodeIds.push(node.id);
        return;
      }
      if (operation.op === "update-node") {
        if (typeof operation.nodeId !== "string" || nodeIndex < 0) {
          violations.push(graphViolation("node_not_found", `${opPath}.nodeId`, "update-node target does not exist.", "Re-read graph context and use an existing node id."));
          return;
        }
        if (!isObject(operation.changes)) {
          violations.push(graphViolation("changes_required", `${opPath}.changes`, "update-node requires a changes object.", "Provide the node fields to update."));
          return;
        }
        if (Object.prototype.hasOwnProperty.call(operation.changes, "id")) {
          violations.push(graphViolation("immutable_id", `${opPath}.changes.id`, "Node ids cannot be changed.", "Remove id from changes and target the node with nodeId."));
          return;
        }
        page.nodes[nodeIndex] = mergeGraphNodeChanges(page.nodes[nodeIndex], operation.changes);
        summary.updatedNodeIds.push(page.nodes[nodeIndex].id);
        return;
      }
      if (operation.op === "remove-node") {
        if (typeof operation.nodeId !== "string" || nodeIndex < 0) {
          violations.push(graphViolation("node_not_found", `${opPath}.nodeId`, "remove-node target does not exist.", "Re-read graph context and use an existing node id."));
          return;
        }
        const [removed] = page.nodes.splice(nodeIndex, 1);
        removedNodeIds.push(removed.id);
        page.edges = page.edges.filter((edge) => {
          if (edge.source !== removed.id && edge.target !== removed.id) return true;
          removedEdgeIds.push(edge.id);
          return false;
        });
        return;
      }
      if (operation.op === "add-edge") {
        if (!isObject(operation.edge)) {
          violations.push(graphViolation("edge_required", `${opPath}.edge`, "add-edge requires an edge object.", "Provide the edge to add."));
          return;
        }
        const edge = {
          ...operation.edge,
          id:
            typeof operation.edge.id === "string" && operation.edge.id.trim()
              ? operation.edge.id.trim()
              : generatedGraphId("edge", page.edges.length, new Set(page.edges.map((item) => item.id))),
          source: typeof operation.edge.source === "string" ? operation.edge.source.trim() : "",
          target: typeof operation.edge.target === "string" ? operation.edge.target.trim() : ""
        };
        if (page.edges.some((item) => item.id === edge.id)) {
          violations.push(graphViolation("duplicate_edge_id", `${opPath}.edge.id`, `Duplicate edge id: ${edge.id}`, "Choose a unique edge id."));
          return;
        }
        page.edges.push(edge);
        summary.addedEdgeIds.push(edge.id);
        return;
      }
      if (operation.op === "update-edge") {
        if (typeof operation.edgeId !== "string" || edgeIndex < 0) {
          violations.push(graphViolation("edge_not_found", `${opPath}.edgeId`, "update-edge target does not exist.", "Re-read graph context and use an existing edge id."));
          return;
        }
        if (!isObject(operation.changes)) {
          violations.push(graphViolation("changes_required", `${opPath}.changes`, "update-edge requires a changes object.", "Provide the edge fields to update."));
          return;
        }
        if (Object.prototype.hasOwnProperty.call(operation.changes, "id")) {
          violations.push(graphViolation("immutable_id", `${opPath}.changes.id`, "Edge ids cannot be changed.", "Remove id from changes and target the edge with edgeId."));
          return;
        }
        page.edges[edgeIndex] = mergeGraphEdgeChanges(page.edges[edgeIndex], operation.changes);
        summary.updatedEdgeIds.push(page.edges[edgeIndex].id);
        return;
      }
      if (operation.op === "remove-edge") {
        if (typeof operation.edgeId !== "string" || edgeIndex < 0) {
          violations.push(graphViolation("edge_not_found", `${opPath}.edgeId`, "remove-edge target does not exist.", "Re-read graph context and use an existing edge id."));
          return;
        }
        const [removed] = page.edges.splice(edgeIndex, 1);
        removedEdgeIds.push(removed.id);
        return;
      }
      violations.push(graphViolation("unsupported_operation", `${opPath}.op`, `Unsupported operation: ${operation.op}`, "Use add/update/remove node or edge operations."));
    } catch (error) {
      violations.push(graphViolation("invalid_operation", opPath, error?.message || "Invalid graph operation.", "Correct this operation using the latest graph context."));
    }
  });

  page.nodes = page.nodes.map((node) => {
    if (!addedNodeIds.has(node.id)) return node;
    const position = nextMergedNodePosition(page, node.id, addedNodeIds, explicitPositionIds, normalizeGraphLayout(args?.layout));
    return position ? { ...node, position } : node;
  });
  if (relayoutRequested) {
    const layout = normalizeGraphLayout(args?.layout || "horizontal");
    const relayouted = relayoutGraphPage(page, layout, args?.layoutPolicy);
    page.nodes = relayouted.nodes;
    summary.relayoutApplied = true;
  }
  page.updatedAt = nowIso();
  return { page, violations, summary };
}

function mergeMutationSummaries(primary, secondary) {
  return {
    addedNodeIds: [...primary.addedNodeIds, ...secondary.addedNodeIds],
    updatedNodeIds: [...primary.updatedNodeIds, ...secondary.updatedNodeIds],
    removedNodeIds: [...primary.removedNodeIds, ...secondary.removedNodeIds],
    addedEdgeIds: [...primary.addedEdgeIds, ...secondary.addedEdgeIds],
    updatedEdgeIds: [...primary.updatedEdgeIds, ...secondary.updatedEdgeIds],
    removedEdgeIds: [...primary.removedEdgeIds, ...secondary.removedEdgeIds],
    relayoutApplied: primary.relayoutApplied || secondary.relayoutApplied
  };
}

function ensureMergedSoftwareProductGuidance(page, args, projectPath, templates, reusedTemplates) {
  const guidanceNodes = softwareProductGuidanceNodes(projectPath, args, 0, page.nodes);
  if (guidanceNodes.length === 0) return { page, violations: [], summary: null, projectGuidanceNodes: [] };

  const usedEdgeIds = new Set(page.edges.map((edge) => edge.id));
  const sourceNode = page.nodes[0];
  const operations = [];
  guidanceNodes.forEach((node, index) => {
    operations.push({ op: "add-node", node });
    if (sourceNode) {
      operations.push({
        op: "add-edge",
        edge: {
          id: projectGuidanceEdgeId(index, usedEdgeIds),
          source: sourceNode.id,
          target: node.id
        }
      });
    }
  });
  if (Array.isArray(args?.operations) && args.operations.some((operation) => operation?.op === "relayout-page")) {
    operations.push({ op: "relayout-page" });
  }
  const merged = applyMergeOperations(page, { ...args, operations }, templates, reusedTemplates);
  return {
    ...merged,
    projectGuidanceNodes: guidanceNodes.map((node) => ({
      pageIndex: 0,
      nodeId: node.id,
      fileName: node.data.projectGuidanceFile
    }))
  };
}

function graphNodeBounds(node) {
  const x = toNumber(node?.position?.x, 0);
  const y = toNumber(node?.position?.y, 0);
  const width = optionalDimension(node?.width) || GRAPH_NODE_WIDTH;
  const height = optionalDimension(node?.height) || GRAPH_NODE_HEIGHT;
  return { x, y, width, height, right: x + width, bottom: y + height };
}

function validateGraphStructure(page, layout = "horizontal") {
  const violations = [];
  const nodeIds = new Set();
  page.nodes.forEach((node, index) => {
    if (!node.id || nodeIds.has(node.id)) {
      violations.push(graphViolation("duplicate_node_id", `nodes[${index}].id`, `Duplicate or empty node id: ${node.id || "(empty)"}`, "Assign every node a unique non-empty id."));
    }
    nodeIds.add(node.id);
  });
  const edgeIds = new Set();
  const pairs = new Set();
  const parentTargets = new Set();
  const adjacency = new Map(page.nodes.map((node) => [node.id, []]));
  page.edges.forEach((edge, index) => {
    if (!edge.id || edgeIds.has(edge.id)) violations.push(graphViolation("duplicate_edge_id", `edges[${index}].id`, `Duplicate or empty edge id: ${edge.id || "(empty)"}`, "Assign every edge a unique non-empty id."));
    edgeIds.add(edge.id);
    if (!nodeIds.has(edge.source)) violations.push(graphViolation("missing_edge_source", `edges[${index}].source`, `Edge source does not exist: ${edge.source}`, "Use an existing node id."));
    if (!nodeIds.has(edge.target)) violations.push(graphViolation("missing_edge_target", `edges[${index}].target`, `Edge target does not exist: ${edge.target}`, "Use an existing node id."));
    if (edge.source === edge.target) violations.push(graphViolation("self_edge", `edges[${index}]`, "An edge cannot connect a node to itself.", "Connect two different nodes or remove the edge."));
    const pair = `${edge.source}\u0000${edge.target}`;
    if (pairs.has(pair)) violations.push(graphViolation("duplicate_connection", `edges[${index}]`, `Duplicate connection: ${edge.source} -> ${edge.target}`, "Keep only one edge for this source-target pair."));
    pairs.add(pair);
    if (parentTargets.has(edge.target)) violations.push(graphViolation("multiple_parents", `edges[${index}].target`, `Node already has a parent edge: ${edge.target}`, "Keep one parent edge for each node."));
    parentTargets.add(edge.target);
    adjacency.get(edge.source)?.push(edge.target);
  });
  const visiting = new Set();
  const visited = new Set();
  const visit = (nodeId) => {
    if (visiting.has(nodeId)) return true;
    if (visited.has(nodeId)) return false;
    visiting.add(nodeId);
    if ((adjacency.get(nodeId) || []).some(visit)) return true;
    visiting.delete(nodeId);
    visited.add(nodeId);
    return false;
  };
  if (page.nodes.some((node) => visit(node.id))) {
    violations.push(graphViolation("cycle_detected", "edges", "Graph dependencies contain a cycle.", "Remove or reverse an edge so every dependency has a forward direction."));
  }
  page.nodes.forEach((node, index) => {
    const bounds = graphNodeBounds(node);
    page.nodes.slice(index + 1).forEach((other) => {
      const otherBounds = graphNodeBounds(other);
      const overlaps = bounds.x < otherBounds.right && bounds.right > otherBounds.x && bounds.y < otherBounds.bottom && bounds.bottom > otherBounds.y;
      if (overlaps) {
        violations.push(graphViolation("node_bounds_overlap", `nodes.${node.id}`, `Node bounds overlap: ${node.id} and ${other.id}.`, "Use automatic layout or move the nodes so their full rectangles do not intersect."));
      }
    });
  });
  const vertical = normalizeGraphLayout(layout) === "vertical";
  page.edges.forEach((edge, index) => {
    const source = page.nodes.find((node) => node.id === edge.source);
    const target = page.nodes.find((node) => node.id === edge.target);
    if (!source || !target) return;
    const sourceBounds = graphNodeBounds(source);
    const targetBounds = graphNodeBounds(target);
    const forward = vertical ? targetBounds.y >= sourceBounds.bottom : targetBounds.x >= sourceBounds.right;
    if (!forward) {
      violations.push(graphViolation("layout_direction_invalid", `edges[${index}]`, `Dependency is not ${vertical ? "top-to-bottom" : "left-to-right"}: ${edge.source} -> ${edge.target}.`, "Use automatic layout or move the target after its source along the selected layout direction."));
    }
  });
  return violations;
}

function meaningfulFrameworkNode(node) {
  const title = typeof node?.data?.title === "string" ? node.data.title.trim() : "";
  const body = typeof node?.data?.body === "string" ? node.data.body.trim() : "";
  const combined = `${title} ${body}`.trim().toLowerCase();
  if (!title || !body) return false;
  return !/^(todo|tbd|待补充|待完善|占位|placeholder|保持一致|简洁现代)[。.!！\s]*$/i.test(combined);
}

function escapeRegularExpression(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function nodeBodyHasSkillToken(node, skillName) {
  const body = typeof node?.data?.body === "string" ? node.data.body : "";
  if (!body || typeof skillName !== "string" || !skillName) return false;
  return new RegExp(`(^|\\s)\\$${escapeRegularExpression(skillName)}(?=$|\\s|[.,!?;，。！？；])`, "m").test(body);
}

function validateFrameworkManifest(page, manifest, projectPath, options = {}) {
  if (manifest === undefined || manifest === null) return { violations: [], advisories: [] };
  const violations = [];
  const advisories = [];
  if (!isObject(manifest)) {
    return {
      violations: [graphViolation("invalid_framework_manifest", "frameworkManifest", "frameworkManifest must be an object.", "Provide intent, primaryDomain, maturity, output, and coverage.")],
      advisories
    };
  }
  if (!VALID_FRAMEWORK_INTENTS.has(manifest.intent)) violations.push(graphViolation("invalid_framework_intent", "frameworkManifest.intent", `Unsupported intent: ${manifest.intent || "(empty)"}`, "Use a supported intent reference."));
  if (!VALID_FRAMEWORK_DOMAINS.has(manifest.primaryDomain)) violations.push(graphViolation("invalid_primary_domain", "frameworkManifest.primaryDomain", `Unsupported primary domain: ${manifest.primaryDomain || "(empty)"}`, "Use a supported primary domain reference."));
  if (!VALID_FRAMEWORK_MATURITY.has(manifest.maturity)) violations.push(graphViolation("invalid_framework_maturity", "frameworkManifest.maturity", `Unsupported maturity: ${manifest.maturity || "(empty)"}`, "Use explore, define, decide, or deliver."));
  if (!VALID_FRAMEWORK_OUTPUTS.has(manifest.output)) violations.push(graphViolation("invalid_framework_output", "frameworkManifest.output", `Unsupported output: ${manifest.output || "(empty)"}`, "Use a supported output topology."));
  const contentMode = manifest.contentMode === undefined ? "canvasight-default" : manifest.contentMode;
  const skillLed = contentMode === "skill-led";
  if (contentMode !== "canvasight-default" && !skillLed) {
    violations.push(graphViolation("invalid_content_mode", "frameworkManifest.contentMode", `Unsupported content mode: ${contentMode || "(empty)"}`, "Use canvasight-default or skill-led."));
  }
  const contentSkills = Array.isArray(manifest.contentSkills) ? manifest.contentSkills : [];
  if (manifest.contentSkills !== undefined && !Array.isArray(manifest.contentSkills)) {
    violations.push(graphViolation("invalid_content_skills", "frameworkManifest.contentSkills", "contentSkills must be an array.", "Provide one primary Skill and optional augment Skills."));
  }
  const contentSkillNames = new Set();
  contentSkills.forEach((skill, index) => {
    const skillPath = `frameworkManifest.contentSkills[${index}]`;
    if (!isObject(skill) || typeof skill.name !== "string" || !skill.name.trim()) {
      violations.push(graphViolation("invalid_content_skill", `${skillPath}.name`, "Content Skill name is required.", "Use an enabled Codex Skill name."));
    } else if (contentSkillNames.has(skill.name.trim())) {
      violations.push(graphViolation("duplicate_content_skill", `${skillPath}.name`, `Content Skill is duplicated: ${skill.name.trim()}`, "Keep one entry per content Skill."));
    } else {
      contentSkillNames.add(skill.name.trim());
    }
    if (!isObject(skill) || (skill.role !== "primary" && skill.role !== "augment")) {
      violations.push(graphViolation("invalid_content_skill_role", `${skillPath}.role`, `Unsupported content Skill role: ${skill?.role || "(empty)"}`, "Use primary or augment."));
    }
  });
  if (skillLed && contentSkills.filter((skill) => isObject(skill) && skill.role === "primary").length !== 1) {
    violations.push(graphViolation("primary_content_skill_required", "frameworkManifest.contentSkills", "skill-led content requires exactly one primary Skill.", "Choose one primary Skill and mark any other compatible Skills as augment."));
  }
  const secondaryDomains = Array.isArray(manifest.secondaryDomains) ? manifest.secondaryDomains : [];
  secondaryDomains.forEach((domain, index) => {
    if (!VALID_FRAMEWORK_DOMAINS.has(domain) || domain === manifest.primaryDomain) {
      violations.push(graphViolation("invalid_secondary_domain", `frameworkManifest.secondaryDomains[${index}]`, `Invalid secondary domain: ${domain}`, "Use a supported domain different from primaryDomain."));
    }
  });
  const coverage = isObject(manifest.coverage) ? manifest.coverage : {};
  if (!isObject(manifest.coverage)) violations.push(graphViolation("coverage_required", "frameworkManifest.coverage", "frameworkManifest.coverage must map contract keys to node id arrays.", "Add coverage for every primary-domain and maturity contract key."));
  const nodeById = new Map(page.nodes.map((node) => [node.id, node]));
  const skillAssignments = manifest.skillAssignments === undefined ? {} : manifest.skillAssignments;
  if (!isObject(skillAssignments)) {
    violations.push(graphViolation("invalid_skill_assignments", "frameworkManifest.skillAssignments", "skillAssignments must map final node ids to assignment arrays.", "Key assignments by final candidate node id."));
  } else {
    Object.entries(skillAssignments).forEach(([nodeId, assignments]) => {
      const node = nodeById.get(nodeId);
      if (!node) {
        violations.push(graphViolation("skill_assignment_node_not_found", `frameworkManifest.skillAssignments.${nodeId}`, `Skill assignment references a missing node: ${nodeId}`, "Use a node id from the final candidate page."));
        return;
      }
      if (!Array.isArray(assignments) || assignments.length === 0) {
        violations.push(graphViolation("invalid_skill_assignments", `frameworkManifest.skillAssignments.${nodeId}`, "Node Skill assignments must be a non-empty array.", "Remove the empty mapping or add a valid assignment."));
        return;
      }
      const assignedNames = new Set();
      assignments.forEach((assignment, index) => {
        const assignmentPath = `frameworkManifest.skillAssignments.${nodeId}[${index}]`;
        const name = typeof assignment?.name === "string" ? assignment.name.trim() : "";
        if (!name) {
          violations.push(graphViolation("skill_assignment_name_required", `${assignmentPath}.name`, "Skill assignment name is required.", "Use the exact Codex Skill name."));
        } else if (assignedNames.has(name)) {
          violations.push(graphViolation("duplicate_skill_assignment", `${assignmentPath}.name`, `Skill assignment is duplicated for ${nodeId}: ${name}`, "Keep one assignment per Skill on a node."));
        } else {
          assignedNames.add(name);
          if (!nodeBodyHasSkillToken(node, name)) {
            violations.push(graphViolation("skill_assignment_body_mismatch", `${assignmentPath}.name`, `Node ${nodeId} does not contain the visible $${name} token.`, `Add $${name} to the node body or remove the manifest assignment.`));
          }
        }
        if (assignment?.source !== "user-explicit" && assignment?.source !== "ai-selected") {
          violations.push(graphViolation("invalid_skill_assignment_source", `${assignmentPath}.source`, `Unsupported Skill assignment source: ${assignment?.source || "(empty)"}`, "Use user-explicit or ai-selected."));
        }
        if (assignment?.source === "ai-selected") {
          if (options.preferences?.aiSkillAssignmentEnabled !== true) {
            violations.push(graphViolation("ai_skill_assignment_disabled", assignmentPath, `AI-selected Skill assignment is disabled for node ${nodeId}.`, "Remove ai-selected assignments or enable the global Canvasight preference."));
          }
          if (typeof assignment.rationale !== "string" || !assignment.rationale.trim()) {
            violations.push(graphViolation("ai_skill_assignment_rationale_required", `${assignmentPath}.rationale`, `AI-selected Skill assignment lacks a responsibility-to-description rationale for node ${nodeId}.`, "Explain the clear match between this node responsibility and the Skill description."));
          }
        }
      });
    });
  }
  const validateCoverageKey = (key, required = true) => {
    const ids = coverage[key];
    if (!Array.isArray(ids) || ids.length === 0) {
      if (required) violations.push(graphViolation("missing_coverage", `frameworkManifest.coverage.${key}`, `Required coverage is missing: ${key}`, `Add or update a node that satisfies ${key}, then map its id here.`));
      return false;
    }
    ids.forEach((nodeId, index) => {
      const node = typeof nodeId === "string" ? nodeById.get(nodeId) : null;
      if (!node) {
        violations.push(graphViolation("coverage_node_not_found", `frameworkManifest.coverage.${key}[${index}]`, `Coverage references a missing node: ${String(nodeId)}`, "Use a node id from the final candidate page."));
      } else if (!meaningfulFrameworkNode(node)) {
        violations.push(graphViolation("coverage_content_incomplete", `frameworkManifest.coverage.${key}[${index}]`, `Coverage node is empty or placeholder-only: ${node.id}`, `Give ${node.id} a specific title and substantive body before retrying.`));
      }
    });
    return true;
  };
  const primaryDomainKeys = FRAMEWORK_DOMAIN_COVERAGE[manifest.primaryDomain] || [];
  const maturityKeys = FRAMEWORK_MATURITY_COVERAGE[manifest.maturity] || [];
  if (skillLed) {
    Object.keys(coverage).forEach((key) => validateCoverageKey(key, false));
    const coveredNodeIds = new Set(Object.values(coverage).flatMap((ids) => (Array.isArray(ids) ? ids.filter((id) => typeof id === "string") : [])));
    const requiredCoverageNodeIds = Array.isArray(options.requiredCoverageNodeIds) ? options.requiredCoverageNodeIds : [];
    requiredCoverageNodeIds.forEach((nodeId) => {
      if (!coveredNodeIds.has(nodeId)) {
        violations.push(graphViolation("skill_led_node_coverage_missing", "frameworkManifest.coverage", `Skill-led graph write does not cover new or updated node: ${nodeId}`, `Map ${nodeId} to a professional content responsibility in coverage.`));
      }
    });
  } else if (manifest.intent === "refine") {
    const suppliedPrimaryKeys = primaryDomainKeys.filter((key) => Array.isArray(coverage[key]) && coverage[key].length > 0);
    const suppliedMaturityKeys = maturityKeys.filter((key) => Array.isArray(coverage[key]) && coverage[key].length > 0);
    if (suppliedPrimaryKeys.length === 0) {
      violations.push(graphViolation("missing_coverage", "frameworkManifest.coverage", `Refine requires at least one ${manifest.primaryDomain} coverage key.`, `Map the refined content to one canonical ${manifest.primaryDomain} contract key.`));
    }
    if (suppliedMaturityKeys.length === 0) {
      violations.push(graphViolation("missing_coverage", "frameworkManifest.coverage", `Refine requires at least one ${manifest.maturity} maturity coverage key.`, `Map the refined content to one canonical ${manifest.maturity} maturity key.`));
    }
    const knownCoverageKeys = new Set([
      ...Object.values(FRAMEWORK_DOMAIN_COVERAGE).flat(),
      ...Object.values(FRAMEWORK_MATURITY_COVERAGE).flat()
    ]);
    Object.keys(coverage).forEach((key) => {
      if (knownCoverageKeys.has(key)) validateCoverageKey(key, false);
    });
    primaryDomainKeys.filter((key) => !suppliedPrimaryKeys.includes(key)).forEach((key) => {
      advisories.push({ code: "refine_contract_omitted", path: `frameworkManifest.coverage.${key}`, message: `Refine did not touch primary-domain contract key: ${key}` });
    });
    maturityKeys.filter((key) => !suppliedMaturityKeys.includes(key)).forEach((key) => {
      advisories.push({ code: "refine_contract_omitted", path: `frameworkManifest.coverage.${key}`, message: `Refine did not touch maturity contract key: ${key}` });
    });
  } else {
    primaryDomainKeys.forEach((key) => validateCoverageKey(key));
    maturityKeys.forEach((key) => validateCoverageKey(key));
  }
  if (!skillLed) {
    secondaryDomains.forEach((domain) => {
      const keys = FRAMEWORK_DOMAIN_COVERAGE[domain] || [];
      if (!keys.some((key) => Array.isArray(coverage[key]) && coverage[key].length > 0)) {
        violations.push(graphViolation("secondary_domain_coverage_missing", "frameworkManifest.coverage", `Secondary domain has no relevant coverage: ${domain}`, `Map at least one ${domain} contract key to a substantive node.`));
      }
    });
    Object.entries(coverage).forEach(([key]) => {
      const known = Object.values(FRAMEWORK_DOMAIN_COVERAGE).some((keys) => keys.includes(key)) || Object.values(FRAMEWORK_MATURITY_COVERAGE).some((keys) => keys.includes(key));
      if (!known) advisories.push({ code: "unknown_coverage_key", path: `frameworkManifest.coverage.${key}`, message: `Coverage key is not part of the current framework contracts: ${key}` });
    });
  }
  const semanticStructure = isObject(manifest.semanticStructure) ? manifest.semanticStructure : null;
  const semanticRelationships = isObject(manifest.semanticRelationships) ? manifest.semanticRelationships : null;
  const coveredNodeIds = new Set(Object.values(coverage).flatMap((ids) => (Array.isArray(ids) ? ids.filter((id) => typeof id === "string") : [])));
  if (!semanticStructure) {
    violations.push(
      graphViolation(
        "mixed_responsibilities",
        "frameworkManifest.semanticStructure",
        "Semantic responsibility review is required for framework graph writes.",
        "Describe each covered node's single responsibility and why its content is inseparable without using quantity-based thresholds."
      )
    );
  } else {
    coveredNodeIds.forEach((nodeId) => {
      const assessment = semanticStructure[nodeId];
      if (!isObject(assessment) || typeof assessment.responsibility !== "string" || !assessment.responsibility.trim()) {
        violations.push(graphViolation("mixed_responsibilities", `frameworkManifest.semanticStructure.${nodeId}.responsibility`, `Covered node lacks one clear responsibility: ${nodeId}.`, "State one responsibility, or split independently executable, decidable, verifiable, or deliverable content into child nodes."));
      }
      if (!isObject(assessment) || typeof assessment.inseparableReason !== "string" || !assessment.inseparableReason.trim()) {
        violations.push(graphViolation("hidden_submodules", `frameworkManifest.semanticStructure.${nodeId}.inseparableReason`, `Covered node has no semantic cohesion explanation: ${nodeId}.`, "Explain why the node's content must remain together, or expose independent content as related child nodes."));
      }
    });
    Object.keys(semanticStructure).forEach((nodeId) => {
      if (!nodeById.has(nodeId)) {
        violations.push(graphViolation("relationship_missing", `frameworkManifest.semanticStructure.${nodeId}`, `Semantic structure references a missing node: ${nodeId}.`, "Use a final candidate node id and connect split modules with explicit edges."));
      }
    });
    page.edges.forEach((edge) => {
      const parentBody = String(nodeById.get(edge.source)?.data?.body || "").trim();
      const childBody = String(nodeById.get(edge.target)?.data?.body || "").trim();
      if (parentBody && childBody && parentBody !== childBody && parentBody.includes(childBody)) {
        violations.push(graphViolation("parent_duplicates_children", `nodes.${edge.source}.body`, `Parent ${edge.source} duplicates the full body of child ${edge.target}.`, "Keep the parent as a summary and move detailed content to the child."));
      }
    });
  }
  if (!semanticRelationships) {
    violations.push(
      graphViolation(
        "semantic_relationships_required",
        "frameworkManifest.semanticRelationships",
        "Semantic relationship review is required for framework graph writes.",
        "Describe each relationship between covered responsibilities by final edge id, type, and rationale."
      )
    );
  } else {
    const edgeById = new Map(page.edges.map((edge) => [edge.id, edge]));
    Object.entries(semanticRelationships).forEach(([edgeId, assessment]) => {
      if (!edgeById.has(edgeId)) {
        violations.push(graphViolation("semantic_relationship_edge_not_found", `frameworkManifest.semanticRelationships.${edgeId}`, `Semantic relationship references a missing edge: ${edgeId}.`, "Use a final candidate edge id or remove the stale relationship review."));
        return;
      }
      if (!isObject(assessment) || !VALID_SEMANTIC_RELATIONSHIP_TYPES.has(assessment.type)) {
        violations.push(graphViolation("invalid_semantic_relationship_type", `frameworkManifest.semanticRelationships.${edgeId}.type`, `Semantic relationship has an unsupported type: ${assessment?.type || "(empty)"}.`, "Use dependency, sequence, containment, evidence, decision, navigation, or flow."));
      }
      if (!isObject(assessment) || typeof assessment.rationale !== "string" || !assessment.rationale.trim()) {
        violations.push(graphViolation("semantic_relationship_rationale_required", `frameworkManifest.semanticRelationships.${edgeId}.rationale`, `Semantic relationship lacks a rationale: ${edgeId}.`, "Explain why these two responsibilities have this relationship, or remove the edge."));
      }
    });
    const coveredEdges = page.edges.filter((edge) => coveredNodeIds.has(edge.source) && coveredNodeIds.has(edge.target));
    coveredEdges.forEach((edge) => {
      if (!isObject(semanticRelationships[edge.id])) {
        violations.push(graphViolation("semantic_relationship_missing", `frameworkManifest.semanticRelationships.${edge.id}`, `Covered responsibilities have an unreviewed relationship: ${edge.source} -> ${edge.target}.`, "Add the final edge id with a semantic type and rationale, or repair the graph topology."));
      }
    });

    const indegree = new Map([...coveredNodeIds].map((id) => [id, 0]));
    const outdegree = new Map([...coveredNodeIds].map((id) => [id, 0]));
    const undirected = new Map([...coveredNodeIds].map((id) => [id, []]));
    coveredEdges.forEach((edge) => {
      indegree.set(edge.target, (indegree.get(edge.target) || 0) + 1);
      outdegree.set(edge.source, (outdegree.get(edge.source) || 0) + 1);
      undirected.get(edge.source)?.push(edge.target);
      undirected.get(edge.target)?.push(edge.source);
    });
    const connected = new Set();
    const firstCovered = coveredNodeIds.values().next().value;
    if (firstCovered) {
      const pending = [firstCovered];
      while (pending.length) {
        const nodeId = pending.pop();
        if (connected.has(nodeId)) continue;
        connected.add(nodeId);
        pending.push(...(undirected.get(nodeId) || []));
      }
    }
    const isSinglePath =
      coveredEdges.length > 0 &&
      connected.size === coveredNodeIds.size &&
      coveredEdges.length === coveredNodeIds.size - 1 &&
      [...coveredNodeIds].every((id) => (indegree.get(id) || 0) <= 1 && (outdegree.get(id) || 0) <= 1);
    if (isSinglePath) {
      const relationshipTypes = coveredEdges.map((edge) => semanticRelationships[edge.id]?.type);
      const allowedTypes =
        manifest.output === "execution-plan"
          ? new Set(["dependency", "sequence"])
          : manifest.output === "system-map"
            ? new Set(["dependency", "flow", "navigation"])
            : null;
      const pathIsSemanticallyAllowed = allowedTypes && relationshipTypes.every((type) => allowedTypes.has(type));
      if (!pathIsSemanticallyAllowed) {
        violations.push(
          graphViolation(
            "mechanical_single_path",
            "edges",
            `The ${manifest.output || "selected"} output collapses all covered responsibilities into one mechanical path.`,
            "Group peer responsibilities under a meaningful parent or create evidence, decision, containment, or parallel branches that match the semantic relationship review."
          )
        );
      }
    }
  }
  if (manifest.primaryDomain === "software-product" && manifest.intent !== "refine") {
    SOFTWARE_PRODUCT_GUIDANCE_FILES.forEach((guidanceFile) => {
      if (!projectHasGuidanceFile(projectPath, guidanceFile) && !graphHasGuidanceNode(page.nodes, guidanceFile)) {
        violations.push(graphViolation("project_guidance_missing", "frameworkManifest.coverage.product.deliverables", `Project requires a delivery node for missing ${guidanceFile.canonicalName}.`, `Add a node that explicitly creates ${guidanceFile.canonicalName}.`));
      }
    });
  }
  return { violations, advisories };
}

function validateGraphCandidate(page, args, projectPath, options = {}) {
  const layout = normalizeGraphLayout(args?.layout || defaultGraphLayoutForType(normalizeGraphType(args?.graphType)));
  const structureViolations = validateGraphStructure(page, layout);
  const framework = validateFrameworkManifest(page, args?.frameworkManifest, projectPath, options);
  return {
    passed: structureViolations.length === 0 && framework.violations.length === 0,
    violations: [...structureViolations, ...framework.violations],
    advisories: framework.advisories
  };
}

function graphContextProjectKey(projectPath) {
  return path.resolve(projectPath);
}

function rememberGraphContext(projectPath, document, revisionState) {
  const projectKey = graphContextProjectKey(projectPath);
  const createdAt = Date.now();
  const activePage = cloneJson(activeScatterPage(document));
  const context = {
    id: `graph-context-${crypto.randomUUID()}`,
    projectKey,
    pageId: activePage.id,
    page: activePage,
    documentRevision: revisionState.revision,
    documentVersion: revisionState.documentVersion,
    createdAt,
    expiresAt: createdAt + GRAPH_CONTEXT_TTL_MS
  };
  const contexts = (projectGraphContexts.get(projectKey) || []).filter((item) => item.expiresAt > createdAt);
  contexts.push(context);
  projectGraphContexts.set(projectKey, contexts.slice(-MAX_GRAPH_CONTEXTS_PER_PROJECT));
  return context;
}

function readGraphContextSnapshot(projectPath, contextId) {
  const projectKey = graphContextProjectKey(projectPath);
  const now = Date.now();
  const contexts = (projectGraphContexts.get(projectKey) || []).filter((item) => item.expiresAt > now);
  projectGraphContexts.set(projectKey, contexts);
  return contexts.find((item) => item.id === contextId) || null;
}

function remapAiAdditionCollisions(basePage, currentPage, candidatePage, clientMutationId) {
  const baseNodes = itemMap(basePage.nodes);
  const currentNodes = itemMap(currentPage.nodes);
  const baseEdges = itemMap(basePage.edges);
  const currentEdges = itemMap(currentPage.edges);
  const usedNodeIds = new Set(currentPage.nodes.map((node) => node.id));
  const usedEdgeIds = new Set(currentPage.edges.map((edge) => edge.id));
  const nodeIdMap = {};
  const edgeIdMap = {};
  const nodes = candidatePage.nodes.map((node) => {
    if (baseNodes.has(node.id) || !currentNodes.has(node.id) || sameValue(comparableNodeSemantic(currentNodes.get(node.id)), comparableNodeSemantic(node))) return node;
    const id = deterministicUniqueId("ai-node", clientMutationId, `${basePage.id}:${node.id}`, usedNodeIds);
    nodeIdMap[node.id] = id;
    return { ...node, id };
  });
  const edges = candidatePage.edges.map((edge) => {
    const remapped = {
      ...edge,
      source: nodeIdMap[edge.source] || edge.source,
      target: nodeIdMap[edge.target] || edge.target
    };
    if (baseEdges.has(edge.id) || !currentEdges.has(edge.id) || sameValue(currentEdges.get(edge.id), remapped)) return remapped;
    const id = deterministicUniqueId("ai-edge", clientMutationId, `${basePage.id}:${edge.id}`, usedEdgeIds);
    edgeIdMap[edge.id] = id;
    return { ...remapped, id };
  });
  return { page: { ...candidatePage, nodes, edges }, nodeIdMap, edgeIdMap };
}

function mergeAiGraphCandidate({ basePage, currentPage, candidatePage, clientMutationId }) {
  const collision = remapAiAdditionCollisions(basePage, currentPage, candidatePage, clientMutationId);
  const aiPage = collision.page;
  const reasons = [];
  const baseNodes = itemMap(basePage.nodes);
  const currentNodes = itemMap(currentPage.nodes);
  const aiNodes = itemMap(aiPage.nodes);
  const nodes = [];
  for (const id of new Set([...baseNodes.keys(), ...currentNodes.keys(), ...aiNodes.keys()])) {
    const baseNode = baseNodes.get(id);
    const currentNode = currentNodes.get(id);
    const aiNode = aiNodes.get(id);
    if (!baseNode) {
      if (currentNode) nodes.push(currentNode);
      if (aiNode && (!currentNode || !sameValue(comparableNodeSemantic(currentNode), comparableNodeSemantic(aiNode)))) nodes.push(aiNode);
      continue;
    }
    const currentChanged = changedFromBase(baseNode, currentNode, comparableNodeSemantic);
    const aiChanged = changedFromBase(baseNode, aiNode, comparableNodeSemantic);
    if (currentChanged && aiChanged && !sameValue(comparableNodeSemantic(currentNode), comparableNodeSemantic(aiNode))) {
      reasons.push(`node:${id}`);
      if (currentNode) nodes.push(currentNode);
      continue;
    }
    const chosen = aiChanged ? aiNode : currentNode;
    if (chosen) nodes.push(currentNode ? { ...chosen, position: currentNode.position } : chosen);
  }

  const baseEdges = itemMap(basePage.edges);
  const currentEdges = itemMap(currentPage.edges);
  const aiEdges = itemMap(aiPage.edges);
  const edges = [];
  for (const id of new Set([...baseEdges.keys(), ...currentEdges.keys(), ...aiEdges.keys()])) {
    const baseEdge = baseEdges.get(id);
    const currentEdge = currentEdges.get(id);
    const aiEdge = aiEdges.get(id);
    if (!baseEdge) {
      if (currentEdge) edges.push(currentEdge);
      if (aiEdge && (!currentEdge || !sameValue(currentEdge, aiEdge))) edges.push(aiEdge);
      continue;
    }
    const currentChanged = changedFromBase(baseEdge, currentEdge);
    const aiChanged = changedFromBase(baseEdge, aiEdge);
    if (currentChanged && aiChanged && !sameValue(currentEdge, aiEdge)) {
      reasons.push(`edge:${id}`);
      if (currentEdge) edges.push(currentEdge);
      continue;
    }
    const chosen = aiChanged ? aiEdge : currentEdge;
    if (chosen) edges.push(chosen);
  }

  const nodeIds = new Set(nodes.map((node) => node.id));
  const validEdges = edges.filter((edge) => {
    const valid = nodeIds.has(edge.source) && nodeIds.has(edge.target);
    if (!valid) reasons.push(`dangling-edge:${edge.id}`);
    return valid;
  });
  let name = currentPage.name;
  const currentNameChanged = currentPage.name !== basePage.name;
  const aiNameChanged = aiPage.name !== basePage.name;
  if (currentNameChanged && aiNameChanged && currentPage.name !== aiPage.name) reasons.push(`page-name:${basePage.id}`);
  else if (aiNameChanged) name = aiPage.name;
  const now = nowIso();
  const page = { ...currentPage, name, updatedAt: now, nodes, edges: validEdges };
  const candidateForCopy = {
    ...aiPage,
    nodes: aiPage.nodes.map((node) => {
      const currentNode = currentNodes.get(node.id);
      return baseNodes.has(node.id) && currentNode ? { ...node, position: currentNode.position } : node;
    })
  };
  return {
    page,
    candidateForCopy,
    reasons: [...new Set(reasons)],
    nodeIdMap: collision.nodeIdMap,
    edgeIdMap: collision.edgeIdMap
  };
}

async function writeScatterGraph(projectPath, args) {
  return withProjectWriteLock(projectPath, async () => {
    const mode = normalizeGraphWriteMode(args?.mode);
    const existingDocument = await readScatterDocument(projectPath);
    const revisionState = await ensureProjectRevisionState(projectPath, existingDocument);
    const currentRevision = revisionState.revision;
    const reusedTemplates = [];
    const projectGuidanceNodes = [];
    const templates = args?.reuseTemplates === false ? [] : await readNodeTemplates();
    const preferences = await readPreferences();
    const now = nowIso();
    let pages;
    let activePageId;
    let mutationSummary = null;
    const validationAdvisories = deprecatedGraphLayoutAdvisories(args);
    let graphWriteStatus = "written";
    let targetPageId = null;
    let rebasedFromRevision = null;
    let idMappings = { nodeIds: {}, edgeIds: {} };
    let conflictCopies = [];
    let graphRequestFingerprint = null;
    let graphClientMutationId = null;

    if (mode === "merge-active-page") {
      const hasContextContract = typeof args?.contextId === "string" && args.contextId.trim();
      if (!hasContextContract && (typeof args?.expectedRevision !== "number" || !Number.isFinite(args.expectedRevision) || args.expectedRevision !== currentRevision)) {
        return validationFailure(currentRevision, [
          graphViolation("stale_document", "expectedRevision", "Canvasight document revision is missing or stale.", "Call get_canvasight_graph_context again and rebuild the patch against its documentRevision.")
        ]);
      }
      if (hasContextContract && (typeof args?.clientMutationId !== "string" || !args.clientMutationId.trim())) {
        return validationFailure(currentRevision, [
          graphViolation("client_mutation_id_required", "clientMutationId", "Context-bound graph writes require a stable clientMutationId.", "Generate one mutation id and reuse it for retries of this exact write.")
        ]);
      }
      const context = hasContextContract ? readGraphContextSnapshot(projectPath, args.contextId.trim()) : null;
      graphClientMutationId = hasContextContract ? args.clientMutationId.trim() : null;
      graphRequestFingerprint = hasContextContract ? documentFingerprint({ contextId: args.contextId.trim(), args: { ...args, clientMutationId: undefined } }) : null;
      const priorReceipt = graphClientMutationId ? revisionState.receipts.find((receipt) => receipt.clientMutationId === graphClientMutationId) : null;
      if (priorReceipt) {
        if (priorReceipt.requestFingerprint !== graphRequestFingerprint) {
          return validationFailure(currentRevision, [
            graphViolation("mutation_id_reused", "clientMutationId", "Canvasight mutation id was reused for a different graph payload.", "Use a new mutation id for a different write.")
          ]);
        }
        return { ...priorReceipt.result, replayed: true, written: false, document: existingDocument, documentRevision: currentRevision, documentVersion: revisionState.documentVersion };
      }
      if (hasContextContract && !context) {
        return validationFailure(currentRevision, [
          graphViolation("context_expired", "contextId", "Canvasight graph context expired or belongs to a prior daemon process.", "Call get_canvasight_graph_context again and rebuild the write once.")
        ]);
      }
      if (hasContextContract && (typeof args?.expectedRevision !== "number" || args.expectedRevision !== context.documentRevision)) {
        return validationFailure(currentRevision, [
          graphViolation("context_revision_mismatch", "expectedRevision", "expectedRevision does not match the bound graph context.", "Use the exact revision returned with this contextId.")
        ]);
      }
      const basePage = hasContextContract ? context.page : activeScatterPage(existingDocument);
      targetPageId = basePage.id;
      rebasedFromRevision = hasContextContract ? context.documentRevision : null;
      const merged = applyMergeOperations(basePage, args, templates, reusedTemplates);
      if (merged.violations.length > 0) return validationFailure(currentRevision, merged.violations);
      const guided = ensureMergedSoftwareProductGuidance(merged.page, args, projectPath, templates, reusedTemplates);
      if (guided.violations.length > 0) return validationFailure(currentRevision, guided.violations);
      projectGuidanceNodes.push(...guided.projectGuidanceNodes);
      const candidatePage = guided.page;
      const combinedSummary = guided.summary ? mergeMutationSummaries(merged.summary, guided.summary) : merged.summary;
      const generatedGuidanceNodeIds = new Set(guided.projectGuidanceNodes.map((node) => node.nodeId));
      const validation = validateGraphCandidate(candidatePage, args, projectPath, {
        preferences,
        requiredCoverageNodeIds: [...combinedSummary.addedNodeIds, ...combinedSummary.updatedNodeIds].filter((nodeId) => !generatedGuidanceNodeIds.has(nodeId))
      });
      if (!validation.passed) return validationFailure(currentRevision, validation.violations, validation.advisories);
      validationAdvisories.push(...validation.advisories);
      const currentPage = existingDocument.pages.find((page) => page.id === basePage.id);
      if (!currentPage) {
        const createdAt = nowIso();
        const usedPageIds = new Set(existingDocument.pages.map((page) => page.id));
        const usedNodeIds = new Set(existingDocument.pages.flatMap((page) => page.nodes.map((node) => node.id)));
        const usedEdgeIds = new Set(existingDocument.pages.flatMap((page) => page.edges.map((edge) => edge.id)));
        const copy = createConflictPage(candidatePage, {
          baseRevision: context.documentRevision,
          priorRevision: currentRevision,
          clientMutationId: graphClientMutationId,
          copyKind: "recovery",
          createdAt,
          existingNames: new Set(existingDocument.pages.map((page) => page.name)),
          incomingIntent: "edit",
          language: args?.language === "en" ? "en" : "zh",
          reasons: [`page-deleted:${basePage.id}`],
          usedEdgeIds,
          usedNodeIds,
          usedPageIds
        });
        copy.page.conflict.source = "ai";
        pages = [...existingDocument.pages, copy.page];
        graphWriteStatus = "conflict-copy";
        idMappings = { nodeIds: copy.nodeIdMap, edgeIds: copy.edgeIdMap };
        conflictCopies = [{ sourcePageId: basePage.id, conflictPageId: copy.page.id, originalPageId: basePage.id, originalPageAvailable: false, copyKind: "recovery", source: "ai", reasons: [`page-deleted:${basePage.id}`], nodeIdMap: copy.nodeIdMap, edgeIdMap: copy.edgeIdMap }];
      } else if (hasContextContract && currentRevision !== context.documentRevision) {
        const rebased = mergeAiGraphCandidate({ basePage, currentPage, candidatePage, clientMutationId: graphClientMutationId });
        pages = existingDocument.pages.map((page) => (page.id === currentPage.id ? rebased.page : page));
        idMappings = { nodeIds: rebased.nodeIdMap, edgeIds: rebased.edgeIdMap };
        graphWriteStatus = rebased.reasons.length ? "conflict-copy" : "merged";
        if (rebased.reasons.length) {
          const createdAt = nowIso();
          const usedPageIds = new Set(pages.map((page) => page.id));
          const usedNodeIds = new Set(pages.flatMap((page) => page.nodes.map((node) => node.id)));
          const usedEdgeIds = new Set(pages.flatMap((page) => page.edges.map((edge) => edge.id)));
          const copy = createConflictPage(rebased.candidateForCopy, {
            baseRevision: context.documentRevision,
            priorRevision: currentRevision,
            clientMutationId: graphClientMutationId,
            copyKind: "conflict",
            createdAt,
            existingNames: new Set(pages.map((page) => page.name)),
            incomingIntent: "edit",
            language: args?.language === "en" ? "en" : "zh",
            reasons: rebased.reasons,
            usedEdgeIds,
            usedNodeIds,
            usedPageIds
          });
          copy.page.conflict.source = "ai";
          pages.push(copy.page);
          conflictCopies = [{ sourcePageId: basePage.id, conflictPageId: copy.page.id, originalPageId: basePage.id, originalPageAvailable: true, copyKind: "conflict", source: "ai", reasons: rebased.reasons, nodeIdMap: copy.nodeIdMap, edgeIdMap: copy.edgeIdMap }];
        }
      } else {
        pages = existingDocument.pages.map((page) => (page.id === basePage.id ? candidatePage : page));
      }
      activePageId = existingDocument.activePageId;
      mutationSummary = combinedSummary;
    } else {
      const incomingPages = graphPageInputs(args).map((page, index) =>
        buildScatterPageFromGraph(page, index, args, projectPath, templates, reusedTemplates, projectGuidanceNodes)
      );
      for (let index = 0; index < incomingPages.length; index += 1) {
        const generatedGuidanceNodeIds = new Set(projectGuidanceNodes.filter((node) => node.pageIndex === index).map((node) => node.nodeId));
        const validation = validateGraphCandidate(incomingPages[index], args, projectPath, {
          preferences,
          requiredCoverageNodeIds: incomingPages[index].nodes.map((node) => node.id).filter((nodeId) => !generatedGuidanceNodeIds.has(nodeId))
        });
        if (!validation.passed) return validationFailure(currentRevision, validation.violations, validation.advisories);
        validationAdvisories.push(...validation.advisories);
      }

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
    const documentRevision = currentRevision + 1;
    const documentVersion = documentFingerprint(document);
    const resultSummary = {
      status: graphWriteStatus,
      written: true,
      documentRevision,
      documentVersion,
      targetPageId: targetPageId || activePage.id,
      rebasedFromRevision,
      idMappings,
      conflictCopies,
      reusedTemplates,
      projectGuidanceNodes,
      mutationSummary,
      validation: { passed: true, violations: [], advisories: validationAdvisories }
    };
    const receipts = graphClientMutationId
      ? [...revisionState.receipts, { clientMutationId: graphClientMutationId, requestFingerprint: graphRequestFingerprint, result: resultSummary, createdAt: nowIso(), source: "ai-graph" }].slice(-MAX_DOCUMENT_MUTATION_RECEIPTS)
      : revisionState.receipts;
    await persistProjectRevisionState(projectPath, {
      ...revisionState,
      revision: documentRevision,
      documentVersion,
      receipts,
      lastSource: "ai",
      objectWriters: documentObjectWriters(revisionState.objectWriters, existingDocument, document, "ai")
    });

    await rememberProjectBestEffort(projectPath, {
      name: document.projectName,
      updatedAt: document.updatedAt
    });

    return { ...resultSummary, document };
  });
}

async function openProject(projectPath) {
  const document = await readScatterDocument(projectPath);
  const revisionState = await ensureProjectRevisionState(projectPath, document);
  return {
    project: {
      name: projectNameFromPath(projectPath),
      path: projectPath,
      updatedAt: document.updatedAt
    },
    document,
    documentVersion: revisionState.documentVersion
  };
}

function summarizeGraphContextNode(node) {
  const body = typeof node?.data?.body === "string" ? node.data.body : "";
  return {
    id: node.id,
    title: typeof node?.data?.title === "string" ? node.data.title : "",
    bodyPreview: body.length > TEMPLATE_BODY_PREVIEW_CHARS ? `${body.slice(0, TEMPLATE_BODY_PREVIEW_CHARS - 1)}…` : body,
    position: {
      x: toNumber(node?.position?.x, 0),
      y: toNumber(node?.position?.y, 0)
    }
  };
}

function graphContext(projectPath, document, preferences = defaultPreferences(), revisionState = null) {
  const activePage = activeScatterPage(document);
  const resolvedRevisionState = revisionState || projectRevisionStates.get(projectRevisionKey(projectPath)) || {
    revision: projectDocumentRevision(projectPath),
    documentVersion: documentFingerprint(document)
  };
  const context = rememberGraphContext(projectPath, document, resolvedRevisionState);
  const nodes = activePage.nodes.map(summarizeGraphContextNode);
  const edges = activePage.edges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    ...(typeof edge.label === "string" && edge.label ? { label: edge.label } : {})
  }));
  return {
    status: "ok",
    projectPath,
    scatterPath: scatterPath(projectPath),
    contextId: context.id,
    documentRevision: context.documentRevision,
    documentVersion: context.documentVersion,
    preferences: normalizePreferences(preferences),
    activePage: {
      id: activePage.id,
      name: activePage.name,
      viewport: activePage.viewport,
      nodes,
      edges
    },
    nodes,
    edges,
    pages: document.pages.map((page) => ({
      id: page.id,
      name: page.name,
      nodeCount: page.nodes.length,
      edgeCount: page.edges.length,
      active: page.id === activePage.id
    }))
  };
}

function sessionId() {
  return `session-${Date.now().toString(36)}-${crypto.randomBytes(4).toString("hex")}`;
}

function openAttemptId() {
  return `open-${Date.now().toString(36)}-${crypto.randomBytes(6).toString("hex")}`;
}

let lastWidgetBindingIssuedAt = 0;

function nextWidgetBindingIssuedAt() {
  lastWidgetBindingIssuedAt = Math.max(Date.now(), lastWidgetBindingIssuedAt + 1);
  return lastWidgetBindingIssuedAt;
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
    bindingIssuedAt: nextWidgetBindingIssuedAt(),
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
    bindingIssuedAt: attempt.bindingIssuedAt,
    createdAt: attempt.createdAt,
    updatedAt: attempt.updatedAt,
    instances: Array.from(attempt.instances.values()).map((instance) => ({ ...instance }))
  };
}

function sessionInfo(session) {
  const revisionState = session.projectPath ? projectRevisionStates.get(projectRevisionKey(session.projectPath)) : null;
  return {
    codexThreadId: session.codexThreadId,
    threadClaimedAt: session.threadClaimedAt || null,
    documentRevision: projectDocumentRevision(session.projectPath),
    documentVersion: revisionState?.documentVersion || null,
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
    bindingIssuedAt: attempt?.bindingIssuedAt || value.bindingIssuedAt || null,
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

  const timeout = Math.max(1, Math.min(toNumber(timeoutMs, 30_000), 300_000));
  return new Promise((resolve) => {
    const waiter = {
      resolve,
      timer: setTimeout(() => {
        detachOpenAttemptWaiter(attempt, waiter);
        const lastInstance = Array.from(attempt.instances.values())
          .filter((instance) => instance.displayMode === "fullscreen")
          .sort((left, right) => String(right.reportedAt).localeCompare(String(left.reportedAt)))[0] || null;
        resolve(openAttemptResult(session, attempt, lastInstance, { status: "timeout", stage: lastInstance?.stage || attempt.stage, error: `Canvasight fullscreen widget did not report ready within ${timeout}ms.` }));
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

function revisionPollContext(session, identity) {
  const attempt = requireOpenAttempt(session, identity.openAttemptId);
  const widgetInstanceId = typeof identity.widgetInstanceId === "string" ? identity.widgetInstanceId.trim() : "";
  const instance = attempt.instances.get(widgetInstanceId);
  const threadId = optionalThreadId(attempt.threadId) || optionalThreadId(session.codexThreadId);
  if (!threadId) throw new HttpError(409, "Canvasight revision polling requires a bound Codex task.", "revision_poll_thread_required");
  const requestThreadId = optionalThreadId(identity.threadId);
  if (!requestThreadId || requestThreadId !== threadId) {
    throw new HttpError(409, "Canvasight revision poll belongs to a different Codex task.", "widget_thread_mismatch");
  }
  return {
    attempt,
    instance,
    key: revisionPollLeaseKey(session.projectPath, threadId),
    owner: revisionPollOwner(session, identity),
    threadId
  };
}

function claimRevisionPollLease(session, identity, evidence = {}) {
  const context = revisionPollContext(session, identity);
  const eligible = Boolean(
    identity.startupStage === "ready" &&
      identity.displayMode === "fullscreen" &&
      identity.reactMounted === true &&
      context.instance?.stage === "ready" &&
      context.instance?.displayMode === "fullscreen" &&
      evidence.visible === true &&
      evidence.focused === true &&
      toNumber(evidence.canvasWidth, 0) > 0 &&
      toNumber(evidence.canvasHeight, 0) > 0
  );
  const existing = revisionPollLeases.get(context.key);
  if (!eligible) {
    if (sameRevisionPollOwner(existing?.owner, context.owner)) revisionPollLeases.delete(context.key);
    return { status: "inactive", owner: false, pollIntervalMs: REVISION_POLL_INTERVAL_MS };
  }

  const now = Date.now();
  if (existing && existing.expiresAt > now && !sameRevisionPollOwner(existing.owner, context.owner)) {
    return {
      status: "standby",
      owner: false,
      leaseExpiresAt: new Date(existing.expiresAt).toISOString(),
      retryAfterMs: Math.max(1, existing.expiresAt - now),
      pollIntervalMs: REVISION_POLL_INTERVAL_MS
    };
  }

  const expiresAt = now + REVISION_POLL_LEASE_MS;
  revisionPollLeases.set(context.key, {
    owner: context.owner,
    projectPath: path.resolve(session.projectPath),
    threadId: context.threadId,
    expiresAt
  });
  return {
    status: "owner",
    owner: true,
    documentRevision: projectDocumentRevision(session.projectPath),
    leaseExpiresAt: new Date(expiresAt).toISOString(),
    retryAfterMs: REVISION_POLL_INTERVAL_MS,
    pollIntervalMs: REVISION_POLL_INTERVAL_MS
  };
}

function releaseRevisionPollLease(session, identity) {
  const context = revisionPollContext(session, identity);
  const existing = revisionPollLeases.get(context.key);
  const released = sameRevisionPollOwner(existing?.owner, context.owner);
  if (released) revisionPollLeases.delete(context.key);
  return { status: released ? "released" : "not-owner", released };
}

function releaseSessionRevisionPollLeases(sessionIdValue) {
  for (const [key, lease] of revisionPollLeases) {
    if (lease.owner.sessionId === sessionIdValue) revisionPollLeases.delete(key);
  }
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
  releaseSessionRevisionPollLeases(sessionIdValue);
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

function canvasightWidgetResourceMeta(extraOrigins = [], { allowDaemon = true, displayMode = "fullscreen", description = "Canvasight native Codex widget shell for the project canvas." } = {}) {
  const connectDomains = allowDaemon ? canvasightWidgetConnectDomains(extraOrigins) : [];
  return {
    ui: {
      prefersBorder: false,
      displayMode,
      csp: {
        connectDomains,
        frameDomains: connectDomains,
        resourceDomains: [...connectDomains, "data:", "blob:"]
      }
    },
    "openai/widgetDescription": description,
    "openai/widgetPrefersBorder": false,
    "openai/widgetCSP": {
      connect_domains: connectDomains,
      frame_domains: connectDomains,
      resource_domains: [...connectDomains, "data:", "blob:"]
    }
  };
}

function canvasightWidgetHtml({ mode = "workspace", title = "Canvasight" } = {}) {
  const app = inlineCanvasightApp();
  const appScript = escapeInlineScript(app.script);
  const appStyle = escapeInlineStyle(app.style);
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title}</title>
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
    ${mode === "framework-questions" ? `
    html, body {
      height: auto;
      min-width: 0;
      min-height: 0;
      overflow: visible;
      background: transparent;
    }
    #canvasight-widget-root, #root {
      position: relative;
      inset: auto;
      width: 100%;
      height: auto;
      min-width: 0;
      min-height: 0;
      overflow: visible;
      background: transparent;
    }
    ` : ""}
  </style>
  <script>
    globalThis.__CANVASIGHT_WIDGET_SHELL__ = true;
    globalThis.__CANVASIGHT_WIDGET_MODE__ = ${JSON.stringify(mode)};
    globalThis.__CANVASIGHT_WIDGET_SERVER_VERSION__ = ${JSON.stringify(SERVER_VERSION)};
  </script>
</head>
<body>
  <div id="canvasight-widget-root">
    <div id="root"></div>
    <div id="canvasight-widget-status" role="status" aria-live="polite">${mode === "workspace" ? "Starting Canvasight..." : ""}</div>
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
  const runtime = options.runtime || codexAppRuntime();
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

function appServerRequest(method, params, { experimentalApi = false, runtime = null } = {}) {
  return appServerRequestSequence([{ method, params }], { experimentalApi, runtime }).then((results) => results[0] || {});
}

function normalizeSkillListLimit(value) {
  return Math.max(1, Math.min(Math.floor(toNumber(Number(value), 50)), MAX_SKILL_SUMMARIES));
}

function summarizeCodexSkill(value) {
  if (!isObject(value) || value.enabled !== true || typeof value.name !== "string" || !value.name.trim()) return null;
  const interfaceMetadata = isObject(value.interface) ? value.interface : {};
  const description = typeof value.description === "string" ? value.description.trim() : "";
  return {
    name: value.name.trim(),
    description,
    displayName:
      typeof interfaceMetadata.displayName === "string" && interfaceMetadata.displayName.trim()
        ? interfaceMetadata.displayName.trim()
        : value.name.trim(),
    scope: typeof value.scope === "string" && value.scope.trim() ? value.scope.trim() : "unknown"
  };
}

function skillSummaryMatchesQuery(skill, query) {
  const normalizedQuery = typeof query === "string" ? query.trim().toLocaleLowerCase() : "";
  if (!normalizedQuery) return true;
  return [skill.name, skill.displayName, skill.description, skill.scope]
    .join("\n")
    .toLocaleLowerCase()
    .includes(normalizedQuery);
}

async function listResolvedCodexSkills(projectPath, options = {}) {
  const cwd = normalizeProjectPath(projectPath);
  const query = typeof options.query === "string" ? options.query.trim() : "";
  const limit = options.limit === undefined || options.limit === null ? null : normalizeSkillListLimit(options.limit);
  try {
    const result = await appServerRequest(
      "skills/list",
      {
        cwds: [cwd],
        forceReload: options.forceReload === true
      },
      { runtime: codexSkillsRuntime() }
    );
    const entries = Array.isArray(result?.data) ? result.data : [];
    const entry =
      entries.find((candidate) => optionalProjectPath(candidate?.cwd) === cwd) ||
      (entries.length === 1 ? entries[0] : null);
    if (!entry) {
      return {
        status: "unavailable",
        query,
        count: 0,
        total: 0,
        skills: [],
        advisory: {
          code: "skills_unavailable",
          message: "Codex did not return the enabled Skill catalog for this project. Manual $skill-name input remains available."
        }
      };
    }
    const deduplicated = new Map();
    (Array.isArray(entry.skills) ? entry.skills : []).forEach((skill) => {
      const summary = summarizeCodexSkill(skill);
      const key = summary?.name.toLocaleLowerCase();
      if (summary && key && !deduplicated.has(key)) deduplicated.set(key, summary);
    });
    const matched = [...deduplicated.values()]
      .filter((skill) => skillSummaryMatchesQuery(skill, query))
      .sort((left, right) => left.name.localeCompare(right.name));
    const visible = limit === null ? matched : matched.slice(0, limit);
    return {
      status: "ok",
      query,
      count: visible.length,
      total: matched.length,
      skills: visible,
      ...(Array.isArray(entry.errors) && entry.errors.length > 0
        ? {
            advisory: {
              code: "skills_partially_available",
              message: "Some Codex Skills could not be resolved. The available enabled Skills are still listed."
            }
          }
        : {})
    };
  } catch {
    return {
      status: "unavailable",
      query,
      count: 0,
      total: 0,
      skills: [],
      advisory: {
        code: "skills_unavailable",
        message: "Codex Skill discovery is temporarily unavailable. Manual $skill-name input remains available, and AI should not select a Skill autonomously."
      }
    };
  }
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
    startupStage: normalizeStartupStage(req.headers["x-canvasight-startup-stage"]),
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

  if (action === "revision-poll") {
    if (req.method === "POST") {
      sendJson(res, 200, claimRevisionPollLease(session, requestIdentity, await readJsonBody(req)));
      return true;
    }
    if (req.method === "DELETE") {
      sendJson(res, 200, releaseRevisionPollLease(session, requestIdentity));
      return true;
    }
    throw new HttpError(405, "Expected POST or DELETE");
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
    const result = await withProjectWriteLock(projectPath, async () => {
      const currentDocument = await readScatterDocument(projectPath);
      const currentState = await ensureProjectRevisionState(projectPath, currentDocument);
      const modernSave = isObject(body.base) && typeof body.clientMutationId === "string" && body.clientMutationId.trim();
      if (!modernSave) {
        assertCurrentDocumentRevision(projectPath, body.expectedRevision);
        const savedDocument = await writeScatterDocument(projectPath, body.document);
        const documentRevision = currentState.revision + 1;
        const documentVersion = documentFingerprint(savedDocument);
        await persistProjectRevisionState(projectPath, {
          ...currentState,
          revision: documentRevision,
          documentVersion,
          lastSource: "manual",
          objectWriters: documentObjectWriters(currentState.objectWriters, currentDocument, savedDocument, "manual")
        });
        return { status: "written", written: true, document: savedDocument, documentRevision, documentVersion };
      }

      const clientMutationId = body.clientMutationId.trim();
      const requestFingerprint = documentFingerprint({
        base: body.base,
        document: body.document,
        deletedPageSnapshots: body.deletedPageSnapshots || {},
        language: body.language === "en" ? "en" : "zh"
      });
      const priorReceipt = currentState.receipts.find((receipt) => receipt.clientMutationId === clientMutationId);
      if (priorReceipt) {
        if (priorReceipt.requestFingerprint !== requestFingerprint) {
          throw new HttpError(409, "Canvasight mutation id was reused for a different save payload.", "mutation_id_reused");
        }
        return {
          ...priorReceipt.result,
          written: false,
          replayed: true,
          document: currentDocument,
          documentRevision: currentState.revision,
          documentVersion: currentState.documentVersion
        };
      }
      if (typeof body.base.revision !== "number" || !Number.isFinite(body.base.revision) || !isObject(body.base.document)) {
        throw new HttpError(400, "Canvasight concurrent save requires base.revision and base.document.", "invalid_document_base");
      }
      const baseDocument = normalizeScatterDocument(body.base.document, projectPath);
      const localDocument = normalizeScatterDocument(body.document, projectPath);
      const baseVersion = documentFingerprint(baseDocument);
      if (typeof body.base.version === "string" && body.base.version && body.base.version !== baseVersion) {
        throw new HttpError(409, "Canvasight save base does not match its document version.", "invalid_document_base");
      }
      if (!currentState.history.some((entry) => entry.revision === body.base.revision && entry.documentVersion === baseVersion)) {
        throw new HttpError(409, "Canvasight save base revision is not present in the durable revision history.", "invalid_document_base");
      }
      let savedDocument;
      let status;
      let merge = {
        baseRevision: body.base.revision,
        priorRevision: currentState.revision,
        mergedPageIds: [],
        conflictCopies: [],
        localActivePageId: localDocument.activePageId,
        clientMutationId
      };
      if (body.base.revision === currentState.revision && baseVersion === currentState.documentVersion) {
        if (documentsContentEqual(localDocument, currentDocument)) {
          savedDocument = currentDocument;
          status = "unchanged";
        } else {
          savedDocument = documentWithCurrentNavigation(currentDocument, localDocument, projectPath);
          status = "written";
        }
      } else {
        const merged = mergeConcurrentDocuments({
          baseDocument,
          currentDocument,
          deletedPageSnapshots: body.deletedPageSnapshots,
          localDocument,
          baseRevision: body.base.revision,
          priorRevision: currentState.revision,
          clientMutationId,
          language: body.language === "en" ? "en" : "zh",
          objectWriters: currentState.objectWriters,
          projectPath
        });
        savedDocument = merged.document;
        merge = { ...merge, ...merged, document: undefined };
        delete merge.document;
        status = merged.conflictCopies.length ? "conflict-copy" : merged.mergedPageIds.length ? "merged" : documentFingerprint(savedDocument) === currentState.documentVersion ? "unchanged" : "merged";
      }
      const written = status !== "unchanged";
      const documentRevision = written ? currentState.revision + 1 : currentState.revision;
      const documentVersion = written ? documentFingerprint(savedDocument) : currentState.documentVersion;
      if (written) await writeScatterDocument(projectPath, savedDocument);
      const resultSummary = { status, written, documentRevision, documentVersion, merge };
      const receipts = [...currentState.receipts, { clientMutationId, requestFingerprint, result: resultSummary, createdAt: nowIso() }].slice(-MAX_DOCUMENT_MUTATION_RECEIPTS);
      await persistProjectRevisionState(projectPath, {
        ...currentState,
        version: 1,
        revision: documentRevision,
        documentVersion,
        receipts,
        lastSource: written ? "manual" : currentState.lastSource,
        objectWriters: written ? documentObjectWriters(currentState.objectWriters, currentDocument, savedDocument, "manual") : currentState.objectWriters
      });
      return { ...resultSummary, document: savedDocument };
    });
    const { document, documentRevision } = result;
    session.projectPath = projectPath;
    session.documentRevision = documentRevision;
    await rememberProjectBestEffort(projectPath, {
      name: document.projectName,
      updatedAt: document.updatedAt
    });
    sendJson(res, 200, result);
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

  if (action === "attachment-preview") {
    assertMethod(req, "POST");
    const body = await readJsonBody(req);
    const storedPath = typeof body?.storedPath === "string" ? body.storedPath.trim() : "";
    if (!storedPath || !path.isAbsolute(storedPath)) {
      throw new HttpError(400, "Canvasight attachment preview requires an absolute storedPath.", "invalid_attachment_preview_path");
    }
    const assetPath = path.resolve(storedPath);
    const projectPath = normalizeProjectPath(session.projectPath);
    const allowedRoots = [scatterAssetsDir(projectPath), canvasightTemplateAssetsDir()];
    const stat = await fsp.lstat(assetPath);
    if (!stat.isFile() || stat.isSymbolicLink()) {
      throw new HttpError(403, "Canvasight attachment preview requires a regular project asset.", "forbidden_attachment_preview_path");
    }
    const realAssetPath = await fsp.realpath(assetPath);
    const realAllowedRoots = await Promise.all(
      allowedRoots.map((root) => fsp.realpath(root).catch(() => null))
    );
    if (!realAllowedRoots.some((root) => root && isPathInside(realAssetPath, root))) {
      throw new HttpError(403, "Canvasight attachment preview is outside the current project.", "forbidden_attachment_preview_path");
    }
    if (stat.size > MAX_WIDGET_IMAGE_PREVIEW_BYTES) {
      throw new HttpError(413, "Canvasight attachment preview is too large.", "attachment_preview_too_large");
    }
    const mime = mimeFromPath(realAssetPath).split(";", 1)[0].trim().toLowerCase();
    if (!mime.startsWith("image/")) {
      throw new HttpError(415, "Canvasight attachment preview requires an image.", "attachment_preview_not_image");
    }
    const bytes = await fsp.readFile(realAssetPath);
    sendJson(res, 200, {
      dataBase64: bytes.toString("base64"),
      mime,
      size: bytes.length
    });
    return true;
  }

  if (action === "export-markdown") {
    assertMethod(req, "POST");
    const body = await readJsonBody(req);
    const exported = await exportMarkdownToDownloads(session, body);
    sendJson(res, 200, exported);
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

    if (url.pathname === "/api/skills") {
      assertDaemonAuthorized(req, url);
      let input;
      if (req.method === "GET") {
        input = {
          projectPath: url.searchParams.get("projectPath"),
          threadId: url.searchParams.get("threadId"),
          query: url.searchParams.get("query") || "",
          forceReload: url.searchParams.get("forceReload") === "true",
          limit: url.searchParams.get("limit")
        };
      } else if (req.method === "POST") {
        input = await readJsonBody(req);
      } else {
        throw new HttpError(405, "Expected GET or POST");
      }
      const threadId = optionalThreadId(input?.threadId);
      const projectPath = await resolveSessionProjectPath(input?.projectPath, threadId, { requireThreadProject: Boolean(threadId) });
      sendJson(
        res,
        200,
        await listResolvedCodexSkills(projectPath, {
          query: input?.query,
          forceReload: input?.forceReload === true,
          limit: input?.limit
        })
      );
      return;
    }

    if (url.pathname === "/api/preferences") {
      assertDaemonAuthorized(req, url);
      if (req.method === "GET") {
        sendJson(res, 200, await readPreferences());
        return;
      }
      if (req.method === "POST" || req.method === "PUT") {
        sendJson(res, 200, await writePreferences(await readJsonBody(req)));
        return;
      }
      throw new HttpError(405, "Expected GET, POST, or PUT");
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

    if (url.pathname === "/api/graphs/context") {
      assertDaemonAuthorized(req, url);
      assertMethod(req, "POST");
      const body = await readJsonBody(req);
      const threadId = optionalThreadId(body?.threadId);
      const projectPath = await resolveSessionProjectPath(body?.projectPath, threadId, { requireThreadProject: Boolean(threadId) });
      const document = await readScatterDocument(projectPath);
      const revisionState = await ensureProjectRevisionState(projectPath, document);
      sendJson(res, 200, graphContext(projectPath, document, await readPreferences(), revisionState));
      return;
    }

    if (url.pathname === "/api/graphs/write") {
      assertDaemonAuthorized(req, url);
      assertMethod(req, "POST");
      const body = await readJsonBody(req);
      const threadId = optionalThreadId(body?.threadId) || optionalThreadId(body?.args?.threadId);
      const projectPath = await resolveSessionProjectPath(body.projectPath || body?.args?.projectPath, threadId, { requireThreadProject: Boolean(threadId) });
      sendJson(res, 200, await writeScatterGraph(projectPath, body.args || body));
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

function frameworkQuestionsResourceDescriptor() {
  const description = "Compact inline Canvasight framework confirmation form.";
  return {
    uri: CANVASIGHT_FRAMEWORK_QUESTIONS_URI,
    name: "canvasight-framework-questions-widget",
    title: "Canvasight framework confirmation",
    description,
    mimeType: RESOURCE_MIME_TYPE,
    _meta: canvasightWidgetResourceMeta([], { allowDaemon: false, displayMode: "inline", description })
  };
}

function listCanvasightResources() {
  return {
    resources: [widgetResourceDescriptor(), frameworkQuestionsResourceDescriptor()]
  };
}

async function readCanvasightResource(uri) {
  if (uri === CANVASIGHT_FRAMEWORK_QUESTIONS_URI) {
    const description = "Compact inline Canvasight framework confirmation form.";
    return {
      contents: [
        {
          uri,
          mimeType: RESOURCE_MIME_TYPE,
          text: canvasightWidgetHtml({ mode: "framework-questions", title: "Canvasight framework confirmation" }),
          _meta: canvasightWidgetResourceMeta([], { allowDaemon: false, displayMode: "inline", description })
        }
      ]
    };
  }
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
    skillDiscoveryTool: "list_canvasight_skills",
    skillLookup:
      "Call list_canvasight_skills with the canvas or node responsibility before using skill-led content or an AI-selected node Skill. Manual and user-explicit $skill-name tokens remain available when discovery is unavailable.",
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

const frameworkQuestionsOutputSchema = {
  type: "object",
  properties: {
    kind: { type: "string", const: "canvasight.framework-questions" },
    schemaVersion: { type: "integer", const: 1 },
    confirmationId: { type: "string" },
    language: { type: "string", enum: ["zh", "en"] },
    title: { type: "string" },
    description: { type: "string" },
    questions: { type: "array", minItems: 1, maxItems: 3, items: { type: "object", additionalProperties: true } },
    instruction: { type: "string", const: "wait_for_user_confirmation" }
  },
  required: ["kind", "schemaVersion", "confirmationId", "language", "title", "questions", "instruction"],
  additionalProperties: false
};

const canvasightGraphContextOutputSchema = {
  type: "object",
  properties: {
    status: { type: "string" },
    projectPath: { type: "string" },
    scatterPath: { type: "string" },
    contextId: { type: "string" },
    documentRevision: { type: "integer" },
    documentVersion: { type: "string" },
    preferences: {
      type: "object",
      properties: {
        aiSkillAssignmentEnabled: { type: "boolean" }
      },
      required: ["aiSkillAssignmentEnabled"],
      additionalProperties: false
    },
    activePage: {
      type: "object",
      properties: {
        id: { type: "string" },
        name: { type: "string" },
        viewport: { type: "object", additionalProperties: true },
        nodes: { type: "array", items: { type: "object", additionalProperties: true } },
        edges: { type: "array", items: { type: "object", additionalProperties: true } }
      },
      additionalProperties: true
    },
    nodes: { type: "array", items: { type: "object", additionalProperties: true } },
    edges: { type: "array", items: { type: "object", additionalProperties: true } },
    pages: { type: "array", items: { type: "object", additionalProperties: true } }
  },
  required: ["status", "projectPath", "contextId", "documentRevision", "documentVersion", "preferences", "activePage", "nodes", "edges", "pages"],
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
    bindingIssuedAt: session.openAttempt?.bindingIssuedAt,
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
      `Canvasight native widget session created for project: ${session.projectPath}. This provisional result does not prove that the canvas is open.`,
      `sessionId: ${widgetData.sessionId}`,
      `openAttemptId: ${widgetData.openAttemptId}`,
      `Next: await_canvasight_widget_ready(${JSON.stringify({
        sessionId: widgetData.sessionId,
        openAttemptId: widgetData.openAttemptId,
        threadId: widgetData.codexThreadId
      })})`,
      "Use these identifiers from this result. Do not call open_canvasight again to recover them.",
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

async function toolListCanvasightSkills(args) {
  const threadId = optionalThreadId(args?.threadId) || optionalThreadId(process.env.CODEX_THREAD_ID);
  const projectPath = await resolveSessionProjectPath(args?.projectPath, threadId, { requireThreadProject: Boolean(threadId) });
  const result = await listResolvedCodexSkills(projectPath, {
    query: args?.query,
    forceReload: args?.forceReload === true,
    limit: args?.limit ?? 50
  });
  return toolResult(
    result,
    result.status === "ok"
      ? result.count > 0
        ? `Canvasight Skills: ${result.count}/${result.total}`
        : "No enabled Codex Skills matched this node responsibility."
      : result.advisory?.message || "Codex Skill discovery is unavailable."
  );
}

async function toolGetCanvasightGraphContext(args) {
  const threadId = optionalThreadId(args?.threadId) || optionalThreadId(process.env.CODEX_THREAD_ID);
  const projectPath = await resolveSessionProjectPath(args?.projectPath, threadId, { requireThreadProject: Boolean(threadId) });
  const daemon = await ensureDaemonServer();
  const context = await daemonJson(daemon, "/api/graphs/context", {
    method: "POST",
    body: JSON.stringify({ projectPath, threadId })
  });
  return toolResult(
    context,
    `Canvasight graph context: ${context.activePage.name} (${context.nodes.length} nodes, revision ${context.documentRevision})`
  );
}

async function toolWriteCanvasightGraph(args) {
  const threadId = optionalThreadId(args?.threadId) || optionalThreadId(process.env.CODEX_THREAD_ID);
  const projectPath = await resolveSessionProjectPath(args?.projectPath, threadId, { requireThreadProject: Boolean(threadId) });
  const daemon = await ensureDaemonServer();
  const result = await daemonJson(daemon, "/api/graphs/write", {
    method: "POST",
    body: JSON.stringify({
      projectPath,
      args: {
        ...(args || {}),
        projectPath
      }
    })
  });
  if (result?.status === "validation_failed") {
    return toolResult(
      {
        ...result,
        projectPath,
        scatterPath: scatterPath(projectPath),
        mode: normalizeGraphWriteMode(args?.mode),
        graphType: normalizeGraphType(args?.graphType)
      },
      "Canvasight candidate was not written. Repair the returned validation violations and retry against the latest document revision."
    );
  }
  const { document, documentRevision, documentVersion, reusedTemplates, projectGuidanceNodes, mutationSummary, validation, written } = result;
  const activePage = document.pages.find((page) => page.id === document.activePageId) || document.pages[0];
  const nodeIds = activePage.nodes.map((node) => node.id);
  const edgeIds = activePage.edges.map((edge) => edge.id);
  const graphType = normalizeGraphType(args?.graphType);
  const summary = [
    `Canvasight graph written: ${scatterPath(projectPath)}`,
    `Graph type: ${graphType}`,
    `Target page: ${result.targetPageId || activePage.id}`,
    `Nodes: ${nodeIds.length}`,
    `Edges: ${edgeIds.length}`,
    `Templates reused: ${reusedTemplates.length}`,
    `Project guidance nodes: ${projectGuidanceNodes.length}`
  ].join("\n");

  return toolResult(
    {
      status: result.status,
      written: written === true,
      projectPath,
      scatterPath: scatterPath(projectPath),
      mode: normalizeGraphWriteMode(args?.mode),
      graphType,
      activePageId: activePage.id,
      activePageName: activePage.name,
      documentRevision,
      documentVersion,
      targetPageId: result.targetPageId || activePage.id,
      rebasedFromRevision: result.rebasedFromRevision ?? null,
      idMappings: result.idMappings || { nodeIds: {}, edgeIds: {} },
      conflictCopies: result.conflictCopies || [],
      nodeIds,
      edgeIds,
      reusedTemplates,
      projectGuidanceNodes,
      mutationSummary,
      validation,
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
  if (parsed.origin !== "http://canvasight.local" || parsed.hash || parsed.pathname.includes("..")) {
    throw new Error("Canvasight widget API path is invalid.");
  }
  const allowed =
    /^\/api\/sessions(?:\/|$)/.test(parsed.pathname) ||
    /^\/api\/templates(?:\/|$)/.test(parsed.pathname) ||
    parsed.pathname === "/api/skills" ||
    parsed.pathname === "/api/preferences" ||
    parsed.pathname === "/api/reveal";
  if (!allowed) throw new Error("Canvasight widget API path is not allowed.");
  if (parsed.search) {
    if (parsed.pathname !== "/api/skills") throw new Error("Canvasight widget API query parameters are not allowed for this path.");
    const allowedSkillQueryKeys = new Set(["projectPath", "threadId", "query", "forceReload", "limit"]);
    for (const key of parsed.searchParams.keys()) {
      if (!allowedSkillQueryKeys.has(key) || parsed.searchParams.getAll(key).length !== 1) {
        throw new Error("Canvasight widget Skill API query parameters are invalid.");
      }
    }
  }
  return `${parsed.pathname}${parsed.search}`;
}

async function toolCanvasightWidgetApi(args) {
  const route = widgetApiRoute(args?.path);
  const method = typeof args?.method === "string" ? args.method.toUpperCase() : "GET";
  if (!new Set(["GET", "POST", "PUT", "DELETE"]).has(method)) {
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
  if (!response.ok) {
    appendMcpLifecycle("canvasight_widget_api_error", {
      route: new URL(route, "http://canvasight.local").pathname,
      method,
      status: response.status,
      code,
      openAttemptId: openAttemptIdValue,
      widgetInstanceId
    });
  }
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

function requiredTrimmedString(value, field, maxLength = 500) {
  if (typeof value !== "string" || !value.trim()) {
    throw new HttpError(400, `${field} must be a non-empty string.`, "invalid_framework_question");
  }
  const trimmed = value.trim();
  if (trimmed.length > maxLength) {
    throw new HttpError(400, `${field} must be at most ${maxLength} characters.`, "invalid_framework_question");
  }
  return trimmed;
}

function optionalTrimmedString(value, field, maxLength = 1000) {
  if (value == null || value === "") return undefined;
  return requiredTrimmedString(value, field, maxLength);
}

function normalizeFrameworkQuestions(args) {
  const questions = Array.isArray(args?.questions) ? args.questions : [];
  if (questions.length < 1 || questions.length > 3) {
    throw new HttpError(400, "questions must contain between 1 and 3 items.", "invalid_framework_question");
  }
  const questionIds = new Set();
  const normalizedQuestions = questions.map((question, questionIndex) => {
    const prefix = `questions[${questionIndex}]`;
    const id = requiredTrimmedString(question?.id, `${prefix}.id`, 80);
    if (questionIds.has(id)) {
      throw new HttpError(400, `Duplicate question id: ${id}`, "invalid_framework_question");
    }
    questionIds.add(id);
    const selectionMode = question?.selectionMode;
    if (selectionMode !== "single" && selectionMode !== "multiple") {
      throw new HttpError(400, `${prefix}.selectionMode must be single or multiple.`, "invalid_framework_question");
    }
    const options = Array.isArray(question?.options) ? question.options : [];
    if (options.length < 2 || options.length > 3) {
      throw new HttpError(400, `${prefix}.options must contain between 2 and 3 items.`, "invalid_framework_question");
    }
    const optionIds = new Set();
    let recommendedCount = 0;
    const normalizedOptions = options.map((option, optionIndex) => {
      const optionPrefix = `${prefix}.options[${optionIndex}]`;
      const optionId = requiredTrimmedString(option?.id, `${optionPrefix}.id`, 80);
      if (optionIds.has(optionId)) {
        throw new HttpError(400, `Duplicate option id in ${id}: ${optionId}`, "invalid_framework_question");
      }
      optionIds.add(optionId);
      const recommended = option?.recommended === true;
      if (recommended) recommendedCount += 1;
      return {
        id: optionId,
        label: requiredTrimmedString(option?.label, `${optionPrefix}.label`, 160),
        ...(optionalTrimmedString(option?.description, `${optionPrefix}.description`, 300)
          ? { description: optionalTrimmedString(option.description, `${optionPrefix}.description`, 300) }
          : {}),
        ...(recommended ? { recommended: true } : {})
      };
    });
    if (recommendedCount > 1) {
      throw new HttpError(400, `${prefix}.options may mark at most one recommended option.`, "invalid_framework_question");
    }
    return {
      id,
      question: requiredTrimmedString(question?.question, `${prefix}.question`, 500),
      selectionMode,
      options: normalizedOptions,
      customAnswerLabel:
        optionalTrimmedString(question?.customAnswerLabel, `${prefix}.customAnswerLabel`, 100) ||
        (args?.language === "en" ? "Custom answer" : "自定义答案")
    };
  });
  return {
    kind: "canvasight.framework-questions",
    schemaVersion: 1,
    confirmationId: `framework-confirmation-${crypto.randomUUID()}`,
    language: args?.language === "en" ? "en" : "zh",
    title: requiredTrimmedString(args?.title, "title", 240),
    ...(optionalTrimmedString(args?.description, "description", 800)
      ? { description: optionalTrimmedString(args.description, "description", 800) }
      : {}),
    questions: normalizedQuestions,
    instruction: "wait_for_user_confirmation"
  };
}

async function toolAskCanvasightFrameworkQuestions(args) {
  const structuredContent = normalizeFrameworkQuestions(args || {});
  return toolResult(
    structuredContent,
    "Canvasight needs the user's framework confirmation. Stop the current graph-writing flow and wait for the inline component response. Do not write the graph or repeat these questions before the user answers."
  );
}

const tools = [
  {
    name: "ask_canvasight_framework_questions",
    description:
      "Ask 1-3 consequential framework questions in a compact inline Canvasight form when the answers would materially change content mode, framework dimensions, scope, key relationships, write behavior, or required coverage. Inspect repository, current Page, user context, and relevant Skills first. Stop graph writing after calling this tool and wait for the user's submitted answers.",
    inputSchema: {
      type: "object",
      properties: {
        title: { type: "string", description: "Short title for the confirmation card." },
        description: { type: "string", description: "Optional concise explanation of why confirmation is needed." },
        language: { type: "string", enum: ["zh", "en"], description: "Component language. Defaults to zh." },
        questions: {
          type: "array",
          minItems: 1,
          maxItems: 3,
          items: {
            type: "object",
            properties: {
              id: { type: "string", description: "Stable question id." },
              question: { type: "string", description: "Question text." },
              selectionMode: { type: "string", enum: ["single", "multiple"] },
              customAnswerLabel: { type: "string", description: "Optional label for the custom answer field." },
              options: {
                type: "array",
                minItems: 2,
                maxItems: 3,
                items: {
                  type: "object",
                  properties: {
                    id: { type: "string", description: "Stable option id within this question." },
                    label: { type: "string" },
                    description: { type: "string" },
                    recommended: { type: "boolean" }
                  },
                  required: ["id", "label"],
                  additionalProperties: false
                }
              }
            },
            required: ["id", "question", "selectionMode", "options"],
            additionalProperties: false
          }
        }
      },
      required: ["title", "questions"],
      additionalProperties: false
    },
    outputSchema: frameworkQuestionsOutputSchema,
    annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
    _meta: {
      ui: {
        resourceUri: CANVASIGHT_FRAMEWORK_QUESTIONS_URI,
        visibility: ["model", "app"],
        displayMode: "inline"
      },
      "openai/toolInvocation/invoking": "Preparing framework questions...",
      "openai/toolInvocation/invoked": "Framework questions ready"
    }
  },
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
    name: "list_canvasight_skills",
    description:
      "List lightweight summaries of enabled Codex Skills resolved for the current project. Query by a canvas or node responsibility before choosing professional content Skills or assigning an AI-selected node Skill. Results never include Skill bodies or local paths.",
    inputSchema: {
      type: "object",
      properties: {
        projectPath: {
          type: "string",
          description: "Optional project cwd used by Codex Skill resolution. Defaults to the current Canvasight project."
        },
        threadId: {
          type: "string",
          description: "Optional current Codex thread id used to resolve its project cwd."
        },
        query: {
          type: "string",
          description: "Optional canvas or node responsibility matched against Skill name, display name, description, and scope."
        },
        forceReload: {
          type: "boolean",
          description: "Ask Codex to refresh its resolved Skill catalog before searching."
        },
        limit: {
          type: "number",
          minimum: 1,
          maximum: 200,
          description: "Maximum Skill summaries to return. Defaults to 50."
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
    name: "get_canvasight_graph_context",
    description:
      "Read the active Canvasight page and current document revision before deciding whether to append, replace, or incrementally edit the graph. Use the returned ids and revision for merge-active-page operations.",
    inputSchema: {
      type: "object",
      properties: {
        projectPath: {
          type: "string",
          description: "Optional local project path. Defaults to the current Canvasight project."
        },
        threadId: {
          type: "string",
          description: "Optional current Codex thread id used to resolve its project."
        }
      },
      additionalProperties: false
    },
    outputSchema: canvasightGraphContextOutputSchema
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
          enum: ["append-page", "merge-active-page", "replace-active-page", "replace-document"],
          description: "Write behavior. Use merge-active-page with expectedRevision and operations to preserve and edit the active page."
        },
        expectedRevision: {
          type: "integer",
          description: "Exact revision returned with contextId. Legacy calls without contextId remain strict stale-write checked."
        },
        contextId: {
          type: "string",
          description: "Context id returned by get_canvasight_graph_context. Binds merge-active-page to that Page and enables safe automatic rebase."
        },
        clientMutationId: {
          type: "string",
          description: "Stable unique id for this exact context-bound graph mutation. Reuse it only when retrying the same payload."
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
          enum: ["horizontal"],
          description: "Horizontal dependency layout for AI writes. Legacy vertical and grid requests are accepted at runtime, normalized to horizontal, and reported as deprecated advisories."
        },
        layoutPolicy: {
          type: "string",
          enum: ["auto", "preserve-explicit"],
          description: "Coordinate policy for AI writes. auto is the default and recomputes the whole graph from topology; preserve-explicit keeps caller-provided axes for compatibility."
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
        operations: {
          type: "array",
          description: "Explicit incremental operations for merge-active-page: add/update/remove-node, add/update/remove-edge, and relayout-page.",
          items: {
            type: "object",
            properties: {
              op: {
                type: "string",
                enum: ["add-node", "update-node", "remove-node", "add-edge", "update-edge", "remove-edge", "relayout-page"]
              },
              node: { type: "object", additionalProperties: true },
              nodeId: { type: "string" },
              edge: { type: "object", additionalProperties: true },
              edgeId: { type: "string" },
              changes: { type: "object", additionalProperties: true }
            },
            required: ["op"],
            additionalProperties: false
          }
        },
        frameworkManifest: {
          type: "object",
          description: "Non-persisted framework, professional content Skill selection, node Skill assignment, and final-page coverage used for closed-loop validation before Canvasight performs the only graph write.",
          properties: {
            intent: { type: "string", enum: ["create", "analyze", "organize", "refine", "decide", "execute"] },
            primaryDomain: { type: "string", enum: ["software-product", "ux-design", "codebase", "article", "research", "task-execution"] },
            secondaryDomains: {
              type: "array",
              items: { type: "string", enum: ["software-product", "ux-design", "codebase", "article", "research", "task-execution"] }
            },
            maturity: { type: "string", enum: ["explore", "define", "decide", "deliver"] },
            output: { type: "string", enum: ["exploration-map", "structured-outline", "system-map", "decision-map", "execution-plan"] },
            contentMode: {
              type: "string",
              enum: ["canvasight-default", "skill-led"],
              description: "Defaults to canvasight-default. skill-led lets one primary professional Skill own content coverage while Canvasight keeps graph validation and horizontal layout."
            },
            contentSkills: {
              type: "array",
              description: "Professional content Skills for the whole canvas. skill-led requires exactly one primary Skill; compatible supporting Skills use augment.",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  role: { type: "string", enum: ["primary", "augment"] }
                },
                required: ["name", "role"],
                additionalProperties: false
              }
            },
            skillAssignments: {
              type: "object",
              description: "Non-persisted mapping from final node id to visible $skill-name assignments already present in that node body.",
              additionalProperties: {
                type: "array",
                minItems: 1,
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    source: { type: "string", enum: ["user-explicit", "ai-selected"] },
                    rationale: { type: "string" }
                  },
                  required: ["name", "source"],
                  additionalProperties: false
                }
              }
            },
            coverage: {
              type: "object",
              additionalProperties: {
                type: "array",
                items: { type: "string" },
                minItems: 1
              }
            },
            semanticStructure: {
              type: "object",
              description: "Non-persisted semantic cohesion review keyed by final node id. Use meaning and responsibility, never counts or text length, to decide decomposition.",
              additionalProperties: {
                type: "object",
                properties: {
                  responsibility: { type: "string" },
                  inseparableReason: { type: "string" }
                },
                required: ["responsibility", "inseparableReason"],
                additionalProperties: false
              }
            },
            semanticRelationships: {
              type: "object",
              description: "Semantic review keyed by final edge id for relationships between covered responsibilities.",
              additionalProperties: {
                type: "object",
                properties: {
                  type: { type: "string", enum: ["dependency", "sequence", "containment", "evidence", "decision", "navigation", "flow"] },
                  rationale: { type: "string" }
                },
                required: ["type", "rationale"],
                additionalProperties: false
              }
            }
          },
          required: ["intent", "primaryDomain", "maturity", "output", "coverage", "semanticStructure", "semanticRelationships"],
          additionalProperties: false
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
              layout: { type: "string", enum: ["horizontal"] },
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
          description: "Maximum wait in milliseconds. Defaults to 30000."
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
  if (name === "ask_canvasight_framework_questions") return toolAskCanvasightFrameworkQuestions(args || {});
  if (name === "render_canvasight_canvas_widget") return toolRenderCanvasightCanvasWidget(args || {});
  if (name === "open_canvasight") return toolOpenCanvasight(args || {});
  if (name === "open_canvasight_browser_fallback") return toolOpenCanvasightBrowserFallback(args || {});
  if (name === "list_canvasight_recent_projects") return toolListCanvasightRecentProjects(args || {});
  if (name === "open_canvasight_recent_project") return toolOpenCanvasightRecentProject(args || {});
  if (name === "claim_canvasight_thread") return toolClaimCanvasightThread(args || {});
  if (name === "list_canvasight_node_templates") return toolListCanvasightNodeTemplates(args || {});
  if (name === "list_canvasight_skills") return toolListCanvasightSkills(args || {});
  if (name === "get_canvasight_node_template") return toolGetCanvasightNodeTemplate(args || {});
  if (name === "get_canvasight_graph_context") return toolGetCanvasightGraphContext(args || {});
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
    canvasightHome: canvasightHome(),
    execPath: process.execPath,
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch,
    parentPid: process.ppid
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
