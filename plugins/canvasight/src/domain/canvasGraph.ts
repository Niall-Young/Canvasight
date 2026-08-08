import type { Edge, Node } from "@xyflow/react";
import type { ScatterEdge, ScatterNode, ScatterTaskNode } from "../../shared/types";

export const taskNodeWidth = 400;
export const taskNodeHeight = 220;
export const taskNodeHorizontalGap = 180;
const taskNodeVerticalGap = 72;
export const assetNodeWidth = 360;
const assetNodeHeight = 360;
export const groupHeaderHeight = 40;
export const groupPadding = 32;
export const groupMinWidth = 360;
export const groupMinHeight = 160;
export const aggregateEdgePrefix = "__canvasight-group-aggregate__";
export const connectionPreviewEdgeId = "__canvasight-connection-preview__";

export type FlowPosition = { x: number; y: number };
export type ConnectionStart = { nodeId: string; handleType: "source" | "target" };
export type ConnectionHoverTarget = { sourceId: string; targetId: string; hoveredNodeId: string };

export interface UngroupNodesResult {
  nodes: ScatterNode[];
  dissolvedGroupIds: string[];
  releasedNodeIds: string[];
}

type MeasuredScatterNode = ScatterNode & { measured?: { width?: number; height?: number } };

export function roundPosition(position: FlowPosition): FlowPosition {
  return { x: Math.round(position.x), y: Math.round(position.y) };
}

export function nodeBounds(node: ScatterNode): { width: number; height: number } {
  const measured = (node as MeasuredScatterNode).measured;
  return {
    width: node.width ?? measured?.width ?? taskNodeWidth,
    height: node.height ?? measured?.height ?? taskNodeHeight
  };
}

function positionOverlapsNode(position: FlowPosition, node: ScatterNode): boolean {
  const margin = 32;
  const bounds = nodeBounds(node);
  return position.x < node.position.x + bounds.width + margin
    && position.x + taskNodeWidth > node.position.x - margin
    && position.y < node.position.y + bounds.height + margin
    && position.y + taskNodeHeight > node.position.y - margin;
}

function positionIntersectsNode(position: FlowPosition, node: ScatterNode): boolean {
  const bounds = nodeBounds(node);
  return position.x < node.position.x + bounds.width
    && position.x + taskNodeWidth > node.position.x
    && position.y < node.position.y + bounds.height
    && position.y + taskNodeHeight > node.position.y;
}

function isOpenPosition(position: FlowPosition, nodes: ScatterNode[]): boolean {
  return nodes.every((node) => !positionOverlapsNode(position, node));
}

export function findConnectionDropPosition(
  dropPosition: FlowPosition,
  handleType: ConnectionStart["handleType"],
  sourceNode: ScatterNode,
  nodes: ScatterNode[]
): FlowPosition {
  const sourceBounds = nodeBounds(sourceNode);
  const directionalGap = 16;
  const base = roundPosition({
    x: handleType === "source" ? dropPosition.x : dropPosition.x - taskNodeWidth,
    y: dropPosition.y - taskNodeHeight / 2
  });
  const directionAdjusted = positionIntersectsNode(base, sourceNode)
    ? roundPosition({
        ...base,
        x: handleType === "source" ? sourceNode.position.x + sourceBounds.width + directionalGap : sourceNode.position.x - taskNodeWidth - directionalGap
      })
    : base;
  const isOpen = (position: FlowPosition) => nodes.every((node) => !positionIntersectsNode(position, node));
  if (isOpen(directionAdjusted)) return directionAdjusted;
  const offsets = [0, 48, -48, 96, -96, 144, -144, 192, -192, 240, -240, 288, -288];
  for (const yOffset of offsets) {
    const candidate = roundPosition({ x: directionAdjusted.x, y: directionAdjusted.y + yOffset });
    if (isOpen(candidate)) return candidate;
  }
  for (const xOffset of offsets.slice(1)) {
    for (const yOffset of offsets) {
      const candidate = roundPosition({ x: directionAdjusted.x + xOffset, y: directionAdjusted.y + yOffset });
      if (isOpen(candidate)) return candidate;
    }
  }
  return directionAdjusted;
}

export function findOpenPositionNear(preferred: FlowPosition, nodes: ScatterNode[]): FlowPosition {
  const base = roundPosition(preferred);
  if (isOpenPosition(base, nodes)) return base;
  const stepX = taskNodeWidth + taskNodeHorizontalGap;
  const stepY = taskNodeHeight + taskNodeVerticalGap;
  for (let ring = 1; ring <= 6; ring += 1) {
    for (let column = -ring; column <= ring; column += 1) {
      for (let row = -ring; row <= ring; row += 1) {
        if (Math.abs(column) !== ring && Math.abs(row) !== ring) continue;
        const candidate = roundPosition({ x: preferred.x + column * stepX, y: preferred.y + row * stepY });
        if (isOpenPosition(candidate, nodes)) return candidate;
      }
    }
  }
  return base;
}

function findOpenPositionInDirection(preferred: FlowPosition, nodes: ScatterNode[], direction: 1 | -1): FlowPosition {
  const base = roundPosition(preferred);
  if (isOpenPosition(base, nodes)) return base;
  const stepX = taskNodeWidth + taskNodeHorizontalGap;
  const stepY = taskNodeHeight + taskNodeVerticalGap;
  const rowOffsets = [0, 1, -1, 2, -2, 3, -3, 4, -4];
  for (let column = 0; column <= 4; column += 1) {
    for (const row of rowOffsets) {
      const candidate = roundPosition({ x: preferred.x + direction * column * stepX, y: preferred.y + row * stepY });
      if (isOpenPosition(candidate, nodes)) return candidate;
    }
  }
  return base;
}

export const findOpenPositionToRight = (preferred: FlowPosition, nodes: ScatterNode[]) => findOpenPositionInDirection(preferred, nodes, 1);
export const findOpenPositionToLeft = (preferred: FlowPosition, nodes: ScatterNode[]) => findOpenPositionInDirection(preferred, nodes, -1);

export function connectionFromStart(connectionStart: ConnectionStart, targetNodeId: string): Pick<ScatterEdge, "source" | "target"> | null {
  if (connectionStart.nodeId === targetNodeId) return null;
  return connectionStart.handleType === "source"
    ? { source: connectionStart.nodeId, target: targetNodeId }
    : { source: targetNodeId, target: connectionStart.nodeId };
}

export function isConnectionAllowed(
  connection: Pick<ScatterEdge, "source" | "target">,
  edges: ScatterEdge[],
  nodes: ScatterNode[] = []
): boolean {
  if (!connection.source || !connection.target || connection.source === connection.target) return false;
  if (edges.some((edge) => edge.source === connection.source && edge.target === connection.target)) return false;
  if (edges.some((edge) => edge.target === connection.target)) return false;
  return !nodes.some((node) => (node.id === connection.source || node.id === connection.target) && node.type === "group");
}

export function absoluteNodePosition(node: ScatterNode, nodes: ScatterNode[]): FlowPosition {
  if (node.type === "group" || !node.parentId) return node.position;
  const parent = nodes.find((candidate) => candidate.id === node.parentId && candidate.type === "group");
  return parent ? { x: parent.position.x + node.position.x, y: parent.position.y + node.position.y } : node.position;
}

export function ungroupNodes(nodes: ScatterNode[], targetIds: Iterable<string>): UngroupNodesResult {
  const targets = new Set(targetIds);
  const groups = new Map(nodes.filter((node) => node.type === "group").map((node) => [node.id, node]));
  const dissolvedGroupIds = nodes
    .filter((node) => node.type === "group" && targets.has(node.id))
    .map((node) => node.id);
  const dissolvedGroups = new Set(dissolvedGroupIds);
  const releasedNodeIds: string[] = [];
  const nextNodes = nodes.flatMap((node): ScatterNode[] => {
    if (node.type === "group") return dissolvedGroups.has(node.id) ? [] : [node];
    if (!node.parentId || (!targets.has(node.id) && !dissolvedGroups.has(node.parentId))) return [node];
    const group = groups.get(node.parentId);
    releasedNodeIds.push(node.id);
    return [{
      ...node,
      parentId: undefined,
      position: group
        ? { x: group.position.x + node.position.x, y: group.position.y + node.position.y }
        : node.position
    }];
  });

  return { nodes: nextNodes, dissolvedGroupIds, releasedNodeIds };
}

export function assetPositionNextToTask(task: ScatterTaskNode, nodes: ScatterNode[]): FlowPosition {
  const taskPosition = absoluteNodePosition(task, nodes);
  const gap = 96;
  const group = task.parentId ? nodes.find((node) => node.type === "group" && node.id === task.parentId) : undefined;
  const candidates = [
    { x: taskPosition.x - assetNodeWidth - gap, y: taskPosition.y },
    { x: taskPosition.x + nodeBounds(task).width + gap, y: taskPosition.y }
  ];
  const occupiedNodes = nodes.filter((node) => node.type !== "group");
  const isOpen = (position: FlowPosition): boolean => occupiedNodes.every((node) => {
    const nodePosition = absoluteNodePosition(node, nodes);
    const bounds = nodeBounds(node);
    return position.x + assetNodeWidth <= nodePosition.x
      || position.x >= nodePosition.x + bounds.width
      || position.y + assetNodeHeight <= nodePosition.y
      || position.y >= nodePosition.y + bounds.height;
  });
  for (const yOffset of [0, assetNodeHeight + gap, -(assetNodeHeight + gap)]) {
    for (const candidate of candidates) {
      const rawPosition = { x: candidate.x, y: candidate.y + yOffset };
      const position = group
        ? {
            x: Math.max(group.position.x + groupPadding, rawPosition.x),
            y: Math.max(group.position.y + groupHeaderHeight + groupPadding, rawPosition.y)
          }
        : rawPosition;
      if (isOpen(position)) return position;
    }
  }
  return candidates[1];
}

export function orderedFlowNodes(nodes: ScatterNode[], collapsedGroupIds: string[]): Node[] {
  const collapsed = new Set(collapsedGroupIds);
  return [...nodes]
    .sort((left, right) => Number(left.type !== "group") - Number(right.type !== "group"))
    .map((node) => {
      const hidden = node.type !== "group" && Boolean(node.parentId && collapsed.has(node.parentId));
      if (node.type === "group" && collapsed.has(node.id)) {
        return { ...node, hidden: false, width: 320, height: 72, style: { width: 320, height: 72 }, zIndex: 0 } as Node;
      }
      return { ...node, hidden, zIndex: node.type === "group" ? 0 : 2 } as Node;
    });
}

export function flowEdges(
  edges: ScatterEdge[],
  nodes: ScatterNode[],
  collapsedGroupIds: string[],
  selectedNodeId: string | null,
  hoveredNodeId: string | null,
  connectionPreview: ConnectionHoverTarget | null
): Edge[] {
  const activeNodeIds = new Set([selectedNodeId, hoveredNodeId, connectionPreview?.sourceId, connectionPreview?.targetId].filter(Boolean) as string[]);
  const collapsed = new Set(collapsedGroupIds);
  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const bundles = new Map<string, { source: string; target: string; edges: ScatterEdge[] }>();
  for (const edge of edges) {
    const sourceNode = nodeById.get(edge.source);
    const targetNode = nodeById.get(edge.target);
    const source = sourceNode?.type !== "group" && sourceNode?.parentId && collapsed.has(sourceNode.parentId) ? sourceNode.parentId : edge.source;
    const target = targetNode?.type !== "group" && targetNode?.parentId && collapsed.has(targetNode.parentId) ? targetNode.parentId : edge.target;
    if (source === target) continue;
    const key = `${source}\u0000${target}`;
    const bundle = bundles.get(key) ?? { source, target, edges: [] };
    bundle.edges.push(edge);
    bundles.set(key, bundle);
  }
  const renderedEdges = [...bundles.values()].map((bundle) => {
    const synthetic = bundle.edges.length > 1 || bundle.edges[0].source !== bundle.source || bundle.edges[0].target !== bundle.target;
    return {
      ...(synthetic ? { id: `${aggregateEdgePrefix}:${bundle.source}:${bundle.target}` } : bundle.edges[0]),
      source: bundle.source,
      target: bundle.target,
      type: "scatter",
      selectable: !synthetic,
      data: { active: activeNodeIds.has(bundle.source) || activeNodeIds.has(bundle.target), aggregate: synthetic, count: bundle.edges.length }
    } as Edge;
  });
  if (connectionPreview) {
    renderedEdges.push({
      id: connectionPreviewEdgeId,
      source: connectionPreview.sourceId,
      target: connectionPreview.targetId,
      type: "scatter",
      selectable: false,
      data: { active: true }
    } as Edge);
  }
  return renderedEdges;
}

export function storeEdges(edges: Edge[]): ScatterEdge[] {
  return edges
    .filter((edge) => edge.id !== connectionPreviewEdgeId && !edge.id.startsWith(aggregateEdgePrefix))
    .map(({ id, source, target, label }) => ({ id, source, target, label: typeof label === "string" ? label : undefined }));
}
