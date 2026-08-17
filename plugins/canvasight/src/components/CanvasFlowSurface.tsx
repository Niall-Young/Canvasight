import { memo, type ReactElement } from "react";
import {
  Background,
  PanOnScrollMode,
  ReactFlow,
  getBezierPath,
  Position,
  type ConnectionLineComponentProps,
  type Edge,
  type EdgeTypes,
  type Node,
  type NodeTypes,
  type ReactFlowProps
} from "@xyflow/react";
import { useRenderCommitMetric } from "../lib/renderMetrics";
import { AssetNode } from "./AssetNode";
import { GroupNode } from "./GroupNode";
import { ScatterEdge as ScatterFlowEdge } from "./ScatterEdge";
import { TaskNode } from "./TaskNode";

const nodeTypes = { task: TaskNode, asset: AssetNode, group: GroupNode } as NodeTypes;
const edgeTypes = { scatter: ScatterFlowEdge } satisfies EdgeTypes;
const defaultEdgeOptions = { type: "scatter" };
const proOptions = { hideAttribution: true };
const canvasMinZoom = 0.2;
const canvasMaxZoom = 2;
const nodeConnectButtonSize = 20;

type FlowProp =
  | "defaultViewport"
  | "edges"
  | "isValidConnection"
  | "nodes"
  | "onConnect"
  | "onConnectEnd"
  | "onConnectStart"
  | "onEdgeClick"
  | "onEdgesChange"
  | "onInit"
  | "onMove"
  | "onMoveEnd"
  | "onMoveStart"
  | "onNodeClick"
  | "onNodeDragStart"
  | "onNodeDragStop"
  | "onNodeMouseEnter"
  | "onNodeMouseLeave"
  | "onNodesChange"
  | "onPaneClick";

export type CanvasFlowSurfaceProps = Pick<ReactFlowProps<Node, Edge>, FlowProp> & {
  panModeActive: boolean;
};

function connectionLineStartX(x: number, position: Position): number {
  const offset = nodeConnectButtonSize / 2;
  if (position === Position.Left) return x - offset;
  if (position === Position.Right) return x + offset;
  return x;
}

function ScatterConnectionLine({
  connectionLineStyle,
  fromPosition,
  fromX,
  fromY,
  toPosition,
  toX,
  toY
}: ConnectionLineComponentProps): ReactElement {
  const [path] = getBezierPath({
    sourceX: connectionLineStartX(fromX, fromPosition),
    sourceY: fromY,
    sourcePosition: fromPosition,
    targetX: toX,
    targetY: toY,
    targetPosition: toPosition,
    curvature: 0.45
  });

  return <path className="scatter-connection-path" d={path} style={connectionLineStyle} />;
}

function CanvasFlowSurfaceComponent({ panModeActive, ...props }: CanvasFlowSurfaceProps): ReactElement {
  useRenderCommitMetric("canvasFlow");
  return (
    <ReactFlow
      {...props}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      connectionLineComponent={ScatterConnectionLine}
      defaultEdgeOptions={defaultEdgeOptions}
      proOptions={proOptions}
      minZoom={canvasMinZoom}
      maxZoom={canvasMaxZoom}
      connectOnClick={false}
      deleteKeyCode={null}
      disableKeyboardA11y
      nodesDraggable={!panModeActive}
      panActivationKeyCode={null}
      panOnDrag={panModeActive}
      panOnScroll
      panOnScrollMode={PanOnScrollMode.Free}
      selectionKeyCode={null}
      selectionOnDrag={!panModeActive}
      zoomActivationKeyCode="Meta"
      zoomOnDoubleClick={false}
      zoomOnPinch
      zoomOnScroll={false}
    >
      <Background gap={28} size={1} color="rgba(125, 125, 125, 0.22)" />
    </ReactFlow>
  );
}

export const CanvasFlowSurface = memo(CanvasFlowSurfaceComponent);
CanvasFlowSurface.displayName = "CanvasFlowSurface";
