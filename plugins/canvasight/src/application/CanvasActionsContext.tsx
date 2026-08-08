import { createContext, useContext, type ReactNode } from "react";
import type { RunMode, ScatterNodeData } from "../../shared/types";
import type { SkillSummary } from "../lib/canvasightApi";
import type { FlowPosition } from "../domain/canvasGraph";
import type { ConnectedNodeKind, ConnectedNodeSide } from "../domain/connectedNodeCreation";

export type { ConnectedNodeKind, ConnectedNodeSide } from "../domain/connectedNodeCreation";

export interface ConnectedNodeMenuAnchor {
  clientX: number;
  clientY: number;
  focusTarget?: HTMLButtonElement;
}

export interface ConnectedNodeMenuRequest {
  id: string;
  nodeId: string;
  side: ConnectedNodeSide;
  anchor: ConnectedNodeMenuAnchor;
  dropPosition?: FlowPosition;
  projectPath: string;
}

export interface CanvasActions {
  updateNodeData: (nodeId: string, patch: Partial<ScatterNodeData>) => void;
  beginNodeEdit: () => void;
  commitNodeEdit: () => void;
  removeAttachment: (nodeId: string, attachmentId: string) => void;
  promoteAttachment: (nodeId: string, attachmentId: string) => void;
  replaceAsset: (nodeId: string) => void;
  activeConnectedNodeMenu: { nodeId: string; side: ConnectedNodeSide } | null;
  requestConnectedNodeMenu: (nodeId: string, side: ConnectedNodeSide, anchor: ConnectedNodeMenuAnchor) => void;
  duplicateNode: (nodeId: string) => void;
  saveNodeAsTemplate: (nodeId: string, data: ScatterNodeData) => Promise<void>;
  deleteNode: (nodeId: string) => void;
  setNodeHover: (nodeId: string, hovered: boolean) => void;
  runNode: (nodeId: string, mode: RunMode) => Promise<void>;
  toggleGroup: (groupId: string) => void;
  ungroupNode: (nodeId: string) => void;
  fitGroup: (groupId: string) => void;
  listSkills: (forceReload?: boolean) => Promise<SkillSummary[]>;
}

const CanvasActionsContext = createContext<CanvasActions | null>(null);

export function CanvasActionsProvider({ actions, children }: { actions: CanvasActions; children: ReactNode }) {
  return <CanvasActionsContext.Provider value={actions}>{children}</CanvasActionsContext.Provider>;
}

export function useCanvasActions(): CanvasActions {
  const actions = useContext(CanvasActionsContext);
  if (!actions) throw new Error("Canvas actions are unavailable outside the active workspace.");
  return actions;
}
