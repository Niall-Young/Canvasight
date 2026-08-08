import type { ScatterEdge, ScatterNode } from "../../shared/types";

export type CanvasClipboardPayload = {
  kind: "canvasight.nodes";
  version: 1;
  nodes: ScatterNode[];
  edges: ScatterEdge[];
  copiedAt: string;
};

export function cloneNodeForClipboard(node: ScatterNode): ScatterNode {
  if (node.type === "task") {
    return { ...node, position: { ...node.position }, data: { ...node.data, attachments: node.data.attachments.map((attachment) => ({ ...attachment })) } };
  }
  if (node.type === "asset") return { ...node, position: { ...node.position }, data: { ...node.data, asset: { ...node.data.asset } } };
  return { ...node, position: { ...node.position }, data: { ...node.data } };
}

export function cloneEdgeForClipboard(edge: ScatterEdge): ScatterEdge {
  return { ...edge };
}

function isScatterNode(value: unknown): value is ScatterNode {
  if (!value || typeof value !== "object") return false;
  const node = value as ScatterNode;
  return typeof node.id === "string"
    && (node.type === "task" || node.type === "asset" || node.type === "group")
    && Boolean(node.position)
    && typeof node.position.x === "number"
    && typeof node.position.y === "number"
    && Boolean(node.data)
    && typeof node.data.title === "string"
    && (node.type === "task"
      ? typeof node.data.body === "string" && Array.isArray(node.data.attachments)
      : node.type === "asset"
        ? typeof node.data.description === "string" && Boolean(node.data.asset)
        : typeof node.data.description === "string");
}

function isScatterEdge(value: unknown): value is ScatterEdge {
  if (!value || typeof value !== "object") return false;
  const edge = value as ScatterEdge;
  return typeof edge.id === "string" && typeof edge.source === "string" && typeof edge.target === "string";
}

export function parseCanvasClipboardPayload(text: string): CanvasClipboardPayload | null {
  if (!text.trim()) return null;
  try {
    const parsed = JSON.parse(text) as Partial<CanvasClipboardPayload>;
    if (parsed.kind !== "canvasight.nodes"
      || parsed.version !== 1
      || !Array.isArray(parsed.nodes)
      || !Array.isArray(parsed.edges)
      || !parsed.nodes.every(isScatterNode)
      || !parsed.edges.every(isScatterEdge)) return null;
    return {
      kind: "canvasight.nodes",
      version: 1,
      copiedAt: typeof parsed.copiedAt === "string" ? parsed.copiedAt : new Date().toISOString(),
      nodes: parsed.nodes.map(cloneNodeForClipboard),
      edges: parsed.edges.map(cloneEdgeForClipboard)
    };
  } catch {
    return null;
  }
}
