#!/usr/bin/env node
import assert from "node:assert/strict";
import { execFileSync, spawn } from "node:child_process";
import fs from "node:fs";
import fsp from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { ProjectHistoryAgentCheckService } from "../mcp/application/project-history-agent-check-service.mjs";
import { ProjectHistoryService } from "../mcp/application/project-history-service.mjs";

const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), "canvasight-history-api-"));
const repository = path.join(fixtureRoot, "repository");
const home = path.join(fixtureRoot, "home");
const turnsPath = path.join(fixtureRoot, "turns.json");
const exportDirectory = path.join(fixtureRoot, "downloads");
const serverPath = path.resolve("mcp/server.mjs");
const fakeCodex = path.resolve("tests/fixtures/fake-codex-app-server.mjs");
const token = "canvasight-history-api-token";
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

let daemon = null;
try {
  fs.mkdirSync(repository);
  git(repository, "init", "-b", "main");
  git(repository, "config", "user.name", "Canvasight API Probe");
  git(repository, "config", "user.email", "canvasight-api@example.invalid");
  fs.writeFileSync(path.join(repository, "app.txt"), "baseline\n", "utf8");
  git(repository, "add", "app.txt");
  git(repository, "commit", "-m", "baseline");
  fs.writeFileSync(path.join(repository, "app.txt"), "partial initialization\n", "utf8");
  const partiallyInitialized = await ProjectHistoryService.forRepository(repository, {
    snapshotOptions: { beforeRefUpdate: () => { throw new Error("injected initial snapshot failure"); } }
  });
  await assert.rejects(
    partiallyInitialized.enableProtection({ currentTaskId: "thread-existing", classifyDirtyState: "project-start" }),
    /injected initial snapshot failure/u
  );
  assert.equal((await partiallyInitialized.readIndex()).protection.initialized, false);
  fs.writeFileSync(turnsPath, JSON.stringify([{ id: "turn-existing", status: "completed", startedAt: 1_786_339_000, completedAt: 1_786_339_001 }]), "utf8");
  fs.chmodSync(fakeCodex, 0o755);

  daemon = spawn(process.execPath, [serverPath, "--daemon", `--canvasight-home=${home}`], {
    stdio: ["ignore", "pipe", "pipe"],
    env: {
      ...process.env,
      CANVASIGHT_HOME: home,
      CANVASIGHT_DAEMON_TOKEN: token,
      CANVASIGHT_CODEX_BIN: fakeCodex,
      CANVASIGHT_EXPORT_DIR: exportDirectory,
      CANVASIGHT_FAKE_THREAD_CWD: repository,
      CANVASIGHT_FAKE_TURNS_PATH: turnsPath
    }
  });
  const state = await waitForState();
  const opened = await request(state.origin, "/api/sessions", {
    method: "POST",
    body: JSON.stringify({ projectPath: repository, threadId: "thread-existing", language: "zh" })
  });
  const sessionRoute = `/api/sessions/${opened.session.sessionId}`;
  const before = await request(state.origin, `${sessionRoute}/history`);
  assert.equal(before.status, "ready");
  assert.equal(before.enabled, false);

  const enabled = await request(state.origin, `${sessionRoute}/history-enable`, {
    method: "POST",
    body: JSON.stringify({ threadId: "thread-existing", classifyDirtyState: "project-start" })
  });
  assert.equal(enabled.enabled, true);
  assert.equal(enabled.index.nodes.length, 1);
  assert.equal(enabled.provider.observedTurnCount, 1);

  fs.writeFileSync(path.join(repository, "app.txt"), "new turn\n", "utf8");
  fs.writeFileSync(turnsPath, JSON.stringify([
    { id: "turn-existing", status: "completed", startedAt: 1_786_339_000, completedAt: 1_786_339_001 },
    { id: "turn-new", status: "completed", startedAt: 1_786_339_100, completedAt: 1_786_339_101 }
  ]), "utf8");
  const refreshed = await request(state.origin, `${sessionRoute}/history-refresh`, { method: "POST", body: "{}" });
  assert.equal(refreshed.refreshedObservationCount, 1);
  assert.equal(refreshed.index.nodes.length, 2);
  const changedNode = refreshed.index.nodes.find((node) => node.kind === "snapshot");
  assert.equal(changedNode.summary.includes("app.txt"), true);
  assert.equal(changedNode.source, "mixed");

  const agentPreparation = await request(state.origin, `${sessionRoute}/history-agent-check-prepare`, {
    method: "POST",
    body: JSON.stringify({ nodeId: changedNode.id })
  });
  const dispatched = await request(state.origin, `${sessionRoute}/history-agent-check-dispatched`, {
    method: "POST",
    body: JSON.stringify({ token: agentPreparation.token })
  });
  assert.equal(dispatched.index.nodes.find((node) => node.id === changedNode.id).agentCheck.status, "requested");
  const directHistory = await ProjectHistoryService.forRepository(repository);
  await new ProjectHistoryAgentCheckService(directHistory).record(agentPreparation.token, {
    outcome: "passed",
    summary: "Verified changed behavior.",
    evidence: ["Observed the expected output"],
    taskId: "agent-check-task"
  });
  const agentRecorded = await request(state.origin, `${sessionRoute}/history`);
  assert.equal(agentRecorded.index.nodes.find((node) => node.id === changedNode.id).agentCheck.status, "passed");

  const savedView = await request(state.origin, `${sessionRoute}/history-view`, {
    method: "PUT",
    body: JSON.stringify({
      expectedRevision: refreshed.view.revision,
      view: { ...refreshed.view, viewport: { x: 12, y: 34, zoom: 0.8 }, positions: { [changedNode.id]: { x: 500, y: 240 } } }
    })
  });
  assert.equal(savedView.revision, 1);
  const reloaded = await request(state.origin, `${sessionRoute}/history`);
  assert.deepEqual(reloaded.view.viewport, { x: 12, y: 34, zoom: 0.8 });
  assert.deepEqual(reloaded.view.positions[changedNode.id], { x: 500, y: 240 });

  const exported = await request(state.origin, `${sessionRoute}/history-portability`, {
    method: "POST",
    body: JSON.stringify({ operation: "export-local" })
  });
  assert.equal(exported.operation.status, "exported-local");
  assert.equal(fs.existsSync(exported.operation.targetPath), true);
  const exportedManifest = JSON.parse(fs.readFileSync(exported.operation.targetPath, "utf8"));
  assert.equal(JSON.stringify(exportedManifest).includes("thread-existing"), false, "file export must not contain task IDs");
  const imported = await request(state.origin, `${sessionRoute}/history-portability`, {
    method: "POST",
    body: JSON.stringify({ operation: "import-local", manifest: exportedManifest })
  });
  assert.equal(imported.operation.status, "imported-local");

  process.stdout.write("Project History daemon API, Agent check dispatch, provider polling, and local manifest transfer smoke passed.\n");
} finally {
  if (daemon?.exitCode === null) daemon.kill("SIGTERM");
  await new Promise((resolve) => setTimeout(resolve, 100));
  fs.rmSync(fixtureRoot, { recursive: true, force: true });
}
