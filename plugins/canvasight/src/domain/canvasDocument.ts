import { nanoid } from "nanoid";
import type {
  SaveDocumentResult,
  ScatterAssetNode,
  ScatterDocument,
  ScatterEdge,
  ScatterGroupNode,
  ScatterNode,
  ScatterPage,
  ScatterProjectInfo,
  ScatterTaskNode
} from "../../shared/types";

export function projectNameFromPath(projectPath: string): string {
  return projectPath.split(/[\\/]/).filter(Boolean).at(-1) || "Canvasight Project";
}

export function emptyPage(index = 0, name = `Page ${index + 1}`): ScatterPage {
  const now = new Date().toISOString();
  return {
    id: nanoid(),
    name,
    createdAt: now,
    updatedAt: now,
    viewport: { x: 0, y: 0, zoom: 1 },
    viewState: { collapsedGroupIds: [] },
    nodes: [],
    edges: []
  };
}

export function emptyDocument(projectPath: string): ScatterDocument {
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
        const nodeType = node?.type === "asset" || node?.type === "group" ? node.type : "task";
        const { codexMode: _codexMode, planMode: _planMode, ...nodeData } = node.data || {};
        const base = {
          ...node,
          type: nodeType,
          selected: false,
          ...(nodeType !== "group" && typeof node.parentId === "string" ? { parentId: node.parentId } : {})
        };
        if (nodeType === "asset") {
          return {
            ...base,
            type: "asset",
            data: {
              ...nodeData,
              title: typeof nodeData.title === "string" ? nodeData.title : "",
              description: typeof nodeData.description === "string" ? nodeData.description : "",
              role: ["input", "reference", "option", "output"].includes(nodeData.role) ? nodeData.role : "reference",
              asset: nodeData.asset
            }
          } as ScatterAssetNode;
        }
        if (nodeType === "group") {
          return {
            ...base,
            type: "group",
            data: {
              ...nodeData,
              title: typeof nodeData.title === "string" ? nodeData.title : "",
              description: typeof nodeData.description === "string" ? nodeData.description : ""
            }
          } as ScatterGroupNode;
        }
        return {
          ...base,
          type: "task",
          data: {
            ...nodeData,
            title: typeof nodeData.title === "string" ? nodeData.title : "",
            body: typeof nodeData.body === "string" ? nodeData.body : "",
            attachments: nodeData.attachments || [],
            effort: nodeData.effort || "xhigh",
            runMode: nodeData.runMode || "flow"
          }
        } as ScatterTaskNode;
      })
    : [];
}

function normalizePage(page: Partial<ScatterPage>, index: number, fallback?: Partial<ScatterPage>): ScatterPage {
  const now = new Date().toISOString();
  return {
    id: typeof page.id === "string" && page.id ? page.id : fallback?.id || nanoid(),
    name: typeof page.name === "string" && page.name.trim() ? page.name.trim() : fallback?.name || `Page ${index + 1}`,
    createdAt: typeof page.createdAt === "string" && page.createdAt ? page.createdAt : fallback?.createdAt || now,
    updatedAt: typeof page.updatedAt === "string" && page.updatedAt ? page.updatedAt : fallback?.updatedAt || now,
    viewport: normalizeViewport(page.viewport || fallback?.viewport),
    viewState: { collapsedGroupIds: [...(page.viewState?.collapsedGroupIds ?? fallback?.viewState?.collapsedGroupIds ?? [])] },
    nodes: normalizePageNodes(page.nodes || fallback?.nodes),
    edges: Array.isArray(page.edges || fallback?.edges) ? ((page.edges || fallback?.edges) as ScatterEdge[]) : []
  };
}

export function normalizeDocument(projectPath: string, document: Partial<ScatterDocument>): ScatterDocument {
  const fallback = emptyDocument(projectPath);
  const legacyFallback: Partial<ScatterPage> = {
    id: document.activePageId,
    name: "Page 1",
    updatedAt: document.updatedAt,
    viewport: document.viewport,
    nodes: document.nodes,
    edges: document.edges
  };
  const pages = Array.isArray(document.pages) && document.pages.length > 0
    ? document.pages.map((page, index) => normalizePage(page, index, index === 0 ? legacyFallback : undefined))
    : [normalizePage({}, 0, legacyFallback)];
  const activePageId = typeof document.activePageId === "string" && pages.some((page) => page.id === document.activePageId)
    ? document.activePageId
    : pages[0].id;
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

export function toDocument(
  project: ScatterProjectInfo,
  pages: ScatterPage[],
  activePageId: string | null,
  nodes: ScatterNode[],
  edges: ScatterEdge[],
  minimumVersion: 1 | 2 = 1
): ScatterDocument {
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
    version: minimumVersion === 2 || serializedPages.some((page) => page.nodes.some((node) => node.type !== "task" || node.parentId)) ? 2 : 1,
    projectName: project.name,
    updatedAt: now,
    activePageId: currentPageId,
    pages: serializedPages,
    viewport: activePage.viewport,
    nodes: activePage.nodes,
    edges: activePage.edges
  };
}

export function persistentNodeValue(node: ScatterNode): Record<string, unknown> {
  const transientNode = node as ScatterNode & { dragging?: boolean; measured?: unknown; resizing?: boolean };
  const { dragging: _dragging, measured: _measured, resizing: _resizing, selected: _selected, ...persisted } = transientNode;
  if (node.type === "task") {
    const { lastRunAt: _lastRunAt, ...persistedData } = node.data;
    const { width: _width, height: _height, ...taskPersisted } = persisted;
    return { ...taskPersisted, type: "task", data: persistedData };
  }
  if (node.type === "asset") {
    const { width: _width, height: _height, ...assetPersisted } = persisted;
    return { ...assetPersisted, type: "asset", data: { ...node.data, asset: { ...node.data.asset } } };
  }
  return { ...persisted, type: "group", data: { ...node.data } };
}

function stableValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableValue);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .filter(([, entry]) => entry !== undefined)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => [key, stableValue(entry)])
  );
}

export function stableStringify(value: unknown): string {
  return JSON.stringify(stableValue(value));
}

export function persistentDocumentValue(document: ScatterDocument): string {
  const persistentPage = (page: ScatterPage) => ({
    ...page,
    updatedAt: undefined,
    nodes: page.nodes.map(persistentNodeValue)
  });
  return stableStringify({
    ...document,
    updatedAt: undefined,
    pages: document.pages.map(persistentPage),
    nodes: document.nodes.map(persistentNodeValue)
  });
}

export function documentsPersistentlyEqual(left: ScatterDocument, right: ScatterDocument): boolean {
  return persistentDocumentValue(left) === persistentDocumentValue(right);
}

function sameValue(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

export function rebaseLocalChangesAfterSave(
  projectPath: string,
  sentDocument: ScatterDocument,
  latestLocalDocument: ScatterDocument,
  savedDocument: ScatterDocument,
  merge: SaveDocumentResult["merge"]
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
    if (!sentPage || !latestPage || sameValue(sentPage, latestPage) || targetIndex < 0) continue;
    const targetPage = pages[targetIndex];
    const nodeIdMap = conflict?.nodeIdMap ?? {};
    const edgeIdMap = conflict?.edgeIdMap ?? {};
    const targetNodes = new Map(targetPage.nodes.map((node) => [node.id, node]));
    const sentNodes = new Map(sentPage.nodes.map((node) => [node.id, node]));
    const latestNodes = new Map(latestPage.nodes.map((node) => [node.id, node]));
    for (const nodeId of new Set([...sentNodes.keys(), ...latestNodes.keys()])) {
      const before = sentNodes.get(nodeId);
      const after = latestNodes.get(nodeId);
      if (sameValue(before, after)) continue;
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
      if (sameValue(before, after)) continue;
      const targetEdgeId = edgeIdMap[edgeId] ?? edgeId;
      if (!after) targetEdges.delete(targetEdgeId);
      else targetEdges.set(targetEdgeId, {
        ...after,
        id: targetEdgeId,
        source: nodeIdMap[after.source] ?? after.source,
        target: nodeIdMap[after.target] ?? after.target
      });
    }
    pages[targetIndex] = {
      ...targetPage,
      name: sentPage.name !== latestPage.name ? latestPage.name : targetPage.name,
      viewport: !sameValue(sentPage.viewport, latestPage.viewport) ? latestPage.viewport : targetPage.viewport,
      viewState: !sameValue(sentPage.viewState, latestPage.viewState) ? latestPage.viewState : targetPage.viewState,
      updatedAt: latestPage.updatedAt,
      nodes: [...targetNodes.values()],
      edges: [...targetEdges.values()]
    };
  }
  const activeConflict = conflictBySource.get(latestLocalDocument.activePageId);
  const activePageId = activeConflict?.conflictPageId ?? latestLocalDocument.activePageId;
  return normalizeDocument(projectPath, { ...savedDocument, pages, activePageId });
}
