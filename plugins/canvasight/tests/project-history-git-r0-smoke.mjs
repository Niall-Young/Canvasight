#!/usr/bin/env node
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  captureGitUserState,
  createIsolatedHistorySnapshot,
  removeIsolatedHistoryWorktree,
  restoreSnapshotToNewWorktree
} from "../mcp/infrastructure/git-history-snapshot.mjs";

const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), "canvasight-history-git-r0-"));
const repository = path.join(fixtureRoot, "repository");
const restored = path.join(fixtureRoot, "restored");
const historicalWorktree = path.join(fixtureRoot, "historical-worktree");
const unbornRepository = path.join(fixtureRoot, "unborn-repository");
const generatedOnlyRepository = path.join(fixtureRoot, "generated-only-repository");
const git = (cwd, ...args) => execFileSync("git", ["-C", cwd, ...args], { encoding: "utf8" }).trim();

try {
  fs.mkdirSync(repository);
  git(repository, "init", "-b", "main");
  git(repository, "config", "user.name", "Canvasight Git Probe");
  git(repository, "config", "user.email", "canvasight-git-probe@example.invalid");
  fs.writeFileSync(path.join(repository, ".gitignore"), "ignored.txt\n.env\n.scatter/\n", "utf8");
  fs.writeFileSync(path.join(repository, "staged.txt"), "baseline staged\n", "utf8");
  fs.writeFileSync(path.join(repository, "unstaged.txt"), "baseline unstaged\n", "utf8");
  fs.writeFileSync(path.join(repository, "rename-old.txt"), "rename me\n", "utf8");
  fs.writeFileSync(path.join(repository, "deleted.txt"), "delete me\n", "utf8");
  fs.writeFileSync(path.join(repository, ".env"), "BASELINE_SECRET=one\n", "utf8");
  git(repository, "add", ".gitignore", "staged.txt", "unstaged.txt", "rename-old.txt", "deleted.txt");
  git(repository, "add", "-f", ".env");
  git(repository, "commit", "-m", "fixture baseline");
  const head = git(repository, "rev-parse", "HEAD");

  fs.writeFileSync(path.join(repository, "staged.txt"), "staged change\n", "utf8");
  git(repository, "add", "staged.txt");
  fs.writeFileSync(path.join(repository, "unstaged.txt"), "unstaged change\n", "utf8");
  git(repository, "mv", "rename-old.txt", "rename-new.txt");
  fs.rmSync(path.join(repository, "deleted.txt"));
  fs.writeFileSync(path.join(repository, "untracked.txt"), "new file\n", "utf8");
  fs.writeFileSync(path.join(repository, "ignored.txt"), "ignored\n", "utf8");
  fs.writeFileSync(path.join(repository, ".env"), "BASELINE_SECRET=two\n", "utf8");
  fs.mkdirSync(path.join(repository, ".scatter", "history"), { recursive: true });
  fs.writeFileSync(path.join(repository, ".scatter", "history", "journal.jsonl"), "private history\n", "utf8");

  const before = await captureGitUserState(repository);
  const snapshot = await createIsolatedHistorySnapshot(repository, {
    snapshotRef: "refs/canvasight/snapshots/r0-probe",
    excludePathspecs: [".env", ".scatter/history/"]
  });
  const afterSnapshot = await captureGitUserState(repository);
  assert.equal(afterSnapshot.digest, before.digest);
  assert.equal(snapshot.coverage.complete, false);
  assert.equal(snapshot.coverage.policyExcludedPaths.includes(".env"), true);

  await restoreSnapshotToNewWorktree(repository, snapshot.commit, restored);
  assert.equal(fs.readFileSync(path.join(restored, "staged.txt"), "utf8"), "staged change\n");
  assert.equal(fs.readFileSync(path.join(restored, "unstaged.txt"), "utf8"), "unstaged change\n");
  assert.equal(fs.existsSync(path.join(restored, "rename-old.txt")), false);
  assert.equal(fs.readFileSync(path.join(restored, "rename-new.txt"), "utf8"), "rename me\n");
  assert.equal(fs.existsSync(path.join(restored, "deleted.txt")), false);
  assert.equal(fs.readFileSync(path.join(restored, "untracked.txt"), "utf8"), "new file\n");
  assert.equal(fs.existsSync(path.join(restored, "ignored.txt")), false);
  assert.equal(fs.readFileSync(path.join(restored, ".env"), "utf8"), "BASELINE_SECRET=one\n");
  assert.equal(fs.existsSync(path.join(restored, ".scatter")), false);
  await removeIsolatedHistoryWorktree(repository, restored);

  git(repository, "worktree", "add", "--detach", historicalWorktree, head);
  const cleanHistorical = await createIsolatedHistorySnapshot(historicalWorktree, {
    snapshotRef: "refs/canvasight/snapshots/r0-probe",
    excludePathspecs: [".env", ".scatter/history/"],
    skipIfUnchanged: true,
    skipIfHeadUnchanged: true,
    changeBase: "head"
  });
  assert.equal(cleanHistorical.skipped, true, "a clean restored worktree must not become a new history node");
  assert.equal(cleanHistorical.commit, null);
  assert.deepEqual(cleanHistorical.changedPaths, []);
  fs.writeFileSync(path.join(historicalWorktree, "unstaged.txt"), "historical task change\n", "utf8");
  git(repository, "update-ref", "refs/canvasight/snapshots/r0-historical-chain", snapshot.commit);
  const historicalChange = await createIsolatedHistorySnapshot(historicalWorktree, {
    snapshotRef: "refs/canvasight/snapshots/r0-historical-chain",
    excludePathspecs: [".env", ".scatter/history/"],
    skipIfUnchanged: true,
    skipIfHeadUnchanged: true,
    changeBase: "head"
  });
  assert.deepEqual(historicalChange.changedPaths.map((change) => change.path), ["unstaged.txt"], "isolated history diffs must be relative to that worktree HEAD");
  git(historicalWorktree, "add", "unstaged.txt");
  git(historicalWorktree, "-c", "user.name=Canvasight Git Probe", "-c", "user.email=canvasight-git-probe@example.invalid", "commit", "-m", "committed historical task change");
  const committedHistoricalPaths = git(historicalWorktree, "diff-tree", "--no-commit-id", "--name-only", "-r", "HEAD^", "HEAD").split("\n").filter(Boolean).sort();
  const committedHistoricalChange = await createIsolatedHistorySnapshot(historicalWorktree, {
    snapshotRef: "refs/canvasight/snapshots/r0-historical-committed-chain",
    excludePathspecs: [".env", ".scatter/history/"],
    skipIfUnchanged: true,
    skipIfHeadUnchanged: false,
    changeBase: "head"
  });
  assert.equal(committedHistoricalPaths.includes("unstaged.txt"), true);
  assert.deepEqual(committedHistoricalChange.changedPaths.map((change) => change.path).sort(), committedHistoricalPaths, "committed isolated worktree changes must be compared with their parent commit");
  await removeIsolatedHistoryWorktree(repository, historicalWorktree);

  fs.writeFileSync(path.join(repository, "large.bin"), "this fixture is larger than the injected limit\n", "utf8");
  const beforeLarge = await captureGitUserState(repository);
  const largeSnapshot = await createIsolatedHistorySnapshot(repository, {
    snapshotRef: "refs/canvasight/snapshots/r0-large-file",
    largeFileBytes: 8
  });
  assert.equal(largeSnapshot.coverage.largePaths.includes("large.bin"), true);
  assert.equal(largeSnapshot.coverage.gapCodes.includes("large-files-excluded"), true);
  assert.equal((await captureGitUserState(repository)).digest, beforeLarge.digest);
  await restoreSnapshotToNewWorktree(repository, largeSnapshot.commit, restored);
  assert.equal(fs.existsSync(path.join(restored, "large.bin")), false);
  await removeIsolatedHistoryWorktree(repository, restored);

  const afterRestore = await captureGitUserState(repository);
  assert.equal(afterRestore.digest, beforeLarge.digest);
  await assert.rejects(
    createIsolatedHistorySnapshot(repository, { snapshotRef: "refs/heads/main" }),
    /refs\/canvasight\/snapshots/u
  );
  assert.equal(await captureGitUserState(repository).then((state) => state.digest), beforeLarge.digest);

  const failedSnapshotRef = "refs/canvasight/snapshots/r0-cas-failure";
  await assert.rejects(
    createIsolatedHistorySnapshot(repository, {
      snapshotRef: failedSnapshotRef,
      beforeRefUpdate: () => git(repository, "update-ref", failedSnapshotRef, head)
    }),
    /cannot lock ref|reference already exists/u
  );
  assert.equal(git(repository, "rev-parse", failedSnapshotRef), head);
  assert.equal(await captureGitUserState(repository).then((state) => state.digest), beforeLarge.digest);

  fs.mkdirSync(unbornRepository);
  git(unbornRepository, "init", "-b", "main");
  fs.writeFileSync(path.join(unbornRepository, ".gitignore"), ".scatter/\n", "utf8");
  fs.writeFileSync(path.join(unbornRepository, "public.txt"), "public\n", "utf8");
  fs.writeFileSync(path.join(unbornRepository, "secret.pem"), "secret\n", "utf8");
  fs.mkdirSync(path.join(unbornRepository, ".scatter", "history"), { recursive: true });
  fs.writeFileSync(path.join(unbornRepository, ".scatter", "history", "journal.jsonl"), "private history\n", "utf8");
  const unbornSnapshot = await createIsolatedHistorySnapshot(unbornRepository, {
    snapshotRef: "refs/canvasight/snapshots/r0-unborn",
    excludePathspecs: ["*.pem", ".scatter/history/"]
  });
  assert.deepEqual(git(unbornRepository, "ls-tree", "-r", "--name-only", unbornSnapshot.commit).split("\n"), [".gitignore", "public.txt"]);

  fs.mkdirSync(generatedOnlyRepository);
  git(generatedOnlyRepository, "init", "-b", "main");
  fs.writeFileSync(path.join(generatedOnlyRepository, ".gitignore"), "node_modules/\ndist/\noutput/\n", "utf8");
  fs.writeFileSync(path.join(generatedOnlyRepository, "app.txt"), "source\n", "utf8");
  fs.mkdirSync(path.join(generatedOnlyRepository, "packages", "app", "dist"), { recursive: true });
  fs.writeFileSync(path.join(generatedOnlyRepository, "packages", "app", "dist", "bundle.js"), "tracked baseline build\n", "utf8");
  git(generatedOnlyRepository, "add", ".gitignore", "app.txt");
  git(generatedOnlyRepository, "add", "-f", "packages/app/dist/bundle.js");
  git(generatedOnlyRepository, "-c", "user.name=Canvasight Git Probe", "-c", "user.email=canvasight-git-probe@example.invalid", "commit", "-m", "baseline");
  fs.writeFileSync(path.join(generatedOnlyRepository, "packages", "app", "dist", "bundle.js"), "noisy regenerated build\n", "utf8");
  fs.mkdirSync(path.join(generatedOnlyRepository, "node_modules", "fixture"), { recursive: true });
  fs.writeFileSync(path.join(generatedOnlyRepository, "node_modules", "fixture", "index.js"), "generated\n", "utf8");
  fs.mkdirSync(path.join(generatedOnlyRepository, "output"), { recursive: true });
  fs.writeFileSync(path.join(generatedOnlyRepository, "output", "preview.txt"), "unrelated ignored output\n", "utf8");
  const generatedOnlySnapshot = await createIsolatedHistorySnapshot(generatedOnlyRepository, {
    snapshotRef: "refs/canvasight/snapshots/generated-only",
    excludePathspecs: ["*.pem", "node_modules/", "dist/"]
  });
  assert.equal(generatedOnlySnapshot.coverage.complete, true, "generated dependencies alone must not claim recovery is incomplete");
  assert.deepEqual(generatedOnlySnapshot.coverage.policyExcludedPaths, [], "an unmatched wildcard must not pull unrelated ignored paths into coverage warnings");
  assert.equal(generatedOnlySnapshot.coverage.informationalExcludedPaths.some((item) => item.includes("node_modules")), true);
  assert.equal(
    git(generatedOnlyRepository, "show", `${generatedOnlySnapshot.commit}:packages/app/dist/bundle.js`),
    "tracked baseline build",
    "directory exclusions must apply recursively inside monorepo packages"
  );
  assert.equal(
    generatedOnlySnapshot.changedPaths.some((change) => change.path === "packages/app/dist/bundle.js"),
    false,
    "nested generated build output must not create History noise"
  );
  process.stdout.write("Project History R0-07 isolated snapshot and restore smoke passed.\n");
} finally {
  fs.rmSync(fixtureRoot, { recursive: true, force: true });
}
