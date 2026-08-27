import { describe, expect, it } from "vitest";
import type { ProjectGitCommit, ProjectGitTopology } from "../lib/canvasightApi";
import { buildProjectGitPanoramaGraph, PROJECT_GIT_WORKING_TREE_NODE_ID } from "./projectGitPanoramaViewModel";

function commit(id: string, parents: string[], overrides: Partial<ProjectGitCommit> = {}): ProjectGitCommit {
  return {
    id,
    shortId: id.slice(0, 8),
    parents,
    subject: id,
    author: "Canvasight",
    committedAt: "2026-08-12T00:00:00.000Z",
    refs: [],
    isHead: false,
    isOnMain: true,
    isOnMainline: true,
    isCanvasightGenerated: false,
    isMerge: parents.length > 1,
    historyNodeIds: [],
    ...overrides
  };
}

function topology(commits: ProjectGitCommit[], overrides: Partial<ProjectGitTopology> = {}): ProjectGitTopology {
  return {
    schemaVersion: 1,
    commits,
    refs: [],
    totalCommitCount: commits.length,
    truncated: false,
    topology: "linear",
    mergeStatus: "up-to-date",
    currentBranch: "main",
    headCommit: commits[0]?.id ?? null,
    mainCommit: commits[0]?.id ?? null,
    ahead: 0,
    behind: 0,
    workingTree: { dirty: false, changeCount: 0, stagedCount: 0, unstagedCount: 0, untrackedCount: 0 },
    ...overrides
  };
}

describe("project Git panorama", () => {
  it("keeps a real linear history on one lane", () => {
    const graph = buildProjectGitPanoramaGraph(topology([
      commit("c3", ["c2"], { isHead: true, isOnMain: false, isOnMainline: false }),
      commit("c2", ["c1"], { isOnMain: false, isOnMainline: false }),
      commit("c1", [])
    ], { currentBranch: "feature/linear", mainCommit: "c1" }), "zh");
    expect(new Set(graph.nodes.map((node) => node.position.y))).toEqual(new Set([110]));
    expect(graph.edges).toHaveLength(2);
  });

  it("preserves a merged feature as a side path instead of flattening it into main", () => {
    const graph = buildProjectGitPanoramaGraph(topology([
      commit("merge", ["main2", "feature2"], { isHead: true, isMerge: true }),
      commit("feature2", ["feature1"], { isOnMainline: false }),
      commit("main2", ["base"]),
      commit("feature1", ["base"], { isOnMainline: false }),
      commit("base", [])
    ], { topology: "branched", headCommit: "merge", mainCommit: "merge" }), "zh");
    const byId = new Map(graph.nodes.map((node) => [node.id, node] as const));
    expect(byId.get("main2")?.position.y).toBe(110);
    expect(byId.get("feature1")?.position.y).toBeGreaterThan(110);
    expect(byId.get("feature2")?.position.y).toBe(byId.get("feature1")?.position.y);
    expect(graph.edges.find((edge) => edge.source === "feature2" && edge.target === "merge")?.className).toContain("is-merge");
  });

  it("shows uncommitted work as a distinct working-tree state", () => {
    const graph = buildProjectGitPanoramaGraph(topology([
      commit("head", [], { isHead: true })
    ], {
      headCommit: "head",
      workingTree: { dirty: true, changeCount: 2, stagedCount: 1, unstagedCount: 0, untrackedCount: 1 }
    }), "zh");
    const workingTree = graph.nodes.find((node) => node.id === PROJECT_GIT_WORKING_TREE_NODE_ID);
    const head = graph.nodes.find((node) => node.id === "head");
    expect(workingTree?.data.kind).toBe("working-tree");
    expect(workingTree?.position.y).toBeGreaterThan(head?.position.y ?? 0);
    expect(graph.edges.some((edge) => edge.source === "head" && edge.target === PROJECT_GIT_WORKING_TREE_NODE_ID)).toBe(true);
  });

  it("keeps the working tree out of a later linear commit occupying the same depth", () => {
    const graph = buildProjectGitPanoramaGraph(topology([
      commit("feature", ["main"], { isOnMain: false, isOnMainline: false }),
      commit("main", ["base"], { isHead: true }),
      commit("base", [])
    ], {
      headCommit: "main",
      mainCommit: "main",
      workingTree: { dirty: true, changeCount: 457, stagedCount: 0, unstagedCount: 0, untrackedCount: 457 }
    }), "zh");
    const byId = new Map(graph.nodes.map((node) => [node.id, node] as const));
    expect(byId.get(PROJECT_GIT_WORKING_TREE_NODE_ID)?.position.x).toBe(byId.get("feature")?.position.x);
    expect(byId.get(PROJECT_GIT_WORKING_TREE_NODE_ID)?.position.y).not.toBe(byId.get("feature")?.position.y);
  });

  it("honors user-saved node positions", () => {
    const graph = buildProjectGitPanoramaGraph(topology([commit("head", [], { isHead: true })]), "zh", "", {
      head: { x: 640, y: 420 }
    });
    expect(graph.nodes.find((node) => node.id === "head")?.position).toEqual({ x: 640, y: 420 });
    expect(graph.nodes.find((node) => node.id === "head")?.draggable).toBe(true);
  });

  it("allocates separate lanes to independent branches from the same parent", () => {
    const graph = buildProjectGitPanoramaGraph(topology([
      commit("branch-b", ["base"], { isOnMain: false, isOnMainline: false }),
      commit("branch-a", ["base"], { isOnMain: false, isOnMainline: false }),
      commit("base", [])
    ], { topology: "branched", headCommit: "branch-b", mainCommit: "base" }), "zh");
    const byId = new Map(graph.nodes.map((node) => [node.id, node] as const));
    expect(byId.get("branch-a")?.position.y).not.toBe(byId.get("branch-b")?.position.y);
  });
});
