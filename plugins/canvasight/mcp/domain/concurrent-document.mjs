export function sameValue(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

export function itemMap(items) {
  return new Map((Array.isArray(items) ? items : []).map((item) => [item.id, item]));
}

export function comparableNode(node) {
  if (!node) return null;
  const { selected: _selected, data, ...rest } = node;
  const { lastRunAt: _lastRunAt, ...dataRest } = data && typeof data === "object" && !Array.isArray(data) ? data : {};
  return { ...rest, data: dataRest };
}

export function comparableNodeSemantic(node) {
  if (!node) return null;
  const { position: _position, ...semantic } = comparableNode(node);
  return semantic;
}

export function changedFromBase(base, value, comparable = (item) => item) {
  return !sameValue(comparable(base), comparable(value));
}

export function documentObjectWriters(previousWriters, beforeDocument, afterDocument, source) {
  const writers = { ...(previousWriters && typeof previousWriters === "object" && !Array.isArray(previousWriters) ? previousWriters : {}) };
  const beforePages = itemMap(beforeDocument?.pages);
  const afterPages = itemMap(afterDocument?.pages);
  for (const pageId of new Set([...beforePages.keys(), ...afterPages.keys()])) {
    const beforePage = beforePages.get(pageId);
    const afterPage = afterPages.get(pageId);
    if (!beforePage || !afterPage || beforePage.name !== afterPage.name) writers[`page:${pageId}`] = source;
    const beforeNodes = itemMap(beforePage?.nodes);
    const afterNodes = itemMap(afterPage?.nodes);
    for (const nodeId of new Set([...beforeNodes.keys(), ...afterNodes.keys()])) {
      if (!sameValue(comparableNodeSemantic(beforeNodes.get(nodeId)), comparableNodeSemantic(afterNodes.get(nodeId)))) {
        writers[`node:${pageId}:${nodeId}`] = source;
      }
    }
    const beforeEdges = itemMap(beforePage?.edges);
    const afterEdges = itemMap(afterPage?.edges);
    for (const edgeId of new Set([...beforeEdges.keys(), ...afterEdges.keys()])) {
      if (!sameValue(beforeEdges.get(edgeId), afterEdges.get(edgeId))) writers[`edge:${pageId}:${edgeId}`] = source;
    }
  }
  return writers;
}

export function mergeAtomicItems(baseItems, currentItems, localItems, comparable, kind, reasons, conflictWinner = "none") {
  const base = itemMap(baseItems);
  const current = itemMap(currentItems);
  const local = itemMap(localItems);
  const result = [];
  const ids = [...new Set([...base.keys(), ...current.keys(), ...local.keys()])];
  for (const id of ids) {
    const baseItem = base.get(id);
    const currentItem = current.get(id);
    const localItem = local.get(id);
    const currentChanged = changedFromBase(baseItem, currentItem, comparable);
    const localChanged = changedFromBase(baseItem, localItem, comparable);
    if (currentChanged && localChanged && !sameValue(comparable(currentItem), comparable(localItem))) {
      reasons.push(`${kind}:${id}`);
      const winner = conflictWinner === "current" ? currentItem : conflictWinner === "local" ? localItem : null;
      if (winner) result.push(winner);
      continue;
    }
    const chosen = localChanged ? localItem : currentItem;
    if (chosen) result.push(chosen);
  }
  return result;
}

export function pageContentChanged(basePage, page) {
  if (!basePage || !page) return basePage !== page;
  if (basePage.name !== page.name) return true;
  if (changedFromBase(basePage.nodes, page.nodes, (items) => (items || []).map(comparableNode))) return true;
  return changedFromBase(basePage.edges, page.edges);
}

function comparablePage(page) {
  if (!page) return null;
  return { id: page.id, name: page.name, createdAt: page.createdAt, nodes: page.nodes.map(comparableNode), edges: page.edges };
}

export function documentsContentEqual(left, right) {
  if (!left || !right || left.projectName !== right.projectName) return false;
  return sameValue(left.pages.map(comparablePage), right.pages.map(comparablePage));
}

export function documentsViewStateEqual(left, right) {
  if (!left || !right) return false;
  return sameValue(
    left.pages.map((page) => ({ id: page.id, viewState: page.viewState })),
    right.pages.map((page) => ({ id: page.id, viewState: page.viewState }))
  );
}

export function pageEdgeConstraintViolations(basePage, candidatePage) {
  const baseEdges = Array.isArray(basePage?.edges) ? basePage.edges : [];
  const candidateEdges = Array.isArray(candidatePage?.edges) ? candidatePage.edges : [];
  const baseIncoming = new Map();
  const candidateIncoming = new Map();
  baseEdges.forEach((edge) => baseIncoming.set(edge.target, (baseIncoming.get(edge.target) || 0) + 1));
  candidateEdges.forEach((edge) => candidateIncoming.set(edge.target, (candidateIncoming.get(edge.target) || 0) + 1));
  const violations = [];
  for (const [target, count] of candidateIncoming) {
    if (count > Math.max(1, baseIncoming.get(target) || 0)) violations.push(`edge-target:${candidatePage?.id || "page"}:${target}`);
  }
  const baseNodeById = new Map((basePage?.nodes || []).map((node) => [node.id, node]));
  const candidateNodeById = new Map((candidatePage?.nodes || []).map((node) => [node.id, node]));
  const baseEdgeById = itemMap(baseEdges);
  candidateEdges.forEach((edge) => {
    if (candidateNodeById.get(edge.source)?.type !== "group" && candidateNodeById.get(edge.target)?.type !== "group") return;
    const baseEdge = baseEdgeById.get(edge.id);
    const preservedLegacyGroupEdge = baseEdge?.source === edge.source
      && baseEdge.target === edge.target
      && (baseNodeById.get(baseEdge.source)?.type === "group" || baseNodeById.get(baseEdge.target)?.type === "group");
    if (!preservedLegacyGroupEdge) violations.push(`group-edge:${candidatePage?.id || "page"}:${edge.id}`);
  });
  return [...new Set(violations)];
}

export function documentEdgeConstraintViolations(baseDocument, candidateDocument) {
  const basePages = itemMap(baseDocument?.pages || []);
  return (candidateDocument?.pages || []).flatMap((page) => pageEdgeConstraintViolations(basePages.get(page.id), page));
}

export function edgeIncidentConflict(basePage, currentPage, localPage, reasons) {
  const baseNodes = itemMap(basePage?.nodes);
  const currentNodes = itemMap(currentPage?.nodes);
  const localNodes = itemMap(localPage?.nodes);
  const currentEdges = Array.isArray(currentPage?.edges) ? currentPage.edges : [];
  const localEdges = Array.isArray(localPage?.edges) ? localPage.edges : [];
  for (const [nodeId] of baseNodes) {
    if (!currentNodes.has(nodeId) && localEdges.some((edge) => (edge.source === nodeId || edge.target === nodeId) && !sameValue(itemMap(basePage.edges).get(edge.id), edge))) {
      reasons.push(`node-edge:${nodeId}`);
    }
    if (!localNodes.has(nodeId) && currentEdges.some((edge) => (edge.source === nodeId || edge.target === nodeId) && !sameValue(itemMap(basePage.edges).get(edge.id), edge))) {
      reasons.push(`node-edge:${nodeId}`);
    }
  }
}
