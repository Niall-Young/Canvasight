#!/usr/bin/env node
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { PROJECT_HISTORY_EVENT_VERSION } from "../mcp/domain/project-history-domain.mjs";
import { ProjectHistoryService } from "../mcp/application/project-history-service.mjs";
import { captureGitUserState } from "../mcp/infrastructure/git-history-snapshot.mjs";
import { ProjectHistoryStore } from "../mcp/infrastructure/project-history-store.mjs";

const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), "canvasight-history-core-"));
const repository = path.join(fixtureRoot, "repository");
const storePath = path.join(fixtureRoot, "store");
const git = (cwd, ...args) => execFileSync("git", ["-C", cwd, ...args], { encoding: "utf8" }).trim();
const simpleEvent = (id) => ({
  version: PROJECT_HISTORY_EVENT_VERSION,
  id,
  projectId: "store-project",
  type: "protection.enabled",
  occurredAt: "2026-08-10T10:00:00.000Z",
  payload: {}
});

try {
  fs.mkdirSync(repository);
  git(repository, "init", "-b", "main");
  git(repository, "config", "user.name", "Canvasight Core Probe");
  git(repository, "config", "user.email", "canvasight-core@example.invalid");
  fs.writeFileSync(path.join(repository, ".gitignore"), ".env\nnode_modules/\n", "utf8");
  fs.writeFileSync(path.join(repository, "app.txt"), "baseline\n", "utf8");
  fs.writeFileSync(path.join(repository, ".env"), "SECRET=baseline\n", "utf8");
  git(repository, "add", ".gitignore", "app.txt");
  git(repository, "add", "-f", ".env");
  git(repository, "commit", "-m", "baseline");
  fs.writeFileSync(path.join(repository, "dirty-at-start.txt"), "initial dirty state\n", "utf8");

  const originalHead = git(repository, "rev-parse", "HEAD");
  const beforeProtection = await captureGitUserState(repository);
  const service = await ProjectHistoryService.forRepository(repository);
  const enabled = await service.enableProtection({ currentTaskId: "task-1", classifyDirtyState: "feature-line" });
  assert.equal((await captureGitUserState(repository)).digest, beforeProtection.digest);
  assert.equal(enabled.index.nodes.length, 2);
  assert.equal(enabled.index.nodes[0].kind, "baseline");
  assert.equal(enabled.index.nodes[0].commit, originalHead);
  assert.equal(enabled.index.nodes[0].taskId, null);
  assert.equal(enabled.index.nodes[1].source, "external");
  assert.equal(enabled.index.nodes[1].taskId, null);
  assert.equal(enabled.index.nodes[1].changedPaths.some((item) => item.path === "dirty-at-start.txt"), true);
  assert.equal(enabled.index.featureLines[0].name, "启用前已有变化");
  const duplicateProtection = await service.enableProtection({ currentTaskId: "task-2", classifyDirtyState: "project-start" });
  assert.equal(duplicateProtection.duplicate, true);
  assert.equal(duplicateProtection.index.nodes.length, 2);
  fs.writeFileSync(path.join(repository, "app.txt"), "turn one\n", "utf8");
  fs.writeFileSync(path.join(repository, ".env"), "SECRET=changed\n", "utf8");
  const first = await service.recordTurn({ taskId: "task-1", turnId: "turn-1", status: "completed" });
  assert.equal(first.failed, undefined);
  assert.equal(first.index.nodes.length, 3);
  assert.equal(first.index.nodes[2].changedPaths.some((item) => item.path === "app.txt"), true);
  assert.equal(first.index.nodes[2].changedPaths.some((item) => item.path === ".env"), false);
  assert.equal(first.index.nodes[2].coverage.complete, false);

  const duplicate = await service.recordTurn({ taskId: "task-1", turnId: "turn-1", status: "completed" });
  assert.equal(duplicate.duplicate, true);
  const chat = await service.recordTurn({ taskId: "task-1", turnId: "turn-2", status: "completed" });
  assert.equal(chat.index.chatActivities.length, 1);

  fs.writeFileSync(path.join(repository, "app.txt"), "turn three\n", "utf8");
  const failed = await service.recordTurn({
    taskId: "task-1",
    turnId: "turn-3",
    status: "interrupted",
    snapshotOptions: { beforeRefUpdate: ({ snapshotRef }) => git(repository, "update-ref", snapshotRef, "HEAD") }
  });
  assert.equal(failed.failed, true);
  assert.equal(failed.index.protection.healthy, false);
  const recovered = await service.recordTurn({ taskId: "task-1", turnId: "turn-3", status: "interrupted" });
  assert.equal(recovered.failed, undefined);
  assert.equal(recovered.index.protection.healthy, true);

  const restarted = await ProjectHistoryService.forRepository(repository);
  const restartIndex = await restarted.readIndex();
  assert.equal(restartIndex.revision, recovered.index.revision);
  assert.equal(restartIndex.nodes.length, recovered.index.nodes.length);

  const projectStartRepository = path.join(fixtureRoot, "project-start-repository");
  fs.mkdirSync(projectStartRepository);
  git(projectStartRepository, "init", "-b", "main");
  git(projectStartRepository, "config", "user.name", "Canvasight Core Probe");
  git(projectStartRepository, "config", "user.email", "canvasight-core@example.invalid");
  fs.writeFileSync(path.join(projectStartRepository, "app.txt"), "baseline\n", "utf8");
  git(projectStartRepository, "add", "app.txt");
  git(projectStartRepository, "commit", "-m", "baseline");
  fs.writeFileSync(path.join(projectStartRepository, "app.txt"), "dirty project start\n", "utf8");
  const beforeProjectStart = await captureGitUserState(projectStartRepository);
  const projectStartService = await ProjectHistoryService.forRepository(projectStartRepository);
  const projectStart = await projectStartService.enableProtection({ classifyDirtyState: "project-start" });
  assert.equal((await captureGitUserState(projectStartRepository)).digest, beforeProjectStart.digest);
  assert.equal(projectStart.index.nodes.length, 1);
  assert.equal(projectStart.index.nodes[0].kind, "baseline");
  assert.equal(git(projectStartRepository, "show", `${projectStart.index.nodes[0].commit}:app.txt`), "dirty project start");

  const retryRepository = path.join(fixtureRoot, "retry-repository");
  fs.mkdirSync(retryRepository);
  git(retryRepository, "init", "-b", "main");
  git(retryRepository, "config", "user.name", "Canvasight Core Probe");
  git(retryRepository, "config", "user.email", "canvasight-core@example.invalid");
  fs.writeFileSync(path.join(retryRepository, "app.txt"), "baseline\n", "utf8");
  git(retryRepository, "add", "app.txt");
  git(retryRepository, "commit", "-m", "baseline");
  fs.writeFileSync(path.join(retryRepository, "dirty.txt"), "survive partial initialization\n", "utf8");
  let baselineFailureInjected = false;
  const interruptedService = await ProjectHistoryService.forRepository(retryRepository, {
    storeOptions: {
      beforePersist: ({ receiptId }) => {
        if (!baselineFailureInjected && receiptId.endsWith(":snapshot")) {
          baselineFailureInjected = true;
          throw new Error("injected baseline completion failure");
        }
      }
    }
  });
  await assert.rejects(
    interruptedService.enableProtection({ classifyDirtyState: "feature-line" }),
    /injected baseline completion failure/u
  );
  const retriedService = await ProjectHistoryService.forRepository(retryRepository);
  const retriedProtection = await retriedService.enableProtection({ classifyDirtyState: "project-start" });
  assert.equal(retriedProtection.index.nodes.length, 2);
  assert.equal(retriedProtection.index.featureLines.length, 1);
  assert.equal(retriedProtection.index.nodes[1].changedPaths.some((item) => item.path === "dirty.txt"), true);
  assert.equal((await retriedService.enableProtection()).duplicate, true);

  const legacyRetryRepository = path.join(fixtureRoot, "legacy-retry-repository");
  fs.mkdirSync(legacyRetryRepository);
  git(legacyRetryRepository, "init", "-b", "main");
  git(legacyRetryRepository, "config", "user.name", "Canvasight Core Probe");
  git(legacyRetryRepository, "config", "user.email", "canvasight-core@example.invalid");
  fs.writeFileSync(path.join(legacyRetryRepository, "app.txt"), "baseline\n", "utf8");
  git(legacyRetryRepository, "add", "app.txt");
  git(legacyRetryRepository, "commit", "-m", "baseline");
  fs.writeFileSync(path.join(legacyRetryRepository, "dirty.txt"), "legacy partial initialization\n", "utf8");
  let snapshotFailureInjected = false;
  const legacyInterruptedService = await ProjectHistoryService.forRepository(legacyRetryRepository, {
    snapshotOptions: {
      beforeRefUpdate: () => {
        if (!snapshotFailureInjected) {
          snapshotFailureInjected = true;
          throw new Error("injected initial snapshot failure");
        }
      }
    }
  });
  await assert.rejects(
    legacyInterruptedService.enableProtection({ classifyDirtyState: "project-start" }),
    /injected initial snapshot failure/u
  );
  assert.equal((await legacyInterruptedService.readIndex()).protection.initialized, false);
  const legacyRetryService = await ProjectHistoryService.forRepository(legacyRetryRepository);
  const legacyExternal = await legacyRetryService.recordTurn({ taskId: "external-change", turnId: "legacy-recovery", status: "completed", source: "external" });
  assert.equal(legacyExternal.index.protection.initialized, false);
  const legacyExternalCommit = legacyExternal.index.nodes[0].commit;
  const legacyCompleted = await legacyRetryService.enableProtection({ classifyDirtyState: "feature-line" });
  assert.equal(legacyCompleted.index.protection.initialized, true);
  assert.equal(legacyCompleted.index.nodes[0].kind, "baseline");
  assert.equal(legacyCompleted.index.nodes[0].commit, legacyExternalCommit);
  assert.equal(legacyCompleted.index.nodes[0].tree, legacyExternal.index.nodes[0].tree);
  assert.equal(legacyCompleted.index.nodes[0].changedPaths.some((item) => item.path === "dirty.txt"), true);

  const store = new ProjectHistoryStore(storePath);
  await store.initialize();
  await store.append(simpleEvent("event-1"), "receipt-1");
  assert.equal((await store.append(simpleEvent("event-1"), "receipt-1")).duplicate, true);
  await assert.rejects(store.append({ ...simpleEvent("event-1"), payload: { changed: true } }, "receipt-1"), /different content/u);
  const currentIndex = await store.readIndex();
  fs.writeFileSync(store.indexPath, `${JSON.stringify({ ...currentIndex, staleDerivedValue: true }, null, 2)}\n`, "utf8");
  const repairedIndex = await store.readIndex();
  assert.equal(Object.hasOwn(repairedIndex, "staleDerivedValue"), false, "same-revision derived caches must rebuild from the journal");
  assert.equal(Object.hasOwn(JSON.parse(fs.readFileSync(store.indexPath, "utf8")), "staleDerivedValue"), false, "repaired derived caches must persist");
  fs.rmSync(store.indexPath);
  const concurrentIndexes = await Promise.all([
    ...Array.from({ length: 20 }, () => store.readIndex()),
    ...Array.from({ length: 20 }, () => store.rebuild())
  ]);
  assert.equal(concurrentIndexes.every((index) => index.revision === 1), true, "concurrent cache rebuilds must share one stable index revision");
  assert.equal(fs.readdirSync(storePath).some((name) => name.endsWith(".tmp")), false, "index writes must not leave temporary files behind");
  fs.mkdirSync(store.lockPath);
  await assert.rejects(store.append(simpleEvent("event-2"), "receipt-2"), /locked/u);
  fs.rmdirSync(store.lockPath);

  const failingStore = new ProjectHistoryStore(path.join(fixtureRoot, "failing-store"), {
    beforePersist: () => { throw new Error("injected disk failure"); }
  });
  await failingStore.initialize();
  await assert.rejects(failingStore.append(simpleEvent("event-fail"), "receipt-fail"), /injected disk failure/u);
  assert.equal((await failingStore.readEvents()).length, 0);

  process.stdout.write("Project History D2 core, restart, idempotency, and failure smoke passed.\n");
} finally {
  fs.rmSync(fixtureRoot, { recursive: true, force: true });
}
