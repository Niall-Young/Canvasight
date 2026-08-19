#!/usr/bin/env node
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { ProjectHistoryReleaseService } from "../mcp/application/project-history-release-service.mjs";
import { ProjectHistoryAgentCheckService } from "../mcp/application/project-history-agent-check-service.mjs";
import { ProjectHistoryService } from "../mcp/application/project-history-service.mjs";
import { captureGitUserState } from "../mcp/infrastructure/git-history-snapshot.mjs";

const root = fs.mkdtempSync(path.join(os.tmpdir(), "canvasight-history-release-"));
const repository = path.join(root, "repository");
const featureWorktree = path.join(root, "feature-worktree");
const autoMainRepository = path.join(root, "auto-main-repository");
const documentationRepository = path.join(root, "documentation-repository");
const documentationWorktree = path.join(root, "documentation-worktree");
const git = (cwd, ...args) => execFileSync("git", ["-C", cwd, ...args], { encoding: "utf8" }).trim();

try {
  fs.mkdirSync(repository);
  git(repository, "init", "-b", "main");
  git(repository, "config", "user.name", "Canvasight Release Probe");
  git(repository, "config", "user.email", "canvasight-release@example.invalid");
  fs.writeFileSync(path.join(repository, "package.json"), `${JSON.stringify({ scripts: { test: "node -e \"process.exit(0)\"" } }, null, 2)}\n`);
  fs.writeFileSync(path.join(repository, "app.txt"), "baseline\n");
  git(repository, "add", "package.json", "app.txt");
  git(repository, "commit", "-m", "baseline");
  git(repository, "worktree", "add", "-b", "feature/history-release", featureWorktree, "main");

  const service = await ProjectHistoryService.forRepository(featureWorktree, { exclusions: [] });
  await service.enableProtection({ currentTaskId: "task-release" });
  fs.writeFileSync(path.join(featureWorktree, "app.txt"), "confirmed result\n");
  const recorded = await service.recordTurn({ taskId: "task-release", turnId: "turn-release", status: "completed" });
  const node = recorded.index.nodes.at(-1);
  const beforeFeature = await captureGitUserState(featureWorktree);
  const beforeMain = git(repository, "rev-parse", "main");

  const release = new ProjectHistoryReleaseService(service);
  await assert.rejects(release.prepareConfirmation(node.id), /Agent functional check/u);
  const agentCheck = new ProjectHistoryAgentCheckService(service);
  const agentRequest = await agentCheck.prepare(node.id);
  await agentCheck.markRequested(agentRequest.token);
  await agentCheck.record(agentRequest.token, {
    outcome: "passed",
    summary: "Verified the changed behavior in the isolated snapshot.",
    evidence: ["npm test passed", "expected file content verified"],
    taskId: "agent-check-task"
  });
  const prepared = await release.prepareConfirmation(node.id);
  assert.equal(prepared.verification.passed, true);
  await assert.rejects(release.confirmNode(`${prepared.token}tampered`), /signature|invalid/u);
  const confirmed = await release.confirmNode(prepared.token);
  assert.equal(confirmed.status, "confirmed");
  assert.equal(git(repository, "rev-parse", "main"), beforeMain, "confirmation must not move main");
  assert.equal((await captureGitUserState(featureWorktree)).digest, beforeFeature.digest, "confirmation must not alter feature worktree state");

  const mergePrepared = await release.prepareMerge(node.id);
  fs.writeFileSync(path.join(repository, "uncommitted-main.txt"), "must survive\n");
  await assert.rejects(release.mergeNode(mergePrepared.token), /local changes/u);
  assert.equal(git(repository, "rev-parse", "main"), beforeMain, "a dirty main worktree must remain unchanged");
  fs.rmSync(path.join(repository, "uncommitted-main.txt"));
  const merged = await release.mergeNode(mergePrepared.token);
  assert.equal(merged.status, "merged");
  assert.equal(fs.readFileSync(path.join(repository, "app.txt"), "utf8"), "confirmed result\n");
  assert.equal(git(repository, "rev-list", "--count", `${beforeMain}..main`), "1", "stage merge must produce exactly one main commit");
  const finalIndex = await service.readIndex();
  assert.equal(finalIndex.nodes.at(-1).confirmed, true);
  assert.equal(finalIndex.nodes.at(-1).merged, true);
  assert.equal(finalIndex.featureLines.find((feature) => feature.id === node.featureLineId)?.status, "merged");

  const unavailableRepository = path.join(root, "unavailable-repository");
  fs.mkdirSync(unavailableRepository);
  git(unavailableRepository, "init", "-b", "main");
  git(unavailableRepository, "config", "user.name", "Canvasight Release Probe");
  git(unavailableRepository, "config", "user.email", "canvasight-release@example.invalid");
  fs.writeFileSync(path.join(unavailableRepository, "README.md"), "baseline\n");
  git(unavailableRepository, "add", "README.md");
  git(unavailableRepository, "commit", "-m", "baseline");
  const unavailableService = await ProjectHistoryService.forRepository(unavailableRepository, { exclusions: [] });
  await unavailableService.enableProtection({ currentTaskId: "task-docs" });
  fs.writeFileSync(path.join(unavailableRepository, "README.md"), "documentation update\n");
  const unavailableNode = (await unavailableService.recordTurn({ taskId: "task-docs", turnId: "turn-docs", status: "completed" })).index.nodes.at(-1);
  const unavailableRelease = new ProjectHistoryReleaseService(unavailableService);
  const unavailablePreparation = await unavailableRelease.prepareConfirmation(unavailableNode.id);
  assert.equal(unavailablePreparation.verification.passed, false);
  const riskAccepted = await unavailableRelease.confirmNode(unavailablePreparation.token, { acceptVerificationRisk: true });
  assert.equal(riskAccepted.autoMergeEligible, false, "documentation must not auto-merge when checks did not pass");

  fs.mkdirSync(documentationRepository);
  git(documentationRepository, "init", "-b", "main");
  git(documentationRepository, "config", "user.name", "Canvasight Release Probe");
  git(documentationRepository, "config", "user.email", "canvasight-release@example.invalid");
  fs.writeFileSync(path.join(documentationRepository, "package.json"), `${JSON.stringify({ scripts: { test: "node -e \"process.exit(0)\"" } }, null, 2)}\n`);
  fs.writeFileSync(path.join(documentationRepository, "README.md"), "baseline\n");
  git(documentationRepository, "add", "package.json", "README.md");
  git(documentationRepository, "commit", "-m", "baseline");
  git(documentationRepository, "worktree", "add", "-b", "feature/documentation", documentationWorktree, "main");
  const documentationService = await ProjectHistoryService.forRepository(documentationWorktree, { exclusions: [] });
  await documentationService.enableProtection({ currentTaskId: "task-docs-passing" });
  fs.writeFileSync(path.join(documentationWorktree, "README.md"), "documentation update\n");
  const documentationNode = (await documentationService.recordTurn({ taskId: "task-docs-passing", turnId: "turn-docs-passing", status: "completed" })).index.nodes.at(-1);
  const documentationMainBefore = git(documentationRepository, "rev-parse", "main");
  const documentationRelease = new ProjectHistoryReleaseService(documentationService);
  const documentationPreparation = await documentationRelease.prepareConfirmation(documentationNode.id);
  assert.equal(documentationPreparation.autoMergeEligible, true, "passing documentation-only checks should expose explicit auto-merge eligibility");
  const documentationConfirmed = await documentationRelease.confirmNode(documentationPreparation.token);
  assert.equal(documentationConfirmed.status, "confirmed");
  assert.equal(documentationConfirmed.autoMergeEligible, true);
  assert.equal(git(documentationRepository, "rev-parse", "main"), documentationMainBefore, "confirmation alone must not auto-merge without the explicit controller request flag");
  const documentationMerge = await documentationRelease.mergeNode((await documentationRelease.prepareMerge(documentationNode.id)).token);
  assert.equal(documentationMerge.status, "merged");
  assert.notEqual(git(documentationRepository, "rev-parse", "main"), documentationMainBefore);

  fs.mkdirSync(autoMainRepository);
  git(autoMainRepository, "init", "-b", "feature/automatic-main");
  git(autoMainRepository, "config", "user.name", "Canvasight Release Probe");
  git(autoMainRepository, "config", "user.email", "canvasight-release@example.invalid");
  fs.writeFileSync(path.join(autoMainRepository, "app.txt"), "remote baseline\n");
  git(autoMainRepository, "add", "app.txt");
  git(autoMainRepository, "commit", "-m", "remote baseline");
  const remoteMain = git(autoMainRepository, "rev-parse", "HEAD");
  git(autoMainRepository, "update-ref", "refs/remotes/upstream/main", remoteMain);
  fs.writeFileSync(path.join(autoMainRepository, "feature.txt"), "feature commit\n");
  git(autoMainRepository, "add", "feature.txt");
  git(autoMainRepository, "commit", "-m", "feature work");
  const featureHead = git(autoMainRepository, "rev-parse", "HEAD");
  const autoMainService = await ProjectHistoryService.forRepository(autoMainRepository, { exclusions: [] });
  const autoMainProtection = await autoMainService.enableProtection({ currentTaskId: "task-auto-main" });
  assert.equal(autoMainProtection.main.created, true);
  assert.equal(autoMainProtection.main.source, "upstream/main");
  assert.equal(git(autoMainRepository, "rev-parse", "main"), remoteMain, "main must be created from remote main instead of the current feature branch");
  assert.equal(git(autoMainRepository, "branch", "--show-current"), "feature/automatic-main", "automatic main creation must not switch the worktree");
  assert.equal(git(autoMainRepository, "rev-parse", "HEAD"), featureHead, "automatic main creation must not move feature HEAD");

  process.stdout.write("Project History confirmation token, verifier, automatic main, dirty-main guard, and explicitly authorized documentation auto-merge smoke passed.\n");
} finally {
  fs.rmSync(root, { recursive: true, force: true });
}
