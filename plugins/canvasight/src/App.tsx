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
  type AssetRole,
  type NodeTemplate,
  type NodeTemplateInput,
  type RunMode,
  type ScatterDocument,
  type ScatterEdge,
  type ScatterNode,
  type ScatterNodeData,
  type ScatterGroupNode,
  type ScatterTaskNode
} from "../shared/types";
import {
  cloneEdgeForClipboard,
  cloneNodeForClipboard,
  parseCanvasClipboardPayload,
  type CanvasClipboardPayload
} from "./domain/canvasClipboard";
import {
  emptyDocument,
  emptyPage,
  normalizeDocument,
  persistentDocumentValue,
  persistentNodeValue,
  projectNameFromPath,
  rebaseLocalChangesAfterSave,
  stableStringify,
  toDocument
} from "./domain/canvasDocument";
import {
  absoluteNodePosition,
  aggregateEdgePrefix,
  assetNodeWidth,
  assetPositionNextToTask,
  connectionPreviewEdgeId,
  connectionFromStart,
  findOpenPositionNear,
  findOpenPositionToRight,
  flowEdges,
  groupHeaderHeight,
  groupMinHeight,
  groupMinWidth,
  groupPadding,
  isConnectionAllowed,
  nodeBounds,
  orderedFlowNodes,
  roundPosition,
  storeEdges,
  taskNodeHeight,
  taskNodeHorizontalGap,
  taskNodeWidth,
  ungroupNodes,
  type ConnectionHoverTarget,
  type ConnectionStart,
  type FlowPosition
} from "./domain/canvasGraph";
import { assetNodeFromAttachment, emptyNode, nodeFromTemplate } from "./domain/canvasNodes";
import { buildConnectedNodeCandidate } from "./domain/connectedNodeCreation";
import { shouldDeleteCanvasSelection } from "./domain/canvasKeyboard";
import { clipboardImageFiles, filesToInputs } from "./infrastructure/fileInputs";
import { openConnectedNodeFilePicker } from "./application/connectedNodeFilePicker";
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
import { isEditableTarget, isKeyboardInteractiveTarget } from "./lib/keyboardTargets";
import { shortcuts } from "./lib/shortcuts";
import { ConfirmDialog } from "./components/ConfirmDialog";
import { ConnectedNodeMenu } from "./components/ConnectedNodeMenu";
import { CanvasightErrorBoundary } from "./components/CanvasightErrorBoundary";
import { ScatterEdge as ScatterFlowEdge } from "./components/ScatterEdge";
import { RightDrawer } from "./components/RightDrawer";
import { SettingsDialog } from "./components/SettingsDialog";
import { TaskNode } from "./components/TaskNode";
import { AssetNode } from "./components/AssetNode";
import { GroupNode } from "./components/GroupNode";
import { StartupFailurePanel } from "./components/StartupFailurePanel";
import { WorkspaceStartupSkeleton } from "./components/WorkspaceStartupSkeleton";
import { DropdownMenu, DropdownMenuItem } from "./components/ui/dropdown-menu";
import { Icon } from "./components/ui/icon";
import { IconButton } from "./components/ui/icon-button";
import { TooltipAnchor } from "./components/ui/tooltip";
import { Toast, ToastViewport, type ToastTone } from "./components/ui/toast";
import { useScatterStore } from "./store/scatterStore";
import {
  CanvasActionsProvider,
  type CanvasActions,
  type ConnectedNodeKind,
  type ConnectedNodeMenuAnchor,
  type ConnectedNodeMenuRequest,
  type ConnectedNodeSide
} from "./application/CanvasActionsContext";
import "@xyflow/react/dist/style.css";
import "./styles/app.css";
const nodeTypes = { task: TaskNode, asset: AssetNode, group: GroupNode } as NodeTypes;
const edgeTypes = { scatter: ScatterFlowEdge } satisfies EdgeTypes;
const defaultEdgeOptions = { type: "scatter" };
const proOptions = { hideAttribution: true };
const saveDebounceMs = 450;
const canvasMinZoom = 0.2;
const canvasMaxZoom = 2;
const nodeConnectButtonSize = 20;
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
type CanvasTool = "select" | "pan";
function isThreadStoreModePreflightFailure(message: string): boolean {
  return (
    /Canvasight Run blocked before sendMessage/i.test(message) &&
    /failed to read thread|thread-store internal error|rollout does not start with session metadata/i.test(message)
  );
}
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

function defaultProjectPathFromBrowser(): string {
  return import.meta.env.VITE_CANVASIGHT_DEFAULT_PROJECT_PATH?.trim() || "";
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

function CanvasightWorkspace({ agentTeamEnabled, onOpenSettings }: CanvasightWorkspaceProps): ReactElement {
  const { language, t } = useI18n();
  const {
    canRedo,
    canUndo,
    beginHistoryTransaction,
    commitCanvasChange,
    commitHistoryTransaction,
    createPage,
    deleteActivePage,
    edges,
    collapsedGroupIds,
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
    setCollapsedGroupIds,
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
  const [refreshingDocument, setRefreshingDocument] = useState(false);
  const nativeWidget = isNativeWidgetShell();
  const [startupStage, setStartupStageState] = useState<CanvasightStartupStage>(() =>
    nativeWidget ? getCanvasightStartupIdentity().stage : "ready"
  );
  const [startupFailure, setStartupFailure] = useState<{ stage: string; reason: string } | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionPreview, setConnectionPreview] = useState<ConnectionHoverTarget | null>(null);
  const [canvasTool, setCanvasTool] = useState<CanvasTool>("select");
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [spacePanActive, setSpacePanActive] = useState(false);
  const [viewportZoom, setViewportZoom] = useState(1);
  const [selectedRunMode, setSelectedRunMode] = useState<RunMode>("flow");
  const [markdownNodeId, setMarkdownNodeId] = useState<string | null>(null);
  const [renamingPage, setRenamingPage] = useState(false);
  const [pageNameDraft, setPageNameDraft] = useState("");
  const [deletePageRequest, setDeletePageRequest] = useState<{ id: string; name: string } | null>(null);
  const [deleteTemplateRequest, setDeleteTemplateRequest] = useState<{ id: string; title: string } | null>(null);
  const [connectedNodeMenuRequest, setConnectedNodeMenuRequest] = useState<ConnectedNodeMenuRequest | null>(null);
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
  const observedPersistentDocumentRef = useRef<string | null>(null);
  const localMutationGenerationRef = useRef(0);
  const acknowledgedMutationGenerationRef = useRef(0);
  const saveMutationIdsRef = useRef(new Map<number, string>());
  const saveRequestCountRef = useRef(0);
  const saveInFlightRef = useRef(false);
  const saveQueuedRef = useRef(false);
  const saveFlushRequestedRef = useRef(false);
  const saveFlushWaitersRef = useRef<Array<{ resolve: () => void; reject: (error: Error) => void }>>([]);
  const skipNextSaveRef = useRef(false);
  const reloadingExternalDocumentRef = useRef(false);
  const refreshDocumentPromiseRef = useRef<Promise<void> | null>(null);
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
  const pendingViewportRecoveryMovesRef = useRef(0);
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
  const canRun = Boolean(project && selectedNode && (
    selectedNode.type === "task"
      ? selectedNode.data.body.trim().length > 0 || selectedNode.data.attachments.length > 0
      : selectedNode.type === "group"
        ? nodes.some((node) => node.type !== "group" && node.parentId === selectedNode.id)
        : false
  ));
  const canDeletePage = pages.length > 1;
  const canGroup = selectedNodes.filter((node) => node.type !== "group").length >= 2;
  const canUngroup = selectedNodes.some((node) => node.type === "group" || node.parentId);
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
  const renderedNodes = useMemo(() => orderedFlowNodes(nodes, collapsedGroupIds), [collapsedGroupIds, nodes]);
  const renderedEdges = useMemo(
    () => flowEdges(edges, nodes, collapsedGroupIds, selectedNodeId, hoveredNodeId, selectedEdgeId, connectionPreview),
    [collapsedGroupIds, connectionPreview, edges, hoveredNodeId, nodes, selectedEdgeId, selectedNodeId]
  );
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
      if (validViewport && viewport) {
        pendingViewportRecoveryMovesRef.current += 1;
        await instance.setViewport(viewport, { duration: 0 });
      }
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
        pendingViewportRecoveryMovesRef.current += 1;
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

  const hasPendingLocalSave = useCallback(() => {
    const currentState = useScatterStore.getState();
    const hasUnobservedPersistentChange = Boolean(
      currentState.project &&
      observedPersistentDocumentRef.current !== persistentDocumentValue(toDocument(
        currentState.project,
        currentState.pages,
        currentState.activePageId,
        currentState.nodes,
        currentState.edges,
        baseDocumentRef.current?.document.version === 2 ? 2 : 1
      ))
    );
    return hasUnobservedPersistentChange ||
      localMutationGenerationRef.current > acknowledgedMutationGenerationRef.current ||
      saveRequestCountRef.current > 0 ||
      saveInFlightRef.current;
  }, []);

  const settleSaveFlushWaiters = useCallback((error?: Error) => {
    const waiters = saveFlushWaitersRef.current.splice(0);
    for (const waiter of waiters) {
      if (error) waiter.reject(error);
      else waiter.resolve();
    }
  }, []);

  const flushPendingSave = useCallback(async (): Promise<void> => {
    if (!hasPendingLocalSave()) return;
    const completion = new Promise<void>((resolve, reject) => {
      saveFlushWaitersRef.current.push({ resolve, reject });
    });
    saveFlushRequestedRef.current = true;
    if (saveTimerRef.current !== null) {
      window.clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    setSaveFlushNonce((value) => value + 1);
    await completion;
  }, [hasPendingLocalSave]);

  const applyOpenedProject = useCallback(
    async (
      projectPath: string,
      result: Awaited<ReturnType<typeof canvasightApi.openProject>>,
      status?: string,
      preserveLocalNavigation = false
    ): Promise<void> => {
      const document = normalizeDocument(projectPath, result.document);
      const currentState = useScatterStore.getState();
      if (
        currentState.project?.path === projectPath &&
        documentRevisionRef.current !== null &&
        result.documentRevision < documentRevisionRef.current
      ) {
        return;
      }
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
        // The concurrent-save base is protocol data, not the display model.
        // Preserve the daemon response verbatim so its order-sensitive
        // documentVersion continues to describe this exact document.
        document: result.document
      };
      observedPersistentDocumentRef.current = persistentDocumentValue(document);
      acknowledgedMutationGenerationRef.current = localMutationGenerationRef.current;
      saveMutationIdsRef.current.clear();
      settleSaveFlushWaiters();
      skipNextSaveRef.current = true;
      setProjectDocument(result.project, displayDocument);
      if (
        preserveLocalNavigation &&
        currentState.selectedNodeId &&
        displayDocument.activePageId === currentState.activePageId &&
        displayDocument.nodes.some((node) => node.id === currentState.selectedNodeId)
      ) {
        selectNode(currentState.selectedNodeId);
      }
      hydratedRef.current = true;
      setStatus(status ?? t("app.openedProject", { name: result.project.name }));
      await claimUrlThreadForProject(result.project.path);
    },
    [claimUrlThreadForProject, selectNode, setProjectDocument, setStatus, settleSaveFlushWaiters, t]
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
        const fallbackDocument = emptyDocument(trimmedPath);
        documentRevisionRef.current = null;
        documentVersionRef.current = null;
        baseDocumentRef.current = null;
        observedPersistentDocumentRef.current = persistentDocumentValue(fallbackDocument);
        skipNextSaveRef.current = true;
        setProjectDocument(fallbackProject, fallbackDocument);
        hydratedRef.current = true;
        setStatus(error instanceof Error ? error.message : t("app.genericError"));
      } finally {
        if (!options.silent) setLoadingProject(false);
      }
    },
    [applyOpenedProject, setProjectDocument, setStatus, t]
  );

  const refreshLatestDocument = useCallback((): void => {
    if (!project || !hydratedRef.current || refreshDocumentPromiseRef.current) return;

    const projectPath = project.path;
    const refreshPromise = (async () => {
      setRefreshingDocument(true);
      let saveFailed = false;
      try {
        if (hasPendingLocalSave()) setStatus(t("status.refreshWaitingForSave"));
        try {
          await flushPendingSave();
        } catch {
          saveFailed = true;
          throw new Error(t("status.refreshSaveFailed"));
        }
        if (useScatterStore.getState().project?.path !== projectPath) return;

        const revisionBeforeRefresh = documentRevisionRef.current;
        const mutationGenerationAtRequest = localMutationGenerationRef.current;
        const result = await canvasightApi.openProject(projectPath);
        const currentState = useScatterStore.getState();
        const currentRevision = documentRevisionRef.current;
        const localStateChangedWhileRefreshing =
          currentState.project?.path !== projectPath ||
          localMutationGenerationRef.current !== mutationGenerationAtRequest ||
          localMutationGenerationRef.current > acknowledgedMutationGenerationRef.current ||
          saveRequestCountRef.current > 0 ||
          saveInFlightRef.current;

        if (localStateChangedWhileRefreshing) {
          setRunStatus(t("status.refreshDeferredForLocalChanges"), "negative");
          return;
        }

        if (currentRevision !== null && result.documentRevision < currentRevision) {
          setRunStatus(t("status.documentAlreadyLatest"), "information");
          return;
        }

        const refreshed = revisionBeforeRefresh === null || result.documentRevision > revisionBeforeRefresh;
        const refreshMessage = refreshed ? t("status.documentRefreshed") : t("status.documentAlreadyLatest");
        await applyOpenedProject(
          projectPath,
          result,
          refreshMessage,
          true
        );
        showRunFeedback(refreshMessage, refreshed ? "positive" : "information");
      } catch (error) {
        setRunStatus(
          saveFailed
            ? t("status.refreshSaveFailed")
            : error instanceof Error && error.message === t("status.refreshSaveTimeout")
            ? error.message
            : t("status.documentRefreshFailed"),
          "negative"
        );
      } finally {
        setRefreshingDocument(false);
        refreshDocumentPromiseRef.current = null;
      }
    })();

    refreshDocumentPromiseRef.current = refreshPromise;
  }, [applyOpenedProject, flushPendingSave, hasPendingLocalSave, project, setRunStatus, setStatus, showRunFeedback, t]);

  useEffect(() => {
    if (startupInitializedRef.current) return;
    startupInitializedRef.current = true;
    window.scatter = {
      openFile: (targetPath: string) => canvasightApi.openFile(targetPath),
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

    const nextPaint = () => new Promise<void>((resolve) => {
      let settled = false;
      let animationFrameId: number | null = null;
      let timeoutId: number | null = null;
      const finish = () => {
        if (settled) return;
        settled = true;
        if (animationFrameId !== null) {
          window.cancelAnimationFrame(animationFrameId);
          animationFrameId = null;
        }
        if (timeoutId !== null) {
          window.clearTimeout(timeoutId);
          timeoutId = null;
        }
        resolve();
      };
      timeoutId = window.setTimeout(finish, 200);
      animationFrameId = window.requestAnimationFrame(finish);
    });
    const waitForPresentationSignal = (canvas: HTMLElement | null) => new Promise<void>((resolve) => {
      let settled = false;
      let timeoutId: number | null = null;
      let observer: ResizeObserver | null = null;
      const finish = () => {
        if (settled) return;
        settled = true;
        if (timeoutId !== null) window.clearTimeout(timeoutId);
        observer?.disconnect();
        document.removeEventListener("visibilitychange", finish);
        window.removeEventListener("canvasight:host-context-changed", finish);
        resolve();
      };
      timeoutId = window.setTimeout(finish, 100);
      document.addEventListener("visibilitychange", finish, { once: true });
      window.addEventListener("canvasight:host-context-changed", finish, { once: true });
      if (canvas) {
        observer = new ResizeObserver(finish);
        observer.observe(canvas);
      }
    });
    const waitForRenderableCanvas = async (bindingKey: string) => {
      const deadline = Date.now() + 30_000;
      let nextPresentationRetryAt = Date.now() + 250;
      let presentationRetryIndex = 0;
      let presentationPulseAttempted = false;
      let passivePresentationRecovery = false;
      const presentationRetryDelays = [250, 1_000];
      const presentationSnapshot = (
        canvas: HTMLElement | null,
        rect: DOMRect | undefined,
        style: CSSStyleDeclaration | null,
        hitTarget: Element | null,
        appRoot: Element | null | undefined
      ) => ({
        documentVisibility: document.visibilityState,
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
        canvasConnected: Boolean(canvas?.isConnected),
        canvasWidth: rect?.width ?? 0,
        canvasHeight: rect?.height ?? 0,
        canvasDisplay: style?.display ?? "missing",
        canvasVisibility: style?.visibility ?? "missing",
        hitTarget: hitTarget ? `${hitTarget.tagName.toLowerCase()}${hitTarget.id ? `#${hitTarget.id}` : ""}` : "none",
        hitInsideApp: Boolean(hitTarget && appRoot?.contains(hitTarget))
      });
      while (Date.now() < deadline) {
        if (!isCanvasightBindingCurrent(bindingKey)) throw new Error("Canvasight widget binding changed during startup.");
        await nextPaint();
        const canvas = canvasShellRef.current;
        const appRoot = canvas?.closest(".canvasight-app");
        const rect = canvas?.getBoundingClientRect();
        const style = canvas ? getComputedStyle(canvas) : null;
        const centerX = rect ? Math.min(Math.max(rect.left + rect.width / 2, 0), Math.max(window.innerWidth - 1, 0)) : 0;
        const centerY = rect ? Math.min(Math.max(rect.top + rect.height / 2, 0), Math.max(window.innerHeight - 1, 0)) : 0;
        const hitTarget = rect && rect.width > 0 && rect.height > 0 ? document.elementFromPoint(centerX, centerY) : null;
        if (
          document.visibilityState === "visible" &&
          getCanvasightStartupIdentity().displayMode === "fullscreen" &&
          canvas?.isConnected &&
          rect && rect.width > 0 && rect.height > 0 &&
          style?.display !== "none" && style?.visibility !== "hidden" &&
          hitTarget && appRoot?.contains(hitTarget)
        ) {
          window.canvasightMcp?.recordPresentationDiagnostic("renderable", presentationSnapshot(canvas, rect, style, hitTarget, appRoot));
          return { canvas, rect };
        }
        if (presentationRetryIndex < presentationRetryDelays.length && Date.now() >= nextPresentationRetryAt) {
          presentationRetryIndex += 1;
          window.canvasightMcp?.recordPresentationDiagnostic(
            "fullscreen-retry-check",
            { retryIndex: presentationRetryIndex, ...presentationSnapshot(canvas, rect, style, hitTarget, appRoot) }
          );
          try {
            await window.canvasightMcp?.requestFullscreenPresentation();
          } catch {
            // The strict renderability gate remains authoritative when the host
            // cannot service a best-effort presentation retry.
          }
          if (!isCanvasightBindingCurrent(bindingKey)) throw new Error("Canvasight widget binding changed during startup.");
          nextPresentationRetryAt = Date.now() + (presentationRetryDelays[presentationRetryIndex] ?? 1_000);
          continue;
        }
        if (presentationRetryIndex >= presentationRetryDelays.length && !presentationPulseAttempted) {
          presentationPulseAttempted = true;
          window.canvasightMcp?.recordPresentationDiagnostic(
            "pulse-check",
            presentationSnapshot(canvas, rect, style, hitTarget, appRoot)
          );
          const pulseResult = await window.canvasightMcp?.requestPresentationPulse(bindingKey);
          if (!isCanvasightBindingCurrent(bindingKey)) throw new Error("Canvasight widget binding changed during startup.");
          passivePresentationRecovery =
            pulseResult === "standby" ||
            pulseResult === "cooldown" ||
            pulseResult === "stale-binding";
          window.canvasightMcp?.recordPresentationDiagnostic("pulse-result", {
            result: pulseResult ?? "unavailable",
            ...presentationSnapshot(canvas, rect, style, hitTarget, appRoot)
          });
          continue;
        }
        await waitForPresentationSignal(canvas);
      }
      window.canvasightMcp?.recordPresentationDiagnostic("renderability-timeout", {
        elapsedMs: 30_000,
        passivePresentationRecovery
      });
      if (passivePresentationRecovery) return null;
      throw new Error("Canvasight canvas did not become visibly renderable within 30000ms.");
    };
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
          await waitForFullscreen();
          const renderableCanvas = await waitForRenderableCanvas(startupBindingKey);
          if (!renderableCanvas) return;
          const { canvas, rect } = renderableCanvas;
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
      const hydratedState = useScatterStore.getState();
      if (hydratedState.project?.path === project.path) {
        observedPersistentDocumentRef.current = persistentDocumentValue(toDocument(
          hydratedState.project,
          hydratedState.pages,
          hydratedState.activePageId,
          hydratedState.nodes,
          hydratedState.edges,
          baseDocumentRef.current?.document.version === 2 ? 2 : 1
        ));
      }
      return;
    }
    const stateAtObservation = useScatterStore.getState();
    if (!stateAtObservation.project || stateAtObservation.project.path !== project.path) return;
    const observedDocument = toDocument(
      stateAtObservation.project,
      stateAtObservation.pages,
      stateAtObservation.activePageId,
      stateAtObservation.nodes,
      stateAtObservation.edges,
      baseDocumentRef.current?.document.version === 2 ? 2 : 1
    );
    const observedPersistentValue = persistentDocumentValue(observedDocument);
    const hasNewPersistentChange = observedPersistentDocumentRef.current !== observedPersistentValue;
    if (hasNewPersistentChange) {
      observedPersistentDocumentRef.current = observedPersistentValue;
      localMutationGenerationRef.current += 1;
    }
    const mutationGeneration = localMutationGenerationRef.current;
    if (!hasNewPersistentChange && !hasPendingLocalSave()) {
      saveFlushRequestedRef.current = false;
      settleSaveFlushWaiters();
      return;
    }
    if (saveTimerRef.current !== null) window.clearTimeout(saveTimerRef.current);
    const flushRequested = saveFlushRequestedRef.current;
    saveTimerRef.current = window.setTimeout(() => {
      saveTimerRef.current = null;
      saveFlushRequestedRef.current = false;
      if (saveInFlightRef.current) {
        saveQueuedRef.current = true;
        return;
      }
      const base = baseDocumentRef.current;
      if (!base) {
        settleSaveFlushWaiters(new Error("Canvasight cannot save before the project revision is available."));
        return;
      }
      const currentState = useScatterStore.getState();
      if (!currentState.project || currentState.project.path !== project.path) {
        settleSaveFlushWaiters(new Error("Canvasight project changed before the pending save completed."));
        return;
      }
      const document = toDocument(
        currentState.project,
        currentState.pages,
        currentState.activePageId,
        currentState.nodes,
        currentState.edges,
        base.document.version === 2 ? 2 : 1
      );
      const deletedPageSnapshots = Object.fromEntries(
        base.document.pages.filter((page) => !document.pages.some((candidate) => candidate.id === page.id)).map((page) => [page.id, page])
      );
      const clientMutationId = saveMutationIdsRef.current.get(mutationGeneration) ?? crypto.randomUUID();
      saveMutationIdsRef.current.set(mutationGeneration, clientMutationId);
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
          saveMutationIdsRef.current.delete(mutationGeneration);
          documentRevisionRef.current = Math.max(documentRevisionRef.current ?? 0, result.documentRevision);
          documentVersionRef.current = result.documentVersion;
          const hasNewerLocalChanges = localMutationGenerationRef.current !== mutationGeneration;
          const normalizedResult = normalizeDocument(project.path, result.document);
          const conflict = result.merge?.conflictCopies.find((item) => item.conflictPageId === result.merge?.localActivePageId) ?? result.merge?.conflictCopies[0];
          baseDocumentRef.current = {
            revision: result.documentRevision,
            version: result.documentVersion,
            // Keep the next save base paired with the daemon version. The
            // normalized copy is only for display/rebase work below.
            document: result.document
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
              observedPersistentDocumentRef.current = persistentDocumentValue(appliedDocument);
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
                latestState.edges,
                baseDocumentRef.current?.document.version === 2 ? 2 : 1
              );
              const rebasedDocument = rebaseLocalChangesAfterSave(project.path, document, latestLocalDocument, normalizedResult, result.merge);
              const previousSelectedNodeId = latestState.selectedNodeId;
              observedPersistentDocumentRef.current = persistentDocumentValue(rebasedDocument);
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
          settleSaveFlushWaiters(error instanceof Error ? error : new Error(t("status.saveFailed")));
        })
        .finally(() => {
          saveInFlightRef.current = false;
          saveRequestCountRef.current = Math.max(0, saveRequestCountRef.current - 1);
          if (saveRequestCountRef.current === 0) setSaving(false);
          if (saveQueuedRef.current) {
            saveQueuedRef.current = false;
            setSaveFlushNonce((value) => value + 1);
          } else if (!hasPendingLocalSave()) {
            settleSaveFlushWaiters();
          }
        });
    }, flushRequested ? 0 : saveDebounceMs);

    return () => {
      if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    };
  }, [activePageId, edges, hasPendingLocalSave, language, nodes, openProjectPath, pages, project, saveFlushNonce, setProjectDocument, setSaving, setSelectedNodeId, setStatus, settleSaveFlushWaiters, t]);

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

  const requestConnectedNodeMenu = useCallback((nodeId: string, side: ConnectedNodeSide, anchor: ConnectedNodeMenuAnchor) => {
    if (!project || !nodes.some((node) => node.id === nodeId && node.type !== "group")) return;
    clearConnectionHoverTarget();
    setConnectedNodeMenuRequest({ id: nanoid(), nodeId, side, anchor, projectPath: project.path });
  }, [clearConnectionHoverTarget, nodes, project]);

  const commitConnectedNode = useCallback((request: ConnectedNodeMenuRequest, kind: ConnectedNodeKind, attachment?: Awaited<ReturnType<typeof canvasightApi.saveAttachments>>[number]) => {
    const current = useScatterStore.getState();
    if (!current.project || current.project.path !== request.projectPath) {
      setStatus(t("status.connectedNodeUnavailable"));
      return false;
    }
    const candidate = buildConnectedNodeCandidate(request, kind, attachment, current.nodes, current.edges);
    if (!candidate) {
      setStatus(t("status.connectedNodeUnavailable"));
      return false;
    }

    commitCanvasChange({
      nodes: [...current.nodes.map((item) => ({ ...item, selected: false })), candidate.node],
      edges: [...current.edges, candidate.edge]
    });
    setSelectedNodeId(candidate.node.id);
    setStatus(kind === "task" ? t("status.taskNodeCreated") : t("status.assetNodeCreated"));
    return true;
  }, [commitCanvasChange, setSelectedNodeId, setStatus, t]);

  const handleConnectedNodeKind = useCallback((kind: ConnectedNodeKind) => {
    const request = connectedNodeMenuRequest;
    if (!request) return;
    setConnectedNodeMenuRequest(null);
    if (kind === "task") {
      commitConnectedNode(request, kind);
      return;
    }
    openConnectedNodeFilePicker({
      request,
      kind,
      messages: { addAssetFailed: t("status.addAssetFailed"), connectedNodeUnavailable: t("status.connectedNodeUnavailable"), documentFileRequired: t("status.documentFileRequired"), mediaFileRequired: t("status.mediaFileRequired") },
      onAttachment: (attachment) => { commitConnectedNode(request, kind, attachment); },
      onStatus: setStatus
    });
  }, [commitConnectedNode, connectedNodeMenuRequest, setStatus, t]);

  const duplicateNode = useCallback(
    (nodeId: string) => {
      const source = nodes.find((node) => node.id === nodeId);
      if (!source) return;
      if (source.type === "group") {
        const memberIds = new Set(nodes.filter((node) => node.type !== "group" && node.parentId === source.id).map((node) => node.id));
        const groupId = nanoid();
        const idMap = new Map<string, string>([[source.id, groupId]]);
        memberIds.forEach((id) => idMap.set(id, nanoid()));
        const copies = [source, ...nodes.filter((node) => memberIds.has(node.id))].map((item): ScatterNode => {
          const copy = cloneNodeForClipboard(item);
          const id = idMap.get(item.id) as string;
          if (copy.type === "group") return { ...copy, id, position: { x: copy.position.x + 36, y: copy.position.y + 36 }, selected: true, data: { ...copy.data, title: `${copy.data.title} copy` } };
          return { ...copy, id, parentId: groupId, selected: true };
        });
        const copiedEdges = edges.filter((edge) => memberIds.has(edge.source) && memberIds.has(edge.target)).map((edge) => ({ ...edge, id: nanoid(), source: idMap.get(edge.source) as string, target: idMap.get(edge.target) as string }));
        commitCanvasChange({ nodes: [...nodes.map((item) => ({ ...item, selected: false })), ...copies], edges: [...edges, ...copiedEdges] });
        setSelectedNodeId(groupId);
        return;
      }
      const cloned = cloneNodeForClipboard(source);
      if (cloned.type === "group") return;
      const node: ScatterNode = cloned.type === "task"
        ? { ...cloned, id: nanoid(), position: { x: cloned.position.x + 36, y: cloned.position.y + 36 }, selected: true, data: { ...cloned.data, title: `${cloned.data.title} copy` } }
        : { ...cloned, id: nanoid(), position: { x: cloned.position.x + 36, y: cloned.position.y + 36 }, selected: true, data: { ...cloned.data, title: `${cloned.data.title} copy` } };
      commitCanvasChange({
        nodes: [...nodes.map((item) => ({ ...item, selected: false })), node]
      });
      setSelectedNodeId(node.id);
    },
    [commitCanvasChange, edges, nodes, setSelectedNodeId]
  );

  const deleteNode = useCallback(
    (nodeId: string) => {
      const current = useScatterStore.getState();
      const target = current.nodes.find((node) => node.id === nodeId);
      if (!target) return;
      const nextNodes = target.type === "group"
        ? current.nodes.filter((node) => node.id !== nodeId).map((node) =>
            node.type !== "group" && node.parentId === nodeId
              ? { ...node, parentId: undefined, position: { x: target.position.x + node.position.x, y: target.position.y + node.position.y } }
              : node
          )
        : current.nodes.filter((node) => node.id !== nodeId);
      commitCanvasChange({
        nodes: nextNodes,
        edges: current.edges.filter((edge) => edge.source !== nodeId && edge.target !== nodeId)
      });
      if (current.selectedNodeId === nodeId) setSelectedNodeId(null);
    },
    [commitCanvasChange, setSelectedNodeId]
  );

  const deleteSelectedNodes = useCallback(() => {
    if (!selectedNodes.length) return false;
    const selectedGroups = new Map(selectedNodes.filter((node): node is ScatterGroupNode => node.type === "group").map((node) => [node.id, node]));
    const selectedIds = new Set(selectedNodes.filter((node) => node.type === "group" || !node.parentId || !selectedGroups.has(node.parentId)).map((node) => node.id));
    commitCanvasChange({
      nodes: nodes.filter((node) => !selectedIds.has(node.id)).map((node) => {
        if (node.type === "group" || !node.parentId || !selectedGroups.has(node.parentId)) return node;
        const group = selectedGroups.get(node.parentId) as ScatterGroupNode;
        return { ...node, parentId: undefined, position: { x: group.position.x + node.position.x, y: group.position.y + node.position.y } };
      }),
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
      selectedNodes.filter((node) => node.type === "group").forEach((group) => {
        nodes.filter((node) => node.type !== "group" && node.parentId === group.id).forEach((node) => selectedIds.add(node.id));
      });
      const copiedNodes = nodes.filter((node) => selectedIds.has(node.id)).map((node) => {
        const copy = cloneNodeForClipboard(node);
        if (copy.type === "group" || !copy.parentId || selectedIds.has(copy.parentId)) return copy;
        const absolute = absoluteNodePosition(copy, nodes);
        return { ...copy, parentId: undefined, position: absolute };
      });
      const payload: CanvasClipboardPayload = {
        kind: "canvasight.nodes",
        version: 1,
        copiedAt: new Date().toISOString(),
        nodes: copiedNodes,
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
    [edges, nodes, selectedNodes, setStatus, t]
  );

  const pasteCanvasClipboard = useCallback(
    (payload = canvasClipboardRef.current) => {
      if (!project || !payload?.nodes.length) return false;
      const serial = clipboardPasteSerialRef.current + 1;
      clipboardPasteSerialRef.current = serial;
      const offset = 36 * serial;
      const idMap = new Map<string, string>();
      payload.nodes.forEach((node) => idMap.set(node.id, nanoid()));
      const pastedNodes = payload.nodes.map((node): ScatterNode => {
        const id = nanoid();
        const mappedId = idMap.get(node.id) ?? id;
        const copy = cloneNodeForClipboard(node);
        const parentId = copy.type !== "group" && copy.parentId ? idMap.get(copy.parentId) : undefined;
        const position = parentId ? { ...copy.position } : roundPosition({ x: copy.position.x + offset, y: copy.position.y + offset });
        if (copy.type === "group") return { ...copy, id: mappedId, selected: true, position };
        return { ...copy, id: mappedId, selected: true, position, ...(parentId ? { parentId } : { parentId: undefined }) };
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

  const createAssetNodes = useCallback(async (files: FileList | File[], source: "upload" | "drop" | "paste", position: FlowPosition, parentId?: string) => {
    if (!project) return;
    try {
      const attachments = await canvasightApi.saveAttachments(project.path, await filesToInputs(files, source));
      const group = parentId ? nodes.find((node): node is ScatterGroupNode => node.id === parentId && node.type === "group") : null;
      const assets = attachments.map((attachment, index) => assetNodeFromAttachment(attachment, {
        x: (group ? Math.max(groupPadding, position.x - group.position.x) : position.x) + index * 28,
        y: (group ? Math.max(groupHeaderHeight + groupPadding, position.y - group.position.y) : position.y) + index * 28
      }, group?.id));
      const nextNodes = nodes.map((node): ScatterNode => {
        if (node.type !== "group" || node.id !== group?.id) return { ...node, selected: false };
        return {
          ...node,
          selected: false,
          width: Math.max(node.width ?? groupMinWidth, ...assets.map((asset) => asset.position.x + assetNodeWidth + groupPadding)),
          height: Math.max(node.height ?? groupMinHeight, ...assets.map((asset) => asset.position.y + nodeBounds(asset).height + groupPadding))
        };
      });
      commitCanvasChange({ nodes: [...nextNodes, ...assets] });
      setSelectedNodeId(assets[0]?.id ?? null);
      setStatus(language === "zh" ? `已创建 ${assets.length} 个资产节点` : `Created ${assets.length} asset nodes`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : t("status.addAssetFailed"));
    }
  }, [commitCanvasChange, language, nodes, project, setSelectedNodeId, setStatus, t]);

  const chooseFilesForCanvas = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.multiple = true;
    input.onchange = () => {
      if (input.files?.length) void createAssetNodes(input.files, "upload", getVisibleCanvasCenterPosition());
    };
    input.click();
  }, [createAssetNodes, getVisibleCanvasCenterPosition]);

  const replaceAsset = useCallback((nodeId: string) => {
    if (!project || nodes.find((node) => node.id === nodeId)?.type !== "asset") return;
    const input = document.createElement("input");
    input.type = "file";
    input.multiple = false;
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      void (async () => {
        try {
          const [attachment] = await canvasightApi.saveAttachments(project.path, await filesToInputs([file], "upload"));
          if (!attachment) throw new Error(t("status.replaceAssetFailed"));
          updateNodeData(nodeId, { asset: attachment, title: attachment.originalName });
          setStatus(t("status.assetReplaced"));
        } catch (error) {
          setStatus(error instanceof Error ? error.message : t("status.replaceAssetFailed"));
        }
      })();
    };
    input.click();
  }, [nodes, project, setStatus, t, updateNodeData]);

  const promoteAttachment = useCallback((nodeId: string, attachmentId: string) => {
    const task = nodes.find((node): node is ScatterTaskNode => node.id === nodeId && node.type === "task");
    const attachment = task?.data.attachments.find((item) => item.id === attachmentId);
    if (!task || !attachment) return;
    const taskAbsolute = absoluteNodePosition(task, nodes);
    const preferred = { x: taskAbsolute.x + nodeBounds(task).width + 96, y: taskAbsolute.y };
    const groupedPosition = { x: task.position.x + taskNodeWidth + 96, y: task.position.y };
    const asset = assetNodeFromAttachment(attachment, task.parentId ? groupedPosition : preferred, task.parentId);
    const nextTask = { ...task, selected: false, data: { ...task.data, attachments: task.data.attachments.filter((item) => item.id !== attachmentId) } };
    commitCanvasChange({
      nodes: [...nodes.map((node): ScatterNode => {
        if (node.id === task.id) return nextTask;
        if (node.type === "group" && node.id === task.parentId) {
          return {
            ...node,
            selected: false,
            width: Math.max(node.width ?? groupMinWidth, asset.position.x + assetNodeWidth + groupPadding),
            height: Math.max(node.height ?? groupMinHeight, asset.position.y + nodeBounds(asset).height + groupPadding)
          };
        }
        return { ...node, selected: false };
      }), asset],
      edges: [...edges, { id: nanoid(), source: task.id, target: asset.id, label: language === "zh" ? "附件" : "Attachment" }]
    });
    setSelectedNodeId(asset.id);
    setStatus(language === "zh" ? "附件已提升为资产节点" : "Attachment promoted to an asset node");
  }, [commitCanvasChange, edges, language, nodes, setSelectedNodeId, setStatus]);

  const groupSelectedNodes = useCallback(() => {
    const members = selectedNodes.filter((node) => node.type !== "group");
    if (members.length < 2) return false;
    const absoluteMembers = members.map((node) => ({ node, position: absoluteNodePosition(node, nodes), bounds: nodeBounds(node) }));
    const minX = Math.min(...absoluteMembers.map((item) => item.position.x));
    const minY = Math.min(...absoluteMembers.map((item) => item.position.y));
    const maxX = Math.max(...absoluteMembers.map((item) => item.position.x + item.bounds.width));
    const maxY = Math.max(...absoluteMembers.map((item) => item.position.y + item.bounds.height));
    const group: ScatterGroupNode = {
      id: nanoid(), type: "group", selected: true,
      position: { x: minX - groupPadding, y: minY - groupHeaderHeight - groupPadding },
      width: Math.max(groupMinWidth, maxX - minX + groupPadding * 2),
      height: Math.max(groupMinHeight, maxY - minY + groupHeaderHeight + groupPadding * 2),
      data: { title: language === "zh" ? "新建分组" : "New group", description: "" }
    };
    const memberPositions = new Map(absoluteMembers.map((item) => [item.node.id, { x: item.position.x - group.position.x, y: item.position.y - group.position.y }]));
    const nextNodes = nodes.map((node): ScatterNode => {
      const position = memberPositions.get(node.id);
      if (!position || node.type === "group") return { ...node, selected: false };
      return { ...node, parentId: group.id, position, selected: false };
    });
    commitCanvasChange({ nodes: [group, ...nextNodes] });
    setSelectedNodeId(group.id);
    setStatus(language === "zh" ? `已将 ${members.length} 个节点分组` : `Grouped ${members.length} nodes`);
    return true;
  }, [commitCanvasChange, language, nodes, selectedNodes, setSelectedNodeId, setStatus]);

  const applyUngroup = useCallback((targetIds: string[]) => {
    const current = useScatterStore.getState();
    const result = ungroupNodes(current.nodes, targetIds);
    if (!result.dissolvedGroupIds.length && !result.releasedNodeIds.length) return false;
    current.commitCanvasChange({ nodes: result.nodes });
    if (result.dissolvedGroupIds.length) {
      const dissolvedGroups = new Set(result.dissolvedGroupIds);
      current.setCollapsedGroupIds(current.collapsedGroupIds.filter((id) => !dissolvedGroups.has(id)));
      if (current.selectedNodeId && dissolvedGroups.has(current.selectedNodeId)) {
        current.setSelectedNodeId(result.nodes.find((node) => node.selected)?.id ?? null);
      }
      current.setStatus(language === "zh" ? "分组已解散" : "Group dissolved");
      return true;
    }
    current.setStatus(language === "zh" ? "已移出分组" : "Removed from group");
    return true;
  }, [language]);

  const ungroupNode = useCallback((nodeId: string) => {
    applyUngroup([nodeId]);
  }, [applyUngroup]);

  const ungroupSelection = useCallback(() => {
    const current = useScatterStore.getState();
    const targetIds = new Set(current.nodes
      .filter((node) => node.selected && (node.type === "group" || node.parentId))
      .map((node) => node.id));
    const primarySelection = current.nodes.find((node) => node.id === current.selectedNodeId);
    if (primarySelection && (primarySelection.type === "group" || primarySelection.parentId)) {
      targetIds.add(primarySelection.id);
    }
    return applyUngroup([...targetIds]);
  }, [applyUngroup]);

  const fitGroup = useCallback((groupId: string) => {
    const group = nodes.find((node): node is ScatterGroupNode => node.id === groupId && node.type === "group");
    const members = nodes.filter((node) => node.type !== "group" && node.parentId === groupId);
    if (!group || !members.length) return;
    const width = Math.max(groupMinWidth, ...members.map((node) => node.position.x + nodeBounds(node).width + groupPadding));
    const height = Math.max(groupMinHeight, ...members.map((node) => node.position.y + nodeBounds(node).height + groupPadding));
    commitCanvasChange({ nodes: nodes.map((node) => node.id === groupId ? { ...group, width, height } : node) });
  }, [commitCanvasChange, nodes]);

  const toggleGroup = useCallback((groupId: string) => {
    const collapsing = !collapsedGroupIds.includes(groupId);
    setCollapsedGroupIds(collapsing ? [...collapsedGroupIds, groupId] : collapsedGroupIds.filter((id) => id !== groupId));
    if (collapsing) {
      replaceCanvasLive({ nodes: nodes.map((node) => ({ ...node, selected: node.id === groupId })) });
      setSelectedNodeId(groupId);
    }
    setStatus(language === "zh" ? (collapsing ? "分组已折叠" : "分组已展开") : (collapsing ? "Group collapsed" : "Group expanded"));
  }, [collapsedGroupIds, language, nodes, replaceCanvasLive, setCollapsedGroupIds, setSelectedNodeId, setStatus]);

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
      if (!("body" in data) || typeof data.body !== "string" || !Array.isArray(data.attachments)) return;
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

      if (!event.dataTransfer.files.length) return;
      event.preventDefault();
      const targetNodeId = nodeIdFromElementTarget(event.target);
      const targetNode = nodes.find((node) => node.id === targetNodeId);
      const flowPosition = flowInstanceRef.current?.screenToFlowPosition({ x: event.clientX, y: event.clientY });
      if (targetNode?.type === "asset") {
        setStatus(language === "zh" ? "资产节点首版不支持替换文件" : "Replacing an asset file is not supported yet");
      } else if (flowPosition) {
        const assetPosition = targetNode?.type === "task"
          ? assetPositionNextToTask(targetNode, nodes)
          : { x: flowPosition.x - assetNodeWidth / 2, y: flowPosition.y - 60 };
        void createAssetNodes(
          event.dataTransfer.files,
          "drop",
          assetPosition,
          targetNode?.type === "group" ? targetNode.id : targetNode?.type === "task" ? targetNode.parentId : undefined
        );
      }
    },
    [createAssetNodes, insertTemplateAtPosition, language, nodes, setStatus, templateFromDragEvent]
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
      event.preventDefault();
      const targetNode = nodes.find((node) => node.id === targetNodeId);
      if (!canvasTarget) return;
      const assetPosition = targetNode?.type === "task"
        ? assetPositionNextToTask(targetNode, nodes)
        : getVisibleCanvasCenterPosition();
      void createAssetNodes(
        files,
        "paste",
        assetPosition,
        targetNode?.type === "group" ? targetNode.id : targetNode?.type === "task" ? targetNode.parentId : undefined
      );
    }

    window.addEventListener("paste", handlePaste, true);
    return () => window.removeEventListener("paste", handlePaste, true);
  }, [createAssetNodes, getVisibleCanvasCenterPosition, nodes, pasteCanvasClipboard, project]);

  const runNode = useCallback(
    async (nodeId: string, _mode: RunMode = "flow") => {
      if (!project) return;
      const node = nodes.find((item) => item.id === nodeId);
      if (!node || node.type === "asset") return;
      const mode: RunMode = "flow";
      const result = buildMarkdown(nodes, edges, nodeId, mode, project.name, project.path, language, agentTeamEnabled);
      const hasRunnableInput = result.nodes.some((item) =>
        item.type === "asset" || (item.type === "task" && (item.data.body.trim().length > 0 || item.data.attachments.length > 0))
      );
      if (!hasRunnableInput) {
        setRunStatus(t("status.cannotSendEmpty"), "negative");
        return;
      }

      const threadName = `Canvasight Flow: ${node.data.title || "Untitled"}`;
      const runPayload = {
        attachments: result.attachments,
        agentTeam: result.agentTeam,
        effort: node.type === "task" ? node.data.effort : "xhigh",
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

  const canvasActions = useMemo<CanvasActions>(() => ({
      activeConnectedNodeMenu: connectedNodeMenuRequest
        ? { nodeId: connectedNodeMenuRequest.nodeId, side: connectedNodeMenuRequest.side }
        : null,
      beginNodeEdit: () => undefined,
      commitNodeEdit: () => undefined,
      deleteNode,
      duplicateNode,
      listSkills: async (forceReload = false) => {
        if (!project?.path) throw new Error("Canvasight project is not ready for Skill discovery.");
        const response = await canvasightApi.listSkills(project.path, forceReload);
        return response.skills;
      },
      fitGroup,
      promoteAttachment,
      requestConnectedNodeMenu,
      replaceAsset,
      removeAttachment,
      runNode,
      saveNodeAsTemplate,
      setNodeHover: (nodeId: string, hovered: boolean) => setHoveredNodeId((current) => (hovered ? nodeId : current === nodeId ? null : current)),
      toggleGroup,
      ungroupNode,
      updateNodeData: (nodeId: string, patch: Partial<ScatterNodeData>) => updateNodeData(nodeId, patch)
    }), [connectedNodeMenuRequest, deleteNode, duplicateNode, fitGroup, project?.path, promoteAttachment, removeAttachment, replaceAsset, requestConnectedNodeMenu, runNode, saveNodeAsTemplate, toggleGroup, ungroupNode, updateNodeData]);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      const currentNodes = useScatterStore.getState().nodes;
      const nextNodes = applyNodeChanges(changes, currentNodes as Node[]) as ScatterNode[];
      const hasPersistentChange = stableStringify(currentNodes.map(persistentNodeValue)) !== stableStringify(nextNodes.map(persistentNodeValue));
      if (hasPersistentChange) commitCanvasChange({ nodes: nextNodes });
      else replaceCanvasLive({ nodes: nextNodes });
      const selected = nextNodes.find((node) => node.selected)?.id ?? null;
      if (selected !== selectedNodeId) setSelectedNodeId(selected);
    },
    [commitCanvasChange, replaceCanvasLive, selectedNodeId, setSelectedNodeId]
  );

  const handleNodeDragStart = useCallback(() => {
    beginHistoryTransaction();
  }, [beginHistoryTransaction]);

  const handleNodeDragStop = useCallback((_event: MouseEvent | TouchEvent, dragged: Node) => {
    try {
      const current = useScatterStore.getState();
      const node = current.nodes.find((item) => item.id === dragged.id);
      if (!node || node.type === "group") return;
      const absolute = absoluteNodePosition(node, current.nodes);
      const bounds = nodeBounds(node);
      const center = { x: absolute.x + bounds.width / 2, y: absolute.y + bounds.height / 2 };
      const currentGroup = node.parentId ? current.nodes.find((item): item is ScatterGroupNode => item.id === node.parentId && item.type === "group") : undefined;
      if (currentGroup) {
        const groupBounds = nodeBounds(currentGroup);
        const inside = center.x >= currentGroup.position.x - 12 && center.x <= currentGroup.position.x + groupBounds.width + 12 && center.y >= currentGroup.position.y + groupHeaderHeight - 12 && center.y <= currentGroup.position.y + groupBounds.height + 12;
        if (!inside) {
          commitCanvasChange({ nodes: current.nodes.map((item) => item.id === node.id ? { ...node, parentId: undefined, position: absolute } : item) });
        } else {
          const width = Math.max(currentGroup.width ?? groupMinWidth, node.position.x + bounds.width + groupPadding);
          const height = Math.max(currentGroup.height ?? groupMinHeight, node.position.y + bounds.height + groupPadding);
          if (width !== currentGroup.width || height !== currentGroup.height) {
            commitCanvasChange({ nodes: current.nodes.map((item) => item.id === currentGroup.id ? { ...currentGroup, width, height } : item) });
          }
        }
        return;
      }
      const target = [...current.nodes].reverse().find((item): item is ScatterGroupNode => {
        if (item.type !== "group" || collapsedGroupIds.includes(item.id)) return false;
        const groupBounds = nodeBounds(item);
        return center.x >= item.position.x && center.x <= item.position.x + groupBounds.width && center.y >= item.position.y + groupHeaderHeight && center.y <= item.position.y + groupBounds.height;
      });
      if (!target) return;
      const position = {
        x: Math.max(groupPadding, absolute.x - target.position.x),
        y: Math.max(groupHeaderHeight + groupPadding, absolute.y - target.position.y)
      };
      const width = Math.max(target.width ?? groupMinWidth, position.x + bounds.width + groupPadding);
      const height = Math.max(target.height ?? groupMinHeight, position.y + bounds.height + groupPadding);
      commitCanvasChange({ nodes: current.nodes.map((item) => {
        if (item.id === node.id) return { ...node, parentId: target.id, position };
        if (item.id === target.id) return { ...target, width, height };
        return item;
      }) });
    } finally {
      commitHistoryTransaction();
    }
  }, [collapsedGroupIds, commitCanvasChange, commitHistoryTransaction]);

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      const persistentChanges = changes.filter((change) => change.type === "add" || (!change.id.startsWith(aggregateEdgePrefix) && change.id !== connectionPreviewEdgeId));
      if (!persistentChanges.length) return;
      const acceptedChanges: EdgeChange[] = [];
      let candidateEdges = edges as Edge[];
      persistentChanges.forEach((change) => {
        const nextEdges = applyEdgeChanges([change], candidateEdges);
        if (change.type !== "add" || isConnectionAllowed(change.item, storeEdges(candidateEdges), nodes)) {
          acceptedChanges.push(change);
          candidateEdges = nextEdges;
        }
      });
      if (!acceptedChanges.length) return;
      const nextEdges = applyEdgeChanges(acceptedChanges, edges as Edge[]);
      commitCanvasChange({ edges: storeEdges(nextEdges) });
    },
    [commitCanvasChange, edges, nodes]
  );

  const commitExistingConnection = useCallback(
    (connection: Pick<ScatterEdge, "source" | "target">, selectedNodeIdAfterCommit: string) => {
      if (!isConnectionAllowed(connection, edges, nodes)) return false;

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
      return isConnectionAllowed({ source: connection.source, target: connection.target }, edges, nodes);
    },
    [edges, nodes]
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
    },
    [clearConnectionHoverTarget, edges]
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

      setConnectedNodeMenuRequest({
        id: nanoid(),
        nodeId: sourceNode.id,
        side: connectionStart.handleType === "source" ? "right" : "left",
        anchor: { clientX: clientPosition.x, clientY: clientPosition.y },
        dropPosition: flowPosition,
        projectPath: project.path
      });
    },
    [clearConnectionHoverTarget, commitExistingConnection, nodes, project]
  );

  const handleNodeMouseEnter = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      setHoveredNodeId(node.id);

      const connectionStart = connectionStartRef.current;
      if (!connectionStart) return;

      const hoverConnection = connectionFromStart(connectionStart, node.id);
      if (!hoverConnection || !isConnectionAllowed(hoverConnection, edges, nodes)) {
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
    pendingViewportRecoveryMovesRef.current = 0;
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
      if (!event && pendingViewportRecoveryMovesRef.current > 0) {
        pendingViewportRecoveryMovesRef.current -= 1;
        return;
      }
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
    if (!selectedNode || selectedNode.type === "asset") return;
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
      const targetIsEditable = isEditableTarget(event.target);
      const targetIsKeyboardInteractive = isKeyboardInteractiveTarget(event.target);
      const targetNodeId = nodeIdFromElementTarget(event.target);
      const targetNodeIsSelected = targetNodeId !== null && selectedNodes.some((node) => node.id === targetNodeId);
      const hasPrimaryModifier = event.metaKey || event.ctrlKey;

      if (project && shouldDeleteCanvasSelection({
        key: event.key,
        hasPrimaryModifier,
        altKey: event.altKey,
        shiftKey: event.shiftKey,
        targetIsEditable,
        targetIsKeyboardInteractive,
        targetNodeIsSelected
      }) && deleteSelectedNodes()) {
        event.preventDefault();
        return;
      }

      if (targetIsEditable || targetIsKeyboardInteractive) return;

      if (isSpaceKey(event)) {
        event.preventDefault();
        setSpacePanActive(true);
        return;
      }

      const key = event.key.toLowerCase();

      if (hasPrimaryModifier && !event.altKey) {
        if (project && key === "g") {
          event.preventDefault();
          if (event.shiftKey) ungroupSelection();
          else groupSelectedNodes();
          return;
        }

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
      if (!isSpaceKey(event) || isKeyboardInteractiveTarget(event.target)) return;
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
  }, [addNode, copySelectedNodes, deleteSelectedNodes, fitCanvas, groupSelectedNodes, project, redo, runActiveNode, selectedNodes, toggleMarkdownDrawer, toggleTasksDrawer, toggleTemplatesDrawer, undo, ungroupSelection]);

  return (
    <CanvasActionsProvider actions={canvasActions}>
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
                `displayMode=${getCanvasightStartupIdentity().displayMode}`,
                ...((window.canvasightMcp?.getPresentationDiagnostics() ?? []).map(
                  (entry) => `presentation=${JSON.stringify(entry)}`
                ))
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
                nodes={renderedNodes}
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
                onEdgeClick={(_event, edge) => setSelectedEdgeId(edge.id)}
                onEdgesChange={onEdgesChange}
                onInit={(instance) => {
                  flowInstanceRef.current = instance;
                }}
                onMove={handleMove}
                onMoveEnd={handleMoveEnd}
                onMoveStart={handleMoveStart}
                onNodeClick={(_event, node) => selectNode(node.id, selectedRunMode)}
                onNodeDragStart={handleNodeDragStart}
                onNodeMouseEnter={handleNodeMouseEnter}
                onNodeMouseLeave={handleNodeMouseLeave}
                onNodeDragStop={handleNodeDragStop}
                onNodesChange={onNodesChange}
                onPaneClick={() => { setSelectedEdgeId(null); selectNode(null); }}
              >
                <Background gap={28} size={1} color="rgba(125, 125, 125, 0.22)" />
              </ReactFlow>
              <div className="canvas-run-toolbar" aria-label={t("topbar.windowActions")}>
                <TooltipAnchor label={refreshingDocument ? t("canvas.refreshing") : t("canvas.refreshLatest")} side="bottom" align="end">
                  <IconButton
                    className={`canvas-toolbar-button canvas-refresh-button ${refreshingDocument ? "is-refreshing" : ""}`}
                    filled={false}
                    icon="arrow-rotate-cw"
                    size="lg"
                    aria-label={refreshingDocument ? t("canvas.refreshing") : t("canvas.refreshLatest")}
                    aria-busy={refreshingDocument}
                    disabled={refreshingDocument}
                    onClick={refreshLatestDocument}
                  />
                </TooltipAnchor>
                <span className="canvas-toolbar-divider" aria-hidden />
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
                <TooltipAnchor label={t("canvas.addAsset")}>
                  <IconButton className="canvas-toolbar-button" filled={false} icon="image-square" size="lg" aria-label={t("canvas.addAsset")} onClick={chooseFilesForCanvas} />
                </TooltipAnchor>
                <TooltipAnchor label={t("canvas.group")} shortcut="⌘G">
                  <IconButton className="canvas-toolbar-button" filled={false} icon="members" size="lg" aria-label={t("canvas.group")} disabled={!canGroup} onClick={groupSelectedNodes} />
                </TooltipAnchor>
                <TooltipAnchor label={t("canvas.ungroup")} shortcut="⌘⇧G">
                  <IconButton className="canvas-toolbar-button" filled={false} icon="folder-unshare" size="lg" aria-label={t("canvas.ungroup")} disabled={!canUngroup} onClick={ungroupSelection} />
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
                                  pendingViewportRecoveryMovesRef.current = 0;
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
        {connectedNodeMenuRequest ? (
          <ConnectedNodeMenu
            request={connectedNodeMenuRequest}
            onClose={() => setConnectedNodeMenuRequest(null)}
            onSelect={handleConnectedNodeKind}
          />
        ) : null}
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
    </CanvasActionsProvider>
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
