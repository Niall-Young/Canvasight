import type { ProjectHistoryNode, ProjectHistoryResponse } from "../lib/canvasightApi";

export interface HistoryLaneGuide {
  id: string;
  featureLineId: string | null;
  name: string;
  status: "main" | "active" | "merged" | "abandoned";
  x: number;
  y: number;
  width: number;
  height: number;
  anchorY: number;
  snapshotCount: number;
  taskCount: number;
  chatCount: number;
  gitBranches: string[];
}

function resolvedPositions(response: ProjectHistoryResponse): Map<string, { x: number; y: number }> {
  const index = response.index;
  const result = new Map<string, { x: number; y: number }>();
  if (!index) return result;
  const featureIds = [...new Set(index.nodes.map((node) => node.featureLineId).filter(Boolean))] as string[];
  const laneIndexes = new Map<number, number>();
  for (const node of index.nodes) {
    const lane = node.kind === "baseline" ? 0 : Math.max(1, featureIds.indexOf(node.featureLineId ?? "") + 1);
    const indexInLane = laneIndexes.get(lane) ?? 0;
    laneIndexes.set(lane, indexInLane + 1);
    result.set(node.id, response.view?.positions[node.id] ?? { x: 120 + indexInLane * 510, y: 180 + lane * 260 });
  }
  return result;
}

function laneFromNodes(
  response: ProjectHistoryResponse,
  nodes: ProjectHistoryNode[],
  positions: Map<string, { x: number; y: number }>,
  details: Pick<HistoryLaneGuide, "id" | "featureLineId" | "name" | "status">
): HistoryLaneGuide | null {
  if (nodes.length === 0) return null;
  const nodePositions = nodes.map((node) => positions.get(node.id)).filter(Boolean) as Array<{ x: number; y: number }>;
  if (nodePositions.length === 0) return null;
  const minX = Math.min(...nodePositions.map((position) => position.x));
  const maxX = Math.max(...nodePositions.map((position) => position.x));
  const minY = Math.min(...nodePositions.map((position) => position.y));
  const maxY = Math.max(...nodePositions.map((position) => position.y));
  const sortedY = nodePositions.map((position) => position.y).sort((a, b) => a - b);
  const anchorY = sortedY[Math.floor(sortedY.length / 2)] ?? minY;
  const nodeIds = new Set(nodes.map((node) => node.id));
  const featureLineId = details.featureLineId;
  const chats = response.index?.chatActivities.filter((chat) => featureLineId && chat.featureLineId === featureLineId) ?? [];
  return {
    ...details,
    x: minX - 28,
    y: minY - 54,
    width: Math.max(456, maxX - minX + 456),
    height: Math.max(228, maxY - minY + 228),
    anchorY,
    snapshotCount: nodes.filter((node) => node.kind !== "baseline").length,
    taskCount: new Set([
      ...nodes.map((node) => node.taskId).filter(Boolean),
      ...chats.map((chat) => chat.taskId).filter(Boolean)
    ]).size,
    chatCount: chats.length,
    gitBranches: [...new Set(nodes.map((node) => node.gitBranch).filter(Boolean))] as string[]
  };
}

export function buildHistoryLaneGuides(response: ProjectHistoryResponse, language: "zh" | "en" = "zh"): HistoryLaneGuide[] {
  const index = response.index;
  if (!index) return [];
  const positions = resolvedPositions(response);
  const guides: HistoryLaneGuide[] = [];
  const baseline = laneFromNodes(
    response,
    index.nodes.filter((node) => node.kind === "baseline"),
    positions,
    { id: "history-lane:main", featureLineId: null, name: language === "zh" ? "Git 主线" : "Git main", status: "main" }
  );
  if (baseline) guides.push(baseline);
  for (const feature of index.featureLines) {
    const guide = laneFromNodes(
      response,
      index.nodes.filter((node) => node.featureLineId === feature.id),
      positions,
      { id: `history-lane:${feature.id}`, featureLineId: feature.id, name: feature.name, status: feature.status }
    );
    if (guide) guides.push(guide);
  }
  return guides;
}

export function nearestHistoryFeatureLine(response: ProjectHistoryResponse, nodeId: string, y: number): HistoryLaneGuide | null {
  const source = response.index?.nodes.find((node) => node.id === nodeId);
  if (!source || source.kind === "baseline") return null;
  const candidates = buildHistoryLaneGuides(response).filter((guide) => guide.featureLineId && guide.status !== "merged");
  return candidates.reduce<HistoryLaneGuide | null>((nearest, guide) => {
    if (!nearest) return guide;
    return Math.abs(guide.anchorY - y) < Math.abs(nearest.anchorY - y) ? guide : nearest;
  }, null);
}

export function currentHistoryFocusNodeIds(response: ProjectHistoryResponse, threadId: string | null, limit = 4): string[] {
  const index = response.index;
  if (!index) return [];
  const featureStatus = new Map(index.featureLines.map((feature) => [feature.id, feature.status] as const));
  const eligible = index.nodes.filter((node) =>
    node.kind !== "baseline" &&
    !node.merged &&
    node.featureLineId &&
    featureStatus.get(node.featureLineId) === "active"
  );
  const taskNodes = threadId ? eligible.filter((node) => node.taskId === threadId) : [];
  const branchNodes = response.git?.currentBranch
    ? eligible.filter((node) => node.gitBranch === response.git?.currentBranch)
    : [];
  const currentContextIds = new Set([...taskNodes, ...branchNodes].map((node) => node.id));
  const currentContextNodes = eligible.filter((node) => currentContextIds.has(node.id));
  const candidates = currentContextNodes.length ? currentContextNodes : eligible;
  const latest = [...candidates].sort((a, b) => a.occurredAt.localeCompare(b.occurredAt)).at(-1);
  if (!latest?.featureLineId) return [];
  return eligible
    .filter((node) => node.featureLineId === latest.featureLineId)
    .sort((a, b) => a.occurredAt.localeCompare(b.occurredAt))
    .slice(-Math.max(1, limit))
    .map((node) => node.id);
}
