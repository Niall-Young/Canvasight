#!/usr/bin/env node
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { compareGitProjectIdentities } from "../mcp/domain/project-history-contract.mjs";
import { probeGitProjectIdentity } from "../mcp/infrastructure/git-project-identity.mjs";

const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), "canvasight-history-r0-"));
const repository = path.join(fixtureRoot, "repository");
const worktree = path.join(fixtureRoot, "worktree");
const probeScript = path.resolve(import.meta.dirname, "..", "scripts", "probe-project-history.mjs");
const git = (cwd, ...args) => execFileSync("git", ["-C", cwd, ...args], { encoding: "utf8" }).trim();

try {
  fs.mkdirSync(repository);
  git(repository, "init", "-b", "main");
  git(repository, "config", "user.name", "Canvasight R0 Probe");
  git(repository, "config", "user.email", "canvasight-r0@example.invalid");
  const unborn = await probeGitProjectIdentity(repository);
  assert.deepEqual(unborn.rootCommits, []);
  assert.equal(unborn.portableProjectId, null);
  fs.writeFileSync(path.join(repository, "fixture.txt"), "baseline\n", "utf8");
  git(repository, "add", "fixture.txt");
  git(repository, "commit", "-m", "fixture baseline");
  git(repository, "worktree", "add", "--detach", worktree, "HEAD");

  const before = {
    head: git(repository, "rev-parse", "HEAD"),
    status: git(repository, "status", "--porcelain=v2", "--untracked-files=all"),
    refs: git(repository, "for-each-ref", "--format=%(refname) %(objectname)")
  };
  const primary = await probeGitProjectIdentity(repository);
  const linked = await probeGitProjectIdentity(worktree);
  const comparison = compareGitProjectIdentities(primary, linked);
  const after = {
    head: git(repository, "rev-parse", "HEAD"),
    status: git(repository, "status", "--porcelain=v2", "--untracked-files=all"),
    refs: git(repository, "for-each-ref", "--format=%(refname) %(objectname)")
  };

  assert.equal(comparison.sameLocalProject, true);
  assert.equal(comparison.samePortableProject, true);
  assert.equal(primary.gitCommonDir, linked.gitCommonDir);
  assert.notEqual(primary.worktreeRoot, linked.worktreeRoot);
  assert.deepEqual(after, before, "the read-only identity probe must not change repository state");
  const cliResult = JSON.parse(execFileSync(process.execPath, [probeScript, repository, worktree], { encoding: "utf8" }));
  assert.equal(cliResult.status, "passed");
  assert.deepEqual(cliResult.comparisons, [{
    leftIndex: 0,
    rightIndex: 1,
    sameLocalProject: true,
    samePortableProject: true
  }]);
  process.stdout.write("Project History R0-01 worktree identity smoke passed.\n");
} finally {
  fs.rmSync(fixtureRoot, { recursive: true, force: true });
}
