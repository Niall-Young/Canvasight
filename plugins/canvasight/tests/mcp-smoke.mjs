#!/usr/bin/env node
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import fs from "node:fs";
import fsp from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { unzipSync } from "fflate";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const pluginRoot = path.resolve(__dirname, "..");
const serverPath = path.join(pluginRoot, "mcp", "server.mjs");
const pluginJson = JSON.parse(fs.readFileSync(path.join(pluginRoot, ".codex-plugin", "plugin.json"), "utf8"));
const mcpJson = JSON.parse(fs.readFileSync(path.join(pluginRoot, ".mcp.json"), "utf8"));
const packageJson = JSON.parse(fs.readFileSync(path.join(pluginRoot, "package.json"), "utf8"));
const packageLockJson = JSON.parse(fs.readFileSync(path.join(pluginRoot, "package-lock.json"), "utf8"));
const expectedPluginVersion = pluginJson.version;

assert.equal(packageJson.version, expectedPluginVersion);
assert.equal(packageLockJson.version, expectedPluginVersion);
assert.equal(packageLockJson.packages[""].version, expectedPluginVersion);
assert.equal(mcpJson.mcpServers.canvasight.env.CANVASIGHT_CODEX_NATIVE, "1");

function assertOpenFlowSkillContract() {
  const indexSkill = fs.readFileSync(path.join(pluginRoot, "skills", "canvasight", "SKILL.md"), "utf8");
  const openSkill = fs.readFileSync(path.join(pluginRoot, "skills", "canvasight-open", "SKILL.md"), "utf8");
  const openWorkflow = fs.readFileSync(path.join(pluginRoot, "skills", "canvasight-open", "references", "open-workflow.md"), "utf8");
  const runSkill = fs.readFileSync(path.join(pluginRoot, "skills", "canvasight-run", "SKILL.md"), "utf8");
  const runContract = fs.readFileSync(path.join(pluginRoot, "skills", "canvasight-run", "references", "run-output-contract.md"), "utf8");
  const troubleshootingSkill = fs.readFileSync(path.join(pluginRoot, "skills", "canvasight-troubleshooting", "SKILL.md"), "utf8");
  const troubleshooting = fs.readFileSync(path.join(pluginRoot, "skills", "canvasight-troubleshooting", "references", "troubleshooting.md"), "utf8");
  const appSource = fs.readFileSync(path.join(pluginRoot, "src", "App.tsx"), "utf8");
  const apiSource = fs.readFileSync(path.join(pluginRoot, "src", "lib", "canvasightApi.ts"), "utf8");
  const translationsSource = fs.readFileSync(path.join(pluginRoot, "src", "lib", "translations.ts"), "utf8");

  assert.match(indexSkill, /打开画布/);
  assert.match(indexSkill, /打开 Canvasight/);
  assert.match(openSkill, /tool_search/);
  assert.match(openSkill, /打开画布/);
  assert.match(openSkill, /打开 Canvasight/);
  assert.match(openSkill, /canvasight open_canvasight await_canvasight_widget_ready render_canvasight_canvas_widget/);
  assert.match(openSkill, /CODEX_THREAD_ID/);
  assert.match(openSkill, /await_canvasight_widget_ready/);
  assert.match(openSkill, /status: "ready"/);
  assert.match(openSkill, /reactMounted.*projectHydrated.*canvasRendered.*canvasVisible.*true/s);
  assert.match(openSkill, /Do not call `open_canvasight` again/);
  assert.match(openSkill, /recover.*`sessionId`.*`openAttemptId`/s);
  assert.match(openSkill, /unverified.*do not reopen/is);
  assert.match(openSkill, /Transport closed/);
  assert.match(openSkill, /canvasight_mcp_transport_closed/);
  assert.match(openWorkflow, /tool_search/);
  assert.match(openWorkflow, /CODEX_THREAD_ID/);
  assert.match(openWorkflow, /current_thread_id_required/);
  assert.match(openWorkflow, /opened\s*=\s*open_canvasight[\s\S]*await_canvasight_widget_ready/);
  assert.match(openWorkflow, /Do not call `open_canvasight` again/);
  assert.match(openWorkflow, /unverified.*do not reopen/is);
  assert.match(openWorkflow, /Do not open a bare `127\.0\.0\.1:5173` page as the normal response/);
  assert.match(openWorkflow, /Transport closed/);
  assert.match(openWorkflow, /canvasight_mcp_transport_closed/);
  assert.match(runSkill, /browser_fallback_no_bridge/);
  assert.match(runSkill, /Transport closed/);
  assert.match(runSkill, /canvasight_mcp_transport_closed/);
  assert.match(runContract, /Transport closed/);
  assert.match(runContract, /canvasight_mcp_transport_closed/);
  assert.match(troubleshootingSkill, /Transport closed/);
  assert.match(troubleshootingSkill, /canvasight_mcp_transport_closed/);
  assert.match(troubleshooting, /browser_fallback_no_bridge/);
  assert.match(troubleshooting, /Transport closed/);
  assert.match(troubleshooting, /canvasight_mcp_transport_closed/);
  assert.match(troubleshooting, /real native-host acceptance is still required/);
  assert.match(troubleshooting, /Browser fallback and automated harnesses cannot fill the gap/);
  assert.match(appSource, /status\.browserFallbackNoBridge/);
  assert.match(apiSource, /reason === "browser_fallback_no_bridge"/);
  assert.match(translationsSource, /status\.browserFallbackNoBridge/);
  assert.doesNotMatch(openWorkflow, /only practical fallback is the generic dev server/);
  assert.doesNotMatch(openSkill, /must open the already running dev page with generic browser control/);
}

assertOpenFlowSkillContract();

const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "canvasight-mcp-"));
const defaultProjectPath = path.join(tempRoot, "auto-project");
const canvasightHome = path.join(tempRoot, "canvasight-home");
const exportDirectory = path.join(tempRoot, "exports");
const nativeLogPath = path.join(tempRoot, "native-codex.jsonl");
const resumeFailPath = path.join(tempRoot, "resume-fail-threads.txt");
const transientResumeFailCountPath = path.join(tempRoot, "transient-resume-fail-count.json");
const directModeNotLoadedPath = path.join(tempRoot, "direct-mode-not-loaded-threads.txt");
const directModeThreadReadFailPath = path.join(tempRoot, "direct-mode-thread-read-fail-threads.txt");
const skillsFailPath = path.join(tempRoot, "skills-fail.flag");
const fakeCodexScriptPath = path.join(tempRoot, "fake-codex.mjs");
const fakeCodexPath = process.platform === "win32" ? process.execPath : fakeCodexScriptPath;
const fakeCodexAppServerArgs = process.platform === "win32" ? fakeCodexScriptPath : "";

fs.writeFileSync(
  fakeCodexScriptPath,
  `#!/usr/bin/env node
import fs from "node:fs";

const logPath = process.env.CANVASIGHT_NATIVE_LOG;
const resumeFailPath = process.env.CANVASIGHT_FAKE_RESUME_FAIL_PATH;
const transientResumeFailCountPath = process.env.CANVASIGHT_FAKE_TRANSIENT_RESUME_FAIL_COUNT_PATH;
const directModeNotLoadedPath = process.env.CANVASIGHT_FAKE_DIRECT_MODE_NOT_LOADED_PATH;
const directModeThreadReadFailPath = process.env.CANVASIGHT_FAKE_DIRECT_MODE_THREAD_READ_FAIL_PATH;
const skillsFailPath = process.env.CANVASIGHT_FAKE_SKILLS_FAIL_PATH;
const fakeThreadCwd = process.env.CANVASIGHT_FAKE_THREAD_CWD || process.cwd();
let buffer = "";
const loadedThreads = new Set();

function write(message) {
  process.stdout.write(JSON.stringify(message) + "\\n");
}

function append(method, params) {
  if (!logPath) return;
  fs.appendFileSync(logPath, JSON.stringify({ method, params }) + "\\n");
}

function hasNull(value) {
  if (value === null) return true;
  if (Array.isArray(value)) return value.some(hasNull);
  if (value && typeof value === "object") return Object.values(value).some(hasNull);
  return false;
}

function shouldFailResume(threadId) {
  if (!resumeFailPath) return false;
  try {
    return fs.readFileSync(resumeFailPath, "utf8").split(/\\s+/).filter(Boolean).includes(threadId);
  } catch {
    return false;
  }
}

function shouldTransientlyFailResume(threadId) {
  if (!transientResumeFailCountPath) return false;
  try {
    const counts = JSON.parse(fs.readFileSync(transientResumeFailCountPath, "utf8"));
    const remaining = Number(counts[threadId] || 0);
    if (remaining <= 0) return false;
    counts[threadId] = remaining - 1;
    fs.writeFileSync(transientResumeFailCountPath, JSON.stringify(counts));
    return true;
  } catch {
    return false;
  }
}

function listedThread(path, threadId) {
  if (!path) return false;
  try {
    return fs.readFileSync(path, "utf8").split(/\\s+/).filter(Boolean).includes(threadId);
  } catch {
    return false;
  }
}

function turnStartText(message) {
  const input = Array.isArray(message.params?.input) ? message.params.input : [];
  return input.find((item) => item?.type === "text")?.text || "";
}

function shouldConfirmTurnStart(message) {
  return !turnStartText(message).includes("[no-confirm]");
}

function handle(message) {
  if (message.method === "initialize") {
    append("runtime/initialize", { executable: process.argv[1], execPath: process.execPath });
    if (process.env.CANVASIGHT_FAKE_FAIL_INITIALIZE === "1") {
      write({ id: message.id, error: { code: -32603, message: "fake Desktop app-server handshake failure" } });
      return;
    }
    write({ id: message.id, result: { userAgent: "fake-codex", codexHome: process.cwd(), platformFamily: "unix", platformOs: "test" } });
    return;
  }
  append(message.method, message.params);
  if (hasNull(message.params)) {
    write({ id: message.id, error: { code: -32602, message: "Invalid request: null values are not accepted" } });
    return;
  }
  if (message.method === "thread/resume") {
    if (shouldTransientlyFailResume(message.params.threadId)) {
      write({ id: message.id, error: { code: -32603, message: "failed to read thread rollout: rollout does not start with session metadata" } });
      return;
    }
    if (shouldFailResume(message.params.threadId)) {
      write({ id: message.id, error: { code: -32603, message: "fake thread/resume failure: " + message.params.threadId } });
      return;
    }
    loadedThreads.add(message.params.threadId);
    write({
      id: message.id,
      result: {
        thread: { id: message.params.threadId, status: { type: "running" } },
        model: "gpt-5.5",
        modelProvider: "openai",
        serviceTier: null,
        cwd: fakeThreadCwd,
        instructionSources: [],
        approvalPolicy: "never",
        approvalsReviewer: "user",
        sandbox: { type: "dangerFullAccess" },
        reasoningEffort: "medium"
      }
    });
    return;
  }
  if (message.method === "skills/list") {
    if (skillsFailPath && fs.existsSync(skillsFailPath)) {
      write({ id: message.id, error: { code: -32603, message: "fake skills/list failure at /private/secret/skills" } });
      return;
    }
    const cwd = Array.isArray(message.params?.cwds) ? message.params.cwds[0] : fakeThreadCwd;
    write({
      id: message.id,
      result: {
        data: [{
          cwd,
          errors: [],
          skills: [
            {
              name: "pdf",
              description: "Read, create, and verify PDF files where rendering and layout matter.",
              enabled: true,
              path: "/private/secret/skills/pdf/SKILL.md",
              scope: "user",
              interface: { displayName: "PDF 专家" }
            },
            {
              name: "PDF",
              description: "Duplicate lower-priority metadata must not create a second picker row.",
              enabled: true,
              path: "/private/secret/skills/pdf-duplicate/SKILL.md",
              scope: "repo"
            },
            {
              name: "figma",
              description: "Translate Figma design context into implementation evidence.",
              enabled: true,
              path: "/private/secret/skills/figma/SKILL.md",
              scope: "repo"
            },
            {
              name: "disabled-secret",
              description: "Must never be returned.",
              enabled: false,
              path: "/private/secret/skills/disabled/SKILL.md",
              scope: "user"
            }
          ]
        }]
      }
    });
    return;
  }
  if (["thread/goal/set", "thread/settings/update"].includes(message.method) && listedThread(directModeThreadReadFailPath, message.params?.threadId)) {
    write({ id: message.id, error: { code: -32603, message: "failed to read thread rollout: rollout does not start with session metadata" } });
    return;
  }
  if (["thread/goal/set", "thread/settings/update"].includes(message.method) && listedThread(directModeNotLoadedPath, message.params?.threadId) && !loadedThreads.has(message.params?.threadId)) {
    write({ id: message.id, error: { code: -32602, message: "thread not loaded: " + message.params?.threadId } });
    return;
  }
  if (message.method === "turn/start" && !loadedThreads.has(message.params?.threadId)) {
    write({ id: message.id, error: { code: -32602, message: "thread not found: " + message.params?.threadId } });
    return;
  }
  if (message.method === "thread/settings/update" && !message.params?.collaborationMode?.settings) {
    write({ id: message.id, error: { code: -32602, message: "Invalid request: missing field settings" } });
    return;
  }
  if (message.method === "thread/settings/update" && !message.params?.collaborationMode?.settings?.model) {
    write({ id: message.id, error: { code: -32602, message: "Invalid request: missing field model" } });
    return;
  }
  if (message.method === "thread/goal/set") {
    write({ id: message.id, result: { goal: { threadId: message.params.threadId, objective: message.params.objective, status: "active", tokensUsed: 0, timeUsedSeconds: 0, createdAt: 0, updatedAt: 0 } } });
    return;
  }
  if (message.method === "thread/settings/update") {
    write({ id: message.id, result: {} });
    return;
  }
  if (message.method === "turn/start") {
    const turnId = "turn-smoke-" + message.id;
    write({ id: message.id, result: { turn: { id: turnId, threadId: message.params.threadId, status: "running" } } });
    if (shouldConfirmTurnStart(message)) {
      write({
        method: "turn/started",
        params: {
          threadId: message.params.threadId,
          turnId,
          clientUserMessageId: message.params.clientUserMessageId
        }
      });
    }
    return;
  }
  write({ id: message.id, error: { code: -32601, message: "Method not found" } });
}

process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => {
  buffer += chunk;
  while (buffer.includes("\\n")) {
    const newline = buffer.indexOf("\\n");
    const line = buffer.slice(0, newline).trim();
    buffer = buffer.slice(newline + 1);
    if (!line) continue;
    handle(JSON.parse(line));
  }
});
`,
  "utf8"
);
fs.chmodSync(fakeCodexScriptPath, 0o755);

let nextId = 1;
let stdoutBuffer = "";
let stderrBuffer = "";
let daemonToken = "";
const pending = new Map();

const child = spawn(process.execPath, [serverPath], {
  cwd: pluginRoot,
  env: {
    ...process.env,
    CANVASIGHT_DEFAULT_PROJECT_PATH: defaultProjectPath,
    CANVASIGHT_HOME: canvasightHome,
    CANVASIGHT_EXPORT_DIR: exportDirectory,
    CANVASIGHT_CODEX_BIN: fakeCodexPath,
    CANVASIGHT_CODEX_APP_SERVER_ARGS: fakeCodexAppServerArgs,
    CANVASIGHT_CODEX_NATIVE: "1",
    CANVASIGHT_NATIVE_LOG: nativeLogPath,
    CANVASIGHT_FAKE_RESUME_FAIL_PATH: resumeFailPath,
    CANVASIGHT_FAKE_TRANSIENT_RESUME_FAIL_COUNT_PATH: transientResumeFailCountPath,
    CANVASIGHT_FAKE_DIRECT_MODE_NOT_LOADED_PATH: directModeNotLoadedPath,
    CANVASIGHT_FAKE_DIRECT_MODE_THREAD_READ_FAIL_PATH: directModeThreadReadFailPath,
    CANVASIGHT_FAKE_SKILLS_FAIL_PATH: skillsFailPath,
    CANVASIGHT_FAKE_THREAD_CWD: defaultProjectPath,
    CANVASIGHT_OPEN_EXTERNAL_BROWSER: "0",
    CANVASIGHT_OPEN_BROWSER: "0",
    CODEX_THREAD_ID: "thread-smoke"
  },
  stdio: ["pipe", "pipe", "pipe"]
});

function rejectPending(error) {
  for (const { reject } of pending.values()) reject(error);
  pending.clear();
}

function parseStdout() {
  while (stdoutBuffer.includes("\n")) {
    const newline = stdoutBuffer.indexOf("\n");
    const line = stdoutBuffer.slice(0, newline).trim();
    stdoutBuffer = stdoutBuffer.slice(newline + 1);
    if (!line) continue;
    const message = JSON.parse(line);
    const handler = pending.get(message.id);
    if (!handler) continue;
    pending.delete(message.id);
    if (message.error) {
      handler.reject(new Error(message.error.message));
    } else {
      handler.resolve(message.result);
    }
  }
}

child.stdout.setEncoding("utf8");
child.stdout.on("data", (chunk) => {
  stdoutBuffer += chunk;
  parseStdout();
});

child.stderr.setEncoding("utf8");
child.stderr.on("data", (chunk) => {
  stderrBuffer += chunk;
});

child.on("exit", (code, signal) => {
  if (pending.size) {
    rejectPending(new Error(`MCP server exited early: code=${code} signal=${signal} stderr=${stderrBuffer}`));
  }
});

function request(method, params) {
  const id = nextId;
  nextId += 1;
  const payload = {
    jsonrpc: "2.0",
    id,
    method,
    params
  };
  const promise = new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
  });
  child.stdin.write(`${JSON.stringify(payload)}\n`);
  return promise;
}

function notify(method, params) {
  child.stdin.write(`${JSON.stringify({ jsonrpc: "2.0", method, params })}\n`);
}

async function readNativeLog() {
  try {
    const raw = await fsp.readFile(nativeLogPath, "utf8");
    return raw
      .split("\n")
      .filter(Boolean)
      .map((line) => JSON.parse(line));
  } catch (error) {
    if (error?.code === "ENOENT") return [];
    throw error;
  }
}

async function readMcpLifecycleLog(home = canvasightHome) {
  try {
    const raw = await fsp.readFile(path.join(home, "mcp-lifecycle.log"), "utf8");
    return raw
      .split("\n")
      .filter(Boolean)
      .map((line) => JSON.parse(line));
  } catch (error) {
    if (error?.code === "ENOENT") return [];
    throw error;
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchJson(url, init) {
  const response = await fetch(url, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(daemonToken ? { "x-canvasight-token": daemonToken } : {}),
      ...(init?.headers || {})
    }
  });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`${init?.method || "GET"} ${url} failed: ${response.status} ${text}`);
  }
  return text ? JSON.parse(text) : null;
}

function assertNativeWidgetPublicResult(result) {
  assert.equal(result.structuredContent.status, "opening");
  assert.equal(result.structuredContent.openTarget, "codex_native_widget");
  for (const key of ["url", "browserUrl", "origin", "apiBaseUrl", "token"]) {
    assert.equal(Object.prototype.hasOwnProperty.call(result.structuredContent, key), false, `native widget structuredContent leaked ${key}`);
  }
  assert.doesNotMatch(JSON.stringify(result.structuredContent), /127\.0\.0\.1:\d+/);
  assert.doesNotMatch(result.content[0].text, /127\.0\.0\.1:\d+/);
  assert.equal(typeof result.structuredContent.openAttemptId, "string");
  assert.equal(typeof result.structuredContent.sessionId, "string");
  const sessionIdMatch = result.content[0].text.match(/^sessionId: (\S+)$/m);
  const openAttemptIdMatch = result.content[0].text.match(/^openAttemptId: (\S+)$/m);
  assert.ok(sessionIdMatch, "native open text must expose the safe sessionId");
  assert.ok(openAttemptIdMatch, "native open text must expose the safe openAttemptId");
  assert.equal(sessionIdMatch[1], result.structuredContent.sessionId);
  assert.equal(openAttemptIdMatch[1], result.structuredContent.openAttemptId);
  const exactNextStep = `Next: await_canvasight_widget_ready(${JSON.stringify({
    sessionId: result.structuredContent.sessionId,
    openAttemptId: result.structuredContent.openAttemptId,
    threadId: result.structuredContent.codexThreadId
  })})`;
  assert.equal(result.content[0].text.includes(exactNextStep), true, "native open text must preserve the exact await identity");
  assert.doesNotMatch(result.content[0].text, /[?&]token=|apiBaseUrl|browserUrl|origin:/);
  assert.equal(result.structuredContent.targetDisplayMode, "fullscreen");
  assert.deepEqual(Object.keys(result._meta), ["widgetData"]);
  assert.equal(result._meta.widgetData.openAttemptId, result.structuredContent.openAttemptId);
  assert.equal(result._meta.widgetData.canvasightHost, "widget");
  assert.match(result._meta.widgetData.url, /^http:\/\/127\.0\.0\.1:\d+\//);
}

function widgetDataFor(result) {
  assertNativeWidgetPublicResult(result);
  return result._meta.widgetData;
}

async function assertDynamicWidgetRuntimeApi() {
  const originalWindow = globalThis.window;
  const originalFetch = globalThis.fetch;
  const originalCustomEvent = globalThis.CustomEvent;
  const runtime = {};
  const requests = [];
  const serverToolRequests = [];
  const bridgeMessages = [];
  const windowListeners = new Map();
  const readyEvents = [];
  const mockBridgeState = {
    startupStage: "starting",
    displayMode: "unknown",
    widgetInstanceId: "widget-runtime"
  };
  const vite = await import("vite");
  const viteServer = await vite.createServer({
    root: pluginRoot,
    server: { middlewareMode: true },
    appType: "custom",
    logLevel: "silent"
  });

  globalThis.window = {
    __CANVASIGHT_WIDGET_DATA__: runtime,
    __CANVASIGHT_WIDGET_SHELL__: true,
    canvasightMcp: {
      canSendFollowUpMessage() {
        return true;
      },
      getBridgeState() {
        return { ...mockBridgeState };
      },
      setStartupStage(stage) {
        mockBridgeState.startupStage = stage;
      },
      async callServerTool(request) {
        serverToolRequests.push(request);
        const path = request.arguments.path;
        const body = request.arguments.body;
        if (path.endsWith("/run") && body?.deliveryMode === "widget_bridge_prepare") {
          assert.equal("codexMode" in body, false, "widget payloads must not forward retired execution modes");
          assert.equal("planMode" in body, false, "widget payloads must not forward retired Plan state");
          return {
            structuredContent: {
              ok: true,
              status: 200,
              data: {
                status: "prepared",
                codexNative: { status: "applied_chat" },
                delivery: { status: "prepared", via: "widget_bridge" }
              },
              error: null,
              code: null
            }
          };
        }
        return {
          structuredContent: {
            ok: true,
            status: 200,
            data: path.endsWith("/widget-ready") ? { status: "ready", verified: true } : { sessionId: "session-runtime" },
            error: null,
            code: null
          }
        };
      },
      async sendFollowUpMessage(message) {
        bridgeMessages.push(message);
      }
    },
    location: { search: "", href: "https://canvasight-widget.test/" },
    parent: {},
    setTimeout,
    clearTimeout,
    addEventListener(type, listener) {
      const listeners = windowListeners.get(type) || [];
      listeners.push(listener);
      windowListeners.set(type, listeners);
    },
    removeEventListener(type, listener) {
      const listeners = windowListeners.get(type) || [];
      windowListeners.set(type, listeners.filter((candidate) => candidate !== listener));
    },
    dispatchEvent(event) {
      for (const listener of windowListeners.get(event.type) || []) listener(event);
      return true;
    },
    localStorage: {
      getItem() {
        return null;
      },
      setItem() {}
    }
  };
  class TestCustomEvent {
    constructor(type, init = {}) {
      this.type = type;
      this.detail = init.detail;
    }
  }
  globalThis.CustomEvent = TestCustomEvent;
  globalThis.window.addEventListener("canvasight:app-ready", (event) => readyEvents.push(event.detail));
  globalThis.fetch = async (url, init = {}) => {
    requests.push({ url: String(url), init });
    throw new Error("Native widget API must not fetch localhost directly.");
  };

  try {
    const module = await viteServer.ssrLoadModule("/src/lib/canvasightApi.ts");
    const api = module.canvasightApi;
    assert.equal(api.sessionId, "local");
    assert.equal(api.token, "");

    Object.assign(runtime, {
      apiBaseUrl: "http://127.0.0.1:54321",
      canvasightHost: "widget",
      codexThreadId: "thread-runtime",
      openAttemptId: "open-runtime",
      sessionId: "session-runtime",
      widgetInstanceId: "widget-runtime",
      token: "token-runtime"
    });
    await api.getSession();
    await api.reportWidgetReady({
      projectHydrated: true,
      canvasRendered: true,
      canvasVisible: true,
      canvasWidth: 800,
      canvasHeight: 600
    });

    assert.equal(requests.length, 0);
    assert.equal(serverToolRequests.length, 2);
    assert.deepEqual(serverToolRequests[0], {
      name: "canvasight_widget_api",
      arguments: {
        path: "/api/sessions/session-runtime",
        method: "GET",
        body: null,
        openAttemptId: "open-runtime",
        widgetInstanceId: "widget-runtime",
        startupStage: "starting",
        displayMode: "unknown",
        threadId: "thread-runtime",
        reactMounted: false
      }
    });
    assert.deepEqual(serverToolRequests[1], {
      name: "canvasight_widget_api",
      arguments: {
        path: "/api/sessions/session-runtime/widget-ready",
        method: "POST",
        body: {
          status: "ready",
          startupStage: "ready",
          stage: "ready",
          openAttemptId: "open-runtime",
          widgetInstanceId: "widget-runtime",
          displayMode: "unknown",
          threadId: "thread-runtime",
          reactMounted: true,
          projectHydrated: true,
          canvasRendered: true,
          canvasVisible: true,
          canvasWidth: 800,
          canvasHeight: 600
        },
        openAttemptId: "open-runtime",
        widgetInstanceId: "widget-runtime",
        startupStage: "hydrating_project",
        displayMode: "unknown",
        threadId: "thread-runtime",
        reactMounted: true
      }
    });
    assert.equal(readyEvents.length, 1);
    assert.equal(readyEvents[0].status, "ready");
    assert.equal(api.sessionId, "session-runtime");
    assert.equal(api.token, "token-runtime");

    const widgetRunPayload = {
      sessionId: "session-runtime",
      threadName: "Mode control smoke",
      projectPath: "/tmp/widget-runtime",
      markdown: "# Mode control smoke",
      imagePaths: [],
      codexMode: "plan",
      effort: "medium",
      planMode: true,
      runMode: "single",
      agentTeam: { enabled: false },
      nodeIds: []
    };
    const chatRun = await api.runCanvasightNode(widgetRunPayload);
    assert.equal(chatRun.status, "sent");
    assert.equal(bridgeMessages.length, 1, "legacy mode payloads normalize and retain bridge delivery");
    assert.equal(bridgeMessages[0].prompt, "# Mode control smoke");
  } finally {
    await viteServer.close();
    if (originalWindow === undefined) delete globalThis.window;
    else globalThis.window = originalWindow;
    globalThis.fetch = originalFetch;
    if (originalCustomEvent === undefined) delete globalThis.CustomEvent;
    else globalThis.CustomEvent = originalCustomEvent;
  }
}

async function waitForCondition(predicate, label, timeoutMs = 1500) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (predicate()) return;
    await sleep(5);
  }
  assert.fail(`Timed out waiting for ${label}`);
}

function createWidgetBridgeEnvironment({ bootstrapTimeoutMs = 40, initializeError = false } = {}) {
  const records = {
    appMessages: [],
    compatPrompts: [],
    openaiGlobalEvents: []
  };
  const listeners = new Map();
  const statusEl = { dataset: {}, textContent: "Starting Canvasight..." };
  const documentElement = {
    classList: { contains: () => false },
    clientWidth: 800,
    offsetHeight: 600,
    scrollHeight: 600,
    style: {
      colorScheme: "",
      height: "",
      setProperty() {}
    },
    getAttribute() {
      return null;
    },
    setAttribute() {},
    getBoundingClientRect() {
      return { height: 600, width: 800 };
    }
  };
  const document = {
    body: {
      offsetHeight: 600,
      scrollHeight: 600
    },
    documentElement,
    head: {
      appendChild() {}
    },
    createElement() {
      return { id: "", style: {}, textContent: "" };
    },
    getElementById(id) {
      if (id === "canvasight-widget-status") return statusEl;
      return null;
    }
  };

  class TestCustomEvent {
    constructor(type, init = {}) {
      this.type = type;
      this.detail = init.detail;
    }
  }

  let hostWindow;
  const window = {
    __CANVASIGHT_WIDGET_BOOTSTRAP_TIMEOUT_MS__: bootstrapTimeoutMs,
    __CANVASIGHT_WIDGET_SERVER_VERSION__: expectedPluginVersion,
    __CANVASIGHT_WIDGET_SHELL__: true,
    document,
    innerWidth: 800,
    location: { href: "https://canvasight-widget.test/", search: "" },
    openai: {},
    setTimeout,
    clearTimeout,
    requestAnimationFrame(callback) {
      return setTimeout(() => callback(Date.now()), 0);
    },
    cancelAnimationFrame(timer) {
      clearTimeout(timer);
    },
    addEventListener(type, listener) {
      const current = listeners.get(type) || [];
      current.push(listener);
      listeners.set(type, current);
    },
    removeEventListener(type, listener) {
      const current = listeners.get(type) || [];
      listeners.set(type, current.filter((candidate) => candidate !== listener));
    },
    dispatchEvent(event) {
      for (const listener of [...(listeners.get(event.type) || [])]) listener(event);
      return true;
    }
  };
  window.window = window;

  function dispatchHostMessage(message) {
    window.dispatchEvent({
      type: "message",
      data: message,
      origin: "https://codex-host.test",
      source: hostWindow
    });
  }

  hostWindow = {
    postMessage(message) {
      records.appMessages.push(message);
      if (!Object.prototype.hasOwnProperty.call(message, "id")) return;
      if (message.method === "ui/initialize" && initializeError) {
        queueMicrotask(() => dispatchHostMessage({
          jsonrpc: "2.0",
          id: message.id,
          error: { code: -32603, message: "fake MCP Apps initialization failure" }
        }));
        return;
      }
      let result = {};
      if (message.method === "ui/initialize") {
        result = {
          protocolVersion: "2026-01-26",
          hostInfo: { name: "canvasight-bootstrap-test-host", version: "1.0.0" },
          hostCapabilities: { message: {} },
          hostContext: {
            theme: "light",
            displayMode: "inline",
            availableDisplayModes: ["inline", "fullscreen"],
            containerDimensions: { width: 800, height: 600 }
          }
        };
      } else if (message.method === "ui/request-display-mode") {
        result = { mode: message.params?.mode || "fullscreen" };
      } else if (message.method === "ui/message") {
        result = {};
      } else if (message.method === "tools/call") {
        result = { content: [] };
      }
      queueMicrotask(() => dispatchHostMessage({ jsonrpc: "2.0", id: message.id, result }));
    }
  };
  window.parent = hostWindow;

  return {
    TestCustomEvent,
    document,
    records,
    statusEl,
    window,
    dispatchOpenAiGlobals(globals) {
      records.openaiGlobalEvents.push(globals);
      window.dispatchEvent(new TestCustomEvent("openai:set_globals", { detail: { globals } }));
    },
    sendToolResult(widgetData) {
      dispatchHostMessage({
        jsonrpc: "2.0",
        method: "ui/notifications/tool-result",
        params: {
          content: [],
          structuredContent: { status: "opening" },
          _meta: { widgetData }
        }
      });
    }
  };
}

function installWidgetBridgeGlobals(environment) {
  const keys = [
    "window",
    "document",
    "CustomEvent",
    "ResizeObserver",
    "requestAnimationFrame",
    "cancelAnimationFrame"
  ];
  const originals = new Map(keys.map((key) => [key, globalThis[key]]));
  globalThis.window = environment.window;
  globalThis.document = environment.document;
  globalThis.CustomEvent = environment.TestCustomEvent;
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    disconnect() {}
  };
  globalThis.requestAnimationFrame = environment.window.requestAnimationFrame;
  globalThis.cancelAnimationFrame = environment.window.cancelAnimationFrame;
  return () => {
    for (const [key, value] of originals) {
      if (value === undefined) delete globalThis[key];
      else globalThis[key] = value;
    }
  };
}

async function closeWidgetBridgeEnvironment(environment) {
  try {
    await environment.window.__CANVASIGHT_MCP_APP__?.close();
  } catch {
    // The transport may already be closed after an initialization failure.
  }
}

async function assertWidgetBootstrapContracts(widgetHtml) {
  assert.match(widgetHtml, /id="canvasightAppModule"\s+type="module"/);
  assert.match(widgetHtml, /Starting Canvasight\.\.\./);
  assert.doesNotMatch(widgetHtml, /canvasightAppBundleSource/);
  assert.doesNotMatch(widgetHtml, /canvasightMcpHostBridge/);

  const vite = await import("vite");
  const viteServer = await vite.createServer({
    root: pluginRoot,
    server: { middlewareMode: true },
    appType: "custom",
    logLevel: "silent"
  });
  const originalConsoleDebug = console.debug;
  console.debug = () => {};

  try {
    const standard = createWidgetBridgeEnvironment();
    let restore = installWidgetBridgeGlobals(standard);
    const bridgeModule = await viteServer.ssrLoadModule("/src/lib/widgetBridge.ts");
    bridgeModule.startCanvasightWidgetBridge();
    await waitForCondition(
      () => standard.records.appMessages.some((message) => message.method === "ui/notifications/initialized"),
      "real MCP Apps postMessage initialization"
    );
    assert.equal(standard.records.appMessages.some((message) => message.method === "ui/initialize"), true);
    standard.sendToolResult({
      status: "opened",
      bindingIssuedAt: 1_000,
      openAttemptId: "open-postmessage",
      sessionId: "session-postmessage",
      token: "token-postmessage",
      url: "http://127.0.0.1:54321/?sessionId=session-postmessage&token=token-postmessage"
    });
    await waitForCondition(
      () => standard.window.__CANVASIGHT_WIDGET_DATA__?.sessionId === "session-postmessage",
      "ui/notifications/tool-result widget data"
    );
    assert.equal(standard.window.__CANVASIGHT_WIDGET_DATA__.token, "token-postmessage");
    assert.equal(standard.window.__CANVASIGHT_WIDGET_DATA__.bindingIssuedAt, 1_000);
    assert.match(standard.statusEl.textContent, /Connecting Canvasight session/);
    standard.window.dispatchEvent({ type: "load" });
    assert.match(standard.statusEl.textContent, /Connecting Canvasight session/);
    standard.window.dispatchEvent(new standard.TestCustomEvent("canvasight:app-ready", { detail: { status: "ready" } }));
    assert.equal(standard.statusEl.textContent, "");
    assert.equal(standard.window.canvasightMcp.getBridgeState().startupStage, "ready");
    standard.sendToolResult({
      status: "opened",
      bindingIssuedAt: 1_000,
      openAttemptId: "open-postmessage",
      sessionId: "session-postmessage",
      token: "token-postmessage",
      url: "http://127.0.0.1:54321/?sessionId=session-postmessage&token=token-postmessage"
    });
    standard.dispatchOpenAiGlobals({
      toolResponseMetadata: {
        widgetData: {
          status: "opened",
          bindingIssuedAt: 1_000,
          openAttemptId: "open-postmessage",
          sessionId: "session-postmessage",
          token: "token-postmessage",
          url: "http://127.0.0.1:54321/?sessionId=session-postmessage&token=token-postmessage"
        }
      }
    });
    assert.equal(standard.window.canvasightMcp.getBridgeState().startupStage, "ready", "late metadata cannot regress ready");
    assert.equal(standard.statusEl.textContent, "", "late metadata cannot restore the Connecting overlay");

    const rebindEvents = [];
    standard.window.addEventListener("canvasight:widget-rebind", (event) => rebindEvents.push(event.detail));
    standard.sendToolResult({
      status: "opened",
      bindingIssuedAt: 999,
      openAttemptId: "open-stale",
      sessionId: "session-stale",
      token: "token-stale",
      url: "http://127.0.0.1:54321/?sessionId=session-stale&token=token-stale"
    });
    assert.equal(standard.window.__CANVASIGHT_WIDGET_DATA__.sessionId, "session-postmessage", "an older binding cannot replace the active widget session");
    assert.equal(rebindEvents.length, 0, "an older binding cannot trigger a React rebind");

    standard.sendToolResult({
      status: "opened",
      bindingIssuedAt: 2_000,
      openAttemptId: "open-rebound",
      sessionId: "session-rebound",
      token: "token-rebound",
      url: "http://127.0.0.1:54321/?sessionId=session-rebound&token=token-rebound"
    });
    await waitForCondition(
      () => standard.window.__CANVASIGHT_WIDGET_DATA__?.sessionId === "session-rebound",
      "mounted widget accepting a newer binding"
    );
    assert.equal(standard.window.__CANVASIGHT_WIDGET_DATA__.openAttemptId, "open-rebound");
    assert.equal(standard.window.__CANVASIGHT_WIDGET_DATA__.widgetInstanceId, standard.window.canvasightMcp.getBridgeState().widgetInstanceId);
    assert.equal(rebindEvents.length, 1, "a newer binding triggers exactly one React rebind");
    assert.equal(rebindEvents[0].previous.openAttemptId, "open-postmessage");
    assert.equal(rebindEvents[0].current.openAttemptId, "open-rebound");
    assert.equal(standard.window.canvasightMcp.getBridgeState().startupStage, "connecting_session", "a newer binding starts a fresh monotonic startup lifecycle");

    standard.sendToolResult({
      status: "opened",
      bindingIssuedAt: 2_000,
      openAttemptId: "open-rebound",
      sessionId: "session-rebound",
      token: "token-rebound-duplicate",
      url: "http://127.0.0.1:54321/?sessionId=session-rebound&token=token-rebound-duplicate"
    });
    await waitForCondition(
      () => standard.window.__CANVASIGHT_WIDGET_DATA__?.token === "token-rebound-duplicate",
      "duplicate active binding metadata merge"
    );
    assert.equal(rebindEvents.length, 1, "duplicate metadata for the active binding does not remount React");
    assert.equal(standard.window.canvasightMcp.getBridgeState().startupStage, "connecting_session");
    assert.equal(standard.window.__CANVASIGHT_WIDGET_DATA__.token, "token-rebound-duplicate", "duplicate metadata may merge refreshed private session data");

    standard.window.dispatchEvent(new standard.TestCustomEvent("canvasight:app-ready", {
      detail: { bindingKey: "session-postmessage:open-postmessage:1000" }
    }));
    assert.equal(
      standard.window.canvasightMcp.getBridgeState().startupStage,
      "connecting_session",
      "an old App async completion cannot mark the newer binding ready"
    );
    standard.window.dispatchEvent(new standard.TestCustomEvent("canvasight:app-ready", {
      detail: { bindingKey: "session-rebound:open-rebound:2000" }
    }));
    assert.equal(standard.window.canvasightMcp.getBridgeState().startupStage, "ready", "the active binding can complete startup");
    await closeWidgetBridgeEnvironment(standard);
    restore();

    const openaiCompat = createWidgetBridgeEnvironment();
    restore = installWidgetBridgeGlobals(openaiCompat);
    bridgeModule.startCanvasightWidgetBridge();
    await waitForCondition(
      () => openaiCompat.records.appMessages.some((message) => message.method === "ui/notifications/initialized"),
      "OpenAI compatibility harness MCP initialization"
    );
    assert.equal(openaiCompat.window.openai.toolResponseMetadata, undefined);
    openaiCompat.dispatchOpenAiGlobals({
      sendFollowUpMessage: async () => ({ ok: true }),
      toolOutput: { status: "opened" },
      toolResponseMetadata: {
        widgetData: {
          status: "opened",
          openAttemptId: "open-openai-event",
          sessionId: "session-openai-event",
          token: "token-openai-event",
          browserUrl: "http://127.0.0.1:54321/?sessionId=session-openai-event&token=token-openai-event"
        }
      }
    });
    await waitForCondition(
      () => openaiCompat.window.__CANVASIGHT_WIDGET_DATA__?.sessionId === "session-openai-event",
      "openai:set_globals event.detail.globals widget data"
    );
    assert.equal(openaiCompat.window.__CANVASIGHT_WIDGET_DATA__.token, "token-openai-event");
    assert.equal(openaiCompat.window.canvasightMcp.getBridgeState().openaiFollowUpAvailable, true);
    await closeWidgetBridgeEnvironment(openaiCompat);
    restore();

    const compatOnly = createWidgetBridgeEnvironment({ initializeError: true, bootstrapTimeoutMs: 1_000 });
    compatOnly.window.openai.sendFollowUpMessage = async (message) => {
      compatOnly.records.compatPrompts.push(message);
      return { ok: true };
    };
    compatOnly.window.__CANVASIGHT_WIDGET_MODE__ = "framework-questions";
    restore = installWidgetBridgeGlobals(compatOnly);
    bridgeModule.startCanvasightWidgetBridge();
    await waitForCondition(
      () => compatOnly.records.appMessages.some((message) => message.method === "ui/initialize") &&
        compatOnly.window.canvasightMcp?.getBridgeState().mcpInitialized === false &&
        compatOnly.window.canvasightMcp?.getBridgeState().openaiFollowUpAvailable === true,
      "OpenAI compatibility-only MCP failure"
    );
    await compatOnly.window.canvasightMcp.sendFollowUpMessage({ prompt: "Canvasight framework compatibility fallback" });
    assert.deepEqual(compatOnly.records.compatPrompts, [{
      prompt: "Canvasight framework compatibility fallback",
      scrollToBottom: true
    }]);
    assert.equal(compatOnly.window.canvasightMcp.getBridgeState().bridgeTransport, "openai_compat_followup");
    await closeWidgetBridgeEnvironment(compatOnly);
    restore();

    const openaiDirectDetail = createWidgetBridgeEnvironment();
    restore = installWidgetBridgeGlobals(openaiDirectDetail);
    bridgeModule.startCanvasightWidgetBridge();
    await waitForCondition(
      () => openaiDirectDetail.records.appMessages.some((message) => message.method === "ui/notifications/initialized"),
      "OpenAI direct-detail harness MCP initialization"
    );
    openaiDirectDetail.window.dispatchEvent(
      new openaiDirectDetail.TestCustomEvent("openai:set_globals", {
        detail: {
          toolOutput: { status: "opened" },
          toolResponseMetadata: {
            widgetData: {
              status: "opened",
              openAttemptId: "open-openai-direct-detail",
              sessionId: "session-openai-direct-detail",
              token: "token-openai-direct-detail",
              browserUrl: "http://127.0.0.1:54321/?sessionId=session-openai-direct-detail&token=token-openai-direct-detail"
            }
          }
        }
      })
    );
    await waitForCondition(
      () => openaiDirectDetail.window.__CANVASIGHT_WIDGET_DATA__?.sessionId === "session-openai-direct-detail",
      "openai:set_globals direct event.detail widget data"
    );
    await closeWidgetBridgeEnvironment(openaiDirectDetail);
    restore();

    const terminalFailure = createWidgetBridgeEnvironment();
    restore = installWidgetBridgeGlobals(terminalFailure);
    bridgeModule.startCanvasightWidgetBridge();
    await waitForCondition(
      () => terminalFailure.records.appMessages.some((message) => message.method === "ui/notifications/initialized"),
      "terminal failure harness MCP initialization"
    );
    terminalFailure.sendToolResult({
      status: "opened",
      openAttemptId: "open-failed",
      sessionId: "session-failed",
      token: "token-failed",
      url: "http://127.0.0.1:54321/?sessionId=session-failed&token=token-failed"
    });
    terminalFailure.window.dispatchEvent(new terminalFailure.TestCustomEvent("canvasight:app-error", { detail: { error: "boom" } }));
    terminalFailure.window.dispatchEvent(new terminalFailure.TestCustomEvent("canvasight:app-ready", { detail: { status: "ready" } }));
    terminalFailure.sendToolResult({
      status: "opened",
      openAttemptId: "open-failed",
      sessionId: "session-failed",
      token: "token-failed",
      url: "http://127.0.0.1:54321/?sessionId=session-failed&token=token-failed"
    });
    assert.equal(terminalFailure.window.canvasightMcp.getBridgeState().startupStage, "failed", "late ready/metadata cannot escape failed");
    assert.equal(terminalFailure.statusEl.dataset.tone, "error");
    await closeWidgetBridgeEnvironment(terminalFailure);
    restore();

    const missingMetadata = createWidgetBridgeEnvironment({ bootstrapTimeoutMs: 25 });
    restore = installWidgetBridgeGlobals(missingMetadata);
    bridgeModule.startCanvasightWidgetBridge();
    await waitForCondition(
      () => missingMetadata.records.appMessages.some((message) => message.method === "ui/notifications/initialized"),
      "missing metadata harness MCP initialization"
    );
    await waitForCondition(
      () => /Canvasight session metadata timed out/.test(missingMetadata.statusEl.textContent),
      "visible widget metadata timeout"
    );
    assert.equal(missingMetadata.statusEl.dataset.tone, "error");
    assert.equal(missingMetadata.window.__CANVASIGHT_BRIDGE_STATE__.reason, "widget_metadata_timeout");
    await closeWidgetBridgeEnvironment(missingMetadata);
    restore();
  } finally {
    console.debug = originalConsoleDebug;
    await viteServer.close();
  }
}

function assertUniqueNodePositions(nodes, label) {
  const seen = new Set();
  for (const node of nodes) {
    const key = `${node.position?.x},${node.position?.y}`;
    assert.equal(seen.has(key), false, `${label} has overlapping node coordinates at ${key}`);
    seen.add(key);
  }
}

function assertNoNodeBoundsOverlap(nodes, label) {
  nodes.forEach((node, index) => {
    const width = node.width || 400;
    const height = node.height || 220;
    const left = node.position.x;
    const top = node.position.y;
    nodes.slice(index + 1).forEach((other) => {
      const separated =
        left + width <= other.position.x ||
        other.position.x + (other.width || 400) <= left ||
        top + height <= other.position.y ||
        other.position.y + (other.height || 220) <= top;
      assert.equal(separated, true, `${label} has overlapping bounds: ${node.id} and ${other.id}`);
    });
  });
}

function assertHorizontalEdgeDirection(nodes, edges, label) {
  const byId = new Map(nodes.map((node) => [node.id, node]));
  edges.forEach((edge) => {
    const source = byId.get(edge.source);
    const target = byId.get(edge.target);
    assert.equal(target.position.x >= source.position.x + (source.width || 400), true, `${label} has a non-forward edge: ${edge.source} -> ${edge.target}`);
  });
}

function minimalRefineManifest(output, nodeIds, edges, relationshipType = "containment") {
  return {
    intent: "refine",
    primaryDomain: "task-execution",
    secondaryDomains: [],
    maturity: "deliver",
    output,
    coverage: {
      "task.currentEvidence": nodeIds,
      "maturity.deliver.acceptance": nodeIds
    },
    semanticStructure: Object.fromEntries(
      nodeIds.map((nodeId) => [
        nodeId,
        {
          responsibility: `Own the distinct ${nodeId} responsibility.`,
          inseparableReason: `The content recorded by ${nodeId} produces one coherent result.`
        }
      ])
    ),
    semanticRelationships: Object.fromEntries(
      edges.map((edge) => [
        edge.id,
        {
          type: relationshipType,
          rationale: `${edge.source} organizes the distinct responsibility owned by ${edge.target}.`
        }
      ])
    )
  };
}

function nodeSkillManifest(nodeId, assignment) {
  return {
    ...minimalRefineManifest("execution-plan", [nodeId], []),
    skillAssignments: {
      [nodeId]: [assignment]
    }
  };
}

function skillLedManifest(nodeId) {
  return {
    intent: "create",
    primaryDomain: "software-product",
    secondaryDomains: [],
    maturity: "deliver",
    output: "structured-outline",
    contentMode: "skill-led",
    contentSkills: [{ name: "pdf", role: "primary" }],
    coverage: {
      "professional.pdf.structure": [nodeId]
    },
    semanticStructure: {
      [nodeId]: {
        responsibility: "Define the professional PDF content structure.",
        inseparableReason: "The node produces one coherent professional content outline."
      }
    },
    semanticRelationships: {}
  };
}

async function assertSkillAssignmentAndContentModeContracts(origin) {
  await fetchJson(`${origin}/api/preferences`, {
    method: "POST",
    body: JSON.stringify({ aiSkillAssignmentEnabled: false })
  });
  const disabledContext = await request("tools/call", {
    name: "get_canvasight_graph_context",
    arguments: { projectPath: path.join(tempRoot, "skill-context-project") }
  });
  assert.deepEqual(disabledContext.structuredContent.preferences, { aiSkillAssignmentEnabled: false });

  const userExplicitProject = path.join(tempRoot, "skill-user-explicit-project");
  const userExplicit = await request("tools/call", {
    name: "write_canvasight_graph",
    arguments: {
      projectPath: userExplicitProject,
      graphType: "task-plan",
      pageName: "User explicit Skill",
      frameworkManifest: nodeSkillManifest("explicit-node", {
        name: "pdf",
        source: "user-explicit"
      }),
      nodes: [{ id: "explicit-node", title: "Create PDF", body: "$pdf Create and verify the final PDF layout." }],
      edges: []
    }
  });
  assert.equal(userExplicit.structuredContent.status, "written");

  const aiDisabled = await request("tools/call", {
    name: "write_canvasight_graph",
    arguments: {
      projectPath: path.join(tempRoot, "skill-ai-disabled-project"),
      graphType: "task-plan",
      pageName: "AI Skill disabled",
      frameworkManifest: nodeSkillManifest("ai-node", {
        name: "pdf",
        source: "ai-selected",
        rationale: "The node produces a PDF and the Skill description specifically covers PDF creation and rendered verification."
      }),
      nodes: [{ id: "ai-node", title: "Create PDF", body: "$pdf Create and verify the final PDF layout." }],
      edges: []
    }
  });
  assert.equal(aiDisabled.structuredContent.status, "validation_failed");
  assert.equal(aiDisabled.structuredContent.validation.violations.some((item) => item.code === "ai_skill_assignment_disabled"), true);

  await fetchJson(`${origin}/api/preferences`, {
    method: "POST",
    body: JSON.stringify({ aiSkillAssignmentEnabled: true })
  });
  const enabledContext = await request("tools/call", {
    name: "get_canvasight_graph_context",
    arguments: { projectPath: path.join(tempRoot, "another-skill-context-project") }
  });
  assert.deepEqual(enabledContext.structuredContent.preferences, { aiSkillAssignmentEnabled: true });

  const missingRationale = await request("tools/call", {
    name: "write_canvasight_graph",
    arguments: {
      projectPath: path.join(tempRoot, "skill-ai-missing-rationale-project"),
      frameworkManifest: nodeSkillManifest("missing-rationale", { name: "pdf", source: "ai-selected" }),
      nodes: [{ id: "missing-rationale", title: "Create PDF", body: "$pdf Create the final PDF." }],
      edges: []
    }
  });
  assert.equal(missingRationale.structuredContent.status, "validation_failed");
  assert.equal(missingRationale.structuredContent.validation.violations.some((item) => item.code === "ai_skill_assignment_rationale_required"), true);

  const bodyMismatch = await request("tools/call", {
    name: "write_canvasight_graph",
    arguments: {
      projectPath: path.join(tempRoot, "skill-ai-body-mismatch-project"),
      frameworkManifest: nodeSkillManifest("body-mismatch", {
        name: "pdf",
        source: "ai-selected",
        rationale: "The node is responsible for PDF creation and rendered verification."
      }),
      nodes: [{ id: "body-mismatch", title: "Create PDF", body: "Create the final PDF without a visible assignment token." }],
      edges: []
    }
  });
  assert.equal(bodyMismatch.structuredContent.status, "validation_failed");
  assert.equal(bodyMismatch.structuredContent.validation.violations.some((item) => item.code === "skill_assignment_body_mismatch"), true);

  const missingNode = await request("tools/call", {
    name: "write_canvasight_graph",
    arguments: {
      projectPath: path.join(tempRoot, "skill-ai-missing-node-project"),
      frameworkManifest: {
        ...minimalRefineManifest("execution-plan", ["actual-node"], []),
        skillAssignments: {
          "missing-node": [{
            name: "pdf",
            source: "ai-selected",
            rationale: "The missing node would have owned PDF generation."
          }]
        }
      },
      nodes: [{ id: "actual-node", title: "Actual node", body: "Own the actual executable responsibility." }],
      edges: []
    }
  });
  assert.equal(missingNode.structuredContent.status, "validation_failed");
  assert.equal(missingNode.structuredContent.validation.violations.some((item) => item.code === "skill_assignment_node_not_found"), true);

  const aiEnabled = await request("tools/call", {
    name: "write_canvasight_graph",
    arguments: {
      projectPath: path.join(tempRoot, "skill-ai-enabled-project"),
      frameworkManifest: nodeSkillManifest("enabled-node", {
        name: "pdf",
        source: "ai-selected",
        rationale: "This node creates and visually verifies a PDF, exactly matching the enabled PDF Skill description."
      }),
      nodes: [{ id: "enabled-node", title: "Create PDF", body: "$pdf Create and visually verify the final PDF." }],
      edges: []
    }
  });
  assert.equal(aiEnabled.structuredContent.status, "written");
  assert.match(aiEnabled.structuredContent.document.nodes[0].data.body, /^\$pdf /);

  const skillLedProject = path.join(tempRoot, "skill-led-content-project");
  const skillLed = await request("tools/call", {
    name: "write_canvasight_graph",
    arguments: {
      projectPath: skillLedProject,
      graphType: "software-product",
      pageName: "Professional content",
      frameworkManifest: skillLedManifest("professional-node"),
      nodes: [{ id: "professional-node", title: "Professional PDF outline", body: "Define the PDF narrative, page structure, and rendered acceptance evidence." }],
      edges: []
    }
  });
  assert.equal(skillLed.structuredContent.status, "written");
  assert.deepEqual(skillLed.structuredContent.nodeIds, ["professional-node"]);
  assert.deepEqual(skillLed.structuredContent.projectGuidanceNodes, []);

  const uncoveredSkillLed = await request("tools/call", {
    name: "write_canvasight_graph",
    arguments: {
      projectPath: path.join(tempRoot, "skill-led-uncovered-project"),
      graphType: "software-product",
      frameworkManifest: {
        ...skillLedManifest("covered-node"),
        coverage: { "professional.pdf.structure": ["covered-node"] },
        semanticStructure: {
          ...skillLedManifest("covered-node").semanticStructure,
          "uncovered-node": {
            responsibility: "Own the uncovered professional content.",
            inseparableReason: "This is one coherent responsibility."
          }
        }
      },
      nodes: [
        { id: "covered-node", title: "Covered", body: "Define the covered PDF content structure." },
        { id: "uncovered-node", title: "Uncovered", body: "Define another professional content responsibility." }
      ],
      edges: []
    }
  });
  assert.equal(uncoveredSkillLed.structuredContent.status, "validation_failed");
  assert.equal(uncoveredSkillLed.structuredContent.validation.violations.some((item) => item.code === "skill_led_node_coverage_missing"), true);

  await fetchJson(`${origin}/api/preferences`, {
    method: "POST",
    body: JSON.stringify({ aiSkillAssignmentEnabled: false })
  });
}

async function assertUniversalHorizontalAndBlueprintTopologyContracts() {
  const frameworkCases = [
    ["software-product", "exploration-map"],
    ["article-outline", "structured-outline"],
    ["codebase-structure", "system-map"],
    ["task-plan", "decision-map"],
    ["general", "execution-plan"]
  ];
  for (const [graphType, output] of frameworkCases) {
    const projectPath = path.join(tempRoot, `horizontal-${graphType}-${output}`);
    const nodeIds = [`${graphType}-root`, `${graphType}-left`, `${graphType}-right`];
    const edges = [
      { id: `${graphType}-root-left`, source: nodeIds[0], target: nodeIds[1] },
      { id: `${graphType}-root-right`, source: nodeIds[0], target: nodeIds[2] }
    ];
    const written = await request("tools/call", {
      name: "write_canvasight_graph",
      arguments: {
        projectPath,
        graphType,
        pageName: `${graphType} ${output}`,
        frameworkManifest: minimalRefineManifest(output, nodeIds, edges),
        nodes: nodeIds.map((id) => ({ id, title: id, body: `Substantive canvas responsibility for ${id}.` })),
        edges
      }
    });
    assert.equal(written.structuredContent.status, "written", `${graphType}/${output} should write`);
    const nodes = written.structuredContent.document.nodes;
    assertUniqueNodePositions(nodes, `${graphType}/${output}`);
    assertNoNodeBoundsOverlap(nodes, `${graphType}/${output}`);
    assertHorizontalEdgeDirection(nodes, written.structuredContent.document.edges, `${graphType}/${output}`);
  }

  const blueprintTitles = [
    "品牌定位", "目标用户", "品牌价值", "视觉语言", "体验原则", "信息架构",
    "首页叙事", "商品列表", "商品筛选", "商品详情", "尺码与库存", "购物袋",
    "结账流程", "支付恢复", "响应式体验", "无障碍标准", "验收标准", "交付计划"
  ];
  const blueprintNodes = blueprintTitles.map((title, index) => ({
    id: `blueprint-${index + 1}`,
    title,
    body: `${title}负责服装品牌网站中可独立评审和交付的一项产品或体验决策。`
  }));
  const chainEdges = blueprintNodes.slice(1).map((node, index) => ({
    id: `blueprint-chain-${index + 1}`,
    source: blueprintNodes[index].id,
    target: node.id
  }));
  const blueprintManifest = (edges) => ({
    intent: "refine",
    primaryDomain: "ux-design",
    secondaryDomains: ["software-product"],
    maturity: "define",
    output: "exploration-map",
    coverage: {
      "ux.goal": blueprintNodes.map((node) => node.id),
      "product.goal": [blueprintNodes[0].id],
      "maturity.define.boundaries": blueprintNodes.map((node) => node.id)
    },
    semanticStructure: Object.fromEntries(
      blueprintNodes.map((node) => [
        node.id,
        {
          responsibility: `Define ${node.data?.title || node.title} as one independently reviewable blueprint responsibility.`,
          inseparableReason: "The statements inside this node jointly define one product or experience decision."
        }
      ])
    ),
    semanticRelationships: Object.fromEntries(
      edges.map((edge) => [
        edge.id,
        {
          type: "containment",
          rationale: `${edge.source} groups the distinct blueprint responsibility ${edge.target}.`
        }
      ])
    )
  });
  const chainProjectPath = path.join(tempRoot, "product-ux-blueprint-chain-regression");
  const rejectedChain = await request("tools/call", {
    name: "write_canvasight_graph",
    arguments: {
      projectPath: chainProjectPath,
      graphType: "software-product",
      pageName: "Mechanical 18-node blueprint",
      frameworkManifest: blueprintManifest(chainEdges),
      nodes: blueprintNodes,
      edges: chainEdges
    }
  });
  assert.equal(rejectedChain.structuredContent.status, "validation_failed");
  assert.equal(rejectedChain.structuredContent.validation.violations.some((item) => item.code === "mechanical_single_path"), true);

  const branchParents = [null, 0, 0, 0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6];
  const branchEdges = blueprintNodes.slice(1).map((node, index) => ({
    id: `blueprint-branch-${index + 1}`,
    source: blueprintNodes[branchParents[index + 1]].id,
    target: node.id
  }));
  const writtenBranches = await request("tools/call", {
    name: "write_canvasight_graph",
    arguments: {
      projectPath: chainProjectPath,
      graphType: "software-product",
      pageName: "Branched 18-node blueprint",
      frameworkManifest: blueprintManifest(branchEdges),
      nodes: blueprintNodes,
      edges: branchEdges
    }
  });
  assert.equal(writtenBranches.structuredContent.status, "written");
  assertNoNodeBoundsOverlap(writtenBranches.structuredContent.document.nodes, "Branched 18-node blueprint");
  assertHorizontalEdgeDirection(
    writtenBranches.structuredContent.document.nodes,
    writtenBranches.structuredContent.document.edges,
    "Branched 18-node blueprint"
  );
}

async function assertGraphContextMergeAndValidationContracts() {
  const mergeProjectPath = path.join(tempRoot, "graph-merge-validation-project");
  await fsp.mkdir(mergeProjectPath, { recursive: true });

  const legacyAppend = await request("tools/call", {
    name: "write_canvasight_graph",
    arguments: {
      projectPath: mergeProjectPath,
      pageName: "Editable current page",
      layoutPolicy: "preserve-explicit",
      nodes: [
        {
          id: "merge-root",
          title: "Execution goal",
          body: "Turn the accepted plan into a verified delivery without changing unrelated canvas content.",
          position: { x: 100, y: 120 }
        },
        {
          id: "merge-keep",
          title: "Current evidence",
          body: "The active page already contains evidence that must remain in place while the branch is refined.",
          position: { x: 780, y: 120 }
        },
        {
          id: "merge-prune",
          title: "Obsolete branch",
          body: "This branch is intentionally removed to verify cascading edge cleanup.",
          position: { x: 780, y: 500 }
        },
        {
          id: "merge-detach",
          title: "Independent evidence",
          body: "This node remains while its obsolete relationship is removed explicitly.",
          position: { x: 1460, y: 120 }
        }
      ],
      edges: [
        { id: "merge-root-keep", source: "merge-root", target: "merge-keep", label: "supports" },
        { id: "merge-root-prune", source: "merge-root", target: "merge-prune", label: "remove branch" },
        { id: "merge-root-detach", source: "merge-root", target: "merge-detach", label: "remove relation" }
      ]
    }
  });
  assert.equal(legacyAppend.structuredContent.status, "written");

  const context = await request("tools/call", {
    name: "get_canvasight_graph_context",
    arguments: { projectPath: mergeProjectPath }
  });
  assert.equal(context.structuredContent.status, "ok");
  assert.equal(context.structuredContent.projectPath, mergeProjectPath);
  assert.equal(context.structuredContent.documentRevision, legacyAppend.structuredContent.documentRevision);
  assert.equal(context.structuredContent.activePage.name, "Editable current page");
  assert.deepEqual(
    context.structuredContent.activePage.nodes.map((node) => node.id),
    ["merge-root", "merge-keep", "merge-prune", "merge-detach"]
  );
  assert.deepEqual(context.structuredContent.activePage.nodes[0].position, { x: 100, y: 120 });
  assert.match(context.structuredContent.activePage.nodes[0].bodyPreview, /accepted plan/);
  assert.deepEqual(
    context.structuredContent.activePage.edges.map((edge) => edge.id),
    ["merge-root-keep", "merge-root-prune", "merge-root-detach"]
  );
  assert.equal(context.structuredContent.pages.filter((page) => page.active).length, 1);
  assert.equal(context.structuredContent.pages.find((page) => page.active).nodeCount, 4);

  const scatterPath = path.join(mergeProjectPath, ".scatter", "scatter.json");
  const beforeRejectedWrite = await fsp.readFile(scatterPath, "utf8");
  const staleMerge = await request("tools/call", {
    name: "write_canvasight_graph",
    arguments: {
      projectPath: mergeProjectPath,
      mode: "merge-active-page",
      expectedRevision: context.structuredContent.documentRevision - 1,
      operations: [
        {
          op: "update-node",
          nodeId: "merge-keep",
          changes: { body: "This stale edit must never be written." }
        }
      ]
    }
  });
  assert.equal(staleMerge.structuredContent.status, "validation_failed");
  assert.equal(staleMerge.structuredContent.written, false);
  assert.equal(staleMerge.structuredContent.validation.passed, false);
  assert.equal(staleMerge.structuredContent.validation.violations.some((item) => item.code === "stale_document"), true);
  assert.equal(await fsp.readFile(scatterPath, "utf8"), beforeRejectedWrite);

  const incompleteFramework = {
    intent: "execute",
    primaryDomain: "task-execution",
    secondaryDomains: [],
    maturity: "deliver",
    output: "execution-plan",
    coverage: {
      "task.goalDone": ["merge-root"]
    },
    semanticStructure: {
      "merge-root": { responsibility: "Define the accepted execution outcome.", inseparableReason: "The goal and done condition describe the same outcome." }
    },
    semanticRelationships: {}
  };
  const incompleteMerge = await request("tools/call", {
    name: "write_canvasight_graph",
    arguments: {
      projectPath: mergeProjectPath,
      mode: "merge-active-page",
      expectedRevision: context.structuredContent.documentRevision,
      frameworkManifest: incompleteFramework,
      operations: [
        {
          op: "update-node",
          nodeId: "merge-keep",
          changes: { body: "This incomplete candidate must not be written before coverage is repaired." }
        }
      ]
    }
  });
  assert.equal(incompleteMerge.structuredContent.status, "validation_failed");
  assert.equal(incompleteMerge.structuredContent.written, false);
  assert.equal(incompleteMerge.structuredContent.validation.passed, false);
  assert.equal(incompleteMerge.structuredContent.validation.violations.some((item) => item.code === "missing_coverage"), true);
  assert.equal(
    incompleteMerge.structuredContent.validation.violations.every(
      (item) => typeof item.path === "string" && typeof item.message === "string" && typeof item.repair === "string"
    ),
    true
  );
  assert.equal(await fsp.readFile(scatterPath, "utf8"), beforeRejectedWrite);
  const contextAfterRejectedWrites = await request("tools/call", {
    name: "get_canvasight_graph_context",
    arguments: { projectPath: mergeProjectPath }
  });
  assert.equal(contextAfterRejectedWrites.structuredContent.documentRevision, context.structuredContent.documentRevision);
  assert.equal(contextAfterRejectedWrites.structuredContent.activePage.nodes[1].bodyPreview.includes("incomplete candidate"), false);

  const missingSemanticReview = await request("tools/call", {
    name: "write_canvasight_graph",
    arguments: {
      projectPath: mergeProjectPath,
      mode: "merge-active-page",
      expectedRevision: context.structuredContent.documentRevision,
      frameworkManifest: {
        intent: "refine",
        primaryDomain: "task-execution",
        maturity: "deliver",
        output: "execution-plan",
        coverage: {
          "task.currentEvidence": ["merge-keep"],
          "maturity.deliver.acceptance": ["merge-keep"]
        }
      },
      operations: [{ op: "update-node", nodeId: "merge-keep", changes: { title: "Unreviewed semantic change" } }]
    }
  });
  assert.equal(missingSemanticReview.structuredContent.status, "validation_failed");
  assert.equal(missingSemanticReview.structuredContent.validation.violations.some((item) => item.code === "mixed_responsibilities"), true);
  assert.equal(await fsp.readFile(scatterPath, "utf8"), beforeRejectedWrite);

  const mechanicalSinglePath = await request("tools/call", {
    name: "write_canvasight_graph",
    arguments: {
      projectPath: mergeProjectPath,
      pageName: "Rejected mechanical outline",
      frameworkManifest: {
        intent: "refine",
        primaryDomain: "task-execution",
        secondaryDomains: [],
        maturity: "deliver",
        output: "exploration-map",
        coverage: {
          "task.currentEvidence": ["path-a", "path-b", "path-c"],
          "maturity.deliver.acceptance": ["path-a", "path-b", "path-c"]
        },
        semanticStructure: {
          "path-a": { responsibility: "Frame the product question.", inseparableReason: "The framing is one decision boundary." },
          "path-b": { responsibility: "Compare the experience options.", inseparableReason: "The comparison produces one choice." },
          "path-c": { responsibility: "Record acceptance evidence.", inseparableReason: "The evidence qualifies one accepted result." }
        },
        semanticRelationships: {
          "path-a-b": { type: "decision", rationale: "The framing informs the option comparison." },
          "path-b-c": { type: "evidence", rationale: "The selected option requires acceptance evidence." }
        }
      },
      nodes: [
        { id: "path-a", title: "Frame question", body: "Define the product question and its decision boundary." },
        { id: "path-b", title: "Compare options", body: "Compare distinct experience directions against the boundary." },
        { id: "path-c", title: "Acceptance evidence", body: "Record the evidence needed to accept the selected direction." }
      ],
      edges: [
        { id: "path-a-b", source: "path-a", target: "path-b" },
        { id: "path-b-c", source: "path-b", target: "path-c" }
      ]
    }
  });
  assert.equal(mechanicalSinglePath.structuredContent.status, "validation_failed");
  assert.equal(mechanicalSinglePath.structuredContent.validation.violations.some((item) => item.code === "mechanical_single_path"), true);
  assert.equal(await fsp.readFile(scatterPath, "utf8"), beforeRejectedWrite);

  const sequenceProjectPath = path.join(tempRoot, "semantic-sequence-project");
  const allowedExecutionSequence = await request("tools/call", {
    name: "write_canvasight_graph",
    arguments: {
      projectPath: sequenceProjectPath,
      pageName: "Accepted execution sequence",
      frameworkManifest: {
        intent: "refine",
        primaryDomain: "task-execution",
        secondaryDomains: [],
        maturity: "deliver",
        output: "execution-plan",
        coverage: {
          "task.currentEvidence": ["sequence-a", "sequence-b", "sequence-c"],
          "maturity.deliver.acceptance": ["sequence-a", "sequence-b", "sequence-c"]
        },
        semanticStructure: {
          "sequence-a": { responsibility: "Prepare the delivery input.", inseparableReason: "Preparation produces one ready input." },
          "sequence-b": { responsibility: "Execute the delivery step.", inseparableReason: "Execution produces one deliverable." },
          "sequence-c": { responsibility: "Verify the delivered result.", inseparableReason: "Verification produces one acceptance result." }
        },
        semanticRelationships: {
          "sequence-a-b": { type: "sequence", rationale: "Execution starts after its input is prepared." },
          "sequence-b-c": { type: "dependency", rationale: "Acceptance evidence depends on the delivered result." }
        }
      },
      nodes: [
        { id: "sequence-a", title: "Prepare", body: "Prepare the accepted delivery input." },
        { id: "sequence-b", title: "Execute", body: "Execute the delivery against the accepted input." },
        { id: "sequence-c", title: "Verify", body: "Verify the delivered result against acceptance." }
      ],
      edges: [
        { id: "sequence-a-b", source: "sequence-a", target: "sequence-b" },
        { id: "sequence-b-c", source: "sequence-b", target: "sequence-c" }
      ]
    }
  });
  assert.equal(allowedExecutionSequence.structuredContent.status, "written");
  assert.equal(allowedExecutionSequence.structuredContent.validation.passed, true);
  assertHorizontalEdgeDirection(
    allowedExecutionSequence.structuredContent.document.nodes,
    allowedExecutionSequence.structuredContent.document.edges,
    "Accepted execution sequence"
  );

  const repairedFramework = {
    ...incompleteFramework,
    coverage: {
      "task.goalDone": ["merge-root"],
      "task.currentEvidence": ["merge-keep"],
      "task.constraints": ["merge-root"],
      "task.workDependencies": ["merge-new"],
      "task.parallelWork": ["merge-detach"],
      "task.deliverables": ["merge-new"],
      "task.risksRecovery": ["merge-detach"],
      "task.stageVerification": ["merge-new"],
      "task.acceptanceDelivery": ["merge-root"],
      "maturity.deliver.steps": ["merge-new"],
      "maturity.deliver.deliverables": ["merge-new"],
      "maturity.deliver.acceptance": ["merge-root"],
      "maturity.deliver.risks": ["merge-detach"],
      "maturity.deliver.ownership": ["merge-root"],
      "maturity.deliver.handoff": ["merge-new"]
    },
    semanticStructure: {
      "merge-root": { responsibility: "Define the execution outcome and acceptance boundary.", inseparableReason: "The boundary qualifies the same outcome rather than a separate deliverable." },
      "merge-keep": { responsibility: "Preserve verified current evidence.", inseparableReason: "The evidence and its verification state are one record." },
      "merge-detach": { responsibility: "Record independent delivery risk and recovery evidence.", inseparableReason: "The recovery note directly qualifies the same risk." },
      "merge-new": { responsibility: "Deliver and verify the remaining work.", inseparableReason: "Implementation and its focused verification form one accepted delivery stage." }
    },
    semanticRelationships: {
      "merge-root-keep": { type: "evidence", rationale: "Current evidence verifies the accepted execution outcome." },
      "merge-root-new": { type: "dependency", rationale: "The remaining delivery depends on the accepted execution boundary." }
    }
  };
  const repairedMerge = await request("tools/call", {
    name: "write_canvasight_graph",
    arguments: {
      projectPath: mergeProjectPath,
      mode: "merge-active-page",
      expectedRevision: context.structuredContent.documentRevision,
      frameworkManifest: repairedFramework,
      operations: [
        {
          op: "update-node",
          nodeId: "merge-keep",
          changes: {
            title: "Verified current evidence",
            body: "Confirmed evidence remains on the active page and retains its original position after refinement."
          }
        },
        { op: "remove-node", nodeId: "merge-prune" },
        {
          op: "add-node",
          node: {
            id: "merge-new",
            title: "Deliver and verify",
            body: "Implement the remaining work, run focused checks, preserve the accepted constraints, and record acceptance evidence.",
            position: { x: 1460, y: 500 }
          }
        },
        { op: "update-edge", edgeId: "merge-root-keep", changes: { label: "verified by" } },
        { op: "remove-edge", edgeId: "merge-root-detach" },
        {
          op: "add-edge",
          edge: { id: "merge-root-new", source: "merge-root", target: "merge-new", label: "delivers" }
        }
      ]
    }
  });
  assert.equal(repairedMerge.structuredContent.status, "written");
  assert.equal(repairedMerge.structuredContent.written, true);
  assert.equal(repairedMerge.structuredContent.validation.passed, true);
  assert.equal(repairedMerge.structuredContent.documentRevision, context.structuredContent.documentRevision + 1);

  const repairedContext = await request("tools/call", {
    name: "get_canvasight_graph_context",
    arguments: { projectPath: mergeProjectPath }
  });
  assert.equal(repairedContext.structuredContent.documentRevision, repairedMerge.structuredContent.documentRevision);
  assert.equal(repairedContext.structuredContent.pages.length, context.structuredContent.pages.length);
  const repairedNodes = new Map(repairedContext.structuredContent.activePage.nodes.map((node) => [node.id, node]));
  assert.equal(repairedNodes.has("merge-prune"), false);
  assert.equal(repairedNodes.get("merge-keep").title, "Verified current evidence");
  assert.deepEqual(repairedNodes.get("merge-root").position, { x: 100, y: 120 });
  assert.deepEqual(repairedNodes.get("merge-keep").position, { x: 780, y: 120 });
  assert.deepEqual(repairedNodes.get("merge-detach").position, { x: 1460, y: 120 });
  assert.deepEqual(repairedNodes.get("merge-new").position, { x: 1460, y: 500 });
  const repairedEdges = new Map(repairedContext.structuredContent.activePage.edges.map((edge) => [edge.id, edge]));
  assert.equal(repairedEdges.has("merge-root-prune"), false, "removing a node must cascade its incident edge");
  assert.equal(repairedEdges.has("merge-root-detach"), false);
  assert.equal(repairedEdges.get("merge-root-keep").label, "verified by");
  assert.equal(repairedEdges.get("merge-root-new").target, "merge-new");

  const refineMerge = await request("tools/call", {
    name: "write_canvasight_graph",
    arguments: {
      projectPath: mergeProjectPath,
      mode: "merge-active-page",
      expectedRevision: repairedContext.structuredContent.documentRevision,
      frameworkManifest: {
        intent: "refine",
        primaryDomain: "task-execution",
        secondaryDomains: [],
        maturity: "deliver",
        output: "execution-plan",
        coverage: {
          "task.currentEvidence": ["merge-keep"],
          "maturity.deliver.acceptance": ["merge-keep"]
        },
        semanticStructure: {
          "merge-keep": { responsibility: "Refine the accepted evidence record.", inseparableReason: "Acceptance is the state of this evidence, not a separate module." }
        },
        semanticRelationships: {}
      },
      operations: [
        {
          op: "update-node",
          nodeId: "merge-keep",
          changes: {
            body: "Refined evidence now records the accepted result while preserving every unrelated node and its position."
          }
        }
      ]
    }
  });
  assert.equal(refineMerge.structuredContent.status, "written");
  assert.equal(refineMerge.structuredContent.validation.passed, true);
  assert.equal(refineMerge.structuredContent.documentRevision, repairedContext.structuredContent.documentRevision + 1);
  const refinedContext = await request("tools/call", {
    name: "get_canvasight_graph_context",
    arguments: { projectPath: mergeProjectPath }
  });
  assert.equal(refinedContext.structuredContent.pages.length, repairedContext.structuredContent.pages.length);
  assert.deepEqual(
    refinedContext.structuredContent.activePage.nodes.map((node) => node.id),
    repairedContext.structuredContent.activePage.nodes.map((node) => node.id)
  );
  const refinedNodes = new Map(refinedContext.structuredContent.activePage.nodes.map((node) => [node.id, node]));
  assert.match(refinedNodes.get("merge-keep").bodyPreview, /Refined evidence/);
  for (const [nodeId, repairedNode] of repairedNodes) {
    assert.deepEqual(refinedNodes.get(nodeId).position, repairedNode.position, `refine moved unrelated node ${nodeId}`);
    if (nodeId !== "merge-keep") assert.deepEqual(refinedNodes.get(nodeId), repairedNode, `refine changed unrelated node ${nodeId}`);
  }
  assert.deepEqual(refinedContext.structuredContent.activePage.edges, repairedContext.structuredContent.activePage.edges);

  const relayoutMerge = await request("tools/call", {
    name: "write_canvasight_graph",
    arguments: {
      projectPath: mergeProjectPath,
      mode: "merge-active-page",
      expectedRevision: refinedContext.structuredContent.documentRevision,
      layout: "horizontal",
      operations: [{ op: "relayout-page" }]
    }
  });
  assert.equal(relayoutMerge.structuredContent.status, "written");
  assert.equal(relayoutMerge.structuredContent.mutationSummary.relayoutApplied, true);
  const relayoutContext = await request("tools/call", {
    name: "get_canvasight_graph_context",
    arguments: { projectPath: mergeProjectPath }
  });
  assert.equal(relayoutContext.structuredContent.documentRevision, refinedContext.structuredContent.documentRevision + 1);
  assertNoNodeBoundsOverlap(relayoutContext.structuredContent.activePage.nodes, "Relayout merge");
  assertHorizontalEdgeDirection(relayoutContext.structuredContent.activePage.nodes, relayoutContext.structuredContent.activePage.edges, "Relayout merge");

  const pagesBeforeLegacyAppend = relayoutContext.structuredContent.pages.length;
  const secondLegacyAppend = await request("tools/call", {
    name: "write_canvasight_graph",
    arguments: {
      projectPath: mergeProjectPath,
      pageName: "Legacy append remains compatible",
      nodes: [
        {
          id: "legacy-appended-node",
          title: "Legacy append",
          body: "Omitting mode and frameworkManifest still creates a separate editable page."
        }
      ]
    }
  });
  assert.equal(secondLegacyAppend.structuredContent.status, "written");
  const afterLegacyAppendContext = await request("tools/call", {
    name: "get_canvasight_graph_context",
    arguments: { projectPath: mergeProjectPath }
  });
  assert.equal(afterLegacyAppendContext.structuredContent.pages.length, pagesBeforeLegacyAppend + 1);
  assert.equal(afterLegacyAppendContext.structuredContent.activePage.name, "Legacy append remains compatible");
  assert.deepEqual(afterLegacyAppendContext.structuredContent.activePage.nodes.map((node) => node.id), ["legacy-appended-node"]);
}

function softwareProductMergeManifest(nodeId, overrides = {}) {
  const coverageKeys = [
    "product.goal", "product.users", "product.value", "product.capabilities", "product.scope", "product.journey",
    "product.informationArchitecture", "product.rules", "product.design", "product.success", "product.risks",
    "product.technicalConstraints", "product.testingRelease", "product.deliverables",
    "maturity.deliver.steps", "maturity.deliver.deliverables", "maturity.deliver.acceptance", "maturity.deliver.risks",
    "maturity.deliver.ownership", "maturity.deliver.handoff"
  ];
  return {
    intent: "execute",
    primaryDomain: "software-product",
    secondaryDomains: [],
    maturity: "deliver",
    output: "execution-plan",
    coverage: Object.fromEntries(coverageKeys.map((key) => [key, [nodeId]])),
    semanticStructure: {
      [nodeId]: {
        responsibility: "Maintain the accepted product delivery record.",
        inseparableReason: "The product constraints and acceptance state qualify the same delivery record."
      }
    },
    semanticRelationships: {},
    ...overrides
  };
}

async function createMergeGuidanceFixture(request, projectPath, rootId = "guidance-root") {
  await fsp.mkdir(projectPath, { recursive: true });
  const initial = await request("tools/call", {
    name: "write_canvasight_graph",
    arguments: {
      projectPath,
      pageName: "Guidance merge fixture",
      layoutPolicy: "preserve-explicit",
      nodes: [
        {
          id: rootId,
          title: "Product delivery",
          body: "Define and verify a concrete product delivery without changing unrelated canvas content.",
          position: { x: 120, y: 160 }
        }
      ]
    }
  });
  assert.equal(initial.structuredContent.status, "written");
  return request("tools/call", {
    name: "get_canvasight_graph_context",
    arguments: { projectPath }
  });
}

async function assertSoftwareProductMergeGuidanceContracts() {
  const projectPath = path.join(tempRoot, "merge-project-guidance-project");
  const rootId = "guidance-root";
  const initialContext = await createMergeGuidanceFixture(request, projectPath, rootId);
  const scatterPath = path.join(projectPath, ".scatter", "scatter.json");
  const initialScatter = await fsp.readFile(scatterPath, "utf8");

  const stale = await request("tools/call", {
    name: "write_canvasight_graph",
    arguments: {
      projectPath,
      mode: "merge-active-page",
      expectedRevision: initialContext.structuredContent.documentRevision - 1,
      frameworkManifest: softwareProductMergeManifest(rootId),
      operations: [{ op: "update-node", nodeId: rootId, changes: { title: "Stale product delivery" } }]
    }
  });
  assert.equal(stale.structuredContent.status, "validation_failed");
  assert.equal(stale.structuredContent.validation.violations.some((item) => item.code === "stale_document"), true);
  assert.equal(await fsp.readFile(scatterPath, "utf8"), initialScatter);

  const incompleteManifest = softwareProductMergeManifest(rootId, {
    coverage: { "product.goal": [rootId] }
  });
  const rejected = await request("tools/call", {
    name: "write_canvasight_graph",
    arguments: {
      projectPath,
      mode: "merge-active-page",
      expectedRevision: initialContext.structuredContent.documentRevision,
      frameworkManifest: incompleteManifest,
      operations: [{ op: "update-node", nodeId: rootId, changes: { title: "Rejected product delivery" } }]
    }
  });
  assert.equal(rejected.structuredContent.status, "validation_failed");
  assert.equal(rejected.structuredContent.written, false);
  assert.equal(rejected.structuredContent.validation.violations.some((item) => item.code === "missing_coverage"), true);
  assert.equal(await fsp.readFile(scatterPath, "utf8"), initialScatter, "a rejected merge must not persist auto guidance nodes");
  const afterRejected = await request("tools/call", {
    name: "get_canvasight_graph_context",
    arguments: { projectPath }
  });
  assert.equal(afterRejected.structuredContent.documentRevision, initialContext.structuredContent.documentRevision);
  assert.deepEqual(afterRejected.structuredContent.activePage.nodes.map((node) => node.id), [rootId]);

  const written = await request("tools/call", {
    name: "write_canvasight_graph",
    arguments: {
      projectPath,
      mode: "merge-active-page",
      expectedRevision: initialContext.structuredContent.documentRevision,
      frameworkManifest: softwareProductMergeManifest(rootId),
      operations: [{ op: "update-node", nodeId: rootId, changes: { title: "Accepted product delivery" } }]
    }
  });
  assert.equal(written.structuredContent.status, "written");
  assert.equal(written.structuredContent.written, true);
  assert.equal(written.structuredContent.validation.passed, true);
  assert.equal(written.structuredContent.documentRevision, initialContext.structuredContent.documentRevision + 1);
  assert.deepEqual(
    written.structuredContent.projectGuidanceNodes.map((node) => node.fileName),
    ["AGENTS.md", "design.md"]
  );
  assert.deepEqual(written.structuredContent.mutationSummary.addedNodeIds, ["project-guidance-agents-md", "project-guidance-design-md"]);
  assert.equal(written.structuredContent.mutationSummary.addedEdgeIds.length, 2);
  assert.equal(written.structuredContent.mutationSummary.relayoutApplied, false);

  const writtenScatter = JSON.parse(await fsp.readFile(scatterPath, "utf8"));
  assert.deepEqual(
    writtenScatter.nodes.map((node) => node.id),
    [rootId, "project-guidance-agents-md", "project-guidance-design-md"]
  );
  assert.equal(writtenScatter.edges.length, 2);
  assert.equal(writtenScatter.edges.every((edge) => edge.source === rootId), true);
  assert.deepEqual(
    writtenScatter.edges.map((edge) => edge.target),
    ["project-guidance-agents-md", "project-guidance-design-md"]
  );
  assert.deepEqual(writtenScatter.nodes.find((node) => node.id === rootId).position, { x: 120, y: 160 });
  assertNoNodeBoundsOverlap(writtenScatter.nodes, "Manifest-only guidance merge");
  assertHorizontalEdgeDirection(writtenScatter.nodes, writtenScatter.edges, "Manifest-only guidance merge");

  const deduplicated = await request("tools/call", {
    name: "write_canvasight_graph",
    arguments: {
      projectPath,
      mode: "merge-active-page",
      expectedRevision: written.structuredContent.documentRevision,
      frameworkManifest: softwareProductMergeManifest(rootId),
      operations: [{ op: "update-node", nodeId: rootId, changes: { body: "The accepted product delivery remains ready for implementation and verification." } }]
    }
  });
  assert.equal(deduplicated.structuredContent.status, "written");
  assert.equal(deduplicated.structuredContent.documentRevision, written.structuredContent.documentRevision + 1);
  assert.deepEqual(deduplicated.structuredContent.projectGuidanceNodes, []);
  assert.deepEqual(deduplicated.structuredContent.mutationSummary.addedNodeIds, []);
  assert.deepEqual(deduplicated.structuredContent.mutationSummary.addedEdgeIds, []);
  const deduplicatedScatter = JSON.parse(await fsp.readFile(scatterPath, "utf8"));
  assert.equal(deduplicatedScatter.nodes.filter((node) => node.data?.projectGuidanceFile === "AGENTS.md").length, 1);
  assert.equal(deduplicatedScatter.nodes.filter((node) => node.data?.projectGuidanceFile === "design.md").length, 1);

  const partialProjectPath = path.join(tempRoot, "merge-partial-project-guidance-project");
  const partialRootId = "partial-guidance-root";
  const partialContext = await createMergeGuidanceFixture(request, partialProjectPath, partialRootId);
  await fsp.writeFile(path.join(partialProjectPath, "AGENTS.md"), "# Existing agent rules\n", "utf8");
  const partial = await request("tools/call", {
    name: "write_canvasight_graph",
    arguments: {
      projectPath: partialProjectPath,
      mode: "merge-active-page",
      expectedRevision: partialContext.structuredContent.documentRevision,
      frameworkManifest: softwareProductMergeManifest(partialRootId),
      operations: [{ op: "update-node", nodeId: partialRootId, changes: { title: "Partially guided delivery" } }]
    }
  });
  assert.equal(partial.structuredContent.status, "written");
  assert.equal(partial.structuredContent.documentRevision, partialContext.structuredContent.documentRevision + 1);
  assert.deepEqual(partial.structuredContent.projectGuidanceNodes.map((node) => node.fileName), ["design.md"]);
  assert.deepEqual(partial.structuredContent.mutationSummary.addedNodeIds, ["project-guidance-design-md"]);

  const articleProjectPath = path.join(tempRoot, "merge-article-graph-type-guidance-project");
  const articleRootId = "article-guidance-root";
  const articleContext = await createMergeGuidanceFixture(request, articleProjectPath, articleRootId);
  const article = await request("tools/call", {
    name: "write_canvasight_graph",
    arguments: {
      projectPath: articleProjectPath,
      mode: "merge-active-page",
      graphType: "software-product",
      expectedRevision: articleContext.structuredContent.documentRevision,
      frameworkManifest: {
        intent: "refine",
        primaryDomain: "article",
        secondaryDomains: [],
        maturity: "deliver",
        output: "structured-outline",
        coverage: {
          "article.purpose": [articleRootId],
          "maturity.deliver.acceptance": [articleRootId]
        },
        semanticStructure: {
          [articleRootId]: {
            responsibility: "Refine the article purpose and acceptance record.",
            inseparableReason: "Acceptance qualifies the same article purpose record."
          }
        },
        semanticRelationships: {}
      },
      operations: [{ op: "update-node", nodeId: articleRootId, changes: { title: "Refined article delivery" } }]
    }
  });
  assert.equal(article.structuredContent.status, "written");
  assert.equal(article.structuredContent.documentRevision, articleContext.structuredContent.documentRevision + 1);
  assert.deepEqual(article.structuredContent.projectGuidanceNodes, []);
  assert.deepEqual(article.structuredContent.mutationSummary.addedNodeIds, []);
  const articleScatter = JSON.parse(await fsp.readFile(path.join(articleProjectPath, ".scatter", "scatter.json"), "utf8"));
  assert.deepEqual(articleScatter.nodes.map((node) => node.id), [articleRootId]);

  const refineProjectPath = path.join(tempRoot, "merge-refine-project-guidance-project");
  const refineRootId = "refine-guidance-root";
  const refineContext = await createMergeGuidanceFixture(request, refineProjectPath, refineRootId);
  const refine = await request("tools/call", {
    name: "write_canvasight_graph",
    arguments: {
      projectPath: refineProjectPath,
      mode: "merge-active-page",
      graphType: "software-product",
      expectedRevision: refineContext.structuredContent.documentRevision,
      frameworkManifest: softwareProductMergeManifest(refineRootId, {
        intent: "refine",
        coverage: {
          "product.goal": [refineRootId],
          "maturity.deliver.acceptance": [refineRootId]
        }
      }),
      operations: [{ op: "update-node", nodeId: refineRootId, changes: { title: "Refined delivery" } }]
    }
  });
  assert.equal(refine.structuredContent.status, "written");
  assert.equal(refine.structuredContent.documentRevision, refineContext.structuredContent.documentRevision + 1);
  assert.deepEqual(refine.structuredContent.projectGuidanceNodes, []);
  assert.deepEqual(refine.structuredContent.mutationSummary.addedNodeIds, []);
  const refineScatter = JSON.parse(await fsp.readFile(path.join(refineProjectPath, ".scatter", "scatter.json"), "utf8"));
  assert.deepEqual(refineScatter.nodes.map((node) => node.id), [refineRootId]);
}

function createMcpClient(label, envOverrides = {}) {
  let clientNextId = 1;
  let clientStdoutBuffer = "";
  let clientStderrBuffer = "";
  let clientStopping = false;
  const clientPending = new Map();
  const clientChild = spawn(process.execPath, [serverPath], {
    cwd: pluginRoot,
    env: {
      ...process.env,
      CANVASIGHT_DEFAULT_PROJECT_PATH: defaultProjectPath,
      CANVASIGHT_HOME: canvasightHome,
      CANVASIGHT_CODEX_BIN: fakeCodexPath,
      CANVASIGHT_CODEX_APP_SERVER_ARGS: fakeCodexAppServerArgs,
      CANVASIGHT_CODEX_NATIVE: "1",
      CANVASIGHT_NATIVE_LOG: nativeLogPath,
      CANVASIGHT_OPEN_EXTERNAL_BROWSER: "0",
      CANVASIGHT_OPEN_BROWSER: "0",
      CODEX_THREAD_ID: `thread-${label}`,
      ...envOverrides
    },
    stdio: ["pipe", "pipe", "pipe"]
  });

  function rejectClientPending(error) {
    for (const { reject } of clientPending.values()) reject(error);
    clientPending.clear();
  }

  function parseClientStdout() {
    while (clientStdoutBuffer.includes("\n")) {
      const newline = clientStdoutBuffer.indexOf("\n");
      const line = clientStdoutBuffer.slice(0, newline).trim();
      clientStdoutBuffer = clientStdoutBuffer.slice(newline + 1);
      if (!line) continue;
      const message = JSON.parse(line);
      const handler = clientPending.get(message.id);
      if (!handler) continue;
      clientPending.delete(message.id);
      if (message.error) {
        handler.reject(new Error(`MCP ${label} request ${message.id} failed: ${message.error.message}`));
      } else {
        handler.resolve(message.result);
      }
    }
  }

  clientChild.stdout.setEncoding("utf8");
  clientChild.stdout.on("data", (chunk) => {
    clientStdoutBuffer += chunk;
    parseClientStdout();
  });

  clientChild.stderr.setEncoding("utf8");
  clientChild.stderr.on("data", (chunk) => {
    clientStderrBuffer += chunk;
  });

  clientChild.on("exit", (code, signal) => {
    if (!clientStopping && clientPending.size) {
      rejectClientPending(new Error(`MCP ${label} exited early: code=${code} signal=${signal} stderr=${clientStderrBuffer}`));
    }
  });

  return {
    child: clientChild,
    request(method, params) {
      const id = clientNextId;
      clientNextId += 1;
      const promise = new Promise((resolve, reject) => {
        clientPending.set(id, { resolve, reject });
      });
      clientChild.stdin.write(`${JSON.stringify({ jsonrpc: "2.0", id, method, params })}\n`);
      return promise;
    },
    notify(method, params) {
      clientChild.stdin.write(`${JSON.stringify({ jsonrpc: "2.0", method, params })}\n`);
    },
    stop() {
      clientStopping = true;
      clientPending.clear();
      clientChild.stdin.end();
      clientChild.kill("SIGTERM");
    },
    endStdinAndWait() {
      clientStopping = true;
      clientChild.stdin.end();
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          clientChild.kill("SIGTERM");
          reject(new Error(`MCP ${label} did not exit after stdin end. stderr=${clientStderrBuffer}`));
        }, 2000);
        clientChild.once("exit", (code, signal) => {
          clearTimeout(timer);
          if (code === 0) {
            resolve({ code, signal });
          } else {
            reject(new Error(`MCP ${label} exited with code=${code} signal=${signal} stderr=${clientStderrBuffer}`));
          }
        });
      });
    },
    stderr() {
      return clientStderrBuffer;
    }
  };
}

function createContentLengthMcpClient(label, envOverrides = {}) {
  let clientNextId = 1;
  let clientStdoutBuffer = Buffer.alloc(0);
  let clientStderrBuffer = "";
  let clientStopping = false;
  const clientPending = new Map();
  const clientChild = spawn(process.execPath, [serverPath], {
    cwd: pluginRoot,
    env: {
      ...process.env,
      CANVASIGHT_DEFAULT_PROJECT_PATH: defaultProjectPath,
      CANVASIGHT_HOME: canvasightHome,
      CANVASIGHT_CODEX_BIN: fakeCodexPath,
      CANVASIGHT_CODEX_APP_SERVER_ARGS: fakeCodexAppServerArgs,
      CANVASIGHT_CODEX_NATIVE: "1",
      CANVASIGHT_NATIVE_LOG: nativeLogPath,
      CANVASIGHT_OPEN_EXTERNAL_BROWSER: "0",
      CANVASIGHT_OPEN_BROWSER: "0",
      CODEX_THREAD_ID: `thread-${label}`,
      ...envOverrides
    },
    stdio: ["pipe", "pipe", "pipe"]
  });

  function rejectClientPending(error) {
    for (const { reject } of clientPending.values()) reject(error);
    clientPending.clear();
  }

  function parseClientStdout() {
    while (clientStdoutBuffer.length) {
      const headerEnd = clientStdoutBuffer.indexOf("\r\n\r\n");
      if (headerEnd < 0) return;
      const header = clientStdoutBuffer.subarray(0, headerEnd).toString("ascii");
      const match = header.match(/content-length:\s*(\d+)/i);
      assert.ok(match, `missing content-length header in ${header}`);
      const length = Number(match[1]);
      const start = headerEnd + 4;
      const end = start + length;
      if (clientStdoutBuffer.length < end) return;
      const message = JSON.parse(clientStdoutBuffer.subarray(start, end).toString("utf8"));
      clientStdoutBuffer = clientStdoutBuffer.subarray(end);
      const handler = clientPending.get(message.id);
      if (!handler) continue;
      clientPending.delete(message.id);
      if (message.error) {
        handler.reject(new Error(message.error.message));
      } else {
        handler.resolve(message.result);
      }
    }
  }

  clientChild.stdout.on("data", (chunk) => {
    clientStdoutBuffer = Buffer.concat([clientStdoutBuffer, Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)]);
    parseClientStdout();
  });

  clientChild.stderr.setEncoding("utf8");
  clientChild.stderr.on("data", (chunk) => {
    clientStderrBuffer += chunk;
  });

  clientChild.on("exit", (code, signal) => {
    if (!clientStopping && clientPending.size) {
      rejectClientPending(new Error(`MCP ${label} exited early: code=${code} signal=${signal} stderr=${clientStderrBuffer}`));
    }
  });

  return {
    child: clientChild,
    request(method, params) {
      const id = clientNextId;
      clientNextId += 1;
      const promise = new Promise((resolve, reject) => {
        clientPending.set(id, { resolve, reject });
      });
      const body = JSON.stringify({ jsonrpc: "2.0", id, method, params });
      clientChild.stdin.write(`Content-Length: ${Buffer.byteLength(body, "utf8")}\r\n\r\n${body}`);
      return promise;
    },
    async endStdinAndWait() {
      clientStopping = true;
      clientChild.stdin.end();
      await new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          clientChild.kill("SIGTERM");
          reject(new Error(`MCP ${label} did not exit after stdin end. stderr=${clientStderrBuffer}`));
        }, 2000);
        clientChild.once("exit", (code, signal) => {
          clearTimeout(timer);
          if (code === 0) {
            resolve({ code, signal });
          } else {
            reject(new Error(`MCP ${label} exited with code=${code} signal=${signal} stderr=${clientStderrBuffer}`));
          }
        });
      });
    },
    stderr() {
      return clientStderrBuffer;
    }
  };
}

async function stopDaemon(home = canvasightHome) {
  let daemonPid = 0;
  try {
    daemonPid = Number(JSON.parse(await fsp.readFile(path.join(home, "daemon.json"), "utf8")).pid || 0);
  } catch {
    daemonPid = 0;
  }
  await new Promise((resolve) => {
    const stopper = spawn(process.execPath, [serverPath, "--stop-daemon"], {
      cwd: pluginRoot,
      env: {
        ...process.env,
        CANVASIGHT_HOME: home
      },
      stdio: "ignore"
    });
    stopper.on("exit", () => resolve());
    stopper.on("error", () => resolve());
  });
  if (!daemonPid) return;
  const deadline = Date.now() + 2000;
  while (Date.now() < deadline) {
    try {
      process.kill(daemonPid, 0);
      await sleep(50);
    } catch {
      return;
    }
  }
  try {
    process.kill(daemonPid, "SIGKILL");
  } catch {
    // The daemon exited between the final poll and cleanup.
  }
}

async function assertDesktopRuntimeSelection() {
  const runtimeRoot = path.join(tempRoot, "runtime-selection");
  const windowsExecutableSuffix = process.platform === "win32" ? ".exe" : "";
  const explicitBin = path.join(runtimeRoot, `explicit-override${process.platform === "win32" ? ".exe" : ".mjs"}`);
  const codexDesktopBin = path.join(runtimeRoot, "Codex.app", "Contents", "Resources", `codex${windowsExecutableSuffix}`);
  const chatGptDesktopBin = path.join(runtimeRoot, "ChatGPT.app", "Contents", "Resources", `codex${windowsExecutableSuffix}`);
  const pathBinDir = path.join(runtimeRoot, "path-bin");
  const pathBin = path.join(pathBinDir, `codex${windowsExecutableSuffix}`);
  const missingBin = path.join(runtimeRoot, "missing", `codex${windowsExecutableSuffix}`);
  const brokenDesktopBin = path.join(runtimeRoot, `broken-desktop${process.platform === "win32" ? ".exe" : ".mjs"}`);

  for (const target of [explicitBin, codexDesktopBin, chatGptDesktopBin, pathBin, brokenDesktopBin]) {
    await fsp.mkdir(path.dirname(target), { recursive: true });
    await fsp.copyFile(fakeCodexPath, target);
    await fsp.chmod(target, 0o755);
  }

  async function openWithRuntime(label, envOverrides, { expectsFailure = false } = {}) {
    const home = path.join(runtimeRoot, `${label}-home`);
    const client = createMcpClient(`runtime-${label}`, {
      CANVASIGHT_HOME: home,
      CANVASIGHT_CODEX_BIN: "",
      CANVASIGHT_CODEX_APP_BIN: missingBin,
      CANVASIGHT_CHATGPT_APP_BIN: missingBin,
      CANVASIGHT_FAKE_THREAD_CWD: defaultProjectPath,
      ...envOverrides
    });
    try {
      await client.request("initialize", {
        protocolVersion: "2024-11-05",
        capabilities: {},
        clientInfo: { name: `canvasight-runtime-${label}`, version: "0.0.0" }
      });
      const action = client.request("tools/call", {
        name: "open_canvasight",
        arguments: { threadId: `thread-runtime-${label}`, language: "zh" }
      });
      if (expectsFailure) {
        await assert.rejects(action, /current Codex task|handshake failure|app-server/);
      } else {
        const result = await action;
        await client.request("tools/call", { name: "close_canvasight", arguments: { sessionId: result.structuredContent.sessionId } });
      }
    } finally {
      client.stop();
      await stopDaemon(home);
    }
  }

  async function initializedExecutable() {
    const entries = await readNativeLog();
    const initialized = entries.filter((entry) => entry.method === "runtime/initialize");
    return initialized.map((entry) =>
      path.resolve(process.platform === "win32" ? entry.params?.execPath : entry.params?.executable)
    );
  }

  await fsp.writeFile(nativeLogPath, "", "utf8");
  await openWithRuntime("explicit", {
    CANVASIGHT_CODEX_BIN: explicitBin,
    CANVASIGHT_CODEX_APP_BIN: codexDesktopBin,
    CANVASIGHT_CHATGPT_APP_BIN: chatGptDesktopBin,
    PATH: `${pathBinDir}${path.delimiter}${process.env.PATH}`
  });
  assert.deepEqual(await initializedExecutable(), [explicitBin]);

  await fsp.writeFile(nativeLogPath, "", "utf8");
  await openWithRuntime("codex-desktop", {
    CANVASIGHT_CODEX_APP_BIN: codexDesktopBin,
    CANVASIGHT_CHATGPT_APP_BIN: chatGptDesktopBin,
    PATH: `${pathBinDir}${path.delimiter}${process.env.PATH}`
  });
  assert.deepEqual(await initializedExecutable(), [codexDesktopBin]);

  await fsp.writeFile(nativeLogPath, "", "utf8");
  await openWithRuntime("chatgpt-desktop", {
    CANVASIGHT_CODEX_APP_BIN: missingBin,
    CANVASIGHT_CHATGPT_APP_BIN: chatGptDesktopBin,
    PATH: `${pathBinDir}${path.delimiter}${process.env.PATH}`
  });
  assert.deepEqual(await initializedExecutable(), [chatGptDesktopBin]);

  await fsp.writeFile(nativeLogPath, "", "utf8");
  const splitRuntimeHome = path.join(runtimeRoot, "skills-path-native-chatgpt-home");
  const splitRuntimeClient = createMcpClient("runtime-skills-path-native-chatgpt", {
    CANVASIGHT_HOME: splitRuntimeHome,
    CANVASIGHT_CODEX_BIN: "",
    CANVASIGHT_SKILLS_CODEX_BIN: "",
    CANVASIGHT_CODEX_APP_BIN: missingBin,
    CANVASIGHT_CHATGPT_APP_BIN: chatGptDesktopBin,
    CANVASIGHT_FAKE_THREAD_CWD: defaultProjectPath,
    PATH: `${pathBinDir}${path.delimiter}${process.env.PATH}`
  });
  try {
    await splitRuntimeClient.request("initialize", {
      protocolVersion: "2024-11-05",
      capabilities: {},
      clientInfo: { name: "canvasight-runtime-skills-path-native-chatgpt", version: "0.0.0" }
    });
    const skills = await splitRuntimeClient.request("tools/call", {
      name: "list_canvasight_skills",
      arguments: { projectPath: defaultProjectPath }
    });
    assert.equal(skills.structuredContent.status, "ok");
    const opened = await splitRuntimeClient.request("tools/call", {
      name: "open_canvasight",
      arguments: { threadId: "thread-runtime-skills-path-native-chatgpt", language: "zh" }
    });
    await splitRuntimeClient.request("tools/call", {
      name: "close_canvasight",
      arguments: { sessionId: opened.structuredContent.sessionId }
    });
  } finally {
    splitRuntimeClient.stop();
    await stopDaemon(splitRuntimeHome);
  }
  assert.deepEqual(
    await initializedExecutable(),
    [pathBin, chatGptDesktopBin],
    "Skill discovery must prefer PATH over ChatGPT while native thread operations remain Desktop-first"
  );

  await fsp.writeFile(nativeLogPath, "", "utf8");
  await openWithRuntime("path-fallback", {
    CANVASIGHT_CODEX_APP_BIN: missingBin,
    CANVASIGHT_CHATGPT_APP_BIN: missingBin,
    PATH: `${pathBinDir}${path.delimiter}${process.env.PATH}`
  });
  assert.deepEqual(await initializedExecutable(), [pathBin]);

  await fsp.writeFile(nativeLogPath, "", "utf8");
  await openWithRuntime(
    "desktop-handshake-failure",
    {
      CANVASIGHT_CODEX_APP_BIN: brokenDesktopBin,
      CANVASIGHT_CHATGPT_APP_BIN: chatGptDesktopBin,
      CANVASIGHT_FAKE_FAIL_INITIALIZE: "1",
      PATH: `${pathBinDir}${path.delimiter}${process.env.PATH}`
    },
    { expectsFailure: true }
  );
  assert.deepEqual(await initializedExecutable(), [brokenDesktopBin], "a failed Desktop handshake must not retry through PATH codex");
}

async function assertStdoutClosureLifecycle() {
  const home = path.join(tempRoot, "stdout-closure-home");
  const logPath = path.join(home, "mcp-lifecycle.log");
  await fsp.mkdir(home, { recursive: true });
  await fsp.writeFile(logPath, "x".repeat(128 * 1024), "utf8");
  const closingChild = spawn(process.execPath, [serverPath], {
    cwd: pluginRoot,
    env: {
      ...process.env,
      CANVASIGHT_HOME: home,
      CANVASIGHT_MCP_LIFECYCLE_LOG_MAX_BYTES: String(64 * 1024)
    },
    stdio: ["pipe", "pipe", "pipe"]
  });
  closingChild.stderr.resume();
  closingChild.stdin.on("error", () => {});
  closingChild.stdout.destroy();
  closingChild.stdin.write(
    `${JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: {
        protocolVersion: "2024-11-05",
        capabilities: {},
        clientInfo: { name: "canvasight-stdout-closure-smoke", version: "0.0.0" }
      }
    })}\n`
  );

  const exit = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      closingChild.kill("SIGKILL");
      reject(new Error("MCP did not exit after stdout closed"));
    }, 2000);
    closingChild.once("exit", (code, signal) => {
      clearTimeout(timer);
      resolve({ code, signal });
    });
  });
  assert.equal(exit.code, 0);
  const stat = await fsp.stat(logPath);
  assert.ok(stat.size < 64 * 1024, `MCP lifecycle log was not capped: ${stat.size}`);
  const entries = (await fsp.readFile(logPath, "utf8"))
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line));
  assert.equal(entries.filter((entry) => entry.event === "stdout_closed").length, 1);
  assert.equal(entries.some((entry) => entry.event === "stdio_exit" && entry.code === 0), true);
}

async function assertConcurrentDaemonSingleFlight() {
  const home = path.join(tempRoot, "concurrent-daemon-home");
  const clients = Array.from({ length: 4 }, (_, index) =>
    createMcpClient(`concurrent-${index + 1}`, {
      CANVASIGHT_HOME: home,
      CODEX_THREAD_ID: `thread-concurrent-${index + 1}`
    })
  );
  try {
    await Promise.all(
      clients.map((client, index) =>
        client.request("initialize", {
          protocolVersion: "2024-11-05",
          capabilities: {},
          clientInfo: { name: `canvasight-concurrent-${index + 1}`, version: "0.0.0" }
        })
      )
    );
    const opened = await Promise.all(
      clients.map((client, index) =>
        client.request("tools/call", {
          name: "open_canvasight",
          arguments: {
            language: "zh",
            projectPath: defaultProjectPath,
            threadId: `thread-concurrent-${index + 1}`
          }
        })
      )
    );
    const origins = new Set(opened.map((result) => widgetDataFor(result).origin));
    assert.equal(origins.size, 1);
    const state = JSON.parse(await fsp.readFile(path.join(home, "daemon.json"), "utf8"));
    assert.equal(state.serverVersion, expectedPluginVersion);
    assert.equal(origins.has(state.origin), true);
    await Promise.all(
      opened.map((result, index) =>
        clients[index].request("tools/call", {
          name: "close_canvasight",
          arguments: { sessionId: result.structuredContent.sessionId }
        })
      )
    );
  } catch (error) {
    let lifecycleTail = "<lifecycle log unavailable>";
    try {
      const lifecycleLog = await fsp.readFile(path.join(home, "mcp-lifecycle.log"), "utf8");
      lifecycleTail = lifecycleLog.split(/\r?\n/).filter(Boolean).slice(-80).join("\n");
    } catch (logError) {
      lifecycleTail = `<failed to read lifecycle log: ${logError?.message || String(logError)}>`;
    }
    throw new Error(
      `${error instanceof Error ? error.message : String(error)}\nConcurrent daemon lifecycle tail:\n${lifecycleTail}`,
      { cause: error }
    );
  } finally {
    clients.forEach((client) => client.stop());
    await stopDaemon(home);
  }
}

async function assertDaemonNodeExecutableFallback() {
  const home = path.join(tempRoot, "daemon-node-fallback-home");
  const unavailableExecutable = "/definitely/missing/canvasight-node";
  const client = createMcpClient("daemon-node-fallback", {
    CANVASIGHT_HOME: home,
    CANVASIGHT_NODE_BIN: unavailableExecutable,
    CODEX_THREAD_ID: "thread-daemon-node-fallback"
  });
  try {
    await client.request("initialize", {
      protocolVersion: "2024-11-05",
      capabilities: {},
      clientInfo: { name: "canvasight-daemon-node-fallback-smoke", version: "0.0.0" }
    });
    const opened = await client.request("tools/call", {
      name: "open_canvasight",
      arguments: {
        language: "zh",
        projectPath: defaultProjectPath,
        threadId: "thread-daemon-node-fallback"
      }
    });
    const widgetData = widgetDataFor(opened);
    const state = JSON.parse(await fsp.readFile(path.join(home, "daemon.json"), "utf8"));
    assert.equal(state.serverVersion, expectedPluginVersion);
    assert.equal(state.origin, widgetData.origin);

    const lifecycle = await readMcpLifecycleLog(home);
    const failedCandidateIndex = lifecycle.findIndex(
      (entry) =>
        entry.event === "daemon_spawn_failure" &&
        entry.source === "configured" &&
        entry.executable === unavailableExecutable &&
        entry.code === "ENOENT"
    );
    assert.notEqual(failedCandidateIndex, -1, "missing ENOENT lifecycle record for configured daemon executable");
    const fallbackSpawnIndex = lifecycle.findIndex(
      (entry, index) =>
        index > failedCandidateIndex &&
        entry.event === "daemon_spawned" &&
        entry.executable !== unavailableExecutable
    );
    assert.notEqual(fallbackSpawnIndex, -1, "missing successful fallback daemon spawn after configured executable failed");

    await client.request("tools/call", {
      name: "close_canvasight",
      arguments: { sessionId: opened.structuredContent.sessionId }
    });
  } finally {
    client.stop();
    await stopDaemon(home);
  }
}

async function main() {
  const killTimer = setTimeout(() => {
    child.kill("SIGTERM");
    rejectPending(new Error(`MCP smoke test timed out. stderr=${stderrBuffer}`));
  }, 30000);

  try {
    const inlineOnlyHome = path.join(tempRoot, "inline-framework-questions-home");
    const inlineOnlyClient = createMcpClient("inline-framework-questions", {
      CANVASIGHT_HOME: inlineOnlyHome,
      CODEX_THREAD_ID: "thread-inline-framework-questions"
    });
    try {
      await inlineOnlyClient.request("initialize", {
        protocolVersion: "2024-11-05",
        capabilities: {},
        clientInfo: { name: "canvasight-inline-framework-questions-smoke", version: "0.0.0" }
      });
      inlineOnlyClient.notify("notifications/initialized", {});
      const questionDefinitions = [{
        id: "scope",
        question: "Which scope should this framework cover?",
        selectionMode: "single",
        options: [
          { id: "product", label: "Product only", recommended: true },
          { id: "product-and-delivery", label: "Product and delivery" }
        ],
        customAnswerLabel: "Add another scope"
      }, {
        id: "dimensions",
        question: "Which dimensions must remain explicit?",
        selectionMode: "multiple",
        options: [
          { id: "roles", label: "Roles" },
          { id: "stages", label: "Stages" },
          { id: "risks", label: "Risks" }
        ]
      }];
      const asked = await inlineOnlyClient.request("tools/call", {
        name: "ask_canvasight_framework_questions",
        arguments: {
          title: "Confirm framework direction",
          description: "These choices change the generated topology.",
          language: "en",
          questions: questionDefinitions
        }
      });
      assert.equal(asked.structuredContent.kind, "canvasight.framework-questions");
      assert.equal(asked.structuredContent.schemaVersion, 1);
      assert.match(asked.structuredContent.confirmationId, /^framework-confirmation-/);
      assert.equal(asked.structuredContent.language, "en");
      assert.equal(asked.structuredContent.instruction, "wait_for_user_confirmation");
      assert.deepEqual(asked.structuredContent.questions[0], questionDefinitions[0]);
      assert.deepEqual(asked.structuredContent.questions[1], {
        ...questionDefinitions[1],
        customAnswerLabel: "Custom answer"
      });
      assert.match(asked.content[0].text, /wait|stop/i);
      assert.deepEqual(Object.keys(asked._meta || {}), []);
      await assert.rejects(inlineOnlyClient.request("tools/call", {
        name: "ask_canvasight_framework_questions",
        arguments: { title: "No questions", questions: [] }
      }));
      await assert.rejects(inlineOnlyClient.request("tools/call", {
        name: "ask_canvasight_framework_questions",
        arguments: {
          title: "Duplicate ids",
          questions: [questionDefinitions[0], { ...questionDefinitions[0] }]
        }
      }), /unique|duplicate/i);
      await assert.rejects(inlineOnlyClient.request("tools/call", {
        name: "ask_canvasight_framework_questions",
        arguments: {
          title: "Too few options",
          questions: [{ ...questionDefinitions[0], options: [questionDefinitions[0].options[0]] }]
        }
      }));
      const inlineResource = await inlineOnlyClient.request("resources/read", {
        uri: "ui://widget/canvasight/framework-questions.html"
      });
      assert.equal(inlineResource.contents[0].uri, "ui://widget/canvasight/framework-questions.html");
      assert.equal(inlineResource.contents[0].mimeType, "text/html;profile=mcp-app");
      assert.deepEqual(
        inlineResource.contents[0]._meta["openai/widgetCSP"].connect_domains,
        [],
        "the message-inline resource must not receive daemon network access"
      );
      assert.equal(
        fs.existsSync(path.join(inlineOnlyHome, "daemon.json")),
        false,
        "using the message-inline tool and resource must not start a Canvasight daemon"
      );
      const inlineLifecycle = await readMcpLifecycleLog(inlineOnlyHome);
      assert.equal(
        inlineLifecycle.some((entry) => entry.event === "canvasight_open_attempt_created" || entry.event === "daemon_spawned"),
        false,
        "the message-inline path must not enter the fullscreen OpenAttempt or daemon lifecycle"
      );
    } finally {
      inlineOnlyClient.stop();
    }

    await assertDesktopRuntimeSelection();

    const initialized = await request("initialize", {
      protocolVersion: "2024-11-05",
      capabilities: {},
      clientInfo: {
        name: "canvasight-smoke",
        version: "0.0.0"
      }
    });
    assert.equal(initialized.serverInfo.name, "canvasight");
    assert.equal(initialized.serverInfo.version, expectedPluginVersion);
    notify("notifications/initialized", {});

    const listed = await request("tools/list", {});
    const toolNames = new Set(listed.tools.map((tool) => tool.name));
    assert.equal(toolNames.has("render_canvasight_canvas_widget"), true);
    assert.equal(toolNames.has("open_canvasight"), true);
    assert.equal(toolNames.has("open_canvasight_browser_fallback"), true);
    assert.equal(toolNames.has("list_canvasight_recent_projects"), true);
    assert.equal(toolNames.has("open_canvasight_recent_project"), true);
    assert.equal(toolNames.has("claim_canvasight_thread"), true);
    assert.equal(toolNames.has("list_canvasight_node_templates"), true);
    assert.equal(toolNames.has("list_canvasight_skills"), true);
    assert.equal(toolNames.has("get_canvasight_node_template"), true);
    assert.equal(toolNames.has("get_canvasight_graph_context"), true);
    assert.equal(toolNames.has("write_canvasight_graph"), true);
    assert.equal(toolNames.has("await_canvasight_widget_ready"), true);
    assert.equal(toolNames.has("await_canvasight_run"), true);
    assert.equal(toolNames.has("close_canvasight"), true);
    assert.equal(toolNames.has("ask_canvasight_framework_questions"), true);
    const frameworkQuestionsTool = listed.tools.find((tool) => tool.name === "ask_canvasight_framework_questions");
    assert.equal(frameworkQuestionsTool._meta.ui.resourceUri, "ui://widget/canvasight/framework-questions.html");
    assert.deepEqual(frameworkQuestionsTool._meta.ui.visibility, ["model", "app"]);
    assert.equal(frameworkQuestionsTool.inputSchema.properties.questions.minItems, 1);
    assert.equal(frameworkQuestionsTool.inputSchema.properties.questions.maxItems, 3);
    assert.deepEqual(
      frameworkQuestionsTool.inputSchema.properties.questions.items.properties.selectionMode.enum,
      ["single", "multiple"]
    );
    assert.equal(frameworkQuestionsTool.inputSchema.properties.questions.items.properties.options.minItems, 2);
    assert.equal(frameworkQuestionsTool.inputSchema.properties.questions.items.properties.options.maxItems, 3);
    const renderTool = listed.tools.find((tool) => tool.name === "render_canvasight_canvas_widget");
    assert.match(renderTool.description, /native Codex widget/);
    assert.match(renderTool.description, /send follow-up messages to the current thread/);
    assert.equal(renderTool._meta.ui.resourceUri, "ui://widget/canvasight/canvas.html");
    assert.equal(renderTool._meta["openai/outputTemplate"], undefined);
    assert.deepEqual(renderTool.inputSchema.required, ["threadId"]);
    assert.equal(renderTool.outputSchema.properties.openTarget.type, "string");
    assert.equal(renderTool.outputSchema.properties.url, undefined);
    assert.equal(renderTool.outputSchema.properties.browserUrl, undefined);
    const openTool = listed.tools.find((tool) => tool.name === "open_canvasight");
    assert.match(openTool.description, /default native Codex widget/);
    assert.match(openTool.description, /send follow-up messages to the current thread/);
    assert.equal(openTool._meta["openai/outputTemplate"], undefined);
    assert.equal(openTool._meta.ui.resourceUri, "ui://widget/canvasight/canvas.html");
    assert.deepEqual(openTool.inputSchema.required, ["threadId"]);
    assert.equal(openTool.outputSchema.properties.openTarget.type, "string");
    assert.equal(openTool.outputSchema.properties.url, undefined);
    assert.equal(openTool.outputSchema.properties.browserUrl, undefined);
    const browserFallbackTool = listed.tools.find((tool) => tool.name === "open_canvasight_browser_fallback");
    assert.match(browserFallbackTool.description, /browser fallback URL/);
    assert.match(browserFallbackTool.description, /queue Run payloads/);
    assert.equal(browserFallbackTool.outputSchema.properties.openTarget.type, "string");
    assert.equal(browserFallbackTool.outputSchema.properties.url.type, "string");
    const recentOpenTool = listed.tools.find((tool) => tool.name === "open_canvasight_recent_project");
    assert.match(recentOpenTool.description, /default native Codex widget/);
    assert.match(recentOpenTool.description, /active Canvasight context/);
    assert.equal(recentOpenTool._meta.ui.resourceUri, "ui://widget/canvasight/canvas.html");
    assert.deepEqual(recentOpenTool.inputSchema.required, ["threadId"]);
    const claimTool = listed.tools.find((tool) => tool.name === "claim_canvasight_thread");
    assert.match(claimTool.description, /current Codex thread/);
    assert.match(claimTool.description, /without opening a new browser tab/);
    const writeGraphTool = listed.tools.find((tool) => tool.name === "write_canvasight_graph");
    assert.match(writeGraphTool.description, /Canvasight is active/);
    assert.match(writeGraphTool.description, /before direct execution/);
    assert.deepEqual(writeGraphTool.inputSchema.properties.graphType.enum, [
      "software-product",
      "article-outline",
      "codebase-structure",
      "task-plan",
      "general"
    ]);
    assert.equal(writeGraphTool.inputSchema.properties.mode.enum.includes("merge-active-page"), true);
    assert.equal(writeGraphTool.inputSchema.properties.expectedRevision.type, "integer");
    assert.equal(writeGraphTool.inputSchema.properties.operations.type, "array");
    assert.deepEqual(writeGraphTool.inputSchema.properties.layoutPolicy.enum, ["auto", "preserve-explicit"]);
    assert.deepEqual(writeGraphTool.inputSchema.properties.layout.enum, ["horizontal"]);
    assert.deepEqual(writeGraphTool.inputSchema.properties.pages.items.properties.layout.enum, ["horizontal"]);
    assert.equal(writeGraphTool.inputSchema.properties.frameworkManifest.required.includes("semanticRelationships"), true);
    assert.equal(writeGraphTool.inputSchema.properties.operations.items.properties.op.enum.includes("relayout-page"), true);
    assert.equal(writeGraphTool.inputSchema.properties.frameworkManifest.type, "object");
    assert.equal(writeGraphTool.inputSchema.properties.frameworkManifest.properties.semanticStructure.type, "object");
    assert.deepEqual(writeGraphTool.inputSchema.properties.frameworkManifest.properties.contentMode.enum, ["canvasight-default", "skill-led"]);
    assert.equal(writeGraphTool.inputSchema.properties.frameworkManifest.properties.contentSkills.type, "array");
    assert.equal(writeGraphTool.inputSchema.properties.frameworkManifest.properties.skillAssignments.type, "object");
    const listSkillsTool = listed.tools.find((tool) => tool.name === "list_canvasight_skills");
    assert.match(listSkillsTool.description, /enabled Codex Skills/);
    assert.match(listSkillsTool.description, /never include Skill bodies or local paths/);
    assert.equal(listSkillsTool.inputSchema.properties.forceReload.type, "boolean");
    const graphContextTool = listed.tools.find((tool) => tool.name === "get_canvasight_graph_context");
    assert.match(graphContextTool.description, /active(?: Canvasight)? page|current page/i);
    assert.equal(graphContextTool.inputSchema.properties.projectPath.type, "string");
    assert.equal(graphContextTool.outputSchema.properties.documentRevision.type, "integer");
    assert.equal(graphContextTool.outputSchema.properties.preferences.properties.aiSkillAssignmentEnabled.type, "boolean");
    assert.equal(graphContextTool.outputSchema.properties.activePage.type, "object");
    const awaitWidgetReadyTool = listed.tools.find((tool) => tool.name === "await_canvasight_widget_ready");
    assert.match(awaitWidgetReadyTool.description, /only status=ready confirms/);
    assert.deepEqual(awaitWidgetReadyTool.inputSchema.required, ["sessionId", "openAttemptId", "threadId"]);
    assert.match(awaitWidgetReadyTool.inputSchema.properties.timeoutMs.description, /Defaults to 30000/);

    const resolvedSkills = await request("tools/call", {
      name: "list_canvasight_skills",
      arguments: {
        projectPath: defaultProjectPath,
        query: "PDF",
        forceReload: true
      }
    });
    assert.equal(resolvedSkills.structuredContent.status, "ok");
    assert.equal(resolvedSkills.structuredContent.total, 1);
    assert.deepEqual(resolvedSkills.structuredContent.skills, [
      {
        name: "pdf",
        description: "Read, create, and verify PDF files where rendering and layout matter.",
        displayName: "PDF 专家",
        scope: "user"
      }
    ]);
    assert.doesNotMatch(JSON.stringify(resolvedSkills.structuredContent), /\/private\/secret|SKILL\.md|disabled-secret/);
    const skillRequestLog = (await readNativeLog()).findLast((entry) => entry.method === "skills/list");
    assert.deepEqual(skillRequestLog.params.cwds, [defaultProjectPath]);
    assert.equal(skillRequestLog.params.forceReload, true);
    await fsp.writeFile(skillsFailPath, "fail\n", "utf8");
    try {
      const unavailableSkills = await request("tools/call", {
        name: "list_canvasight_skills",
        arguments: { projectPath: defaultProjectPath }
      });
      assert.equal(unavailableSkills.structuredContent.status, "unavailable");
      assert.equal(unavailableSkills.structuredContent.advisory.code, "skills_unavailable");
      assert.match(unavailableSkills.structuredContent.advisory.message, /Manual \$skill-name input remains available/);
      assert.doesNotMatch(JSON.stringify(unavailableSkills.structuredContent), /\/private\/secret|fake skills\/list failure/);
    } finally {
      await fsp.rm(skillsFailPath, { force: true });
    }

    const lifecycleClient = createMcpClient("lifecycle", {
      CODEX_THREAD_ID: "thread-lifecycle"
    });
    try {
      const lifecycleInitialized = await lifecycleClient.request("initialize", {
        protocolVersion: "2024-11-05",
        capabilities: {},
        clientInfo: {
          name: "canvasight-lifecycle-smoke",
          version: "0.0.0"
        }
      });
      assert.equal(lifecycleInitialized.serverInfo.version, expectedPluginVersion);
      await assert.rejects(
        lifecycleClient.request("tools/call", {
          name: "missing_canvasight_tool",
          arguments: {}
        }),
        /Unknown tool: missing_canvasight_tool/
      );
      const lifecycleRecent = await lifecycleClient.request("tools/call", {
        name: "list_canvasight_recent_projects",
        arguments: { limit: 2 }
      });
      assert.equal(lifecycleRecent.structuredContent.status, "listed");
      await lifecycleClient.endStdinAndWait();
    } finally {
      if (!lifecycleClient.child.killed) lifecycleClient.child.kill("SIGTERM");
    }

    const missingThreadClient = createMcpClient("missing-thread", {
      CODEX_THREAD_ID: ""
    });
    try {
      await missingThreadClient.request("initialize", {
        protocolVersion: "2024-11-05",
        capabilities: {},
        clientInfo: {
          name: "canvasight-missing-thread-smoke",
          version: "0.0.0"
        }
      });
      await assert.rejects(
        missingThreadClient.request("tools/call", {
          name: "open_canvasight",
          arguments: { language: "zh" }
        }),
        /native open requires the current Codex thread id/
      );
    } finally {
      missingThreadClient.stop();
    }

    const defaultNativeHome = path.join(tempRoot, "default-native-home");
    const defaultNativeClient = createMcpClient("default-native", {
      CANVASIGHT_CODEX_NATIVE: "",
      CANVASIGHT_HOME: defaultNativeHome,
      CODEX_THREAD_ID: "thread-default-native"
    });
    try {
      await defaultNativeClient.request("initialize", {
        protocolVersion: "2024-11-05",
        capabilities: {},
        clientInfo: {
          name: "canvasight-default-native-smoke",
          version: "0.0.0"
        }
      });
      const defaultNativeOpened = await defaultNativeClient.request("tools/call", {
        name: "open_canvasight",
        arguments: {
          language: "zh",
          projectPath: defaultProjectPath,
          threadId: "thread-default-native"
        }
      });
      const defaultNativeData = widgetDataFor(defaultNativeOpened);
      const defaultNativeHealth = await fetchJson(`${defaultNativeData.origin}/api/health`);
      assert.equal(defaultNativeHealth.codexNativeEnabled, true);
      await defaultNativeClient.request("tools/call", {
        name: "close_canvasight",
        arguments: { sessionId: defaultNativeOpened.structuredContent.sessionId }
      });
    } finally {
      defaultNativeClient.stop();
      await stopDaemon(defaultNativeHome);
    }

    const contentLengthClient = createContentLengthMcpClient("content-length", {
      CODEX_THREAD_ID: "thread-content-length"
    });
    try {
      const contentLengthInitialized = await contentLengthClient.request("initialize", {
        protocolVersion: "2024-11-05",
        capabilities: {},
        clientInfo: {
          name: "canvasight-content-length-smoke",
          version: "0.0.0"
        }
      });
      assert.equal(contentLengthInitialized.serverInfo.version, expectedPluginVersion);
      const contentLengthListed = await contentLengthClient.request("tools/list", {});
      assert.equal(contentLengthListed.tools.some((tool) => tool.name === "open_canvasight"), true);
      const contentLengthRecent = await contentLengthClient.request("tools/call", {
        name: "list_canvasight_recent_projects",
        arguments: { limit: 2 }
      });
      assert.equal(contentLengthRecent.structuredContent.status, "listed");
      await contentLengthClient.endStdinAndWait();
    } finally {
      if (!contentLengthClient.child.killed) contentLengthClient.child.kill("SIGTERM");
    }

    const lifecycleLog = await readMcpLifecycleLog();
    assert.equal(lifecycleLog.some((entry) => entry.event === "stdio_start"), true);
    assert.equal(lifecycleLog.some((entry) => entry.event === "stdin_end"), true);
    assert.equal(lifecycleLog.some((entry) => entry.event === "stdio_exit"), true);
    assert.equal(
      lifecycleLog.some((entry) => entry.event === "request" && entry.method === "tools/call" && entry.toolName === "list_canvasight_recent_projects"),
      true
    );

    await assertStdoutClosureLifecycle();
    await assertConcurrentDaemonSingleFlight();
    await assertDaemonNodeExecutableFallback();

    const resources = await request("resources/list", {});
    assert.equal(resources.resources.length, 2);
    const resourceUris = resources.resources.map((resource) => resource.uri).sort();
    assert.deepEqual(resourceUris, [
      "ui://widget/canvasight/canvas.html",
      "ui://widget/canvasight/framework-questions.html"
    ]);
    assert.equal(resources.resources.every((resource) => resource.mimeType === "text/html;profile=mcp-app"), true);
    const widgetResource = await request("resources/read", {
      uri: "ui://widget/canvasight/canvas.html"
    });
    assert.equal(widgetResource.contents[0].uri, "ui://widget/canvasight/canvas.html");
    assert.equal(widgetResource.contents[0].mimeType, "text/html;profile=mcp-app");
    assert.ok(
      widgetResource.contents[0]._meta["openai/widgetCSP"].connect_domains.some((domain) => /^http:\/\/127\.0\.0\.1:\d+$/.test(domain)),
      "widget resource CSP must include the exact running daemon origin before the open tool completes"
    );
    const widgetHtml = widgetResource.contents[0].text;
    assert.match(widgetHtml, /id="root"/);
    assert.doesNotMatch(widgetHtml, /<iframe\b/i);
    assert.match(widgetHtml, /<script\b[^>]*\bid="canvasightAppModule"[^>]*\btype="module"/i);
    assert.doesNotMatch(widgetHtml, /canvasightAppBundleSource/);
    assert.doesNotMatch(widgetHtml, /canvasightMcpHostBridge/);
    assert.match(widgetHtml, /__CANVASIGHT_WIDGET_SHELL__/);
    assert.match(widgetHtml, /__CANVASIGHT_WIDGET_DATA__/);
    assert.match(widgetHtml, /canvasight:app-ready/);
    assert.match(widgetHtml, /ui\/notifications\/tool-result/);
    assert.match(widgetHtml, /openai:set_globals/);
    assert.match(widgetHtml, /widget-ready/);
    await assertDynamicWidgetRuntimeApi();
    await assertWidgetBootstrapContracts(widgetHtml);

    const openAttemptEventsBefore = (await readMcpLifecycleLog()).filter(
      (entry) => entry.event === "canvasight_open_attempt_created"
    );
    const widgetOpened = await request("tools/call", {
      name: "render_canvasight_canvas_widget",
      arguments: {
        language: "zh"
      }
    });
    const widgetOpenedData = widgetDataFor(widgetOpened);
    const openAttemptEventsAfter = (await readMcpLifecycleLog()).filter(
      (entry) => entry.event === "canvasight_open_attempt_created"
    );
    assert.equal(
      openAttemptEventsAfter.length,
      openAttemptEventsBefore.length + 1,
      "one native open tool call must create exactly one OpenAttempt"
    );
    assert.equal(openAttemptEventsAfter.at(-1)?.sessionId, widgetOpened.structuredContent.sessionId);
    assert.equal(openAttemptEventsAfter.at(-1)?.openAttemptId, widgetOpened.structuredContent.openAttemptId);
    assert.equal(widgetOpenedData.openAttemptId, widgetOpened.structuredContent.openAttemptId);
    assert.equal(Number.isFinite(widgetOpenedData.bindingIssuedAt), true, "private widget metadata includes an ordered binding generation");
    assert.equal(widgetOpened.structuredContent.bindingIssuedAt, undefined, "binding generation remains private widget metadata");
    const fullscreenInstanceId = "widget-fullscreen-smoke";
    const inlineInstanceId = "widget-inline-smoke";
    const widgetIdentity = (overrides = {}) => ({
      openAttemptId: widgetOpenedData.openAttemptId,
      widgetInstanceId: fullscreenInstanceId,
      startupStage: "connecting_session",
      displayMode: "fullscreen",
      threadId: "thread-smoke",
      reactMounted: true,
      ...overrides
    });
    daemonToken = new URL(widgetOpenedData.url).searchParams.get("token") || daemonToken;
    assert.equal(widgetOpened.structuredContent.activeCanvasContext, true);
    assert.equal(widgetOpenedData.browserUrl, widgetOpenedData.url);
    assert.equal(widgetOpenedData.apiBaseUrl, widgetOpenedData.origin);
    assert.equal(widgetOpenedData.token, new URL(widgetOpenedData.url).searchParams.get("token"));
    assert.deepEqual(Object.keys(widgetOpened._meta), ["widgetData"]);
    const widgetResourceAfterOpen = await request("resources/read", {
      uri: "ui://widget/canvasight/canvas.html"
    });
    assert.ok(widgetResourceAfterOpen.contents[0]._meta["openai/widgetCSP"].connect_domains.includes(widgetOpenedData.origin));
    daemonToken = new URL(widgetOpenedData.url).searchParams.get("token") || daemonToken;
    const preflightResponse = await fetch(`${widgetOpenedData.origin}/api/health`, {
      method: "OPTIONS",
      headers: {
        origin: "null",
        "access-control-request-method": "GET",
        "access-control-request-headers": "content-type,x-canvasight-token",
        "access-control-request-private-network": "true"
      }
    });
    assert.equal(preflightResponse.status, 204);
    assert.equal(preflightResponse.headers.get("access-control-allow-private-network"), "true");
    const widgetPageResponse = await fetch(widgetOpenedData.browserUrl);
    assert.equal(widgetPageResponse.ok, true);
    assert.match(await widgetPageResponse.text(), /id="root"/);
    const widgetSessionProxy = await request("tools/call", {
      name: "canvasight_widget_api",
      arguments: {
        path: `/api/sessions/${widgetOpened.structuredContent.sessionId}`,
        method: "GET",
        ...widgetIdentity()
      }
    });
    assert.equal(widgetSessionProxy.structuredContent.ok, true);
    const widgetSession = widgetSessionProxy.structuredContent.data;
    assert.equal(widgetSession.codexThreadId, "thread-smoke");
    assert.equal(widgetSession.openAttempt.openAttemptId, widgetOpenedData.openAttemptId);
    assert.equal(widgetSession.openAttempt.status, "opening");
    const widgetSkillsProxy = await request("tools/call", {
      name: "canvasight_widget_api",
      arguments: {
        path: `/api/skills?projectPath=${encodeURIComponent(defaultProjectPath)}&query=figma&forceReload=true`,
        method: "GET",
        ...widgetIdentity()
      }
    });
    assert.equal(widgetSkillsProxy.structuredContent.ok, true);
    assert.deepEqual(widgetSkillsProxy.structuredContent.data.skills.map((skill) => skill.name), ["figma"]);
    assert.doesNotMatch(JSON.stringify(widgetSkillsProxy.structuredContent.data), /\/private\/secret|SKILL\.md/);
    const widgetCompleteSkillsProxy = await request("tools/call", {
      name: "canvasight_widget_api",
      arguments: {
        path: `/api/skills?projectPath=${encodeURIComponent(defaultProjectPath)}`,
        method: "GET",
        ...widgetIdentity()
      }
    });
    assert.equal(widgetCompleteSkillsProxy.structuredContent.data.count, 2);
    assert.equal(widgetCompleteSkillsProxy.structuredContent.data.total, 2);
    assert.deepEqual(widgetCompleteSkillsProxy.structuredContent.data.skills.map((skill) => skill.name), ["figma", "pdf"]);
    const widgetDefaultPreferences = await request("tools/call", {
      name: "canvasight_widget_api",
      arguments: {
        path: "/api/preferences",
        method: "GET",
        ...widgetIdentity()
      }
    });
    assert.deepEqual(widgetDefaultPreferences.structuredContent.data, { aiSkillAssignmentEnabled: false });
    const widgetSavedPreferences = await request("tools/call", {
      name: "canvasight_widget_api",
      arguments: {
        path: "/api/preferences",
        method: "PUT",
        body: { aiSkillAssignmentEnabled: true, ignored: "not persisted" },
        ...widgetIdentity()
      }
    });
    assert.deepEqual(widgetSavedPreferences.structuredContent.data, { aiSkillAssignmentEnabled: true });
    assert.deepEqual(JSON.parse(await fsp.readFile(path.join(canvasightHome, "preferences.json"), "utf8")), {
      aiSkillAssignmentEnabled: true
    });
    const forbiddenPreferencesQuery = await request("tools/call", {
      name: "canvasight_widget_api",
      arguments: {
        path: "/api/preferences?projectPath=secret",
        method: "GET",
        ...widgetIdentity()
      }
    }).catch((error) => error);
    assert.match(forbiddenPreferencesQuery.message, /query parameters are not allowed/);
    const widgetReadyBeforeAck = await request("tools/call", {
      name: "await_canvasight_widget_ready",
      arguments: {
        sessionId: widgetOpened.structuredContent.sessionId,
        openAttemptId: widgetOpenedData.openAttemptId,
        threadId: "thread-smoke",
        timeoutMs: 10
      }
    });
    assert.equal(widgetReadyBeforeAck.structuredContent.status, "timeout");
    assert.equal(widgetReadyBeforeAck.structuredContent.verified, false, "an early bridge-stage report is not ready evidence");
    const inlineReadyAckProxy = await request("tools/call", {
      name: "canvasight_widget_api",
      arguments: {
        path: `/api/sessions/${widgetOpened.structuredContent.sessionId}/widget-ready`,
        method: "POST",
        body: {
          status: "ready",
          stage: "ready",
          openAttemptId: widgetOpenedData.openAttemptId,
          widgetInstanceId: inlineInstanceId,
          displayMode: "inline",
          threadId: "thread-smoke",
          reactMounted: true,
          projectHydrated: true,
          canvasRendered: true,
          canvasVisible: true,
          canvasWidth: 800,
          canvasHeight: 600
        },
        ...widgetIdentity({ widgetInstanceId: inlineInstanceId, startupStage: "hydrating_project", displayMode: "inline" })
      }
    });
    assert.equal(inlineReadyAckProxy.structuredContent.ok, false);
    assert.equal(inlineReadyAckProxy.structuredContent.code, "fullscreen_instance_required");
    const widgetReadyAfterInline = await request("tools/call", {
      name: "await_canvasight_widget_ready",
      arguments: {
        sessionId: widgetOpened.structuredContent.sessionId,
        openAttemptId: widgetOpenedData.openAttemptId,
        threadId: "thread-smoke",
        timeoutMs: 10
      }
    });
    assert.equal(widgetReadyAfterInline.structuredContent.status, "timeout", "inline/hidden renderers cannot satisfy fullscreen ready");

    const wrongAttemptProxy = await request("tools/call", {
      name: "canvasight_widget_api",
      arguments: {
        path: `/api/sessions/${widgetOpened.structuredContent.sessionId}`,
        method: "GET",
        ...widgetIdentity({ openAttemptId: "open-wrong" })
      }
    });
    assert.equal(wrongAttemptProxy.structuredContent.ok, false);
    assert.equal(wrongAttemptProxy.structuredContent.code, "open_attempt_mismatch");
    const wrongThreadProxy = await request("tools/call", {
      name: "canvasight_widget_api",
      arguments: {
        path: `/api/sessions/${widgetOpened.structuredContent.sessionId}`,
        method: "GET",
        ...widgetIdentity({ threadId: "thread-other" })
      }
    });
    assert.equal(wrongThreadProxy.structuredContent.ok, false);
    assert.equal(wrongThreadProxy.structuredContent.code, "widget_thread_mismatch");

    const widgetReadyAckProxy = await request("tools/call", {
      name: "canvasight_widget_api",
      arguments: {
        path: `/api/sessions/${widgetOpened.structuredContent.sessionId}/widget-ready`,
        method: "POST",
        body: {
          status: "ready",
          stage: "ready",
          openAttemptId: widgetOpenedData.openAttemptId,
          widgetInstanceId: fullscreenInstanceId,
          displayMode: "fullscreen",
          threadId: "thread-smoke",
          reactMounted: true,
          projectHydrated: true,
          canvasRendered: true,
          canvasVisible: true,
          canvasWidth: 800,
          canvasHeight: 600
        },
        ...widgetIdentity({ startupStage: "hydrating_project" })
      }
    });
    assert.equal(widgetReadyAckProxy.structuredContent.ok, true);
    const widgetReadyAck = widgetReadyAckProxy.structuredContent.data;
    assert.equal(widgetReadyAck.status, "ready");
    assert.equal(widgetReadyAck.reactMounted, true);
    const widgetReadyAfterAck = await request("tools/call", {
      name: "await_canvasight_widget_ready",
      arguments: {
        sessionId: widgetOpened.structuredContent.sessionId,
        openAttemptId: widgetOpenedData.openAttemptId,
        threadId: "thread-smoke",
        timeoutMs: 10
      }
    });
    assert.equal(widgetReadyAfterAck.structuredContent.status, "ready");
    assert.equal(widgetReadyAfterAck.structuredContent.reactMounted, true);
    assert.equal(widgetReadyAfterAck.structuredContent.verified, true);
    assert.equal(widgetReadyAfterAck.structuredContent.displayMode, "fullscreen");
    assert.equal(widgetReadyAfterAck.structuredContent.widgetInstanceId, fullscreenInstanceId);
    assert.equal(widgetReadyAfterAck.structuredContent.projectHydrated, true);
    assert.equal(widgetReadyAfterAck.structuredContent.canvasRendered, true);
    assert.equal(widgetReadyAfterAck.structuredContent.canvasVisible, true);
    assert.equal(widgetReadyAfterAck.structuredContent.sessionId, widgetOpened.structuredContent.sessionId);
    const widgetReadyWrongThread = await request("tools/call", {
      name: "await_canvasight_widget_ready",
      arguments: {
        sessionId: widgetOpened.structuredContent.sessionId,
        openAttemptId: widgetOpenedData.openAttemptId,
        threadId: "thread-other",
        timeoutMs: 10
      }
    });
    assert.equal(widgetReadyWrongThread.structuredContent.status, "failed");
    assert.match(widgetReadyWrongThread.structuredContent.error, /different Codex task/);
    await request("tools/call", {
      name: "close_canvasight",
      arguments: {
        sessionId: widgetOpened.structuredContent.sessionId
      }
    });

    const defaultOpened = await request("tools/call", {
      name: "open_canvasight",
      arguments: {
        language: "zh"
      }
    });
    assertNativeWidgetPublicResult(defaultOpened);
    await request("tools/call", {
      name: "close_canvasight",
      arguments: {
        sessionId: defaultOpened.structuredContent.sessionId
      }
    });

    const browserFallbackOpened = await request("tools/call", {
      name: "open_canvasight_browser_fallback",
      arguments: {
        language: "zh"
      }
    });
    assert.equal(browserFallbackOpened.structuredContent.status, "opened");
    assert.equal(browserFallbackOpened.structuredContent.openTarget, "codex_in_app_browser");
    assert.equal(browserFallbackOpened._meta?.["openai/outputTemplate"], undefined);
    await request("tools/call", {
      name: "close_canvasight",
      arguments: {
        sessionId: browserFallbackOpened.structuredContent.sessionId
      }
    });

    const autoOpened = await request("tools/call", {
      name: "open_canvasight",
      arguments: {
        language: "zh"
      }
    });
    const autoOpenedData = widgetDataFor(autoOpened);
    daemonToken = new URL(autoOpenedData.url).searchParams.get("token") || daemonToken;
    assert.equal(autoOpenedData.browserUrl, autoOpenedData.url);
    assert.match(autoOpened.content[0].text, /native widget session created/);
    assert.match(autoOpened.content[0].text, /await_canvasight_widget_ready/);
    assert.equal(autoOpened.structuredContent.activeCanvasContext, true);
    assert.equal(autoOpened.structuredContent.activeCanvasRouting.status, "active");
    assert.equal(autoOpened.structuredContent.canvasRouting.activeCanvasContext, true);
    assert.equal(autoOpened.structuredContent.canvasRouting.preferredTool, "write_canvasight_graph");
    assert.equal(autoOpened.structuredContent.canvasRouting.preferredMode, "append-page");
    assert.equal(autoOpened.structuredContent.canvasRouting.templateDiscoveryTool, "list_canvasight_node_templates");
    assert.equal(autoOpened.structuredContent.canvasRouting.skillDiscoveryTool, "list_canvasight_skills");
    assert.equal(autoOpened.structuredContent.canvasRouting.fullTemplateTool, "get_canvasight_node_template");
    assert.match(autoOpened.content[0].text, /Canvasight is now active for this project/);
    assert.match(autoOpened.content[0].text, /editable canvas page/);
    assert.match(autoOpened.structuredContent.canvasRouting.instruction, /write_canvasight_graph/);
    assert.equal(autoOpened.structuredContent.projectPath, defaultProjectPath);
    assert.equal(await fsp.stat(path.join(defaultProjectPath, ".scatter", "scatter.json")).then((stat) => stat.isFile()), true);
    const autoPageResponse = await fetch(autoOpenedData.browserUrl);
    assert.equal(autoPageResponse.ok, true);
    assert.match(await autoPageResponse.text(), /id="root"/);
    const autoHealth = await fetchJson(`${autoOpenedData.origin}/api/health`);
    assert.equal(autoHealth.serverVersion, expectedPluginVersion);
    const autoSession = await fetchJson(`${autoOpenedData.origin}/api/sessions/${autoOpened.structuredContent.sessionId}`);
    assert.equal(autoSession.codexThreadId, "thread-smoke");
    assert.equal(autoSession.documentRevision, 0);
    assert.equal(autoSession.language, "zh");
    assert.equal(autoSession.projectPath, defaultProjectPath);
    assert.equal(autoSession.sessionId, autoOpened.structuredContent.sessionId);
    assert.equal(typeof autoSession.threadClaimedAt, "string");
    const recentAfterAutoOpen = await request("tools/call", {
      name: "list_canvasight_recent_projects",
      arguments: {}
    });
    assert.equal(recentAfterAutoOpen.structuredContent.status, "listed");
    assert.equal(recentAfterAutoOpen.structuredContent.projects[0].path, defaultProjectPath);
    assert.equal(recentAfterAutoOpen.structuredContent.projects[0].hasScatter, true);
    await request("tools/call", {
      name: "close_canvasight",
      arguments: {
        sessionId: autoOpened.structuredContent.sessionId
      }
    });

    await fsp.writeFile(resumeFailPath, "thread-smoke\n", "utf8");
    await assert.rejects(
      () =>
        request("tools/call", {
          name: "open_canvasight",
          arguments: {}
        }),
      /project path.*cannot.*determined|current Codex task.*project|projectPath.*required|thread\/resume/i,
      "A failed thread/resume must not silently bind a native Canvasight session to the default project."
    );
    const explicitProjectAfterResumeFailure = path.join(tempRoot, "explicit-project-after-resume-failure");
    const explicitlyOpenedAfterResumeFailure = await request("tools/call", {
      name: "open_canvasight",
      arguments: {
        projectPath: explicitProjectAfterResumeFailure
      }
    });
    assert.equal(explicitlyOpenedAfterResumeFailure.structuredContent.projectPath, explicitProjectAfterResumeFailure);
    assert.equal(fs.existsSync(path.join(explicitProjectAfterResumeFailure, ".scatter", "scatter.json")), true);
    await request("tools/call", {
      name: "close_canvasight",
      arguments: {
        sessionId: explicitlyOpenedAfterResumeFailure.structuredContent.sessionId
      }
    });
    await fsp.writeFile(resumeFailPath, "", "utf8");

    const projectPath = path.join(tempRoot, "demo-project");
    const opened = await request("tools/call", {
      name: "open_canvasight",
      arguments: {
        projectPath,
        language: "en"
      }
    });
    const openedData = widgetDataFor(opened);
    daemonToken = new URL(openedData.url).searchParams.get("token") || daemonToken;
    assert.equal(openedData.browserUrl, openedData.url);
    assert.equal(opened.structuredContent.activeCanvasContext, true);
    assert.equal(opened.structuredContent.canvasRouting.preferredTool, "write_canvasight_graph");
    assert.equal(opened.structuredContent.activeCanvasRouting.preferredMode, "append-page");
    assert.equal(opened.structuredContent.projectPath, projectPath);
    assert.equal(opened.structuredContent.codexThreadId, "thread-smoke");

    const recentAfterProjectOpen = await request("tools/call", {
      name: "list_canvasight_recent_projects",
      arguments: {
        limit: 2
      }
    });
    assert.equal(recentAfterProjectOpen.structuredContent.projects.length, 2);
    assert.equal(recentAfterProjectOpen.structuredContent.projects[0].path, projectPath);
    assert.equal(recentAfterProjectOpen.structuredContent.projects[1].path, explicitProjectAfterResumeFailure);

    const recentOpened = await request("tools/call", {
      name: "open_canvasight_recent_project",
      arguments: {
        language: "zh"
      }
    });
    assertNativeWidgetPublicResult(recentOpened);
    assert.equal(recentOpened.structuredContent.projectPath, projectPath);
    assert.equal(recentOpened.structuredContent.language, "zh");
    await request("tools/call", {
      name: "close_canvasight",
      arguments: {
        sessionId: recentOpened.structuredContent.sessionId
      }
    });

    const sessionId = opened.structuredContent.sessionId;
    const origin = openedData.origin;
    const session = await fetchJson(`${origin}/api/sessions/${sessionId}`);
    assert.equal(session.codexThreadId, "thread-smoke");
    assert.equal(session.documentRevision, 0);
    assert.equal(session.language, "en");
    assert.equal(session.projectPath, projectPath);
    assert.equal(session.sessionId, sessionId);
    assert.equal(typeof session.threadClaimedAt, "string");

    // Hydrating an explicitly opened workspace must retain its folder binding
    // even if the current Codex thread can no longer be resumed.
    await fsp.writeFile(resumeFailPath, "thread-smoke\n", "utf8");
    const hydratedProject = await fetchJson(`${origin}/api/sessions/${sessionId}/resolve-thread-project`, {
      method: "POST",
      body: JSON.stringify({ threadId: "thread-smoke" })
    });
    assert.equal(hydratedProject.project.path, projectPath);
    assert.equal(hydratedProject.session.projectPath, projectPath);
    assert.equal(hydratedProject.session.codexThreadId, "thread-smoke");
    await fsp.writeFile(resumeFailPath, "", "utf8");

    const openedWidgetInstanceId = "widget-project-fullscreen-smoke";
    const openedIdentityHeaders = {
      "x-canvasight-open-attempt-id": openedData.openAttemptId,
      "x-canvasight-widget-instance-id": openedWidgetInstanceId,
      "x-canvasight-startup-stage": "hydrating_project",
      "x-canvasight-display-mode": "fullscreen",
      "x-canvasight-thread-id": "thread-smoke",
      "x-canvasight-react-mounted": "true"
    };
    const openedReady = await fetchJson(`${origin}/api/sessions/${sessionId}/widget-ready`, {
      method: "POST",
      headers: openedIdentityHeaders,
      body: JSON.stringify({
        status: "ready",
        stage: "ready",
        openAttemptId: openedData.openAttemptId,
        widgetInstanceId: openedWidgetInstanceId,
        displayMode: "fullscreen",
        threadId: "thread-smoke",
        reactMounted: true,
        projectHydrated: true,
        canvasRendered: true,
        canvasVisible: true,
        canvasWidth: 1200,
        canvasHeight: 800
      })
    });
    assert.equal(openedReady.verified, true);

    const emptyTemplates = await fetchJson(`${origin}/api/templates`);
    assert.deepEqual(emptyTemplates, []);
    const templateSourceAttachmentPath = path.join(tempRoot, "template-source.txt");
    await fsp.writeFile(templateSourceAttachmentPath, "template attachment", "utf8");
    const savedTemplate = await fetchJson(`${origin}/api/templates`, {
      method: "POST",
      body: JSON.stringify({
        template: {
          title: "Smoke template",
          body: "Use this reusable prompt in any project.",
          attachments: [
            {
              id: "template-source",
              kind: "file",
              source: "upload",
              originalName: "template-source.txt",
              storedPath: templateSourceAttachmentPath,
              relativePath: "",
              fileUrl: "",
              mime: "text/plain",
              size: 19,
              createdAt: "2026-07-04T00:00:00.000Z"
            }
          ]
        }
      })
    });
    assert.equal(savedTemplate.title, "Smoke template");
    assert.equal(savedTemplate.attachments.length, 1);
    assert.equal(savedTemplate.attachments[0].originalName, "template-source.txt");
    assert.equal(savedTemplate.attachments[0].storedPath.startsWith(canvasightHome), true);
    assert.equal(await fsp.readFile(savedTemplate.attachments[0].storedPath, "utf8"), "template attachment");
    const templateAssetResponse = await fetch(`${origin}${savedTemplate.attachments[0].fileUrl}`);
    assert.equal(templateAssetResponse.ok, true);
    assert.equal(await templateAssetResponse.text(), "template attachment");
    const templatesAfterSave = await fetchJson(`${origin}/api/templates`);
    assert.equal(templatesAfterSave.length, 1);
    assert.equal(templatesAfterSave[0].id, savedTemplate.id);

    const openProject = await fetchJson(`${origin}/api/sessions/${sessionId}/open-project`, {
      method: "POST",
      body: JSON.stringify({ projectPath })
    });
    assert.equal(openProject.document.version, 1);
    assert.equal(openProject.documentRevision, 0);
    assert.equal(openProject.project.path, projectPath);
    assert.equal(Array.isArray(openProject.document.pages), true);
    assert.equal(openProject.document.pages.length, 1);
    assert.equal(openProject.document.activePageId, openProject.document.pages[0].id);

    await assertSkillAssignmentAndContentModeContracts(origin);
    await assertGraphContextMergeAndValidationContracts();
    await assertUniversalHorizontalAndBlueprintTopologyContracts();
    await assertSoftwareProductMergeGuidanceContracts();

    const graphWritten = await request("tools/call", {
      name: "write_canvasight_graph",
      arguments: {
        projectPath,
        graphType: "codebase-structure",
        pageName: "Code Architecture",
        nodes: [
          {
            id: "entry",
            title: "Entry points",
            body: "Map CLI and browser entry points.",
            codexMode: "chat"
          },
          {
            id: "api",
            title: "API layer",
            body: "Summarize HTTP and MCP API responsibilities.",
            codexMode: "plan"
          },
          {
            id: "store",
            title: "Canvas store",
            body: "Explain page, node, and edge state ownership.",
            codexMode: "goal"
          }
        ],
        edges: [
          {
            id: "entry-api",
            source: "entry",
            target: "api",
            label: "calls"
          },
          {
            id: "api-store",
            source: "api",
            target: "store",
            label: "updates"
          }
        ]
      }
    });
    assert.equal(graphWritten.structuredContent.status, "written");
    assert.equal(graphWritten.structuredContent.projectPath, projectPath);
    assert.equal(graphWritten.structuredContent.graphType, "codebase-structure");
    assert.equal(graphWritten.structuredContent.activePageName, "Code Architecture");
    assert.deepEqual(graphWritten.structuredContent.nodeIds, ["entry", "api", "store"]);
    assert.deepEqual(graphWritten.structuredContent.edgeIds, ["entry-api", "api-store"]);
    assert.equal(typeof graphWritten.structuredContent.documentRevision, "number");
    assert.equal(graphWritten.structuredContent.documentRevision > openProject.documentRevision, true);
    const sessionAfterGraphWrite = await fetchJson(`${origin}/api/sessions/${sessionId}`);
    assert.equal(sessionAfterGraphWrite.documentRevision, graphWritten.structuredContent.documentRevision);

    const staleDocumentSave = await fetch(`${origin}/api/sessions/${sessionId}/document`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-canvasight-token": daemonToken
      },
      body: JSON.stringify({
        projectPath,
        document: openProject.document,
        expectedRevision: openProject.documentRevision
      })
    });
    assert.equal(staleDocumentSave.status, 409);
    assert.deepEqual(await staleDocumentSave.json(), {
      code: "stale_document",
      error: "Canvasight document changed outside this session. Reload required."
    });
    const missingRevisionDocumentSave = await fetch(`${origin}/api/sessions/${sessionId}/document`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-canvasight-token": daemonToken
      },
      body: JSON.stringify({
        projectPath,
        document: openProject.document
      })
    });
    assert.equal(missingRevisionDocumentSave.status, 409);
    assert.deepEqual(await missingRevisionDocumentSave.json(), {
      code: "stale_document",
      error: "Canvasight document revision is required. Reload required."
    });

    const graphScatterJson = JSON.parse(await fsp.readFile(path.join(projectPath, ".scatter", "scatter.json"), "utf8"));
    assert.equal(graphScatterJson.version, 1);
    assert.equal(graphScatterJson.projectName, "demo-project");
    assert.equal(graphScatterJson.activePageId, graphWritten.structuredContent.activePageId);
    assert.equal(graphScatterJson.pages.length, 2);
    assert.equal(graphScatterJson.nodes.length, 3);
    assert.equal(graphScatterJson.edges.length, 2);
    assert.equal("codexMode" in graphScatterJson.nodes[1].data, false, "legacy graph Plan fields are removed on persistence");
    assert.equal("planMode" in graphScatterJson.nodes[1].data, false);
    assert.equal("codexMode" in graphScatterJson.nodes[2].data, false, "legacy graph Goal fields are removed on persistence");
    assert.equal(graphScatterJson.nodes[0].position.x, 0);
    assert.equal(graphScatterJson.nodes[1].position.x, 680);
    assert.equal(graphScatterJson.nodes[2].position.x, 1360);
    assert.equal(graphScatterJson.nodes[2].position.y, 0);
    assert.equal(graphScatterJson.edges[0].source, "entry");
    assert.equal(graphScatterJson.edges[1].target, "store");

    const articleReplace = await request("tools/call", {
      name: "write_canvasight_graph",
      arguments: {
        projectPath,
        mode: "replace-active-page",
        graphType: "article-outline",
        layout: "vertical",
        pageName: "Article Outline",
        nodes: [
          { id: "thesis", title: "Thesis", body: "Capture the article's central claim." },
          { id: "evidence", title: "Evidence", body: "Track the strongest supporting section." }
        ],
        edges: [{ id: "thesis-evidence", source: "thesis", target: "evidence" }]
      }
    });
    assert.equal(articleReplace.structuredContent.status, "written");
    assert.equal(articleReplace.structuredContent.graphType, "article-outline");
    assert.equal(articleReplace.structuredContent.validation.advisories.some((item) => item.code === "deprecated_graph_layout" && item.path === "layout"), true);
    assert.equal(articleReplace.structuredContent.activePageId, graphWritten.structuredContent.activePageId);
    const articleScatterJson = JSON.parse(await fsp.readFile(path.join(projectPath, ".scatter", "scatter.json"), "utf8"));
    assert.equal(articleScatterJson.pages.length, 2);
    assert.equal(articleScatterJson.activePageId, graphWritten.structuredContent.activePageId);
    assert.equal(articleScatterJson.nodes.length, 2);
    assert.equal(articleScatterJson.nodes[0].position.x, 0);
    assert.equal(articleScatterJson.nodes[1].position.x, 680);
    assert.equal(articleScatterJson.nodes[1].position.y, 0);

    const fanOutGraph = await request("tools/call", {
      name: "write_canvasight_graph",
      arguments: {
        projectPath,
        graphType: "task-plan",
        pageName: "Fan-out Requirements",
        layout: "grid",
        nodes: [
          { id: "root", title: "Product goal", body: "Define the core product outcome." },
          { id: "research", title: "Research", body: "Collect user and market constraints." },
          { id: "design", title: "Design", body: "Turn constraints into interface structure." },
          { id: "build", title: "Build", body: "Implement the selected product path." }
        ],
        edges: [
          { id: "root-research", source: "root", target: "research" },
          { id: "root-design", source: "root", target: "design" },
          { id: "root-build", source: "root", target: "build" }
        ]
      }
    });
    assert.equal(fanOutGraph.structuredContent.status, "written");
    assert.equal(fanOutGraph.structuredContent.graphType, "task-plan");
    assert.equal(
      fanOutGraph.structuredContent.validation.advisories.some(
        (item) => item.code === "deprecated_graph_layout" && item.path === "layout"
      ),
      true
    );
    assert.equal(fanOutGraph.structuredContent.activePageName, "Fan-out Requirements");
    assert.deepEqual(fanOutGraph.structuredContent.nodeIds, ["root", "research", "design", "build"]);
    assert.deepEqual(fanOutGraph.structuredContent.edgeIds, ["root-research", "root-design", "root-build"]);

    const fanOutScatterJson = JSON.parse(await fsp.readFile(path.join(projectPath, ".scatter", "scatter.json"), "utf8"));
    assert.equal(fanOutScatterJson.pages.length, 3);
    assert.equal(fanOutScatterJson.nodes.length, 4);
    assert.equal(fanOutScatterJson.edges.length, 3);
    assertUniqueNodePositions(fanOutScatterJson.nodes, "Fan-out graph");
    assertNoNodeBoundsOverlap(fanOutScatterJson.nodes, "Fan-out graph");
    assertHorizontalEdgeDirection(fanOutScatterJson.nodes, fanOutScatterJson.edges, "Fan-out graph");
    assert.equal(fanOutScatterJson.edges.every((edge) => edge.source === "root"), true);
    assert.deepEqual(
      fanOutScatterJson.edges.map((edge) => edge.target),
      ["research", "design", "build"]
    );
    assert.deepEqual(
      fanOutScatterJson.nodes.map((node) => [node.id, node.position.x, node.position.y]),
      [
        ["root", 0, 380],
        ["research", 680, 0],
        ["design", 680, 380],
        ["build", 680, 760]
      ]
    );

    const pageLayoutGraph = await request("tools/call", {
      name: "write_canvasight_graph",
      arguments: {
        projectPath,
        graphType: "general",
        pages: [
          {
            id: "legacy-vertical-page",
            name: "Legacy page layout",
            layout: "vertical",
            nodes: [
              { id: "page-layout-root", title: "Page root", body: "Define the page-level layout compatibility input." },
              { id: "page-layout-child", title: "Page child", body: "Verify the normalized horizontal result." }
            ],
            edges: [{ id: "page-layout-edge", source: "page-layout-root", target: "page-layout-child" }]
          }
        ]
      }
    });
    assert.equal(pageLayoutGraph.structuredContent.status, "written");
    assert.equal(
      pageLayoutGraph.structuredContent.validation.advisories.some(
        (item) => item.code === "deprecated_graph_layout" && item.path === "pages[0].layout"
      ),
      true
    );
    assertHorizontalEdgeDirection(
      pageLayoutGraph.structuredContent.document.nodes,
      pageLayoutGraph.structuredContent.document.edges,
      "Legacy page-level vertical layout"
    );
    assert.deepEqual(
      pageLayoutGraph.structuredContent.document.nodes.map((node) => [node.id, node.position.x, node.position.y]),
      [
        ["page-layout-root", 0, 0],
        ["page-layout-child", 680, 0]
      ]
    );

    const explicitPositionGraph = await request("tools/call", {
      name: "write_canvasight_graph",
      arguments: {
        projectPath,
        graphType: "task-plan",
        pageName: "Explicit Position Preservation",
        layout: "vertical",
        layoutPolicy: "preserve-explicit",
        nodes: [
          { id: "fixed-root", title: "Fixed root", body: "Keep both explicit coordinates.", position: { x: 111, y: 222 } },
          { id: "auto-child", title: "Auto child", body: "Receive edge-aware automatic coordinates." },
          { id: "fixed-x-child", title: "Fixed X child", body: "Keep explicit x and auto-place y.", x: 900 }
        ],
        edges: [
          { id: "fixed-root-auto", source: "fixed-root", target: "auto-child" },
          { id: "fixed-root-fixed-x", source: "fixed-root", target: "fixed-x-child" }
        ]
      }
    });
    assert.equal(explicitPositionGraph.structuredContent.status, "written");
    assert.equal(explicitPositionGraph.structuredContent.validation.advisories.some((item) => item.code === "deprecated_graph_layout"), true);
    const explicitPositionScatterJson = JSON.parse(await fsp.readFile(path.join(projectPath, ".scatter", "scatter.json"), "utf8"));
    assertUniqueNodePositions(explicitPositionScatterJson.nodes, "Explicit position graph");
    assert.deepEqual(
      explicitPositionScatterJson.nodes.map((node) => [node.id, node.position.x, node.position.y]),
      [
        ["fixed-root", 111, 222],
        ["auto-child", 680, 0],
        ["fixed-x-child", 900, 380]
      ]
    );

    const productGraph = await request("tools/call", {
      name: "write_canvasight_graph",
      arguments: {
        projectPath,
        graphType: "software-product",
        pageName: "Product Build Breakdown",
        nodes: [
          { id: "product-goal", title: "Product goal", body: "Define the user outcome and success boundary." },
          { id: "project-docs", title: "Project guidance", body: "Check project guidance files and create follow-up tasks when required." },
          { id: "feature-scope", title: "Feature scope", body: "Separate required behavior, non-goals, and edge cases." },
          { id: "design-style", title: "Design style", body: "Define layout, interaction, density, and visual language requirements." },
          { id: "technical-plan", title: "Technical plan", body: "Map implementation modules, data contracts, persistence, and verification." }
        ],
        edges: [
          { id: "goal-docs", source: "product-goal", target: "project-docs" },
          { id: "goal-scope", source: "product-goal", target: "feature-scope" },
          { id: "goal-design", source: "product-goal", target: "design-style" },
          { id: "goal-tech", source: "product-goal", target: "technical-plan" }
        ]
      }
    });
    assert.equal(productGraph.structuredContent.status, "written");
    assert.equal(productGraph.structuredContent.graphType, "software-product");
    assert.deepEqual(productGraph.structuredContent.nodeIds, [
      "product-goal",
      "project-docs",
      "feature-scope",
      "design-style",
      "technical-plan",
      "project-guidance-agents-md",
      "project-guidance-design-md"
    ]);
    assert.deepEqual(productGraph.structuredContent.edgeIds, [
      "goal-docs",
      "goal-scope",
      "goal-design",
      "goal-tech",
      "project-guidance-edge-1",
      "project-guidance-edge-2"
    ]);
    assert.deepEqual(
      productGraph.structuredContent.projectGuidanceNodes.map((node) => node.fileName),
      ["AGENTS.md", "design.md"]
    );
    const productScatterJson = JSON.parse(await fsp.readFile(path.join(projectPath, ".scatter", "scatter.json"), "utf8"));
    assert.equal(productScatterJson.pages.length, 6);
    assertUniqueNodePositions(productScatterJson.nodes, "Software product graph");
    assertNoNodeBoundsOverlap(productScatterJson.nodes, "Software product graph");
    assertHorizontalEdgeDirection(productScatterJson.nodes, productScatterJson.edges, "Software product graph");
    assert.equal(productScatterJson.nodes[0].position.x, 0);
    assert.equal(productScatterJson.nodes[0].position.y, 950);
    assert.equal(productScatterJson.nodes[2].position.x, 680);
    assert.equal(productScatterJson.nodes[2].position.y, 380);
    assert.equal(productScatterJson.nodes.find((node) => node.id === "project-guidance-agents-md").position.y, 1520);
    assert.equal(productScatterJson.nodes.find((node) => node.id === "project-guidance-design-md").position.y, 1900);
    assert.equal(productScatterJson.nodes.find((node) => node.id === "project-guidance-agents-md").data.projectGuidanceFile, "AGENTS.md");
    assert.equal(productScatterJson.nodes.find((node) => node.id === "project-guidance-design-md").data.projectGuidanceFile, "design.md");

    const guidedProjectPath = path.join(tempRoot, "guided-product-project");
    await fsp.mkdir(guidedProjectPath, { recursive: true });
    await fsp.writeFile(path.join(guidedProjectPath, "AGENTS.md"), "# Agent rules\n", "utf8");
    await fsp.writeFile(path.join(guidedProjectPath, "design.md"), "# Design rules\n", "utf8");
    const guidedGraph = await request("tools/call", {
      name: "write_canvasight_graph",
      arguments: {
        projectPath: guidedProjectPath,
        graphType: "software-product",
        pageName: "Existing Guidance Files",
        nodes: [{ id: "guided-root", title: "Guided product", body: "Both project guidance files already exist." }]
      }
    });
    assert.deepEqual(guidedGraph.structuredContent.nodeIds, ["guided-root"]);
    assert.deepEqual(guidedGraph.structuredContent.edgeIds, []);
    assert.deepEqual(guidedGraph.structuredContent.projectGuidanceNodes, []);

    const partialGuidanceProjectPath = path.join(tempRoot, "partial-guidance-product-project");
    await fsp.mkdir(partialGuidanceProjectPath, { recursive: true });
    await fsp.writeFile(path.join(partialGuidanceProjectPath, "AGENTS.md"), "# Agent rules\n", "utf8");
    const partialGuidanceGraph = await request("tools/call", {
      name: "write_canvasight_graph",
      arguments: {
        projectPath: partialGuidanceProjectPath,
        graphType: "software-product",
        pageName: "Partial Guidance Files",
        nodes: [{ id: "partial-root", title: "Partial product", body: "Only one project guidance file exists." }]
      }
    });
    assert.deepEqual(partialGuidanceGraph.structuredContent.nodeIds, ["partial-root", "project-guidance-design-md"]);
    assert.deepEqual(partialGuidanceGraph.structuredContent.edgeIds, ["project-guidance-edge-1"]);
    assert.deepEqual(
      partialGuidanceGraph.structuredContent.projectGuidanceNodes.map((node) => node.fileName),
      ["design.md"]
    );

    const nonProductProjectPath = path.join(tempRoot, "non-product-project");
    await fsp.mkdir(nonProductProjectPath, { recursive: true });
    const nonProductGraph = await request("tools/call", {
      name: "write_canvasight_graph",
      arguments: {
        projectPath: nonProductProjectPath,
        graphType: "task-plan",
        pageName: "Task Plan Without Guidance",
        nodes: [{ id: "task-root", title: "Task root", body: "Non-product graph should not add project docs." }]
      }
    });
    assert.deepEqual(nonProductGraph.structuredContent.nodeIds, ["task-root"]);
    assert.deepEqual(nonProductGraph.structuredContent.projectGuidanceNodes, []);

    const isolatedLayoutProjectPath = path.join(tempRoot, "isolated-layout-project");
    await fsp.mkdir(isolatedLayoutProjectPath, { recursive: true });
    const isolatedLayoutGraph = await request("tools/call", {
      name: "write_canvasight_graph",
      arguments: {
        projectPath: isolatedLayoutProjectPath,
        graphType: "task-plan",
        pageName: "Connected And Isolated Nodes",
        nodes: [
          { id: "connected-root", title: "Connected root", body: "Start the connected workflow." },
          { id: "connected-child", title: "Connected child", body: "Continue the connected workflow." },
          { id: "loose-note", title: "Loose note", body: "Stay outside the connected workflow." },
          { id: "loose-reference", title: "Loose reference", body: "Stay grouped with other isolated nodes." }
        ],
        edges: [{ id: "connected-root-child", source: "connected-root", target: "connected-child" }]
      }
    });
    assert.equal(isolatedLayoutGraph.structuredContent.status, "written");
    const isolatedLayoutScatterJson = JSON.parse(await fsp.readFile(path.join(isolatedLayoutProjectPath, ".scatter", "scatter.json"), "utf8"));
    assertUniqueNodePositions(isolatedLayoutScatterJson.nodes, "Isolated node graph");
    assertNoNodeBoundsOverlap(isolatedLayoutScatterJson.nodes, "Isolated node graph");
    assertHorizontalEdgeDirection(isolatedLayoutScatterJson.nodes, isolatedLayoutScatterJson.edges, "Isolated node graph");
    assert.deepEqual(
      isolatedLayoutScatterJson.nodes.map((node) => [node.id, node.position.x, node.position.y]),
      [
        ["connected-root", 0, 0],
        ["connected-child", 680, 0],
        ["loose-note", 0, 380],
        ["loose-reference", 0, 760]
      ]
    );

    const templateAssetPath = path.join(tempRoot, "figma-color-template.md");
    await fsp.writeFile(templateAssetPath, "# Figma color variable checklist\n", "utf8");
    const graphTemplate = await fetchJson(`${origin}/api/templates`, {
      method: "POST",
      body: JSON.stringify({
        template: {
          title: "Figma color variable scaffold",
          body: "Reusable prompt for planning Figma color variables, token hierarchy, modes, and conflict handling.",
          attachments: [
            {
              id: "template-attachment-1",
              kind: "file",
              source: "upload",
              originalName: "figma-color-template.md",
              storedPath: templateAssetPath,
              relativePath: "template-assets/figma-color-template.md",
              fileUrl: "",
              mime: "text/markdown",
              size: 34,
              createdAt: "2026-07-05T00:00:00.000Z"
            }
          ]
        }
      })
    });

    const listedTemplates = await request("tools/call", {
      name: "list_canvasight_node_templates",
      arguments: {
        query: "Figma color",
        limit: 5
      }
    });
    assert.equal(listedTemplates.structuredContent.status, "ok");
    assert.equal(listedTemplates.structuredContent.resultMode, "summary");
    assert.equal(listedTemplates.structuredContent.count, 1);
    assert.equal(listedTemplates.structuredContent.maxTemplates, 200);
    assert.equal(listedTemplates.structuredContent.templates[0].id, graphTemplate.id);
    assert.equal(listedTemplates.structuredContent.templates[0].body, undefined);
    assert.equal(listedTemplates.structuredContent.templates[0].attachments, undefined);
    assert.equal(
      listedTemplates.structuredContent.templates[0].bodyPreview,
      "Reusable prompt for planning Figma color variables, token hierarchy, modes, and conflict handling."
    );
    assert.equal(listedTemplates.structuredContent.templates[0].bodyLength, graphTemplate.body.length);
    assert.equal(listedTemplates.structuredContent.templates[0].attachmentCount, 1);

    const fullListedTemplate = await request("tools/call", {
      name: "get_canvasight_node_template",
      arguments: {
        templateId: graphTemplate.id
      }
    });
    assert.equal(fullListedTemplate.structuredContent.status, "ok");
    assert.equal(fullListedTemplate.structuredContent.template.id, graphTemplate.id);
    assert.equal(fullListedTemplate.structuredContent.template.body, graphTemplate.body);
    assert.equal(fullListedTemplate.structuredContent.template.attachments[0].originalName, "figma-color-template.md");

    const templateGraph = await request("tools/call", {
      name: "write_canvasight_graph",
      arguments: {
        projectPath,
        graphType: "software-product",
        pageName: "Template Reuse",
        nodes: [
          {
            id: "template-by-id",
            templateId: graphTemplate.id,
            codexMode: "goal"
          },
          {
            id: "template-by-query",
            templateQuery: "token hierarchy conflict",
            title: "Template query reuse"
          }
        ],
        edges: [{ id: "template-edge", source: "template-by-id", target: "template-by-query" }]
      }
    });
    assert.equal(templateGraph.structuredContent.status, "written");
    assert.equal(templateGraph.structuredContent.reusedTemplates.length, 2);
    assert.deepEqual(
      templateGraph.structuredContent.reusedTemplates.map((item) => item.match),
      ["templateId", "templateQuery"]
    );
    const templateScatterJson = JSON.parse(await fsp.readFile(path.join(projectPath, ".scatter", "scatter.json"), "utf8"));
    assert.equal(templateScatterJson.nodes[0].data.title, "Figma color variable scaffold");
    assert.equal(templateScatterJson.nodes[0].data.body, "Reusable prompt for planning Figma color variables, token hierarchy, modes, and conflict handling.");
    assert.equal(templateScatterJson.nodes[0].data.attachments[0].originalName, "figma-color-template.md");
    assert.equal(templateScatterJson.nodes[0].data.templateId, graphTemplate.id);
    assert.equal("codexMode" in templateScatterJson.nodes[0].data, false, "legacy template Goal fields are removed");
    assert.equal("planMode" in templateScatterJson.nodes[0].data, false);
    assert.equal(templateScatterJson.nodes[1].data.title, "Template query reuse");
    assert.equal(templateScatterJson.nodes[1].data.body, "Reusable prompt for planning Figma color variables, token hierarchy, modes, and conflict handling.");

    const fullTemplateSet = [
      graphTemplate,
      savedTemplate,
      ...Array.from({ length: 198 }, (_, index) => ({
        id: `bulk-template-${index}`,
        title: `Bulk template ${index}`,
        body: `Bulk template prompt ${index}`,
        attachments: [],
        createdAt: "2026-07-05T00:00:00.000Z",
        updatedAt: "2026-07-05T00:00:00.000Z"
      }))
    ];
    await fsp.writeFile(path.join(canvasightHome, "templates.json"), `${JSON.stringify(fullTemplateSet, null, 2)}\n`, "utf8");
    const rejectedTemplateSave = await fetch(`${origin}/api/templates`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-canvasight-token": daemonToken
      },
      body: JSON.stringify({
        template: {
          title: "Template over limit",
          body: "This save should be rejected until the user explicitly replaces the oldest template.",
          attachments: []
        }
      })
    });
    assert.equal(rejectedTemplateSave.status, 409);
    assert.deepEqual(await rejectedTemplateSave.json(), {
      code: "template_limit_reached",
      error: "Template limit reached (200)"
    });
    const replacementTemplate = await fetchJson(`${origin}/api/templates`, {
      method: "POST",
      body: JSON.stringify({
        replaceOldest: true,
        template: {
          title: "Explicit replacement template",
          body: "This template replaces the oldest saved template.",
          attachments: []
        }
      })
    });
    assert.equal(replacementTemplate.title, "Explicit replacement template");
    const templatesAfterReplacement = await fetchJson(`${origin}/api/templates`);
    assert.equal(templatesAfterReplacement.length, 200);
    assert.equal(templatesAfterReplacement[0].id, replacementTemplate.id);
    assert.equal(templatesAfterReplacement.some((template) => template.id === "bulk-template-197"), false);
    const deleteReplacement = await fetchJson(`${origin}/api/templates/${encodeURIComponent(replacementTemplate.id)}`, {
      method: "DELETE"
    });
    assert.deepEqual(deleteReplacement, {
      status: "deleted",
      templateId: replacementTemplate.id
    });
    const templatesAfterDelete = await fetchJson(`${origin}/api/templates`);
    assert.equal(templatesAfterDelete.length, 199);

    await assert.rejects(
      () =>
        request("tools/call", {
          name: "write_canvasight_graph",
          arguments: {
            projectPath,
            pageName: "Invalid Graph",
            nodes: [
              {
                id: "only-node",
                title: "Only node",
                body: "This graph has an invalid edge."
              }
            ],
            edges: [
              {
                source: "only-node",
                target: "missing-node"
              }
            ]
          }
        }),
      /target must reference an existing node id/
    );

    await assert.rejects(
      () =>
        request("tools/call", {
          name: "write_canvasight_graph",
          arguments: {
            projectPath,
            pageName: "Invalid Parent Graph",
            nodes: [
              { id: "parent-a", title: "Parent A", body: "First parent." },
              { id: "parent-b", title: "Parent B", body: "Second parent." },
              { id: "child", title: "Child", body: "Only one parent is allowed." }
            ],
            edges: [
              { source: "parent-a", target: "child" },
              { source: "parent-b", target: "child" }
            ]
          }
        }),
      /Node already has a parent edge: child/
    );

    const document = {
      version: 1,
      projectName: "demo-project",
      updatedAt: "2026-07-04T00:00:00.000Z",
      activePageId: "page-main",
      viewport: { x: 12, y: 24, zoom: 1 },
      nodes: [
        {
          id: "node-a",
          type: "task",
          position: { x: 0, y: 0 },
          data: {
            title: "Smoke task",
            body: "Run the smoke payload.",
            attachments: [],
            codexMode: "plan",
            effort: "high",
            planMode: true,
            runMode: "flow"
          }
        }
      ],
      edges: [],
      pages: [
        {
          id: "page-main",
          name: "Main Page",
          createdAt: "2026-07-04T00:00:00.000Z",
          updatedAt: "2026-07-04T00:00:00.000Z",
          viewport: { x: 12, y: 24, zoom: 1 },
          nodes: [
            {
              id: "node-a",
              type: "task",
              position: { x: 0, y: 0 },
              data: {
                title: "Smoke task",
                body: "Run the smoke payload.",
                attachments: [],
                codexMode: "plan",
                effort: "high",
                planMode: true,
                runMode: "flow"
              }
            }
          ],
          edges: []
        },
        {
          id: "page-empty",
          name: "Empty Page",
          createdAt: "2026-07-04T00:00:00.000Z",
          updatedAt: "2026-07-04T00:00:00.000Z",
          viewport: { x: 0, y: 0, zoom: 1 },
          nodes: [],
          edges: []
        }
      ]
    };
    const sessionBeforeDocumentSave = await fetchJson(`${origin}/api/sessions/${sessionId}`);
    const savedDocumentResult = await fetchJson(`${origin}/api/sessions/${sessionId}/document`, {
      method: "POST",
      body: JSON.stringify({ projectPath, document, expectedRevision: sessionBeforeDocumentSave.documentRevision })
    });
    const savedDocument = savedDocumentResult.document;
    assert.equal(savedDocumentResult.documentRevision, sessionBeforeDocumentSave.documentRevision + 1);
    assert.equal(savedDocument.nodes[0].id, "node-a");
    assert.equal(savedDocument.activePageId, "page-main");
    assert.equal(savedDocument.pages.length, 2);
    assert.equal(savedDocument.pages[0].nodes[0].id, "node-a");
    assert.equal(savedDocument.pages[1].nodes.length, 0);
    const recentAfterDocumentSave = await request("tools/call", {
      name: "list_canvasight_recent_projects",
      arguments: {
        limit: 1
      }
    });
    assert.equal(recentAfterDocumentSave.structuredContent.projects[0].updatedAt, document.updatedAt);

    const scatterJson = JSON.parse(await fsp.readFile(path.join(projectPath, ".scatter", "scatter.json"), "utf8"));
    assert.equal(scatterJson.version, 1);
    assert.equal(scatterJson.nodes[0].data.title, "Smoke task");
    assert.equal("codexMode" in scatterJson.nodes[0].data, false, "saved legacy Plan fields are removed");
    assert.equal("planMode" in scatterJson.nodes[0].data, false);

    const attachments = await fetchJson(`${origin}/api/sessions/${sessionId}/attachments`, {
      method: "POST",
      body: JSON.stringify({
        projectPath,
        files: [
          {
            name: "note.txt",
            mime: "text/plain",
            source: "upload",
            dataBase64: Buffer.from("hello canvasight", "utf8").toString("base64")
          },
          {
            name: "thumbnail.png",
            mime: "image/png",
            source: "paste",
            dataBase64: Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=", "base64").toString("base64")
          }
        ]
      })
    });
    assert.equal(attachments.length, 2);
    assert.equal(attachments[0].relativePath.startsWith(".scatter/assets/"), true);
    assert.equal(await fsp.readFile(attachments[0].storedPath, "utf8"), "hello canvasight");
    const assetResponse = await fetch(`${origin}${attachments[0].fileUrl}`);
    assert.equal(assetResponse.ok, true);
    assert.equal(await assetResponse.text(), "hello canvasight");
    const requestWidgetAttachmentPreview = (storedPath) => request("tools/call", {
      name: "canvasight_widget_api",
      arguments: {
        path: `/api/sessions/${sessionId}/attachment-preview`,
        method: "POST",
        body: { storedPath },
        openAttemptId: openedData.openAttemptId,
        widgetInstanceId: "widget-attachment-preview",
        startupStage: "ready",
        displayMode: "fullscreen",
        threadId: "thread-smoke",
        reactMounted: true
      }
    });
    const widgetThumbnailProxy = await requestWidgetAttachmentPreview(attachments[1].storedPath);
    assert.equal(widgetThumbnailProxy.structuredContent.ok, true);
    assert.equal(widgetThumbnailProxy.structuredContent.data.mime, "image/png");
    assert.equal(widgetThumbnailProxy.structuredContent.data.size, 68);
    assert.equal(Buffer.from(widgetThumbnailProxy.structuredContent.data.dataBase64, "base64").equals(Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=", "base64")), true);
    const widgetTextPreview = await requestWidgetAttachmentPreview(attachments[0].storedPath);
    assert.equal(widgetTextPreview.structuredContent.ok, false);
    assert.equal(widgetTextPreview.structuredContent.status, 415);
    assert.equal(widgetTextPreview.structuredContent.code, "attachment_preview_not_image");

    const otherProjectAsset = path.join(tempRoot, "other-project", ".scatter", "assets", "outside.png");
    await fsp.mkdir(path.dirname(otherProjectAsset), { recursive: true });
    await fsp.writeFile(otherProjectAsset, Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=", "base64"));
    const widgetOtherProjectPreview = await requestWidgetAttachmentPreview(otherProjectAsset);
    assert.equal(widgetOtherProjectPreview.structuredContent.ok, false);
    assert.equal(widgetOtherProjectPreview.structuredContent.status, 403);
    assert.equal(widgetOtherProjectPreview.structuredContent.code, "forbidden_attachment_preview_path");

    const oversizedPreview = path.join(projectPath, ".scatter", "assets", "oversized.png");
    await fsp.writeFile(oversizedPreview, Buffer.alloc(10 * 1024 * 1024 + 1));
    const widgetOversizedPreview = await requestWidgetAttachmentPreview(oversizedPreview);
    assert.equal(widgetOversizedPreview.structuredContent.ok, false);
    assert.equal(widgetOversizedPreview.structuredContent.status, 413);
    assert.equal(widgetOversizedPreview.structuredContent.code, "attachment_preview_too_large");

    const exportedMarkdown = await fetchJson(`${origin}/api/sessions/${sessionId}/export-markdown`, {
      method: "POST",
      body: JSON.stringify({ attachments: [], markdown: "# Exported Markdown\n", title: "Smoke export" })
    });
    assert.equal(exportedMarkdown.fileName, "Smoke export.md");
    assert.equal(exportedMarkdown.targetPath, path.join(exportDirectory, "Smoke export.md"));
    assert.equal(await fsp.readFile(exportedMarkdown.targetPath, "utf8"), "# Exported Markdown\n");

    const exportMarkdown = `# Bundle\n\n- \`${attachments[0].relativePath}\`\n- \`${attachments[0].storedPath}\`\n`;
    const exportedBundle = await fetchJson(`${origin}/api/sessions/${sessionId}/export-markdown`, {
      method: "POST",
      body: JSON.stringify({ attachments: [attachments[0], { ...attachments[0], id: "duplicate-asset" }], markdown: exportMarkdown, title: "Smoke export" })
    });
    assert.equal(exportedBundle.fileName, "Smoke export.zip");
    const bundledFiles = unzipSync(await fsp.readFile(exportedBundle.targetPath));
    assert.deepEqual(Object.keys(bundledFiles).sort(), ["Smoke export.md", "assets/note-2.txt", "assets/note.txt"]);
    assert.equal(new TextDecoder().decode(bundledFiles["assets/note.txt"]), "hello canvasight");
    const bundledMarkdown = new TextDecoder().decode(bundledFiles["Smoke export.md"]);
    assert.match(bundledMarkdown, /assets\/note/);
    assert.doesNotMatch(bundledMarkdown, new RegExp(attachments[0].storedPath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));

    const invalidExport = await fetch(`${origin}/api/sessions/${sessionId}/export-markdown`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-canvasight-token": daemonToken
      },
      body: JSON.stringify({
        attachments: [{ ...attachments[0], storedPath: path.join(tempRoot, "outside.txt") }],
        markdown: "# Invalid",
        title: "Invalid"
      })
    });
    assert.equal(invalidExport.status, 400);

    const runPayload = {
      sessionId,
      threadName: "Scatter Flow: Smoke task",
      projectPath,
      markdown: "# Smoke task\n\nRun the smoke payload.",
      imagePaths: [],
      codexMode: "chat",
      effort: "high",
      planMode: false,
      runMode: "flow",
      agentTeam: {
        enabled: true,
        skillName: "canvasight-agent-team",
        recommendedRoles: [
          {
            id: "development-agent",
            label: "Development Agent",
            reason: "Implement the smoke payload."
          },
          {
            id: "test-supervisor-agent",
            label: "Test Supervisor Agent",
            reason: "Verify the smoke payload."
          }
        ],
        reportProtocol: {
          root: "agent-reports",
          roster: "ROSTER.md",
          schema: "references/agent-team-schema.json",
          statuses: ["open", "assigned", "blocked", "resolved", "archived"]
        }
      },
      nodeIds: ["node-a"],
      attachments
    };

    const legacyModePrepared = await fetchJson(`${origin}/api/sessions/${sessionId}/run`, {
      method: "POST",
      headers: openedIdentityHeaders,
      body: JSON.stringify({
        ...runPayload,
        threadName: "Widget legacy mode normalized to Chat",
        markdown: "# Widget legacy mode normalized to Chat",
        codexMode: "goal",
        planMode: true,
        deliveryMode: "widget_bridge_prepare"
      })
    });
    assert.equal(legacyModePrepared.status, "prepared");
    assert.equal("codexMode" in legacyModePrepared, false);
    assert.equal("planMode" in legacyModePrepared, false);
    assert.equal(legacyModePrepared.codexNative.status, "applied_chat");

    const staleProjectPath = path.join(tempRoot, "stale-thread-project");
    const staleWidget = await request("tools/call", {
      name: "open_canvasight",
      arguments: { projectPath: staleProjectPath, threadId: "thread-old-broken" }
    });
    assert.equal(staleWidget.structuredContent.codexThreadId, "thread-old-broken");
    await fsp.writeFile(resumeFailPath, "thread-old-broken\n", "utf8");
    const currentWidget = await request("tools/call", {
      name: "open_canvasight",
      arguments: { projectPath: staleProjectPath, threadId: "thread-current-widget" }
    });
    const currentWidgetData = widgetDataFor(currentWidget);
    const currentSessionId = currentWidget.structuredContent.sessionId;
    const currentIdentityHeaders = {
      "x-canvasight-open-attempt-id": currentWidgetData.openAttemptId,
      "x-canvasight-widget-instance-id": "widget-current-thread-fullscreen",
      "x-canvasight-startup-stage": "hydrating_project",
      "x-canvasight-display-mode": "fullscreen",
      "x-canvasight-thread-id": "thread-current-widget",
      "x-canvasight-react-mounted": "true"
    };
    const currentReady = await fetchJson(`${currentWidgetData.origin}/api/sessions/${currentSessionId}/widget-ready`, {
      method: "POST",
      headers: currentIdentityHeaders,
      body: JSON.stringify({
        status: "ready",
        stage: "ready",
        openAttemptId: currentWidgetData.openAttemptId,
        widgetInstanceId: "widget-current-thread-fullscreen",
        displayMode: "fullscreen",
        threadId: "thread-current-widget",
        reactMounted: true,
        projectHydrated: true,
        canvasRendered: true,
        canvasVisible: true,
        canvasWidth: 1200,
        canvasHeight: 800
      })
    });
    assert.equal(currentReady.verified, true);
    const currentThreadLogOffset = (await readNativeLog()).length;
    const currentThreadPrepared = await fetchJson(`${currentWidgetData.origin}/api/sessions/${currentSessionId}/run`, {
        method: "POST",
        headers: currentIdentityHeaders,
        body: JSON.stringify({
          ...runPayload,
          sessionId: currentSessionId,
          projectPath: staleProjectPath,
          threadName: "Current Widget legacy mode stays Chat",
          markdown: "# Current Widget legacy mode stays Chat",
          codexMode: "plan",
          planMode: true,
          deliveryMode: "widget_bridge_prepare"
        })
      });
    assert.equal(currentThreadPrepared.status, "prepared");
    assert.equal("codexMode" in currentThreadPrepared, false);
    const currentThreadLog = (await readNativeLog()).slice(currentThreadLogOffset);
    assert.equal(currentThreadLog.some((entry) => entry.params?.threadId === "thread-old-broken"), false);
    assert.equal(currentThreadLog.some((entry) => entry.method === "thread/resume" && entry.params.threadId === "thread-current-widget"), true);
    assert.equal(currentThreadLog.some((entry) => entry.method === "thread/settings/update" && entry.params.threadId === "thread-current-widget" && entry.params.collaborationMode.mode === "default"), true);
    await fsp.writeFile(resumeFailPath, "", "utf8");
    await request("tools/call", { name: "close_canvasight", arguments: { sessionId: staleWidget.structuredContent.sessionId } });
    await request("tools/call", { name: "close_canvasight", arguments: { sessionId: currentSessionId } });

    const transientResumeLogOffset = (await readNativeLog()).length;
    await fsp.writeFile(transientResumeFailCountPath, JSON.stringify({ "thread-smoke": 2 }), "utf8");
    const retryPrepared = await fetchJson(`${origin}/api/sessions/${sessionId}/run`, {
      method: "POST",
      headers: openedIdentityHeaders,
      body: JSON.stringify({
        ...runPayload,
        threadName: "Widget Chat Prepared After Resume Retry",
        markdown: "# Widget Chat Prepared After Resume Retry",
        codexMode: "chat",
        planMode: false,
        deliveryMode: "widget_bridge_prepare"
      })
    });
    assert.equal(retryPrepared.status, "prepared");
    assert.equal(retryPrepared.codexNative.status, "applied_chat");
    const transientResumeLog = (await readNativeLog()).slice(transientResumeLogOffset);
    assert.equal(transientResumeLog.filter((entry) => entry.method === "thread/resume").length, 3);
    assert.equal(transientResumeLog.filter((entry) => entry.method === "thread/settings/update").length, 1);

    const degradedChatLogOffset = (await readNativeLog()).length;
    await fsp.writeFile(transientResumeFailCountPath, JSON.stringify({ "thread-smoke": 4 }), "utf8");
    const degradedChatPrepared = await fetchJson(`${origin}/api/sessions/${sessionId}/run`, {
      method: "POST",
      headers: openedIdentityHeaders,
      body: JSON.stringify({
        ...runPayload,
        threadName: "Widget Chat Prepared With Thread Store Degradation",
        markdown: "# Widget Chat Prepared With Thread Store Degradation",
        codexMode: "chat",
        planMode: false,
        deliveryMode: "widget_bridge_prepare"
      })
    });
    assert.equal(degradedChatPrepared.status, "prepared");
    assert.equal(degradedChatPrepared.codexNative.status, "preflight_degraded_chat");
    assert.equal(degradedChatPrepared.codexNative.reason, "thread_store_preflight_unavailable");
    assert.match(degradedChatPrepared.codexNative.error, /rollout does not start with session metadata/);
    const degradedChatLog = (await readNativeLog()).slice(degradedChatLogOffset);
    assert.equal(degradedChatLog.filter((entry) => entry.method === "thread/resume").length, 4);
    assert.equal(degradedChatLog.some((entry) => entry.method === "thread/settings/update"), false);

    const awaitedRunLogOffset = (await readNativeLog()).length;
    const waitForRun = request("tools/call", {
      name: "await_canvasight_run",
      arguments: {
        sessionId,
        timeoutMs: 5000
      }
    });
    await sleep(150);

    const queued = await fetchJson(`${origin}/api/sessions/${sessionId}/run`, {
      method: "POST",
      body: JSON.stringify(runPayload)
    });
    assert.equal(queued.status, "queued");
    assert.equal(queued.delivery.status, "awaited");
    assert.equal(queued.agentTeam.agentsMd.status, "unchanged");
    assert.equal(queued.agentTeam.agentsMd.reason, "managed_block_present");

    const awaited = await waitForRun;
    assert.equal(awaited.content[0].text, runPayload.markdown);
    assert.equal(awaited.structuredContent.status, "received");
    assert.equal(awaited.structuredContent.threadName, runPayload.threadName);
    assert.equal(awaited.structuredContent.codexMode, "chat", "queued Run reports must be Chat-only");
    assert.equal("planMode" in awaited.structuredContent, false);
    assert.equal(awaited.structuredContent.codexNative.status, "applied");
    assert.equal(awaited.structuredContent.codexNative.threadId, "thread-smoke");
    assert.equal(awaited.structuredContent.agentTeam.enabled, true);
    assert.equal(awaited.structuredContent.agentTeam.skillName, "canvasight-agent-team");
    assert.deepEqual(
      awaited.structuredContent.agentTeam.recommendedRoles.map((role) => role.id),
      ["development-agent", "test-supervisor-agent"]
    );
    assert.deepEqual(awaited.structuredContent.agentTeam.reportProtocol.statuses, ["open", "assigned", "blocked", "resolved", "archived"]);
    assert.equal(awaited.structuredContent.agentTeam.reportProtocol.roster, "ROSTER.md");
    assert.equal(awaited.structuredContent.agentTeam.reportProtocol.schema, "references/agent-team-schema.json");
    assert.equal(awaited.structuredContent.agentTeam.agentsMd.status, "unchanged");
    assert.equal(awaited.structuredContent.agentTeam.roster.status, "unchanged");
    assert.deepEqual(awaited.structuredContent.nodeIds, ["node-a"]);
    assert.equal(awaited.structuredContent.attachments[0].originalName, "note.txt");
    const createdAgentsMd = await fsp.readFile(path.join(projectPath, "AGENTS.md"), "utf8");
    assert.match(createdAgentsMd, /<!-- canvasight-agent-team:start -->/);
    assert.match(createdAgentsMd, /## Canvasight Agent Team/);
    const createdRoster = await fsp.readFile(path.join(projectPath, "ROSTER.md"), "utf8");
    assert.match(createdRoster, /schema_version: 1/);
    assert.match(createdRoster, /role: Development Agent/);

    const chatNativeLog = await readNativeLog();
    const awaitedRunLog = chatNativeLog.slice(awaitedRunLogOffset);
    assert.equal(awaitedRunLog.some((entry) => entry.method === "thread/goal/set"), false);
    assert.equal(chatNativeLog.some((entry) => entry.method === "turn/start"), false);
    assert.equal(
      chatNativeLog.some(
        (entry) =>
          entry.method === "thread/settings/update" &&
          entry.params.threadId === "thread-smoke" &&
          entry.params.collaborationMode.mode === "default" &&
          Object.keys(entry.params.collaborationMode.settings).length === 0
      ),
      false
    );

    const directRunLogOffset = chatNativeLog.length;
    const directRunPayload = {
      ...runPayload,
      threadName: "Scatter Direct Chat",
      markdown: "# Direct Chat\n\nBrowser fallback should queue for await_canvasight_run.",
      codexMode: "chat",
      planMode: false,
      agentTeam: {
        enabled: false
      },
      nodeIds: ["node-a"],
      attachments: []
    };
    const directRun = await fetchJson(`${origin}/api/sessions/${sessionId}/run`, {
      method: "POST",
      body: JSON.stringify(directRunPayload)
    });
    assert.equal(directRun.status, "queued");
    assert.equal(directRun.delivery.status, "queued");
    assert.equal(directRun.delivery.reason, "browser_fallback_requires_await");
    assert.equal(directRun.delivery.via, "await_canvasight_run");
    assert.equal(directRun.codexNative.status, "pending");
    assert.equal(directRun.codexTurn.status, "skipped");
    assert.equal(directRun.codexTurn.reason, "browser_fallback_requires_await");
    const directRunLog = (await readNativeLog()).slice(directRunLogOffset);
    assert.equal(directRunLog.some((entry) => entry.method === "thread/resume"), false);
    assert.equal(directRunLog.some((entry) => entry.method === "thread/settings/update"), false);
    assert.equal(directRunLog.some((entry) => entry.method === "turn/start"), false);
    const directRunDrained = await request("tools/call", {
      name: "await_canvasight_run",
      arguments: {
        sessionId,
        timeoutMs: 20
      }
    });
    assert.equal(directRunDrained.structuredContent.status, "received");
    assert.equal(directRunDrained.structuredContent.markdown, directRunPayload.markdown);
    assert.equal(directRunDrained.structuredContent.delivery.reason, "browser_fallback_requires_await");
    assert.equal(directRunDrained.structuredContent.codexNative.status, "applied");
    assert.equal(directRunDrained.structuredContent.codexNative.action, "thread/settings/update");
    assert.equal(directRunDrained.structuredContent.codexNative.collaborationMode, "default");
    const directRunAwaitLog = (await readNativeLog()).slice(directRunLogOffset);
    assert.equal(directRunAwaitLog.some((entry) => entry.method === "turn/start"), false);
    assert.equal(
      directRunAwaitLog.some(
        (entry) =>
          entry.method === "thread/settings/update" &&
          entry.params.threadId === "thread-smoke" &&
          entry.params.collaborationMode.mode === "default" &&
          entry.params.collaborationMode.settings.model === "gpt-5.5"
      ),
      true
    );

    const unconfirmedPayload = {
      ...directRunPayload,
      threadName: "Scatter Direct Chat No Confirm",
      markdown: "# Direct Chat No Confirm\n\n[no-confirm] Browser fallback still only queues."
    };
    const unconfirmedRun = await fetchJson(`${origin}/api/sessions/${sessionId}/run`, {
      method: "POST",
      body: JSON.stringify(unconfirmedPayload)
    });
    assert.equal(unconfirmedRun.status, "queued");
    assert.equal(unconfirmedRun.delivery.status, "queued");
    assert.equal(unconfirmedRun.delivery.reason, "browser_fallback_requires_await");
    assert.equal(unconfirmedRun.delivery.via, "await_canvasight_run");
    assert.equal(unconfirmedRun.codexTurn.status, "skipped");
    const unconfirmedDrained = await request("tools/call", {
      name: "await_canvasight_run",
      arguments: {
        sessionId,
        timeoutMs: 20
      }
    });
    assert.equal(unconfirmedDrained.structuredContent.status, "received");
    assert.equal(unconfirmedDrained.structuredContent.markdown, unconfirmedPayload.markdown);
    assert.equal(unconfirmedDrained.structuredContent.delivery.reason, "browser_fallback_requires_await");

    await fsp.writeFile(resumeFailPath, "thread-smoke\n", "utf8");
    const resumeFailureRun = await fetchJson(`${origin}/api/sessions/${sessionId}/run`, {
      method: "POST",
      body: JSON.stringify({
        ...directRunPayload,
        threadName: "Scatter Direct Chat Resume Failure",
        markdown: "# Direct Chat Resume Failure\n\nAwait should report a native mode failure."
      })
    });
    assert.equal(resumeFailureRun.status, "queued");
    assert.equal(resumeFailureRun.delivery.status, "queued");
    assert.equal(resumeFailureRun.delivery.reason, "browser_fallback_requires_await");
    assert.equal(resumeFailureRun.codexNative.status, "pending");
    const resumeFailureDrained = await request("tools/call", {
      name: "await_canvasight_run",
      arguments: {
        sessionId,
        timeoutMs: 20
      }
    });
    await fsp.writeFile(resumeFailPath, "", "utf8");
    assert.equal(resumeFailureDrained.structuredContent.status, "received");
    assert.equal(resumeFailureDrained.structuredContent.delivery.reason, "browser_fallback_requires_await");
    assert.equal(resumeFailureDrained.structuredContent.codexNative.status, "failed");
    assert.match(resumeFailureDrained.structuredContent.codexNative.error, /fake thread\/resume failure/);

    const waitForLegacyRun = request("tools/call", {
      name: "await_canvasight_run",
      arguments: {
        sessionId,
        timeoutMs: 5000
      }
    });
    await sleep(20);
    await fetchJson(`${origin}/api/sessions/${sessionId}/run`, {
      method: "POST",
      body: JSON.stringify({
        ...runPayload,
        agentTeam: undefined,
        codexMode: undefined,
        planMode: true,
        threadName: "Scatter Flow: Legacy mode task"
      })
    });
    const legacyAwaited = await waitForLegacyRun;
    assert.equal(legacyAwaited.structuredContent.codexMode, "chat", "legacy queued Run reports normalize to Chat");
    assert.equal("planMode" in legacyAwaited.structuredContent, false);
    assert.equal(legacyAwaited.structuredContent.agentTeam.enabled, false);
    assert.equal(legacyAwaited.structuredContent.codexNative.status, "applied");

    const legacyNativeLog = await readNativeLog();
    assert.equal(legacyNativeLog.some((entry) => entry.method === "thread/goal/set"), false);
    assert.equal(legacyNativeLog.some((entry) => entry.method === "thread/settings/update" && entry.params.collaborationMode.mode === "plan"), false);

    const appendProjectPath = path.join(tempRoot, "agent-team-append-project");
    await fsp.mkdir(appendProjectPath, { recursive: true });
    await fsp.writeFile(path.join(appendProjectPath, "AGENTS.md"), "# Existing rules\n\nKeep this rule.\n", "utf8");
    const waitForAppendRun = request("tools/call", {
      name: "await_canvasight_run",
      arguments: {
        sessionId,
        timeoutMs: 5000
      }
    });
    await sleep(20);
    const appendQueued = await fetchJson(`${origin}/api/sessions/${sessionId}/run`, {
      method: "POST",
      body: JSON.stringify({
        ...runPayload,
        projectPath: appendProjectPath,
        threadName: "Agent Team Append",
        markdown: "# Agent Team Append",
        codexMode: "chat",
        planMode: false,
        nodeIds: [],
        attachments: []
      })
    });
    assert.equal(appendQueued.agentTeam.agentsMd.status, "appended");
    assert.equal(appendQueued.agentTeam.roster.status, "created");
    const appendAwaited = await waitForAppendRun;
    assert.equal(appendAwaited.structuredContent.agentTeam.agentsMd.status, "appended");
    const appendedAgentsMd = await fsp.readFile(path.join(appendProjectPath, "AGENTS.md"), "utf8");
    assert.match(appendedAgentsMd, /Keep this rule\./);
    assert.equal((appendedAgentsMd.match(/canvasight-agent-team:start/g) || []).length, 1);

    const waitForUnchangedRun = request("tools/call", {
      name: "await_canvasight_run",
      arguments: {
        sessionId,
        timeoutMs: 5000
      }
    });
    await sleep(20);
    const unchangedQueued = await fetchJson(`${origin}/api/sessions/${sessionId}/run`, {
      method: "POST",
      body: JSON.stringify({
        ...runPayload,
        projectPath: appendProjectPath,
        threadName: "Agent Team Existing",
        markdown: "# Agent Team Existing",
        codexMode: "chat",
        planMode: false,
        nodeIds: [],
        attachments: []
      })
    });
    assert.equal(unchangedQueued.agentTeam.agentsMd.status, "unchanged");
    assert.equal(unchangedQueued.agentTeam.roster.status, "unchanged");
    const unchangedAwaited = await waitForUnchangedRun;
    assert.equal(unchangedAwaited.structuredContent.agentTeam.agentsMd.status, "unchanged");
    const unchangedAgentsMd = await fsp.readFile(path.join(appendProjectPath, "AGENTS.md"), "utf8");
    assert.equal((unchangedAgentsMd.match(/canvasight-agent-team:start/g) || []).length, 1);

    const disabledAgentTeamProjectPath = path.join(tempRoot, "agent-team-disabled-project");
    await fsp.mkdir(disabledAgentTeamProjectPath, { recursive: true });
    const waitForDisabledAgentTeamRun = request("tools/call", {
      name: "await_canvasight_run",
      arguments: {
        sessionId,
        timeoutMs: 5000
      }
    });
    await sleep(20);
    const disabledAgentTeamQueued = await fetchJson(`${origin}/api/sessions/${sessionId}/run`, {
      method: "POST",
      body: JSON.stringify({
        ...runPayload,
        projectPath: disabledAgentTeamProjectPath,
        threadName: "Agent Team Disabled",
        markdown: "# Agent Team Disabled",
        codexMode: "chat",
        planMode: false,
        agentTeam: { enabled: false },
        nodeIds: [],
        attachments: []
      })
    });
    assert.equal(disabledAgentTeamQueued.agentTeam.agentsMd.status, "skipped");
    assert.equal(disabledAgentTeamQueued.agentTeam.roster.status, "skipped");
    assert.equal(disabledAgentTeamQueued.agentTeam.agentsMd.reason, "agent_team_disabled");
    const disabledAgentTeamAwaited = await waitForDisabledAgentTeamRun;
    assert.equal(disabledAgentTeamAwaited.structuredContent.agentTeam.enabled, false);
    assert.equal(disabledAgentTeamAwaited.structuredContent.agentTeam.agentsMd.status, "skipped");
    await assert.rejects(() => fsp.stat(path.join(disabledAgentTeamProjectPath, "AGENTS.md")), /ENOENT/);

    const closed = await request("tools/call", {
      name: "close_canvasight",
      arguments: { sessionId }
    });
    assert.equal(closed.structuredContent.status, "closed");
    assert.equal(closed.structuredContent.existed, true);

    const closedAgain = await request("tools/call", {
      name: "close_canvasight",
      arguments: { sessionId }
    });
    assert.equal(closedAgain.structuredContent.status, "closed");
    assert.equal(closedAgain.structuredContent.existed, false);

    const persistentProjectPath = path.join(tempRoot, "persistent-project");
    const persistentOpened = await request("tools/call", {
      name: "open_canvasight",
      arguments: {
        projectPath: persistentProjectPath,
        language: "en"
      }
    });
    const persistentOpenedData = widgetDataFor(persistentOpened);
    daemonToken = new URL(persistentOpenedData.url).searchParams.get("token") || daemonToken;
    const persistentOrigin = persistentOpenedData.origin;
    const persistentSessionId = persistentOpened.structuredContent.sessionId;
    assert.equal(await fetchJson(`${persistentOrigin}/api/health`).then((health) => health.status), "ok");

    child.stdin.end();
    child.kill("SIGTERM");
    await new Promise((resolve) => child.once("exit", resolve));

    const persistedSession = await fetchJson(`${persistentOrigin}/api/sessions/${persistentSessionId}`);
    assert.equal(persistedSession.sessionId, persistentSessionId);
    assert.equal(persistedSession.projectPath, persistentProjectPath);
    const persistedTemplates = await fetchJson(`${persistentOrigin}/api/templates`);
    const persistedTemplate = persistedTemplates.find((template) => template.id === savedTemplate.id);
    assert.equal(persistedTemplate?.body, savedTemplate.body);
    assert.equal(persistedTemplate?.attachments[0]?.originalName, "template-source.txt");

    const mcpB = createMcpClient("smoke-b", {
      CANVASIGHT_CODEX_NATIVE: "0",
      CODEX_THREAD_ID: "thread-smoke-b"
    });
    try {
      const initializedB = await mcpB.request("initialize", {
        protocolVersion: "2024-11-05",
        capabilities: {},
        clientInfo: {
          name: "canvasight-smoke-b",
          version: "0.0.0"
        }
      });
      assert.equal(initializedB.serverInfo.name, "canvasight");
      mcpB.notify("notifications/initialized", {});

      const crossClaim = await mcpB.request("tools/call", {
        name: "claim_canvasight_thread",
        arguments: {
          projectPath: persistentProjectPath
        }
      });
      assert.equal(crossClaim.structuredContent.status, "claimed");
      assert.equal(crossClaim.structuredContent.codexThreadId, "thread-smoke-b");

      const crossPayload = {
        sessionId: persistentSessionId,
        threadName: "Persistent Flow",
        projectPath: persistentProjectPath,
        markdown: "# Persistent Flow\n\n[no-confirm] Run from the old browser session.",
        imagePaths: [],
        codexMode: "plan",
        effort: "medium",
        planMode: true,
        runMode: "flow",
        nodeIds: ["persistent-node"],
        attachments: []
      };
      const crossLogOffset = (await readNativeLog()).length;
      const crossSent = await fetchJson(`${persistentOrigin}/api/sessions/${persistentSessionId}/run`, {
        method: "POST",
        body: JSON.stringify(crossPayload)
      });
      assert.equal(crossSent.status, "queued");
      assert.equal(crossSent.delivery.status, "queued");
      assert.equal(crossSent.delivery.reason, "browser_fallback_requires_await");
      assert.equal(crossSent.delivery.via, "await_canvasight_run");
      assert.equal(crossSent.delivery.threadId, "thread-smoke-b");
      assert.equal(crossSent.codexNative.threadId, "thread-smoke-b");
      assert.equal(crossSent.codexNative.status, "pending");
      assert.equal(crossSent.codexTurn.threadId, "thread-smoke-b");
      const crossLog = (await readNativeLog()).slice(crossLogOffset);
      assert.equal(crossLog.some((entry) => entry.method === "thread/resume"), false);
      assert.equal(crossLog.some((entry) => entry.method === "thread/settings/update"), false);
      assert.equal(crossLog.some((entry) => entry.method === "turn/start"), false);

      const drained = await mcpB.request("tools/call", {
        name: "await_canvasight_run",
        arguments: {
          projectPath: persistentProjectPath,
          timeoutMs: 20
        }
      });
      assert.equal(drained.structuredContent.status, "received");
      assert.equal(drained.structuredContent.markdown, crossPayload.markdown);
      assert.equal(drained.structuredContent.delivery.reason, "browser_fallback_requires_await");
      assert.equal(drained.structuredContent.codexMode, "chat");
      assert.equal("planMode" in drained.structuredContent, false);
      assert.equal(drained.structuredContent.codexNative.status, "disabled");
    } finally {
      mcpB.stop();
    }

    const mcpOldWaiter = createMcpClient("old-waiter", {
      CANVASIGHT_CODEX_NATIVE: "0",
      CODEX_THREAD_ID: "thread-old-waiter"
    });
    const mcpC = createMcpClient("smoke-c", {
      CODEX_THREAD_ID: "thread-smoke-c"
    });
    try {
      const initializedOldWaiter = await mcpOldWaiter.request("initialize", {
        protocolVersion: "2024-11-05",
        capabilities: {},
        clientInfo: {
          name: "canvasight-old-waiter",
          version: "0.0.0"
        }
      });
      assert.equal(initializedOldWaiter.serverInfo.name, "canvasight");
      mcpOldWaiter.notify("notifications/initialized", {});
      const oldWaiter = mcpOldWaiter.request("tools/call", {
        name: "await_canvasight_run",
        arguments: {
          sessionId: persistentSessionId,
          timeoutMs: 200
        }
      });
      await sleep(20);

      const initializedC = await mcpC.request("initialize", {
        protocolVersion: "2024-11-05",
        capabilities: {},
        clientInfo: {
          name: "canvasight-smoke-c",
          version: "0.0.0"
        }
      });
      assert.equal(initializedC.serverInfo.name, "canvasight");
      mcpC.notify("notifications/initialized", {});

      const claimed = await mcpC.request("tools/call", {
        name: "claim_canvasight_thread",
        arguments: {
          projectPath: persistentProjectPath
        }
      });
      assert.equal(claimed.structuredContent.status, "claimed");
      assert.equal(claimed.structuredContent.codexThreadId, "thread-smoke-c");
      assert.equal(claimed.structuredContent.projectPath, persistentProjectPath);
      assert.equal(claimed.structuredContent.claimedSessionIds.includes(persistentSessionId), true);

      const claimLogOffset = (await readNativeLog()).length;
      const claimedPayload = {
        sessionId: persistentSessionId,
        threadName: "Claimed Current Thread",
        projectPath: persistentProjectPath,
        markdown: "# Claimed Current Thread\n\n[no-confirm] Run should go to thread-smoke-c.",
        imagePaths: [],
        codexMode: "chat",
        effort: "high",
        planMode: false,
        runMode: "node",
        nodeIds: ["claimed-node"],
        attachments: []
      };
      const claimedRun = await fetchJson(`${persistentOrigin}/api/sessions/${persistentSessionId}/run`, {
        method: "POST",
        body: JSON.stringify(claimedPayload)
      });
      assert.equal(claimedRun.status, "queued");
      assert.equal(claimedRun.delivery.status, "queued");
      assert.equal(claimedRun.delivery.reason, "browser_fallback_requires_await");
      assert.equal(claimedRun.delivery.via, "await_canvasight_run");
      assert.equal(claimedRun.codexNative.threadId, "thread-smoke-c");
      assert.equal(claimedRun.codexNative.status, "pending");
      assert.equal(claimedRun.codexTurn.threadId, "thread-smoke-c");
      const claimNativeLog = (await readNativeLog()).slice(claimLogOffset);
      assert.equal(claimNativeLog.some((entry) => entry.method === "thread/goal/set"), false);
      assert.equal(claimNativeLog.some((entry) => entry.method === "thread/resume"), false);
      assert.equal(claimNativeLog.some((entry) => entry.method === "thread/settings/update"), false);
      assert.equal(claimNativeLog.filter((entry) => entry.method === "turn/start").length, 0);
      assert.equal(claimNativeLog.some((entry) => entry.method === "turn/start" && entry.params.threadId === "thread-smoke"), false);
      const oldWaiterResult = await oldWaiter;
      assert.equal(oldWaiterResult.structuredContent.status, "timeout");
      const claimedDrained = await mcpC.request("tools/call", {
        name: "await_canvasight_run",
        arguments: {
          projectPath: persistentProjectPath,
          timeoutMs: 20
        }
      });
      assert.equal(claimedDrained.structuredContent.status, "received");
      assert.equal(claimedDrained.structuredContent.markdown, claimedPayload.markdown);
      assert.equal(claimedDrained.structuredContent.delivery.reason, "browser_fallback_requires_await");
      assert.equal(claimedDrained.structuredContent.codexNative.status, "applied");
      assert.equal(claimedDrained.structuredContent.codexNative.action, "thread/settings/update");
      assert.equal(claimedDrained.structuredContent.codexNative.collaborationMode, "default");
    } finally {
      mcpOldWaiter.stop();
      mcpC.stop();
    }

    clearTimeout(killTimer);
    console.log("MCP smoke test passed");
  } finally {
    clearTimeout(killTimer);
    await stopDaemon();
    await fsp.rm(tempRoot, { recursive: true, force: true });
    if (!child.stdin.destroyed) child.stdin.end();
    if (!child.killed) child.kill("SIGTERM");
  }
}

main().catch((error) => {
  console.error(error);
  child.kill("SIGTERM");
  process.exitCode = 1;
});
