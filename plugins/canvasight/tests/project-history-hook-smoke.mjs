#!/usr/bin/env node
import assert from "node:assert/strict";
import { execFileSync, spawn } from "node:child_process";
import fs from "node:fs";
import fsp from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { ProjectHistoryExternalWatcher } from "../mcp/application/project-history-external-watcher.mjs";
import { ProjectHistoryService } from "../mcp/application/project-history-service.mjs";
import { ProjectHistoryObserverState } from "../mcp/infrastructure/project-history-observer-state.mjs";

const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), "canvasight-history-hook-"));
const repository = path.join(fixtureRoot, "repository");
const taskCwd = fixtureRoot;
const home = path.join(fixtureRoot, "home");
const turnsPath = path.join(fixtureRoot, "turns.json");
const serverPath = path.resolve("mcp/server.mjs");
const pluginRoot = path.resolve(".");
const hookPath = path.resolve("hooks/project-history-stop.mjs");
const fakeCodex = path.resolve("tests/fixtures/fake-codex-app-server.mjs");
const token = "canvasight-history-hook-token";
const git = (cwd, ...args) => execFileSync("git", ["-C", cwd, ...args], { encoding: "utf8" }).trim();

async function waitForState() {
  const statePath = path.join(home, "daemon.json");
  for (let attempt = 0; attempt < 100; attempt += 1) {
    try { return JSON.parse(await fsp.readFile(statePath, "utf8")); } catch { await new Promise((resolve) => setTimeout(resolve, 50)); }
  }
  throw new Error("Canvasight daemon did not publish state");
}

async function request(origin, route, options = {}) {
  const response = await fetch(new URL(route, origin), {
    ...options,
    headers: { "content-type": "application/json", "x-canvasight-token": token, ...(options.headers ?? {}) }
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(`${response.status} ${JSON.stringify(payload)}`);
  return payload;
}

function runHook(input, hookPluginRoot = pluginRoot) {
  return execFileSync(process.execPath, [hookPath], {
    cwd: taskCwd,
    encoding: "utf8",
    input: JSON.stringify(input),
    env: {
      ...process.env,
      CANVASIGHT_HOME: home,
      PLUGIN_ROOT: hookPluginRoot
    }
  });
}

let daemon = null;
try {
  fs.mkdirSync(repository);
  git(repository, "init", "-b", "main");
  git(repository, "config", "user.name", "Canvasight Hook Probe");
  git(repository, "config", "user.email", "canvasight-hook@example.invalid");
  fs.writeFileSync(path.join(repository, ".gitignore"), ".scatter/\n", "utf8");
  fs.writeFileSync(path.join(repository, "app.txt"), "baseline\n", "utf8");
  git(repository, "add", ".gitignore", "app.txt");
  git(repository, "commit", "-m", "baseline");
  const service = await ProjectHistoryService.forRepository(repository);
  await service.enableProtection({ currentTaskId: "thread-existing", classifyDirtyState: "project-start" });
  const observer = new ProjectHistoryObserverState(service.store.storageDirectory);
  await new ProjectHistoryExternalWatcher(service, observer).acknowledgeCurrent();
  fs.writeFileSync(turnsPath, "[]", "utf8");
  const completedTurn = {
    id: "turn-hook",
    status: "completed",
    startedAt: 1_786_430_000,
    completedAt: 1_786_430_001,
    items: [
      { type: "userMessage", id: "user-hook", content: [{ type: "text", text: "# Canvasight 任务: 修复版本记录\n\n节点 ID: workflow-node-history\n### 提示词\n修复真实项目历史闭环\n\n### 附件\n- 无" }] },
      {
        type: "fileChange",
        id: "change-hook",
        status: "completed",
        changes: [{ path: path.join(repository, "app.txt"), kind: { type: "update", move_path: null }, diff: "@@" }]
      },
      { type: "agentMessage", id: "agent-hook", text: "真实闭环已经完成。", phase: "final_answer" }
    ]
  };
  fs.chmodSync(fakeCodex, 0o755);

  daemon = spawn(process.execPath, [serverPath, "--daemon", `--canvasight-home=${home}`], {
    stdio: ["ignore", "pipe", "pipe"],
    env: {
      ...process.env,
      CANVASIGHT_HOME: home,
      CANVASIGHT_DAEMON_TOKEN: token,
      CANVASIGHT_CODEX_BIN: fakeCodex,
      CANVASIGHT_FAKE_THREAD_CWD: taskCwd,
      CANVASIGHT_FAKE_TURNS_PATH: turnsPath
    }
  });
  const state = await waitForState();
  const cachedOlderPluginRoot = path.join(fixtureRoot, "cached-plugin-0.6.9");
  fs.mkdirSync(cachedOlderPluginRoot);
  const opened = await request(state.origin, "/api/sessions", {
    method: "POST",
    body: JSON.stringify({ projectPath: repository, threadId: "thread-existing", language: "zh" })
  });
  assert.equal(runHook({
    hook_event_name: "UserPromptSubmit",
    session_id: "thread-existing",
    turn_id: "turn-missing",
    cwd: taskCwd,
    prompt: "this turn will not be readable"
  }).trim(), "{}");
  assert.equal(runHook({
    hook_event_name: "Stop",
    session_id: "thread-existing",
    turn_id: "turn-missing",
    cwd: taskCwd,
    last_assistant_message: "missing"
  }).trim(), "{}", "a failed Stop capture must remain non-blocking");
  assert.equal((await observer.activeTurns()).length, 0, "failed Stop inspection must release active-turn attribution");
  const promptInput = {
    hook_event_name: "UserPromptSubmit",
    session_id: "thread-existing",
    turn_id: "turn-hook",
    cwd: taskCwd,
    prompt: "修复真实项目历史闭环"
  };
  assert.equal(
    runHook(promptInput, cachedOlderPluginRoot).trim(),
    "{}",
    "a cached hook must forward to the active Canvasight daemon instead of competing over pluginRoot"
  );
  fs.writeFileSync(path.join(repository, "app.txt"), "captured by Stop hook\n", "utf8");
  fs.writeFileSync(turnsPath, JSON.stringify([completedTurn]), "utf8");
  const deferred = await new ProjectHistoryExternalWatcher(service, observer, { silenceMs: 0 }).inspect({
    now: new Date(Date.now() + 60_000)
  });
  assert.equal(deferred.status, "waiting-for-codex-turn", "active Codex turns must win attribution over the external watcher");
  assert.equal((await service.readIndex()).nodes.some((candidate) => candidate.taskId === "external-change"), false);
  const hookInput = {
    hook_event_name: "Stop",
    session_id: "thread-existing",
    turn_id: "turn-hook",
    cwd: taskCwd,
    stop_hook_active: false,
    last_assistant_message: "真实闭环已经完成。"
  };
  assert.equal(runHook(hookInput, cachedOlderPluginRoot).trim(), "{}");

  const history = await request(state.origin, `/api/sessions/${opened.session.sessionId}/history`);
  const node = history.index.nodes.find((candidate) => candidate.taskId === "thread-existing" && candidate.turnId === "turn-hook");
  assert.ok(node, "Stop hook should create a task-attributed History node");
  assert.equal(node.summary, "修复真实项目历史闭环");
  assert.equal(node.workflowNodeId, "workflow-node-history");
  assert.equal(node.workflowTitle, "修复版本记录");
  assert.equal(history.index.featureLines.find((feature) => feature.id === node.featureLineId)?.name, "修复版本记录");
  assert.equal(node.source, "codex");
  assert.equal(node.changedPaths.some((change) => change.path === "app.txt"), true);
  assert.equal(history.provider.coverage.source, "codex-stop-hook");
  assert.equal(history.provider.observedTurnCount, 1);
  assert.equal(history.provider.activeTurnCount, 0);
  assert.equal(history.index.nodes.some((candidate) => candidate.taskId === "external-change"), false);

  assert.equal(runHook(hookInput).trim(), "{}", "replayed Stop hook should still complete cleanly");
  const replayed = await request(state.origin, `/api/sessions/${opened.session.sessionId}/history`);
  assert.equal(replayed.index.nodes.filter((candidate) => candidate.taskId === "thread-existing" && candidate.turnId === "turn-hook").length, 1);
  assert.equal(replayed.index.chatActivities.filter((chat) => chat.taskId === "thread-existing" && chat.turnId === "turn-hook").length, 0);

  process.stdout.write("Project History real Stop hook -> task binding -> Git snapshot -> History node smoke passed.\n");
} finally {
  if (daemon?.exitCode === null) daemon.kill("SIGTERM");
  await new Promise((resolve) => setTimeout(resolve, 100));
  fs.rmSync(fixtureRoot, { recursive: true, force: true });
}
