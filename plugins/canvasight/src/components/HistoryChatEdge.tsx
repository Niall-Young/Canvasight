import { useState, type ReactElement } from "react";
import { BaseEdge, EdgeLabelRenderer, getBezierPath, type Edge, type EdgeProps } from "@xyflow/react";

interface HistoryChatActivity {
  taskId: string;
  turnId: string;
  status: string;
  summary: string;
}

interface HistoryChatEdgeData extends Record<string, unknown> {
  chats: HistoryChatActivity[];
  language: "zh" | "en";
}

export type HistoryChatFlowEdge = Edge<HistoryChatEdgeData, "historyChat">;

export function HistoryChatEdge(props: EdgeProps<HistoryChatFlowEdge>): ReactElement {
  const [expanded, setExpanded] = useState(false);
  const [edgePath, labelX, labelY] = getBezierPath(props);
  const chats = props.data?.chats ?? [];
  const zh = props.data?.language !== "en";
  return <>
    <BaseEdge id={props.id} path={edgePath} markerEnd={props.markerEnd} />
    {chats.length ? <EdgeLabelRenderer><div className="history-chat-edge-label nodrag nopan" style={{ transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)` }}><button type="button" aria-expanded={expanded} onClick={() => setExpanded((value) => !value)}>{zh ? `仅聊天 · ${chats.length} 轮` : `Chat only · ${chats.length} ${chats.length === 1 ? "turn" : "turns"}`}</button>{expanded ? <div className="history-chat-edge-popover" role="list">{chats.map((chat) => <button type="button" role="listitem" key={`${chat.taskId}:${chat.turnId}`} onClick={() => window.dispatchEvent(new CustomEvent("canvasight-history-chat", { detail: chat }))}><strong>{chat.summary}</strong><span>{chat.status} · {chat.turnId.slice(-8)}</span></button>)}</div> : null}</div></EdgeLabelRenderer> : null}
  </>;
}
