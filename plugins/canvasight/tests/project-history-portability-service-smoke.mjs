#!/usr/bin/env node
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { ProjectHistoryPortabilityService } from "../mcp/application/project-history-portability-service.mjs";
import { ProjectHistoryService } from "../mcp/application/project-history-service.mjs";
import { ProjectHistoryViewStore } from "../mcp/infrastructure/project-history-view-store.mjs";

const root = fs.mkdtempSync(path.join(os.tmpdir(), "canvasight-history-portability-service-"));
const remote = path.join(root, "remote.git");
const source = path.join(root, "source");
const clone = path.join(root, "clone");
const git = (cwd, ...args) => execFileSync("git", ["-C", cwd, ...args], { encoding: "utf8" }).trim();

try {
  fs.mkdirSync(source);
  git(source, "init", "-b", "main");
  git(source, "config", "user.name", "Canvasight Portability Service Probe");
  git(source, "config", "user.email", "canvasight-portability-service@example.invalid");
  fs.writeFileSync(path.join(source, "app.txt"), "baseline\n");
  git(source, "add", "app.txt");
  git(source, "commit", "-m", "baseline");
  execFileSync("git", ["init", "--bare", remote]);
  git(source, "remote", "add", "origin", remote);
  git(source, "push", "-u", "origin", "main");

  const sourceHistory = await ProjectHistoryService.forRepository(source, { exclusions: [] });
  await sourceHistory.enableProtection({ currentTaskId: "private-task-id" });
  fs.writeFileSync(path.join(source, "app.txt"), "portable change\n");
  const recorded = await sourceHistory.recordTurn({ taskId: "private-task-id", turnId: "private-turn-id", status: "completed" });
  const sourceView = new ProjectHistoryViewStore(sourceHistory.store.storageDirectory);
  const initialView = await sourceView.read();
  await sourceView.save({ ...initialView, positions: { [recorded.index.nodes.at(-1).id]: { x: 424, y: 212 } } }, initialView.revision);
  const sourcePortability = new ProjectHistoryPortabilityService(sourceHistory, sourceView);
  await sourcePortability.authorize("origin");
  const synced = await sourcePortability.sync();
  assert.equal(synced.status, "synced");
  const manifestText = git(source, "show", `${synced.historyRef}:history.json`);
  const syncedManifest = JSON.parse(manifestText);
  const recordedNode = recorded.index.nodes.at(-1);
  assert.equal(
    syncedManifest.events.find((event) => event.id === recordedNode.id)?.occurredAt,
    recordedNode.occurredAt,
    "portable History must preserve the real event time"
  );
  assert.equal(manifestText.includes("private-task-id"), false);
  assert.equal(manifestText.includes("private-turn-id"), false);
  assert.equal(manifestText.includes("portable change"), false, "sidecar must not contain file contents");

  execFileSync("git", ["clone", "--branch", "main", remote, clone]);
  const cloneHistory = await ProjectHistoryService.forRepository(clone, { exclusions: [] });
  const cloneView = new ProjectHistoryViewStore(cloneHistory.store.storageDirectory);
  const clonePortability = new ProjectHistoryPortabilityService(cloneHistory, cloneView);
  const imported = await clonePortability.importRemote("origin");
  assert.equal(imported.status, "imported");
  const restored = await clonePortability.readImportStatus();
  assert.equal(restored.manifest.events.some((event) => event.summary.includes("app.txt")), true);
  assert.equal(restored.manifest.events.find((event) => event.id === recordedNode.id)?.occurredAt, recordedNode.occurredAt);
  assert.equal(restored.manifest.layout.some((item) => item.x === 424 && item.y === 212), true);

  const exportedManifest = await sourcePortability.manifest();
  const importedFromFile = await clonePortability.importManifest(JSON.parse(JSON.stringify(exportedManifest)));
  assert.equal(importedFromFile.status, "imported-local");
  assert.equal(importedFromFile.manifest.layout.some((item) => item.x === 424 && item.y === 212), true);
  await assert.rejects(
    clonePortability.importManifest({ ...exportedManifest, projectId: "different-project" }),
    /different project/u
  );
  await assert.rejects(
    clonePortability.importManifest({
      ...exportedManifest,
      events: exportedManifest.events.map((event, index) => index === 0 ? { ...event, occurredAt: "not-a-time" } : event)
    }),
    /occurredAt is invalid/u
  );

  process.stdout.write("Project History remote and file portability, privacy, and fresh-clone restore smoke passed.\n");
} finally {
  fs.rmSync(root, { recursive: true, force: true });
}
