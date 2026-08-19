import type { ProjectHistoryFeatureMapItem } from "./projectHistoryFeatureMap";

export interface ProjectHistoryFeaturePosition {
  x: number;
  y: number;
  path: "mainline" | "branch";
}

const COLUMN_GAP = 510;
const ROW_GAP = 270;
const ORIGIN_X = 80;
const ORIGIN_Y = 100;

export function layoutProjectHistoryFeatureMap(
  items: ProjectHistoryFeatureMapItem[],
  { includeProjectStart = false }: { includeProjectStart?: boolean } = {}
): Map<string, ProjectHistoryFeaturePosition> {
  const positions = new Map<string, ProjectHistoryFeaturePosition>();
  const originX = ORIGIN_X + (includeProjectStart ? COLUMN_GAP : 0);
  const itemById = new Map(items.map((item) => [item.id, item] as const));
  const mainlineDepth = (item: ProjectHistoryFeatureMapItem, seen = new Set<string>()): number => {
    if (!item.dependencyId || seen.has(item.id)) return 0;
    const parent = itemById.get(item.dependencyId);
    if (!parent || parent.status !== "integrated") return 0;
    return 1 + mainlineDepth(parent, new Set([...seen, item.id]));
  };
  const integrated = items
    .filter((item) => item.status === "integrated")
    .sort((a, b) => mainlineDepth(a) - mainlineDepth(b) || Number(b.projectRoot) - Number(a.projectRoot) || a.occurredAt.localeCompare(b.occurredAt));

  integrated.forEach((item, index) => positions.set(item.id, {
    x: originX + index * COLUMN_GAP,
    y: ORIGIN_Y,
    path: "mainline"
  }));

  const branchItems = items
    .filter((item) => item.status !== "integrated")
    .sort((a, b) => a.occurredAt.localeCompare(b.occurredAt));
  const branchRootId = (item: ProjectHistoryFeatureMapItem): string => {
    let current = item;
    const seen = new Set<string>();
    while (current.dependencyId && !seen.has(current.id)) {
      seen.add(current.id);
      const parent = itemById.get(current.dependencyId);
      if (!parent || parent.status === "integrated") break;
      current = parent;
    }
    return current.id;
  };
  const roots = [...new Set(branchItems.map(branchRootId))];
  const laneByRoot = new Map(roots.map((id, index) => [id, index + 1] as const));

  const placeBranch = (item: ProjectHistoryFeatureMapItem, seen = new Set<string>()): ProjectHistoryFeaturePosition => {
    const existing = positions.get(item.id);
    if (existing) return existing;
    const rootId = branchRootId(item);
    const lane = laneByRoot.get(rootId) ?? 1;
    const parent = item.dependencyId && !seen.has(item.id) ? itemById.get(item.dependencyId) : null;
    const parentPosition = parent ? positions.get(parent.id) ?? placeBranch(parent, new Set([...seen, item.id])) : null;
    const position = {
      x: (parentPosition?.x ?? (originX - COLUMN_GAP)) + COLUMN_GAP,
      y: ORIGIN_Y + lane * ROW_GAP,
      path: "branch" as const
    };
    positions.set(item.id, position);
    return position;
  };

  for (const item of branchItems) placeBranch(item);
  return positions;
}

export function layoutProjectHistorySearchResults(items: ProjectHistoryFeatureMapItem[]): Map<string, ProjectHistoryFeaturePosition> {
  return new Map([...items]
    .sort((a, b) => a.occurredAt.localeCompare(b.occurredAt))
    .map((item, index) => [item.id, {
      x: ORIGIN_X + index * COLUMN_GAP,
      y: ORIGIN_Y,
      path: item.status === "integrated" ? "mainline" as const : "branch" as const
    }]));
}
