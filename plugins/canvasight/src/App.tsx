import { useCallback, useEffect, useMemo, useRef, useState, type ReactElement } from "react";
import {
  Background,
  ReactFlow,
  ReactFlowProvider,
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  type Connection,
  type Edge,
  type EdgeChange,
  type EdgeTypes,
  type Node,
  type NodeChange,
  type NodeTypes
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
import { ScatterEdge as ScatterFlowEdge } from "./components/ScatterEdge";
import { RightDrawer } from "./components/RightDrawer";
import { TaskNode, setTaskNodeActions } from "./components/TaskNode";
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

function projectNameFromPath(projectPath: string): string {
  return projectPath.split(/[\\/]/).filter(Boolean).at(-1) || "Canvasight Project";
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

function flowEdges(edges: ScatterEdge[], selectedNodeId: string | null): Edge[] {
  return edges.map((edge) => ({
    ...edge,
    type: "scatter",
    data: {
      active: selectedNodeId === edge.source || selectedNodeId === edge.target
    }
  }));
}

function storeEdges(edges: Edge[]): ScatterEdge[] {
  return edges.map(({ id, source, target, label }) => ({ id, source, target, label: typeof label === "string" ? label : undefined }));
}

async function filesToInputs(files: FileList | File[], source: "upload" | "drop" | "paste"): Promise<AttachmentInput[]> {
  const inputs: AttachmentInput[] = [];
  for (const file of Array.from(files)) {
    inputs.push({
      name: file.name,
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
    commitCanvasChange,
    edges,
    isSaving,
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
    status,
    updateNodeData,
    drawer,
    removeAttachment
  } = useScatterStore();
  const [projectPathInput, setProjectPathInput] = useState("");
  const [loadingProject, setLoadingProject] = useState(true);
  const [selectedRunMode, setSelectedRunMode] = useState<RunMode>("flow");
  const hydratedRef = useRef(false);
  const saveTimerRef = useRef<number | null>(null);

  const selectedNode = useMemo(() => nodes.find((node) => node.id === selectedNodeId) ?? null, [nodes, selectedNodeId]);
  const canRun = Boolean(project && selectedNode && selectedNode.data.body.trim().length > 0);
  const markdownResult = useMemo(
    () =>
      project && selectedNode
        ? buildMarkdown(nodes, edges, selectedNode.id, selectedRunMode, project.name, project.path, language)
        : { markdown: "", nodes: [], attachments: [], imagePaths: [], planMode: false, hasCycle: false },
    [edges, language, nodes, project, selectedNode, selectedRunMode]
  );
  const renderedEdges = useMemo(() => flowEdges(edges, selectedNodeId), [edges, selectedNodeId]);

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
        if (session.projectPath) {
          setProjectPathInput(session.projectPath);
          return openProjectPath(session.projectPath);
        }
        setLoadingProject(false);
        hydratedRef.current = true;
        setStatus("Enter a project path to start.");
        return undefined;
      })
      .catch((error) => {
        setLoadingProject(false);
        hydratedRef.current = true;
        setStatus(error instanceof Error ? error.message : t("app.genericError"));
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

  const addNode = useCallback(() => {
    if (!project) return;
    const node = emptyNode({ x: 120 + nodes.length * 36, y: 120 + nodes.length * 28 }, nodes.length);
    commitCanvasChange({
      nodes: [...nodes.map((item) => ({ ...item, selected: false })), node]
    });
    setSelectedNodeId(node.id);
    setStatus("Node created.");
  }, [commitCanvasChange, nodes, project, setSelectedNodeId, setStatus]);

  const createConnectedNode = useCallback(
    (nodeId: string, side: "left" | "right") => {
      const source = nodes.find((node) => node.id === nodeId);
      if (!source) return;
      const delta = side === "right" ? 560 : -560;
      const node = emptyNode({ x: source.position.x + delta, y: source.position.y + 40 }, nodes.length);
      const edge =
        side === "right"
          ? { id: nanoid(), source: source.id, target: node.id }
          : { id: nanoid(), source: node.id, target: source.id };
      commitCanvasChange({
        nodes: [...nodes.map((item) => ({ ...item, selected: false })), node],
        edges: [...edges, edge]
      });
      setSelectedNodeId(node.id);
    },
    [commitCanvasChange, edges, nodes, setSelectedNodeId]
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

  const onConnect = useCallback(
    (connection: Connection) => {
      const nextEdges = addEdge({ ...connection, id: nanoid(), type: "scatter" }, renderedEdges);
      commitCanvasChange({ edges: storeEdges(nextEdges) });
    },
    [commitCanvasChange, renderedEdges]
  );

  const handleProjectSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      void openProjectPath(projectPathInput);
    },
    [openProjectPath, projectPathInput]
  );

  return (
    <div className="canvasight-app app-shell is-sidebar-collapsed">
      <header className="topbar canvasight-topbar" aria-label="Canvasight toolbar">
        <div className="topbar-title canvasight-brand">
          <strong>Canvasight</strong>
          <span>{project?.name || "No project"}</span>
        </div>
        <form className="canvasight-project-form" onSubmit={handleProjectSubmit}>
          <input
            className="canvasight-project-input"
            value={projectPathInput}
            placeholder="/absolute/project/path"
            aria-label="Project path"
            onChange={(event) => setProjectPathInput(event.currentTarget.value)}
          />
          <button className="canvasight-project-open" type="submit" disabled={loadingProject}>
            Open
          </button>
        </form>
        <div className="topbar-status" aria-live="polite">
          {isSaving ? "Saving..." : status}
        </div>
        <div className="topbar-actions">
          <TooltipAnchor label={t("canvas.addNode")} side="bottom">
            <IconButton className="topbar-icon-button" filled={false} icon="plus-lg" size="lg" aria-label={t("canvas.addNode")} disabled={!project} onClick={addNode} />
          </TooltipAnchor>
          <TooltipAnchor label={t("topbar.runCurrentTask")} side="bottom">
            <IconButton
              className="topbar-icon-button"
              filled={false}
              icon="topbar-play"
              size="lg"
              aria-label={t("topbar.runCurrentTask")}
              disabled={!canRun}
              onClick={() => selectedNode && void runNode(selectedNode.id, selectedRunMode)}
            />
          </TooltipAnchor>
          <TooltipAnchor label={t("topbar.taskList")} side="bottom">
            <IconButton
              className={`topbar-icon-button ${drawer === "tasks" ? "is-selected" : ""}`}
              filled={false}
              icon="topbar-tasks"
              size="lg"
              aria-label={t("topbar.taskList")}
              onClick={() => setDrawer(drawer === "tasks" ? null : "tasks")}
            />
          </TooltipAnchor>
          <TooltipAnchor label={t("topbar.openMarkdown")} side="bottom" align="end">
            <IconButton
              className={`topbar-icon-button ${drawer === "markdown" ? "is-selected" : ""}`}
              filled={false}
              icon="topbar-sidebar-right-expand"
              size="lg"
              aria-label={t("topbar.openMarkdown")}
              disabled={!selectedNode}
              onClick={() => setDrawer(drawer === "markdown" ? null : "markdown")}
            />
          </TooltipAnchor>
        </div>
      </header>

      <main className={`workspace-content ${drawer ? "has-right-sidebar" : ""} ${drawer === "markdown" ? "has-markdown-sidebar" : ""}`}>
        <section
          className="canvas-shell"
          onDrop={(event) => {
            if (!selectedNode || !event.dataTransfer.files.length) return;
            event.preventDefault();
            void addFilesToNode(selectedNode.id, event.dataTransfer.files, "drop");
          }}
          onDragOver={(event) => event.preventDefault()}
        >
          {project ? (
            <ReactFlow
              nodes={nodes as Node[]}
              edges={renderedEdges}
              nodeTypes={nodeTypes}
              edgeTypes={edgeTypes}
              defaultEdgeOptions={defaultEdgeOptions}
              proOptions={proOptions}
              fitView
              minZoom={0.2}
              maxZoom={1.4}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onPaneClick={() => selectNode(null)}
              onNodeClick={(_event, node) => selectNode(node.id, selectedRunMode)}
            >
              <Background gap={28} size={1} color="rgba(125, 125, 125, 0.22)" />
            </ReactFlow>
          ) : (
            <div className="empty-workspace canvasight-empty">
              <p>{loadingProject ? "Loading Canvasight..." : "Enter a local project path to open a Canvasight workspace."}</p>
            </div>
          )}
        </section>

        <button className={`workspace-resize-handle ${drawer === "markdown" ? "is-active" : ""}`} type="button" aria-hidden tabIndex={-1} />
        <RightDrawer
          drawer={drawer}
          nodes={nodes}
          edges={edges}
          selectedNodeId={selectedNodeId}
          markdown={markdownResult.markdown}
          currentRunMode={selectedRunMode}
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
