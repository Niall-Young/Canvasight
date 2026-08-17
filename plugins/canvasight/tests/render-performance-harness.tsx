import { useCallback, useEffect, useMemo, useRef, useState, type ReactElement } from "react";
import { createRoot } from "react-dom/client";
import { ReactFlowProvider, applyNodeChanges, type Edge, type Node, type NodeChange, type ReactFlowInstance } from "@xyflow/react";
import type { ScatterDocument, ScatterNode, ScatterProjectInfo } from "../shared/types";
import { CanvasActionsProvider, type CanvasActions } from "../src/application/CanvasActionsContext";
import { CanvasFlowSurface } from "../src/components/CanvasFlowSurface";
import { I18nProvider } from "../src/lib/i18n";
import { useScatterStore } from "../src/store/scatterStore";
import "@xyflow/react/dist/style.css";
import "../src/styles/app.css";

type PerformanceMemory = Performance & {
  memory?: { usedJSHeapSize?: number };
};

type PerformanceResult = {
  canvasCommits: number;
  heapBytes: number | null;
  hoverMs: number;
  longTaskCount: number;
  nodeCount: number;
  nodeUpdateCommits: number;
  nodeUpdateMs: number;
  p95CanvasCommitMs: number;
  startupMs: number;
  unrelatedCommits: number;
  unrelatedUpdateMs: number;
  zoomMs: number;
};

declare global {
  interface Window {
    __CANVASIGHT_PERFORMANCE_RESULT__?: PerformanceResult;
  }
}

const moduleStartedAt = performance.now();
const nodeCount = Math.max(1, Number.parseInt(new URLSearchParams(window.location.search).get("nodes") || "50", 10));
const now = new Date(0).toISOString();
const defaultViewport = { x: 0, y: 0, zoom: 0.8 };

function createNodes(count: number): ScatterNode[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `perf-node-${index}`,
    type: "task" as const,
    position: { x: (index % 10) * 560, y: Math.floor(index / 10) * 360 },
    selected: index === 0,
    data: {
      title: `Performance Task ${index + 1}`,
      body: "Measure Canvasight render isolation.",
      attachments: [],
      effort: "xhigh" as const,
      runMode: "flow" as const
    }
  }));
}

function createDocument(nodes: ScatterNode[]): ScatterDocument {
  const page = {
    id: "performance-page",
    name: "Performance",
    createdAt: now,
    updatedAt: now,
    viewport: { x: 0, y: 0, zoom: 0.8 },
    viewState: { collapsedGroupIds: [] },
    nodes,
    edges: []
  };
  return {
    version: 2,
    projectName: "Canvasight performance harness",
    updatedAt: now,
    activePageId: page.id,
    pages: [page],
    viewport: page.viewport,
    nodes,
    edges: []
  };
}

const project: ScatterProjectInfo = {
  name: "Canvasight performance harness",
  path: "/canvasight-performance-harness",
  updatedAt: now
};
useScatterStore.getState().setProjectDocument(project, createDocument(createNodes(nodeCount)));

const noop = () => {};
const noopAsync = async () => {};
const actions: CanvasActions = {
  updateNodeData: noop,
  beginNodeEdit: noop,
  commitNodeEdit: noop,
  removeAttachment: noop,
  promoteAttachment: noop,
  replaceAsset: noop,
  activeConnectedNodeMenu: null,
  requestConnectedNodeMenu: noop,
  duplicateNode: noop,
  saveNodeAsTemplate: noopAsync,
  deleteNode: noop,
  setNodeHover: noop,
  runNode: noopAsync,
  toggleGroup: noop,
  ungroupNode: noop,
  fitGroup: noop,
  listSkills: async () => []
};

function nextFrame(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

function p95(values: number[]): number {
  if (!values.length) return 0;
  const sorted = [...values].sort((left, right) => left - right);
  return sorted[Math.min(sorted.length - 1, Math.ceil(sorted.length * 0.95) - 1)];
}

function PerformanceHarness(): ReactElement {
  const nodes = useScatterStore((state) => state.nodes);
  const edges = useScatterStore((state) => state.edges);
  const [panelTick, setPanelTick] = useState(0);
  const flowInstanceRef = useRef<ReactFlowInstance | null>(null);
  const longTasksRef = useRef<number[]>([]);
  const profileStartedRef = useRef(false);

  const onNodesChange = useCallback((changes: NodeChange[]) => {
    const current = useScatterStore.getState().nodes;
    const next = applyNodeChanges(changes, current as Node[]) as ScatterNode[];
    useScatterStore.getState().replaceCanvasLive({ nodes: next });
  }, []);
  const onInit = useCallback((instance: ReactFlowInstance) => {
    flowInstanceRef.current = instance;
  }, []);
  const emptyHandler = useCallback(() => {}, []);
  const validConnection = useCallback(() => true, []);
  const flowEdges = useMemo(() => edges as Edge[], [edges]);

  useEffect(() => {
    if (profileStartedRef.current) return;
    profileStartedRef.current = true;
    const observer = typeof PerformanceObserver === "function"
      ? new PerformanceObserver((entries) => {
          longTasksRef.current.push(...entries.getEntries().map((entry) => entry.duration));
        })
      : null;
    try {
      observer?.observe({ type: "longtask", buffered: true });
    } catch {
      observer?.disconnect();
    }

    void (async () => {
      const metrics = window.__CANVASIGHT_RENDER_METRICS__;
      let stableFrames = 0;
      let lastCommitCount = -1;
      while (stableFrames < 15) {
        await nextFrame();
        const commitCount = metrics?.commits.canvasFlow ?? 0;
        if (commitCount === lastCommitCount) stableFrames += 1;
        else stableFrames = 0;
        lastCommitCount = commitCount;
      }
      const startupMs = performance.now() - moduleStartedAt;
      const startCommits = metrics?.commits.canvasFlow ?? 0;

      const unrelatedStartedAt = performance.now();
      for (let index = 0; index < 30; index += 1) {
        const store = useScatterStore.getState();
        if (index % 3 === 0) store.setStatus(`Performance status ${index}`);
        else if (index % 3 === 1) store.setSaving(index % 2 === 0);
        else store.setDrawer(index % 2 === 0 ? "tasks" : null);
        setPanelTick(index + 1);
        await nextFrame();
      }
      const unrelatedUpdateMs = performance.now() - unrelatedStartedAt;
      const afterUnrelatedCommits = metrics?.commits.canvasFlow ?? 0;

      const nodeUpdateStartedAt = performance.now();
      for (let index = 0; index < 30; index += 1) {
        const current = useScatterStore.getState().nodes;
        useScatterStore.getState().replaceCanvasLive({
          nodes: current.map((node, nodeIndex) => nodeIndex === 0
            ? { ...node, position: { x: node.position.x + 1, y: node.position.y } }
            : node)
        });
        await nextFrame();
      }
      const nodeUpdateMs = performance.now() - nodeUpdateStartedAt;
      const afterNodeCommits = metrics?.commits.canvasFlow ?? 0;

      const zoomStartedAt = performance.now();
      for (const zoom of [0.5, 0.75, 1, 1.25, 0.8]) {
        await flowInstanceRef.current?.zoomTo(zoom);
        await nextFrame();
      }
      const zoomMs = performance.now() - zoomStartedAt;

      const firstNode = document.querySelector<HTMLElement>('.react-flow__node[data-id="perf-node-0"]');
      const hoverStartedAt = performance.now();
      if (firstNode) {
        for (let index = 0; index < 20; index += 1) {
          firstNode.dispatchEvent(new PointerEvent(index % 2 === 0 ? "pointerenter" : "pointerleave", { bubbles: true }));
          await nextFrame();
        }
      }
      const hoverMs = performance.now() - hoverStartedAt;
      await nextFrame();

      const samples = metrics?.samples.canvasFlow?.map((sample) => sample.duration) ?? [];
      window.__CANVASIGHT_PERFORMANCE_RESULT__ = {
        canvasCommits: metrics?.commits.canvasFlow ?? 0,
        heapBytes: Number((performance as PerformanceMemory).memory?.usedJSHeapSize) || null,
        hoverMs,
        longTaskCount: longTasksRef.current.length,
        nodeCount,
        nodeUpdateCommits: afterNodeCommits - afterUnrelatedCommits,
        nodeUpdateMs,
        p95CanvasCommitMs: p95(samples),
        startupMs,
        unrelatedCommits: afterUnrelatedCommits - startCommits,
        unrelatedUpdateMs,
        zoomMs
      };
      observer?.disconnect();
    })();
  }, []);

  return (
    <div style={{ width: "1200px", height: "800px" }} data-panel-tick={panelTick}>
      <CanvasFlowSurface
        nodes={nodes}
        edges={flowEdges}
        defaultViewport={defaultViewport}
        panModeActive={false}
        isValidConnection={validConnection}
        onConnect={emptyHandler}
        onConnectEnd={emptyHandler}
        onConnectStart={emptyHandler}
        onEdgeClick={emptyHandler}
        onEdgesChange={emptyHandler}
        onInit={onInit}
        onMove={emptyHandler}
        onMoveEnd={emptyHandler}
        onMoveStart={emptyHandler}
        onNodeClick={emptyHandler}
        onNodeDragStart={emptyHandler}
        onNodeDragStop={emptyHandler}
        onNodeMouseEnter={emptyHandler}
        onNodeMouseLeave={emptyHandler}
        onNodesChange={onNodesChange}
        onPaneClick={emptyHandler}
      />
    </div>
  );
}

createRoot(document.getElementById("root")!).render(
  <I18nProvider language="en">
    <CanvasActionsProvider actions={actions}>
      <ReactFlowProvider>
        <PerformanceHarness />
      </ReactFlowProvider>
    </CanvasActionsProvider>
  </I18nProvider>
);
