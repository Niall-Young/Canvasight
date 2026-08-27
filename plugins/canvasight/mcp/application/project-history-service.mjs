import { createHash } from "node:crypto";
import path from "node:path";
import { PROJECT_HISTORY_EVENT_VERSION } from "../domain/project-history-domain.mjs";
import { probeGitProjectIdentity } from "../infrastructure/git-project-identity.mjs";
import { createIsolatedHistorySnapshot, pinHistorySnapshot, readCommittedHistorySnapshot, readGitSnapshotRevision } from "../infrastructure/git-history-snapshot.mjs";
import { ensureLocalMainBranch, readProjectHistoryGitState } from "../infrastructure/project-history-main-branch.mjs";
import { ProjectHistoryStore } from "../infrastructure/project-history-store.mjs";
import { readProjectGitTopology } from "../infrastructure/project-git-topology.mjs";

export const DEFAULT_HISTORY_EXCLUSIONS = [
  ".env",
  ".env.*",
  "*.pem",
  "*.key",
  "node_modules/",
  "dist/",
  "build/",
  ".cache/",
  ".scatter/"
];

function shortHash(value) {
  return createHash("sha256").update(value).digest("hex").slice(0, 24);
}

function event(projectId, id, type, payload, occurredAt = new Date().toISOString()) {
  return { version: PROJECT_HISTORY_EVENT_VERSION, id, projectId, type, occurredAt, payload };
}

function summarizeChanges(changes, status) {
  if (changes.length === 0) return status === "interrupted" ? "任务已中断，没有留下项目变化" : "完成讨论，没有项目变化";
  const paths = changes.slice(0, 3).map((change) => change.path);
  const suffix = changes.length > paths.length ? `等 ${changes.length} 个文件` : `${changes.length} 个文件`;
  return `修改 ${suffix}：${paths.join("、")}`;
}

function normalizedSummary(value) {
  if (typeof value !== "string") return "";
  return value.trim().replace(/\s+/gu, " ").slice(0, 160);
}

function normalizedAttributedPaths(paths) {
  return new Set(
    (Array.isArray(paths) ? paths : [])
      .map((value) => String(value || "").trim().replaceAll("\\", "/"))
      .filter(Boolean)
  );
}

function featureNameFromBranch(branch) {
  const known = new Map([["ai", "AI"], ["api", "API"], ["canvasight", "Canvasight"], ["codex", "Codex"], ["electron", "Electron"], ["git", "Git"], ["mcp", "MCP"], ["ui", "UI"], ["ux", "UX"], ["webdav", "WebDAV"]]);
  const leaf = String(branch || "")
    .replace(/^refs\/heads\//u, "")
    .replace(/^(?:feat|feature|fix|chore|refactor|release)\//u, "")
    .replace(/^\d+[._-]*/u, "");
  return leaf.split(/[\s._-]+/u).filter(Boolean).map((part) => known.get(part.toLocaleLowerCase()) || `${part[0].toLocaleUpperCase()}${part.slice(1)}`).join(" ") || "待归类功能";
}

export class ProjectHistoryService {
  static async forRepository(projectPath, options = {}) {
    const identity = await probeGitProjectIdentity(projectPath);
    const storageDirectory = path.join(identity.gitCommonDir, "canvasight", "project-history");
    const store = new ProjectHistoryStore(storageDirectory, options.storeOptions);
    await store.initialize();
    return new ProjectHistoryService(projectPath, identity, store, options);
  }

  constructor(projectPath, identity, store, {
    exclusions = DEFAULT_HISTORY_EXCLUSIONS,
    snapshotOptions = {}
  } = {}) {
    this.projectPath = path.resolve(projectPath);
    this.identity = identity;
    this.store = store;
    this.exclusions = [...exclusions];
    this.snapshotOptions = snapshotOptions;
  }

  async enableProtection({ currentTaskId = null, classifyDirtyState = "project-start" } = {}) {
    const receiptId = `protection:${this.identity.localProjectId}`;
    const snapshotReceipt = `${receiptId}:snapshot`;
    const initialDirtyReceipt = `${receiptId}:initial-dirty-snapshot`;
    if (await this.store.hasReceipt(snapshotReceipt)) {
      const index = await this.store.readIndex();
      const baselineCommit = index.nodes.find((node) => node.kind === "baseline")?.commit ?? null;
      const main = await ensureLocalMainBranch(this.projectPath, { fallbackCommit: baselineCommit });
      return { duplicate: true, index, main };
    }
    const requestedFeatureLine = classifyDirtyState === "feature-line";
    const existingProtection = (await this.store.readRecords()).find((record) => record.receiptId === receiptId);
    const selectedFeatureLine = existingProtection
      ? existingProtection.event.payload.classifyDirtyState === "feature-line"
      : requestedFeatureLine;
    const enabledAt = existingProtection
      ? new Date(existingProtection.event.occurredAt)
      : new Date();
    if (!existingProtection) {
      await this.store.append(event(this.identity.localProjectId, `event:${shortHash(receiptId)}`, "protection.enabled", {
        currentTaskId,
        classifyDirtyState: selectedFeatureLine ? "feature-line" : "project-start"
      }, enabledAt.toISOString()), receiptId);
    }
    const baselineRef = `refs/canvasight/snapshots/project-${shortHash(this.identity.localProjectId)}`;
    const headRevision = await readGitSnapshotRevision(this.projectPath);
    const initialDirtyObservationId = `${receiptId}:initial-dirty`;
    const snapshot = await createIsolatedHistorySnapshot(this.projectPath, {
      snapshotRef: baselineRef,
      excludePathspecs: this.exclusions,
      message: "Canvasight Project History initial protected baseline",
      skipIfUnchanged: Boolean(headRevision),
      recoveryToken: `${receiptId}:capture`,
      ...this.snapshotOptions
    });
    const splitInitialDirtyState = selectedFeatureLine && Boolean(headRevision) && Boolean(snapshot.commit);
    const baselineSnapshot = splitInitialDirtyState
      ? headRevision
      : { commit: snapshot.commit || snapshot.parent || headRevision?.commit, tree: snapshot.tree || headRevision?.tree };
    if (!baselineSnapshot?.commit || !baselineSnapshot?.tree) throw new Error("Project History could not create an initial recoverable baseline");
    const main = await ensureLocalMainBranch(this.projectPath, { fallbackCommit: baselineSnapshot.commit });
    if (splitInitialDirtyState) {
      const featureLineId = `feature:${shortHash(initialDirtyObservationId)}`;
      const featureReceipt = `feature:${featureLineId}`;
      if (!(await this.store.hasReceipt(featureReceipt))) {
        await this.store.append(event(this.identity.localProjectId, `event:${shortHash(featureReceipt)}`, "feature.created", {
          featureLineId,
          name: "启用前已有变化",
          originalClassification: "user-selected-initial-state"
        }, new Date(enabledAt.getTime() + 1).toISOString()), featureReceipt);
      }
      const dirtyNodeId = `node:${shortHash(initialDirtyObservationId)}`;
      const dirtyNodeRef = `refs/canvasight/snapshots/nodes/${shortHash(dirtyNodeId)}`;
      await pinHistorySnapshot(this.projectPath, dirtyNodeRef, snapshot.commit);
      await this.store.append(event(this.identity.localProjectId, dirtyNodeId, "snapshot.recorded", {
        nodeId: dirtyNodeId,
        observationId: initialDirtyObservationId,
        baseline: false,
        summary: summarizeChanges(snapshot.changedPaths, "completed"),
        source: "external",
        featureLineId,
        taskId: null,
        turnId: null,
        snapshotRef: dirtyNodeRef,
        chainRef: baselineRef,
        commit: snapshot.commit,
        tree: snapshot.tree,
        gitBranch: snapshot.gitBranch,
        headCommit: snapshot.headCommit,
        changedPaths: snapshot.changedPaths,
        coverage: snapshot.coverage
      }, new Date(enabledAt.getTime() + 2).toISOString()), initialDirtyReceipt);
    }

    // The baseline receipt is deliberately persisted last. It is the durable
    // completion marker for the multi-event initialization sequence, so a
    // retry cannot mistake a partially written feature-line split for success.
    const nodeId = `node:${shortHash(`${receiptId}:snapshot`)}`;
    const nodeRef = `refs/canvasight/snapshots/nodes/${shortHash(nodeId)}`;
    await pinHistorySnapshot(this.projectPath, nodeRef, baselineSnapshot.commit);
    const recorded = await this.store.append(event(this.identity.localProjectId, nodeId, "snapshot.recorded", {
      nodeId,
      observationId: receiptId,
      baseline: true,
      summary: "项目保护起点",
      source: "external",
      taskId: null,
      snapshotRef: nodeRef,
      chainRef: baselineRef,
      commit: baselineSnapshot.commit,
      tree: baselineSnapshot.tree,
      gitBranch: snapshot.gitBranch,
      headCommit: snapshot.headCommit,
      changedPaths: splitInitialDirtyState ? [] : snapshot.changedPaths,
      coverage: snapshot.coverage
    }, enabledAt.toISOString()), snapshotReceipt);
    return { ...recorded, main };
  }

  async recordTurn({
    taskId,
    turnId,
    status,
    featureLineId,
    featureName,
    source = "codex",
    occurredAt,
    summary,
    chatSummary,
    workflowNodeId,
    workflowTitle,
    workingTreePath,
    attributedPaths,
    hasProjectFileChanges,
    captureTrigger = "provider-poll",
    snapshotOptions = {}
  }) {
    if (!taskId || !turnId) throw new Error("taskId and turnId are required");
    const observationId = `codex:${taskId}:${turnId}:terminal:${status}`;
    const successReceipt = `observation:${observationId}`;
    if (await this.store.hasReceipt(successReceipt)) return { duplicate: true, index: await this.store.readIndex() };
    const snapshotProjectPath = workingTreePath ? path.resolve(workingTreePath) : this.projectPath;
    const topology = await readProjectGitTopology(snapshotProjectPath).catch(() => null);
    const branch = typeof topology?.currentBranch === "string" ? topology.currentBranch : null;
    const branchFeature = branch && branch !== "main" && branch !== "master" ? `feature:branch:${shortHash(branch)}` : null;
    const resolvedFeature = (workflowNodeId ? `feature:workflow:${shortHash(workflowNodeId)}` : null)
      || branchFeature
      || featureLineId
      || `feature:${shortHash(taskId)}`;
    const resolvedFeatureName = workflowTitle || (branchFeature ? featureNameFromBranch(branch) : featureName);
    const featureReceipt = `feature:${resolvedFeature}`;
    if (!(await this.store.hasReceipt(featureReceipt))) {
      await this.store.append(event(this.identity.localProjectId, `event:${shortHash(featureReceipt)}`, "feature.created", {
        featureLineId: resolvedFeature,
        name: typeof resolvedFeatureName === "string" && resolvedFeatureName.trim() ? resolvedFeatureName.trim().slice(0, 80) : "待归类功能",
        originalClassification: workflowNodeId ? "canvasight-workflow" : branchFeature ? "git-branch" : featureLineId ? "explicit-binding" : "automatic"
      }, occurredAt), featureReceipt);
    }
    const snapshotRef = `refs/canvasight/snapshots/project-${shortHash(this.identity.localProjectId)}`;
    try {
      const semanticSummary = normalizedSummary(summary);
      const semanticChatSummary = normalizedSummary(chatSummary) || semanticSummary;
      if (hasProjectFileChanges === false) {
        const recorded = await this.store.append(event(this.identity.localProjectId, `chat:${shortHash(observationId)}`, "chat.recorded", {
          observationId,
          taskId,
          turnId,
          status,
          featureLineId: resolvedFeature,
          summary: semanticChatSummary || summarizeChanges([], status),
          workflowNodeId: workflowNodeId ?? null,
          workflowTitle: workflowTitle ?? null,
          captureTrigger
        }, occurredAt), successReceipt);
        return { ...recorded, snapshotRecorded: false };
      }
      const isolatedWorktree = snapshotProjectPath !== this.projectPath;
      const snapshot = await createIsolatedHistorySnapshot(snapshotProjectPath, {
        snapshotRef,
        excludePathspecs: this.exclusions,
        message: `Canvasight Project History turn ${turnId}`,
        skipIfUnchanged: true,
        skipIfHeadUnchanged: hasProjectFileChanges !== true,
        changeBase: isolatedWorktree ? "head" : "previous-snapshot",
        recoveryToken: observationId,
        ...this.snapshotOptions,
        ...snapshotOptions
      });
      if (snapshot.skipped && !snapshot.recovered) {
        const recorded = await this.store.append(event(this.identity.localProjectId, `chat:${shortHash(observationId)}`, "chat.recorded", {
          observationId,
          taskId,
          turnId,
          status,
          featureLineId: resolvedFeature,
          summary: semanticChatSummary || summarizeChanges([], status),
          workflowNodeId: workflowNodeId ?? null,
          workflowTitle: workflowTitle ?? null,
          captureTrigger
        }, occurredAt), successReceipt);
        return { ...recorded, snapshotRecorded: false };
      }
      const attributed = normalizedAttributedPaths(attributedPaths);
      const snapshotSource = source === "codex" && attributed.size > 0 && snapshot.changedPaths.some((change) => !attributed.has(String(change.path || "").replaceAll("\\", "/")))
        ? "mixed"
        : source;
      const nodeId = `node:${shortHash(observationId)}`;
      const nodeRef = `refs/canvasight/snapshots/nodes/${shortHash(nodeId)}`;
      await pinHistorySnapshot(snapshotProjectPath, nodeRef, snapshot.commit);
      const recorded = await this.store.append(event(this.identity.localProjectId, nodeId, "snapshot.recorded", {
        nodeId,
        observationId,
        baseline: false,
        summary: semanticSummary || summarizeChanges(snapshot.changedPaths, status),
        source: snapshotSource,
        featureLineId: resolvedFeature,
        taskId,
        turnId,
        workflowNodeId: workflowNodeId ?? null,
        workflowTitle: workflowTitle ?? null,
        turnStatus: status,
        snapshotRef: nodeRef,
        chainRef: snapshotRef,
        commit: snapshot.commit,
        tree: snapshot.tree,
        gitBranch: snapshot.gitBranch,
        headCommit: snapshot.headCommit,
        changedPaths: snapshot.changedPaths,
        coverage: snapshot.coverage,
        recoveredAfterPartialWrite: snapshot.recovered === true,
        captureTrigger,
        workingTreePath: snapshotProjectPath
      }, occurredAt), successReceipt);
      return { ...recorded, snapshotRecorded: true };
    } catch (error) {
      const records = await this.store.readRecords();
      const attempt = records.filter((record) => record.receiptId.startsWith(`${successReceipt}:failure:`)).length + 1;
      const failureReceipt = `${successReceipt}:failure:${attempt}`;
      const failure = await this.store.append(event(this.identity.localProjectId, `failure:${shortHash(failureReceipt)}`, "snapshot.failed", {
        observationId,
        taskId,
        turnId,
        status,
        reason: error instanceof Error ? error.message : String(error),
        retryable: true
      }, occurredAt), failureReceipt);
      return { ...failure, failed: true };
    }
  }

  async recordCommittedBranchTip({ branch, commit, summary, occurredAt }) {
    const normalizedBranch = typeof branch === "string" ? branch.trim() : "";
    const normalizedCommit = typeof commit === "string" ? commit.trim() : "";
    if (!normalizedBranch || normalizedBranch === "main" || normalizedBranch === "master" || /[\r\n]/u.test(normalizedBranch)) {
      throw new Error("Project History branch tip requires a non-main local branch");
    }
    if (!/^[0-9a-f]{40}$/u.test(normalizedCommit)) throw new Error("Project History branch tip commit is invalid");
    const existing = await this.store.readIndex();
    const alreadyRecorded = existing.nodes.find((node) =>
      node.gitBranch === normalizedBranch && (node.headCommit === normalizedCommit || node.commit === normalizedCommit)
    );
    if (alreadyRecorded) return { duplicate: true, skipped: true, node: alreadyRecorded, index: existing };

    const observationId = `git-branch-tip:${normalizedBranch}:${normalizedCommit}`;
    const receiptId = `observation:${observationId}`;
    if (await this.store.hasReceipt(receiptId)) return { duplicate: true, index: await this.store.readIndex() };
    const featureLineId = `feature:branch:${shortHash(normalizedBranch)}`;
    const featureReceipt = `feature:${featureLineId}`;
    if (!(await this.store.hasReceipt(featureReceipt))) {
      await this.store.append(event(this.identity.localProjectId, `event:${shortHash(featureReceipt)}`, "feature.created", {
        featureLineId,
        name: featureNameFromBranch(normalizedBranch),
        originalClassification: "git-branch"
      }, occurredAt), featureReceipt);
    }
    const snapshot = await readCommittedHistorySnapshot(this.projectPath, normalizedCommit);
    const nodeId = `node:${shortHash(observationId)}`;
    const nodeRef = `refs/canvasight/snapshots/nodes/${shortHash(nodeId)}`;
    await pinHistorySnapshot(this.projectPath, nodeRef, normalizedCommit);
    return this.store.append(event(this.identity.localProjectId, nodeId, "snapshot.recorded", {
      nodeId,
      observationId,
      baseline: false,
      summary: normalizedSummary(summary) || featureNameFromBranch(normalizedBranch),
      source: "external",
      featureLineId,
      taskId: "external-change",
      turnId: observationId,
      snapshotRef: nodeRef,
      commit: snapshot.commit,
      tree: snapshot.tree,
      gitBranch: normalizedBranch,
      headCommit: snapshot.commit,
      changedPaths: snapshot.changedPaths,
      coverage: snapshot.coverage,
      captureTrigger: "git-branch-tip-scan"
    }, occurredAt), receiptId);
  }

  async readIndex() {
    return this.store.readIndex();
  }

  async ensureMainBranch() {
    const index = await this.store.readIndex();
    const baselineCommit = index.nodes.find((node) => node.kind === "baseline")?.commit ?? null;
    return ensureLocalMainBranch(this.projectPath, { fallbackCommit: baselineCommit });
  }

  async readGitState() {
    return readProjectHistoryGitState(this.projectPath);
  }

  async readGitTopology() {
    return readProjectGitTopology(this.projectPath);
  }

  async editNodeSummary(nodeId, summary) {
    const normalized = typeof summary === "string" ? summary.trim().replace(/\s+/gu, " ") : "";
    if (!normalized) throw new Error("history node summary is required");
    if (normalized.length > 160) throw new Error("history node summary must be 160 characters or fewer");
    const index = await this.store.readIndex();
    if (!index.nodes.some((node) => node.id === nodeId)) throw new Error("history node was not found");
    const receiptId = `summary:${nodeId}:${shortHash(normalized)}`;
    return this.store.append(event(this.identity.localProjectId, `event:${shortHash(receiptId)}`, "node.summary-edited", {
      nodeId,
      summary: normalized
    }), receiptId);
  }

  async reclassifyNode(nodeId, { featureLineId, name = "待归类功能" }) {
    const normalizedFeatureId = typeof featureLineId === "string" ? featureLineId.trim() : "";
    if (!normalizedFeatureId) throw new Error("featureLineId is required");
    const index = await this.store.readIndex();
    const node = index.nodes.find((candidate) => candidate.id === nodeId);
    if (!node) throw new Error("history node was not found");
    if (!index.featureLines.some((feature) => feature.id === normalizedFeatureId)) {
      const createReceipt = `feature:${normalizedFeatureId}`;
      await this.store.append(event(this.identity.localProjectId, `event:${shortHash(createReceipt)}`, "feature.created", {
        featureLineId: normalizedFeatureId,
        name: String(name || "待归类功能").trim().slice(0, 80) || "待归类功能",
        originalClassification: "manual"
      }), createReceipt);
    }
    if (node.featureLineId === normalizedFeatureId) return { duplicate: true, index: await this.store.readIndex() };
    const receiptId = `reclassify:${nodeId}:${normalizedFeatureId}`;
    return this.store.append(event(this.identity.localProjectId, `event:${shortHash(receiptId)}`, "feature.reclassified", {
      nodeId,
      featureLineId: node.featureLineId,
      from: node.featureLineId,
      to: normalizedFeatureId
    }), receiptId);
  }

  async setFeatureAbandoned(featureLineId, abandoned) {
    const index = await this.store.readIndex();
    const feature = index.featureLines.find((candidate) => candidate.id === featureLineId);
    if (!feature) throw new Error("history feature line was not found");
    const type = abandoned ? "feature.abandoned" : "feature.reactivated";
    const receiptId = `${type}:${featureLineId}:${index.revision}`;
    return this.store.append(event(this.identity.localProjectId, `event:${shortHash(receiptId)}`, type, { featureLineId }), receiptId);
  }

  async renameFeature(featureLineId, name) {
    const normalized = typeof name === "string" ? name.trim().replace(/\s+/gu, " ") : "";
    if (!normalized) throw new Error("history feature name is required");
    if (normalized.length > 80) throw new Error("history feature name must be 80 characters or fewer");
    const index = await this.store.readIndex();
    const feature = index.featureLines.find((candidate) => candidate.id === featureLineId);
    if (!feature) throw new Error("history feature line was not found");
    if (feature.name === normalized) return { duplicate: true, index };
    const receiptId = `feature-name:${featureLineId}:${shortHash(normalized)}`;
    return this.store.append(event(this.identity.localProjectId, `event:${shortHash(receiptId)}`, "feature.renamed", {
      featureLineId,
      name: normalized
    }), receiptId);
  }

  async recordConfirmation(nodeId, { commit, ref, verification }) {
    const index = await this.store.readIndex();
    const node = index.nodes.find((candidate) => candidate.id === nodeId);
    if (!node) throw new Error("history node was not found");
    if (node.confirmed) return { duplicate: true, index };
    const receiptId = `confirmation:${nodeId}`;
    return this.store.append(event(this.identity.localProjectId, `event:${shortHash(receiptId)}`, "node.confirmed", {
      nodeId,
      commit,
      ref,
      verification
    }), receiptId);
  }

  async recordAgentCheckRequested(nodeId, { requestId, expiresAt }) {
    const index = await this.store.readIndex();
    if (!index.nodes.some((node) => node.id === nodeId)) throw new Error("history node was not found");
    const receiptId = `agent-check-requested:${nodeId}:${requestId}`;
    return this.store.append(event(this.identity.localProjectId, `event:${shortHash(receiptId)}`, "node.agent-check-requested", {
      nodeId,
      requestId,
      expiresAt
    }), receiptId);
  }

  async recordAgentCheckResult(nodeId, { requestId, outcome, summary, evidence, taskId }) {
    const index = await this.store.readIndex();
    if (!index.nodes.some((node) => node.id === nodeId)) throw new Error("history node was not found");
    const receiptId = `agent-check-result:${nodeId}:${requestId}:${outcome}`;
    return this.store.append(event(this.identity.localProjectId, `event:${shortHash(receiptId)}`, "node.agent-check-recorded", {
      nodeId,
      requestId,
      outcome,
      summary,
      evidence,
      taskId
    }), receiptId);
  }

  async recordMerge(nodeId, { featureLineId, commit, targetBranch }) {
    const index = await this.store.readIndex();
    const node = index.nodes.find((candidate) => candidate.id === nodeId);
    if (!node) throw new Error("history node was not found");
    if (node.merged) return { duplicate: true, index };
    const receiptId = `merge:${nodeId}`;
    return this.store.append(event(this.identity.localProjectId, `event:${shortHash(receiptId)}`, "merge.recorded", {
      nodeId,
      featureLineId: featureLineId ?? node.featureLineId,
      commit,
      targetBranch
    }), receiptId);
  }

  async recordCoverageGap(gapId, payload) {
    const receiptId = `coverage-gap:${gapId}`;
    return this.store.append(event(this.identity.localProjectId, `event:${shortHash(receiptId)}`, "coverage.gap-recorded", {
      gapId,
      ...structuredClone(payload)
    }), receiptId);
  }
}
