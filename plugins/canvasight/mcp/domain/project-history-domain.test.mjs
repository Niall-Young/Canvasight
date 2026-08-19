import { describe, expect, it } from "vitest";
import { buildProjectHistoryIndex, foldSnapshotProcessGroups } from "./project-history-domain.mjs";

const projectId = "project-1";
const makeEvent = (id, type, payload, minute) => ({
  version: 1,
  id,
  projectId,
  type,
  occurredAt: `2026-08-10T10:${String(minute).padStart(2, "0")}:00.000Z`,
  payload
});

describe("Project History domain", () => {
  it("distinguishes recorded authorization from a completed baseline", () => {
    const authorized = buildProjectHistoryIndex([makeEvent("enable", "protection.enabled", {}, 0)]);
    expect(authorized.protection).toMatchObject({ enabled: true, initialized: false, healthy: false });
    const initialized = buildProjectHistoryIndex([
      makeEvent("enable", "protection.enabled", {}, 0),
      makeEvent("baseline", "snapshot.recorded", {
        nodeId: "baseline-node",
        observationId: "protection",
        baseline: true,
        summary: "项目保护起点",
        source: "external",
        snapshotRef: "refs/canvasight/snapshots/baseline",
        commit: "a".repeat(40),
        tree: "b".repeat(40),
        coverage: { complete: true }
      }, 1)
    ]);
    expect(initialized.protection).toMatchObject({ enabled: true, initialized: true, healthy: true });
  });

  it("rebuilds edits, classification, abandonment, confirmation, and merge without deleting history", () => {
    const snapshot = {
      nodeId: "node-1",
      summary: "原摘要",
      source: "codex",
      featureLineId: "feature-1",
      taskId: "task-1",
      turnId: "turn-1",
      snapshotRef: "refs/canvasight/snapshots/one",
      commit: "a".repeat(40),
      tree: "b".repeat(40),
      coverage: { complete: true }
    };
    const index = buildProjectHistoryIndex([
      makeEvent("enable", "protection.enabled", {}, 0),
      makeEvent("feature", "feature.created", { featureLineId: "feature-1", name: "功能一" }, 1),
      makeEvent("snapshot", "snapshot.recorded", snapshot, 2),
      makeEvent("edit", "node.summary-edited", { nodeId: "node-1", summary: "最终摘要" }, 3),
      makeEvent("agent-request", "node.agent-check-requested", { nodeId: "node-1", requestId: "request-1", expiresAt: "2026-08-10T11:00:00.000Z" }, 3),
      makeEvent("agent-result", "node.agent-check-recorded", { nodeId: "node-1", requestId: "request-1", outcome: "passed", summary: "功能验收通过", evidence: ["交互通过"], taskId: "agent-task" }, 3),
      makeEvent("move", "feature.reclassified", { nodeId: "node-1", featureLineId: "feature-1", from: "feature-1", to: "feature-2" }, 4),
      makeEvent("abandon", "feature.abandoned", { featureLineId: "feature-1" }, 5),
      makeEvent("reactivate", "feature.reactivated", { featureLineId: "feature-1" }, 6),
      makeEvent("confirm", "node.confirmed", { nodeId: "node-1", commit: "c".repeat(40) }, 7),
      makeEvent("merge", "merge.recorded", { nodeId: "node-1", featureLineId: "feature-1", commit: "d".repeat(40) }, 8)
    ]);
    expect(index.nodes).toHaveLength(1);
    expect(index.nodes[0]).toMatchObject({ summary: "最终摘要", featureLineId: "feature-2", confirmed: true, merged: true, agentCheck: { status: "passed", requestId: "request-1" } });
    expect(index.nodes[0].edits).toHaveLength(1);
    expect(index.featureLines[0].status).toBe("merged");
  });

  it("keeps unresolved failures unhealthy until the same observation is recovered", () => {
    const baseline = makeEvent("baseline", "snapshot.recorded", {
      nodeId: "baseline-node",
      baseline: true,
      summary: "项目保护起点",
      source: "external",
      snapshotRef: "refs/canvasight/snapshots/baseline",
      commit: "c".repeat(40),
      tree: "d".repeat(40),
      coverage: { complete: true }
    }, 0);
    const failed = makeEvent("failed", "snapshot.failed", { observationId: "observation-1", reason: "disk", retryable: true }, 0);
    expect(buildProjectHistoryIndex([makeEvent("enable", "protection.enabled", {}, 0), baseline, failed]).protection).toMatchObject({
      healthy: false,
      unresolvedFailures: [{ observationId: "observation-1" }]
    });
    const recovered = makeEvent("node", "snapshot.recorded", {
      nodeId: "node-1",
      observationId: "observation-1",
      summary: "已补录",
      source: "codex",
      snapshotRef: "refs/canvasight/snapshots/one",
      commit: "a".repeat(40),
      tree: "b".repeat(40),
      coverage: { complete: true }
    }, 1);
    expect(buildProjectHistoryIndex([makeEvent("enable", "protection.enabled", {}, 0), baseline, failed, recovered]).protection).toMatchObject({
      healthy: true,
      unresolvedFailures: []
    });
  });

  it("closes a failed snapshot attempt when the same observation is later recorded as chat-only", () => {
    const baseline = makeEvent("baseline", "snapshot.recorded", {
      nodeId: "baseline-node",
      baseline: true,
      summary: "项目保护起点",
      source: "external",
      snapshotRef: "refs/canvasight/snapshots/baseline",
      commit: "c".repeat(40),
      tree: "d".repeat(40),
      coverage: { complete: true }
    }, 0);
    const failed = makeEvent("failed", "snapshot.failed", {
      observationId: "observation-1",
      reason: "another history operation is active",
      retryable: true
    }, 1);
    const chat = makeEvent("chat", "chat.recorded", {
      observationId: "observation-1",
      taskId: "task-1",
      turnId: "turn-1",
      status: "completed",
      featureLineId: "feature-1",
      summary: "完成讨论，没有项目变化"
    }, 2);

    expect(buildProjectHistoryIndex([makeEvent("enable", "protection.enabled", {}, 0), baseline, failed, chat]).protection).toMatchObject({
      healthy: true,
      unresolvedFailures: []
    });
  });

  it("does not downgrade a completed Agent check when dispatch acknowledgement arrives late", () => {
    const snapshot = makeEvent("snapshot", "snapshot.recorded", {
      nodeId: "node-1",
      summary: "功能变化",
      source: "codex",
      snapshotRef: "refs/canvasight/snapshots/one",
      commit: "a".repeat(40),
      tree: "b".repeat(40),
      coverage: { complete: true }
    }, 0);
    const index = buildProjectHistoryIndex([
      snapshot,
      makeEvent("agent-result", "node.agent-check-recorded", { nodeId: "node-1", requestId: "request-1", outcome: "passed", summary: "通过", evidence: [], taskId: "agent-task" }, 1),
      makeEvent("agent-request", "node.agent-check-requested", { nodeId: "node-1", requestId: "request-1", expiresAt: "2026-08-10T11:00:00.000Z" }, 2)
    ]);
    expect(index.nodes[0].agentCheck).toMatchObject({ status: "passed", requestId: "request-1" });
  });

  it("does not keep legacy nodes incomplete only because exclusion rules were configured", () => {
    const legacy = buildProjectHistoryIndex([makeEvent("legacy", "snapshot.recorded", {
      nodeId: "legacy-node",
      summary: "旧版恢复点",
      source: "codex",
      snapshotRef: "refs/canvasight/snapshots/legacy",
      commit: "a".repeat(40),
      tree: "b".repeat(40),
      coverage: {
        complete: false,
        excludedPathspecs: [".env", "node_modules/"],
        automaticExcludedPaths: [],
        gapCodes: ["policy-exclusions"]
      }
    }, 0)]);
    expect(legacy.nodes[0].coverage).toMatchObject({ complete: true, legacyPolicyUnverified: true, gapCodes: [] });

    const audited = buildProjectHistoryIndex([makeEvent("audited", "snapshot.recorded", {
      nodeId: "audited-node",
      summary: "审计后的恢复点",
      source: "codex",
      snapshotRef: "refs/canvasight/snapshots/audited",
      commit: "c".repeat(40),
      tree: "d".repeat(40),
      coverage: {
        complete: false,
        excludedPathspecs: [".env"],
        policyExcludedPaths: [".env"],
        gapCodes: ["policy-exclusions"]
      }
    }, 1)]);
    expect(audited.nodes[0].coverage).toMatchObject({ complete: false, policyExcludedPaths: [".env"] });

    const falsePositive = buildProjectHistoryIndex([makeEvent("false-positive", "snapshot.recorded", {
      nodeId: "false-positive-node",
      summary: "旧版误报",
      source: "codex",
      snapshotRef: "refs/canvasight/snapshots/false-positive",
      commit: "e".repeat(40),
      tree: "f".repeat(40),
      coverage: {
        complete: false,
        excludedPathspecs: ["*.pem", "node_modules/"],
        policyExcludedPaths: ["output/"],
        gapCodes: ["policy-exclusions"]
      }
    }, 2)]);
    expect(falsePositive.nodes[0].coverage).toMatchObject({ complete: true, coverageAuditCorrected: true, policyExcludedPaths: [], gapCodes: [] });
  });

  it("folds only three or more consecutive ordinary snapshots in the same series", () => {
    const nodes = Array.from({ length: 4 }, (_, index) => ({
      id: `node-${index}`,
      kind: "snapshot",
      featureLineId: "feature-1",
      taskId: "task-1",
      confirmed: false,
      merged: false,
      status: "protected"
    }));
    expect(foldSnapshotProcessGroups(nodes)).toEqual([expect.objectContaining({ count: 4, nodeIds: nodes.map((node) => node.id) })]);
    expect(foldSnapshotProcessGroups(nodes.slice(0, 2))).toEqual([]);
    expect(foldSnapshotProcessGroups(nodes.map((node, index) => index === 1 ? { ...node, agentCheck: { status: "failed" } } : node))).toEqual([]);
  });
});
