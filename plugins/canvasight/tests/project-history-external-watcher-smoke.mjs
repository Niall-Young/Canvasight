#!/usr/bin/env node
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { ProjectHistoryExternalWatcher } from "../mcp/application/project-history-external-watcher.mjs";
import { ProjectHistoryService } from "../mcp/application/project-history-service.mjs";
import { ProjectHistoryObserverState } from "../mcp/infrastructure/project-history-observer-state.mjs";

const root = fs.mkdtempSync(path.join(os.tmpdir(), "canvasight-history-external-watcher-"));
const repository = path.join(root, "repository");
const git = (...args) => execFileSync("git", ["-C", repository, ...args], { encoding: "utf8" }).trim();

try {
  fs.mkdirSync(repository);
  git("init", "-b", "main");
  git("config", "user.name", "Canvasight External Watcher Probe");
  git("config", "user.email", "canvasight-external@example.invalid");
  fs.writeFileSync(path.join(repository, "app.txt"), "baseline\n");
  git("add", "app.txt");
  git("commit", "-m", "baseline");

  const service = await ProjectHistoryService.forRepository(repository, { exclusions: [] });
  await service.enableProtection();
  const observer = new ProjectHistoryObserverState(service.store.storageDirectory);
  const watcher = new ProjectHistoryExternalWatcher(service, observer, { silenceMs: 120_000 });
  const start = new Date("2026-08-10T10:00:00.000Z");
  await watcher.inspect({ now: start });

  fs.mkdirSync(path.join(repository, ".scatter"), { recursive: true });
  fs.writeFileSync(path.join(repository, ".scatter", "scatter.json"), "{}\n");
  const canvasMetadataOnly = await watcher.inspect({ now: new Date(start.getTime() + 500) });
  assert.equal(canvasMetadataOnly.status, "observing", "Canvasight metadata must not create an external project checkpoint");
  assert.equal((await service.readIndex()).nodes.length, 1);

  fs.writeFileSync(path.join(repository, "app.txt"), "external edit\n");
  const waiting = await watcher.inspect({ now: new Date(start.getTime() + 1_000) });
  assert.equal(waiting.status, "waiting-for-silence");
  assert.equal((await service.readIndex()).nodes.length, 1);
  const sealed = await watcher.inspect({ now: new Date(start.getTime() + 122_000) });
  assert.equal(sealed.reason, "two-minute-silence");
  assert.equal((await service.readIndex()).nodes.length, 2);
  assert.equal((await service.readIndex()).nodes.at(-1).source, "external");
  const duplicate = await watcher.inspect({ now: new Date(start.getTime() + 300_000) });
  assert.equal(duplicate.sealed, false);

  git("add", "app.txt");
  git("commit", "-m", "external commit");
  const commitSeal = await new ProjectHistoryExternalWatcher(service, new ProjectHistoryObserverState(service.store.storageDirectory), { silenceMs: 120_000 })
    .inspect({ now: new Date(start.getTime() + 301_000) });
  assert.equal(commitSeal.reason, "external-commit");
  const indexAfterCommit = await service.readIndex();
  assert.equal(indexAfterCommit.nodes.length, 3, "external commit must create a node even when the tree matches the prior dirty snapshot");
  assert.equal(indexAfterCommit.nodes.at(-1).summary, "external commit", "external commits must keep their user-authored subject");

  git("switch", "-c", "feat/04-finance-ledger");
  fs.writeFileSync(path.join(repository, "ledger.txt"), "double-entry ledger\n");
  git("add", "ledger.txt");
  git("commit", "-m", "Add immutable double entry finance ledger");
  const financeCommit = git("rev-parse", "HEAD");
  git("switch", "main");
  const branchTipReconcile = await watcher.inspect({ now: new Date(start.getTime() + 301_500) });
  assert.equal(branchTipReconcile.status, "unchanged", "off-current Worktree branches must not masquerade as current HEAD changes");
  assert.deepEqual(branchTipReconcile.branchTips.captured, [{ branch: "feat/04-finance-ledger", commit: financeCommit }]);
  const financeNode = (await service.readIndex()).nodes.find((node) => node.gitBranch === "feat/04-finance-ledger");
  assert.equal(financeNode?.summary, "Add immutable double entry finance ledger");
  assert.deepEqual(financeNode?.changedPaths, [{ status: "A", path: "ledger.txt" }]);
  const branchTipReplay = await watcher.inspect({ now: new Date(start.getTime() + 301_600) });
  assert.equal(branchTipReplay.branchTips.captured.length, 0, "branch tip scans must be idempotent");
  assert.equal((await service.readIndex()).nodes.filter((node) => node.gitBranch === "feat/04-finance-ledger").length, 1);

  fs.writeFileSync(path.join(repository, "app.txt"), "captured by Codex\n");
  const codexCapture = await service.recordTurn({ taskId: "codex-task", turnId: "codex-turn", status: "completed" });
  assert.equal(codexCapture.snapshotRecorded, true);
  const nodeCountAfterCodexCapture = (await service.readIndex()).nodes.length;
  const restartedWatcher = new ProjectHistoryExternalWatcher(service, new ProjectHistoryObserverState(service.store.storageDirectory), { silenceMs: 120_000 });
  await restartedWatcher.acknowledgeCurrent({ now: new Date(start.getTime() + 302_000) });
  const acknowledged = await restartedWatcher.inspect({ now: new Date(start.getTime() + 500_000) });
  assert.equal(acknowledged.status, "unchanged");
  assert.equal((await service.readIndex()).nodes.length, nodeCountAfterCodexCapture, "a Codex-captured snapshot must not be duplicated as an external change");

  process.stdout.write("Project History external silence, commit, restart, and Codex deduplication smoke passed.\n");
} finally {
  fs.rmSync(root, { recursive: true, force: true });
}
