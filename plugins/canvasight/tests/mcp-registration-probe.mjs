import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const pluginRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const serverPath = path.join(pluginRoot, "mcp", "server.mjs");
const manifestPath = path.join(pluginRoot, ".mcp.json");
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
const serverConfig = manifest.mcpServers?.canvasight;
assert.ok(serverConfig, "canvasight MCP manifest entry is missing");
const manifestCwd = path.resolve(pluginRoot, serverConfig.cwd || ".");
const commandProbe = spawnSync(serverConfig.command, ["--version"], {
  cwd: manifestCwd,
  encoding: "utf8",
  windowsHide: true
});
const temporaryHome = await mkdtemp(path.join(os.tmpdir(), "canvasight-mcp-probe-"));
const timeoutMs = Number(process.env.CANVASIGHT_MCP_PROBE_TIMEOUT_MS || 10_000);

const diagnostic = {
  platform: process.platform,
  nodeExecutable: process.execPath,
  nodeVersion: process.version,
  cwd: pluginRoot,
  serverPath,
  manifest: {
    command: serverConfig.command,
    args: serverConfig.args,
    cwd: manifestCwd,
    commandResolved: commandProbe.status === 0,
    commandVersion: commandProbe.stdout?.trim() || "",
    commandErrorCode: commandProbe.error?.code || "",
    commandError: commandProbe.error?.message || commandProbe.stderr?.trim() || ""
  },
  lifecycleLogPath: path.join(temporaryHome, "mcp-lifecycle.log"),
  lifecycleEvents: [],
  lifecycleStart: null,
  stages: []
};

let child;
let stderr = "";
let stdoutBuffer = Buffer.alloc(0);
let nextId = 1;
const pending = new Map();

function record(stage, details = {}) {
  diagnostic.stages.push({ stage, ...details });
}

function rejectPending(error) {
  for (const request of pending.values()) request.reject(error);
  pending.clear();
}

function parseStdout() {
  while (stdoutBuffer.length) {
    const headerEnd = stdoutBuffer.indexOf("\r\n\r\n");
    if (headerEnd < 0) return;
    const header = stdoutBuffer.subarray(0, headerEnd).toString("ascii");
    const match = header.match(/content-length:\s*(\d+)/i);
    if (!match) throw new Error(`Missing Content-Length header: ${header}`);
    const bodyStart = headerEnd + 4;
    const bodyEnd = bodyStart + Number(match[1]);
    if (stdoutBuffer.length < bodyEnd) return;
    const message = JSON.parse(stdoutBuffer.subarray(bodyStart, bodyEnd).toString("utf8"));
    stdoutBuffer = stdoutBuffer.subarray(bodyEnd);
    const request = pending.get(message.id);
    if (!request) continue;
    pending.delete(message.id);
    if (message.error) request.reject(new Error(message.error.message));
    else request.resolve(message.result);
  }
}

function request(method, params) {
  const id = nextId++;
  const body = JSON.stringify({ jsonrpc: "2.0", id, method, params });
  const result = new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
  child.stdin.write(`Content-Length: ${Buffer.byteLength(body, "utf8")}\r\n\r\n${body}`);
  return result;
}

function notify(method, params) {
  const body = JSON.stringify({ jsonrpc: "2.0", method, params });
  child.stdin.write(`Content-Length: ${Buffer.byteLength(body, "utf8")}\r\n\r\n${body}`);
}

const timeout = setTimeout(() => {
  rejectPending(new Error(`Probe timed out after ${timeoutMs}ms. stderr=${stderr}`));
  child?.kill();
}, timeoutMs);

try {
  assert.equal(commandProbe.status, 0, `Manifest command '${serverConfig.command}' is unavailable: ${diagnostic.manifest.commandError}`);
  record("manifest_command_ok", { command: serverConfig.command, version: diagnostic.manifest.commandVersion });
  record("spawn_start");
  child = spawn(process.execPath, [serverPath], {
    cwd: pluginRoot,
    env: {
      ...process.env,
      CANVASIGHT_CODEX_NATIVE: "1",
      CANVASIGHT_HOME: temporaryHome
    },
    stdio: ["pipe", "pipe", "pipe"],
    windowsHide: true
  });
  child.stderr.setEncoding("utf8");
  child.stderr.on("data", (chunk) => {
    stderr += chunk;
  });
  child.stdout.on("data", (chunk) => {
    stdoutBuffer = Buffer.concat([stdoutBuffer, chunk]);
    parseStdout();
  });
  child.once("error", rejectPending);
  child.once("exit", (code, signal) => {
    if (pending.size) rejectPending(new Error(`Server exited early: code=${code} signal=${signal}. stderr=${stderr}`));
  });
  record("spawned", { pid: child.pid });

  const initialized = await request("initialize", {
    protocolVersion: "2024-11-05",
    capabilities: {},
    clientInfo: { name: "canvasight-mcp-registration-probe", version: "1.0.0" }
  });
  assert.equal(initialized.serverInfo?.name, "canvasight");
  record("initialize_ok", { serverInfo: initialized.serverInfo });
  notify("notifications/initialized", {});

  const listed = await request("tools/list", {});
  const toolNames = listed.tools?.map((tool) => tool.name) ?? [];
  assert.ok(toolNames.includes("open_canvasight"), "open_canvasight is missing from tools/list");
  assert.ok(toolNames.includes("await_canvasight_widget_ready"), "await_canvasight_widget_ready is missing from tools/list");
  assert.ok(
    toolNames.includes("ask_canvasight_framework_questions"),
    "ask_canvasight_framework_questions is missing from tools/list"
  );
  record("tools_list_ok", {
    toolCount: toolNames.length,
    requiredToolsPresent: true,
    frameworkQuestionsToolPresent: true
  });

  const lifecycleRaw = await readFile(diagnostic.lifecycleLogPath, "utf8");
  const lifecycleEntries = lifecycleRaw
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => JSON.parse(line));
  diagnostic.lifecycleEvents = lifecycleEntries.map((entry) => entry.event);
  const lifecycleStart = lifecycleEntries.find((entry) => entry.event === "stdio_start");
  diagnostic.lifecycleStart = lifecycleStart
    ? {
        execPath: lifecycleStart.execPath,
        nodeVersion: lifecycleStart.nodeVersion,
        platform: lifecycleStart.platform,
        arch: lifecycleStart.arch,
        parentPid: lifecycleStart.parentPid,
        cwd: lifecycleStart.cwd
      }
    : null;
  assert.ok(diagnostic.lifecycleEvents.includes("stdio_start"), "MCP lifecycle is missing stdio_start");
  assert.ok(diagnostic.lifecycleEvents.includes("request"), "MCP lifecycle is missing request events");
  assert.equal(diagnostic.lifecycleStart?.execPath, process.execPath);
  assert.equal(diagnostic.lifecycleStart?.nodeVersion, process.version);
  assert.equal(diagnostic.lifecycleStart?.platform, process.platform);
  assert.equal(diagnostic.lifecycleStart?.arch, process.arch);
  assert.equal(diagnostic.lifecycleStart?.cwd, pluginRoot);
  assert.equal(Number.isInteger(diagnostic.lifecycleStart?.parentPid), true);

  console.log(JSON.stringify({ ok: true, ...diagnostic }, null, 2));
} catch (error) {
  record("failed", { message: error instanceof Error ? error.message : String(error), stderr });
  console.error(JSON.stringify({ ok: false, ...diagnostic }, null, 2));
  process.exitCode = 1;
} finally {
  clearTimeout(timeout);
  if (child && child.exitCode === null) {
    child.stdin.end();
    await new Promise((resolve) => {
      const forceKill = setTimeout(() => {
        child.kill();
        resolve();
      }, 2_000);
      child.once("exit", () => {
        clearTimeout(forceKill);
        resolve();
      });
    });
  }
  await rm(temporaryHome, { recursive: true, force: true });
}
