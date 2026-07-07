#!/usr/bin/env node
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import fs from "node:fs";
import fsp from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const pluginRoot = path.resolve(__dirname, "..");
const serverPath = path.join(pluginRoot, "mcp", "server.mjs");
const pluginJson = JSON.parse(fs.readFileSync(path.join(pluginRoot, ".codex-plugin", "plugin.json"), "utf8"));
const packageJson = JSON.parse(fs.readFileSync(path.join(pluginRoot, "package.json"), "utf8"));
const packageLockJson = JSON.parse(fs.readFileSync(path.join(pluginRoot, "package-lock.json"), "utf8"));
const expectedPluginVersion = pluginJson.version;

assert.equal(packageJson.version, expectedPluginVersion);
assert.equal(packageLockJson.version, expectedPluginVersion);
assert.equal(packageLockJson.packages[""].version, expectedPluginVersion);

const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "canvasight-mcp-"));
const defaultProjectPath = path.join(tempRoot, "auto-project");
const canvasightHome = path.join(tempRoot, "canvasight-home");
const nativeLogPath = path.join(tempRoot, "native-codex.jsonl");
const resumeFailPath = path.join(tempRoot, "resume-fail-threads.txt");
const fakeCodexPath = path.join(tempRoot, "fake-codex.mjs");

fs.writeFileSync(
  fakeCodexPath,
  `#!/usr/bin/env node
import fs from "node:fs";

const logPath = process.env.CANVASIGHT_NATIVE_LOG;
const resumeFailPath = process.env.CANVASIGHT_FAKE_RESUME_FAIL_PATH;
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

function turnStartText(message) {
  const input = Array.isArray(message.params?.input) ? message.params.input : [];
  return input.find((item) => item?.type === "text")?.text || "";
}

function shouldConfirmTurnStart(message) {
  return !turnStartText(message).includes("[no-confirm]");
}

function handle(message) {
  if (message.method === "initialize") {
    write({ id: message.id, result: { userAgent: "fake-codex", codexHome: process.cwd(), platformFamily: "unix", platformOs: "test" } });
    return;
  }
  append(message.method, message.params);
  if (hasNull(message.params)) {
    write({ id: message.id, error: { code: -32602, message: "Invalid request: null values are not accepted" } });
    return;
  }
  if (message.method === "thread/resume") {
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
  if (["thread/goal/set", "thread/settings/update", "turn/start"].includes(message.method) && !loadedThreads.has(message.params?.threadId)) {
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
fs.chmodSync(fakeCodexPath, 0o755);

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
    CANVASIGHT_CODEX_BIN: fakeCodexPath,
    CANVASIGHT_CODEX_NATIVE: "1",
    CANVASIGHT_NATIVE_LOG: nativeLogPath,
    CANVASIGHT_FAKE_RESUME_FAIL_PATH: resumeFailPath,
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

function assertUniqueNodePositions(nodes, label) {
  const seen = new Set();
  for (const node of nodes) {
    const key = `${node.position?.x},${node.position?.y}`;
    assert.equal(seen.has(key), false, `${label} has overlapping node coordinates at ${key}`);
    seen.add(key);
  }
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
        handler.reject(new Error(message.error.message));
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
    stderr() {
      return clientStderrBuffer;
    }
  };
}

function stopDaemon() {
  return new Promise((resolve) => {
    const stopper = spawn(process.execPath, [serverPath, "--stop-daemon"], {
      cwd: pluginRoot,
      env: {
        ...process.env,
        CANVASIGHT_HOME: canvasightHome
      },
      stdio: "ignore"
    });
    stopper.on("exit", () => resolve());
    stopper.on("error", () => resolve());
  });
}

async function main() {
  const killTimer = setTimeout(() => {
    child.kill("SIGTERM");
    rejectPending(new Error(`MCP smoke test timed out. stderr=${stderrBuffer}`));
  }, 30000);

  try {
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
    assert.equal(toolNames.has("get_canvasight_node_template"), true);
    assert.equal(toolNames.has("write_canvasight_graph"), true);
    assert.equal(toolNames.has("await_canvasight_run"), true);
    assert.equal(toolNames.has("close_canvasight"), true);
    const renderTool = listed.tools.find((tool) => tool.name === "render_canvasight_canvas_widget");
    assert.match(renderTool.description, /native Codex widget/);
    assert.match(renderTool.description, /send follow-up messages to the current thread/);
    assert.equal(renderTool._meta["openai/outputTemplate"], "ui://widget/canvasight/canvas.html");
    assert.equal(renderTool._meta["openai/widgetAccessible"], true);
    assert.equal(renderTool.outputSchema.properties.openTarget.type, "string");
    const openTool = listed.tools.find((tool) => tool.name === "open_canvasight");
    assert.match(openTool.description, /default native Codex widget/);
    assert.match(openTool.description, /send follow-up messages to the current thread/);
    assert.equal(openTool._meta["openai/outputTemplate"], "ui://widget/canvasight/canvas.html");
    assert.equal(openTool._meta["openai/widgetAccessible"], true);
    assert.equal(openTool._meta.ui.resourceUri, "ui://widget/canvasight/canvas.html");
    assert.equal(openTool.outputSchema.properties.openTarget.type, "string");
    const browserFallbackTool = listed.tools.find((tool) => tool.name === "open_canvasight_browser_fallback");
    assert.match(browserFallbackTool.description, /browser fallback URL/);
    assert.match(browserFallbackTool.description, /queue Run payloads/);
    assert.equal(browserFallbackTool.outputSchema.properties.openTarget.type, "string");
    const recentOpenTool = listed.tools.find((tool) => tool.name === "open_canvasight_recent_project");
    assert.match(recentOpenTool.description, /default native Codex widget/);
    assert.match(recentOpenTool.description, /active Canvasight context/);
    assert.equal(recentOpenTool._meta["openai/outputTemplate"], "ui://widget/canvasight/canvas.html");
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

    const resources = await request("resources/list", {});
    assert.equal(resources.resources.length, 1);
    assert.equal(resources.resources[0].uri, "ui://widget/canvasight/canvas.html");
    assert.equal(resources.resources[0].mimeType, "text/html;profile=mcp-app");
    const widgetResource = await request("resources/read", {
      uri: "ui://widget/canvasight/canvas.html"
    });
    assert.equal(widgetResource.contents[0].uri, "ui://widget/canvasight/canvas.html");
    assert.equal(widgetResource.contents[0].mimeType, "text/html;profile=mcp-app");
    const widgetHtml = widgetResource.contents[0].text;
    assert.match(widgetHtml, /id="root"/);
    assert.doesNotMatch(widgetHtml, /<iframe\b/i);
    assert.match(widgetHtml, /canvasightAppBundleSource/);
    assert.match(widgetHtml, /__CANVASIGHT_WIDGET_DATA__/);
    assert.match(widgetHtml, /canvasightHost/);
    assert.match(widgetHtml, /canvasight:send-follow-up/);
    assert.match(widgetHtml, /sendMessage/);
    assert.ok(
      widgetHtml.indexOf('id="root"') < widgetHtml.indexOf('id="canvasightMcpHostBridge"')
    );

    const widgetOpened = await request("tools/call", {
      name: "render_canvasight_canvas_widget",
      arguments: {
        language: "zh"
      }
    });
    assert.equal(widgetOpened.structuredContent.status, "opened");
    assert.equal(widgetOpened.structuredContent.openTarget, "codex_native_widget");
    assert.equal(widgetOpened.structuredContent.activeCanvasContext, true);
    assert.equal(widgetOpened.structuredContent.browserUrl, widgetOpened.structuredContent.url);
    assert.equal(widgetOpened._meta["openai/outputTemplate"], "ui://widget/canvasight/canvas.html");
    assert.equal(widgetOpened._meta.ui.resourceUri, "ui://widget/canvasight/canvas.html");
    assert.equal(widgetOpened._meta.widgetData.url, widgetOpened.structuredContent.url);
    assert.equal(widgetOpened._meta.widgetData.apiBaseUrl, widgetOpened.structuredContent.origin);
    assert.equal(widgetOpened._meta.widgetData.canvasightHost, "widget");
    assert.equal(widgetOpened._meta.widgetData.token, new URL(widgetOpened.structuredContent.url).searchParams.get("token"));
    assert.ok(widgetOpened._meta["openai/widgetCSP"].connect_domains.includes(widgetOpened.structuredContent.origin));
    assert.ok(widgetOpened._meta.ui.csp.connectDomains.includes(widgetOpened.structuredContent.origin));
    const widgetResourceAfterOpen = await request("resources/read", {
      uri: "ui://widget/canvasight/canvas.html"
    });
    assert.ok(widgetResourceAfterOpen.contents[0]._meta["openai/widgetCSP"].connect_domains.includes(widgetOpened.structuredContent.origin));
    daemonToken = new URL(widgetOpened.structuredContent.url).searchParams.get("token") || daemonToken;
    const preflightResponse = await fetch(`${widgetOpened.structuredContent.origin}/api/health`, {
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
    const widgetPageResponse = await fetch(widgetOpened.structuredContent.browserUrl);
    assert.equal(widgetPageResponse.ok, true);
    assert.match(await widgetPageResponse.text(), /id="root"/);
    const widgetSession = await fetchJson(`${widgetOpened.structuredContent.origin}/api/sessions/${widgetOpened.structuredContent.sessionId}`);
    assert.equal(widgetSession.codexThreadId, "thread-smoke");
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
    assert.equal(defaultOpened.structuredContent.status, "opened");
    assert.equal(defaultOpened.structuredContent.openTarget, "codex_native_widget");
    assert.equal(defaultOpened._meta["openai/outputTemplate"], "ui://widget/canvasight/canvas.html");
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
    assert.equal(autoOpened.structuredContent.status, "opened");
    daemonToken = new URL(autoOpened.structuredContent.url).searchParams.get("token") || daemonToken;
    assert.equal(autoOpened.structuredContent.browserUrl, autoOpened.structuredContent.url);
    assert.equal(autoOpened.structuredContent.openTarget, "codex_native_widget");
    assert.equal(autoOpened._meta["openai/outputTemplate"], "ui://widget/canvasight/canvas.html");
    assert.match(autoOpened.content[0].text, /native widget opened/);
    assert.equal(autoOpened.structuredContent.activeCanvasContext, true);
    assert.equal(autoOpened.structuredContent.activeCanvasRouting.status, "active");
    assert.equal(autoOpened.structuredContent.canvasRouting.activeCanvasContext, true);
    assert.equal(autoOpened.structuredContent.canvasRouting.preferredTool, "write_canvasight_graph");
    assert.equal(autoOpened.structuredContent.canvasRouting.preferredMode, "append-page");
    assert.equal(autoOpened.structuredContent.canvasRouting.templateDiscoveryTool, "list_canvasight_node_templates");
    assert.equal(autoOpened.structuredContent.canvasRouting.fullTemplateTool, "get_canvasight_node_template");
    assert.match(autoOpened.content[0].text, /Canvasight is now active for this project/);
    assert.match(autoOpened.content[0].text, /editable canvas page/);
    assert.match(autoOpened.structuredContent.canvasRouting.instruction, /write_canvasight_graph/);
    assert.equal(autoOpened.structuredContent.projectPath, defaultProjectPath);
    assert.equal(await fsp.stat(path.join(defaultProjectPath, ".scatter", "scatter.json")).then((stat) => stat.isFile()), true);
    const autoPageResponse = await fetch(autoOpened.structuredContent.browserUrl);
    assert.equal(autoPageResponse.ok, true);
    assert.match(await autoPageResponse.text(), /id="root"/);
    const autoHealth = await fetchJson(`${autoOpened.structuredContent.origin}/api/health`);
    assert.equal(autoHealth.serverVersion, expectedPluginVersion);
    const autoSession = await fetchJson(`${autoOpened.structuredContent.origin}/api/sessions/${autoOpened.structuredContent.sessionId}`);
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

    const projectPath = path.join(tempRoot, "demo-project");
    const opened = await request("tools/call", {
      name: "open_canvasight",
      arguments: {
        projectPath,
        language: "en"
      }
    });
    assert.equal(opened.structuredContent.status, "opened");
    daemonToken = new URL(opened.structuredContent.url).searchParams.get("token") || daemonToken;
    assert.equal(opened.structuredContent.browserUrl, opened.structuredContent.url);
    assert.equal(opened.structuredContent.openTarget, "codex_native_widget");
    assert.equal(opened._meta["openai/outputTemplate"], "ui://widget/canvasight/canvas.html");
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
    assert.equal(recentAfterProjectOpen.structuredContent.projects[1].path, defaultProjectPath);

    const recentOpened = await request("tools/call", {
      name: "open_canvasight_recent_project",
      arguments: {
        language: "zh"
      }
    });
    assert.equal(recentOpened.structuredContent.status, "opened");
    assert.equal(recentOpened.structuredContent.openTarget, "codex_native_widget");
    assert.equal(recentOpened._meta["openai/outputTemplate"], "ui://widget/canvasight/canvas.html");
    assert.equal(recentOpened.structuredContent.projectPath, projectPath);
    assert.equal(recentOpened.structuredContent.language, "zh");
    await request("tools/call", {
      name: "close_canvasight",
      arguments: {
        sessionId: recentOpened.structuredContent.sessionId
      }
    });

    const sessionId = opened.structuredContent.sessionId;
    const origin = opened.structuredContent.origin;
    const session = await fetchJson(`${origin}/api/sessions/${sessionId}`);
    assert.equal(session.codexThreadId, "thread-smoke");
    assert.equal(session.documentRevision, 0);
    assert.equal(session.language, "en");
    assert.equal(session.projectPath, projectPath);
    assert.equal(session.sessionId, sessionId);
    assert.equal(typeof session.threadClaimedAt, "string");

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
    assert.equal(graphScatterJson.nodes[1].data.codexMode, "plan");
    assert.equal(graphScatterJson.nodes[1].data.planMode, true);
    assert.equal(graphScatterJson.nodes[2].data.codexMode, "goal");
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
    assert.equal(articleReplace.structuredContent.activePageId, graphWritten.structuredContent.activePageId);
    const articleScatterJson = JSON.parse(await fsp.readFile(path.join(projectPath, ".scatter", "scatter.json"), "utf8"));
    assert.equal(articleScatterJson.pages.length, 2);
    assert.equal(articleScatterJson.activePageId, graphWritten.structuredContent.activePageId);
    assert.equal(articleScatterJson.nodes.length, 2);
    assert.equal(articleScatterJson.nodes[0].position.y, 0);
    assert.equal(articleScatterJson.nodes[1].position.y, 380);

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
    assert.equal(fanOutGraph.structuredContent.activePageName, "Fan-out Requirements");
    assert.deepEqual(fanOutGraph.structuredContent.nodeIds, ["root", "research", "design", "build"]);
    assert.deepEqual(fanOutGraph.structuredContent.edgeIds, ["root-research", "root-design", "root-build"]);

    const fanOutScatterJson = JSON.parse(await fsp.readFile(path.join(projectPath, ".scatter", "scatter.json"), "utf8"));
    assert.equal(fanOutScatterJson.pages.length, 3);
    assert.equal(fanOutScatterJson.nodes.length, 4);
    assert.equal(fanOutScatterJson.edges.length, 3);
    assertUniqueNodePositions(fanOutScatterJson.nodes, "Fan-out graph");
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

    const explicitPositionGraph = await request("tools/call", {
      name: "write_canvasight_graph",
      arguments: {
        projectPath,
        graphType: "task-plan",
        pageName: "Explicit Position Preservation",
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
    assert.equal(productScatterJson.pages.length, 5);
    assertUniqueNodePositions(productScatterJson.nodes, "Software product graph");
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
    assert.deepEqual(
      isolatedLayoutScatterJson.nodes.map((node) => [node.id, node.position.x, node.position.y]),
      [
        ["connected-root", 0, 0],
        ["connected-child", 680, 0],
        ["loose-note", 0, 380],
        ["loose-reference", 680, 380]
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
    assert.equal(scatterJson.nodes[0].data.codexMode, "plan");
    assert.equal(scatterJson.nodes[0].data.planMode, true);

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
          }
        ]
      })
    });
    assert.equal(attachments.length, 1);
    assert.equal(attachments[0].relativePath.startsWith(".scatter/assets/"), true);
    assert.equal(await fsp.readFile(attachments[0].storedPath, "utf8"), "hello canvasight");
    const assetResponse = await fetch(`${origin}${attachments[0].fileUrl}`);
    assert.equal(assetResponse.ok, true);
    assert.equal(await assetResponse.text(), "hello canvasight");

    const runPayload = {
      sessionId,
      threadName: "Scatter Flow: Smoke task",
      projectPath,
      markdown: "# Smoke task\n\nRun the smoke payload.",
      imagePaths: [],
      codexMode: "goal",
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
          statuses: ["open", "assigned", "resolved", "archived"]
        }
      },
      nodeIds: ["node-a"],
      attachments
    };

    const widgetPrepared = await fetchJson(`${origin}/api/sessions/${sessionId}/run`, {
      method: "POST",
      body: JSON.stringify({
        ...runPayload,
        threadName: "Widget Prepared Run",
        markdown: "# Widget Prepared Run\n\nThis is sent by the native widget bridge.",
        deliveryMode: "widget_bridge_prepare"
      })
    });
    assert.equal(widgetPrepared.status, "prepared");
    assert.equal(widgetPrepared.delivery.status, "prepared");
    assert.equal(widgetPrepared.delivery.via, "widget_bridge");
    assert.equal(widgetPrepared.codexNative.status, "not_applicable");
    assert.equal(widgetPrepared.codexNative.reason, "widget_bridge");
    assert.equal(widgetPrepared.agentTeam.agentsMd.status, "created");
    const widgetPreparedDrain = await request("tools/call", {
      name: "await_canvasight_run",
      arguments: {
        sessionId,
        timeoutMs: 20
      }
    });
    assert.equal(widgetPreparedDrain.structuredContent.status, "timeout");

    const waitForRun = request("tools/call", {
      name: "await_canvasight_run",
      arguments: {
        sessionId,
        timeoutMs: 5000
      }
    });
    await sleep(20);

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
    assert.equal(awaited.structuredContent.codexMode, "goal");
    assert.equal(awaited.structuredContent.planMode, false);
    assert.equal(awaited.structuredContent.codexNative.status, "applied");
    assert.equal(awaited.structuredContent.codexNative.action, "thread/goal/set");
    assert.equal(awaited.structuredContent.codexNative.threadId, "thread-smoke");
    assert.equal(awaited.structuredContent.agentTeam.enabled, true);
    assert.equal(awaited.structuredContent.agentTeam.skillName, "canvasight-agent-team");
    assert.deepEqual(
      awaited.structuredContent.agentTeam.recommendedRoles.map((role) => role.id),
      ["development-agent", "test-supervisor-agent"]
    );
    assert.deepEqual(awaited.structuredContent.agentTeam.reportProtocol.statuses, ["open", "assigned", "resolved", "archived"]);
    assert.equal(awaited.structuredContent.agentTeam.agentsMd.status, "unchanged");
    assert.deepEqual(awaited.structuredContent.nodeIds, ["node-a"]);
    assert.equal(awaited.structuredContent.attachments[0].originalName, "note.txt");
    const createdAgentsMd = await fsp.readFile(path.join(projectPath, "AGENTS.md"), "utf8");
    assert.match(createdAgentsMd, /<!-- canvasight-agent-team:start -->/);
    assert.match(createdAgentsMd, /## Canvasight Agent Team/);

    const goalNativeLog = await readNativeLog();
    assert.equal(goalNativeLog.some((entry) => entry.method === "thread/resume" && entry.params.threadId === "thread-smoke"), true);
    assert.equal(goalNativeLog.some((entry) => entry.method === "thread/goal/set" && entry.params.threadId === "thread-smoke"), true);
    assert.ok(
      goalNativeLog.findIndex((entry) => entry.method === "thread/resume" && entry.params.threadId === "thread-smoke") <
        goalNativeLog.findIndex((entry) => entry.method === "thread/goal/set" && entry.params.threadId === "thread-smoke")
    );
    assert.equal(goalNativeLog.some((entry) => entry.method === "turn/start"), false);
    assert.equal(
      goalNativeLog.some(
        (entry) =>
          entry.method === "thread/settings/update" &&
          entry.params.threadId === "thread-smoke" &&
          entry.params.collaborationMode.mode === "default" &&
          Object.keys(entry.params.collaborationMode.settings).length === 0
      ),
      false
    );

    const directRunLogOffset = goalNativeLog.length;
    const directRunPayload = {
      ...runPayload,
      threadName: "Scatter Direct Chat",
      markdown: "# Direct Chat\n\nThis should start a Codex turn without await_canvasight_run.",
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
    assert.equal(directRun.status, "sent");
    assert.equal(directRun.delivery.status, "sent");
    assert.equal(directRun.delivery.reason, "turn_start_confirmed");
    assert.equal(directRun.delivery.via, "codex_app_server");
    assert.equal(directRun.codexNative.status, "applied");
    assert.equal(directRun.codexNative.action, "chat/no-settings-update");
    assert.equal(directRun.codexTurn.status, "started");
    assert.equal(directRun.codexTurn.action, "turn/start");
    assert.equal(directRun.codexTurn.threadId, "thread-smoke");
    assert.equal(directRun.codexTurn.confirmed, true);
    assert.equal(directRun.codexTurn.confirmation.method, "turn/started");
    const directRunLog = (await readNativeLog()).slice(directRunLogOffset);
    assert.equal(directRunLog.some((entry) => entry.method === "thread/goal/set"), false);
    assert.equal(directRunLog.filter((entry) => entry.method === "thread/resume" && entry.params.threadId === "thread-smoke").length, 1);
    assert.equal(
      directRunLog.some(
        (entry) =>
          entry.method === "thread/settings/update" &&
          entry.params.threadId === "thread-smoke" &&
          entry.params.collaborationMode.mode === "default" &&
          Object.keys(entry.params.collaborationMode.settings).length === 0
      ),
      false
    );
    assert.equal(directRunLog.filter((entry) => entry.method === "turn/start").length, 1);
    assert.ok(
      directRunLog.findIndex((entry) => entry.method === "thread/resume" && entry.params.threadId === "thread-smoke") <
        directRunLog.findIndex((entry) => entry.method === "turn/start" && entry.params.threadId === "thread-smoke")
    );
    assert.equal(
      directRunLog.some(
        (entry) =>
          entry.method === "turn/start" &&
          entry.params.threadId === "thread-smoke" &&
          entry.params.cwd === projectPath &&
          entry.params.input[0]?.type === "text" &&
          entry.params.input[0]?.text === directRunPayload.markdown
      ),
      true
    );
    const directRunDrained = await request("tools/call", {
      name: "await_canvasight_run",
      arguments: {
        sessionId,
        timeoutMs: 20
      }
    });
    assert.equal(directRunDrained.structuredContent.status, "timeout");

    const unconfirmedPayload = {
      ...directRunPayload,
      threadName: "Scatter Direct Chat No Confirm",
      markdown: "# Direct Chat No Confirm\n\n[no-confirm] This accepted turn/start response must stay queued."
    };
    const unconfirmedRun = await fetchJson(`${origin}/api/sessions/${sessionId}/run`, {
      method: "POST",
      body: JSON.stringify(unconfirmedPayload)
    });
    assert.equal(unconfirmedRun.status, "queued");
    assert.equal(unconfirmedRun.delivery.status, "queued");
    assert.equal(unconfirmedRun.delivery.reason, "turn_start_unverified");
    assert.equal(unconfirmedRun.delivery.via, "await_canvasight_run");
    assert.equal(unconfirmedRun.codexTurn.status, "started");
    assert.equal(unconfirmedRun.codexTurn.confirmed, false);
    const unconfirmedDrained = await request("tools/call", {
      name: "await_canvasight_run",
      arguments: {
        sessionId,
        timeoutMs: 20
      }
    });
    assert.equal(unconfirmedDrained.structuredContent.status, "received");
    assert.equal(unconfirmedDrained.structuredContent.markdown, unconfirmedPayload.markdown);
    assert.equal(unconfirmedDrained.structuredContent.delivery.reason, "turn_start_unverified");

    await fsp.writeFile(resumeFailPath, "thread-smoke\n", "utf8");
    const resumeFailureRun = await fetchJson(`${origin}/api/sessions/${sessionId}/run`, {
      method: "POST",
      body: JSON.stringify({
        ...directRunPayload,
        threadName: "Scatter Direct Chat Resume Failure",
        markdown: "# Direct Chat Resume Failure\n\nThis should queue with a specific thread_resume_failed reason."
      })
    });
    await fsp.writeFile(resumeFailPath, "", "utf8");
    assert.equal(resumeFailureRun.status, "queued");
    assert.equal(resumeFailureRun.delivery.status, "queued");
    assert.equal(resumeFailureRun.delivery.reason, "thread_resume_failed");
    assert.equal(resumeFailureRun.codexTurn.status, "failed");
    assert.equal(resumeFailureRun.codexTurn.action, "thread/resume");
    assert.match(resumeFailureRun.codexTurn.error, /fake thread\/resume failure/);
    const resumeFailureDrained = await request("tools/call", {
      name: "await_canvasight_run",
      arguments: {
        sessionId,
        timeoutMs: 20
      }
    });
    assert.equal(resumeFailureDrained.structuredContent.status, "received");
    assert.equal(resumeFailureDrained.structuredContent.delivery.reason, "thread_resume_failed");
    assert.equal(resumeFailureDrained.structuredContent.codexTurn.action, "thread/resume");

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
        threadName: "Scatter Flow: Legacy plan task"
      })
    });
    const legacyAwaited = await waitForLegacyRun;
    assert.equal(legacyAwaited.structuredContent.codexMode, "plan");
    assert.equal(legacyAwaited.structuredContent.planMode, true);
    assert.equal(legacyAwaited.structuredContent.agentTeam.enabled, false);
    assert.equal(legacyAwaited.structuredContent.codexNative.status, "applied");
    assert.equal(legacyAwaited.structuredContent.codexNative.action, "thread/settings/update");
    assert.equal(legacyAwaited.structuredContent.codexNative.collaborationMode, "plan");

    const planNativeLog = await readNativeLog();
    assert.equal(
      planNativeLog.some(
        (entry) =>
          entry.method === "thread/settings/update" &&
          entry.params.threadId === "thread-smoke" &&
          entry.params.collaborationMode.mode === "plan" &&
          entry.params.collaborationMode.settings.model === "gpt-5.5" &&
          entry.params.collaborationMode.settings.reasoning_effort === "medium"
      ),
      true
    );

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
    assert.equal(persistentOpened.structuredContent.status, "opened");
    daemonToken = new URL(persistentOpened.structuredContent.url).searchParams.get("token") || daemonToken;
    const persistentOrigin = persistentOpened.structuredContent.origin;
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
      assert.equal(crossSent.delivery.reason, "turn_start_unverified");
      assert.equal(crossSent.delivery.via, "await_canvasight_run");
      assert.equal(crossSent.delivery.threadId, "thread-smoke-b");
      assert.equal(crossSent.codexNative.threadId, "thread-smoke-b");
      assert.equal(crossSent.codexTurn.threadId, "thread-smoke-b");
      const crossLog = (await readNativeLog()).slice(crossLogOffset);
      assert.equal(crossLog.filter((entry) => entry.method === "thread/resume" && entry.params.threadId === "thread-smoke-b").length, 2);
      assert.equal(
        crossLog.some(
          (entry) =>
            entry.method === "thread/settings/update" &&
            entry.params.threadId === "thread-smoke-b" &&
            entry.params.collaborationMode.mode === "plan" &&
            entry.params.collaborationMode.settings.model === "gpt-5.5" &&
            entry.params.collaborationMode.settings.reasoning_effort === "medium"
        ),
        true
      );
      assert.equal(crossLog.some((entry) => entry.method === "turn/start" && entry.params.threadId === "thread-smoke-b"), true);
      assert.ok(
        crossLog.findIndex((entry) => entry.method === "thread/resume" && entry.params.threadId === "thread-smoke-b") <
          crossLog.findIndex((entry) => entry.method === "thread/settings/update" && entry.params.threadId === "thread-smoke-b")
      );
      assert.ok(
        crossLog.findLastIndex((entry) => entry.method === "thread/resume" && entry.params.threadId === "thread-smoke-b") <
          crossLog.findIndex((entry) => entry.method === "turn/start" && entry.params.threadId === "thread-smoke-b")
      );

      const drained = await mcpB.request("tools/call", {
        name: "await_canvasight_run",
        arguments: {
          projectPath: persistentProjectPath,
          timeoutMs: 20
        }
      });
      assert.equal(drained.structuredContent.status, "received");
      assert.equal(drained.structuredContent.markdown, crossPayload.markdown);
      assert.equal(drained.structuredContent.delivery.reason, "turn_start_unverified");
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
      assert.equal(claimedRun.delivery.reason, "turn_start_unverified");
      assert.equal(claimedRun.delivery.via, "await_canvasight_run");
      assert.equal(claimedRun.codexNative.threadId, "thread-smoke-c");
      assert.equal(claimedRun.codexNative.action, "chat/no-settings-update");
      assert.equal(claimedRun.codexTurn.threadId, "thread-smoke-c");
      const claimNativeLog = (await readNativeLog()).slice(claimLogOffset);
      assert.equal(claimNativeLog.some((entry) => entry.method === "thread/goal/set"), false);
      assert.equal(claimNativeLog.filter((entry) => entry.method === "thread/resume" && entry.params.threadId === "thread-smoke-c").length, 1);
      assert.equal(
        claimNativeLog.some(
          (entry) =>
            entry.method === "thread/settings/update" &&
            entry.params.threadId === "thread-smoke-c" &&
            entry.params.collaborationMode.mode === "default" &&
            Object.keys(entry.params.collaborationMode.settings).length === 0
        ),
        false
      );
      assert.equal(claimNativeLog.filter((entry) => entry.method === "turn/start").length, 1);
      assert.ok(
        claimNativeLog.findIndex((entry) => entry.method === "thread/resume" && entry.params.threadId === "thread-smoke-c") <
          claimNativeLog.findIndex((entry) => entry.method === "turn/start" && entry.params.threadId === "thread-smoke-c")
      );
      assert.equal(
        claimNativeLog.some(
          (entry) =>
            entry.method === "turn/start" &&
            entry.params.threadId === "thread-smoke-c" &&
            entry.params.cwd === persistentProjectPath &&
            entry.params.input[0]?.text === claimedPayload.markdown
        ),
        true
      );
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
      assert.equal(claimedDrained.structuredContent.delivery.reason, "turn_start_unverified");
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
