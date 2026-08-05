import { BaseEdge, EdgeLabelRenderer, getBezierPath, type EdgeProps } from "@xyflow/react";
import type { ReactElement } from "react";

function EdgeCap({ className, side, x, y }: { className: string; side: "left" | "right"; x: number; y: number }): ReactElement {
  const top = y - 10;

  if (side === "left") {
    const left = x - 4;
    return (
      <path
        className={className}
        d={`M ${left + 4} ${top} L ${left + 4} ${top + 20} L ${left + 2} ${top + 20} Q ${left} ${top + 20} ${left} ${top + 18} L ${left} ${top + 2} Q ${left} ${top} ${left + 2} ${top} Z`}
      />
    );
  }

  const left = x;
  return (
    <path
      className={className}
      d={`M ${left} ${top} L ${left + 2} ${top} Q ${left + 4} ${top} ${left + 4} ${top + 2} L ${left + 4} ${top + 18} Q ${left + 4} ${top + 20} ${left + 2} ${top + 20} L ${left} ${top + 20} Z`}
    />
  );
}

function capSide(position: unknown): "left" | "right" {
  return String(position).toLowerCase() === "left" ? "left" : "right";
}

function nodeEdgeX(x: number, position: unknown): number {
  return capSide(position) === "left" ? x - 10 : x + 10;
}

export function ScatterEdge({
  data,
  id,
  markerEnd,
  selected,
  sourcePosition,
  sourceX,
  sourceY,
  targetPosition,
  targetX,
  targetY
}: EdgeProps): ReactElement {
  const sourceEdgeX = nodeEdgeX(sourceX, sourcePosition);
  const targetEdgeX = nodeEdgeX(targetX, targetPosition);
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX: sourceEdgeX,
    sourceY,
    sourcePosition,
    targetX: targetEdgeX,
    targetY,
    targetPosition,
    curvature: 0.45
  });
  const edgeData = data as { active?: boolean; aggregate?: boolean; count?: number } | undefined;
  const isActive = Boolean(edgeData?.active);
  const isAggregate = Boolean(edgeData?.aggregate);
  const count = Math.max(1, edgeData?.count ?? 1);
  const stateClass = selected ? "is-selected" : isActive ? "is-active" : "";
  const edgeClassName = `scatter-edge-path ${isAggregate ? "is-aggregate" : ""} ${stateClass}`.trim();
  const capClassName = `scatter-edge-cap ${stateClass}`.trim();

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        className={edgeClassName}
        interactionWidth={20}
      />
      <EdgeCap className={capClassName} side={capSide(sourcePosition)} x={sourceEdgeX} y={sourceY} />
      <EdgeCap className={capClassName} side={capSide(targetPosition)} x={targetEdgeX} y={targetY} />
      {isAggregate && count > 1 ? (
        <EdgeLabelRenderer>
          <span className="scatter-edge-count nodrag nopan" title={`${count} hidden connections`} style={{ transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)` }}>
            ×{count}
          </span>
        </EdgeLabelRenderer>
      ) : null}
    </>
  );
}
