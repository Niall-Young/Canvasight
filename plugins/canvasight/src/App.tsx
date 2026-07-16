import { useCallback, useEffect, useMemo, useRef, useState, type DragEvent, type ReactElement } from "react";
import * as RadixDropdownMenu from "@radix-ui/react-dropdown-menu";
import {
  Background,
  PanOnScrollMode,
  ReactFlow,
  ReactFlowProvider,
  applyEdgeChanges,
  applyNodeChanges,
  getBezierPath,
  Position,
  type Connection,
  type ConnectionLineComponentProps,
  type Edge,
  type EdgeChange,
  type EdgeTypes,
  type Node,
  type NodeChange,
  type NodeTypes,
  type OnConnectEnd,
  type OnConnectStart,
  type OnMove,
  type ReactFlowInstance
} from "@xyflow/react";
import { nanoid } from "nanoid";
import {
  defaultAppSettings,
  nodeTemplateLimit,
  type AppSettings,
  type AttachmentInput,
  type NodeTemplate,
  type NodeTemplateInput,
  type RunMode,
  type ScatterDocument,
  type ScatterEdge,
  type ScatterNode,
  type ScatterNodeData,
  type ScatterPage,
  type ScatterProjectInfo
} from "../shared/types";
import {
  canvasightApi,
  getCanvasightBindingKey,
  getCanvasightStartupIdentity,
  isNativeWidgetShell,
  isCanvasightBindingCurrent,
  isStaleDocumentError,
  isTemplateLimitError,
  isThreadOnlyFallbackUrl,
  projectPathFromUrl,
  setCanvasightStartupStage,
  threadIdFromUrl,
  type CanvasightStartupStage
} from "./lib/canvasightApi";
import { buildMarkdown } from "./lib/markdown";
import { I18nProvider, useI18n } from "./lib/i18n";
import { shortcuts } from "./lib/shortcuts";
import { ConfirmDialog } from "./components/ConfirmDialog";
import { CanvasightErrorBoundary } from "./components/CanvasightErrorBoundary";
import { ScatterEdge as ScatterFlowEdge } from "./components/ScatterEdge";
import { RightDrawer } from "./components/RightDrawer";
import { SettingsDialog } from "./components/SettingsDialog";
import { TaskNode, setTaskNodeActions } from "./components/TaskNode";
import { StartupFailurePanel } from "./components/StartupFailurePanel";
import { WorkspaceStartupSkeleton } from "./components/WorkspaceStartupSkeleton";
import { DropdownMenu, DropdownMenuItem } from "./components/ui/dropdown-menu";
import { Icon } from "./components/ui/icon";
import { IconButton } from "./components/ui/icon-button";
import { TooltipAnchor } from "./components/ui/tooltip";
import { Toast, ToastViewport, type ToastTone } from "./components/ui/toast";
import { useScatterStore } from "./store/scatterStore";
import "@xyflow/react/dist/style.css";
import "./styles/app.css";

const nodeTypes = { task: TaskNode } satisfies NodeTypes;
const edgeTypes = { scatter: ScatterFlowEdge } satisfies EdgeTypes;
const defaultEdgeOptions = { type: "scatter" };
const proOptions = { hideAttribution: true };
const saveDebounceMs = 450;
const canvasMinZoom = 0.2;
const canvasMaxZoom = 2;
const taskNodeWidth = 400;
const taskNodeHeight = 220;
const taskNodeHorizontalGap = 180;
const taskNodeVerticalGap = 72;
const nodeConnectButtonSize = 20;
const connectionPreviewEdgeId = "__canvasight-connection-preview__";
const canvasClipboardMime = "application/x-canvasight-nodes";
const templateDragMime = "application/x-canvasight-template";
const appSettingsStorageKey = "canvasight.settings";
const webDefaultAppSettings = {
  ...defaultAppSettings,
  translucentBackground: false
} satisfies AppSettings;
const zoomOptions = [
  { label: "50%", value: 0.5 },
  { label: "75%", value: 0.75 },
  { label: "100%", value: 1 },
  { label: "150%", value: 1.5 },
  { label: "200%", value: 2 }
];

type FlowPosition = { x: number; y: number };
type MeasuredScatterNode = ScatterNode & { measured?: { width?: number; height?: number } };
type CanvasTool = "select" | "pan";

function isThreadStoreModePreflightFailure(message: string): boolean {
  return (
    /Canvasight Run blocked before sendMessage/i.test(message) &&
    /failed to read thread|thread-store internal error|rollout does not start with session metadata/i.test(message)
  );
}
type ConnectionStart = {
  nodeId: string;
  handleType: "source" | "target";
};
type ConnectionHoverTarget = {
  sourceId: string;
  targetId: string;
  hoveredNodeId: string;
};
type CanvasClipboardPayload = {
  kind: "canvasight.nodes";
  version: 1;
  nodes: ScatterNode[];
  edges: ScatterEdge[];
  copiedAt: string;
};
type CanvasightWorkspaceProps = {
  agentTeamEnabled: boolean;
  onOpenSettings: () => void;
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

function projectNameFromPath(projectPath: string): string {
  return projectPath.split(/[\\/]/).filter(Boolean).at(-1) || "Canvasight Project";
}

function emptyPage(index = 0, name = `Page ${index + 1}`): ScatterPage {
  const now = new Date().toISOString();
  return {
    id: nanoid(),
    name,
    createdAt: now,
    updatedAt: now,
    viewport: { x: 0, y: 0, zoom: 1 },
    nodes: [],
    edges: []
  };
}

function defaultProjectPathFromBrowser(): string {
  return import.meta.env.VITE_CANVASIGHT_DEFAULT_PROJECT_PATH?.trim() || "";
}

function emptyDocument(projectPath: string): ScatterDocument {
  const page = emptyPage(0);
  return {
    version: 1,
    projectName: projectNameFromPath(projectPath),
    updatedAt: new Date().toISOString(),
    activePageId: page.id,
    pages: [page],
    viewport: page.viewport,
    nodes: page.nodes,
    edges: page.edges
  };
}

function roundPosition(position: FlowPosition): FlowPosition {
  return {
    x: Math.round(position.x),
    y: Math.round(position.y)
  };
}

function eventClientPosition(event: MouseEvent | TouchEvent): FlowPosition | null {
  if ("changedTouches" in event) {
    const touch = event.changedTouches[0];
    return touch ? { x: touch.clientX, y: touch.clientY } : null;
  }

  return { x: event.clientX, y: event.clientY };
}

function nodeIdFromConnectionEvent(event: MouseEvent | TouchEvent): string | null {
  const clientPosition = eventClientPosition(event);
  const pointTarget = clientPosition ? document.elementFromPoint(clientPosition.x, clientPosition.y) : null;
  const eventTarget = event.target instanceof Element ? event.target : null;

  for (const target of [pointTarget, eventTarget]) {
    const nodeElement = target?.closest(".react-flow__node[data-id]");
    const nodeId = nodeElement?.getAttribute("data-id");
    if (nodeId) return nodeId;
  }

  return null;
}

function nodeIdFromElementTarget(target: EventTarget | null): string | null {
  if (!(target instanceof Element)) return null;
  return target.closest(".react-flow__node[data-id]")?.getAttribute("data-id") ?? null;
}

function nodeBounds(node: ScatterNode): { width: number; height: number } {
  const measured = (node as MeasuredScatterNode).measured;

  return {
    width: node.width ?? measured?.width ?? taskNodeWidth,
    height: node.height ?? measured?.height ?? taskNodeHeight
  };
}

function positionOverlapsNode(position: FlowPosition, node: ScatterNode): boolean {
  const margin = 32;
  const bounds = nodeBounds(node);
  const left = position.x;
  const right = position.x + taskNodeWidth;
  const top = position.y;
  const bottom = position.y + taskNodeHeight;
  const nodeLeft = node.position.x - margin;
  const nodeRight = node.position.x + bounds.width + margin;
  const nodeTop = node.position.y - margin;
  const nodeBottom = node.position.y + bounds.height + margin;

  return left < nodeRight && right > nodeLeft && top < nodeBottom && bottom > nodeTop;
}

function positionIntersectsNode(position: FlowPosition, node: ScatterNode): boolean {
  const bounds = nodeBounds(node);
  const left = position.x;
  const right = position.x + taskNodeWidth;
  const top = position.y;
  const bottom = position.y + taskNodeHeight;
  const nodeLeft = node.position.x;
  const nodeRight = node.position.x + bounds.width;
  const nodeTop = node.position.y;
  const nodeBottom = node.position.y + bounds.height;

  return left < nodeRight && right > nodeLeft && top < nodeBottom && bottom > nodeTop;
}

function isOpenPosition(position: FlowPosition, nodes: ScatterNode[]): boolean {
  return nodes.every((node) => !positionOverlapsNode(position, node));
}

function isConnectionDropPositionOpen(position: FlowPosition, nodes: ScatterNode[]): boolean {
  return nodes.every((node) => !positionIntersectsNode(position, node));
}

function findConnectionDropPosition(dropPosition: FlowPosition, handleType: ConnectionStart["handleType"], sourceNode: ScatterNode, nodes: ScatterNode[]): FlowPosition {
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
  if (isConnectionDropPositionOpen(directionAdjusted, nodes)) return directionAdjusted;

  const offsets = [0, 48, -48, 96, -96, 144, -144, 192, -192, 240, -240, 288, -288];
  for (const yOffset of offsets) {
    const candidate = roundPosition({ x: directionAdjusted.x, y: directionAdjusted.y + yOffset });
    if (isConnectionDropPositionOpen(candidate, nodes)) return candidate;
  }

  for (const xOffset of offsets.slice(1)) {
    for (const yOffset of offsets) {
      const candidate = roundPosition({ x: directionAdjusted.x + xOffset, y: directionAdjusted.y + yOffset });
      if (isConnectionDropPositionOpen(candidate, nodes)) return candidate;
    }
  }

  return directionAdjusted;
}

function findOpenPositionNear(preferred: FlowPosition, nodes: ScatterNode[]): FlowPosition {
  const base = roundPosition(preferred);
  if (isOpenPosition(base, nodes)) return base;

  const stepX = taskNodeWidth + taskNodeHorizontalGap;
  const stepY = taskNodeHeight + taskNodeVerticalGap;
  for (let ring = 1; ring <= 6; ring += 1) {
    for (let column = -ring; column <= ring; column += 1) {
      for (let row = -ring; row <= ring; row += 1) {
        if (Math.abs(column) !== ring && Math.abs(row) !== ring) continue;
        const candidate = roundPosition({
          x: preferred.x + column * stepX,
          y: preferred.y + row * stepY
        });
        if (isOpenPosition(candidate, nodes)) return candidate;
      }
    }
  }

  return base;
}

function findOpenPositionToRight(preferred: FlowPosition, nodes: ScatterNode[]): FlowPosition {
  const base = roundPosition(preferred);
  if (isOpenPosition(base, nodes)) return base;

  const stepX = taskNodeWidth + taskNodeHorizontalGap;
  const stepY = taskNodeHeight + taskNodeVerticalGap;
  const rowOffsets = [0, 1, -1, 2, -2, 3, -3, 4, -4];
  for (let column = 0; column <= 4; column += 1) {
    for (const row of rowOffsets) {
      const candidate = roundPosition({ x: preferred.x + column * stepX, y: preferred.y + row * stepY });
      if (isOpenPosition(candidate, nodes)) return candidate;
    }
  }

  return base;
}

function findOpenPositionToLeft(preferred: FlowPosition, nodes: ScatterNode[]): FlowPosition {
  const base = roundPosition(preferred);
  if (isOpenPosition(base, nodes)) return base;

  const stepX = taskNodeWidth + taskNodeHorizontalGap;
  const stepY = taskNodeHeight + taskNodeVerticalGap;
  const rowOffsets = [0, 1, -1, 2, -2, 3, -3, 4, -4];
  for (let column = 0; column <= 4; column += 1) {
    for (const row of rowOffsets) {
      const candidate = roundPosition({ x: preferred.x - column * stepX, y: preferred.y + row * stepY });
      if (isOpenPosition(candidate, nodes)) return candidate;
    }
  }

  return base;
}

function connectionFromStart(connectionStart: ConnectionStart, targetNodeId: string): Pick<ScatterEdge, "source" | "target"> | null {
  if (connectionStart.nodeId === targetNodeId) return null;

  return connectionStart.handleType === "source"
    ? { source: connectionStart.nodeId, target: targetNodeId }
    : { source: targetNodeId, target: connectionStart.nodeId };
}

function isConnectionAllowed(connection: Pick<ScatterEdge, "source" | "target">, edges: ScatterEdge[]): boolean {
  if (!connection.source || !connection.target || connection.source === connection.target) return false;
  if (edges.some((edge) => edge.source === connection.source && edge.target === connection.target)) return false;
  if (edges.some((edge) => edge.target === connection.target)) return false;
  return true;
}

function isEditableTarget(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    (target instanceof HTMLElement && target.isContentEditable)
  );
}

function normalizeAppSettings(value: Partial<AppSettings> | null | undefined): AppSettings {
  return {
    ...webDefaultAppSettings,
    themePreference: value?.themePreference ?? webDefaultAppSettings.themePreference,
    language: value?.language ?? webDefaultAppSettings.language,
    assistantProvider: value?.assistantProvider ?? webDefaultAppSettings.assistantProvider,
    assistantProviderOnboardingCompleted:
      value?.assistantProviderOnboardingCompleted ?? webDefaultAppSettings.assistantProviderOnboardingCompleted,
    agentTeamEnabled: value?.agentTeamEnabled === true,
    aiSkillAssignmentEnabled: value?.aiSkillAssignmentEnabled === true,
    translucentBackground: false
  };
}

function settingsEqual(left: AppSettings | null | undefined, right: AppSettings): boolean {
  return Boolean(
    left &&
      left.themePreference === right.themePreference &&
      left.language === right.language &&
      left.translucentBackground === right.translucentBackground &&
      left.assistantProvider === right.assistantProvider &&
      left.assistantProviderOnboardingCompleted === right.assistantProviderOnboardingCompleted &&
      left.agentTeamEnabled === right.agentTeamEnabled &&
      left.aiSkillAssignmentEnabled === right.aiSkillAssignmentEnabled
  );
}

function loadStoredAppSettings(): AppSettings | null {
  try {
    const raw = window.localStorage.getItem(appSettingsStorageKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<AppSettings> & { codexModel?: unknown };
    const normalized = normalizeAppSettings(parsed);
    if ("codexModel" in parsed) saveStoredAppSettings(normalized);
    return normalized;
  } catch {
    return null;
  }
}

function saveStoredAppSettings(settings: AppSettings): void {
  window.localStorage.setItem(appSettingsStorageKey, JSON.stringify(settings));
}

function emptyNode(position: { x: number; y: number }, index: number): ScatterNode {
  return {
    id: nanoid(),
    type: "task",
    position,
    selected: true,
    data: {
      title: `新建任务 ${index + 1}`,
      body: "",
      attachments: [],
      effort: "xhigh",
      runMode: "flow"
    }
  };
}

function nodeFromTemplate(template: NodeTemplate, position: { x: number; y: number }, index: number): ScatterNode {
  const body = template.body.trim();
  return {
    id: nanoid(),
    type: "task",
    position,
    selected: true,
    data: {
      title: template.title.trim() || body.slice(0, 40) || `新建任务 ${index + 1}`,
      body,
      attachments: template.attachments.map((attachment) => ({ ...attachment })),
      effort: "xhigh",
      runMode: "flow"
    }
  };
}

function setTemplateDragImage(event: DragEvent<HTMLElement>, template: NodeTemplate): void {
  const dragImage = document.createElement("div");
  const title = document.createElement("strong");
  const body = document.createElement("span");
  dragImage.className = "template-drag-image";
  title.textContent = template.title.trim() || "Template";
  body.textContent = template.body.replace(/\s+/g, " ").trim();
  dragImage.append(title, body);
  document.body.appendChild(dragImage);
  event.dataTransfer.setDragImage(dragImage, 18, 18);
  window.setTimeout(() => dragImage.remove(), 0);
}

function normalizeViewport(value: unknown): ScatterDocument["viewport"] {
  const viewport = value && typeof value === "object" ? (value as Partial<ScatterDocument["viewport"]>) : {};
  return {
    x: typeof viewport.x === "number" && Number.isFinite(viewport.x) ? viewport.x : 0,
    y: typeof viewport.y === "number" && Number.isFinite(viewport.y) ? viewport.y : 0,
    zoom: typeof viewport.zoom === "number" && Number.isFinite(viewport.zoom) ? viewport.zoom : 1
  };
}

function normalizePageNodes(nodes: unknown): ScatterNode[] {
  return Array.isArray(nodes)
      ? nodes.map((node) => {
        const { codexMode: _codexMode, planMode: _planMode, ...nodeData } = node.data || {};
        return {
          ...node,
          type: "task",
          selected: false,
          data: {
            ...nodeData,
            title: typeof nodeData.title === "string" ? nodeData.title : "",
            body: typeof nodeData.body === "string" ? nodeData.body : "",
            attachments: nodeData.attachments || [],
            effort: nodeData.effort || "xhigh",
            runMode: nodeData.runMode || "flow"
          }
        } satisfies ScatterNode;
      })
    : [];
}

function normalizePageEdges(edges: unknown): ScatterEdge[] {
  return Array.isArray(edges) ? edges : [];
}

function normalizePage(page: Partial<ScatterPage>, index: number, fallback?: Partial<ScatterPage>): ScatterPage {
  const now = new Date().toISOString();
  return {
    id: typeof page.id === "string" && page.id ? page.id : fallback?.id || nanoid(),
    name: typeof page.name === "string" && page.name.trim() ? page.name.trim() : fallback?.name || `Page ${index + 1}`,
    createdAt: typeof page.createdAt === "string" && page.createdAt ? page.createdAt : fallback?.createdAt || now,
    updatedAt: typeof page.updatedAt === "string" && page.updatedAt ? page.updatedAt : fallback?.updatedAt || now,
    viewport: normalizeViewport(page.viewport || fallback?.viewport),
    nodes: normalizePageNodes(page.nodes || fallback?.nodes),
    edges: normalizePageEdges(page.edges || fallback?.edges)
  };
}

function normalizeDocument(projectPath: string, document: Partial<ScatterDocument>): ScatterDocument {
  const fallback = emptyDocument(projectPath);
  const legacyFallback: Partial<ScatterPage> = {
    id: document.activePageId,
    name: "Page 1",
    updatedAt: document.updatedAt,
    viewport: document.viewport,
    nodes: document.nodes,
    edges: document.edges
  };
  const pages =
    Array.isArray(document.pages) && document.pages.length > 0
      ? document.pages.map((page, index) => normalizePage(page, index, index === 0 ? legacyFallback : undefined))
      : [normalizePage({}, 0, legacyFallback)];
  const activePageId =
    typeof document.activePageId === "string" && pages.some((page) => page.id === document.activePageId) ? document.activePageId : pages[0].id;
  const activePage = pages.find((page) => page.id === activePageId) ?? pages[0];

  return {
    ...fallback,
    ...document,
    projectName: document.projectName || fallback.projectName,
    updatedAt: document.updatedAt || fallback.updatedAt,
    activePageId,
    pages,
    viewport: activePage.viewport,
    nodes: activePage.nodes,
    edges: activePage.edges
  };
}

function toDocument(project: ScatterProjectInfo, pages: ScatterPage[], activePageId: string | null, nodes: ScatterNode[], edges: ScatterEdge[]): ScatterDocument {
  const now = new Date().toISOString();
  const sourcePages = pages.length ? pages : [emptyPage(0)];
  const currentPageId = activePageId && sourcePages.some((page) => page.id === activePageId) ? activePageId : sourcePages[0].id;
  const serializedPages = sourcePages.map((page) => {
    const pageNodes = page.id === currentPageId ? nodes : page.nodes;
    const pageEdges = page.id === currentPageId ? edges : page.edges;
    return {
      ...page,
      updatedAt: page.id === currentPageId ? now : page.updatedAt,
      nodes: pageNodes.map((node) => ({ ...node, selected: false })),
      edges: pageEdges.map(({ id, source, target, label }) => ({ id, source, target, label }))
    };
  });
  const activePage = serializedPages.find((page) => page.id === currentPageId) ?? serializedPages[0];

  return {
    version: 1,
    projectName: project.name,
    updatedAt: now,
    activePageId: currentPageId,
    pages: serializedPages,
    viewport: activePage.viewport,
    nodes: activePage.nodes,
    edges: activePage.edges
  };
}

function sameDocumentValue(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

function rebaseLocalChangesAfterSave(
  projectPath: string,
  sentDocument: ScatterDocument,
  latestLocalDocument: ScatterDocument,
  savedDocument: ScatterDocument,
  merge: import("../shared/types").SaveDocumentResult["merge"]
): ScatterDocument {
  const pages = savedDocument.pages.map((page) => ({ ...page, nodes: [...page.nodes], edges: [...page.edges] }));
  const sentPages = new Map(sentDocument.pages.map((page) => [page.id, page]));
  const latestPages = new Map(latestLocalDocument.pages.map((page) => [page.id, page]));
  const conflictBySource = new Map((merge?.conflictCopies ?? []).map((copy) => [copy.sourcePageId, copy]));
  const sourcePageIds = new Set([...sentPages.keys(), ...latestPages.keys()]);

  for (const sourcePageId of sourcePageIds) {
    const sentPage = sentPages.get(sourcePageId);
    const latestPage = latestPages.get(sourcePageId);
    const conflict = conflictBySource.get(sourcePageId);
    const targetPageId = conflict?.conflictPageId ?? sourcePageId;
    const targetIndex = pages.findIndex((page) => page.id === targetPageId);
    if (!sentPage && latestPage) {
      if (targetIndex < 0) pages.push(latestPage);
      continue;
    }
    if (sentPage && !latestPage) {
      if (targetIndex >= 0) pages.splice(targetIndex, 1);
      continue;
    }
    if (!sentPage || !latestPage || sameDocumentValue(sentPage, latestPage) || targetIndex < 0) continue;
    const targetPage = pages[targetIndex];
    const nodeIdMap = conflict?.nodeIdMap ?? {};
    const edgeIdMap = conflict?.edgeIdMap ?? {};
    const targetNodes = new Map(targetPage.nodes.map((node) => [node.id, node]));
    const sentNodes = new Map(sentPage.nodes.map((node) => [node.id, node]));
    const latestNodes = new Map(latestPage.nodes.map((node) => [node.id, node]));
    for (const nodeId of new Set([...sentNodes.keys(), ...latestNodes.keys()])) {
      const before = sentNodes.get(nodeId);
      const after = latestNodes.get(nodeId);
      if (sameDocumentValue(before, after)) continue;
      const targetNodeId = nodeIdMap[nodeId] ?? nodeId;
      if (!after) targetNodes.delete(targetNodeId);
      else targetNodes.set(targetNodeId, { ...after, id: targetNodeId, selected: false });
    }
    const targetEdges = new Map(targetPage.edges.map((edge) => [edge.id, edge]));
    const sentEdges = new Map(sentPage.edges.map((edge) => [edge.id, edge]));
    const latestEdges = new Map(latestPage.edges.map((edge) => [edge.id, edge]));
    for (const edgeId of new Set([...sentEdges.keys(), ...latestEdges.keys()])) {
      const before = sentEdges.get(edgeId);
      const after = latestEdges.get(edgeId);
      if (sameDocumentValue(before, after)) continue;
      const targetEdgeId = edgeIdMap[edgeId] ?? edgeId;
      if (!after) targetEdges.delete(targetEdgeId);
      else {
        targetEdges.set(targetEdgeId, {
          ...after,
          id: targetEdgeId,
          source: nodeIdMap[after.source] ?? after.source,
          target: nodeIdMap[after.target] ?? after.target
        });
      }
    }
    pages[targetIndex] = {
      ...targetPage,
      name: sentPage.name !== latestPage.name ? latestPage.name : targetPage.name,
      viewport: !sameDocumentValue(sentPage.viewport, latestPage.viewport) ? latestPage.viewport : targetPage.viewport,
      updatedAt: latestPage.updatedAt,
      nodes: [...targetNodes.values()],
      edges: [...targetEdges.values()]
    };
  }
  const activeConflict = conflictBySource.get(latestLocalDocument.activePageId);
  const activePageId = activeConflict?.conflictPageId ?? latestLocalDocument.activePageId;
  return normalizeDocument(projectPath, { ...savedDocument, pages, activePageId });
}

function flowEdges(edges: ScatterEdge[], selectedNodeId: string | null, hoveredNodeId: string | null, connectionPreview: ConnectionHoverTarget | null): Edge[] {
  const activeNodeIds = new Set(
    [selectedNodeId, hoveredNodeId, connectionPreview?.sourceId, connectionPreview?.targetId].filter(Boolean) as string[]
  );
  const renderedEdges = edges.map((edge) => ({
    ...edge,
    type: "scatter",
    data: {
      active: activeNodeIds.has(edge.source) || activeNodeIds.has(edge.target)
    }
  })) as Edge[];

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

function storeEdges(edges: Edge[]): ScatterEdge[] {
  return edges
    .filter((edge) => edge.id !== connectionPreviewEdgeId)
    .map(({ id, source, target, label }) => ({ id, source, target, label: typeof label === "string" ? label : undefined }));
}

function fileExtensionFromMime(mime: string): string {
  const normalized = mime.toLowerCase();
  if (normalized === "image/jpeg") return ".jpg";
  if (normalized === "image/png") return ".png";
  if (normalized === "image/gif") return ".gif";
  if (normalized === "image/webp") return ".webp";
  if (normalized === "image/svg+xml") return ".svg";
  if (normalized === "image/avif") return ".avif";
  return "";
}

function attachmentName(file: File, source: "upload" | "drop" | "paste", index: number): string {
  const existingName = file.name.trim();
  if (existingName) return existingName;
  const extension = fileExtensionFromMime(file.type);
  if (source === "paste") return `pasted-image-${Date.now()}-${index + 1}${extension}`;
  return `attachment-${index + 1}${extension}`;
}

function isImageFile(file: File): boolean {
  if (file.type.toLowerCase().startsWith("image/")) return true;
  return /\.(apng|avif|gif|jpe?g|png|svg|webp)$/i.test(file.name);
}

function clipboardImageFiles(dataTransfer: DataTransfer | null): File[] {
  if (!dataTransfer) return [];
  const itemFiles = Array.from(dataTransfer.items)
    .filter((item) => item.kind === "file" && item.type.toLowerCase().startsWith("image/"))
    .map((item) => item.getAsFile())
    .filter((file): file is File => Boolean(file));
  const files = itemFiles.length ? itemFiles : Array.from(dataTransfer.files).filter(isImageFile);

  return files.map((file, index) => {
    const name = attachmentName(file, "paste", index);
    if (name === file.name) return file;
    return new File([file], name, {
      lastModified: file.lastModified || Date.now(),
      type: file.type || "application/octet-stream"
    });
  });
}

async function filesToInputs(files: FileList | File[], source: "upload" | "drop" | "paste"): Promise<AttachmentInput[]> {
  const inputs: AttachmentInput[] = [];
  for (const [index, file] of Array.from(files).entries()) {
    inputs.push({
      name: attachmentName(file, source, index),
      mime: file.type || "application/octet-stream",
      source,
      bytes: await file.arrayBuffer()
    });
  }
  return inputs;
}

function cloneNodeData(data: ScatterNodeData): ScatterNodeData {
  return {
    ...data,
    attachments: data.attachments.map((attachment) => ({ ...attachment }))
  };
}

function cloneNodeForClipboard(node: ScatterNode): ScatterNode {
  return {
    ...node,
    position: { ...node.position },
    data: cloneNodeData(node.data)
  };
}

function cloneEdgeForClipboard(edge: ScatterEdge): ScatterEdge {
  return { ...edge };
}

function isScatterNode(value: unknown): value is ScatterNode {
  if (!value || typeof value !== "object") return false;
  const node = value as ScatterNode;
  return (
    typeof node.id === "string" &&
    node.type === "task" &&
    Boolean(node.position) &&
    typeof node.position.x === "number" &&
    typeof node.position.y === "number" &&
    Boolean(node.data) &&
    typeof node.data.title === "string" &&
    typeof node.data.body === "string" &&
    Array.isArray(node.data.attachments)
  );
}

function isScatterEdge(value: unknown): value is ScatterEdge {
  if (!value || typeof value !== "object") return false;
  const edge = value as ScatterEdge;
  return typeof edge.id === "string" && typeof edge.source === "string" && typeof edge.target === "string";
}

function parseCanvasClipboardPayload(text: string): CanvasClipboardPayload | null {
  if (!text.trim()) return null;

  try {
    const parsed = JSON.parse(text) as Partial<CanvasClipboardPayload>;
    if (
      parsed.kind !== "canvasight.nodes" ||
      parsed.version !== 1 ||
      !Array.isArray(parsed.nodes) ||
      !Array.isArray(parsed.edges) ||
      !parsed.nodes.every(isScatterNode) ||
      !parsed.edges.every(isScatterEdge)
    ) {
      return null;
    }

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

function CanvasightWorkspace({ agentTeamEnabled, onOpenSettings }: CanvasightWorkspaceProps): ReactElement {
  const { language, t } = useI18n();
  const {
    appendAttachments,
    canRedo,
    canUndo,
    commitCanvasChange,
    createPage,
    deleteActivePage,
    edges,
    markNodeRun,
    nodes,
    activePageId,
    pages,
    project,
    replaceCanvasLive,
    renameActivePage,
    selectedNodeId,
    setActivePageId,
    setActivePageViewport,
    setDrawer,
    setProjectDocument,
    setSaving,
    setSelectedNodeId,
    setStatus,
    updateNodeData,
    drawer,
    removeAttachment,
    redo,
    undo
  } = useScatterStore();
  const [loadingProject, setLoadingProject] = useState(true);
  const nativeWidget = isNativeWidgetShell();
  const [startupStage, setStartupStageState] = useState<CanvasightStartupStage>(() =>
    nativeWidget ? getCanvasightStartupIdentity().stage : "ready"
  );
  const [startupFailure, setStartupFailure] = useState<{ stage: string; reason: string } | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionPreview, setConnectionPreview] = useState<ConnectionHoverTarget | null>(null);
  const [canvasTool, setCanvasTool] = useState<CanvasTool>("select");
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [spacePanActive, setSpacePanActive] = useState(false);
  const [viewportZoom, setViewportZoom] = useState(1);
  const [selectedRunMode, setSelectedRunMode] = useState<RunMode>("flow");
  const [markdownNodeId, setMarkdownNodeId] = useState<string | null>(null);
  const [renamingPage, setRenamingPage] = useState(false);
  const [pageNameDraft, setPageNameDraft] = useState("");
  const [deletePageRequest, setDeletePageRequest] = useState<{ id: string; name: string } | null>(null);
  const [deleteTemplateRequest, setDeleteTemplateRequest] = useState<{ id: string; title: string } | null>(null);
  const [templates, setTemplates] = useState<NodeTemplate[]>([]);
  const [templateSearch, setTemplateSearch] = useState("");
  const [templateLimitRequest, setTemplateLimitRequest] = useState<NodeTemplateInput | null>(null);
  const [runFeedback, setRunFeedback] = useState<{ message: string; tone: ToastTone } | null>(null);
  const [documentConflicts, setDocumentConflicts] = useState<Array<{
    id: string;
    message: string;
    aiPageId: string;
  }>>([]);
  const [manualDocumentConflict, setManualDocumentConflict] = useState<{
    message: string;
    originalPageId: string | null;
  } | null>(null);
  const [saveFlushNonce, setSaveFlushNonce] = useState(0);
  const hydratedRef = useRef(false);
  const documentRevisionRef = useRef<number | null>(null);
  const documentVersionRef = useRef<string | null>(null);
  const baseDocumentRef = useRef<{ revision: number; version: string; document: ScatterDocument } | null>(null);
  const localMutationGenerationRef = useRef(0);
  const acknowledgedMutationGenerationRef = useRef(0);
  const saveRequestCountRef = useRef(0);
  const saveInFlightRef = useRef(false);
  const saveQueuedRef = useRef(false);
  const skipNextSaveRef = useRef(false);
  const reloadingExternalDocumentRef = useRef(false);
  const saveTimerRef = useRef<number | null>(null);
  const runFeedbackTimerRef = useRef<number | null>(null);
  const urlThreadIdRef = useRef(threadIdFromUrl());
  const claimedThreadProjectRef = useRef<string | null>(null);
  const flowInstanceRef = useRef<ReactFlowInstance | null>(null);
  const canvasShellRef = useRef<HTMLDivElement | null>(null);
  const pageNameInputRef = useRef<HTMLInputElement | null>(null);
  const latestMouseRef = useRef<FlowPosition>({ x: 360, y: 240 });
  const draggingTemplateRef = useRef<NodeTemplate | null>(null);
  const connectionStartRef = useRef<ConnectionStart | null>(null);
  const connectionSucceededRef = useRef(false);
  const connectionHoverTargetRef = useRef<ConnectionHoverTarget | null>(null);
  const canvasClipboardRef = useRef<CanvasClipboardPayload | null>(null);
  const clipboardPasteSerialRef = useRef(0);
  const startupInitializedRef = useRef(false);
  const canvasWasMeasurableRef = useRef(false);
  const canvasRecoveryFrameRef = useRef<number | null>(null);
  const canvasRecoveryQueuedRef = useRef(false);
  const suppressViewportPersistenceRef = useRef(false);
  const viewportInteractionGenerationRef = useRef(0);
  const viewportInteractionActiveRef = useRef(false);

  const advanceStartupStage = useCallback((stage: CanvasightStartupStage) => {
    setStartupStageState((current) => {
      const order: CanvasightStartupStage[] = [
        "starting",
        "connecting_bridge",
        "connecting_session",
        "hydrating_project",
        "ready",
        "failed"
      ];
      if (current === "ready" || current === "failed") return current;
      return order.indexOf(stage) >= order.indexOf(current) ? stage : current;
    });
    setCanvasightStartupStage(stage);
  }, []);

  const failStartup = useCallback((error: unknown, stage = "session") => {
    const reason = error instanceof Error ? error.message : String(error || "Canvasight failed to start.");
    setStartupFailure({ stage, reason });
    setStartupStageState("failed");
    setCanvasightStartupStage("failed");
    void canvasightApi.reportWidgetFailure(error, stage);
  }, []);

  const selectedNode = useMemo(() => nodes.find((node) => node.id === selectedNodeId) ?? null, [nodes, selectedNodeId]);
  const selectedNodes = useMemo(() => nodes.filter((node) => node.selected), [nodes]);
  const markdownNode = useMemo(() => nodes.find((node) => node.id === markdownNodeId) ?? null, [markdownNodeId, nodes]);
  const activePage = useMemo(() => pages.find((page) => page.id === activePageId) ?? pages[0] ?? null, [activePageId, pages]);
  const activePageName = activePage?.name ?? t("page.untitled");
  const canToggleMarkdown = Boolean(project && (selectedNode || markdownNode || drawer === "markdown"));
  const canRun = Boolean(project && selectedNode && selectedNode.data.body.trim().length > 0);
  const canDeletePage = pages.length > 1;
  const panModeActive = canvasTool === "pan" || spacePanActive;
  const zoomPercent = Math.round(viewportZoom * 100);
  const markdownResult = useMemo(
    () =>
      project && markdownNode
        ? buildMarkdown(nodes, edges, markdownNode.id, selectedRunMode, project.name, project.path, language, agentTeamEnabled)
        : {
            markdown: "",
            nodes: [],
            attachments: [],
            imagePaths: [],
            agentTeam: {
              enabled: false,
              skillName: "canvasight-agent-team",
              recommendedRoles: [],
              reportProtocol: {
                root: "agent-reports",
                roster: "ROSTER.md",
                schema: "references/agent-team-schema.json",
                statuses: ["open", "assigned", "blocked", "resolved", "archived"]
              }
            },
            hasCycle: false
          },
    [agentTeamEnabled, edges, language, markdownNode, nodes, project, selectedRunMode]
  );
  const renderedEdges = useMemo(() => flowEdges(edges, selectedNodeId, hoveredNodeId, connectionPreview), [connectionPreview, edges, hoveredNodeId, selectedNodeId]);
  const hideRunFeedback = useCallback(() => {
    if (runFeedbackTimerRef.current) {
      window.clearTimeout(runFeedbackTimerRef.current);
      runFeedbackTimerRef.current = null;
    }
    setRunFeedback(null);
  }, []);

  const showRunFeedback = useCallback((message: string, tone: ToastTone = "information") => {
    if (runFeedbackTimerRef.current) {
      window.clearTimeout(runFeedbackTimerRef.current);
    }
    setRunFeedback({ message, tone });
    runFeedbackTimerRef.current = window.setTimeout(() => {
      setRunFeedback(null);
      runFeedbackTimerRef.current = null;
    }, tone === "negative" ? 9000 : 5200);
  }, []);

  const setRunStatus = useCallback(
    (message: string, tone: ToastTone = "information") => {
      setStatus(message);
      showRunFeedback(message, tone);
    },
    [setStatus, showRunFeedback]
  );

  useEffect(
    () => () => {
      if (runFeedbackTimerRef.current) window.clearTimeout(runFeedbackTimerRef.current);
    },
    []
  );

  const updateConnectionHoverTarget = useCallback((target: ConnectionHoverTarget | null) => {
    const current = connectionHoverTargetRef.current;
    const unchanged =
      current?.sourceId === target?.sourceId &&
      current?.targetId === target?.targetId &&
      current?.hoveredNodeId === target?.hoveredNodeId;
    if (unchanged) return;

    connectionHoverTargetRef.current = target;
    setConnectionPreview(target);
  }, []);

  useEffect(() => {
    if (selectedNodeId) setMarkdownNodeId(selectedNodeId);
  }, [selectedNodeId]);

  useEffect(() => {
    if (!markdownNodeId) return;
    if (!nodes.some((node) => node.id === markdownNodeId)) setMarkdownNodeId(null);
  }, [markdownNodeId, nodes]);

  useEffect(() => {
    setMarkdownNodeId(null);
    setSelectedRunMode("flow");
    setConnectionPreview(null);
    setHoveredNodeId(null);
    connectionStartRef.current = null;
    connectionSucceededRef.current = false;
    connectionHoverTargetRef.current = null;
  }, [activePageId]);

  const restoreCanvasViewport = useCallback(async (): Promise<void> => {
    if (canvasRecoveryQueuedRef.current || !project || !flowInstanceRef.current) return;
    const recoveryGeneration = viewportInteractionGenerationRef.current;
    let suppressingViewportPersistence = false;
    canvasRecoveryQueuedRef.current = true;
    try {
      await new Promise<void>((resolve) => {
        canvasRecoveryFrameRef.current = window.requestAnimationFrame(() => {
          canvasRecoveryFrameRef.current = window.requestAnimationFrame(() => resolve());
        });
      });
      if (viewportInteractionActiveRef.current || viewportInteractionGenerationRef.current !== recoveryGeneration) return;

      const canvas = canvasShellRef.current;
      const instance = flowInstanceRef.current;
      const rect = canvas?.getBoundingClientRect();
      if (!canvas || !instance || !rect || rect.width <= 0 || rect.height <= 0) return;

      const latestState = useScatterStore.getState();
      const latestPage =
        latestState.pages.find((page) => page.id === latestState.activePageId) ?? latestState.pages[0] ?? null;
      const viewport = latestPage?.viewport;
      const latestNodes = latestState.nodes;
      const validViewport = Boolean(
        viewport &&
        Number.isFinite(viewport.x) &&
        Number.isFinite(viewport.y) &&
        Number.isFinite(viewport.zoom) &&
        viewport.zoom >= canvasMinZoom &&
        viewport.zoom <= canvasMaxZoom
      );
      suppressViewportPersistenceRef.current = true;
      suppressingViewportPersistence = true;
      if (validViewport && viewport) await instance.setViewport(viewport, { duration: 0 });
      if (viewportInteractionActiveRef.current || viewportInteractionGenerationRef.current !== recoveryGeneration) return;

      const current = instance.getViewport();
      const hasVisibleNode = latestNodes.some((node) => {
        const bounds = nodeBounds(node);
        const left = node.position.x * current.zoom + current.x;
        const top = node.position.y * current.zoom + current.y;
        const right = left + bounds.width * current.zoom;
        const bottom = top + bounds.height * current.zoom;
        return right > 0 && bottom > 0 && left < rect.width && top < rect.height;
      });
      if (latestNodes.length > 0 && (!validViewport || !hasVisibleNode)) {
        await instance.fitView({ padding: 0.24, duration: 0 });
      }
      setViewportZoom(Math.max(canvasMinZoom, Math.min(canvasMaxZoom, instance.getViewport().zoom)));
      setStartupFailure((current) => (current?.stage === "canvas_resume" ? null : current));
    } catch (error) {
      const reason = error instanceof Error ? error.message : "Canvas recovery failed.";
      setStartupFailure({ stage: "canvas_resume", reason });
      setStatus(`Canvas recovery failed: ${reason}`);
    } finally {
      if (suppressingViewportPersistence) {
        window.requestAnimationFrame(() => {
          window.requestAnimationFrame(() => {
            suppressViewportPersistenceRef.current = false;
          });
        });
      }
      canvasRecoveryQueuedRef.current = false;
      canvasRecoveryFrameRef.current = null;
    }
  }, [project, setStatus]);

  useEffect(() => {
    if (!project || !activePageId) return;
    void restoreCanvasViewport();
  }, [activePageId, project, restoreCanvasViewport]);

  useEffect(() => {
    const canvas = canvasShellRef.current;
    if (!canvas) return;

    const queueRecovery = () => {
      if (document.visibilityState === "hidden") return;
      void restoreCanvasViewport();
    };
    const handleHostContextChanged = (event: Event) => {
      const detail = (event as CustomEvent<{ displayMode?: string; containerDimensions?: { width?: number; height?: number } | null }>).detail;
      const dimensions = detail?.containerDimensions;
      if (detail?.displayMode !== "fullscreen") return;
      if (dimensions && (!(Number(dimensions.width) > 0) || !(Number(dimensions.height) > 0))) return;
      queueRecovery();
    };
    const observer = new ResizeObserver((entries) => {
      const rect = entries[0]?.contentRect;
      const measurable = Boolean(rect && rect.width > 0 && rect.height > 0);
      const restored = measurable && !canvasWasMeasurableRef.current;
      canvasWasMeasurableRef.current = measurable;
      if (restored) queueRecovery();
    });
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") queueRecovery();
    };
    observer.observe(canvas);
    window.addEventListener("canvasight:host-context-changed", handleHostContextChanged);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      observer.disconnect();
      window.removeEventListener("canvasight:host-context-changed", handleHostContextChanged);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (canvasRecoveryFrameRef.current !== null) window.cancelAnimationFrame(canvasRecoveryFrameRef.current);
      canvasRecoveryFrameRef.current = null;
      canvasRecoveryQueuedRef.current = false;
    };
  }, [restoreCanvasViewport]);

  const clearConnectionHoverTarget = useCallback(() => {
    updateConnectionHoverTarget(null);
  }, [updateConnectionHoverTarget]);

  const selectNode = useCallback(
    (nodeId: string | null, mode: RunMode = "flow") => {
      const currentNodes = useScatterStore.getState().nodes;
      const nextNodeId = nodeId && currentNodes.some((node) => node.id === nodeId) ? nodeId : null;
      setSelectedRunMode(mode);
      setSelectedNodeId(nextNodeId);
      replaceCanvasLive({
        nodes: currentNodes.map((node) => ({
          ...node,
          selected: node.id === nextNodeId
        }))
      });
    },
    [replaceCanvasLive, setSelectedNodeId]
  );

  const locateNode = useCallback(
    (nodeId: string, mode: RunMode = "flow") => {
      const node = nodes.find((item) => item.id === nodeId);
      if (!node) return;
      selectNode(nodeId, mode);
      const bounds = nodeBounds(node);
      void flowInstanceRef.current?.setCenter(node.position.x + bounds.width / 2, node.position.y + bounds.height / 2, {
        duration: 260,
        zoom: Math.max(0.5, Math.min(1, viewportZoom))
      });
    },
    [nodes, selectNode, viewportZoom]
  );

  const claimUrlThreadForProject = useCallback(
    async (projectPath: string): Promise<void> => {
      const threadId = urlThreadIdRef.current.trim();
      if (!threadId) return;
      const claimKey = `${projectPath}:${threadId}`;
      if (claimedThreadProjectRef.current === claimKey) return;
      try {
        const claimed = await canvasightApi.claimThread(projectPath, threadId, language);
        claimedThreadProjectRef.current = `${claimed.projectPath}:${claimed.codexThreadId}`;
      } catch {
        setStatus(t("status.threadClaimFailed"));
      }
    },
    [language, setStatus, t]
  );

  const applyOpenedProject = useCallback(
    async (
      projectPath: string,
      result: Awaited<ReturnType<typeof canvasightApi.openProject>>,
      status?: string,
      preserveLocalNavigation = false
    ): Promise<void> => {
      const document = normalizeDocument(projectPath, result.document);
      const currentState = useScatterStore.getState();
      const currentActivePage = preserveLocalNavigation
        ? currentState.pages.find((page) => page.id === currentState.activePageId)
        : null;
      const serverActivePage = currentActivePage ? document.pages.find((page) => page.id === currentActivePage.id) : null;
      const displayDocument = serverActivePage
        ? normalizeDocument(projectPath, {
            ...document,
            activePageId: serverActivePage.id,
            pages: document.pages.map((page) =>
              page.id === serverActivePage.id ? { ...page, viewport: currentActivePage?.viewport ?? page.viewport } : page
            )
          })
        : document;
      if (preserveLocalNavigation) {
        const newConflictPages = document.pages.filter(
          (page) => page.conflict && !currentState.pages.some((currentPage) => currentPage.id === page.id)
        );
        const newAiConflictPages = newConflictPages.filter((page) => page.conflict?.source === "ai");
        if (newAiConflictPages.length) {
          setDocumentConflicts((current) => {
            const ids = new Set(current.map((item) => item.id));
            return [
              ...current,
              ...newAiConflictPages
                .filter((page) => !ids.has(page.id))
                .map((page) => ({
                  id: page.id,
                  aiPageId: page.id,
                  message: page.conflict?.copyKind === "recovery" ? t("status.aiRecoveryCopyDetected") : t("status.aiConflictCopyDetected")
                }))
            ];
          });
        }
        if (newConflictPages.some((page) => page.conflict?.source !== "ai")) {
          setManualDocumentConflict({ message: t("status.conflictCopyDetected"), originalPageId: null });
        }
      }
      documentRevisionRef.current = result.documentRevision;
      documentVersionRef.current = result.documentVersion;
      baseDocumentRef.current = {
        revision: result.documentRevision,
        version: result.documentVersion,
        document
      };
      acknowledgedMutationGenerationRef.current = localMutationGenerationRef.current;
      skipNextSaveRef.current = true;
      setProjectDocument(result.project, displayDocument);
      if (
        preserveLocalNavigation &&
        currentState.selectedNodeId &&
        displayDocument.activePageId === currentState.activePageId &&
        displayDocument.nodes.some((node) => node.id === currentState.selectedNodeId)
      ) {
        setSelectedNodeId(currentState.selectedNodeId);
      }
      hydratedRef.current = true;
      setStatus(status ?? t("app.openedProject", { name: result.project.name }));
      await claimUrlThreadForProject(result.project.path);
    },
    [claimUrlThreadForProject, setProjectDocument, setSelectedNodeId, setStatus, t]
  );

  const openProjectPath = useCallback(
    async (
      projectPath: string,
      options: { silent?: boolean; status?: string; fatal?: boolean; preserveLocalNavigation?: boolean } = {}
    ) => {
      const trimmedPath = projectPath.trim();
      if (!trimmedPath) return;
      if (!options.silent) {
        setLoadingProject(true);
        setStatus("Opening project...");
      }
      try {
        const result = await canvasightApi.openProject(trimmedPath);
        await applyOpenedProject(trimmedPath, result, options.status, options.preserveLocalNavigation === true);
      } catch (error) {
        if (options.fatal) throw error;
        const fallbackProject = {
          name: projectNameFromPath(trimmedPath),
          path: trimmedPath,
          updatedAt: new Date().toISOString()
        };
        documentRevisionRef.current = null;
        documentVersionRef.current = null;
        baseDocumentRef.current = null;
        skipNextSaveRef.current = true;
        setProjectDocument(fallbackProject, emptyDocument(trimmedPath));
        hydratedRef.current = true;
        setStatus(error instanceof Error ? error.message : t("app.genericError"));
      } finally {
        if (!options.silent) setLoadingProject(false);
      }
    },
    [applyOpenedProject, setProjectDocument, setStatus, t]
  );

  useEffect(() => {
    if (startupInitializedRef.current) return;
    startupInitializedRef.current = true;
    window.scatter = {
      showInFolder: (targetPath: string) => canvasightApi.showInFolder(targetPath)
    };

    const threadOnlyFallbackStatus = "Unable to resolve the current Codex project. Reopen Canvasight from a project thread.";
    const resolveAndOpenThreadProject = (fatal = false) => {
      const threadId = threadIdFromUrl();
      return canvasightApi
        .resolveThreadProject(threadId, language)
        .then((result) => applyOpenedProject(result.project.path, result))
        .catch((error) => {
          if (fatal) throw error;
          setLoadingProject(false);
          hydratedRef.current = true;
          setStatus(error instanceof Error ? error.message : threadOnlyFallbackStatus);
          return undefined;
        });
    };

    const nextPaint = () => new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve()));
    const waitForFullscreen = async (): Promise<void> => {
      const deadline = Date.now() + 8_000;
      while (Date.now() < deadline) {
        if (getCanvasightStartupIdentity().displayMode === "fullscreen") return;
        await new Promise<void>((resolve) => window.setTimeout(resolve, 50));
      }
      throw new Error("Canvasight host did not confirm the fullscreen widget presentation.");
    };

    const initialize = async (): Promise<void> => {
      let startupBindingKey = getCanvasightBindingKey();
      try {
        if (nativeWidget) advanceStartupStage("connecting_session");
        const session = await canvasightApi.getSession();
        startupBindingKey = getCanvasightBindingKey();
        const isThreadOnlyFallback = isThreadOnlyFallbackUrl();
        const urlProjectPath = projectPathFromUrl();
        const isBareLocalFallback = canvasightApi.sessionId === "local" && !threadIdFromUrl() && !urlProjectPath;
        const projectPath = urlProjectPath || (isThreadOnlyFallback || isBareLocalFallback ? "" : session.projectPath || defaultProjectPathFromBrowser());
        if (nativeWidget) advanceStartupStage("hydrating_project");
        if (projectPath) {
          await openProjectPath(projectPath, { fatal: nativeWidget });
        } else if (isThreadOnlyFallback) {
          await resolveAndOpenThreadProject(nativeWidget);
        } else {
          setLoadingProject(false);
          hydratedRef.current = true;
          setStatus("Open Canvasight from a Codex project to create a workspace.");
        }

        if (nativeWidget) {
          await nextPaint();
          await nextPaint();
          await waitForFullscreen();
          const canvas = canvasShellRef.current;
          const rect = canvas?.getBoundingClientRect();
          if (!canvas || !rect || rect.width <= 0 || rect.height <= 0) {
            throw new Error("Canvasight canvas did not render with a visible size.");
          }
          await canvasightApi.reportWidgetReady({
            projectHydrated: hydratedRef.current,
            canvasRendered: canvas.isConnected,
            canvasVisible: getComputedStyle(canvas).display !== "none" && getComputedStyle(canvas).visibility !== "hidden",
            canvasWidth: rect.width,
            canvasHeight: rect.height
          });
          if (!isCanvasightBindingCurrent(startupBindingKey)) return;
          advanceStartupStage("ready");
        }
      } catch (error) {
        if (nativeWidget) {
          if (startupBindingKey && !isCanvasightBindingCurrent(startupBindingKey)) return;
          failStartup(error, getCanvasightStartupIdentity().stage === "hydrating_project" ? "project" : "session");
          return;
        }
        const isThreadOnlyFallback = isThreadOnlyFallbackUrl();
        const urlProjectPath = projectPathFromUrl();
        const isBareLocalFallback = canvasightApi.sessionId === "local" && !threadIdFromUrl() && !urlProjectPath;
        const projectPath = urlProjectPath || (isThreadOnlyFallback || isBareLocalFallback ? "" : defaultProjectPathFromBrowser());
        if (projectPath) {
          return openProjectPath(projectPath);
        }
        if (isThreadOnlyFallback) {
          return resolveAndOpenThreadProject();
        }
        setLoadingProject(false);
        hydratedRef.current = true;
        setStatus(isThreadOnlyFallback ? threadOnlyFallbackStatus : error instanceof Error ? error.message : t("app.genericError"));
      }
    };

    void initialize();
  }, [advanceStartupStage, applyOpenedProject, failStartup, language, nativeWidget, openProjectPath, setStatus, t]);

  useEffect(() => {
    let mounted = true;
    canvasightApi
      .listTemplates()
      .then((items) => {
        if (mounted) setTemplates(items);
      })
      .catch(() => {
        if (mounted) setStatus(t("status.templatesLoadFailed"));
      });
    return () => {
      mounted = false;
    };
  }, [setStatus, t]);

  useEffect(() => {
    if (!hydratedRef.current || !project) return;
    if (skipNextSaveRef.current) {
      skipNextSaveRef.current = false;
      return;
    }
    const mutationGeneration = ++localMutationGenerationRef.current;
    if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    saveTimerRef.current = window.setTimeout(() => {
      if (saveInFlightRef.current) {
        saveQueuedRef.current = true;
        return;
      }
      const base = baseDocumentRef.current;
      if (!base) return;
      const currentState = useScatterStore.getState();
      if (!currentState.project || currentState.project.path !== project.path) return;
      const document = toDocument(currentState.project, currentState.pages, currentState.activePageId, currentState.nodes, currentState.edges);
      const deletedPageSnapshots = Object.fromEntries(
        base.document.pages.filter((page) => !document.pages.some((candidate) => candidate.id === page.id)).map((page) => [page.id, page])
      );
      const clientMutationId = crypto.randomUUID();
      saveInFlightRef.current = true;
      saveRequestCountRef.current += 1;
      setSaving(true);
      canvasightApi
        .saveDocument({
          projectPath: project.path,
          document,
          expectedRevision: base.revision,
          base,
          clientMutationId,
          deletedPageSnapshots,
          language
        })
        .then((result) => {
          documentRevisionRef.current = Math.max(documentRevisionRef.current ?? 0, result.documentRevision);
          documentVersionRef.current = result.documentVersion;
          const hasNewerLocalChanges = localMutationGenerationRef.current !== mutationGeneration;
          const normalizedResult = normalizeDocument(project.path, result.document);
          const conflict = result.merge?.conflictCopies.find((item) => item.conflictPageId === result.merge?.localActivePageId) ?? result.merge?.conflictCopies[0];
          baseDocumentRef.current = {
            revision: result.documentRevision,
            version: result.documentVersion,
            document: normalizedResult
          };
          if (!hasNewerLocalChanges) {
            acknowledgedMutationGenerationRef.current = mutationGeneration;
            if (result.status === "merged" || result.status === "conflict-copy") {
              const previousActivePage = useScatterStore.getState().activePageId;
              const previousSelectedNodeId = useScatterStore.getState().selectedNodeId;
              const targetPageId = result.status === "conflict-copy" && conflict?.source !== "ai"
                ? result.merge?.localActivePageId
                : previousActivePage;
              const preservedPage = normalizedResult.pages.find((page) => page.id === targetPageId);
              const appliedDocument = preservedPage
                ? { ...normalizedResult, activePageId: preservedPage.id, viewport: preservedPage.viewport, nodes: preservedPage.nodes, edges: preservedPage.edges }
                : normalizedResult;
              skipNextSaveRef.current = true;
              setProjectDocument(project, appliedDocument);
              if (previousSelectedNodeId && appliedDocument.nodes.some((node) => node.id === previousSelectedNodeId)) {
                setSelectedNodeId(previousSelectedNodeId);
              }
            }
          } else {
            const latestState = useScatterStore.getState();
            if (latestState.project?.path === project.path) {
              const latestLocalDocument = toDocument(
                latestState.project,
                latestState.pages,
                latestState.activePageId,
                latestState.nodes,
                latestState.edges
              );
              const rebasedDocument = rebaseLocalChangesAfterSave(project.path, document, latestLocalDocument, normalizedResult, result.merge);
              const previousSelectedNodeId = latestState.selectedNodeId;
              setProjectDocument(project, rebasedDocument);
              if (previousSelectedNodeId && rebasedDocument.nodes.some((node) => node.id === previousSelectedNodeId)) {
                setSelectedNodeId(previousSelectedNodeId);
              }
            }
          }
          if (result.status === "conflict-copy" && conflict) {
            if (conflict.source === "ai") {
              setDocumentConflicts((current) => current.some((item) => item.id === conflict.conflictPageId)
                ? current
                : [...current, {
                    id: conflict.conflictPageId,
                    aiPageId: conflict.conflictPageId,
                    message: conflict.originalPageAvailable ? t("status.aiConflictCopyDetected") : t("status.aiRecoveryCopyDetected")
                  }]);
            } else {
              setManualDocumentConflict({
                message:
                  conflict.incomingIntent === "delete"
                    ? t("status.conflictDeleteNotApplied")
                    : conflict.originalPageAvailable
                      ? t("status.conflictCopySaved")
                      : t("status.conflictCopyRestored"),
                originalPageId: conflict.originalPageAvailable ? conflict.originalPageId : null
              });
            }
          }
          setStatus(
            result.status === "merged"
              ? t("status.concurrentChangesMerged")
              : result.status === "conflict-copy"
                ? conflict?.source === "ai"
                  ? conflict.originalPageAvailable === false
                    ? t("status.aiRecoveryCopyDetected")
                    : t("status.aiConflictCopyDetected")
                  : conflict?.incomingIntent === "delete"
                    ? t("status.conflictDeleteNotApplied")
                    : conflict?.originalPageAvailable === false
                      ? t("status.conflictCopyRestored")
                      : t("status.conflictCopySaved")
                : t("status.saved")
          );
        })
        .catch((error) => {
          if (isStaleDocumentError(error)) {
            void openProjectPath(project.path, {
              silent: true,
              status: t("status.externalDocumentReloaded"),
              preserveLocalNavigation: true
            });
            return;
          }
          setStatus(error instanceof Error ? error.message : t("status.saveFailed"));
        })
        .finally(() => {
          saveInFlightRef.current = false;
          saveRequestCountRef.current = Math.max(0, saveRequestCountRef.current - 1);
          if (saveRequestCountRef.current === 0) setSaving(false);
          if (saveQueuedRef.current) {
            saveQueuedRef.current = false;
            setSaveFlushNonce((value) => value + 1);
          }
        });
    }, saveDebounceMs);

    return () => {
      if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    };
  }, [activePageId, edges, language, nodes, openProjectPath, pages, project, saveFlushNonce, setProjectDocument, setSaving, setSelectedNodeId, setStatus, t]);

  useEffect(() => {
    if (!hydratedRef.current || !project) return;
    let cancelled = false;
    let timer: number | null = null;
    let ownsLease = false;
    let requestInFlight = false;
    let standbyRetryUsed = false;
    let previouslyEligible = false;

    const clearTimer = () => {
      if (timer !== null) window.clearTimeout(timer);
      timer = null;
    };

    const schedule = (delayMs: number) => {
      if (cancelled) return;
      clearTimer();
      timer = window.setTimeout(() => {
        timer = null;
        void pollForExternalDocument();
      }, Math.max(0, delayMs));
    };

    const evidence = () => {
      const rect = canvasShellRef.current?.getBoundingClientRect();
      return {
        visible: document.visibilityState === "visible",
        focused: document.hasFocus(),
        canvasWidth: rect?.width ?? 0,
        canvasHeight: rect?.height ?? 0
      };
    };

    const isEligible = () => {
      if (!nativeWidget) return true;
      const identity = getCanvasightStartupIdentity();
      const current = evidence();
      return Boolean(
        startupStage === "ready" &&
          identity.stage === "ready" &&
          identity.displayMode === "fullscreen" &&
          current.visible &&
          current.focused &&
          current.canvasWidth > 0 &&
          current.canvasHeight > 0
      );
    };

    const releaseLease = async () => {
      clearTimer();
      if (!nativeWidget || !ownsLease) return;
      ownsLease = false;
      try {
        await canvasightApi.releaseRevisionPoll();
      } catch {
        // The daemon's bounded lease is the fallback for abrupt widget loss.
      }
    };

    const reloadIfExternalDocumentChanged = async (serverRevision: number): Promise<void> => {
      if (reloadingExternalDocumentRef.current || cancelled) return;
      try {
        const currentRevision = documentRevisionRef.current;
        if (currentRevision === null || serverRevision <= currentRevision) return;
        if (localMutationGenerationRef.current > acknowledgedMutationGenerationRef.current || saveRequestCountRef.current > 0) return;
        reloadingExternalDocumentRef.current = true;
        try {
          await openProjectPath(project.path, {
            silent: true,
            status: t("status.externalDocumentReloaded"),
            preserveLocalNavigation: true
          });
        } finally {
          reloadingExternalDocumentRef.current = false;
        }
      } catch {
        // Background revision checks should not interrupt editing.
      }
    };

    const pollForExternalDocument = async (): Promise<void> => {
      if (cancelled || requestInFlight) return;
      if (!isEligible()) {
        await releaseLease();
        return;
      }
      requestInFlight = true;
      try {
        if (nativeWidget) {
          const lease = await canvasightApi.claimRevisionPoll(evidence());
          ownsLease = lease.owner;
          if (cancelled) {
            await releaseLease();
            return;
          }
          if (!isEligible()) {
            await releaseLease();
            return;
          }
          if (lease.owner && typeof lease.documentRevision === "number") {
            standbyRetryUsed = false;
            await reloadIfExternalDocumentChanged(lease.documentRevision);
            schedule(lease.pollIntervalMs);
          } else if (lease.status === "standby" && !standbyRetryUsed) {
            standbyRetryUsed = true;
            schedule(lease.retryAfterMs ?? 10_000);
          }
          return;
        }
        const session = await canvasightApi.getSession();
        if (!cancelled && session.projectPath === project.path) await reloadIfExternalDocumentChanged(session.documentRevision);
        schedule(5_000);
      } catch {
        if (!cancelled && isEligible()) schedule(5_000);
      } finally {
        requestInFlight = false;
      }
    };

    const handleActivityChange = () => {
      const eligible = isEligible();
      const becameEligible = eligible && !previouslyEligible;
      previouslyEligible = eligible;
      if (becameEligible) {
        standbyRetryUsed = false;
        schedule(0);
      } else if (!eligible) {
        void releaseLease();
      }
    };
    const handlePageHide = () => {
      cancelled = true;
      void releaseLease();
    };
    const handleResourceTeardown = (event: Event) => {
      cancelled = true;
      clearTimer();
      const release = releaseLease();
      (event as CustomEvent<{ waitUntil?: (promise: Promise<unknown>) => void }>).detail?.waitUntil?.(release);
    };
    const observer = new ResizeObserver(handleActivityChange);
    if (canvasShellRef.current) observer.observe(canvasShellRef.current);
    document.addEventListener("visibilitychange", handleActivityChange);
    window.addEventListener("focus", handleActivityChange);
    window.addEventListener("blur", handleActivityChange);
    window.addEventListener("pagehide", handlePageHide);
    window.addEventListener("canvasight:host-context-changed", handleActivityChange);
    window.addEventListener("canvasight:resource-teardown", handleResourceTeardown);
    previouslyEligible = isEligible();
    if (previouslyEligible) schedule(0);

    return () => {
      cancelled = true;
      clearTimer();
      observer.disconnect();
      document.removeEventListener("visibilitychange", handleActivityChange);
      window.removeEventListener("focus", handleActivityChange);
      window.removeEventListener("blur", handleActivityChange);
      window.removeEventListener("pagehide", handlePageHide);
      window.removeEventListener("canvasight:host-context-changed", handleActivityChange);
      window.removeEventListener("canvasight:resource-teardown", handleResourceTeardown);
      void releaseLease();
    };
  }, [nativeWidget, openProjectPath, project, startupStage, t]);

  const beginRenamePage = useCallback(() => {
    if (!activePage) return;
    setPageNameDraft(activePage.name);
    setRenamingPage(true);
  }, [activePage]);

  const cancelRenamePage = useCallback(() => {
    setRenamingPage(false);
    setPageNameDraft("");
  }, []);

  const commitRenamePage = useCallback(() => {
    const nextName = pageNameDraft.trim();
    if (!nextName || !activePage) {
      cancelRenamePage();
      return;
    }
    renameActivePage(nextName);
    setStatus(t("status.pageRenamed", { name: nextName }));
    cancelRenamePage();
  }, [activePage, cancelRenamePage, pageNameDraft, renameActivePage, setStatus, t]);

  useEffect(() => {
    if (!renamingPage) return;

    const handlePageNamePointerDown = (event: PointerEvent) => {
      const input = pageNameInputRef.current;
      if (input && event.composedPath().includes(input)) return;
      commitRenamePage();
    };

    document.addEventListener("pointerdown", handlePageNamePointerDown, true);
    return () => {
      document.removeEventListener("pointerdown", handlePageNamePointerDown, true);
    };
  }, [commitRenamePage, renamingPage]);

  const handleCreatePage = useCallback(() => {
    const page = createPage();
    if (!page) return;
    setStatus(t("status.pageCreated", { name: page.name }));
  }, [createPage, setStatus, t]);

  const handleDeletePage = useCallback(() => {
    if (!activePage || !canDeletePage) return;
    setDeletePageRequest({ id: activePage.id, name: activePage.name });
  }, [activePage, canDeletePage]);

  const cancelDeletePage = useCallback(() => {
    setDeletePageRequest(null);
  }, []);

  const confirmDeletePage = useCallback(() => {
    if (!deletePageRequest || !canDeletePage) return;
    if (activePageId !== deletePageRequest.id) {
      setDeletePageRequest(null);
      return;
    }
    deleteActivePage();
    setStatus(t("status.pageDeleted", { name: deletePageRequest.name }));
    setDeletePageRequest(null);
  }, [activePageId, canDeletePage, deleteActivePage, deletePageRequest, setStatus, t]);

  const getVisibleCanvasCenterPosition = useCallback((): FlowPosition => {
    const canvasRect = canvasShellRef.current?.getBoundingClientRect();
    const screenCenter = canvasRect
      ? {
          x: canvasRect.left + canvasRect.width / 2,
          y: canvasRect.top + canvasRect.height / 2
        }
      : latestMouseRef.current;
    const flowCenter = flowInstanceRef.current?.screenToFlowPosition(screenCenter) ?? screenCenter;

    return {
      x: flowCenter.x - taskNodeWidth / 2,
      y: flowCenter.y - taskNodeHeight / 2
    };
  }, []);

  const addNode = useCallback(() => {
    if (!project) return;
    const position = selectedNode
      ? findOpenPositionToRight(
          {
            x: selectedNode.position.x + nodeBounds(selectedNode).width + taskNodeHorizontalGap,
            y: selectedNode.position.y
          },
          nodes
        )
      : findOpenPositionNear(getVisibleCanvasCenterPosition(), nodes);
    const node = emptyNode(position, nodes.length);
    commitCanvasChange({
      nodes: [...nodes.map((item) => ({ ...item, selected: false })), node]
    });
    setSelectedNodeId(node.id);
    setStatus("Node created.");
  }, [commitCanvasChange, getVisibleCanvasCenterPosition, nodes, project, selectedNode, setSelectedNodeId, setStatus]);

  const createConnectedNode = useCallback(
    (nodeId: string, side: "left" | "right") => {
      if (!project) return;
      const source = nodes.find((node) => node.id === nodeId);
      if (!source) return;
      clearConnectionHoverTarget();
      const sourceBounds = nodeBounds(source);
      const position =
        side === "right"
          ? findOpenPositionToRight(
              {
                x: source.position.x + sourceBounds.width + taskNodeHorizontalGap,
                y: source.position.y
              },
              nodes
            )
          : findOpenPositionToLeft(
              {
                x: source.position.x - taskNodeWidth - taskNodeHorizontalGap,
                y: source.position.y
              },
              nodes
            );
      const node = emptyNode(position, nodes.length);
      const edge =
        side === "right"
          ? { id: nanoid(), source: source.id, target: node.id }
          : { id: nanoid(), source: node.id, target: source.id };
      if (!isConnectionAllowed(edge, edges)) return;
      commitCanvasChange({
        nodes: [...nodes.map((item) => ({ ...item, selected: false })), node],
        edges: [...edges, edge]
      });
      setSelectedNodeId(node.id);
    },
    [clearConnectionHoverTarget, commitCanvasChange, edges, nodes, project, setSelectedNodeId]
  );

  const duplicateNode = useCallback(
    (nodeId: string) => {
      const source = nodes.find((node) => node.id === nodeId);
      if (!source) return;
      const node: ScatterNode = {
        ...source,
        id: nanoid(),
        position: { x: source.position.x + 36, y: source.position.y + 36 },
        selected: true,
        data: {
          ...source.data,
          title: `${source.data.title} copy`,
          attachments: source.data.attachments.map((attachment) => ({ ...attachment }))
        }
      };
      commitCanvasChange({
        nodes: [...nodes.map((item) => ({ ...item, selected: false })), node]
      });
      setSelectedNodeId(node.id);
    },
    [commitCanvasChange, nodes, setSelectedNodeId]
  );

  const deleteNode = useCallback(
    (nodeId: string) => {
      const current = useScatterStore.getState();
      if (!current.nodes.some((node) => node.id === nodeId)) return;
      commitCanvasChange({
        nodes: current.nodes.filter((node) => node.id !== nodeId),
        edges: current.edges.filter((edge) => edge.source !== nodeId && edge.target !== nodeId)
      });
      if (current.selectedNodeId === nodeId) setSelectedNodeId(null);
    },
    [commitCanvasChange, setSelectedNodeId]
  );

  const deleteSelectedNodes = useCallback(() => {
    if (!selectedNodes.length) return false;
    const selectedIds = new Set(selectedNodes.map((node) => node.id));
    commitCanvasChange({
      nodes: nodes.filter((node) => !selectedIds.has(node.id)),
      edges: edges.filter((edge) => !selectedIds.has(edge.source) && !selectedIds.has(edge.target))
    });
    setSelectedNodeId(null);
    setStatus(t("status.deletedNodes", { count: selectedIds.size }));
    return true;
  }, [commitCanvasChange, edges, nodes, selectedNodes, setSelectedNodeId, setStatus, t]);

  const copySelectedNodes = useCallback(
    (clipboardData?: DataTransfer | null) => {
      if (!selectedNodes.length) return false;
      const selectedIds = new Set(selectedNodes.map((node) => node.id));
      const payload: CanvasClipboardPayload = {
        kind: "canvasight.nodes",
        version: 1,
        copiedAt: new Date().toISOString(),
        nodes: selectedNodes.map(cloneNodeForClipboard),
        edges: edges.filter((edge) => selectedIds.has(edge.source) && selectedIds.has(edge.target)).map(cloneEdgeForClipboard)
      };
      const serialized = JSON.stringify(payload);

      try {
        clipboardData?.setData(canvasClipboardMime, serialized);
        clipboardData?.setData("text/plain", serialized);
      } catch {
        // Clipboard events can be read-only in some browser paths; keep the in-page clipboard as the reliable path.
      }

      const writeText = navigator.clipboard?.writeText(serialized);
      if (writeText) void writeText.catch(() => undefined);
      canvasClipboardRef.current = payload;
      clipboardPasteSerialRef.current = 0;
      setStatus(t("status.copiedNodes", { count: payload.nodes.length }));
      return true;
    },
    [edges, selectedNodes, setStatus, t]
  );

  const pasteCanvasClipboard = useCallback(
    (payload = canvasClipboardRef.current) => {
      if (!project || !payload?.nodes.length) return false;
      const serial = clipboardPasteSerialRef.current + 1;
      clipboardPasteSerialRef.current = serial;
      const offset = 36 * serial;
      const idMap = new Map<string, string>();
      const pastedNodes = payload.nodes.map((node) => {
        const id = nanoid();
        idMap.set(node.id, id);
        return {
          ...node,
          id,
          selected: true,
          position: roundPosition({ x: node.position.x + offset, y: node.position.y + offset }),
          data: cloneNodeData(node.data)
        } satisfies ScatterNode;
      });
      const pastedEdges = payload.edges
        .map((edge) => {
          const source = idMap.get(edge.source);
          const target = idMap.get(edge.target);
          if (!source || !target) return null;
          return {
            ...edge,
            id: nanoid(),
            source,
            target
          } satisfies ScatterEdge;
        })
        .filter((edge): edge is ScatterEdge => Boolean(edge));

      commitCanvasChange({
        nodes: [...nodes.map((node) => ({ ...node, selected: false })), ...pastedNodes],
        edges: [...edges, ...pastedEdges]
      });
      setSelectedNodeId(pastedNodes[0]?.id ?? null);
      setStatus(t("status.pastedNodes", { count: pastedNodes.length }));
      return true;
    },
    [commitCanvasChange, edges, nodes, project, setSelectedNodeId, setStatus, t]
  );

  const addFilesToNode = useCallback(
    async (nodeId: string, files: FileList | File[], source: "upload" | "drop" | "paste") => {
      if (!project) return;
      try {
        const inputs = await filesToInputs(files, source);
        const attachments = await canvasightApi.saveAttachments(project.path, inputs);
        appendAttachments(nodeId, attachments);
        setStatus(t("status.attachmentsAdded", { count: attachments.length }));
      } catch (error) {
        setStatus(error instanceof Error ? error.message : t("status.addAttachmentFailed"));
      }
    },
    [appendAttachments, project, setStatus, t]
  );

  const chooseFilesForNode = useCallback(
    async (nodeId: string) => {
      const input = document.createElement("input");
      input.type = "file";
      input.multiple = true;
      input.onchange = () => {
        if (input.files?.length) void addFilesToNode(nodeId, input.files, "upload");
      };
      input.click();
    },
    [addFilesToNode]
  );

  const persistTemplate = useCallback(
    async (input: NodeTemplateInput, options: { replaceOldest?: boolean } = {}) => {
      try {
        const template = await canvasightApi.saveTemplate(input, options);
        setTemplates((current) => [template, ...current.filter((item) => item.id !== template.id)]);
        setDrawer("templates");
        setStatus(t("status.templateSaved"));
        setTemplateLimitRequest(null);
      } catch (error) {
        if (isTemplateLimitError(error)) {
          setDrawer("templates");
          setTemplateLimitRequest(input);
          setStatus(t("status.templateLimitReached", { max: nodeTemplateLimit }));
          return;
        }
        setStatus(t("status.templateSaveFailed"));
      }
    },
    [setDrawer, setStatus, t]
  );

  const saveNodeAsTemplate = useCallback(
    async (_nodeId: string, data: ScatterNodeData) => {
      const body = data.body.trim();
      if (!body) {
        setStatus(t("status.templateSaveEmpty"));
        return;
      }

      const input: NodeTemplateInput = {
        title: data.title.trim() || body.slice(0, 40),
        body,
        attachments: data.attachments.map((attachment) => ({ ...attachment }))
      };

      if (templates.length >= nodeTemplateLimit) {
        setDrawer("templates");
        setTemplateLimitRequest(input);
        setStatus(t("status.templateLimitReached", { max: nodeTemplateLimit }));
        return;
      }

      await persistTemplate(input);
    },
    [persistTemplate, setDrawer, setStatus, t, templates.length]
  );

  const replaceOldestTemplate = useCallback(() => {
    if (!templateLimitRequest) return;
    void persistTemplate(templateLimitRequest, { replaceOldest: true });
  }, [persistTemplate, templateLimitRequest]);

  const requestDeleteTemplate = useCallback(
    (templateId: string) => {
      const template = templates.find((item) => item.id === templateId);
      setDeleteTemplateRequest({
        id: templateId,
        title: template?.title || t("drawer.unnamedTemplate")
      });
    },
    [t, templates]
  );

  const deleteTemplate = useCallback(
    async (templateId: string) => {
      try {
        await canvasightApi.deleteTemplate(templateId);
        setTemplates((current) => current.filter((template) => template.id !== templateId));
        setDeleteTemplateRequest(null);
        setStatus(t("status.templateDeleted"));
      } catch {
        setStatus(t("status.templateDeleteFailed"));
      }
    },
    [setStatus, t]
  );

  const insertTemplateAtPosition = useCallback(
    (template: NodeTemplate, position: FlowPosition) => {
      if (!project) return;
      const node = nodeFromTemplate(template, roundPosition(position), nodes.length);
      commitCanvasChange({
        nodes: [...nodes.map((item) => ({ ...item, selected: false })), node]
      });
      setSelectedNodeId(node.id);
      setStatus(t("status.templateInserted"));
    },
    [commitCanvasChange, nodes, project, setSelectedNodeId, setStatus, t]
  );

  const templateFromDragEvent = useCallback(
    (event: DragEvent<HTMLElement>) => {
      const templateId = event.dataTransfer.getData(templateDragMime);
      return draggingTemplateRef.current ?? templates.find((template) => template.id === templateId) ?? null;
    },
    [templates]
  );

  const handleTemplateDragStart = useCallback((template: NodeTemplate, event: DragEvent<HTMLElement>) => {
    draggingTemplateRef.current = template;
    event.dataTransfer.effectAllowed = "copy";
    event.dataTransfer.setData(templateDragMime, template.id);
    event.dataTransfer.setData("text/plain", template.title || template.body.slice(0, 80));
    setTemplateDragImage(event, template);
  }, []);

  const handleTemplateDragEnd = useCallback(() => {
    draggingTemplateRef.current = null;
  }, []);

  const handleCanvasDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      const template = templateFromDragEvent(event);
      if (template) {
        event.preventDefault();
        draggingTemplateRef.current = null;
        const flowPosition = flowInstanceRef.current?.screenToFlowPosition({
          x: event.clientX,
          y: event.clientY
        });
        if (!flowPosition) return;
        insertTemplateAtPosition(template, {
          x: flowPosition.x - taskNodeWidth / 2,
          y: flowPosition.y - taskNodeHeight / 2
        });
        return;
      }

      if (!selectedNode || !event.dataTransfer.files.length) return;
      event.preventDefault();
      void addFilesToNode(selectedNode.id, event.dataTransfer.files, "drop");
    },
    [addFilesToNode, insertTemplateAtPosition, selectedNode, templateFromDragEvent]
  );

  const handleCanvasDragOver = useCallback((event: DragEvent<HTMLDivElement>) => {
    if (draggingTemplateRef.current || Array.from(event.dataTransfer.types).includes(templateDragMime)) {
      event.preventDefault();
      event.dataTransfer.dropEffect = "copy";
      return;
    }

    event.preventDefault();
  }, []);

  useEffect(() => {
    function handleCopy(event: ClipboardEvent): void {
      if (!project || event.defaultPrevented || isEditableTarget(event.target)) return;
      if (!copySelectedNodes(event.clipboardData)) return;
      event.preventDefault();
    }

    window.addEventListener("copy", handleCopy, true);
    return () => window.removeEventListener("copy", handleCopy, true);
  }, [copySelectedNodes, project]);

  useEffect(() => {
    function handlePaste(event: ClipboardEvent): void {
      if (!project || event.defaultPrevented) return;
      const target = event.target instanceof Element ? event.target : null;
      if (!isEditableTarget(target)) {
        const serializedPayload = event.clipboardData?.getData(canvasClipboardMime) || event.clipboardData?.getData("text/plain") || "";
        const payload = parseCanvasClipboardPayload(serializedPayload);
        if (payload) {
          event.preventDefault();
          canvasClipboardRef.current = payload;
          clipboardPasteSerialRef.current = 0;
          pasteCanvasClipboard(payload);
          return;
        }
      }

      const files = clipboardImageFiles(event.clipboardData);
      if (!files.length) return;

      const targetNodeId = nodeIdFromElementTarget(target);
      const documentLevelTarget = !target || target === document.body || target === document.documentElement;
      const canvasTarget = documentLevelTarget || Boolean(canvasShellRef.current?.contains(target));
      const nodeId = targetNodeId ?? (canvasTarget ? selectedNodeId : null);
      if (!nodeId || !nodes.some((node) => node.id === nodeId)) return;

      event.preventDefault();
      void addFilesToNode(nodeId, files, "paste");
    }

    window.addEventListener("paste", handlePaste, true);
    return () => window.removeEventListener("paste", handlePaste, true);
  }, [addFilesToNode, nodes, pasteCanvasClipboard, project, selectedNodeId]);

  const runNode = useCallback(
    async (nodeId: string, _mode: RunMode = "flow") => {
      if (!project) return;
      const node = nodes.find((item) => item.id === nodeId);
      if (!node) return;
      const mode: RunMode = "flow";
      const result = buildMarkdown(nodes, edges, nodeId, mode, project.name, project.path, language, agentTeamEnabled);
      if (result.nodes.every((item) => item.data.body.trim().length === 0)) {
        setRunStatus(t("status.cannotSendEmpty"), "negative");
        return;
      }

      const threadName = `Canvasight Flow: ${node.data.title || "Untitled"}`;
      const runPayload = {
        attachments: result.attachments,
        agentTeam: result.agentTeam,
        effort: node.data.effort || "xhigh",
        imagePaths: result.imagePaths,
        markdown: result.markdown,
        nodeIds: result.nodes.map((item) => item.id),
        projectPath: project.path,
        runMode: mode,
        sessionId: canvasightApi.sessionId,
        threadName
      };
      setRunStatus(t("status.sendingAssistant"), "loading");
      try {
        await canvasightApi.runCanvasightNode(runPayload);
        markNodeRun(nodeId, mode);
        setSelectedRunMode(mode);
        setRunStatus(t("status.sentAssistant"), "positive");
      } catch (error) {
        const message = error instanceof Error ? error.message : t("status.sendAssistantFailed");
        const actionableMessage = message.includes("reason=browser_fallback_no_bridge")
          ? t("status.browserFallbackNoBridge")
          : message;
        setRunStatus(actionableMessage, "negative");
      }
    },
    [agentTeamEnabled, edges, language, markNodeRun, nodes, project, setRunStatus, t]
  );

  useEffect(() => {
    setTaskNodeActions({
      addFilesToNode,
      beginNodeEdit: () => undefined,
      chooseFilesForNode,
      commitNodeEdit: () => undefined,
      createConnectedNode,
      deleteNode,
      duplicateNode,
      listSkills: async (forceReload = false) => {
        if (!project?.path) throw new Error("Canvasight project is not ready for Skill discovery.");
        const response = await canvasightApi.listSkills(project.path, forceReload);
        return response.skills;
      },
      removeAttachment,
      runNode,
      saveNodeAsTemplate,
      setNodeHover: (nodeId: string, hovered: boolean) => setHoveredNodeId((current) => (hovered ? nodeId : current === nodeId ? null : current)),
      updateNodeData: (nodeId: string, patch: Partial<ScatterNodeData>) => updateNodeData(nodeId, patch)
    });
  }, [addFilesToNode, chooseFilesForNode, createConnectedNode, deleteNode, duplicateNode, project?.path, removeAttachment, runNode, saveNodeAsTemplate, updateNodeData]);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      const currentNodes = useScatterStore.getState().nodes;
      const nextNodes = applyNodeChanges(changes, currentNodes as Node[]) as ScatterNode[];
      commitCanvasChange({ nodes: nextNodes });
      const selected = nextNodes.find((node) => node.selected)?.id ?? null;
      if (selected !== selectedNodeId) setSelectedNodeId(selected);
    },
    [commitCanvasChange, selectedNodeId, setSelectedNodeId]
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      const nextEdges = applyEdgeChanges(changes, renderedEdges);
      commitCanvasChange({ edges: storeEdges(nextEdges) });
    },
    [commitCanvasChange, renderedEdges]
  );

  const commitExistingConnection = useCallback(
    (connection: Pick<ScatterEdge, "source" | "target">, selectedNodeIdAfterCommit: string) => {
      if (!isConnectionAllowed(connection, edges)) return false;

      commitCanvasChange({
        nodes: nodes.map((node) => ({ ...node, selected: node.id === selectedNodeIdAfterCommit })),
        edges: [...edges, { id: nanoid(), source: connection.source, target: connection.target }]
      });
      setSelectedNodeId(selectedNodeIdAfterCommit);
      return true;
    },
    [commitCanvasChange, edges, nodes, setSelectedNodeId]
  );

  const isValidConnection = useCallback(
    (connection: Edge | Connection) => {
      return isConnectionAllowed({ source: connection.source, target: connection.target }, edges);
    },
    [edges]
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      const didCommit = commitExistingConnection({ source: connection.source, target: connection.target }, connection.target);
      connectionSucceededRef.current = didCommit;
      if (didCommit) clearConnectionHoverTarget();
    },
    [clearConnectionHoverTarget, commitExistingConnection]
  );

  const handleConnectStart = useCallback<OnConnectStart>(
    (_event, params) => {
      setIsConnecting(true);
      connectionSucceededRef.current = false;
      clearConnectionHoverTarget();

      if (!params.nodeId || !params.handleType) {
        connectionStartRef.current = null;
        return;
      }

      const hasExistingParent = params.handleType === "target" && edges.some((edge) => edge.target === params.nodeId);
      if (hasExistingParent) {
        connectionStartRef.current = null;
        return;
      }

      connectionStartRef.current = {
        nodeId: params.nodeId,
        handleType: params.handleType
      };
      setSelectedNodeId(params.nodeId);
      replaceCanvasLive({ nodes: nodes.map((node) => ({ ...node, selected: node.id === params.nodeId })) });
    },
    [clearConnectionHoverTarget, edges, nodes, replaceCanvasLive, setSelectedNodeId]
  );

  const handleConnectEnd = useCallback<OnConnectEnd>(
    (event, connectionState) => {
      setIsConnecting(false);

      const connectionStart = connectionStartRef.current;
      const connectedSuccessfully = connectionSucceededRef.current || connectionState.isValid === true;
      const hoveredNodeId = connectionHoverTargetRef.current?.hoveredNodeId ?? nodeIdFromConnectionEvent(event);
      connectionStartRef.current = null;
      connectionSucceededRef.current = false;
      clearConnectionHoverTarget();

      if (connectedSuccessfully || !project || !connectionStart) return;

      if (hoveredNodeId) {
        const hoveredConnection = connectionFromStart(connectionStart, hoveredNodeId);
        if (hoveredConnection) {
          commitExistingConnection(hoveredConnection, hoveredNodeId);
        }
        return;
      }

      if (connectionState.toHandle || connectionState.toNode) return;

      const clientPosition = eventClientPosition(event);
      const canvasRect = canvasShellRef.current?.getBoundingClientRect();
      if (!clientPosition || !canvasRect) return;
      const isInsideCanvas =
        clientPosition.x >= canvasRect.left &&
        clientPosition.x <= canvasRect.right &&
        clientPosition.y >= canvasRect.top &&
        clientPosition.y <= canvasRect.bottom;
      if (!isInsideCanvas) return;

      const flowPosition = flowInstanceRef.current?.screenToFlowPosition(clientPosition);
      if (!flowPosition) return;

      const sourceNode = nodes.find((node) => node.id === connectionStart.nodeId);
      if (!sourceNode) return;

      const nodePosition = findConnectionDropPosition(flowPosition, connectionStart.handleType, sourceNode, nodes);
      const newNode = emptyNode(nodePosition, nodes.length);
      const newEdge =
        connectionStart.handleType === "source"
          ? { id: nanoid(), source: sourceNode.id, target: newNode.id }
          : { id: nanoid(), source: newNode.id, target: sourceNode.id };

      commitCanvasChange({
        nodes: [...nodes.map((node) => ({ ...node, selected: false })), newNode],
        edges: [...edges, newEdge]
      });
      setSelectedNodeId(newNode.id);
    },
    [clearConnectionHoverTarget, commitCanvasChange, commitExistingConnection, edges, nodes, project, setSelectedNodeId]
  );

  const handleNodeMouseEnter = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      setHoveredNodeId(node.id);

      const connectionStart = connectionStartRef.current;
      if (!connectionStart) return;

      const hoverConnection = connectionFromStart(connectionStart, node.id);
      if (!hoverConnection || !isConnectionAllowed(hoverConnection, edges)) {
        clearConnectionHoverTarget();
        return;
      }

      updateConnectionHoverTarget({
        sourceId: hoverConnection.source,
        targetId: hoverConnection.target,
        hoveredNodeId: node.id
      });
    },
    [clearConnectionHoverTarget, edges, updateConnectionHoverTarget]
  );

  const handleNodeMouseLeave = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      setHoveredNodeId((current) => (current === node.id ? null : current));

      if (connectionHoverTargetRef.current?.hoveredNodeId === node.id) {
        clearConnectionHoverTarget();
      }
    },
    [clearConnectionHoverTarget]
  );

  const fitCanvas = useCallback(() => {
    flowInstanceRef.current?.fitView({ padding: 0.24 });
  }, []);

  const handleMoveStart = useCallback<OnMove>((event) => {
    if (!event) return;
    viewportInteractionGenerationRef.current += 1;
    viewportInteractionActiveRef.current = true;
  }, []);

  const handleMove = useCallback<OnMove>((_event, viewport) => {
    if (!Number.isFinite(viewport.zoom)) return;
    setViewportZoom(Math.max(canvasMinZoom, Math.min(canvasMaxZoom, viewport.zoom)));
  }, []);

  const handleMoveEnd = useCallback<OnMove>(
    (event, viewport) => {
      if (hydratedRef.current && !suppressViewportPersistenceRef.current && [viewport.x, viewport.y, viewport.zoom].every(Number.isFinite)) {
        setActivePageViewport({
          x: viewport.x,
          y: viewport.y,
          zoom: Math.max(canvasMinZoom, Math.min(canvasMaxZoom, viewport.zoom))
        });
      }
      if (event) viewportInteractionActiveRef.current = false;
    },
    [setActivePageViewport]
  );

  const runActiveNode = useCallback(() => {
    if (!selectedNode) return;
    void runNode(selectedNode.id, "flow");
  }, [runNode, selectedNode]);

  const toggleTasksDrawer = useCallback(() => {
    if (!project) return;
    setDrawer(drawer === "tasks" ? null : "tasks");
  }, [drawer, project, setDrawer]);

  const toggleTemplatesDrawer = useCallback(() => {
    if (!project) return;
    setDrawer(drawer === "templates" ? null : "templates");
  }, [drawer, project, setDrawer]);

  const toggleMarkdownDrawer = useCallback(() => {
    if (!project) return;
    if (drawer === "markdown") {
      setDrawer(null);
      return;
    }

    const nextMarkdownNodeId = selectedNode?.id ?? markdownNode?.id;
    if (!nextMarkdownNodeId) return;
    setMarkdownNodeId(nextMarkdownNodeId);
    setDrawer("markdown");
  }, [drawer, markdownNode, project, selectedNode, setDrawer]);

  useEffect(() => {
    function isSpaceKey(event: KeyboardEvent): boolean {
      return event.code === "Space" || event.key === " ";
    }

    function handleKeyDown(event: KeyboardEvent): void {
      if (isEditableTarget(event.target)) return;

      if (isSpaceKey(event)) {
        event.preventDefault();
        setSpacePanActive(true);
        return;
      }

      const key = event.key.toLowerCase();
      const hasPrimaryModifier = event.metaKey || event.ctrlKey;
      if (project && !hasPrimaryModifier && !event.altKey && !event.shiftKey && (event.key === "Backspace" || event.key === "Delete")) {
        if (deleteSelectedNodes()) {
          event.preventDefault();
          return;
        }
      }

      if (hasPrimaryModifier && !event.altKey) {
        if (key === "z") {
          event.preventDefault();
          if (event.shiftKey) redo();
          else undo();
          return;
        }

        if (project && !event.shiftKey && key === "c") {
          if (copySelectedNodes()) {
            event.preventDefault();
            return;
          }
        }

        if (project && !event.shiftKey && event.key === "Enter") {
          event.preventDefault();
          runActiveNode();
          return;
        }

        if (project && !event.shiftKey && key === "n") {
          event.preventDefault();
          addNode();
          return;
        }

        if (project && !event.shiftKey && key === "0") {
          event.preventDefault();
          fitCanvas();
          return;
        }

        if (project && event.shiftKey && key === "t") {
          event.preventDefault();
          toggleTasksDrawer();
          return;
        }

        if (project && event.shiftKey && key === "l") {
          event.preventDefault();
          toggleTemplatesDrawer();
          return;
        }

        if (project && event.shiftKey && key === "m") {
          event.preventDefault();
          toggleMarkdownDrawer();
          return;
        }
      }

      if (!hasPrimaryModifier && !event.altKey && !event.shiftKey) {
        if (key === "v") {
          event.preventDefault();
          setCanvasTool("select");
          return;
        }

        if (key === "h") {
          event.preventDefault();
          setCanvasTool("pan");
        }
      }
    }

    function handleKeyUp(event: KeyboardEvent): void {
      if (!isSpaceKey(event)) return;
      event.preventDefault();
      setSpacePanActive(false);
    }

    function resetSpacePan(): void {
      setSpacePanActive(false);
    }

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("blur", resetSpacePan);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("blur", resetSpacePan);
    };
  }, [addNode, copySelectedNodes, deleteSelectedNodes, fitCanvas, project, redo, runActiveNode, toggleMarkdownDrawer, toggleTasksDrawer, toggleTemplatesDrawer, undo]);

  return (
    <div
      className="canvasight-app app-shell is-sidebar-collapsed"
      onMouseMove={(event) => {
        latestMouseRef.current = { x: event.clientX, y: event.clientY };
        const targetNodeId = nodeIdFromElementTarget(event.target);
        setHoveredNodeId((current) => (current === targetNodeId ? current : targetNodeId));
      }}
      onMouseLeave={() => setHoveredNodeId(null)}
    >
      {nativeWidget && (startupStage !== "ready" || startupFailure) ? (
        <div className="canvasight-startup-overlay">
          {startupFailure ? (
            <StartupFailurePanel
              stage={startupFailure.stage}
              reason={startupFailure.reason}
              diagnostics={[
                `stage=${startupFailure.stage}`,
                `reason=${startupFailure.reason}`,
                `sessionId=${canvasightApi.sessionId}`,
                `threadId=${threadIdFromUrl()}`,
                `openAttemptId=${getCanvasightStartupIdentity().openAttemptId}`,
                `widgetInstanceId=${getCanvasightStartupIdentity().widgetInstanceId}`,
                `displayMode=${getCanvasightStartupIdentity().displayMode}`
              ].join("\n")}
              onRetry={() => window.location.reload()}
              onReopenInNewTask={reopenCanvasightInNewTask}
            />
          ) : (
            <WorkspaceStartupSkeleton
              stage={startupStage === "failed" || startupStage === "ready" ? "starting" : startupStage}
              label={
                startupStage === "starting"
                  ? "Starting Canvasight..."
                  : startupStage === "connecting_bridge"
                    ? "Connecting Canvasight bridge..."
                    : startupStage === "connecting_session"
                      ? "Connecting Canvasight session..."
                      : "Loading Canvasight project..."
              }
            />
          )}
        </div>
      ) : null}
      <main
        className="workspace-content"
      >
        <section
          ref={canvasShellRef}
          className={`canvas-shell ${isConnecting ? "is-connecting" : ""} ${connectionPreview ? "has-connection-preview" : ""}`}
          onDrop={handleCanvasDrop}
          onDragOver={handleCanvasDragOver}
        >
          {project ? (
            <>
              <div className="canvas-page-toolbar" aria-label={t("page.toolbar")}>
                {renamingPage ? (
                  <input
                    ref={pageNameInputRef}
                    className="canvas-page-name-input"
                    value={pageNameDraft}
                    autoFocus
                    aria-label={t("page.rename")}
                    onChange={(event) => setPageNameDraft(event.currentTarget.value)}
                    onFocus={(event) => event.currentTarget.select()}
                    onBlur={commitRenamePage}
                    onKeyDown={(event) => {
                      event.stopPropagation();
                      if (event.key === "Enter") {
                        event.preventDefault();
                        commitRenamePage();
                      }
                      if (event.key === "Escape") {
                        event.preventDefault();
                        cancelRenamePage();
                      }
                    }}
                  />
                ) : (
                  <RadixDropdownMenu.Root>
                    <TooltipAnchor
                      className="canvas-page-trigger-tooltip"
                      label={activePageName}
                      side="bottom"
                      align="start"
                      tooltipClassName="kit-tooltip-wrap"
                    >
                      <RadixDropdownMenu.Trigger asChild>
                        <button className="canvas-page-trigger" type="button" aria-label={`${t("page.switch")}: ${activePageName}`}>
                          <Icon name="stack" size={16} />
                          <span className="canvas-page-trigger-label">{activePageName}</span>
                          <Icon name="chevron-down" size={16} />
                        </button>
                      </RadixDropdownMenu.Trigger>
                    </TooltipAnchor>
                    <RadixDropdownMenu.Portal>
                      <RadixDropdownMenu.Content className="canvas-page-popover" side="bottom" sideOffset={8} align="start">
                        <DropdownMenu className="canvas-page-menu" role="menu">
                          {pages.map((page) => (
                            <TooltipAnchor
                              key={page.id}
                              className="canvas-page-menu-tooltip"
                              label={page.name}
                              side="right"
                              align="center"
                              tooltipClassName="kit-tooltip-wrap"
                            >
                              <RadixDropdownMenu.Item asChild>
                                <DropdownMenuItem
                                  icon="notebook"
                                  label={page.name}
                                  selected={page.id === activePageId}
                                  role="menuitemradio"
                                  aria-checked={page.id === activePageId}
                                  onClick={() => setActivePageId(page.id)}
                                />
                              </RadixDropdownMenu.Item>
                            </TooltipAnchor>
                          ))}
                          <span className="canvas-page-menu-divider" aria-hidden />
                          <RadixDropdownMenu.Item asChild>
                            <DropdownMenuItem icon="plus-lg" label={t("page.new")} onClick={handleCreatePage} />
                          </RadixDropdownMenu.Item>
                        </DropdownMenu>
                      </RadixDropdownMenu.Content>
                    </RadixDropdownMenu.Portal>
                  </RadixDropdownMenu.Root>
                )}
                <TooltipAnchor label={t("page.new")} side="bottom" align="start">
                  <IconButton className="canvas-page-button" filled={false} icon="plus-lg" size="lg" aria-label={t("page.new")} onClick={handleCreatePage} />
                </TooltipAnchor>
                <RadixDropdownMenu.Root>
                  <RadixDropdownMenu.Trigger asChild>
                    <IconButton className="canvas-page-button" filled={false} icon="dots-horizontal" size="lg" aria-label={t("page.more")} />
                  </RadixDropdownMenu.Trigger>
                  <RadixDropdownMenu.Portal>
                    <RadixDropdownMenu.Content className="canvas-page-popover" side="bottom" sideOffset={8} align="start">
                      <DropdownMenu className="canvas-page-menu" role="menu">
                        <RadixDropdownMenu.Item asChild>
                          <DropdownMenuItem icon="edit" label={t("page.rename")} onClick={beginRenamePage} />
                        </RadixDropdownMenu.Item>
                        <RadixDropdownMenu.Item asChild disabled={!canDeletePage}>
                          <DropdownMenuItem icon="trash" label={t("page.delete")} disabled={!canDeletePage} onClick={handleDeletePage} />
                        </RadixDropdownMenu.Item>
                      </DropdownMenu>
                    </RadixDropdownMenu.Content>
                  </RadixDropdownMenu.Portal>
                </RadixDropdownMenu.Root>
              </div>
              <ReactFlow
                nodes={nodes as Node[]}
                edges={renderedEdges}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                connectionLineComponent={ScatterConnectionLine}
                defaultEdgeOptions={defaultEdgeOptions}
                proOptions={proOptions}
                defaultViewport={activePage?.viewport}
                minZoom={canvasMinZoom}
                maxZoom={canvasMaxZoom}
                connectOnClick={false}
                deleteKeyCode={null}
                disableKeyboardA11y
                isValidConnection={isValidConnection}
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
                onConnect={onConnect}
                onConnectEnd={handleConnectEnd}
                onConnectStart={handleConnectStart}
                onEdgesChange={onEdgesChange}
                onInit={(instance) => {
                  flowInstanceRef.current = instance;
                }}
                onMove={handleMove}
                onMoveEnd={handleMoveEnd}
                onMoveStart={handleMoveStart}
                onNodeClick={(_event, node) => selectNode(node.id, selectedRunMode)}
                onNodeMouseEnter={handleNodeMouseEnter}
                onNodeMouseLeave={handleNodeMouseLeave}
                onNodesChange={onNodesChange}
                onPaneClick={() => selectNode(null)}
              >
                <Background gap={28} size={1} color="rgba(125, 125, 125, 0.22)" />
              </ReactFlow>
              <div className="canvas-run-toolbar" aria-label={t("topbar.windowActions")}>
                <TooltipAnchor label={t("topbar.runCurrentTask")} shortcut={shortcuts.runCurrentTask} side="bottom" align="end">
                  <IconButton
                    className="canvas-toolbar-button"
                    filled={false}
                    icon="topbar-play"
                    size="lg"
                    aria-label={t("topbar.runCurrentTask")}
                    disabled={!canRun}
                    onClick={runActiveNode}
                  />
                </TooltipAnchor>
                <TooltipAnchor label={t("topbar.taskList")} shortcut={shortcuts.taskList} side="bottom" align="end">
                  <IconButton
                    className={`canvas-toolbar-button ${drawer === "tasks" ? "is-selected" : ""}`}
                    filled={false}
                    icon="topbar-list"
                    size="lg"
                    aria-label={t("topbar.taskList")}
                    aria-pressed={drawer === "tasks"}
                    onClick={toggleTasksDrawer}
                  />
                </TooltipAnchor>
                <TooltipAnchor label={t("topbar.templates")} shortcut={shortcuts.openTemplates} side="bottom" align="end">
                  <IconButton
                    className={`canvas-toolbar-button ${drawer === "templates" ? "is-selected" : ""}`}
                    filled={false}
                    icon="book-bookmark"
                    size="lg"
                    aria-label={t("topbar.templates")}
                    aria-pressed={drawer === "templates"}
                    onClick={toggleTemplatesDrawer}
                  />
                </TooltipAnchor>
                <TooltipAnchor label={t("topbar.openMarkdown")} shortcut={shortcuts.openMarkdown} side="bottom" align="end">
                  <IconButton
                    className={`canvas-toolbar-button ${drawer === "markdown" ? "is-selected" : ""}`}
                    filled={false}
                    icon="topbar-sidebar-right-expand"
                    size="lg"
                    aria-label={t("topbar.openMarkdown")}
                    aria-pressed={drawer === "markdown"}
                    disabled={!canToggleMarkdown}
                    onClick={toggleMarkdownDrawer}
                  />
                </TooltipAnchor>
              </div>
              <div className="canvas-actions" aria-label={t("canvas.actions")}>
                <TooltipAnchor label={t("canvas.fit")} shortcut={shortcuts.fitCanvas} side="right">
                  <IconButton className="canvas-tool-button" filled={false} icon="map-pin" size="lg" aria-label={t("canvas.fit")} onClick={fitCanvas} />
                </TooltipAnchor>
                <TooltipAnchor label={t("canvas.undo")} shortcut={shortcuts.undo} side="right">
                  <IconButton className="canvas-tool-button" filled={false} icon="undo" size="lg" aria-label={t("canvas.undo")} disabled={!canUndo} onClick={undo} />
                </TooltipAnchor>
                <TooltipAnchor label={t("canvas.redo")} shortcut={shortcuts.redo} side="right">
                  <IconButton className="canvas-tool-button" filled={false} icon="redo" size="lg" aria-label={t("canvas.redo")} disabled={!canRedo} onClick={redo} />
                </TooltipAnchor>
                <TooltipAnchor label={t("sidebar.settings")} side="right">
                  <IconButton className="canvas-tool-button" filled={false} icon="settings-cog" size="lg" aria-label={t("sidebar.settings")} onClick={onOpenSettings} />
                </TooltipAnchor>
              </div>
              <div className="canvas-toolbar" aria-label={t("canvas.tools")}>
                <TooltipAnchor label={t("canvas.addNode")} shortcut={shortcuts.addNode}>
                  <IconButton className="canvas-toolbar-button" filled={false} icon="plus-lg" size="lg" aria-label={t("canvas.addNode")} onClick={addNode} />
                </TooltipAnchor>
                <span className="canvas-toolbar-divider" />
                <TooltipAnchor label={t("canvas.selectTool")} shortcut={shortcuts.selectTool}>
                  <IconButton
                    className={`canvas-toolbar-button ${canvasTool === "select" && !spacePanActive ? "is-selected" : ""}`}
                    filled={false}
                    icon="work-with-apps"
                    size="lg"
                    aria-label={t("canvas.selectTool")}
                    aria-pressed={canvasTool === "select" && !spacePanActive}
                    onClick={() => setCanvasTool("select")}
                  />
                </TooltipAnchor>
                <TooltipAnchor label={t("canvas.panTool")} shortcut={shortcuts.panTool}>
                  <IconButton
                    className={`canvas-toolbar-button ${panModeActive ? "is-selected" : ""}`}
                    filled={false}
                    icon="hand-raised"
                    size="lg"
                    aria-label={t("canvas.panTool")}
                    aria-pressed={panModeActive}
                    onClick={() => setCanvasTool("pan")}
                  />
                </TooltipAnchor>
                <span className="canvas-toolbar-divider" />
                <TooltipAnchor label={t("canvas.zoom")}>
                  <RadixDropdownMenu.Root>
                    <RadixDropdownMenu.Trigger asChild>
                      <button className="canvas-zoom-trigger" type="button" aria-label={t("canvas.zoom")}>
                        <span>{zoomPercent}%</span>
                        <Icon name="chevron-down" size={16} />
                      </button>
                    </RadixDropdownMenu.Trigger>
                    <RadixDropdownMenu.Portal>
                      <RadixDropdownMenu.Content className="canvas-zoom-popover" side="top" sideOffset={8} align="end">
                        <DropdownMenu className="canvas-zoom-menu" role="menu">
                          {zoomOptions.map((option) => (
                            <RadixDropdownMenu.Item key={option.value} asChild>
                              <DropdownMenuItem
                                label={option.label}
                                selected={Math.abs(viewportZoom - option.value) < 0.01}
                                role="menuitemradio"
                                aria-checked={Math.abs(viewportZoom - option.value) < 0.01}
                                onClick={() => {
                                  viewportInteractionGenerationRef.current += 1;
                                  setViewportZoom(option.value);
                                  void flowInstanceRef.current?.zoomTo(option.value);
                                }}
                              />
                            </RadixDropdownMenu.Item>
                          ))}
                        </DropdownMenu>
                      </RadixDropdownMenu.Content>
                    </RadixDropdownMenu.Portal>
                  </RadixDropdownMenu.Root>
                </TooltipAnchor>
              </div>
            </>
          ) : (
            <div className="empty-workspace canvasight-empty">
              <p>{loadingProject ? "Loading Canvasight..." : status || "Open Canvasight from a Codex project to create a workspace."}</p>
            </div>
          )}
        </section>

        <RightDrawer
          drawer={drawer}
          nodes={nodes}
          edges={edges}
          templates={templates}
          templateSearch={templateSearch}
          selectedNodeId={selectedNodeId}
          markdownNodeId={markdownNodeId}
          markdown={markdownResult.markdown}
          markdownAttachments={markdownResult.attachments}
          currentRunMode={selectedRunMode}
          onLocateNode={(nodeId, mode) => locateNode(nodeId, mode)}
          onSelectNode={(nodeId, mode) => selectNode(nodeId, mode)}
          onRunNode={(nodeId, mode) => void runNode(nodeId, mode)}
          onDeleteTemplate={requestDeleteTemplate}
          onTemplateSearchChange={setTemplateSearch}
          onTemplateDragStart={handleTemplateDragStart}
          onTemplateDragEnd={handleTemplateDragEnd}
        />
        <ConfirmDialog
          open={Boolean(deletePageRequest)}
          title={t("page.deleteDialogTitle")}
          description={t("page.deleteConfirm", { name: deletePageRequest?.name ?? t("page.untitled") })}
          cancelLabel={t("page.deleteCancel")}
          closeLabel={t("page.deleteClose")}
          confirmLabel={t("page.deleteConfirmAction")}
          onOpenChange={(open) => {
            if (!open) cancelDeletePage();
          }}
          onConfirm={confirmDeletePage}
        />
        <ConfirmDialog
          open={Boolean(templateLimitRequest)}
          title={t("templateLimit.title")}
          description={t("templateLimit.description", { max: nodeTemplateLimit })}
          cancelLabel={t("templateLimit.manage")}
          closeLabel={t("templateLimit.close")}
          confirmLabel={t("templateLimit.replaceOldest")}
          onCancel={() => {
            setDrawer("templates");
          }}
          onOpenChange={(open) => {
            if (!open) setTemplateLimitRequest(null);
          }}
          onConfirm={replaceOldestTemplate}
        />
        <ConfirmDialog
          open={Boolean(deleteTemplateRequest)}
          title={t("templateDelete.title")}
          description={t("templateDelete.description", { name: deleteTemplateRequest?.title ?? t("drawer.unnamedTemplate") })}
          cancelLabel={t("templateDelete.cancel")}
          closeLabel={t("templateDelete.close")}
          confirmLabel={t("templateDelete.confirm")}
          onOpenChange={(open) => {
            if (!open) setDeleteTemplateRequest(null);
          }}
          onConfirm={() => {
            if (deleteTemplateRequest) void deleteTemplate(deleteTemplateRequest.id);
          }}
        />
        {runFeedback ? (
          <ToastViewport className="canvas-run-toast-viewport">
            <Toast tone={runFeedback.tone} message={runFeedback.message} onClose={hideRunFeedback} />
          </ToastViewport>
        ) : null}
        {documentConflicts[0] ? (
          <ToastViewport className="canvas-document-conflict-viewport">
            <Toast
              tone="information"
              message={documentConflicts[0].message}
              actionLabel={t("status.viewAiPage")}
              onAction={() => {
                setActivePageId(documentConflicts[0].aiPageId);
                setDocumentConflicts((current) => current.slice(1));
              }}
              onClose={() => setDocumentConflicts((current) => current.slice(1))}
            />
          </ToastViewport>
        ) : null}
        {manualDocumentConflict && !documentConflicts[0] ? (
          <ToastViewport className="canvas-document-conflict-viewport">
            <Toast
              tone="information"
              message={manualDocumentConflict.message}
              actionLabel={manualDocumentConflict.originalPageId ? t("status.viewOriginalPage") : undefined}
              onAction={manualDocumentConflict.originalPageId
                ? () => {
                    setActivePageId(manualDocumentConflict.originalPageId as string);
                    setManualDocumentConflict(null);
                  }
                : undefined}
              onClose={() => setManualDocumentConflict(null)}
            />
          </ToastViewport>
        ) : null}
      </main>
    </div>
  );
}

function reopenCanvasightInNewTask(): void {
  void canvasightApi
    .sendFollowUpMessage({
      content: [
        {
          type: "text",
          text: "Create a new Codex task for this project and open Canvasight there using the verified native open flow."
        }
      ],
      prompt: "Create a new Codex task for this project and open Canvasight there using the verified native open flow."
    })
    .catch(() => window.location.reload());
}

export default function App(): ReactElement {
  const [savedSettings, setSavedSettings] = useState<AppSettings>(() => loadStoredAppSettings() ?? webDefaultAppSettings);
  const [previewSettings, setPreviewSettings] = useState<AppSettings | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [systemTheme, setSystemTheme] = useState<"light" | "dark">("light");
  const activeSettings = previewSettings ?? savedSettings;
  const resolvedTheme = activeSettings.themePreference === "system" ? systemTheme : activeSettings.themePreference;

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const updateSystemTheme = () => setSystemTheme(mediaQuery.matches ? "dark" : "light");
    updateSystemTheme();
    mediaQuery.addEventListener("change", updateSystemTheme);
    return () => mediaQuery.removeEventListener("change", updateSystemTheme);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = resolvedTheme;
    document.documentElement.dataset.translucent = "false";
  }, [resolvedTheme]);

  useEffect(() => {
    let cancelled = false;
    void canvasightApi
      .getPreferences()
      .then((preferences) => {
        if (cancelled) return;
        setSavedSettings((current) => {
          const next = normalizeAppSettings({
            ...current,
            aiSkillAssignmentEnabled: preferences.aiSkillAssignmentEnabled
          });
          saveStoredAppSettings(next);
          return next;
        });
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  const previewAppSettings = useCallback((values: AppSettings) => {
    const next = normalizeAppSettings(values);
    setPreviewSettings((current) => (settingsEqual(current, next) ? current : next));
  }, []);

  const saveAppSettings = useCallback(async (values: AppSettings) => {
    const next = normalizeAppSettings(values);
    await canvasightApi.savePreferences({ aiSkillAssignmentEnabled: next.aiSkillAssignmentEnabled });
    setSavedSettings(next);
    setPreviewSettings(null);
    saveStoredAppSettings(next);
  }, []);

  const handleSettingsOpenChange = useCallback((open: boolean) => {
    setSettingsOpen(open);
    if (!open) setPreviewSettings(null);
  }, []);

  return (
    <CanvasightErrorBoundary
      onError={(error) => void canvasightApi.reportWidgetFailure(error, "react_render")}
      onRetry={() => window.location.reload()}
      onReopenInNewTask={reopenCanvasightInNewTask}
    >
      <I18nProvider language={activeSettings.language}>
        <ReactFlowProvider>
          <CanvasightWorkspace
            agentTeamEnabled={activeSettings.agentTeamEnabled}
            onOpenSettings={() => setSettingsOpen(true)}
          />
        </ReactFlowProvider>
        <SettingsDialog
          agentTeamEnabled={activeSettings.agentTeamEnabled}
          aiSkillAssignmentEnabled={activeSettings.aiSkillAssignmentEnabled}
          assistantProvider={activeSettings.assistantProvider}
          assistantProviderOnboardingCompleted={activeSettings.assistantProviderOnboardingCompleted}
          language={activeSettings.language}
          open={settingsOpen}
          showTranslucentBackground={false}
          themePreference={activeSettings.themePreference}
          translucentBackground={false}
          onOpenChange={handleSettingsOpenChange}
          onPreview={previewAppSettings}
          onSave={saveAppSettings}
        />
      </I18nProvider>
    </CanvasightErrorBoundary>
  );
}
