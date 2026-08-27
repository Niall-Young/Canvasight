import { MarkerType, Position, type Edge } from "@xyflow/react";
import type { ProjectGitCommit, ProjectGitTopology } from "../lib/canvasightApi";
import type { ProjectGitFlowNode } from "./ProjectGitNode";

export const PROJECT_GIT_WORKING_TREE_NODE_ID = "project-git:working-tree";

export interface ProjectGitPanoramaGraph {
  nodes: ProjectGitFlowNode[];
  edges: Edge[];
  matchingNodeIds: string[];
}

export function buildProjectGitPanoramaGraph(
  topology: ProjectGitTopology,
  language: "zh" | "en",
  query = "",
  savedPositions: Record<string, { x: number; y: number }> = {}
): ProjectGitPanoramaGraph {
  const ordered = [...topology.commits].reverse();
  const commits = new Map(ordered.map((commit) => [commit.id, commit] as const));
  const depths = new Map<string, number>();
  const lanes = new Map<string, number>();
  const inheritedChildren = new Map<string, number>();
  let nextLane = 1;

  for (const commit of ordered) {
    const parentDepths = commit.parents.map((parent) => depths.get(parent)).filter((depth): depth is number => depth !== undefined);
    depths.set(commit.id, parentDepths.length ? Math.max(...parentDepths) + 1 : 0);
    if (topology.topology === "linear" || commit.isOnMainline) {
      lanes.set(commit.id, 0);
      continue;
    }
    const firstParent = commit.parents[0];
    const firstParentCommit = firstParent ? commits.get(firstParent) : undefined;
    const inheritedCount = firstParent ? inheritedChildren.get(firstParent) ?? 0 : 0;
    if (firstParent && firstParentCommit && !firstParentCommit.isOnMainline && inheritedCount === 0) {
      lanes.set(commit.id, lanes.get(firstParent) ?? nextLane++);
      inheritedChildren.set(firstParent, 1);
    } else {
      lanes.set(commit.id, nextLane++);
      if (firstParent) inheritedChildren.set(firstParent, inheritedCount + 1);
    }
  }

  const normalizedQuery = query.trim().toLocaleLowerCase();
  const matches = (commit: ProjectGitCommit): boolean => !normalizedQuery || `${commit.displaySubject ?? ""} ${commit.subject} ${commit.shortId} ${commit.author} ${commit.refs.map((ref) => ref.name).join(" ")}`.toLocaleLowerCase().includes(normalizedQuery);
  const nodes: ProjectGitFlowNode[] = ordered.map((commit) => ({
    id: commit.id,
    type: "projectGit",
    data: {
      kind: "commit",
      language,
      commit,
      currentBranch: topology.currentBranch,
      matchesQuery: matches(commit)
    },
    position: savedPositions[commit.id] ?? { x: 90 + (depths.get(commit.id) ?? 0) * 350, y: 110 + (lanes.get(commit.id) ?? 0) * 220 },
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
    draggable: true
  }));
  const edges: Edge[] = [];
  for (const commit of ordered) {
    commit.parents.forEach((parent, parentIndex) => {
      if (!commits.has(parent)) return;
      const mainline = commit.isOnMainline && commits.get(parent)?.isOnMainline && parentIndex === 0;
      edges.push({
        id: `project-git-edge:${parent}:${commit.id}`,
        source: parent,
        target: commit.id,
        className: `project-git-edge ${mainline ? "is-mainline" : "is-branch"} ${commit.isMerge && parentIndex > 0 ? "is-merge" : ""}`,
        markerEnd: { type: MarkerType.ArrowClosed }
      });
    });
  }

  if (topology.workingTree.dirty) {
    const headDepth = topology.headCommit ? depths.get(topology.headCommit) ?? -1 : -1;
    const workingTreeLane = Math.max(0, ...lanes.values()) + 1;
    nodes.push({
      id: PROJECT_GIT_WORKING_TREE_NODE_ID,
      type: "projectGit",
      data: {
        kind: "working-tree",
        language,
        workingTree: topology.workingTree,
        currentBranch: topology.currentBranch,
        matchesQuery: !normalizedQuery || (language === "zh" ? "未提交 正在修改 工作区" : "uncommitted working tree in progress").includes(normalizedQuery)
      },
      position: savedPositions[PROJECT_GIT_WORKING_TREE_NODE_ID] ?? { x: 90 + (headDepth + 1) * 350, y: 110 + workingTreeLane * 220 },
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
      draggable: true
    });
    if (topology.headCommit && commits.has(topology.headCommit)) {
      edges.push({
        id: `project-git-edge:${topology.headCommit}:${PROJECT_GIT_WORKING_TREE_NODE_ID}`,
        source: topology.headCommit,
        target: PROJECT_GIT_WORKING_TREE_NODE_ID,
        className: "project-git-edge is-working",
        animated: true,
        markerEnd: { type: MarkerType.ArrowClosed }
      });
    }
  }
  return {
    nodes,
    edges,
    matchingNodeIds: nodes.filter((node) => node.data.matchesQuery).map((node) => node.id)
  };
}
