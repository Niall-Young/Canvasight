import { useCallback, useEffect, useMemo, useRef, useState, type ReactElement } from "react";
import {
  Background,
  MarkerType,
  PanOnScrollMode,
  Position,
  ReactFlow,
  ReactFlowProvider,
  applyNodeChanges,
  type Edge,
  type NodeChange,
  type NodeTypes,
  type ReactFlowInstance,
  type Viewport
} from "@xyflow/react";
import * as RadixDialog from "@radix-ui/react-dialog";
import {
  canvasightApi,
  projectPathFromUrl,
  threadIdFromUrl,
  type ProjectHistoryHostAction,
  type ProjectHistoryNode,
  type ProjectHistoryResponse,
  type ProjectHistoryView
} from "../lib/canvasightApi";
import { createProjectHistoryDemo } from "./projectHistoryDemo";
import { ConfirmDialog } from "./ConfirmDialog";
import { HistoryNode, type HistoryFlowNode, type HistoryNodeActionDetail } from "./HistoryNode";
import { HistoryChatEdge } from "./HistoryChatEdge";
import { ProjectGitNode } from "./ProjectGitNode";
import { HistoryPerspectiveSwitch, ProjectGitPanorama, type HistoryPerspective } from "./ProjectGitPanorama";
import { buildFeatureIntegrationPrompt, buildProjectHistoryFeatureMap, checkpointChangeSummary, checkpointProjectFileCount, checkpointSourceSummary, currentProjectHistoryFocusNodeIds, type ProjectHistoryFeatureMapItem } from "./projectHistoryFeatureMap";
import { layoutProjectHistoryFeatureMap, layoutProjectHistorySearchResults } from "./projectHistoryFeatureLayout";
import { projectHistoryOverviewStatus } from "./projectHistoryStatus";
import { Icon } from "./ui/icon";
import { IconButton } from "./ui/icon-button";
import { TooltipAnchor } from "./ui/tooltip";
import "../styles/history.css";

const historyNodeTypes = { history: HistoryNode, projectGit: ProjectGitNode } as NodeTypes;
const historyEdgeTypes = { historyChat: HistoryChatEdge };
const fallbackView: ProjectHistoryView = {
  schemaVersion: 1,
  revision: 0,
  viewport: { x: 0, y: 0, zoom: 1 },
  positions: {},
  collapsedGroupIds: [],
  filters: { query: "", status: "all", source: "all" }
};

interface HistoryWorkspaceProps {
  language: "zh" | "en";
}

export function WorkspaceModeSwitch({ language, value, onChange }: { language: "zh" | "en"; value: "workflow" | "history"; onChange: (value: "workflow" | "history") => void }): ReactElement {
  return <div className="workspace-mode-switch" role="tablist" aria-label={language === "zh" ? "工作区" : "Workspace"}><button type="button" role="tab" aria-selected={value === "workflow"} className={value === "workflow" ? "is-active" : ""} onClick={() => onChange("workflow")}>{language === "zh" ? "工作流" : "Workflow"}</button><button type="button" role="tab" aria-selected={value === "history"} className={value === "history" ? "is-active" : ""} onClick={() => onChange("history")}>{language === "zh" ? "版本记录" : "Version history"}</button></div>;
}

function featureReference(id: string): string {
  return id.startsWith("feature-") ? id.slice("feature-".length) : id.slice(-6);
}

function historyGraph(response: ProjectHistoryResponse, language: "zh" | "en" = "zh", demoMode = false): { nodes: HistoryFlowNode[]; edges: Edge[]; items: ProjectHistoryFeatureMapItem[] } {
  const index = response.index;
  const view = response.view ?? fallbackView;
  if (!index) return { nodes: [], edges: [], items: [] };
  const allItems = buildProjectHistoryFeatureMap(response, language);
  const query = view.filters.query.trim().toLocaleLowerCase();
  const items = allItems.filter((item) => {
    const queryMatch = !query || `${item.title} ${item.outcome} ${item.nodes.map((node) => node.summary).join(" ")}`.toLocaleLowerCase().includes(query);
    const statusMatch = view.filters.status === "all"
      || (view.filters.status === "incomplete" ? item.nodes.some((node) => node.coverage.complete === false) : item.latestNode.status === view.filters.status);
    const sourceMatch = view.filters.source === "all" || item.nodes.some((node) => node.source === view.filters.source);
    return queryMatch && statusMatch && sourceMatch;
  });
  const latestHostAction = new Map<string, ProjectHistoryHostAction>();
  for (const action of response.hostActions?.actions ?? []) latestHostAction.set(action.nodeId, action);
  const projectRootItem = items.find((item) => item.projectRoot) ?? null;
  const hasProjectRoot = Boolean(projectRootItem);
  const baseline = index.nodes.find((node) => node.kind === "baseline");
  const showBaseline = Boolean(baseline && !hasProjectRoot && !query);
  const layout = query ? layoutProjectHistorySearchResults(items) : layoutProjectHistoryFeatureMap(allItems, { includeProjectStart: showBaseline });
  const featureNodes = items.map((item): HistoryFlowNode => {
    const node = item.latestNode;
    return {
      id: item.nodeId,
      type: "history",
      data: {
        ...node,
        demoMode,
        featureMap: true,
        featureName: item.title,
        featureOutcome: item.outcome,
        checkpointCount: item.checkpointCount,
        dependencyName: item.status === "integrated" ? null : item.dependencyTitle,
        featureMapStatus: item.status,
        projectRoot: item.projectRoot,
        hostAction: latestHostAction.get(node.id),
        mainBranch: response.git?.mainBranch,
        mainCommit: response.git?.mainCommit,
        language
      },
      position: layout.get(item.id) ?? { x: hasProjectRoot ? 80 : 610, y: 100 },
      sourcePosition: Position.Right,
      targetPosition: Position.Left
    };
  });
  const baselineNode: HistoryFlowNode | null = baseline && showBaseline ? {
    id: baseline.id,
    type: "history",
    data: {
      ...baseline,
      demoMode,
      featureMap: true,
      featureName: language === "zh" ? "项目起点" : "Project start",
      featureOutcome: language === "zh" ? "从这里开始记录项目功能进度" : "Feature progress is recorded from here",
      checkpointCount: 0,
      mainBranch: response.git?.mainBranch,
      mainCommit: response.git?.mainCommit,
      language
    },
    position: { x: 80, y: 100 },
    sourcePosition: Position.Right,
    targetPosition: Position.Left
  } : null;
  const nodeIdForItem = new Map(items.map((item) => [item.id, item.nodeId] as const));
  const edges = items.flatMap((item): Edge[] => {
    const semanticDependencyId = item.dependencyId ?? (!item.projectRoot ? projectRootItem?.id ?? null : null);
    if (semanticDependencyId && !nodeIdForItem.has(semanticDependencyId)) return [];
    const source = semanticDependencyId ? nodeIdForItem.get(semanticDependencyId) : baselineNode?.id;
    if (!source || source === item.nodeId) return [];
    return [{
    id: `history-feature-edge:${semanticDependencyId ?? "baseline"}:${item.id}`,
    source,
    target: item.nodeId,
    markerEnd: { type: MarkerType.ArrowClosed },
    type: "smoothstep",
    className: item.status === "integrated" ? "history-edge is-mainline" : "history-edge is-branch",
    label: semanticDependencyId && item.status !== "integrated" ? (language === "zh" ? "分支" : "branch") : undefined
  }]; });
  return { nodes: [...(baselineNode ? [baselineNode] : []), ...featureNodes], edges, items };
}

export function HistoryWorkspace({ language }: HistoryWorkspaceProps): ReactElement {
  const zh = language === "zh";
  const [response, setResponse] = useState<ProjectHistoryResponse | null>(null);
  const [demoMode, setDemoMode] = useState(false);
  const [demoResponse, setDemoResponse] = useState<ProjectHistoryResponse>(() => createProjectHistoryDemo(language));
  const [nodes, setNodes] = useState<HistoryFlowNode[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [detailNodeId, setDetailNodeId] = useState<string | null>(null);
  const [demoNotice, setDemoNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enableDialogOpen, setEnableDialogOpen] = useState(false);
  const [continueNode, setContinueNode] = useState<ProjectHistoryNode | null>(null);
  const [integrateNode, setIntegrateNode] = useState<ProjectHistoryNode | null>(null);
  const [summaryDraft, setSummaryDraft] = useState("");
  const [featureNameDraft, setFeatureNameDraft] = useState("");
  const [operationBusy, setOperationBusy] = useState(false);
  const [hostActionBusy, setHostActionBusy] = useState(false);
  const [hostActionNotice, setHostActionNotice] = useState<ProjectHistoryHostAction | null>(null);
  const [portabilityOpen, setPortabilityOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [selectedRemote, setSelectedRemote] = useState("");
  const [portabilityNotice, setPortabilityNotice] = useState<string | null>(null);
  const [releaseNotice, setReleaseNotice] = useState<string | null>(null);
  const [perspective, setPerspective] = useState<HistoryPerspective>("restore-points");
  const flowRef = useRef<ReactFlowInstance<HistoryFlowNode, Edge> | null>(null);
  const portabilityFileRef = useRef<HTMLInputElement | null>(null);
  const saveTimerRef = useRef<number | null>(null);
  const didSmartFocusRef = useRef(false);
  const responseRef = useRef<ProjectHistoryResponse | null>(null);
  const activeResponse = demoMode ? demoResponse : response;
  const view = activeResponse?.view ?? fallbackView;
  const featureMapItems = useMemo(() => activeResponse ? buildProjectHistoryFeatureMap(activeResponse, language) : [], [activeResponse, language]);
  const visibleNodeKey = nodes.map((node) => node.id).join("\u001f");

  const applyResponse = useCallback((next: ProjectHistoryResponse) => {
    responseRef.current = next;
    setResponse(next);
  }, []);

  useEffect(() => {
    setDemoResponse(createProjectHistoryDemo(language));
  }, [language]);

  useEffect(() => {
    if (!activeResponse) {
      setNodes([]);
      setEdges([]);
      return;
    }
    const graph = historyGraph(activeResponse, language, demoMode);
    setNodes(graph.nodes);
    setEdges(graph.edges);
  }, [activeResponse, demoMode, language]);

  const load = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      applyResponse(refresh ? await canvasightApi.refreshProjectHistory() : await canvasightApi.getProjectHistory());
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [applyResponse]);

  useEffect(() => { void load(false); }, [load]);
  useEffect(() => {
    const openChat = (event: Event) => {
      const chat = (event as CustomEvent<{ taskId?: string; turnId?: string }>).detail;
      if (!chat?.taskId) return;
      if (demoMode) {
        setDemoNotice(zh ? "示例说明：真实节点会通过 Codex 原生能力定位到这一轮聊天。" : "Demo: a real node uses the native Codex capability to open this chat turn.");
        return;
      }
      const prompt = `The user clicked a Project History chat marker. Open Codex task ${chat.taskId} with the first-party task navigation capability. The relevant turn ID is ${chat.turnId || "unknown"}; do not copy or summarize the chat.`;
      void canvasightApi.sendFollowUpMessage({ content: [{ type: "text", text: prompt }], prompt }).catch((caught) => setError(caught instanceof Error ? caught.message : String(caught)));
    };
    window.addEventListener("canvasight-history-chat", openChat);
    return () => window.removeEventListener("canvasight-history-chat", openChat);
  }, [demoMode, zh]);
  useEffect(() => {
    if (demoMode || !response?.enabled) return;
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") void load(true);
    }, 12_000);
    return () => window.clearInterval(timer);
  }, [demoMode, load, response?.enabled]);

  const selectedNode = activeResponse?.index?.nodes.find((node) => node.id === selectedNodeId) ?? null;
  const selectedFeatureMapItem = featureMapItems.find((item) => item.nodeId === selectedNodeId) ?? null;
  const selectedFeature = activeResponse?.index?.featureLines.find((feature) => feature.id === selectedNode?.featureLineId) ?? null;
  const latestSelectedHostAction = [...(activeResponse?.hostActions?.actions ?? [])].reverse().find((action) => action.nodeId === selectedNode?.id) ?? null;
  const selectedHostAction = latestSelectedHostAction?.status === "cancelled" ? null : latestSelectedHostAction;
  const currentFocusNodeIds = useMemo(
    () => currentProjectHistoryFocusNodeIds(featureMapItems, activeResponse?.gitTopology?.currentBranch),
    [activeResponse?.gitTopology?.currentBranch, featureMapItems]
  );
  useEffect(() => { setSummaryDraft(selectedNode?.summary ?? ""); }, [selectedNode?.id, selectedNode?.summary]);
  useEffect(() => { setFeatureNameDraft(selectedFeature?.name ?? ""); }, [selectedFeature?.id, selectedFeature?.name]);
  const saveView = useCallback((view: ProjectHistoryView) => {
    if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    saveTimerRef.current = window.setTimeout(() => {
      const current = responseRef.current;
      if (!current?.view) return;
      void canvasightApi.saveProjectHistoryView(view, current.view.revision).then((saved) => {
        const latest = responseRef.current;
        if (latest) applyResponse({ ...latest, view: saved });
      }).catch(() => void load(false));
    }, 350);
  }, [applyResponse, load]);

  useEffect(() => {
    if (demoMode) return;
    const current = responseRef.current;
    if (!current?.view || current.view.revision !== 0 || !current.index?.processGroups.length || current.view.collapsedGroupIds.length > 0) return;
    const view = { ...current.view, collapsedGroupIds: current.index.processGroups.map((group) => group.id) };
    applyResponse({ ...current, view });
    saveView(view);
  }, [applyResponse, demoMode, response?.index?.processGroups.length, response?.view?.revision, saveView]);

  const updateFilters = useCallback((changes: Partial<ProjectHistoryView["filters"]>) => {
    if (demoMode) {
      setDemoResponse((current) => current.view ? ({ ...current, view: { ...current.view, filters: { ...current.view.filters, ...changes } } }) : current);
      return;
    }
    const current = responseRef.current;
    if (!current?.view) return;
    const view = { ...current.view, filters: { ...current.view.filters, ...changes } };
    applyResponse({ ...current, view });
    saveView(view);
  }, [applyResponse, demoMode, saveView]);

  const onNodesChange = useCallback((changes: NodeChange<HistoryFlowNode>[]) => {
    setNodes((current) => applyNodeChanges(changes, current));
  }, []);

  const saveViewport = useCallback((_event: MouseEvent | TouchEvent | null, viewport: Viewport) => {
    if (demoMode) {
      setDemoResponse((current) => current.view ? ({ ...current, view: { ...current.view, viewport } }) : current);
      return;
    }
    const current = responseRef.current;
    if (!current?.view) return;
    const view = { ...current.view, viewport };
    responseRef.current = { ...current, view };
    setResponse(responseRef.current);
    saveView(view);
  }, [demoMode, saveView]);

  const saveGitNodePosition = useCallback((nodeId: string, position: { x: number; y: number }) => {
    if (demoMode) {
      setDemoResponse((current) => current.view ? ({ ...current, view: { ...current.view, positions: { ...current.view.positions, [nodeId]: position } } }) : current);
      return;
    }
    const current = responseRef.current;
    if (!current?.view) return;
    const view = { ...current.view, positions: { ...current.view.positions, [nodeId]: position } };
    applyResponse({ ...current, view });
    saveView(view);
  }, [applyResponse, demoMode, saveView]);

  const enable = useCallback(async () => {
    setEnableDialogOpen(false);
    setLoading(true);
    setError(null);
    try {
      applyResponse(await canvasightApi.enableProjectHistory({
        confirmGitInitialization: responseRef.current?.status === "needs-git-confirmation",
        classifyDirtyState: "project-start",
        threadId: threadIdFromUrl()
      }));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught));
    } finally {
      setLoading(false);
    }
  }, [applyResponse]);

  const waitForHostAction = useCallback(async (requestId: string): Promise<ProjectHistoryHostAction> => {
    let status = await canvasightApi.getProjectHistoryHostAction(requestId);
    for (let attempt = 0; attempt < 42 && status.status === "pending"; attempt += 1) {
      await new Promise((resolve) => window.setTimeout(resolve, 800));
      status = await canvasightApi.getProjectHistoryHostAction(requestId);
      setHostActionNotice(status.status === "cancelled" ? null : status);
    }
    return status;
  }, []);

  const runHostAction = useCallback(async (node: ProjectHistoryNode, action: "navigate" | "continue") => {
    const sourceTaskId = threadIdFromUrl();
    if (!sourceTaskId) {
      setError(zh ? "当前 Canvasight 页面没有绑定 Codex 任务，无法执行原生操作。" : "This Canvasight page is not bound to a Codex task, so the native action cannot run.");
      return;
    }
    setError(null);
    setHostActionBusy(true);
    let requestId = "";
    try {
      const preparation = await canvasightApi.prepareProjectHistoryHostAction(node.id, action, sourceTaskId);
      requestId = preparation.requestId;
      setHostActionNotice(preparation);
      applyResponse(await canvasightApi.getProjectHistory());
      try {
        await canvasightApi.sendFollowUpMessage({ content: [{ type: "text", text: preparation.prompt }], prompt: preparation.prompt });
      } catch (caught) {
        const message = caught instanceof Error ? caught.message : String(caught);
        const failed = await canvasightApi.markProjectHistoryHostActionDispatchFailed(preparation.requestId, message);
        setHostActionNotice(failed);
        throw caught;
      }
      const result = await waitForHostAction(preparation.requestId);
      if (result.status === "cancelled") setHostActionNotice(null);
      if (result.status === "failed") setError(result.error || (zh ? "Codex 原生操作失败。" : "The Codex native action failed."));
      await load(false);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught));
      if (requestId) {
        const status = await canvasightApi.getProjectHistoryHostAction(requestId).catch(() => null);
        if (status) setHostActionNotice(status);
      }
    } finally {
      setHostActionBusy(false);
    }
  }, [applyResponse, load, waitForHostAction, zh]);

  const navigateToTask = useCallback(async (node: ProjectHistoryNode) => {
    if (!node.taskId || node.taskId === "external-change") return;
    if (demoMode) {
      setDemoNotice(zh ? "示例说明：真实节点会直接回到产生该修改的 Codex 聊天。" : "Demo: a real node opens the Codex chat that produced this change.");
      return;
    }
    await runHostAction(node, "navigate");
  }, [demoMode, runHostAction, zh]);

  const continueFromNode = useCallback(async (node: ProjectHistoryNode) => {
    setContinueNode(null);
    if (demoMode) {
      setDemoNotice(zh ? "示例说明：真实节点会创建隔离的新任务，当前项目与 main 保持不变。" : "Demo: a real node creates an isolated task while the current project and main remain unchanged.");
      return;
    }
    await runHostAction(node, "continue");
  }, [demoMode, runHostAction, zh]);

  const integrateFeatureWithCodex = useCallback(async (node: ProjectHistoryNode) => {
    setIntegrateNode(null);
    const item = featureMapItems.find((candidate) => candidate.nodeId === node.id);
    if (demoMode) {
      setDemoNotice(zh ? "示例说明：真实功能会把功能目标、分支和恢复点发送给当前 Codex 任务，由 Codex 检查并整合到本地 main。" : "Demo: the real action sends the feature goal, branch, and checkpoint to the current Codex task for checked local integration into main.");
      return;
    }
    if (!item) return;
    const threadId = threadIdFromUrl();
    if (!threadId) {
      setError(zh ? "当前 Canvasight 页面没有绑定 Codex 任务，无法发送整合请求。" : "This Canvasight page is not bound to a Codex task, so the integration request cannot be sent.");
      return;
    }
    const prompt = buildFeatureIntegrationPrompt({ item, projectPath: projectPathFromUrl(), language });
    setOperationBusy(true);
    setError(null);
    try {
      await canvasightApi.sendFollowUpMessage({ content: [{ type: "text", text: prompt }], prompt });
      setReleaseNotice(zh ? `已把“${item.title}”的整合请求发送给当前 Codex 任务。Codex 会先检查，遇到问题会停止，不会自动 push。` : `The integration request for “${item.title}” was sent to the current Codex task. Codex will check first, stop on problems, and never push automatically.`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught));
    } finally {
      setOperationBusy(false);
    }
  }, [demoMode, featureMapItems, language, zh]);

  const editSummary = useCallback(async () => {
    if (demoMode || !selectedNode || !summaryDraft.trim() || summaryDraft.trim() === selectedNode.summary) return;
    setOperationBusy(true);
    setError(null);
    try {
      applyResponse(await canvasightApi.editProjectHistoryNode(selectedNode.id, summaryDraft));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught));
    } finally {
      setOperationBusy(false);
    }
  }, [applyResponse, demoMode, selectedNode, summaryDraft]);

  const reclassify = useCallback(async (featureLineId: string) => {
    if (demoMode || !selectedNode || !featureLineId || featureLineId === selectedNode.featureLineId) return;
    setOperationBusy(true);
    setError(null);
    try {
      const updated = await canvasightApi.reclassifyProjectHistoryNode(selectedNode.id, featureLineId);
      applyResponse(updated);
      const targetName = updated.index?.featureLines.find((feature) => feature.id === featureLineId)?.name ?? featureLineId;
      setReleaseNotice(zh ? `已归入功能“${targetName}”。Git 快照本身没有改写。` : `Moved to feature “${targetName}”. The Git snapshot was not rewritten.`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught));
    } finally {
      setOperationBusy(false);
    }
  }, [applyResponse, demoMode, selectedNode, zh]);

  const setFeatureAbandoned = useCallback(async (abandoned: boolean) => {
    if (demoMode || !selectedNode?.featureLineId) return;
    setOperationBusy(true);
    setError(null);
    try {
      applyResponse(await canvasightApi.setProjectHistoryFeatureState(selectedNode.featureLineId, abandoned));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught));
    } finally {
      setOperationBusy(false);
    }
  }, [applyResponse, demoMode, selectedNode?.featureLineId]);

  const renameFeature = useCallback(async () => {
    if (demoMode || !selectedFeature || !featureNameDraft.trim() || featureNameDraft.trim() === selectedFeature.name) return;
    setOperationBusy(true);
    setError(null);
    try {
      applyResponse(await canvasightApi.renameProjectHistoryFeature(selectedFeature.id, featureNameDraft));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught));
    } finally {
      setOperationBusy(false);
    }
  }, [applyResponse, demoMode, featureNameDraft, selectedFeature]);

  const runPortability = useCallback(async (
    operation: "authorize" | "revoke" | "sync" | "import" | "write-local" | "export-local" | "import-local",
    manifest?: unknown
  ) => {
    setOperationBusy(true);
    setError(null);
    setPortabilityNotice(null);
    try {
      const result = await canvasightApi.updateProjectHistoryPortability(
        operation,
        selectedRemote || responseRef.current?.portability?.remote || undefined,
        manifest
      );
      applyResponse(result.history);
      if (operation === "authorize" || operation === "import") setSelectedRemote(result.history.portability?.remote ?? selectedRemote);
      const detail = result.operation as { fileName?: string; missingObjectIds?: string[] };
      if (operation === "export-local") {
        setPortabilityNotice(detail.fileName
          ? (zh ? `已导出到“下载”：${detail.fileName}` : `Exported to Downloads: ${detail.fileName}`)
          : (zh ? "历史清单已导出。" : "History manifest exported."));
      }
      if (operation === "import-local") {
        const missing = detail.missingObjectIds?.length ?? 0;
        setPortabilityNotice(missing > 0
          ? (zh ? `清单已导入；${missing} 个恢复点代码不在本机。` : `Manifest imported; ${missing} restore objects are unavailable locally.`)
          : (zh ? "历史清单和布局已导入。" : "History manifest and layout imported."));
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught));
    } finally {
      setOperationBusy(false);
    }
  }, [applyResponse, selectedRemote, zh]);

  const importPortabilityFile = useCallback(async (file: File | undefined) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setError(zh ? "历史清单超过 10 MB，未导入。" : "History manifest exceeds 10 MB and was not imported.");
      return;
    }
    try {
      await runPortability("import-local", JSON.parse(await file.text()));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught));
    }
  }, [runPortability, zh]);

  const selectHistoryNode = useCallback((nodeId: string | null) => {
    setSelectedNodeId(nodeId);
    setNodes((current) => current.map((node) => node.selected === (node.id === nodeId) ? node : ({ ...node, selected: node.id === nodeId })));
  }, []);

  useEffect(() => {
    const handleNodeAction = (event: Event) => {
      const detail = (event as CustomEvent<HistoryNodeActionDetail>).detail;
      if (!detail?.nodeId) return;
      const node = activeResponse?.index?.nodes.find((item) => item.id === detail.nodeId);
      if (!node) return;
      selectHistoryNode(node.id);
      if (detail.action === "details") {
        setDetailNodeId(node.id);
      } else if (detail.action === "continue") {
        setContinueNode(node);
      } else if (detail.action === "integrate") {
        setIntegrateNode(node);
      }
    };
    window.addEventListener("canvasight-history-node-action", handleNodeAction);
    return () => window.removeEventListener("canvasight-history-node-action", handleNodeAction);
  }, [activeResponse, selectHistoryNode]);

  useEffect(() => {
    if (!demoMode || nodes.length === 0) return;
    const frame = window.requestAnimationFrame(() => {
      const instance = flowRef.current;
      if (!instance) return;
      void instance.fitView({ padding: 0.16, maxZoom: 0.9 });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [demoMode, nodes.length]);

  const focusCurrentProgress = useCallback((duration = 260) => {
    const instance = flowRef.current;
    if (!instance || currentFocusNodeIds.length === 0) return;
    void instance.fitView({
      nodes: currentFocusNodeIds.map((id) => ({ id })),
      padding: 0.24,
      minZoom: 0.72,
      maxZoom: 1,
      duration
    });
  }, [currentFocusNodeIds]);

  useEffect(() => {
    if (!view.filters.query.trim() || nodes.length === 0) return;
    const frame = window.requestAnimationFrame(() => {
      void flowRef.current?.fitView({
        nodes: nodes.map((node) => ({ id: node.id })),
        padding: 0.24,
        minZoom: 0.68,
        maxZoom: 1.05,
        duration: 180
      });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [visibleNodeKey, view.filters.query]);

  if (loading && !response && !demoMode) return <div className="history-state"><span className="history-spinner" />{zh ? "正在读取项目历史…" : "Loading project history…"}</div>;

  if (!demoMode && (response?.status === "needs-git-confirmation" || (response?.status === "ready" && !response.enabled))) {
    const scan = response.scan;
    return (
      <div className="history-onboarding">
        <div className="history-onboarding-card">
          <Icon name="shield-lock" size={28} />
          <h2>{zh ? "启用项目保护" : "Enable project protection"}</h2>
          <p>{response.status === "needs-git-confirmation"
            ? (zh ? "这个项目还没有本地版本保护。确认后，Canvasight 会建立本地恢复基础，并开始记录后续功能进度。" : "This project has no local version protection. After confirmation, Canvasight creates a local recovery base and starts recording later feature progress.")
            : (zh ? "启用后，有代码变化的开发阶段会形成本地恢复点；不会自动上传代码。" : "After enabling, development stages with code changes become local checkpoints; code is never uploaded automatically.")}</p>
          {scan ? <dl className="history-scan-summary">
            <div><dt>{zh ? "扫描文件" : "Scanned files"}</dt><dd>{scan.fileCount}{scan.truncated ? "+" : ""}</dd></div>
            <div><dt>{zh ? "敏感文件" : "Sensitive files"}</dt><dd>{scan.sensitiveCount} {zh ? "个（默认排除）" : "(excluded)"}</dd></div>
            <div><dt>{zh ? "排除目录" : "Excluded folders"}</dt><dd>{scan.excludedDirectoryCount}</dd></div>
          </dl> : null}
          {error ? <p className="history-inline-error" role="alert">{error}</p> : null}
          <div className="history-onboarding-actions">
            <button className="history-primary-button" type="button" onClick={() => setEnableDialogOpen(true)}>{zh ? "查看范围并启用" : "Review and enable"}</button>
            <button className="history-secondary-button" type="button" onClick={() => { setDemoNotice(null); setDemoMode(true); }}>{zh ? "先看完整示例" : "Preview complete example"}</button>
          </div>
        </div>
        <ConfirmDialog
          open={enableDialogOpen}
          title={zh ? "启用项目保护？" : "Enable project protection?"}
          description={response.status === "needs-git-confirmation"
            ? (zh ? "Canvasight 将初始化本地 Git 并自动建立 main，但不会切换当前分支、上传代码或修改项目文件。敏感文件和生成目录默认排除。" : "Canvasight will initialize local Git and create main without switching the current branch, uploading code, or changing project files. Sensitive and generated files stay excluded.")
            : (zh ? "Canvasight 会确认或自动建立本地 main，并创建内部恢复点；不会移动当前分支、修改暂存区或上传代码。" : "Canvasight confirms or creates local main and stores internal restore points without moving the current branch, changing the index, or uploading code.")}
          cancelLabel={zh ? "取消" : "Cancel"}
          closeLabel={zh ? "关闭" : "Close"}
          confirmLabel={zh ? "确认并启用" : "Enable protection"}
          onOpenChange={setEnableDialogOpen}
          onConfirm={() => void enable()}
        />
      </div>
    );
  }

  if (perspective === "panorama" && activeResponse?.gitTopology) {
    return <ReactFlowProvider key="project-git-panorama-flow"><ProjectGitPanorama
      response={activeResponse}
      language={language}
      demoMode={demoMode}
      refreshing={refreshing}
      error={error}
      onRefresh={() => void load(true)}
      onPerspectiveChange={setPerspective}
      onOpenRestorePoint={(nodeId) => {
        setPerspective("restore-points");
        selectHistoryNode(nodeId);
        setDetailNodeId(nodeId);
      }}
      onNodePositionChange={saveGitNodePosition}
      onToggleDemo={(demoMode || (activeResponse.index?.nodes.length ?? 0) === 0) ? () => {
        setDetailNodeId(null);
        selectHistoryNode(null);
        setDemoMode((value) => !value);
      } : undefined}
    /></ReactFlowProvider>;
  }

  const hasActionableFeatures = featureMapItems.some((item) => !item.projectRoot && item.status !== "integrated" && item.status !== "abandoned");
  const overviewStatus = projectHistoryOverviewStatus(activeResponse, language, demoMode, hasActionableFeatures);
  return (
    <div className="history-workspace">
      <div className={`history-coverage-bar is-${overviewStatus.tone}`} role="status" data-history-state={overviewStatus.state}>
        <span><Icon name={overviewStatus.icon} size={15} />{overviewStatus.title}</span>
        <span>{overviewStatus.detail}</span>
        {activeResponse?.providerWarning ? <span className="history-provider-warning">{zh ? "任务扫描受限" : "Task scan limited"}</span> : null}
        {activeResponse?.gitTopology ? <HistoryPerspectiveSwitch language={language} value="restore-points" onChange={setPerspective} /> : null}
        {(demoMode || (activeResponse?.index?.nodes.length ?? 0) === 0) ? <button type="button" className="history-demo-toggle" onClick={() => { setDemoNotice(null); setDetailNodeId(null); selectHistoryNode(null); setPortabilityOpen(false); setToolsOpen(false); setDemoMode((value) => !value); }}>{demoMode ? (zh ? "返回真实记录" : "Back to real history") : (zh ? "查看示例" : "View example")}</button> : null}
      </div>
      <div className="history-filterbar" aria-label={zh ? "历史筛选" : "History filters"}>
        <label><span className="sr-only">{zh ? "搜索功能进度" : "Search feature progress"}</span><Icon name="search" size={15} /><input value={view.filters.query} placeholder={zh ? "搜索功能或成果" : "Search features or outcomes"} onChange={(event) => updateFilters({ query: event.currentTarget.value })} /></label>
        <button type="button" className={`history-tools-toggle ${toolsOpen ? "is-open" : ""}`} aria-expanded={toolsOpen} onClick={() => setToolsOpen((value) => !value)}><Icon name="manage-history" size={15} />{zh ? "筛选与管理" : "Filter and manage"}<Icon name="chevron-down" size={14} /></button>
        {!demoMode ? <TooltipAnchor label={zh ? "刷新任务与项目变化" : "Refresh tasks and project changes"} side="bottom">
          <IconButton className={`history-refresh-button ${refreshing ? "is-refreshing" : ""}`} filled={false} icon="arrow-rotate-cw" size="lg" aria-label={zh ? "刷新历史" : "Refresh history"} aria-busy={refreshing} disabled={refreshing} onClick={() => void load(true)} />
        </TooltipAnchor> : null}
        {toolsOpen ? <div className="history-tools-panel">
          <details className="history-reading-help">
            <summary>{zh ? "怎么看功能地图" : "How to read the feature map"}</summary>
            <div className="history-semantics" aria-label={zh ? "版本记录说明" : "Version history guide"}>
              <span><Icon name="manage-history" size={14} /><strong>{zh ? "功能卡片" : "Feature card"}</strong>{zh ? "这项功能做了什么、现在到哪一步" : "what the feature does and where it stands"}</span>
              <span><Icon name="arrow-curved-right" size={14} /><strong>{zh ? "功能连线" : "Feature connection"}</strong>{zh ? "表示真实依赖，不是每次保存" : "a real dependency, not every save"}</span>
              <span><Icon name="shield-lock" size={14} /><strong>{zh ? "自动恢复点" : "Auto checkpoint"}</strong>{zh ? "折叠在功能卡内，需要回退时再看" : "folded inside the feature until recovery is needed"}</span>
              <span><Icon name="clock" size={14} /><strong>{zh ? "记录开始" : "Coverage since"}</strong>{activeResponse?.provider?.coverageStartedAt ? new Date(activeResponse.provider.coverageStartedAt).toLocaleString() : (zh ? "时间待确认" : "time unavailable")}</span>
              <span className="history-git-branches"><strong>{zh ? "合并目标" : "Merge target"}</strong><code>{activeResponse?.git?.mainBranch ?? "main"}</code>{activeResponse?.git?.currentBranch ? <>{zh ? "当前分支" : "current branch"}<code>{activeResponse.git.currentBranch}</code></> : null}</span>
            </div>
          </details>
          <label className="history-tools-field"><span>{zh ? "状态" : "Status"}</span><select aria-label={zh ? "状态筛选" : "Status filter"} value={view.filters.status} onChange={(event) => updateFilters({ status: event.currentTarget.value })}>
            <option value="all">{zh ? "全部状态" : "All states"}</option><option value="protected">{zh ? "已保存" : "Saved"}</option><option value="incomplete">{zh ? "有未包含文件" : "Files omitted"}</option>
          </select></label>
          <label className="history-tools-field"><span>{zh ? "来源" : "Source"}</span><select aria-label={zh ? "来源筛选" : "Source filter"} value={view.filters.source} onChange={(event) => updateFilters({ source: event.currentTarget.value })}>
            <option value="all">{zh ? "全部来源" : "All sources"}</option><option value="codex">Codex</option><option value="mixed">{zh ? "Codex + 其他修改" : "Codex + other edits"}</option><option value="external">{zh ? "项目变化" : "Project changes"}</option><option value="portable">{zh ? "跨设备记录" : "Cross-device records"}</option>
          </select></label>
          {!demoMode ? <div className="history-tools-actions">
            <button type="button" className="history-secondary-button" disabled={operationBusy} onClick={() => { setOperationBusy(true); void canvasightApi.saveProjectHistoryNow().then(applyResponse).catch((caught) => setError(caught instanceof Error ? caught.message : String(caught))).finally(() => setOperationBusy(false)); }}><Icon name="notebook-check" size={15} />{zh ? "保存当前变化" : "Save current changes"}</button>
            <button type="button" className="history-secondary-button" onClick={() => { setSelectedRemote(response?.portability?.remote ?? response?.portability?.remotes[0] ?? ""); setToolsOpen(false); setPortabilityOpen((value) => !value); }}><Icon name="download" size={15} />{zh ? "跨设备记录" : "Cross-device records"}</button>
          </div> : null}
        </div> : null}
      </div>
      {error ? <div className="history-error-banner" role="alert">{error}<button type="button" onClick={() => void load(false)}>{zh ? "重试" : "Retry"}</button></div> : null}
      {demoNotice ? <div className="history-demo-notice" role="status"><Icon name="eye" size={15} /><span>{demoNotice}</span><IconButton filled={false} icon="x" size="sm" aria-label={zh ? "关闭说明" : "Close explanation"} onClick={() => setDemoNotice(null)} /></div> : null}
      {!error && !demoNotice && releaseNotice ? <div className="history-demo-notice history-release-notice" role="status"><Icon name="check-circle" size={15} /><span>{releaseNotice}</span><IconButton filled={false} icon="x" size="sm" aria-label={zh ? "关闭状态" : "Close status"} onClick={() => setReleaseNotice(null)} /></div> : null}
      {!error && !demoNotice && !releaseNotice && hostActionNotice && hostActionNotice.status !== "cancelled" ? <div className={`history-demo-notice history-host-action-notice is-${hostActionNotice.status}`} role="status"><Icon name={hostActionNotice.status === "failed" ? "warning" : hostActionNotice.status === "pending" || hostActionNotice.status === "queued" ? "clock" : "check-circle"} size={15} /><span>{hostActionNotice.status === "pending" ? (zh ? "请求已发送给 Codex，正在等待操作结果；30 秒没有回执会自动恢复。" : "The request was sent to Codex and is awaiting a result; it resets after 30 seconds without a receipt.") : hostActionNotice.status === "queued" ? (zh ? "Codex 正在创建隔离任务。" : "Codex is creating the isolated task.") : hostActionNotice.status === "succeeded" ? (hostActionNotice.action === "navigate" ? (zh ? "已通过 Codex 原生能力打开原聊天。" : "The original chat was opened through Codex.") : (zh ? "隔离任务已创建，可以从恢复点继续。" : "The isolated task is ready from this restore point.")) : (zh ? `原生操作失败：${hostActionNotice.error ?? "未知错误"}` : `Native action failed: ${hostActionNotice.error ?? "unknown error"}`)}</span><IconButton filled={false} icon="x" size="sm" aria-label={zh ? "关闭状态" : "Close status"} onClick={() => setHostActionNotice(null)} /></div> : null}
      {!demoMode && portabilityOpen && response?.portability ? <section className="history-portability-panel" aria-label={zh ? "跨设备历史清单" : "Portable history manifest"}><header><div><span>{zh ? "跨设备" : "Cross-device"}</span><h2>{zh ? "只同步画布清单" : "Sync canvas manifest only"}</h2></div><IconButton filled={false} icon="x" size="sm" aria-label={zh ? "关闭" : "Close"} onClick={() => setPortabilityOpen(false)} /></header><p>{zh ? "只包含节点摘要、布局、状态和 Git 引用，不包含聊天内容或项目代码。" : "Includes summaries, layout, status, and Git references—never chat content or project code."}</p>{response.portability.remotes.length === 0 ? <div className="history-portability-actions"><span>{zh ? "没有检测到 Git 远程；可导出文件备份画布清单。" : "No Git remote detected; export a file to back up the canvas manifest."}</span></div> : response.portability.authorized ? <div className="history-portability-actions"><strong>{zh ? `已授权：${response.portability.remote}` : `Authorized: ${response.portability.remote}`}</strong><span>{response.portability.missingObjectCount > 0 ? (zh ? `${response.portability.missingObjectCount} 个恢复点代码未在本机` : `${response.portability.missingObjectCount} restore objects missing locally`) : (zh ? "代码仍不会自动上传" : "Code is still never uploaded")}</span><button type="button" className="history-primary-button" disabled={operationBusy} onClick={() => void runPortability("sync")}>{zh ? "立即同步清单" : "Sync manifest now"}</button><button type="button" className="history-tertiary-button" disabled={operationBusy} onClick={() => void runPortability("revoke")}>{zh ? "停止远程同步" : "Stop remote sync"}</button></div> : <div className="history-portability-actions"><label><span>{zh ? "选择 Git 远程" : "Choose Git remote"}</span><select value={selectedRemote} onChange={(event) => setSelectedRemote(event.currentTarget.value)}>{response.portability.remotes.map((remote) => <option key={remote} value={remote}>{remote}</option>)}</select></label><button type="button" className="history-primary-button" disabled={operationBusy || !selectedRemote} onClick={() => void runPortability("authorize")}>{zh ? "授权同步历史清单" : "Authorize manifest sync"}</button><button type="button" className="history-secondary-button" disabled={operationBusy || !selectedRemote} onClick={() => void runPortability("import")}>{zh ? "从这个远程恢复画布" : "Restore canvas from this remote"}</button></div>}<div className="history-portability-actions"><input ref={portabilityFileRef} hidden type="file" accept="application/json,.json" onChange={(event) => { const file = event.currentTarget.files?.[0]; event.currentTarget.value = ""; void importPortabilityFile(file); }} /><button type="button" className="history-secondary-button" disabled={operationBusy} onClick={() => void runPortability("export-local")}>{zh ? "导出清单文件" : "Export manifest file"}</button><button type="button" className="history-secondary-button" disabled={operationBusy} onClick={() => portabilityFileRef.current?.click()}>{zh ? "导入清单文件" : "Import manifest file"}</button>{portabilityNotice ? <span role="status">{portabilityNotice}</span> : null}</div></section> : null}
      {nodes.length === 0 ? <div className="history-empty"><Icon name="manage-history" size={28} /><strong>{zh ? "还没有代码变化节点" : "No code-change nodes yet"}</strong><span>{zh ? "继续在 Codex 中开发；只有产生净项目变化的轮次才会出现在这里。" : "Keep working in Codex. Only turns with net project changes appear here."}</span></div> : (
        <ReactFlowProvider key="history-feature-map-flow"><ReactFlow<HistoryFlowNode, Edge>
          nodes={nodes}
          edges={edges}
          nodeTypes={historyNodeTypes}
          edgeTypes={historyEdgeTypes}
          defaultViewport={view.viewport}
          minZoom={0.2}
          maxZoom={2}
          panOnScroll
          panOnScrollMode={PanOnScrollMode.Free}
          zoomOnScroll={false}
          zoomOnPinch
          zoomActivationKeyCode="Meta"
          nodesConnectable={false}
          nodesDraggable={false}
          elementsSelectable
          onInit={(instance) => {
            flowRef.current = instance;
            if (!didSmartFocusRef.current) {
              didSmartFocusRef.current = true;
              window.requestAnimationFrame(() => {
                if (!demoMode && currentFocusNodeIds.length > 0 && (view.revision === 0 || view.viewport.zoom < 0.62)) {
                  void instance.fitView({ nodes: currentFocusNodeIds.map((id) => ({ id })), padding: 0.24, minZoom: 0.72, maxZoom: 1, duration: 0 });
                } else if (demoMode || view.revision === 0) {
                  void instance.fitView({ padding: 0.18, maxZoom: 0.9, duration: 0 });
                }
              });
            } else if (!demoMode && nodes.length >= 8 && currentFocusNodeIds.length > 0 && view.viewport.zoom < 0.5) {
              window.setTimeout(() => {
                void instance.fitView({
                  nodes: currentFocusNodeIds.map((id) => ({ id })),
                  padding: 0.24,
                  minZoom: 0.72,
                  maxZoom: 1,
                  duration: 0
                });
              }, 160);
            }
          }}
          onMoveEnd={saveViewport}
          onNodesChange={onNodesChange}
          onNodeClick={(_event, node) => { selectHistoryNode(node.id); setDetailNodeId(node.id); }}
          onPaneClick={() => { setDetailNodeId(null); selectHistoryNode(null); }}
          proOptions={{ hideAttribution: true }}
        >
          <Background gap={28} size={1} color="rgba(125, 125, 125, 0.22)" />
        </ReactFlow></ReactFlowProvider>
      )}
      {nodes.length > 0 ? <div className="history-canvas-tools">
        <TooltipAnchor label={zh ? "回到当前进度" : "Focus current progress"} side="right"><IconButton filled={false} icon="target-arrow" size="lg" aria-label={zh ? "回到当前进度" : "Focus current progress"} onClick={() => focusCurrentProgress()} /></TooltipAnchor>
        <span className="history-canvas-tools-divider" aria-hidden />
        <TooltipAnchor label={zh ? "查看全部历史" : "View all history"} side="right"><IconButton filled={false} icon="maps" size="lg" aria-label={zh ? "查看全部历史" : "View all history"} onClick={() => void flowRef.current?.fitView({ padding: 0.18, maxZoom: 0.9, duration: 260 })} /></TooltipAnchor>
      </div> : null}
      {selectedNode ? <RadixDialog.Root open={detailNodeId === selectedNode.id} onOpenChange={(open) => { if (!open) { setDetailNodeId(null); selectHistoryNode(null); } }}><RadixDialog.Portal><RadixDialog.Overlay className="history-detail-overlay" /><RadixDialog.Content className="history-detail-dialog" aria-describedby={undefined}>
        <header><div><span className="history-inspector-kicker">{selectedNode.kind === "baseline" ? (zh ? "项目起点" : "Project baseline") : selectedFeatureMapItem?.projectRoot ? (zh ? "项目进展" : "Project progress") : (zh ? "功能进展" : "Feature progress")}</span><RadixDialog.Title asChild><h2>{selectedFeatureMapItem?.title ?? selectedNode.summary}</h2></RadixDialog.Title></div><RadixDialog.Close asChild><IconButton filled={false} icon="x" size="sm" aria-label={zh ? "关闭详情" : "Close details"} /></RadixDialog.Close></header>
        <div className="history-detail-scroll">
        {demoMode ? <p className="history-detail-demo-note"><Icon name="eye" size={15} />{zh ? "这是示例节点。你可以查看完整信息，但不会执行 Git 或 Codex 操作。" : "This is a demo node. You can inspect the complete information without running Git or Codex actions."}</p> : null}
        <div className="history-inspector-badges"><span>{selectedNode.kind === "baseline" ? (zh ? "项目起点" : "Project start") : selectedFeatureMapItem ? `${selectedFeatureMapItem.checkpointCount} ${zh ? "个自动恢复点" : "auto checkpoints"}` : (zh ? "恢复点" : "Checkpoint")}</span>{selectedFeatureMapItem?.branch && !selectedFeatureMapItem.projectRoot ? <span>{selectedFeatureMapItem.branch}</span> : null}<span className={selectedNode.coverage.complete ? "" : "is-warning"}>{selectedNode.coverage.complete ? (zh ? "进度可恢复" : "Progress is restorable") : (zh ? "可恢复 · 有未包含内容" : "Restorable · content omitted")}</span>{selectedFeatureMapItem?.dependencyTitle ? <span>{zh ? `依赖：${selectedFeatureMapItem.dependencyTitle}` : `Depends on: ${selectedFeatureMapItem.dependencyTitle}`}</span> : null}</div>
        {selectedFeatureMapItem ? <section className="history-feature-summary"><span>{selectedFeatureMapItem.projectRoot ? (zh ? "最新进展" : "Latest progress") : (zh ? "功能成果" : "Feature outcome")}</span><strong>{selectedFeatureMapItem.outcome}</strong><p>{selectedFeatureMapItem.projectRoot ? (zh ? "这些进展已经进入项目主版本，自动恢复点仍然保留。" : "This progress is in the main project version and its checkpoints remain available.") : selectedFeatureMapItem.status === "developing" ? (zh ? "当前仍在开发，最新进度已经自动保存。" : "Development is active and the latest progress is saved.") : selectedFeatureMapItem.status === "integrated" ? (zh ? "这项功能已经进入项目主版本，恢复点仍然保留。" : "This feature is in the main project version and its checkpoints remain available.") : (zh ? "功能代码已经保存。可以继续开发，也可以交给 Codex 检查并整合到项目。" : "The feature code is saved. Continue developing or ask Codex to check and integrate it into the project.")}</p></section> : <section><h3>{zh ? "起点说明" : "Baseline"}</h3><p>{zh ? "Canvasight 从这里开始自动保存后续项目进度。" : "Canvasight starts saving later project progress from here."}</p></section>}
        {selectedFeatureMapItem ? <details className="history-checkpoints"><summary><span>{zh ? `查看 ${selectedFeatureMapItem.checkpointCount} 个自动恢复点` : `View ${selectedFeatureMapItem.checkpointCount} auto checkpoints`}</span><small>{zh ? "每个节点说明这一阶段做了什么" : "Each checkpoint explains what changed"}</small></summary><ol>{[...selectedFeatureMapItem.nodes].reverse().map((checkpoint, index) => { const fileCount = checkpointProjectFileCount(checkpoint); return <li key={checkpoint.id}><div><strong>{checkpointChangeSummary(checkpoint, language)}</strong><span>{index === 0 ? (zh ? "最新进度" : "Latest progress") : (zh ? `较早进度 ${selectedFeatureMapItem.nodes.length - index}` : `Earlier progress ${selectedFeatureMapItem.nodes.length - index}`)} · {checkpointSourceSummary(checkpoint, language)} · {new Intl.DateTimeFormat(zh ? "zh-CN" : "en", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(checkpoint.occurredAt))}{fileCount ? (zh ? ` · 涉及 ${fileCount} 个项目文件` : ` · ${fileCount} project files`) : ""}</span></div><button type="button" className="history-tertiary-button" disabled={!checkpoint.commit || checkpoint.status === "content-unavailable"} onClick={() => setContinueNode(checkpoint)}>{zh ? "从此处继续" : "Continue here"}</button></li>; })}</ol></details> : null}
        {!selectedNode.coverage.complete ? <section className="history-inspector-warning"><Icon name="warning" size={16} /><div><strong>{zh ? "代码快照可恢复，但有本地内容未托管" : "The code snapshot is restorable, but local content was omitted"}</strong><p>{zh ? `未包含：${[...(selectedNode.coverage.policyExcludedPaths ?? []), ...(selectedNode.coverage.automaticExcludedPaths ?? []), ...(selectedNode.coverage.gapCodes ?? [])].join("、") || "敏感、大文件或外部文件"}` : `Not included: ${[...(selectedNode.coverage.policyExcludedPaths ?? []), ...(selectedNode.coverage.automaticExcludedPaths ?? []), ...(selectedNode.coverage.gapCodes ?? [])].join(", ") || "sensitive, large, or external files"}`}</p></div></section> : null}
        {selectedHostAction ? <section className={`history-verification ${selectedHostAction.status === "failed" ? "is-warning" : selectedHostAction.status === "succeeded" ? "is-passed" : ""}`}><h3>{zh ? "Codex 操作状态" : "Codex action status"}</h3><p>{selectedHostAction.status === "pending" ? (zh ? "请求已经发送；30 秒没有操作结果会自动恢复，不会修改项目。" : "The request was sent. It returns to idle after 30 seconds without a result and does not change the project.") : selectedHostAction.status === "queued" ? (zh ? "隔离任务正在准备。" : "The isolated task is being prepared.") : selectedHostAction.status === "succeeded" ? (selectedHostAction.action === "navigate" ? (zh ? "已打开原任务。" : "The original task was opened.") : (zh ? "隔离任务已创建，可以从恢复点继续。" : "The isolated task is ready from this checkpoint.")) : (selectedHostAction.error ?? (zh ? "Codex 操作失败。" : "The Codex action failed."))}</p></section> : null}
        <details className="history-detail-advanced"><summary>{zh ? "技术证据" : "Technical evidence"}</summary><section className="history-technical-evidence">{selectedNode.agentCheck ? <div className={`history-verification ${selectedNode.agentCheck.status === "passed" ? "is-passed" : "is-warning"}`}><h3>{zh ? "旧版 Agent 验收记录" : "Legacy Agent acceptance record"}</h3><p>{selectedNode.agentCheck.summary ?? (selectedNode.agentCheck.status === "requested" ? (zh ? "旧版验收请求已发送，尚未回填结果。" : "The legacy acceptance request was dispatched and has no result yet.") : (zh ? "没有验收摘要。" : "No acceptance summary."))}</p>{selectedNode.agentCheck.evidence?.length ? <ul>{selectedNode.agentCheck.evidence.map((item, index) => <li key={`${index}:${item}`}><Icon name="check-circle" size={14} />{item}</li>)}</ul> : null}</div> : null}<dl><div><dt>{zh ? "恢复点" : "Checkpoint"}</dt><dd><code>{selectedNode.id}</code></dd></div><div><dt>{zh ? "提交" : "Commit"}</dt><dd><code>{selectedNode.commit.slice(0, 12)}</code></dd></div>{selectedNode.gitBranch ? <div><dt>{zh ? "Git 分支" : "Git branch"}</dt><dd><code>{selectedNode.gitBranch}</code></dd></div> : null}</dl>{selectedNode.changedPaths.length ? <><h3>{zh ? "涉及文件" : "Changed files"}</h3><ul className="history-file-list">{selectedNode.changedPaths.slice(0, 12).map((item) => <li key={`${item.status}:${item.path}`}><code>{item.status}</code><span>{item.path}</span></li>)}</ul></> : <p>{zh ? "这个节点没有文件变化。" : "This node has no file changes."}</p>}</section></details>
        {!selectedFeatureMapItem?.projectRoot ? <details className="history-detail-advanced"><summary>{zh ? "整理名称与分组" : "Organize name and group"}</summary><section className="history-inspector-form"><label><span>{zh ? "版本摘要" : "Version summary"}</span><input value={summaryDraft} maxLength={160} disabled={demoMode} onChange={(event) => setSummaryDraft(event.currentTarget.value)} /></label><button type="button" className="history-secondary-button" disabled={demoMode || operationBusy || !summaryDraft.trim() || summaryDraft.trim() === selectedNode.summary} onClick={() => void editSummary()}>{zh ? "保存摘要" : "Save summary"}</button>{selectedNode.kind !== "baseline" && activeResponse?.index?.featureLines.length ? <label><span>{zh ? "进度分组" : "Progress group"}</span><select value={selectedNode.featureLineId ?? ""} disabled={demoMode || operationBusy} onChange={(event) => void reclassify(event.currentTarget.value)}>{activeResponse.index.featureLines.map((feature) => <option key={feature.id} value={feature.id}>{feature.name} · {featureReference(feature.id)}</option>)}</select></label> : null}{selectedFeature ? <><label><span>{zh ? "分组名称" : "Group name"}</span><input value={featureNameDraft} maxLength={80} disabled={demoMode} onChange={(event) => setFeatureNameDraft(event.currentTarget.value)} /></label><button type="button" className="history-secondary-button" disabled={demoMode || operationBusy || !featureNameDraft.trim() || featureNameDraft.trim() === selectedFeature.name} onClick={() => void renameFeature()}>{zh ? "保存分组名称" : "Save group name"}</button></> : null}{selectedFeature && selectedFeature.status !== "merged" ? <button type="button" className="history-tertiary-button" disabled={demoMode || operationBusy} onClick={() => void setFeatureAbandoned(selectedFeature.status !== "abandoned")}>{selectedFeature.status === "abandoned" ? (zh ? "重新启用这个分组" : "Reactivate this group") : (zh ? "放弃并置灰这个分组" : "Abandon and dim this group")}</button> : null}</section></details> : null}
        <footer>
          {!selectedFeatureMapItem?.projectRoot && selectedNode.taskId !== "external-change" ? <button type="button" className="history-secondary-button" disabled={demoMode || hostActionBusy || selectedHostAction?.status === "pending" || !selectedNode.taskId} onClick={() => void navigateToTask(selectedNode)}><Icon name="chat" size={16} />{zh ? "打开原任务" : "Open original task"}</button> : null}
          <button type="button" className="history-secondary-button" disabled={demoMode || hostActionBusy || selectedHostAction?.status === "pending" || !selectedNode.commit || selectedNode.status === "content-unavailable"} onClick={() => setContinueNode(selectedNode)}><Icon name="arrow-curved-right" size={16} />{selectedNode.status === "content-unavailable" ? (zh ? "代码未在本机" : "Code unavailable") : selectedFeatureMapItem?.projectRoot ? (zh ? "从最新进度继续" : "Continue from latest progress") : (zh ? "继续开发" : "Continue developing")}</button>
          {selectedFeatureMapItem && selectedFeatureMapItem.status !== "integrated" ? <button type="button" className="history-primary-button" disabled={demoMode || operationBusy} onClick={() => setIntegrateNode(selectedNode)}><Icon name="check-circle" size={16} />{zh ? "整合到项目" : "Integrate into project"}</button> : null}
        </footer>
        </div>
      </RadixDialog.Content></RadixDialog.Portal></RadixDialog.Root> : null}
      <ConfirmDialog
        open={Boolean(continueNode)}
        title={zh ? "从这个节点继续？" : "Continue from this node?"}
        description={continueNode?.coverage.complete
          ? (zh ? "Canvasight 会请求 Codex 从这个恢复点创建新的隔离任务。当前项目和原任务不会改变。" : "Canvasight will ask Codex to create a new isolated task from this restore point. The current project and original task stay unchanged.")
          : (zh ? "代码快照可以恢复，但检测到敏感、大文件或外部文件未包含。Canvasight 会创建隔离任务，并把这项范围说明带到新任务。" : "The code snapshot is restorable, but sensitive, large, or external files were omitted. The isolated task will preserve this coverage note.")}
        cancelLabel={zh ? "取消" : "Cancel"}
        closeLabel={zh ? "关闭" : "Close"}
        confirmLabel={zh ? "创建隔离任务" : "Create isolated task"}
        onOpenChange={(open) => { if (!open) setContinueNode(null); }}
        onConfirm={() => { if (continueNode) void continueFromNode(continueNode); }}
      />
      <ConfirmDialog
        open={Boolean(integrateNode)}
        title={zh ? "交给 Codex 检查并整合？" : "Ask Codex to check and integrate?"}
        description={zh ? "Canvasight 会把这项功能的目标、分支、依赖和最新恢复点发送到当前 Codex 任务。Codex 会先检查再决定是否合并到本地 main；遇到冲突或未完成内容会停止，不会 push。" : "Canvasight sends the feature goal, branch, dependency, and latest checkpoint to the current Codex task. Codex checks before integrating into local main, stops on conflicts or unfinished work, and never pushes."}
        cancelLabel={zh ? "取消" : "Cancel"}
        closeLabel={zh ? "关闭" : "Close"}
        confirmLabel={zh ? "发送整合请求" : "Send integration request"}
        onOpenChange={(open) => { if (!open) setIntegrateNode(null); }}
        onConfirm={() => { if (integrateNode) void integrateFeatureWithCodex(integrateNode); }}
      />
    </div>
  );
}
