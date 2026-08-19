#!/usr/bin/env node
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  importHistorySidecar,
  migratePortableHistory,
  pushHistorySidecar,
  readHistorySidecar,
  synchronizeHistorySidecar,
  validatePortableHistory,
  writeHistorySidecar
} from "../mcp/infrastructure/git-history-sidecar.mjs";

const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), "canvasight-history-portability-r0-"));
const seed = path.join(fixtureRoot, "seed");
const remote = path.join(fixtureRoot, "remote.git");
const cloneA = path.join(fixtureRoot, "clone-a");
const cloneB = path.join(fixtureRoot, "clone-b");
const cloneFresh = path.join(fixtureRoot, "clone-fresh");
const fallbackImport = path.join(fixtureRoot, "fallback-import");
const historyRef = "refs/canvasight/history/project-r0";
const fallbackRef = "refs/heads/canvasight-history/project-r0";
const missingObjectId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
const git = (cwd, ...args) => execFileSync("git", ["-C", cwd, ...args], {
  encoding: "utf8",
  stdio: ["ignore", "pipe", "pipe"]
}).trim();

const baseManifest = {
  schemaVersion: 1,
  projectId: "project-r0",
  events: [{
    id: "event-a",
    type: "snapshot",
    summary: "完成第一段功能",
    status: "confirmed",
    source: "codex",
    coverage: { complete: true },
    git: { objectId: missingObjectId, refName: "refs/canvasight/snapshots/event-a" }
  }],
  layout: [{ eventId: "event-a", x: 120, y: 80, collapsed: false, revision: 1 }]
};

try {
  fs.mkdirSync(seed);
  git(seed, "init", "-b", "main");
  git(seed, "config", "user.name", "Canvasight Portability Probe");
  git(seed, "config", "user.email", "canvasight-portability@example.invalid");
  fs.writeFileSync(path.join(seed, "README.md"), "code repository\n", "utf8");
  git(seed, "add", "README.md");
  git(seed, "commit", "-m", "seed code");
  git(seed, "init", "--bare", remote);
  git(seed, "remote", "add", "origin", remote);
  git(seed, "push", "-u", "origin", "main");

  git(fixtureRoot, "clone", remote, cloneA);
  git(fixtureRoot, "clone", remote, cloneB);
  for (const repository of [cloneA, cloneB]) {
    git(repository, "config", "user.name", "Canvasight Portability Probe");
    git(repository, "config", "user.email", "canvasight-portability@example.invalid");
  }

  await writeHistorySidecar(cloneA, historyRef, baseManifest);
  await assert.rejects(pushHistorySidecar(cloneA, "origin", historyRef), /authorization/u);
  assert.throws(() => git(remote, "rev-parse", "--verify", historyRef));
  await pushHistorySidecar(cloneA, "origin", historyRef, { authorized: true });

  git(fixtureRoot, "clone", remote, cloneFresh);
  assert.throws(() => git(cloneFresh, "rev-parse", "--verify", historyRef));
  const imported = await importHistorySidecar(cloneFresh, "origin", historyRef, { authorized: true });
  assert.equal(imported.manifest.events[0].summary, "完成第一段功能");
  assert.deepEqual(imported.manifest.layout[0], baseManifest.layout[0]);
  assert.deepEqual(imported.missingObjectIds, [missingObjectId]);
  assert.equal(git(cloneFresh, "ls-tree", "--name-only", historyRef), "history.json");

  await importHistorySidecar(cloneB, "origin", historyRef, { authorized: true });
  const sidecarA = await readHistorySidecar(cloneA, historyRef);
  const sidecarB = await readHistorySidecar(cloneB, historyRef);
  await writeHistorySidecar(cloneA, historyRef, {
    ...sidecarA.manifest,
    events: [...sidecarA.manifest.events, { id: "event-from-a", type: "checkpoint", summary: "A 的检查点" }],
    layout: [...sidecarA.manifest.layout, { eventId: "event-from-a", x: 240, y: 80, revision: 1 }]
  }, { expectedCommit: sidecarA.commit });
  await pushHistorySidecar(cloneA, "origin", historyRef, { authorized: true });

  await writeHistorySidecar(cloneB, historyRef, {
    ...sidecarB.manifest,
    events: [...sidecarB.manifest.events, { id: "event-from-b", type: "checkpoint", summary: "B 的检查点" }],
    layout: [...sidecarB.manifest.layout, { eventId: "event-from-b", x: 240, y: 180, revision: 1 }]
  }, { expectedCommit: sidecarB.commit });
  await assert.rejects(pushHistorySidecar(cloneB, "origin", historyRef, { authorized: true }), /failed/u);
  await assert.rejects(importHistorySidecar(cloneB, "origin", historyRef, { authorized: true }), /diverged/u);
  const synchronized = await synchronizeHistorySidecar(cloneB, "origin", historyRef, { authorized: true });
  assert.deepEqual(synchronized.manifest.events.map((event) => event.id), ["event-a", "event-from-a", "event-from-b"]);

  const legacy = migratePortableHistory({
    schemaVersion: 0,
    projectId: "project-r0",
    nodes: [{ id: "legacy", kind: "snapshot", label: "旧版摘要" }],
    positions: [{ nodeId: "legacy", x: 1, y: 2 }]
  });
  assert.equal(validatePortableHistory(legacy).events[0].summary, "旧版摘要");
  assert.throws(() => validatePortableHistory({ ...baseManifest, sourceFiles: ["secret.js"] }), /forbidden field/u);
  assert.throws(() => validatePortableHistory({
    ...baseManifest,
    events: [{ ...baseManifest.events[0], chatTranscript: "private" }]
  }), /forbidden field/u);
  assert.throws(() => validatePortableHistory({
    ...baseManifest,
    conflicts: [{ kind: "event", id: "event-a", variants: [baseManifest.events[0], { ...baseManifest.events[0], chatTranscript: "private" }] }]
  }), /forbidden field/u);

  const hookPath = path.join(remote, "hooks", "update");
  fs.writeFileSync(hookPath, "#!/bin/sh\ncase \"$1\" in refs/canvasight/history/*) exit 1;; esac\nexit 0\n", "utf8");
  fs.chmodSync(hookPath, 0o755);
  const currentA = await readHistorySidecar(cloneA, historyRef);
  await writeHistorySidecar(cloneA, historyRef, {
    ...currentA.manifest,
    events: [...currentA.manifest.events, { id: "custom-ref-rejected", type: "probe", summary: "验证远端拒绝" }],
    layout: [...currentA.manifest.layout, { eventId: "custom-ref-rejected", x: 360, y: 80, revision: 1 }]
  }, { expectedCommit: currentA.commit });
  await assert.rejects(pushHistorySidecar(cloneA, "origin", historyRef, { authorized: true }), /failed/u);
  await writeHistorySidecar(cloneA, fallbackRef, baseManifest);
  await pushHistorySidecar(cloneA, "origin", fallbackRef, { authorized: true });
  fs.mkdirSync(fallbackImport);
  git(fallbackImport, "init");
  git(fallbackImport, "remote", "add", "origin", remote);
  const fallback = await importHistorySidecar(fallbackImport, "origin", fallbackRef, { authorized: true });
  assert.equal(fallback.manifest.events[0].summary, "完成第一段功能");
  assert.equal(git(fallbackImport, "ls-tree", "--name-only", fallbackRef), "history.json");

  process.stdout.write("Project History R0-08 metadata sidecar portability smoke passed.\n");
} finally {
  fs.rmSync(fixtureRoot, { recursive: true, force: true });
}
