import { nanoid } from "nanoid";
import type { Attachment, ScatterEdge, ScatterNode } from "../../shared/types";
import {
  assetNodeHeight,
  assetNodeWidth,
  findConnectionDropPosition,
  findOpenPositionToLeft,
  findOpenPositionToRight,
  isConnectionAllowed,
  nodeBounds,
  taskNodeHeight,
  taskNodeHorizontalGap,
  taskNodeWidth,
  type FlowPosition
} from "./canvasGraph";
import { assetNodeFromAttachment, emptyNode } from "./canvasNodes";

export type ConnectedNodeKind = "task" | "file" | "media";
export type ConnectedNodeSide = "left" | "right";

export interface ConnectedNodePlacementRequest {
  nodeId: string;
  side: ConnectedNodeSide;
  dropPosition?: FlowPosition;
}

export interface ConnectedNodeCandidate {
  node: ScatterNode;
  edge: ScatterEdge;
}

export function buildConnectedNodeCandidate(
  request: ConnectedNodePlacementRequest,
  kind: ConnectedNodeKind,
  attachment: Attachment | undefined,
  nodes: ScatterNode[],
  edges: ScatterEdge[]
): ConnectedNodeCandidate | null {
  const source = nodes.find((node) => node.id === request.nodeId && node.type !== "group");
  if (!source) return null;
  const size = kind === "task"
    ? { width: taskNodeWidth, height: taskNodeHeight }
    : { width: assetNodeWidth, height: assetNodeHeight };
  const sourceBounds = nodeBounds(source);
  const position = request.dropPosition
    ? findConnectionDropPosition(request.dropPosition, request.side === "right" ? "source" : "target", source, nodes, size)
    : request.side === "right"
      ? findOpenPositionToRight({
          x: source.position.x + sourceBounds.width + taskNodeHorizontalGap,
          y: source.position.y
        }, nodes, size)
      : findOpenPositionToLeft({
          x: source.position.x - size.width - taskNodeHorizontalGap,
          y: source.position.y
        }, nodes, size);
  const node = kind === "task"
    ? emptyNode(position, nodes.length)
    : attachment
      ? assetNodeFromAttachment(attachment, position)
      : null;
  if (!node) return null;
  const edge = request.side === "right"
    ? { id: nanoid(), source: source.id, target: node.id }
    : { id: nanoid(), source: node.id, target: source.id };
  return isConnectionAllowed(edge, edges, [...nodes, node]) ? { node, edge } : null;
}
