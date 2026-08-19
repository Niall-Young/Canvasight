#!/usr/bin/env node
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import fs from "node:fs";
import fsp from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pluginRoot = path.resolve(__dirname, "..");
const serverPath = path.join(pluginRoot, "mcp", "server.mjs");
const fakeCodex = path.join(pluginRoot, "tests", "fixtures", "fake-codex-app-server.mjs");
const packageVersion = JSON.parse(fs.readFileSync(path.join(pluginRoot, "package.json"), "utf8")).version;
const root = fs.mkdtempSync(path.join(os.tmpdir(), "canvasight-widget-session-recovery-"));
const canvasightHome = path.join(root, "home");
const projectPath = path.join(root, "project");
fs.mkdirSync(projectPath, { recursive: true });

function createMcpClient() {
  const child = spawn(process.execPath, [serverPath], {
    cwd: pluginRoot,
    env: {
      ...process.env,
      CANVASIGHT_CODEX_BIN: fakeCodex,
      CANVASIGHT_FAKE_THREAD_CWD: projectPath,
      CANVASIGHT_HOME: canvasightHome,
      CANVASIGHT_OPEN_BROWSER: "0",
      CANVASIGHT_OPEN_EXTERNAL_BROWSER: "0",
      CODEX_THREAD_ID: "thread-existing"
    },
    stdio: ["pipe", "pipe", "pipe"]
  });
  let nextId = 1;
  let stdout = "";
  let stderr = "";
  const pending = new Map();
  child.stdout.setEncoding("utf8");
  child.stderr.setEncoding("utf8");
  child.stderr.on("data", (chunk) => { stderr += chunk; });
  child.stdout.on("data", (chunk) => {
    stdout += chunk;
    while (stdout.includes("\n")) {
      const newline = stdout.indexOf("\n");
      const line = stdout.slice(0, newline).trim();
      stdout = stdout.slice(newline + 1);
      if (!line) continue;
      const message = JSON.parse(line);
      const request = pending.get(message.id);
      if (!request) continue;
      pending.delete(message.id);
      if (message.error) request.reject(new Error(message.error.message));
      else request.resolve(message.result);
    }
  });
  child.on("exit", (code, signal) => {
    for (const request of pending.values()) request.reject(new Error(`MCP exited code=${code} signal=${signal}: ${stderr}`));
    pending.clear();
  });
  return {
    child,
    request(method, params) {
      const id = nextId++;
      const promise = new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
      child.stdin.write(`${JSON.stringify({ jsonrpc: "2.0", id, method, params })}\n`);
      return promise;
    }
  };
}

async function waitForState({ absent = false, differentPid = null } = {}) {
  const statePath = path.join(canvasightHome, "daemon.json");
  for (let attempt = 0; attempt < 160; attempt += 1) {
    try {
      const state = JSON.parse(await fsp.readFile(statePath, "utf8"));
      if (!absent && (differentPid === null || state.pid !== differentPid)) return state;
    } catch (error) {
      if (absent && error?.code === "ENOENT") return null;
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error(absent ? "Canvasight daemon state was not removed" : "Canvasight daemon state was not published");
}

async function stopDaemon(state) {
  const response = await fetch(new URL("/api/daemon/stop", state.origin), {
    method: "POST",
    headers: { "x-canvasight-token": state.token }
  });
  assert.equal(response.ok, true);
  await waitForState({ absent: true });
}

const client = createMcpClient();
try {
  await client.request("initialize", {
    protocolVersion: "2024-11-05",
    capabilities: {},
    clientInfo: { name: "canvasight-widget-session-recovery-smoke", version: "0.0.0" }
  });
  const opened = await client.request("tools/call", {
    name: "open_canvasight",
    arguments: { projectPath, threadId: "thread-existing", language: "zh" }
  });
  const widgetData = opened._meta.widgetData;
  const originalState = await waitForState();
  await stopDaemon(originalState);

  const recovered = await client.request("tools/call", {
    name: "canvasight_widget_api",
    arguments: {
      path: `/api/sessions/${widgetData.sessionId}`,
      method: "GET",
      openAttemptId: widgetData.openAttemptId,
      widgetInstanceId: "widget-session-recovery",
      startupStage: "connecting_session",
      displayMode: "fullscreen",
      threadId: "thread-existing",
      reactMounted: true,
      projectPath,
      language: "zh"
    }
  });
  assert.equal(recovered.structuredContent.ok, true);
  assert.equal(recovered.structuredContent.recovery.reason, "session_recreated");
  assert.equal(recovered.structuredContent.recovery.previousSessionId, widgetData.sessionId);
  assert.notEqual(recovered.structuredContent.recovery.sessionId, widgetData.sessionId);
  assert.equal(recovered.structuredContent.data.sessionId, recovered.structuredContent.recovery.sessionId);
  const replacementState = await waitForState({ differentPid: originalState.pid });
  assert.notEqual(replacementState.pid, originalState.pid);

  const replacement = recovered.structuredContent.recovery;
  const ready = await client.request("tools/call", {
    name: "canvasight_widget_api",
    arguments: {
      path: `/api/sessions/${replacement.sessionId}/widget-ready`,
      method: "POST",
      body: {
        status: "ready",
        stage: "ready",
        startupStage: "ready",
        openAttemptId: replacement.openAttemptId,
        widgetInstanceId: "widget-session-recovery",
        displayMode: "fullscreen",
        threadId: "thread-existing",
        reactMounted: true,
        projectHydrated: true,
        canvasRendered: true,
        canvasVisible: true,
        canvasWidth: 900,
        canvasHeight: 700
      },
      openAttemptId: replacement.openAttemptId,
      widgetInstanceId: "widget-session-recovery",
      startupStage: "hydrating_project",
      displayMode: "fullscreen",
      threadId: "thread-existing",
      reactMounted: true,
      projectPath,
      language: "zh"
    }
  });
  assert.equal(ready.structuredContent.ok, true);
  assert.equal(ready.structuredContent.data.status, "ready");
  const awaited = await client.request("tools/call", {
    name: "await_canvasight_widget_ready",
    arguments: {
      sessionId: replacement.sessionId,
      openAttemptId: replacement.openAttemptId,
      threadId: "thread-existing",
      timeoutMs: 1000
    }
  });
  assert.equal(awaited.structuredContent.status, "ready");
  assert.equal(awaited.structuredContent.verified, true);

  await stopDaemon(replacementState);
  const versionParts = packageVersion.split(".").map(Number);
  const futureVersion = `${versionParts[0]}.${versionParts[1]}.${versionParts[2] + 1}`;
  const futurePluginRoot = path.join(root, "future-plugin");
  const futureServerPath = path.join(futurePluginRoot, "mcp", "server.mjs");
  fs.mkdirSync(path.dirname(futureServerPath), { recursive: true });
  const currentBundle = fs.readFileSync(serverPath, "utf8");
  const futureBundle = currentBundle.replace(
    `var SERVER_VERSION = "${packageVersion}";`,
    `var SERVER_VERSION = "${futureVersion}";`
  );
  assert.notEqual(futureBundle, currentBundle, "test fixture must patch the bundled server version");
  fs.writeFileSync(futureServerPath, futureBundle, "utf8");
  const futureDaemon = spawn(process.execPath, [futureServerPath, "--daemon", `--canvasight-home=${canvasightHome}`], {
    cwd: futurePluginRoot,
    env: { ...process.env, CANVASIGHT_DAEMON_TOKEN: "future-daemon-token" },
    stdio: "ignore"
  });
  const futureState = await waitForState({ differentPid: replacementState.pid });
  const blocked = await client.request("tools/call", {
    name: "open_canvasight",
    arguments: { projectPath, threadId: "thread-existing", language: "zh" }
  }).catch((error) => error);
  const blockedText = blocked instanceof Error ? blocked.message : JSON.stringify(blocked);
  assert.match(blockedText, new RegExp(`active daemon ${futureVersion} is newer than this MCP ${packageVersion}`));
  assert.deepEqual(JSON.parse(await fsp.readFile(path.join(canvasightHome, "daemon.json"), "utf8")), futureState);
  assert.doesNotThrow(() => process.kill(futureState.pid, 0), "an older cached MCP must not kill or replace the newer daemon");
  await stopDaemon(futureState);
  if (futureDaemon.exitCode === null) futureDaemon.kill("SIGTERM");

  const olderVersion = `${versionParts[0]}.${versionParts[1]}.${Math.max(0, versionParts[2] - 1)}`;
  const olderPluginRoot = path.join(root, "older-plugin");
  const olderServerPath = path.join(olderPluginRoot, "mcp", "server.mjs");
  fs.mkdirSync(path.dirname(olderServerPath), { recursive: true });
  const olderBundle = currentBundle.replace(
    `var SERVER_VERSION = "${packageVersion}";`,
    `var SERVER_VERSION = "${olderVersion}";`
  );
  assert.notEqual(olderBundle, currentBundle);
  fs.writeFileSync(olderServerPath, olderBundle, "utf8");
  const olderDaemon = spawn(process.execPath, [olderServerPath, "--daemon", `--canvasight-home=${canvasightHome}`], {
    cwd: olderPluginRoot,
    env: { ...process.env, CANVASIGHT_DAEMON_TOKEN: "older-daemon-token" },
    stdio: "ignore"
  });
  const olderState = await waitForState({ differentPid: futureState.pid });
  const reopened = await client.request("tools/call", {
    name: "open_canvasight",
    arguments: { projectPath, threadId: "thread-existing", language: "zh" }
  });
  assert.equal(reopened.structuredContent.status, "opening");
  const currentState = await waitForState({ differentPid: olderState.pid });
  assert.equal(currentState.serverVersion, packageVersion);
  assert.throws(() => process.kill(olderState.pid, 0), "the current MCP must cleanly replace an older daemon");
  if (olderDaemon.exitCode === null) olderDaemon.kill("SIGTERM");

  process.stdout.write("Canvasight session recovery and cross-version daemon ownership smoke passed.\n");
} finally {
  client.child.kill("SIGTERM");
  const state = await waitForState().catch(() => null);
  if (state) await stopDaemon(state).catch(() => undefined);
  fs.rmSync(root, { recursive: true, force: true });
}
