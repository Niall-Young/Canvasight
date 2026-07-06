#!/usr/bin/env node
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import fsp from "node:fs/promises";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const pluginRoot = path.resolve(__dirname, "..");
const scriptPath = path.join(pluginRoot, "scripts", "dev-server.mjs");
const serverPath = path.join(pluginRoot, "mcp", "server.mjs");
const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "canvasight-dev-server-"));
const canvasightHome = path.join(tempRoot, "home");
const nativeLogPath = path.join(tempRoot, "native-codex.jsonl");
const fakeCodexPath = path.join(tempRoot, "fake-codex.mjs");
const port = await findFreePort();
const unboundPort = await findFreePort();
const queuedPort = await findFreePort();
const origin = `http://127.0.0.1:${port}`;
const unboundOrigin = `http://127.0.0.1:${unboundPort}`;
const queuedOrigin = `http://127.0.0.1:${queuedPort}`;
const unboundCanvasightHome = path.join(tempRoot, "home-unbound");
const queuedCanvasightHome = path.join(tempRoot, "home-queued");

fs.writeFileSync(
  fakeCodexPath,
  `#!/usr/bin/env node
import fs from "node:fs";

const logPath = process.env.CANVASIGHT_NATIVE_LOG;
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
    loadedThreads.add(message.params.threadId);
    write({
      id: message.id,
      result: {
        thread: { id: message.params.threadId, status: { type: "running" } },
        model: "gpt-5.5",
        modelProvider: "openai",
        serviceTier: null,
        cwd: process.cwd(),
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
    write({ id: message.id, result: { goal: { threadId: message.params.threadId, objective: message.params.objective, status: "active" } } });
    return;
  }
  if (message.method === "thread/settings/update") {
    write({ id: message.id, result: {} });
    return;
  }
  if (message.method === "turn/start") {
    write({ id: message.id, result: { turn: { id: "turn-dev-smoke", threadId: message.params.threadId, status: "running" } } });
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

function findFreePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      const selectedPort = typeof address === "object" && address ? address.port : 0;
      server.close(() => resolve(selectedPort));
    });
  });
}

function run(action, options = {}) {
  const env = {
    ...process.env,
    CANVASIGHT_CODEX_BIN: fakeCodexPath,
    CANVASIGHT_HOME: options.canvasightHome || canvasightHome,
    CANVASIGHT_DEV_PORT: String(options.port || port),
    CANVASIGHT_NATIVE_LOG: nativeLogPath
  };
  if (options.codexNative !== undefined) env.CANVASIGHT_CODEX_NATIVE = options.codexNative;
  delete env.CODEX_THREAD_ID;
  if (options.threadId !== null) env.CODEX_THREAD_ID = options.threadId || "thread-dev-smoke";
  return spawnSync(process.execPath, [scriptPath, action], {
    cwd: pluginRoot,
    env,
    encoding: "utf8"
  });
}

function stopDaemon(home = canvasightHome) {
  return spawnSync(process.execPath, [serverPath, "--stop-daemon"], {
    cwd: pluginRoot,
    env: {
      ...process.env,
      CANVASIGHT_HOME: home
    },
    encoding: "utf8"
  });
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

async function fetchText(url) {
  try {
    const response = await fetch(url);
    return {
      ok: response.ok,
      text: await response.text()
    };
  } catch {
    return {
      ok: false,
      text: ""
    };
  }
}

async function fetchJsonResult(url, init) {
  const response = await fetch(url, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(init?.headers || {})
    }
  });
  const text = await response.text();
  const json = text ? JSON.parse(text) : null;
  return {
    json,
    ok: response.ok,
    status: response.status,
    text
  };
}

async function fetchJson(url, init) {
  const result = await fetchJsonResult(url, init);
  const text = result.text;
  const responseStatus = result.status;
  if (!result.ok) throw new Error(`${init?.method || "GET"} ${url} failed: ${responseStatus} ${text}`);
  return result.json;
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

async function readDaemonState(home) {
  return JSON.parse(await fsp.readFile(path.join(home, "daemon.json"), "utf8"));
}

async function main() {
  try {
    const started = run("start");
    assert.equal(started.status, 0, started.stderr || started.stdout);
    assert.match(started.stdout, /Canvasight dev server running|Canvasight dev server is already reachable/);

    const state = JSON.parse(await fsp.readFile(path.join(canvasightHome, "dev-server.json"), "utf8"));
    assert.equal(state.origin, origin);
    assert.equal(state.pluginRoot, pluginRoot);
    assert.equal(state.managed, true);
    assert.equal(processIsAlive(Number(state.pid)), true);

    const page = await fetchText(origin);
    assert.equal(page.ok, true);
    assert.equal(page.text.includes("<title>Canvasight</title>"), true);

    const projectPath = path.join(tempRoot, "dev-project");
    const opened = await fetchJson(`${origin}/api/sessions/local/open-project`, {
      method: "POST",
      body: JSON.stringify({ projectPath })
    });
    const unclaimedRun = await fetchJsonResult(`${origin}/api/sessions/local/run`, {
      method: "POST",
      body: JSON.stringify({
        agentTeam: { enabled: false, recommendedRoles: [] },
        attachments: [],
        codexMode: "chat",
        effort: "high",
        imagePaths: [],
        markdown: "# Dev Server Run\\n\\nThis should be delivered through the daemon.",
        nodeIds: ["node-dev"],
        planMode: false,
        projectPath: opened.project.path,
        runMode: "node",
        sessionId: "local",
        threadName: "Dev Server Run"
      })
    });
    assert.equal(unclaimedRun.status, 409);
    assert.equal(unclaimedRun.json.code, "unbound_dev_session");
    const nativeLog = await readNativeLog();
    assert.equal(nativeLog.some((entry) => entry.method === "thread/goal/set"), false);
    assert.equal(nativeLog.some((entry) => entry.method === "thread/resume"), false);
    assert.equal(nativeLog.some((entry) => entry.method === "turn/start"), false);

    const rebound = await fetchJson(`${origin}/api/sessions/local/claim`, {
      method: "POST",
      body: JSON.stringify({
        projectPath: opened.project.path,
        threadId: "thread-dev-claimed"
      })
    });
    assert.equal(rebound.status, "claimed");
    assert.equal(rebound.codexThreadId, "thread-dev-claimed");
    const reboundLogOffset = (await readNativeLog()).length;
    const reboundRun = await fetchJson(`${origin}/api/sessions/local/run`, {
      method: "POST",
      body: JSON.stringify({
        agentTeam: { enabled: false, recommendedRoles: [] },
        attachments: [],
        codexMode: "chat",
        effort: "high",
        imagePaths: [],
        markdown: "# Claimed Dev Server Run\\n\\nThis should be delivered to the claimed thread.",
        nodeIds: ["node-claimed"],
        planMode: false,
        projectPath: opened.project.path,
        runMode: "node",
        sessionId: "local",
        threadName: "Claimed Dev Server Run"
      })
    });
    assert.equal(reboundRun.status, "queued");
    assert.equal(reboundRun.delivery.status, "queued");
    assert.equal(reboundRun.delivery.reason, "native_direct_disabled");
    assert.equal(reboundRun.delivery.via, "await_canvasight_run");
    assert.equal(reboundRun.codexNative.status, "disabled");
    assert.equal(reboundRun.codexNative.reason, "native_direct_disabled");
    assert.equal(reboundRun.codexTurn.status, "skipped");
    const reboundLog = (await readNativeLog()).slice(reboundLogOffset);
    assert.equal(reboundLog.some((entry) => entry.method === "thread/goal/set"), false);
    assert.equal(reboundLog.some((entry) => entry.method === "thread/resume"), false);
    assert.equal(reboundLog.filter((entry) => entry.method === "turn/start").length, 0);
    assert.equal(reboundLog.some((entry) => entry.method === "turn/start" && entry.params.threadId === "thread-dev-smoke"), false);
    const reboundDaemon = await readDaemonState(canvasightHome);
    const reboundAwaited = await fetchJson(`${reboundDaemon.origin}/api/runs/await`, {
      method: "POST",
      headers: {
        "x-canvasight-token": reboundDaemon.token
      },
      body: JSON.stringify({
        projectPath: opened.project.path,
        threadId: "thread-dev-claimed",
        timeoutMs: 20
      })
    });
    assert.equal(reboundAwaited.status, "received");
    assert.equal(reboundAwaited.markdown, "# Claimed Dev Server Run\\n\\nThis should be delivered to the claimed thread.");
    assert.equal(reboundAwaited.delivery.reason, "native_direct_disabled");

    const status = run("status");
    assert.equal(status.status, 0, status.stderr || status.stdout);
    assert.match(status.stdout, /running/);

    const stopped = run("stop");
    assert.equal(stopped.status, 0, stopped.stderr || stopped.stdout);

    const afterStop = await fetchText(origin);
    assert.equal(afterStop.ok, false);

    const unboundStarted = run("start", {
      canvasightHome: unboundCanvasightHome,
      port: unboundPort,
      threadId: null
    });
    assert.equal(unboundStarted.status, 0, unboundStarted.stderr || unboundStarted.stdout);
    const unboundOpened = await fetchJson(`${unboundOrigin}/api/sessions/local/open-project`, {
      method: "POST",
      body: JSON.stringify({ projectPath: path.join(tempRoot, "unbound-project") })
    });
    const unboundRun = await fetchJsonResult(`${unboundOrigin}/api/sessions/local/run`, {
      method: "POST",
      body: JSON.stringify({
        attachments: [],
        codexMode: "chat",
        markdown: "# Unbound Run",
        nodeIds: ["node-unbound"],
        projectPath: unboundOpened.project.path,
        runMode: "node",
        sessionId: "local",
        threadName: "Unbound Run"
      })
    });
    assert.equal(unboundRun.status, 409);
    assert.equal(unboundRun.json.code, "unbound_dev_session");
    assert.equal(String(unboundRun.json.error).includes("claim_canvasight_thread"), true);

    const unboundDaemon = await readDaemonState(unboundCanvasightHome);
    const claimed = await fetchJson(`${unboundDaemon.origin}/api/sessions/claim`, {
      method: "POST",
      headers: {
        "x-canvasight-token": unboundDaemon.token
      },
      body: JSON.stringify({
        projectPath: unboundOpened.project.path,
        threadId: "thread-claimed-dev"
      })
    });
    assert.equal(claimed.status, "claimed");
    assert.equal(claimed.codexThreadId, "thread-claimed-dev");
    const claimedLogOffset = (await readNativeLog()).length;
    const claimedRun = await fetchJson(`${unboundOrigin}/api/sessions/local/run`, {
      method: "POST",
      body: JSON.stringify({
        attachments: [],
        codexMode: "chat",
        markdown: "# Claimed Dev Run",
        nodeIds: ["node-claimed-dev"],
        projectPath: unboundOpened.project.path,
        runMode: "node",
        sessionId: "local",
        threadName: "Claimed Dev Run"
      })
    });
    assert.equal(claimedRun.status, "queued");
    assert.equal(claimedRun.delivery.status, "queued");
    assert.equal(claimedRun.delivery.reason, "native_direct_disabled");
    assert.equal(claimedRun.delivery.via, "await_canvasight_run");
    assert.equal(claimedRun.codexNative.status, "disabled");
    assert.equal(claimedRun.codexNative.reason, "native_direct_disabled");
    assert.equal(claimedRun.codexTurn.status, "skipped");
    const claimedLog = (await readNativeLog()).slice(claimedLogOffset);
    assert.equal(claimedLog.some((entry) => entry.method === "thread/goal/set"), false);
    assert.equal(claimedLog.some((entry) => entry.method === "thread/resume"), false);
    assert.equal(claimedLog.filter((entry) => entry.method === "turn/start").length, 0);
    const claimedAwaited = await fetchJson(`${unboundDaemon.origin}/api/runs/await`, {
      method: "POST",
      headers: {
        "x-canvasight-token": unboundDaemon.token
      },
      body: JSON.stringify({
        projectPath: unboundOpened.project.path,
        threadId: "thread-claimed-dev",
        timeoutMs: 20
      })
    });
    assert.equal(claimedAwaited.status, "received");
    assert.equal(claimedAwaited.markdown, "# Claimed Dev Run");
    assert.equal(claimedAwaited.delivery.reason, "native_direct_disabled");

    const queuedStarted = run("start", {
      canvasightHome: queuedCanvasightHome,
      codexNative: "0",
      port: queuedPort,
      threadId: "thread-queued-dev"
    });
    assert.equal(queuedStarted.status, 0, queuedStarted.stderr || queuedStarted.stdout);
    const queuedOpened = await fetchJson(`${queuedOrigin}/api/sessions/local/open-project`, {
      method: "POST",
      body: JSON.stringify({ projectPath: path.join(tempRoot, "queued-project") })
    });
    const queuedClaimed = await fetchJson(`${queuedOrigin}/api/sessions/local/claim`, {
      method: "POST",
      body: JSON.stringify({
        projectPath: queuedOpened.project.path,
        threadId: "thread-queued-dev"
      })
    });
    assert.equal(queuedClaimed.status, "claimed");
    assert.equal(queuedClaimed.codexThreadId, "thread-queued-dev");
    const queuedLogOffset = (await readNativeLog()).length;
    const queuedRun = await fetchJson(`${queuedOrigin}/api/sessions/local/run`, {
      method: "POST",
      body: JSON.stringify({
        attachments: [],
        codexMode: "chat",
        markdown: "# Queued Dev Run",
        nodeIds: ["node-queued-dev"],
        projectPath: queuedOpened.project.path,
        runMode: "node",
        sessionId: "local",
        threadName: "Queued Dev Run"
      })
    });
    assert.equal(queuedRun.status, "queued");
    assert.equal(queuedRun.delivery.status, "queued");
    assert.equal(queuedRun.delivery.reason, "native_direct_disabled");
    assert.equal(queuedRun.delivery.via, "await_canvasight_run");
    assert.equal(queuedRun.codexNative.status, "disabled");
    assert.equal(queuedRun.codexNative.reason, "native_direct_disabled");
    assert.equal(queuedRun.codexTurn.status, "skipped");
    const queuedNativeLog = (await readNativeLog()).slice(queuedLogOffset);
    assert.equal(queuedNativeLog.some((entry) => entry.method === "thread/resume"), false);
    assert.equal(queuedNativeLog.some((entry) => entry.method === "turn/start"), false);
    const queuedDaemon = await readDaemonState(queuedCanvasightHome);
    const queuedAwaited = await fetchJson(`${queuedDaemon.origin}/api/runs/await`, {
      method: "POST",
      headers: {
        "x-canvasight-token": queuedDaemon.token
      },
      body: JSON.stringify({
        projectPath: queuedOpened.project.path,
        threadId: "thread-queued-dev",
        timeoutMs: 20
      })
    });
    assert.equal(queuedAwaited.status, "received");
    assert.equal(queuedAwaited.markdown, "# Queued Dev Run");
    assert.equal(queuedAwaited.delivery.status, "queued");
    const queuedStopped = run("stop", {
      canvasightHome: queuedCanvasightHome,
      codexNative: "0",
      port: queuedPort,
      threadId: "thread-queued-dev"
    });
    assert.equal(queuedStopped.status, 0, queuedStopped.stderr || queuedStopped.stdout);

    const unboundStopped = run("stop", {
      canvasightHome: unboundCanvasightHome,
      port: unboundPort,
      threadId: null
    });
    assert.equal(unboundStopped.status, 0, unboundStopped.stderr || unboundStopped.stdout);

    console.log("Canvasight dev server smoke test passed");
  } finally {
    run("stop");
    run("stop", {
      canvasightHome: unboundCanvasightHome,
      port: unboundPort,
      threadId: null
    });
    run("stop", {
      canvasightHome: queuedCanvasightHome,
      codexNative: "0",
      port: queuedPort,
      threadId: "thread-queued-dev"
    });
    stopDaemon();
    stopDaemon(unboundCanvasightHome);
    stopDaemon(queuedCanvasightHome);
    await fsp.rm(tempRoot, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
