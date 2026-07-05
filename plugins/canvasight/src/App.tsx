import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactElement } from "react";
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
import type {
  AttachmentInput,
  LanguagePreference,
  RunMode,
  ScatterDocument,
  ScatterEdge,
  ScatterNode,
  ScatterNodeData,
  ScatterProjectInfo
} from "../shared/types";
import { canvasightApi } from "./lib/canvasightApi";
import { buildMarkdown } from "./lib/markdown";
import { I18nProvider, useI18n } from "./lib/i18n";
import { shortcuts } from "./lib/shortcuts";
import { ScatterEdge as ScatterFlowEdge } from "./components/ScatterEdge";
import { RightDrawer } from "./components/RightDrawer";
import { TaskNode, setTaskNodeActions } from "./components/TaskNode";
import { DropdownMenu, DropdownMenuItem } from "./components/ui/dropdown-menu";
import { Icon } from "./components/ui/icon";
import { IconButton } from "./components/ui/icon-button";
import { TooltipAnchor } from "./components/ui/tooltip";
import { useScatterStore } from "./store/scatterStore";
import "@xyflow/react/dist/style.css";
import "./styles/app.css";

const nodeTypes = { task: TaskNode } satisfies NodeTypes;
const edgeTypes = { scatter: ScatterFlowEdge } satisfies EdgeTypes;
const defaultEdgeOptions = { type: "scatter" };
const proOptions = { hideAttribution: true };
const saveDebounceMs = 450;
const taskNodeWidth = 400;
const taskNodeHeight = 220;
const taskNodeHorizontalGap = 180;
const taskNodeVerticalGap = 72;
const nodeConnectButtonSize = 20;
const connectionPreviewEdgeId = "__canvasight-connection-preview__";
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
type ConnectionStart = {
  nodeId: string;
  handleType: "source" | "target";
};
type ConnectionHoverTarget = {
  sourceId: string;
  targetId: string;
  hoveredNodeId: string;
};
type PanelRatios = {
  canvas: number;
  markdown: number;
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

function defaultProjectPathFromBrowser(): string {
  return import.meta.env.VITE_CANVASIGHT_DEFAULT_PROJECT_PATH?.trim() || "";
}

function emptyDocument(projectPath: string): ScatterDocument {
  return {
    version: 1,
    projectName: projectNameFromPath(projectPath),
    updatedAt: new Date().toISOString(),
    viewport: { x: 0, y: 0, zoom: 1 },
    nodes: [],
    edges: []
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
      planMode: false,
      runMode: "flow"
    }
  };
}

function normalizeDocument(projectPath: string, document: ScatterDocument): ScatterDocument {
  const fallback = emptyDocument(projectPath);
  return {
    ...fallback,
    ...document,
    projectName: document.projectName || fallback.projectName,
    nodes: (document.nodes || []).map((node) => ({
      ...node,
      type: "task",
      selected: false,
      data: {
        ...node.data,
        attachments: node.data.attachments || [],
        effort: node.data.effort || "xhigh",
        planMode: Boolean(node.data.planMode),
        runMode: node.data.runMode || "flow"
      }
    })),
    edges: document.edges || []
  };
}

function toDocument(project: ScatterProjectInfo, nodes: ScatterNode[], edges: ScatterEdge[]): ScatterDocument {
  return {
    version: 1,
    projectName: project.name,
    updatedAt: new Date().toISOString(),
    viewport: { x: 0, y: 0, zoom: 1 },
    nodes: nodes.map((node) => ({ ...node, selected: false })),
    edges: edges.map(({ id, source, target, label }) => ({ id, source, target, label }))
  };
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

function CanvasightWorkspace(): ReactElement {
  const { language, t } = useI18n();
  const {
    appendAttachments,
    canRedo,
    canUndo,
    commitCanvasChange,
    edges,
    markNodeRun,
    nodes,
    project,
    replaceCanvasLive,
    selectedNodeId,
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
  const [projectPathInput, setProjectPathInput] = useState("");
  const [loadingProject, setLoadingProject] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionPreview, setConnectionPreview] = useState<ConnectionHoverTarget | null>(null);
  const [canvasTool, setCanvasTool] = useState<CanvasTool>("select");
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [spacePanActive, setSpacePanActive] = useState(false);
  const [isResizingMarkdown, setIsResizingMarkdown] = useState(false);
  const [panelRatios, setPanelRatios] = useState<PanelRatios>({ canvas: 1, markdown: 1 });
  const [viewportZoom, setViewportZoom] = useState(1);
  const [selectedRunMode, setSelectedRunMode] = useState<RunMode>("flow");
  const [markdownNodeId, setMarkdownNodeId] = useState<string | null>(null);
  const hydratedRef = useRef(false);
  const saveTimerRef = useRef<number | null>(null);
  const flowInstanceRef = useRef<ReactFlowInstance | null>(null);
  const workspaceContentRef = useRef<HTMLElement | null>(null);
  const canvasShellRef = useRef<HTMLDivElement | null>(null);
  const latestMouseRef = useRef<FlowPosition>({ x: 360, y: 240 });
  const connectionStartRef = useRef<ConnectionStart | null>(null);
  const connectionSucceededRef = useRef(false);
  const connectionHoverTargetRef = useRef<ConnectionHoverTarget | null>(null);

  const selectedNode = useMemo(() => nodes.find((node) => node.id === selectedNodeId) ?? null, [nodes, selectedNodeId]);
  const markdownNode = useMemo(() => nodes.find((node) => node.id === markdownNodeId) ?? null, [markdownNodeId, nodes]);
  const canToggleMarkdown = Boolean(project && (selectedNode || markdownNode || drawer === "markdown"));
  const canRun = Boolean(project && selectedNode && selectedNode.data.body.trim().length > 0);
  const panModeActive = canvasTool === "pan" || spacePanActive;
  const zoomPercent = Math.round(viewportZoom * 100);
  const markdownResult = useMemo(
    () =>
      project && markdownNode
        ? buildMarkdown(nodes, edges, markdownNode.id, selectedRunMode, project.name, project.path, language)
        : { markdown: "", nodes: [], attachments: [], imagePaths: [], planMode: false, hasCycle: false },
    [edges, language, markdownNode, nodes, project, selectedRunMode]
  );
  const renderedEdges = useMemo(() => flowEdges(edges, selectedNodeId, hoveredNodeId, connectionPreview), [connectionPreview, edges, hoveredNodeId, selectedNodeId]);
  const workspaceStyle = useMemo(
    () =>
      ({
        "--canvas-panel-ratio": panelRatios.canvas,
        "--markdown-panel-ratio": panelRatios.markdown
      }) as CSSProperties,
    [panelRatios]
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

  const clearConnectionHoverTarget = useCallback(() => {
    updateConnectionHoverTarget(null);
  }, [updateConnectionHoverTarget]);

  const selectNode = useCallback(
    (nodeId: string | null, mode: RunMode = "flow") => {
      setSelectedRunMode(mode);
      setSelectedNodeId(nodeId);
      replaceCanvasLive({
        nodes: nodes.map((node) => ({
          ...node,
          selected: node.id === nodeId
        }))
      });
    },
    [nodes, replaceCanvasLive, setSelectedNodeId]
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

  const openProjectPath = useCallback(
    async (projectPath: string) => {
      const trimmedPath = projectPath.trim();
      if (!trimmedPath) return;
      setLoadingProject(true);
      setStatus("Opening project...");
      try {
        const result = await canvasightApi.openProject(trimmedPath);
        const document = normalizeDocument(trimmedPath, result.document);
        setProjectDocument(result.project, document);
        setProjectPathInput(result.project.path);
        hydratedRef.current = true;
        setStatus(t("app.openedProject", { name: result.project.name }));
      } catch (error) {
        const fallbackProject = {
          name: projectNameFromPath(trimmedPath),
          path: trimmedPath,
          updatedAt: new Date().toISOString()
        };
        setProjectDocument(fallbackProject, emptyDocument(trimmedPath));
        setProjectPathInput(trimmedPath);
        hydratedRef.current = true;
        setStatus(error instanceof Error ? error.message : t("app.genericError"));
      } finally {
        setLoadingProject(false);
      }
    },
    [setProjectDocument, setStatus, t]
  );

  useEffect(() => {
    document.documentElement.dataset.theme = "light";
    document.documentElement.dataset.translucent = "false";
    window.scatter = {
      showInFolder: (targetPath: string) => canvasightApi.showInFolder(targetPath)
    };

    canvasightApi
      .getSession()
      .then((session) => {
        const projectPath = session.projectPath || defaultProjectPathFromBrowser();
        if (projectPath) {
          setProjectPathInput(projectPath);
          return openProjectPath(projectPath);
        }
        setLoadingProject(false);
        hydratedRef.current = true;
        setStatus("No default project path is configured.");
        return undefined;
      })
      .catch((error) => {
        const projectPath = defaultProjectPathFromBrowser();
        if (projectPath) {
          setProjectPathInput(projectPath);
          return openProjectPath(projectPath);
        }
        setLoadingProject(false);
        hydratedRef.current = true;
        setStatus(error instanceof Error ? error.message : t("app.genericError"));
        return undefined;
      });
  }, [openProjectPath, setStatus, t]);

  useEffect(() => {
    if (!hydratedRef.current || !project) return;
    if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    saveTimerRef.current = window.setTimeout(() => {
      setSaving(true);
      canvasightApi
        .saveDocument(project.path, toDocument(project, nodes, edges))
        .then(() => setStatus(t("status.saved")))
        .catch((error) => setStatus(error instanceof Error ? error.message : t("status.saveFailed")))
        .finally(() => setSaving(false));
    }, saveDebounceMs);

    return () => {
      if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    };
  }, [edges, nodes, project, setSaving, setStatus, t]);

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
      commitCanvasChange({
        nodes: nodes.filter((node) => node.id !== nodeId),
        edges: edges.filter((edge) => edge.source !== nodeId && edge.target !== nodeId)
      });
      if (selectedNodeId === nodeId) setSelectedNodeId(null);
    },
    [commitCanvasChange, edges, nodes, selectedNodeId, setSelectedNodeId]
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

  useEffect(() => {
    function handlePaste(event: ClipboardEvent): void {
      if (!project || event.defaultPrevented) return;
      const files = clipboardImageFiles(event.clipboardData);
      if (!files.length) return;

      const target = event.target instanceof Element ? event.target : null;
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
  }, [addFilesToNode, nodes, project, selectedNodeId]);

  const runNode = useCallback(
    async (nodeId: string, mode: RunMode) => {
      if (!project) return;
      const node = nodes.find((item) => item.id === nodeId);
      if (!node) return;
      const result = buildMarkdown(nodes, edges, nodeId, mode, project.name, project.path, language);
      if (result.nodes.every((item) => item.data.body.trim().length === 0)) {
        setStatus(t("status.cannotSendEmpty"));
        return;
      }

      const threadName = mode === "flow" ? `Canvasight Flow: ${node.data.title || "Untitled"}` : `Canvasight: ${node.data.title || "Untitled"}`;
      setStatus(t("status.sendingAssistant"));
      try {
        await canvasightApi.run({
          attachments: result.attachments,
          effort: node.data.effort || "xhigh",
          imagePaths: result.imagePaths,
          markdown: result.markdown,
          nodeIds: result.nodes.map((item) => item.id),
          planMode: result.planMode,
          projectPath: project.path,
          runMode: mode,
          sessionId: canvasightApi.sessionId,
          threadName
        });
        markNodeRun(nodeId, mode);
        setMarkdownNodeId(nodeId);
        setDrawer("markdown");
        setSelectedRunMode(mode);
        setStatus(t("status.sentAssistant"));
      } catch (error) {
        setStatus(error instanceof Error ? error.message : t("status.sendAssistantFailed"));
      }
    },
    [edges, language, markNodeRun, nodes, project, setDrawer, setStatus, t]
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
      removeAttachment,
      runNode,
      setNodeHover: (nodeId: string, hovered: boolean) => setHoveredNodeId((current) => (hovered ? nodeId : current === nodeId ? null : current)),
      updateNodeData: (nodeId: string, patch: Partial<ScatterNodeData>) => updateNodeData(nodeId, patch)
    });
  }, [addFilesToNode, chooseFilesForNode, createConnectedNode, deleteNode, duplicateNode, removeAttachment, runNode, updateNodeData]);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      const nextNodes = applyNodeChanges(changes, nodes as Node[]) as ScatterNode[];
      commitCanvasChange({ nodes: nextNodes });
      const selected = nextNodes.find((node) => node.selected)?.id ?? null;
      if (selected !== selectedNodeId) setSelectedNodeId(selected);
    },
    [commitCanvasChange, nodes, selectedNodeId, setSelectedNodeId]
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

  const handleMove = useCallback<OnMove>((_event, viewport) => {
    setViewportZoom(viewport.zoom);
  }, []);

  const updateMarkdownPanelRatios = useCallback((clientX: number) => {
    const workspace = workspaceContentRef.current;
    if (!workspace) return;

    const rect = workspace.getBoundingClientRect();
    const handleWidth = 12;
    const availableWidth = Math.max(1, rect.width - handleWidth);
    const minCanvasWidth = Math.min(360, availableWidth * 0.45);
    const minMarkdownWidth = Math.min(360, availableWidth - minCanvasWidth);
    const maxCanvasWidth = Math.max(minCanvasWidth, availableWidth - minMarkdownWidth);
    const pointerCanvasWidth = clientX - rect.left;
    const canvasWidth = Math.min(Math.max(pointerCanvasWidth, minCanvasWidth), maxCanvasWidth);
    const markdownWidth = Math.max(minMarkdownWidth, availableWidth - canvasWidth);
    const totalWidth = Math.max(1, canvasWidth + markdownWidth);

    setPanelRatios({
      canvas: canvasWidth / totalWidth,
      markdown: markdownWidth / totalWidth
    });
  }, []);

  const beginMarkdownResize = useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      if (drawer !== "markdown") return;
      event.preventDefault();
      event.currentTarget.setPointerCapture(event.pointerId);
      setIsResizingMarkdown(true);
      updateMarkdownPanelRatios(event.clientX);
    },
    [drawer, updateMarkdownPanelRatios]
  );

  const resizeMarkdownPanel = useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      if (!isResizingMarkdown) return;
      event.preventDefault();
      updateMarkdownPanelRatios(event.clientX);
    },
    [isResizingMarkdown, updateMarkdownPanelRatios]
  );

  const finishMarkdownResize = useCallback((event: React.PointerEvent<HTMLButtonElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    setIsResizingMarkdown(false);
  }, []);

  useEffect(() => {
    if (!isResizingMarkdown) return;

    function handleMouseMove(event: MouseEvent): void {
      event.preventDefault();
      updateMarkdownPanelRatios(event.clientX);
    }

    function stopResizing(): void {
      setIsResizingMarkdown(false);
    }

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", stopResizing);
    window.addEventListener("blur", stopResizing);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", stopResizing);
      window.removeEventListener("blur", stopResizing);
    };
  }, [isResizingMarkdown, updateMarkdownPanelRatios]);

  const runActiveNode = useCallback(() => {
    if (!selectedNode) return;
    void runNode(selectedNode.id, selectedRunMode);
  }, [runNode, selectedNode, selectedRunMode]);

  const toggleTasksDrawer = useCallback(() => {
    if (!project) return;
    setDrawer(drawer === "tasks" ? null : "tasks");
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
      if (hasPrimaryModifier && !event.altKey) {
        if (key === "z") {
          event.preventDefault();
          if (event.shiftKey) redo();
          else undo();
          return;
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
  }, [addNode, fitCanvas, project, redo, runActiveNode, toggleMarkdownDrawer, toggleTasksDrawer, undo]);

  const handleProjectSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      void openProjectPath(projectPathInput);
    },
    [openProjectPath, projectPathInput]
  );

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
      <main
        ref={workspaceContentRef}
        className={`workspace-content ${drawer ? "has-right-sidebar" : ""} ${drawer === "markdown" ? "has-markdown-sidebar" : ""} ${isResizingMarkdown ? "is-resizing-markdown" : ""}`}
        style={workspaceStyle}
      >
        <section
          ref={canvasShellRef}
          className={`canvas-shell ${isConnecting ? "is-connecting" : ""} ${connectionPreview ? "has-connection-preview" : ""}`}
          onDrop={(event) => {
            if (!selectedNode || !event.dataTransfer.files.length) return;
            event.preventDefault();
            void addFilesToNode(selectedNode.id, event.dataTransfer.files, "drop");
          }}
          onDragOver={(event) => event.preventDefault()}
        >
          {project ? (
            <>
              <ReactFlow
                nodes={nodes as Node[]}
                edges={renderedEdges}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                connectionLineComponent={ScatterConnectionLine}
                defaultEdgeOptions={defaultEdgeOptions}
                proOptions={proOptions}
                fitView
                minZoom={0.2}
                maxZoom={2}
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
                    icon="topbar-tasks"
                    size="lg"
                    aria-label={t("topbar.taskList")}
                    aria-pressed={drawer === "tasks"}
                    onClick={toggleTasksDrawer}
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
              <p>{loadingProject ? "Loading Canvasight..." : "Enter a local project path to open a Canvasight workspace."}</p>
              {!loadingProject ? (
                <form className="canvasight-empty-form" onSubmit={handleProjectSubmit}>
                  <input
                    className="canvasight-empty-input"
                    value={projectPathInput}
                    placeholder="/absolute/project/path"
                    aria-label="Project path"
                    onChange={(event) => setProjectPathInput(event.currentTarget.value)}
                  />
                  <button className="canvasight-empty-open" type="submit">
                    Open
                  </button>
                </form>
              ) : null}
            </div>
          )}
        </section>

        <button
          className={`workspace-resize-handle ${drawer === "markdown" ? "is-active" : ""}`}
          type="button"
          aria-hidden
          tabIndex={-1}
          onPointerDown={beginMarkdownResize}
          onPointerMove={resizeMarkdownPanel}
          onPointerUp={finishMarkdownResize}
          onPointerCancel={finishMarkdownResize}
        />
        <RightDrawer
          drawer={drawer}
          nodes={nodes}
          edges={edges}
          selectedNodeId={selectedNodeId}
          markdownNodeId={markdownNodeId}
          markdown={markdownResult.markdown}
          currentRunMode={selectedRunMode}
          onLocateNode={(nodeId, mode) => locateNode(nodeId, mode)}
          onSelectNode={(nodeId, mode) => selectNode(nodeId, mode)}
          onRunNode={(nodeId, mode) => void runNode(nodeId, mode)}
        />
      </main>
    </div>
  );
}

export default function App(): ReactElement {
  const [language, setLanguage] = useState<LanguagePreference>("zh");

  useEffect(() => {
    canvasightApi.getSession().then((session) => setLanguage(session.language)).catch(() => undefined);
  }, []);

  return (
    <I18nProvider language={language}>
      <ReactFlowProvider>
        <CanvasightWorkspace />
      </ReactFlowProvider>
    </I18nProvider>
  );
}
