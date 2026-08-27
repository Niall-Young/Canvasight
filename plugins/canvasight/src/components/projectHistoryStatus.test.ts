import { describe, expect, it } from "vitest";
import type { ProjectHistoryResponse } from "../lib/canvasightApi";
import { projectHistoryOverviewStatus } from "./projectHistoryStatus";

function response(overrides: Partial<ProjectHistoryResponse> = {}): ProjectHistoryResponse {
  return {
    status: "ready",
    enabled: true,
    index: {
      schemaVersion: 1,
      revision: 1,
      protection: { enabled: true, initialized: true, healthy: true, unresolvedFailures: [] },
      nodes: [],
      featureLines: [],
      chatActivities: [],
      coverageGaps: [],
      processGroups: []
    },
    provider: {
      coverageStartedAt: "2026-08-13T00:00:00.000Z",
      observedTurnCount: 1,
      coverageComplete: true,
      activeTurnCount: 0,
      navigation: "native",
      taskCreation: "native"
    },
    gitTopology: {
      schemaVersion: 1,
      commits: [],
      refs: [],
      totalCommitCount: 0,
      truncated: false,
      topology: "linear",
      mergeStatus: "up-to-date",
      currentBranch: "main",
      headCommit: null,
      mainCommit: null,
      ahead: 0,
      behind: 0,
      workingTree: { dirty: false, changeCount: 0, stagedCount: 0, unstagedCount: 0, untrackedCount: 0 }
    },
    ...overrides
  };
}

describe("project history overview status", () => {
  it("turns a missing response into one explicit retryable state", () => {
    const status = projectHistoryOverviewStatus(null, "zh");
    expect(status.state).toBe("unavailable");
    expect(status.detail).toContain("项目没有因此被修改");
  });

  it("does not describe a protection failure as unsaved project work", () => {
    const value = response();
    value.index!.protection = {
      enabled: true,
      initialized: true,
      healthy: false,
      unresolvedFailures: [{ observationId: "turn-1", reason: "snapshot failed", retryable: true, occurredAt: "2026-08-13T00:00:00.000Z" }]
    };
    const status = projectHistoryOverviewStatus(value, "zh");
    expect(status.state).toBe("protection-needs-attention");
    expect(status.title).toBe("自动保护需要处理");
    expect(status.detail).toContain("项目代码没有因此被改写");
  });

  it("calls out real project changes and explicitly excludes Canvasight metadata", () => {
    const value = response();
    value.gitTopology!.workingTree = { dirty: true, changeCount: 2, stagedCount: 0, unstagedCount: 2, untrackedCount: 0 };
    const status = projectHistoryOverviewStatus(value, "zh");
    expect(status.state).toBe("project-changes-pending");
    expect(status.title).toBe("项目代码有 2 项尚未形成恢复点");
    expect(status.detail).toContain("画布数据不计入");
  });

  it("shows active development as progress instead of a save warning", () => {
    const value = response();
    value.provider!.activeTurnCount = 1;
    value.gitTopology!.workingTree = { dirty: true, changeCount: 4, stagedCount: 0, unstagedCount: 4, untrackedCount: 0 };
    expect(projectHistoryOverviewStatus(value, "zh").state).toBe("development-in-progress");
  });

  it("keeps incomplete task coverage distinct from code and protection state", () => {
    const value = response();
    value.provider!.coverageComplete = false;
    expect(projectHistoryOverviewStatus(value, "zh").state).toBe("coverage-limited");
  });

  it("reports an organized project when only Canvasight metadata was filtered from Git state", () => {
    const status = projectHistoryOverviewStatus(response(), "zh");
    expect(status.state).toBe("organized");
    expect(status.detail).toContain("项目代码没有待保护变化");
    expect(status.detail).toContain("当前功能都已进入项目主线");
  });

  it("offers continuation only when the feature map still has actionable work", () => {
    const status = projectHistoryOverviewStatus(response(), "zh", false, true);
    expect(status.detail).toContain("有功能可以继续开发或整合");
  });
});
