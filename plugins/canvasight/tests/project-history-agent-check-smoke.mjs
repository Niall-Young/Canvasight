#!/usr/bin/env node
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { ProjectHistoryAgentCheckService } from "../mcp/application/project-history-agent-check-service.mjs";
import { ProjectHistoryReleaseService } from "../mcp/application/project-history-release-service.mjs";
import { ProjectHistoryService } from "../mcp/application/project-history-service.mjs";

const root = fs.mkdtempSync(path.join(os.tmpdir(), "canvasight-history-agent-check-"));
const repository = path.join(root, "repository");
const git = (...args) => execFileSync("git", ["-C", repository, ...args], { encoding: "utf8" }).trim();

try {
  fs.mkdirSync(repository);
  git("init", "-b", "main");
  git("config", "user.name", "Canvasight Agent Check Probe");
  git("config", "user.email", "canvasight-agent-check@example.invalid");
  fs.writeFileSync(path.join(repository, "package.json"), `${JSON.stringify({ scripts: { test: "node -e \"process.exit(0)\"" } }, null, 2)}\n`);
  fs.writeFileSync(path.join(repository, "app.js"), "export const value = 1;\n");
  git("add", "package.json", "app.js");
  git("commit", "-m", "baseline");

  const history = await ProjectHistoryService.forRepository(repository, { exclusions: [] });
  await history.enableProtection({ currentTaskId: "task-agent-check" });
  fs.writeFileSync(path.join(repository, "app.js"), "export const value = 2;\n");
  const node = (await history.recordTurn({ taskId: "task-agent-check", turnId: "turn-agent-check", status: "completed" })).index.nodes.at(-1);
  const checks = new ProjectHistoryAgentCheckService(history);
  const release = new ProjectHistoryReleaseService(history);

  await assert.rejects(release.prepareConfirmation(node.id), /Agent functional check/u);
  const failedRequest = await checks.prepare(node.id);
  await checks.markRequested(failedRequest.token);
  assert.equal((await history.readIndex()).nodes.at(-1).agentCheck.status, "requested");
  await assert.rejects(checks.record(`${failedRequest.token}tampered`, {
    outcome: "passed",
    summary: "invalid",
    evidence: [],
    taskId: "agent-task"
  }), /signature|invalid/u);
  await checks.record(failedRequest.token, {
    outcome: "failed",
    summary: "Functional behavior did not match the expected result.",
    evidence: ["Observed value 1 instead of 2"],
    taskId: "agent-task"
  });
  await assert.rejects(release.prepareConfirmation(node.id), /Agent functional check/u);

  const passedRequest = await checks.prepare(node.id);
  await checks.record(passedRequest.token, {
    outcome: "passed",
    summary: "Verified the exact protected snapshot behavior.",
    evidence: ["npm test passed", "Observed value 2"],
    taskId: "agent-task"
  });
  await checks.markRequested(passedRequest.token);
  assert.equal((await history.readIndex()).nodes.at(-1).agentCheck.status, "passed");
  const confirmation = await release.prepareConfirmation(node.id);
  assert.equal(confirmation.verification.passed, true);
  const supersedingRequest = await checks.prepare(node.id);
  await checks.markRequested(supersedingRequest.token);
  await assert.rejects(release.confirmNode(confirmation.token), /Agent functional check changed/u);

  process.stdout.write("Project History token-bound Agent acceptance and confirmation gate smoke passed.\n");
} finally {
  fs.rmSync(root, { recursive: true, force: true });
}
