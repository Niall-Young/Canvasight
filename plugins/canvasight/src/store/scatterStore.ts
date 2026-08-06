import { create } from "zustand";
import { nanoid } from "nanoid";
import type {
  RunMode,
  ScatterDocument,
  ScatterEdge,
  ScatterNode,
  ScatterPage,
  ScatterProjectInfo
} from "../../shared/types";

const MAX_HISTORY_LENGTH = 100;

export type DrawerMode = "tasks" | "templates" | "markdown";

interface CanvasSnapshot {
  nodes: ScatterNode[];
  edges: ScatterEdge[];
}

interface CanvasHistory {
  past: CanvasSnapshot[];
  future: CanvasSnapshot[];
  transactionStart: CanvasSnapshot | null;
}

interface CanvasChange {
  nodes?: ScatterNode[];
  edges?: ScatterEdge[];
}

interface ScatterState {
  project: ScatterProjectInfo | null;
  document: ScatterDocument | null;
  pages: ScatterPage[];
  activePageId: string | null;
  nodes: ScatterNode[];
  edges: ScatterEdge[];
  collapsedGroupIds: string[];
  selectedNodeId: string | null;
  drawer: DrawerMode | null;
  theme: "light" | "dark";
  status: string;
  isSaving: boolean;
  canUndo: boolean;
  canRedo: boolean;
  history: CanvasHistory;
  setProjectDocument: (project: ScatterProjectInfo, document: ScatterDocument) => void;
  clearProject: () => void;
  setActivePageId: (pageId: string) => void;
  createPage: () => ScatterPage | null;
  renameActivePage: (name: string) => void;
  deleteActivePage: () => void;
  setActivePageViewport: (viewport: ScatterPage["viewport"]) => void;
  setCollapsedGroupIds: (groupIds: string[]) => void;
  setNodes: (nodes: ScatterNode[]) => void;
  setEdges: (edges: ScatterEdge[]) => void;
  replaceCanvasLive: (change: CanvasChange) => void;
  commitCanvasChange: (change: CanvasChange) => void;
  beginHistoryTransaction: () => void;
  commitHistoryTransaction: () => void;
  cancelHistoryTransaction: () => void;
  undo: () => void;
  redo: () => void;
  updateNodeData: (nodeId: string, patch: Partial<ScatterNode["data"]>) => void;
  removeAttachment: (nodeId: string, attachmentId: string) => void;
  setSelectedNodeId: (nodeId: string | null) => void;
  setDrawer: (drawer: DrawerMode | null) => void;
  setTheme: (theme: "light" | "dark") => void;
  setStatus: (status: string) => void;
  setSaving: (isSaving: boolean) => void;
  markNodeRun: (nodeId: string, runMode: RunMode) => void;
}

function cloneEdgeForHistory(edge: ScatterEdge): ScatterEdge {
  return {
    id: edge.id,
    source: edge.source,
    target: edge.target,
    label: edge.label
  };
}

function cloneNodeForHistory(node: ScatterNode): ScatterNode {
  const { selected: _selected, ...nodeRest } = node;
  if (node.type === "task") {
    const { lastRunAt: _lastRunAt, attachments, ...dataRest } = node.data;
    return {
      ...nodeRest,
      type: "task",
      position: { ...node.position },
      data: { ...dataRest, attachments: attachments.map((attachment) => ({ ...attachment })) }
    };
  }
  if (node.type === "asset") {
    return {
      ...nodeRest,
      type: "asset",
      position: { ...node.position },
      data: { ...node.data, asset: { ...node.data.asset } }
    };
  }
  return { ...nodeRest, type: "group", position: { ...node.position }, data: { ...node.data } };
}

function createSnapshot(nodes: ScatterNode[], edges: ScatterEdge[]): CanvasSnapshot {
  return {
    nodes: nodes.map(cloneNodeForHistory),
    edges: edges.map(cloneEdgeForHistory)
  };
}

function incomingEdgeCounts(edges: ScatterEdge[]): Map<string, number> {
  const counts = new Map<string, number>();
  edges.forEach((edge) => counts.set(edge.target, (counts.get(edge.target) ?? 0) + 1));
  return counts;
}

function canApplyEdgeMutation(currentEdges: ScatterEdge[], nextEdges: ScatterEdge[], nodes: ScatterNode[]): boolean {
  const currentIncoming = incomingEdgeCounts(currentEdges);
  const nextIncoming = incomingEdgeCounts(nextEdges);
  for (const [target, count] of nextIncoming) {
    if (count > Math.max(1, currentIncoming.get(target) ?? 0)) return false;
  }

  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const currentById = new Map(currentEdges.map((edge) => [edge.id, edge]));
  return nextEdges.every((edge) => {
    if (nodeById.get(edge.source)?.type !== "group" && nodeById.get(edge.target)?.type !== "group") return true;
    const current = currentById.get(edge.id);
    return current?.source === edge.source && current.target === edge.target;
  });
}

function emptyHistory(): CanvasHistory {
  return {
    past: [],
    future: [],
    transactionStart: null
  };
}

function clonePageNodes(nodes: ScatterNode[]): ScatterNode[] {
  return nodes.map((node) => ({ ...cloneNodeForHistory(node), selected: false }));
}

function clonePageEdges(edges: ScatterEdge[]): ScatterEdge[] {
  return edges.map(cloneEdgeForHistory);
}

function clonePage(page: ScatterPage): ScatterPage {
  return {
    ...page,
    viewport: { ...page.viewport },
    viewState: { collapsedGroupIds: [...(page.viewState?.collapsedGroupIds ?? [])] },
    nodes: clonePageNodes(page.nodes),
    edges: clonePageEdges(page.edges)
  };
}

function newPage(index: number): ScatterPage {
  const now = new Date().toISOString();
  return {
    id: nanoid(),
    name: `Page ${index + 1}`,
    createdAt: now,
    updatedAt: now,
    viewport: { x: 0, y: 0, zoom: 1 },
    viewState: { collapsedGroupIds: [] },
    nodes: [],
    edges: []
  };
}

function documentPages(document: ScatterDocument): ScatterPage[] {
  if (document.pages.length > 0) return document.pages.map(clonePage);
  const now = document.updatedAt || new Date().toISOString();
  return [
    {
      id: document.activePageId || nanoid(),
      name: "Page 1",
      createdAt: now,
      updatedAt: now,
      viewport: { ...document.viewport },
      viewState: { collapsedGroupIds: [] },
      nodes: clonePageNodes(document.nodes),
      edges: clonePageEdges(document.edges)
    }
  ];
}

function activePageIdFor(pages: ScatterPage[], preferredPageId: string | null): string | null {
  if (!pages.length) return null;
  return preferredPageId && pages.some((page) => page.id === preferredPageId) ? preferredPageId : pages[0].id;
}

function activePageFor(pages: ScatterPage[], activePageId: string | null): ScatterPage | null {
  if (!pages.length) return null;
  return pages.find((page) => page.id === activePageId) ?? pages[0];
}

function pageWithCanvas(page: ScatterPage, nodes: ScatterNode[], edges: ScatterEdge[]): ScatterPage {
  return {
    ...page,
    updatedAt: new Date().toISOString(),
    nodes: clonePageNodes(nodes),
    edges: clonePageEdges(edges)
  };
}

function mergeCanvasIntoPages(state: Pick<ScatterState, "pages" | "activePageId" | "nodes" | "edges">, nodes = state.nodes, edges = state.edges): ScatterPage[] {
  if (!state.activePageId) return state.pages.map(clonePage);
  return state.pages.map((page) => (page.id === state.activePageId ? pageWithCanvas(page, nodes, edges) : clonePage(page)));
}

function updateNodeInPages(
  state: Pick<ScatterState, "pages" | "activePageId" | "nodes" | "edges">,
  nodeId: string,
  updateNode: (node: ScatterNode) => ScatterNode
): { currentPageChanged: boolean; nodes: ScatterNode[]; pages: ScatterPage[] } {
  const currentPageChanged = state.nodes.some((node) => node.id === nodeId);
  if (currentPageChanged) {
    const nodes = state.nodes.map((node) => (node.id === nodeId ? updateNode(node) : node));
    return {
      currentPageChanged,
      nodes,
      pages: mergeCanvasIntoPages(state, nodes, state.edges)
    };
  }

  return {
    currentPageChanged,
    nodes: state.nodes,
    pages: state.pages.map((page) =>
      page.nodes.some((node) => node.id === nodeId)
        ? {
            ...page,
            updatedAt: new Date().toISOString(),
            nodes: page.nodes.map((node) => (node.id === nodeId ? updateNode(node) : node))
          }
        : clonePage(page)
    )
  };
}

function snapshotsEqual(left: CanvasSnapshot, right: CanvasSnapshot): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

function pushHistory(past: CanvasSnapshot[], snapshot: CanvasSnapshot): CanvasSnapshot[] {
  return [...past, snapshot].slice(-MAX_HISTORY_LENGTH);
}

function restoreSnapshotNodes(snapshot: CanvasSnapshot, currentNodes: ScatterNode[], selectedNodeId: string | null): ScatterNode[] {
  const lastRunAtByNodeId = new Map(
    currentNodes
      .filter((node) => node.type === "task" && Boolean(node.data.lastRunAt))
      .map((node) => [node.id, node.type === "task" ? node.data.lastRunAt : undefined])
  );

  return snapshot.nodes.map((node) => {
    const restoredNode = cloneNodeForHistory(node);
    const lastRunAt = lastRunAtByNodeId.get(node.id);

    if (restoredNode.type !== "task") return { ...restoredNode, selected: selectedNodeId === node.id };
    return {
      ...restoredNode,
      selected: selectedNodeId === node.id,
      data: { ...restoredNode.data, ...(lastRunAt ? { lastRunAt } : {}) }
    };
  });
}

function historyFlags(history: CanvasHistory): Pick<ScatterState, "canUndo" | "canRedo"> {
  return {
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0
  };
}

export const useScatterStore = create<ScatterState>((set, get) => {
  const setHistory = (history: CanvasHistory): void => {
    set({
      history,
      ...historyFlags(history)
    });
  };

  const applySnapshot = (snapshot: CanvasSnapshot): void => {
    const state = get();
    const selectedNodeId = state.selectedNodeId && snapshot.nodes.some((node) => node.id === state.selectedNodeId) ? state.selectedNodeId : null;

    set({
      nodes: restoreSnapshotNodes(snapshot, state.nodes, selectedNodeId),
      edges: snapshot.edges.map(cloneEdgeForHistory),
      pages: mergeCanvasIntoPages(state, snapshot.nodes, snapshot.edges),
      selectedNodeId
    });
  };

  const closePendingTransaction = (): void => {
    const state = get();
    const transactionStart = state.history.transactionStart;
    if (!transactionStart) return;

    const currentSnapshot = createSnapshot(state.nodes, state.edges);
    const history = snapshotsEqual(transactionStart, currentSnapshot)
      ? {
          ...state.history,
          transactionStart: null
        }
      : {
          past: pushHistory(state.history.past, transactionStart),
          future: [],
          transactionStart: null
        };

    setHistory(history);
  };

  return {
    project: null,
    document: null,
    pages: [],
    activePageId: null,
    nodes: [],
    edges: [],
    collapsedGroupIds: [],
    selectedNodeId: null,
    drawer: null,
    theme: "light",
    status: "Ready",
    isSaving: false,
    canUndo: false,
    canRedo: false,
    history: {
      ...emptyHistory()
    },
    setProjectDocument: (project, document) => {
      const pages = documentPages(document);
      const activePageId = activePageIdFor(pages, document.activePageId);
      const activePage = activePageFor(pages, activePageId);
      set({
        project,
        document,
        pages,
        activePageId,
        nodes: activePage ? clonePageNodes(activePage.nodes) : [],
        edges: activePage ? clonePageEdges(activePage.edges) : [],
        collapsedGroupIds: [...(activePage?.viewState?.collapsedGroupIds ?? [])],
        selectedNodeId: null,
        status: `Opened ${project.name}`,
        canUndo: false,
        canRedo: false,
        history: emptyHistory()
      });
    },
    clearProject: () =>
      set({
        project: null,
        document: null,
        pages: [],
        activePageId: null,
        nodes: [],
        edges: [],
        collapsedGroupIds: [],
        selectedNodeId: null,
        drawer: null,
        isSaving: false,
        canUndo: false,
        canRedo: false,
        history: emptyHistory()
      }),
    setActivePageId: (pageId) => {
      const state = get();
      if (state.activePageId === pageId || !state.pages.some((page) => page.id === pageId)) return;
      const pages = mergeCanvasIntoPages(state);
      const nextPage = activePageFor(pages, pageId);
      set({
        pages,
        activePageId: pageId,
        nodes: nextPage ? clonePageNodes(nextPage.nodes) : [],
        edges: nextPage ? clonePageEdges(nextPage.edges) : [],
        collapsedGroupIds: [...(nextPage?.viewState?.collapsedGroupIds ?? [])],
        selectedNodeId: null,
        drawer: state.drawer === "markdown" ? null : state.drawer,
        canUndo: false,
        canRedo: false,
        history: emptyHistory()
      });
    },
    createPage: () => {
      const state = get();
      if (!state.project) return null;
      const pages = mergeCanvasIntoPages(state);
      const page = newPage(pages.length);
      set({
        pages: [...pages, page],
        activePageId: page.id,
        nodes: [],
        edges: [],
        collapsedGroupIds: [],
        selectedNodeId: null,
        drawer: state.drawer === "markdown" ? null : state.drawer,
        canUndo: false,
        canRedo: false,
        history: emptyHistory()
      });
      return page;
    },
    renameActivePage: (name) => {
      const nextName = name.trim();
      if (!nextName) return;
      const state = get();
      if (!state.activePageId) return;
      set({
        pages: mergeCanvasIntoPages(state).map((page) =>
          page.id === state.activePageId ? { ...page, name: nextName, updatedAt: new Date().toISOString() } : page
        )
      });
    },
    deleteActivePage: () => {
      const state = get();
      if (!state.activePageId || state.pages.length <= 1) return;
      const pages = mergeCanvasIntoPages(state).filter((page) => page.id !== state.activePageId);
      const nextPage = pages[0] ?? null;
      set({
        pages,
        activePageId: nextPage?.id ?? null,
        nodes: nextPage ? clonePageNodes(nextPage.nodes) : [],
        edges: nextPage ? clonePageEdges(nextPage.edges) : [],
        collapsedGroupIds: [...(nextPage?.viewState?.collapsedGroupIds ?? [])],
        selectedNodeId: null,
        drawer: state.drawer === "markdown" ? null : state.drawer,
        canUndo: false,
        canRedo: false,
        history: emptyHistory()
      });
    },
    setActivePageViewport: (viewport) => {
      const state = get();
      if (!state.activePageId) return;
      const current = state.pages.find((page) => page.id === state.activePageId)?.viewport;
      if (current && current.x === viewport.x && current.y === viewport.y && current.zoom === viewport.zoom) return;
      set({
        pages: state.pages.map((page) =>
          page.id === state.activePageId
            ? { ...page, viewport: { ...viewport }, updatedAt: new Date().toISOString() }
            : page
        )
      });
    },
    setCollapsedGroupIds: (groupIds) => {
      const state = get();
      if (!state.activePageId) return;
      const validGroupIds = new Set(state.nodes.filter((node) => node.type === "group").map((node) => node.id));
      const collapsedGroupIds = [...new Set(groupIds)].filter((id) => validGroupIds.has(id));
      set({
        collapsedGroupIds,
        pages: state.pages.map((page) =>
          page.id === state.activePageId
            ? { ...page, viewState: { collapsedGroupIds }, updatedAt: new Date().toISOString() }
            : page
        )
      });
    },
    setNodes: (nodes) => set((state) => ({ nodes, pages: mergeCanvasIntoPages(state, nodes, state.edges) })),
    setEdges: (edges) => set((state) => canApplyEdgeMutation(state.edges, edges, state.nodes)
      ? { edges, pages: mergeCanvasIntoPages(state, state.nodes, edges) }
      : state),
    replaceCanvasLive: (change) => {
      const state = get();
      const nextNodes = change.nodes ?? state.nodes;
      const nextEdges = change.edges ?? state.edges;
      if (change.edges && !canApplyEdgeMutation(state.edges, nextEdges, nextNodes)) return;
      set({
        nodes: nextNodes,
        edges: nextEdges
      });
    },
    commitCanvasChange: (change) => {
      const state = get();
      const nextNodes = change.nodes ?? state.nodes;
      const nextEdges = change.edges ?? state.edges;
      if (change.edges && !canApplyEdgeMutation(state.edges, nextEdges, nextNodes)) return;

      if (state.history.transactionStart) {
        set({
          nodes: nextNodes,
          edges: nextEdges,
          pages: mergeCanvasIntoPages(state, nextNodes, nextEdges)
        });
        return;
      }

      const currentSnapshot = createSnapshot(state.nodes, state.edges);
      const nextSnapshot = createSnapshot(nextNodes, nextEdges);

      if (snapshotsEqual(currentSnapshot, nextSnapshot)) {
        set({
          nodes: nextNodes,
          edges: nextEdges
        });
        return;
      }

      const history = {
        past: pushHistory(state.history.past, currentSnapshot),
        future: [],
        transactionStart: null
      };

      set({
        nodes: nextNodes,
        edges: nextEdges,
        pages: mergeCanvasIntoPages(state, nextNodes, nextEdges),
        history,
        ...historyFlags(history)
      });
    },
    beginHistoryTransaction: () => {
      const state = get();
      if (state.history.transactionStart) return;
      setHistory({
        ...state.history,
        transactionStart: createSnapshot(state.nodes, state.edges)
      });
    },
    commitHistoryTransaction: closePendingTransaction,
    cancelHistoryTransaction: () => {
      const state = get();
      const transactionStart = state.history.transactionStart;
      if (!transactionStart) return;
      applySnapshot(transactionStart);
      setHistory({
        ...state.history,
        transactionStart: null
      });
    },
    undo: () => {
      closePendingTransaction();

      const state = get();
      const previousSnapshot = state.history.past[state.history.past.length - 1];
      if (!previousSnapshot) return;

      const currentSnapshot = createSnapshot(state.nodes, state.edges);
      const history = {
        past: state.history.past.slice(0, -1),
        future: [currentSnapshot, ...state.history.future].slice(0, MAX_HISTORY_LENGTH),
        transactionStart: null
      };

      applySnapshot(previousSnapshot);
      setHistory(history);
    },
    redo: () => {
      closePendingTransaction();

      const state = get();
      const nextSnapshot = state.history.future[0];
      if (!nextSnapshot) return;

      const currentSnapshot = createSnapshot(state.nodes, state.edges);
      const history = {
        past: pushHistory(state.history.past, currentSnapshot),
        future: state.history.future.slice(1),
        transactionStart: null
      };

      applySnapshot(nextSnapshot);
      setHistory(history);
    },
    updateNodeData: (nodeId, patch) => {
      const state = get();
      state.commitCanvasChange({
        nodes: state.nodes.map((node) =>
          node.id === nodeId
            ? ({
                ...node,
                data: {
                  ...node.data,
                  ...patch
                }
              } as ScatterNode)
            : node
        )
      });
    },
    removeAttachment: (nodeId, attachmentId) => {
      const state = get();
      const next = updateNodeInPages(state, nodeId, (node) =>
        node.type === "task"
          ? { ...node, data: { ...node.data, attachments: node.data.attachments.filter((attachment) => attachment.id !== attachmentId) } }
          : node
      );
      if (next.currentPageChanged) state.commitCanvasChange({ nodes: next.nodes });
      else set({ pages: next.pages });
    },
    setSelectedNodeId: (selectedNodeId) => set({ selectedNodeId }),
    setDrawer: (drawer) => set({ drawer }),
    setTheme: (theme) => set({ theme }),
    setStatus: (status) => set({ status }),
    setSaving: (isSaving) => set({ isSaving }),
    markNodeRun: (nodeId, runMode) =>
      set((state) => {
        const nodes = state.nodes.map((node) =>
          node.id === nodeId && node.type === "task"
            ? {
                ...node,
                data: {
                  ...node.data,
                  runMode,
                  lastRunAt: new Date().toISOString()
                }
              }
            : node
        );
        return {
          nodes,
          pages: mergeCanvasIntoPages(state, nodes, state.edges)
        };
      })
  };
});
