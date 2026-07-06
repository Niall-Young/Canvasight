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
const origin = `http://127.0.0.1:${port}`;
const unboundOrigin = `http://127.0.0.1:${unboundPort}`;
const unboundCanvasightHome = path.join(tempRoot, "home-unbound");

fs.writeFileSync(
  fakeCodexPath,
  `#!/usr/bin/env node
import fs from "node:fs";

const logPath = process.env.CANVASIGHT_NATIVE_LOG;
let buffer = "";

function write(message) {
  process.stdout.write(JSON.stringify(message) + "\\n");
}

function append(method, params) {
  if (!logPath) return;
  fs.appendFileSync(logPath, JSON.stringify({ method, params }) + "\\n");
}

function handle(message) {
  if (message.method === "initialize") {
    write({ id: message.id, result: { userAgent: "fake-codex", codexHome: process.cwd(), platformFamily: "unix", platformOs: "test" } });
    return;
  }
  append(message.method, message.params);
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
    const runResult = await fetchJson(`${origin}/api/sessions/local/run`, {
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
    assert.equal(runResult.status, "sent");
    assert.equal(runResult.delivery.via, "turn/start");
    assert.equal(runResult.codexNative.status, "applied");
    assert.equal(runResult.codexTurn.threadId, "thread-dev-smoke");
    const nativeLog = await readNativeLog();
    const turnEntry = nativeLog.find((entry) => entry.method === "turn/start" && entry.params.threadId === "thread-dev-smoke");
    assert.ok(turnEntry);
    assert.equal(turnEntry.params.cwd, opened.project.path);
    assert.equal(turnEntry.params.input[0].text.includes("Dev Server Run"), true);

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
    assert.equal(String(unboundRun.json.error).includes("open_canvasight"), true);
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
    stopDaemon();
    stopDaemon(unboundCanvasightHome);
    await fsp.rm(tempRoot, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
