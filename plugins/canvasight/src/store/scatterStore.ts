import { create } from "zustand";
import { nanoid } from "nanoid";
import type {
  Attachment,
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
  appendAttachments: (nodeId: string, attachments: Attachment[]) => void;
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
  const { selected: _selected, data, ...nodeRest } = node;
  const { lastRunAt: _lastRunAt, attachments, ...dataRest } = data;

  return {
    ...nodeRest,
    type: "task",
    position: { ...node.position },
    data: {
      ...dataRest,
      attachments: attachments.map((attachment) => ({ ...attachment }))
    }
  } as ScatterNode;
}

function createSnapshot(nodes: ScatterNode[], edges: ScatterEdge[]): CanvasSnapshot {
  return {
    nodes: nodes.map(cloneNodeForHistory),
    edges: edges.map(cloneEdgeForHistory)
  };
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
      .filter((node) => Boolean(node.data.lastRunAt))
      .map((node) => [node.id, node.data.lastRunAt])
  );

  return snapshot.nodes.map((node) => {
    const restoredNode = cloneNodeForHistory(node);
    const lastRunAt = lastRunAtByNodeId.get(node.id);

    return {
      ...restoredNode,
      selected: selectedNodeId === node.id,
      data: {
        ...restoredNode.data,
        ...(lastRunAt ? { lastRunAt } : {})
      }
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
        selectedNodeId: null,
        drawer: state.drawer === "markdown" ? null : state.drawer,
        canUndo: false,
        canRedo: false,
        history: emptyHistory()
      });
    },
    setNodes: (nodes) => set((state) => ({ nodes, pages: mergeCanvasIntoPages(state, nodes, state.edges) })),
    setEdges: (edges) => set((state) => ({ edges, pages: mergeCanvasIntoPages(state, state.nodes, edges) })),
    replaceCanvasLive: (change) => {
      const state = get();
      set({
        nodes: change.nodes ?? state.nodes,
        edges: change.edges ?? state.edges
      });
    },
    commitCanvasChange: (change) => {
      const state = get();
      const nextNodes = change.nodes ?? state.nodes;
      const nextEdges = change.edges ?? state.edges;

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
          edges: nextEdges,
          pages: mergeCanvasIntoPages(state, nextNodes, nextEdges)
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
            ? {
                ...node,
                data: {
                  ...node.data,
                  ...patch
                }
              }
            : node
        )
      });
    },
    appendAttachments: (nodeId, attachments) => {
      const state = get();
      const next = updateNodeInPages(state, nodeId, (node) => ({
        ...node,
        data: {
          ...node.data,
          attachments: [...node.data.attachments, ...attachments]
        }
      }));
      if (next.currentPageChanged) state.commitCanvasChange({ nodes: next.nodes });
      else set({ pages: next.pages });
    },
    removeAttachment: (nodeId, attachmentId) => {
      const state = get();
      const next = updateNodeInPages(state, nodeId, (node) => ({
        ...node,
        data: {
          ...node.data,
          attachments: node.data.attachments.filter((attachment) => attachment.id !== attachmentId)
        }
      }));
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
          node.id === nodeId
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
