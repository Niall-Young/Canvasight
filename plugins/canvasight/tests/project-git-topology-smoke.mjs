#!/usr/bin/env node
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { readProjectGitTopology } from "../mcp/infrastructure/project-git-topology.mjs";

const root = fs.mkdtempSync(path.join(os.tmpdir(), "canvasight-project-git-topology-"));
const repository = path.join(root, "repository");
const git = (...args) => execFileSync("git", ["-C", repository, ...args], { encoding: "utf8" }).trim();

try {
  fs.mkdirSync(repository);
  git("init", "-b", "main");
  git("config", "user.name", "Canvasight Topology Probe");
  git("config", "user.email", "canvasight-topology@example.invalid");
  fs.writeFileSync(path.join(repository, "project.txt"), "project start\n");
  git("add", "project.txt");
  git("commit", "-m", "start project");
  fs.writeFileSync(path.join(repository, "project.txt"), "project foundation\n");
  git("add", "project.txt");
  git("commit", "-m", "build foundation");

  git("switch", "-c", "feature/panorama");
  fs.writeFileSync(path.join(repository, "feature.txt"), "panorama\n");
  git("add", "feature.txt");
  git("commit", "-m", "add project panorama");
  const linear = await readProjectGitTopology(repository);
  assert.equal(linear.commits.length, 3, "every real project commit must be present");
  assert.equal(linear.topology, "linear", "a branch label on one unbroken commit path must stay linear");
  assert.equal(linear.mergeStatus, "ready-to-merge");
  assert.equal(linear.ahead, 1);
  assert.equal(linear.behind, 0);
  assert.equal(linear.commits[0].subject, "add project panorama");
  assert.equal(linear.commits[0].isCanvasightGenerated, false);
  assert.equal(linear.refs.some((ref) => ref.shortName === "feature/panorama" && ref.current), true);

  git("switch", "main");
  fs.writeFileSync(path.join(repository, "main.txt"), "main advanced\n");
  git("add", "main.txt");
  git("commit", "-m", "advance main");
  git("switch", "feature/panorama");
  const diverged = await readProjectGitTopology(repository);
  assert.equal(diverged.topology, "branched");
  assert.equal(diverged.mergeStatus, "diverged");
  assert.equal(diverged.ahead, 1);
  assert.equal(diverged.behind, 1);

  git("switch", "main");
  git("merge", "--no-ff", "feature/panorama", "-m", "merge project panorama");
  const merged = await readProjectGitTopology(repository);
  assert.equal(merged.topology, "branched", "a completed merge must preserve the visible branch path");
  assert.equal(merged.mergeStatus, "up-to-date");
  assert.equal(merged.commits[0].isMerge, true);
  assert.equal(merged.commits[0].parents.length, 2);
  assert.equal(merged.commits[0].isOnMain, true);
  assert.equal(merged.commits.find((commit) => commit.subject === "add project panorama")?.isOnMain, true);
  assert.equal(merged.commits.find((commit) => commit.subject === "add project panorama")?.isOnMainline, false, "merged feature commits must remain on their real side path");

  fs.mkdirSync(path.join(repository, ".scatter"), { recursive: true });
  fs.writeFileSync(path.join(repository, ".scatter", "scatter.json"), "{}\n");
  const canvasMetadataOnly = await readProjectGitTopology(repository);
  assert.deepEqual(canvasMetadataOnly.workingTree, {
    dirty: false,
    changeCount: 0,
    stagedCount: 0,
    unstagedCount: 0,
    untrackedCount: 0
  }, "Canvasight's own metadata must not look like unfinished user work");

  fs.writeFileSync(path.join(repository, "working.txt"), "not committed\n");
  const dirty = await readProjectGitTopology(repository);
  assert.equal(dirty.mergeStatus, "uncommitted");
  assert.deepEqual(dirty.workingTree, {
    dirty: true,
    changeCount: 1,
    stagedCount: 0,
    unstagedCount: 0,
    untrackedCount: 1
  });

  git("add", "working.txt");
  git("commit", "-m", "add working file");
  git("mv", "working.txt", "renamed.txt");
  const renamed = await readProjectGitTopology(repository);
  assert.equal(renamed.workingTree.changeCount, 1, "a staged rename must count as one changed file");
  assert.equal(renamed.workingTree.stagedCount, 1);

  process.stdout.write("Project Git linear, branch, merge, and working-tree topology smoke passed.\n");
} finally {
  fs.rmSync(root, { recursive: true, force: true });
}
