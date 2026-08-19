import { describe, expect, it } from "vitest";
import { createProjectHistoryDemo } from "./projectHistoryDemo";
import { buildHistoryLaneGuides, currentHistoryFocusNodeIds, nearestHistoryFeatureLine } from "./projectHistoryViewModel";

describe("Project History example data", () => {
  it("demonstrates the complete lightweight history journey without remote authority", () => {
    const response = createProjectHistoryDemo("zh");
    const index = response.index;

    expect(response.enabled).toBe(true);
    expect(index?.nodes).toHaveLength(6);
    expect(index?.nodes.some((node) => node.kind === "baseline")).toBe(true);
    expect(index?.nodes.some((node) => node.coverage.complete === false)).toBe(true);
    expect(index?.featureLines.map((feature) => feature.status)).toEqual(["active", "merged", "abandoned"]);
    expect(index?.chatActivities).toHaveLength(3);
    expect(new Set(index?.nodes.map((node) => node.turnId).filter(Boolean)).size).toBe(5);
    expect(Object.keys(response.view?.positions ?? {})).toHaveLength(index?.nodes.length ?? 0);
    expect(response.portability?.authorized).toBe(false);
  });

  it("localizes the visible explanation while preserving the same graph identity", () => {
    const zh = createProjectHistoryDemo("zh");
    const en = createProjectHistoryDemo("en");

    expect(en.index?.nodes.map((node) => node.id)).toEqual(zh.index?.nodes.map((node) => node.id));
    expect(en.index?.nodes[0]?.summary).toBe("Project protection started");
    expect(zh.index?.nodes[0]?.summary).toBe("项目保护起点");
  });

  it("separates Git main from logical feature lines and summarizes cross-task activity", () => {
    const response = createProjectHistoryDemo("zh");
    const guides = buildHistoryLaneGuides(response, "zh");

    expect(guides.map((guide) => guide.status)).toEqual(["main", "active", "merged", "abandoned"]);
    expect(guides[0]).toMatchObject({ featureLineId: null, name: "Git 主线", snapshotCount: 0 });
    expect(guides.find((guide) => guide.featureLineId === "feature-history")).toMatchObject({
      snapshotCount: 2,
      taskCount: 1,
      chatCount: 2
    });
  });

  it("uses vertical drag position to choose a non-merged feature line", () => {
    const response = createProjectHistoryDemo("zh");

    expect(nearestHistoryFeatureLine(response, "demo-old-inspector", 60)?.featureLineId).toBe("feature-history");
    expect(nearestHistoryFeatureLine(response, "demo-history-polish", 560)?.featureLineId).toBe("feature-old-inspector");
    expect(nearestHistoryFeatureLine(response, "demo-baseline", 60)).toBeNull();
  });

  it("focuses the latest active feature instead of fitting the entire history", () => {
    const response = createProjectHistoryDemo("zh");

    expect(currentHistoryFocusNodeIds(response, "demo-task")).toEqual([
      "demo-history-structure",
      "demo-history-polish"
    ]);
  });

  it("uses a newer current-branch snapshot instead of a stale task snapshot", () => {
    const response = createProjectHistoryDemo("zh");
    const latestBranchNode = {
      ...response.index!.nodes.find((node) => node.id === "demo-history-polish")!,
      id: "demo-current-branch-latest",
      taskId: null,
      gitBranch: response.git!.currentBranch,
      occurredAt: "2026-08-12T04:00:00.000Z"
    };
    response.index = { ...response.index!, nodes: [...response.index!.nodes, latestBranchNode] };

    expect(currentHistoryFocusNodeIds(response, "demo-task")).toEqual([
      "demo-history-structure",
      "demo-history-polish",
      "demo-current-branch-latest"
    ]);
  });
});
