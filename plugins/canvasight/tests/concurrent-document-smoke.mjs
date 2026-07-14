#!/usr/bin/env node
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import fs from "node:fs";
import fsp from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pluginRoot = path.resolve(__dirname, "..");
const serverPath = path.join(pluginRoot, "mcp", "server.mjs");
const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "canvasight-concurrent-document-"));
const canvasightHome = path.join(tempRoot, "canvasight-home");
const daemonStatePath = path.join(canvasightHome, "daemon.json");
const daemonToken = "concurrent-document-smoke-token";
let daemon = null;
let daemonState = null;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const clone = (value) => structuredClone(value);

async function waitForDaemon() {
  const deadline = Date.now() + 10_000;
  while (Date.now() < deadline) {
    try {
      const state = JSON.parse(await fsp.readFile(daemonStatePath, "utf8"));
      const response = await fetch(`${state.origin}/api/health`);
      if (response.ok) return state;
    } catch {
      // The daemon writes its state after the HTTP server starts.
    }
    await sleep(50);
  }
  throw new Error(`Canvasight daemon did not become ready: ${daemonStatePath}`);
}

async function startDaemon() {
  daemon = spawn(process.execPath, [serverPath, "--daemon"], {
    cwd: pluginRoot,
    env: {
      ...process.env,
      CANVASIGHT_HOME: canvasightHome,
      CANVASIGHT_DAEMON_TOKEN: daemonToken,
      CANVASIGHT_OPEN_BROWSER: "0",
      CANVASIGHT_OPEN_EXTERNAL_BROWSER: "0"
    },
    stdio: ["ignore", "ignore", "pipe"]
  });
  let stderr = "";
  daemon.stderr.setEncoding("utf8");
  daemon.stderr.on("data", (chunk) => {
    stderr += chunk;
  });
  daemon.once("exit", (code, signal) => {
    if (code && daemonState) process.stderr.write(`Concurrent document daemon exited: code=${code} signal=${signal} ${stderr}\n`);
  });
  try {
    daemonState = await waitForDaemon();
  } catch (error) {
    throw new Error(`${error.message}${stderr.trim() ? `; daemon stderr: ${stderr.trim()}` : ""}`);
  }
}

async function stopDaemon() {
  if (!daemon || daemon.killed) return;
  const exited = new Promise((resolve) => daemon.once("exit", resolve));
  daemon.kill("SIGTERM");
  await Promise.race([exited, sleep(3000)]);
  if (daemon.exitCode === null) daemon.kill("SIGKILL");
  daemon = null;
  daemonState = null;
}

async function requestJson(route, init = {}, expectedStatus = 200) {
  const response = await fetch(new URL(route, daemonState.origin), {
    ...init,
    headers: {
      "content-type": "application/json",
      "x-canvasight-token": daemonState.token,
      ...(init.headers || {})
    }
  });
  const text = await response.text();
  const body = text ? JSON.parse(text) : null;
  assert.equal(response.status, expectedStatus, `${init.method || "GET"} ${route}: ${text}`);
  return body;
}

function node(id, body = `${id} base`, overrides = {}) {
  return {
    id,
    type: "task",
    position: { x: id === "node-a" ? 0 : 680, y: 0 },
    data: {
      title: id,
      body,
      attachments: [],
      effort: "medium",
      runMode: "flow"
    },
    ...overrides
  };
}

function page(id = "page-main", overrides = {}) {
  const nodes = overrides.nodes || [node("node-a"), node("node-b")];
  const edges = overrides.edges || [{ id: "edge-a-b", source: "node-a", target: "node-b", label: "base" }];
  return {
    id,
    name: id === "page-main" ? "Main Page" : id,
    createdAt: "2026-07-13T00:00:00.000Z",
    updatedAt: "2026-07-13T00:00:00.000Z",
    viewport: { x: 0, y: 0, zoom: 1 },
    nodes,
    edges,
    ...overrides
  };
}

function documentFor(projectName, pages = [page()], activePageId = pages[0].id) {
  const active = pages.find((item) => item.id === activePageId) || pages[0];
  return {
    version: 1,
    projectName,
    updatedAt: "2026-07-13T00:00:00.000Z",
    activePageId: active.id,
    pages,
    viewport: active.viewport,
    nodes: active.nodes,
    edges: active.edges
  };
}

function pageById(document, id) {
  return document.pages.find((item) => item.id === id);
}

function nodeById(document, nodeId, pageId = "page-main") {
  return pageById(document, pageId)?.nodes.find((item) => item.id === nodeId);
}

function setNodeBody(document, nodeId, body, pageId = "page-main") {
  const target = nodeById(document, nodeId, pageId);
  assert.ok(target, `Missing node ${pageId}/${nodeId}`);
  target.data.body = body;
  target.data.attachments = [{
    id: `${nodeId}-attachment`,
    kind: "file",
    source: "upload",
    originalName: `${nodeId}.txt`,
    storedPath: `/tmp/${nodeId}.txt`,
    relativePath: `.scatter/assets/${nodeId}.txt`,
    fileUrl: `/api/asset/${nodeId}`,
    mime: "text/plain",
    size: body.length,
    createdAt: "2026-07-13T00:00:00.000Z"
  }];
  target.position = { x: target.position.x, y: 240 };
}

async function createSession(projectPath, threadId) {
  return requestJson("/api/sessions", {
    method: "POST",
    body: JSON.stringify({ projectPath, threadId, language: "en" })
  });
}

async function saveLegacy(sessionId, projectPath, document, expectedRevision) {
  return requestJson(`/api/sessions/${sessionId}/document`, {
    method: "POST",
    body: JSON.stringify({ projectPath, document, expectedRevision })
  });
}

async function saveModern(sessionId, projectPath, base, local, mutationId, extras = {}, expectedStatus = 200) {
  return requestJson(`/api/sessions/${sessionId}/document`, {
    method: "POST",
    body: JSON.stringify({
      projectPath,
      expectedRevision: base.documentRevision,
      base: {
        revision: base.documentRevision,
        version: base.documentVersion,
        document: base.document
      },
      document: local,
      clientMutationId: mutationId,
      language: "en",
      ...extras
    })
  }, expectedStatus);
}

async function fixture(label, pages = [page()]) {
  const projectPath = path.join(tempRoot, label);
  const initialSession = await createSession(projectPath, `${label}-seed`);
  const seededDocument = documentFor(label, pages);
  const seeded = await saveLegacy(initialSession.session.sessionId, projectPath, seededDocument, initialSession.documentRevision);
  const first = await createSession(projectPath, `${label}-first`);
  const second = await createSession(projectPath, `${label}-second`);
  return {
    projectPath,
    firstSessionId: first.session.sessionId,
    secondSessionId: second.session.sessionId,
    base: {
      document: seeded.document,
      documentRevision: seeded.documentRevision,
      documentVersion: seeded.documentVersion
    }
  };
}

function assertMirrors(document) {
  const active = pageById(document, document.activePageId);
  assert.ok(active, "activePageId must resolve to a Page");
  assert.deepEqual(document.nodes, active.nodes);
  assert.deepEqual(document.edges, active.edges);
  assert.deepEqual(document.viewport, active.viewport);
}

function assertUniqueGraphIds(document) {
  const pageIds = document.pages.map((item) => item.id);
  const nodeIds = document.pages.flatMap((item) => item.nodes.map((nodeItem) => nodeItem.id));
  const edgeIds = document.pages.flatMap((item) => item.edges.map((edgeItem) => edgeItem.id));
  assert.equal(new Set(pageIds).size, pageIds.length, "Page IDs must be unique");
  assert.equal(new Set(nodeIds).size, nodeIds.length, "node IDs must be unique across Pages");
  assert.equal(new Set(edgeIds).size, edgeIds.length, "edge IDs must be unique across Pages");
  document.pages.forEach((pageItem) => {
    const ids = new Set(pageItem.nodes.map((nodeItem) => nodeItem.id));
    pageItem.edges.forEach((edgeItem) => {
      assert.equal(ids.has(edgeItem.source), true, `dangling source ${edgeItem.source}`);
      assert.equal(ids.has(edgeItem.target), true, `dangling target ${edgeItem.target}`);
    });
  });
  assertMirrors(document);
}

async function assertDisjointMerge() {
  const state = await fixture("disjoint-merge");
  const firstLocal = clone(state.base.document);
  const secondLocal = clone(state.base.document);
  setNodeBody(firstLocal, "node-a", "first changed A");
  setNodeBody(secondLocal, "node-b", "second changed B");
  secondLocal.pages[0].viewport = { x: 90, y: 40, zoom: 1.4 };
  const first = await saveModern(state.firstSessionId, state.projectPath, state.base, firstLocal, "disjoint-first");
  const second = await saveModern(state.secondSessionId, state.projectPath, state.base, secondLocal, "disjoint-second");
  assert.equal(first.status, "written");
  assert.equal(second.status, "merged");
  assert.equal(second.documentRevision, first.documentRevision + 1);
  assert.deepEqual(second.merge.conflictCopies, []);
  assert.equal(nodeById(second.document, "node-a").data.body, "first changed A");
  assert.equal(nodeById(second.document, "node-b").data.body, "second changed B");
  assert.deepEqual(pageById(second.document, "page-main").viewport, pageById(first.document, "page-main").viewport, "current viewport wins a stale content merge");
  assertUniqueGraphIds(second.document);
}

async function assertSameNodeConflictCopy() {
  const state = await fixture("same-node-conflict");
  const firstLocal = clone(state.base.document);
  const secondLocal = clone(state.base.document);
  setNodeBody(firstLocal, "node-a", "first node A");
  setNodeBody(secondLocal, "node-a", "second node A with complete attachment and position");
  const first = await saveModern(state.firstSessionId, state.projectPath, state.base, firstLocal, "same-node-first");
  const second = await saveModern(state.secondSessionId, state.projectPath, state.base, secondLocal, "same-node-second");
  assert.equal(second.status, "conflict-copy");
  assert.equal(second.documentRevision, first.documentRevision + 1);
  assert.equal(nodeById(second.document, "node-a").data.body, "first node A");
  const conflict = second.merge.conflictCopies[0];
  const conflictPage = pageById(second.document, conflict.conflictPageId);
  assert.ok(conflictPage.name.includes("Conflict copy"));
  assert.equal(conflictPage.conflict.incomingIntent, "edit");
  assert.equal(conflictPage.nodes.find((item) => item.data.title === "node-a").data.body, "second node A with complete attachment and position");
  assert.equal(conflictPage.nodes.find((item) => item.data.title === "node-a").data.attachments.length, 1);
  assert.equal(conflictPage.nodes.find((item) => item.data.title === "node-a").position.y, 240);
  assert.equal(second.merge.localActivePageId, conflictPage.id);
  assertUniqueGraphIds(second.document);
}

async function assertIdenticalEditIsUnchanged() {
  const state = await fixture("identical-edit");
  const local = clone(state.base.document);
  setNodeBody(local, "node-a", "identical node A");
  const first = await saveModern(state.firstSessionId, state.projectPath, state.base, local, "identical-first");
  const second = await saveModern(state.secondSessionId, state.projectPath, state.base, local, "identical-second");
  assert.equal(first.status, "written");
  assert.equal(second.status, "unchanged");
  assert.equal(second.written, false);
  assert.equal(second.documentRevision, first.documentRevision);
  assert.deepEqual(second.merge.conflictCopies, []);
}

async function assertOrientationAndTransientChangesAreNoop() {
  const secondary = page("page-secondary", { name: "Secondary Page", nodes: [node("secondary-node")], edges: [] });
  const state = await fixture("orientation-noop", [page(), secondary]);
  const local = clone(state.base.document);
  local.updatedAt = "2026-07-13T12:34:56.000Z";
  local.activePageId = "page-secondary";
  local.viewport = { x: 500, y: 300, zoom: 1.8 };
  local.pages[0].updatedAt = "2026-07-13T12:34:56.000Z";
  local.pages[0].viewport = { x: 120, y: 80, zoom: 1.6 };
  local.pages[0].nodes[0].selected = true;
  local.pages[0].nodes[0].data.lastRunAt = "2026-07-13T12:34:56.000Z";
  const result = await saveModern(state.firstSessionId, state.projectPath, state.base, local, "orientation-noop");
  assert.equal(result.status, "unchanged");
  assert.equal(result.written, false);
  assert.equal(result.documentRevision, state.base.documentRevision);
  assert.equal(result.document.activePageId, "page-main");
  assert.deepEqual(pageById(result.document, "page-main").viewport, pageById(state.base.document, "page-main").viewport);

  const contentLocal = clone(result.document);
  setNodeBody(contentLocal, "node-b", "real content change after orientation no-op");
  const contentResult = await saveModern(
    state.firstSessionId,
    state.projectPath,
    {
      document: result.document,
      documentRevision: result.documentRevision,
      documentVersion: result.documentVersion
    },
    contentLocal,
    "orientation-real-content"
  );
  assert.equal(contentResult.status, "written");
  assert.equal(contentResult.documentRevision, result.documentRevision + 1);
  assert.equal(nodeById(contentResult.document, "node-b").data.body, "real content change after orientation no-op");
}

async function assertConflictMatrix() {
  const cases = [
    {
      label: "node-delete-edit",
      first(document) {
        document.pages[0].nodes = document.pages[0].nodes.filter((item) => item.id !== "node-a");
        document.pages[0].edges = [];
      },
      second(document) {
        setNodeBody(document, "node-a", "edited after delete");
      },
      reason: /^node:node-a$/
    },
    {
      label: "edge-divergent",
      first(document) {
        document.pages[0].edges[0].label = "first edge";
      },
      second(document) {
        document.pages[0].edges[0].label = "second edge";
      },
      reason: /^edge:edge-a-b$/
    },
    {
      label: "edge-delete-edit",
      first(document) {
        document.pages[0].edges = [];
      },
      second(document) {
        document.pages[0].edges[0].label = "edited after edge delete";
      },
      reason: /^edge:edge-a-b$/
    },
    {
      label: "page-name",
      first(document) {
        document.pages[0].name = "First name";
      },
      second(document) {
        document.pages[0].name = "Second name";
      },
      reason: /^page-name:page-main$/
    }
  ];

  for (const testCase of cases) {
    const state = await fixture(testCase.label);
    const firstLocal = clone(state.base.document);
    const secondLocal = clone(state.base.document);
    testCase.first(firstLocal);
    testCase.second(secondLocal);
    const first = await saveModern(state.firstSessionId, state.projectPath, state.base, firstLocal, `${testCase.label}-first`);
    const second = await saveModern(state.secondSessionId, state.projectPath, state.base, secondLocal, `${testCase.label}-second`);
    assert.equal(second.status, "conflict-copy", testCase.label);
    assert.equal(second.documentRevision, first.documentRevision + 1, testCase.label);
    assert.equal(second.merge.conflictCopies[0].reasons.some((reason) => testCase.reason.test(reason)), true, testCase.label);
    assertUniqueGraphIds(second.document);
  }

  const extraPage = page("page-secondary", { name: "Secondary Page", nodes: [node("secondary-node")], edges: [] });
  for (const order of ["delete-first", "edit-first"]) {
    const state = await fixture(`page-delete-edit-${order}`, [page(), extraPage]);
    const deletion = clone(state.base.document);
    const edit = clone(state.base.document);
    deletion.pages = deletion.pages.filter((item) => item.id !== "page-secondary");
    setNodeBody(edit, "secondary-node", "edited secondary", "page-secondary");
    const firstLocal = order === "delete-first" ? deletion : edit;
    const secondLocal = order === "delete-first" ? edit : deletion;
    const secondExtras = order === "edit-first" ? { deletedPageSnapshots: { "page-secondary": extraPage } } : {};
    const first = await saveModern(state.firstSessionId, state.projectPath, state.base, firstLocal, `${order}-first`);
    const second = await saveModern(state.secondSessionId, state.projectPath, state.base, secondLocal, `${order}-second`, secondExtras);
    assert.equal(second.status, "conflict-copy", order);
    assert.equal(second.documentRevision, first.documentRevision + 1, order);
    assert.equal(second.merge.conflictCopies[0].reasons.includes("page-delete-edit:page-secondary"), true, order);
    assertUniqueGraphIds(second.document);
  }
}

async function assertDifferentEdgesMerge() {
  const basePage = page("page-main", {
    nodes: [node("node-a"), node("node-b"), node("node-c", "node-c base", { position: { x: 1360, y: 0 } })],
    edges: [
      { id: "edge-a-b", source: "node-a", target: "node-b", label: "base one" },
      { id: "edge-b-c", source: "node-b", target: "node-c", label: "base two" }
    ]
  });
  const state = await fixture("different-edges", [basePage]);
  const firstLocal = clone(state.base.document);
  const secondLocal = clone(state.base.document);
  firstLocal.pages[0].edges[0].label = "first edge update";
  secondLocal.pages[0].edges[1].label = "second edge update";
  await saveModern(state.firstSessionId, state.projectPath, state.base, firstLocal, "different-edges-first");
  const second = await saveModern(state.secondSessionId, state.projectPath, state.base, secondLocal, "different-edges-second");
  assert.equal(second.status, "merged");
  assert.equal(pageById(second.document, "page-main").edges[0].label, "first edge update");
  assert.equal(pageById(second.document, "page-main").edges[1].label, "second edge update");
}

async function assertMutationReplayAndRestart() {
  const state = await fixture("mutation-replay");
  const firstLocal = clone(state.base.document);
  const secondLocal = clone(state.base.document);
  setNodeBody(firstLocal, "node-a", "first replay value");
  setNodeBody(secondLocal, "node-a", "second replay value");
  await saveModern(state.firstSessionId, state.projectPath, state.base, firstLocal, "replay-first");
  const conflict = await saveModern(state.secondSessionId, state.projectPath, state.base, secondLocal, "replay-conflict");
  const replay = await saveModern(state.secondSessionId, state.projectPath, state.base, secondLocal, "replay-conflict");
  assert.equal(replay.replayed, true);
  assert.equal(replay.status, conflict.status);
  assert.equal(replay.documentRevision, conflict.documentRevision);
  assert.equal(replay.document.pages.length, conflict.document.pages.length);

  const reused = clone(secondLocal);
  setNodeBody(reused, "node-a", "mutation id reused with a different payload");
  const rejected = await saveModern(state.secondSessionId, state.projectPath, state.base, reused, "replay-conflict", {}, 409);
  assert.equal(rejected.code, "mutation_id_reused");

  await stopDaemon();
  await startDaemon();
  const restartedSession = await createSession(state.projectPath, "restart-replay");
  const afterRestart = await saveModern(restartedSession.session.sessionId, state.projectPath, state.base, secondLocal, "replay-conflict");
  assert.equal(afterRestart.replayed, true);
  assert.equal(afterRestart.documentRevision, conflict.documentRevision);
  assert.equal(afterRestart.document.pages.length, conflict.document.pages.length);
  const sidecar = JSON.parse(await fsp.readFile(path.join(state.projectPath, ".scatter", "revision-state.json"), "utf8"));
  assert.equal(sidecar.revision, conflict.documentRevision);
  assert.ok(sidecar.receipts.some((receipt) => receipt.clientMutationId === "replay-conflict"));
  const nextLocal = clone(afterRestart.document);
  setNodeBody(nextLocal, "node-b", "new mutation after daemon restart");
  const afterRestartWrite = await saveModern(
    restartedSession.session.sessionId,
    state.projectPath,
    {
      document: afterRestart.document,
      documentRevision: afterRestart.documentRevision,
      documentVersion: afterRestart.documentVersion
    },
    nextLocal,
    "after-restart-new-mutation"
  );
  assert.equal(afterRestartWrite.status, "written");
  assert.equal(afterRestartWrite.documentRevision, conflict.documentRevision + 1, "revision remains monotonic after restart");
}

function minimalRefineManifest(nodeIds, edges) {
  return {
    intent: "refine",
    primaryDomain: "task-execution",
    secondaryDomains: [],
    maturity: "deliver",
    output: "execution-plan",
    coverage: {
      "task.currentEvidence": nodeIds,
      "maturity.deliver.acceptance": nodeIds
    },
    semanticStructure: Object.fromEntries(nodeIds.map((id) => [id, {
      responsibility: `Own the distinct ${id} responsibility.`,
      inseparableReason: `The ${id} content is one coherent result.`
    }])),
    semanticRelationships: Object.fromEntries(edges.map((edge) => [edge.id, {
      type: "dependency",
      rationale: `${edge.target} depends on ${edge.source}.`
    }]))
  };
}

async function getGraphContext(projectPath) {
  return requestJson("/api/graphs/context", {
    method: "POST",
    body: JSON.stringify({ projectPath })
  });
}

async function graphUpdate(projectPath, context, nodeId, body, clientMutationId = `graph-${crypto.randomUUID()}`) {
  const active = context.activePage;
  return requestJson("/api/graphs/write", {
    method: "POST",
    body: JSON.stringify({
      projectPath,
      args: {
        projectPath,
        mode: "merge-active-page",
        contextId: context.contextId,
        expectedRevision: context.documentRevision,
        clientMutationId,
        layoutPolicy: "preserve-explicit",
        frameworkManifest: minimalRefineManifest(active.nodes.map((item) => item.id), active.edges),
        operations: [{ op: "update-node", nodeId, changes: { body } }]
      }
    })
  });
}

async function assertAiWriterRace() {
  const aiFirst = await fixture("ai-first");
  const aiFirstContext = await getGraphContext(aiFirst.projectPath);
  const uiLocal = clone(aiFirst.base.document);
  setNodeBody(uiLocal, "node-b", "UI changed B while AI changed A");
  const aiWrite = await graphUpdate(aiFirst.projectPath, aiFirstContext, "node-a", "AI changed A first");
  assert.equal(aiWrite.status, "written");
  const uiWrite = await saveModern(aiFirst.secondSessionId, aiFirst.projectPath, aiFirst.base, uiLocal, "ai-first-ui-second");
  assert.equal(uiWrite.status, "merged");
  assert.equal(nodeById(uiWrite.document, "node-a").data.body, "AI changed A first");
  assert.equal(nodeById(uiWrite.document, "node-b").data.body, "UI changed B while AI changed A");

  const uiFirst = await fixture("ui-first");
  const uiFirstContext = await getGraphContext(uiFirst.projectPath);
  const uiFirstLocal = clone(uiFirst.base.document);
  setNodeBody(uiFirstLocal, "node-b", "UI saved before stale AI");
  const uiSaved = await saveModern(uiFirst.firstSessionId, uiFirst.projectPath, uiFirst.base, uiFirstLocal, "ui-first-save");
  const rebasedAi = await graphUpdate(uiFirst.projectPath, uiFirstContext, "node-a", "AI rebased after UI save", "ui-first-ai");
  assert.equal(rebasedAi.status, "merged");
  assert.equal(rebasedAi.targetPageId, "page-main");
  assert.equal(rebasedAi.rebasedFromRevision, uiFirstContext.documentRevision);
  assert.equal(nodeById(rebasedAi.document, "node-a").data.body, "AI rebased after UI save");
  assert.equal(nodeById(rebasedAi.document, "node-b").data.body, "UI saved before stale AI");

  const legacy = await requestJson("/api/graphs/write", {
    method: "POST",
    body: JSON.stringify({ projectPath: uiFirst.projectPath, args: {
      projectPath: uiFirst.projectPath,
      mode: "merge-active-page",
      expectedRevision: uiFirstContext.documentRevision,
      layoutPolicy: "preserve-explicit",
      frameworkManifest: minimalRefineManifest(uiFirstContext.activePage.nodes.map((item) => item.id), uiFirstContext.activePage.edges),
      operations: [{ op: "update-node", nodeId: "node-a", changes: { body: "legacy stale" } }]
    } })
  });
  assert.equal(legacy.status, "validation_failed");
  assert.equal(legacy.validation.violations.some((item) => item.code === "stale_document"), true);
}

async function assertAiDragPageSwitchConflictAndReplay() {
  const secondary = page("page-secondary", { name: "Secondary", nodes: [node("secondary-node")], edges: [] });
  const state = await fixture("ai-context-rebase", [page(), secondary]);
  const context = await getGraphContext(state.projectPath);
  const manual = clone(state.base.document);
  manual.pages[0].nodes[0].position = { x: 333, y: 444 };
  manual.activePageId = "page-secondary";
  manual.viewport = manual.pages[1].viewport;
  manual.nodes = manual.pages[1].nodes;
  manual.edges = manual.pages[1].edges;
  await saveLegacy(state.firstSessionId, state.projectPath, manual, state.base.documentRevision);
  const write = await graphUpdate(state.projectPath, context, "node-a", "AI updated bound Page", "drag-page-ai");
  assert.equal(write.status, "merged");
  assert.equal(write.targetPageId, "page-main");
  assert.equal(write.document.activePageId, "page-secondary", "AI must not switch the user's active Page");
  assert.deepEqual(nodeById(write.document, "node-a").position, { x: 333, y: 444 }, "manual position wins without conflict");
  assert.equal(nodeById(write.document, "node-a").data.body, "AI updated bound Page");
  const replay = await graphUpdate(state.projectPath, context, "node-a", "AI updated bound Page", "drag-page-ai");
  assert.equal(replay.replayed, true);
  assert.equal(replay.documentRevision, write.documentRevision);
  await stopDaemon();
  await startDaemon();
  const restartReplay = await graphUpdate(state.projectPath, context, "node-a", "AI updated bound Page", "drag-page-ai");
  assert.equal(restartReplay.replayed, true, "durable receipt must win even after the in-memory context expires on daemon restart");
  assert.equal(restartReplay.documentRevision, write.documentRevision);
  const expired = await graphUpdate(state.projectPath, context, "node-a", "different write after context loss", "expired-context-write");
  assert.equal(expired.status, "validation_failed");
  assert.equal(expired.validation.violations.some((item) => item.code === "context_expired"), true);

  const twoAi = await fixture("two-ai-disjoint");
  const firstAiContext = await getGraphContext(twoAi.projectPath);
  const secondAiContext = await getGraphContext(twoAi.projectPath);
  const firstAi = await graphUpdate(twoAi.projectPath, firstAiContext, "node-a", "first AI changed A", "two-ai-first");
  const secondAi = await graphUpdate(twoAi.projectPath, secondAiContext, "node-b", "second AI changed B", "two-ai-second");
  assert.equal(firstAi.status, "written");
  assert.equal(secondAi.status, "merged");
  assert.equal(nodeById(secondAi.document, "node-a").data.body, "first AI changed A");
  assert.equal(nodeById(secondAi.document, "node-b").data.body, "second AI changed B");

  const conflictState = await fixture("ai-same-node-conflict");
  const conflictContext = await getGraphContext(conflictState.projectPath);
  const human = clone(conflictState.base.document);
  setNodeBody(human, "node-a", "human wins original");
  await saveModern(conflictState.firstSessionId, conflictState.projectPath, conflictState.base, human, "human-before-ai");
  const conflict = await graphUpdate(conflictState.projectPath, conflictContext, "node-a", "complete AI candidate", "same-node-ai");
  assert.equal(conflict.status, "conflict-copy");
  assert.equal(nodeById(conflict.document, "node-a").data.body, "human wins original");
  assert.equal(conflict.document.activePageId, "page-main");
  const copy = pageById(conflict.document, conflict.conflictCopies[0].conflictPageId);
  assert.equal(copy.nodes.find((item) => item.data.title === "node-a").data.body, "complete AI candidate");
  assertUniqueGraphIds(conflict.document);

  const aiFirstState = await fixture("ai-same-node-first");
  const aiContext = await getGraphContext(aiFirstState.projectPath);
  const aiFirstWrite = await graphUpdate(aiFirstState.projectPath, aiContext, "node-a", "AI saved before human", "ai-before-human");
  assert.equal(aiFirstWrite.status, "written");
  const aiWriterState = JSON.parse(await fsp.readFile(path.join(aiFirstState.projectPath, ".scatter", "revision-state.json"), "utf8"));
  assert.equal(aiWriterState.objectWriters["node:page-main:node-a"], "ai");
  const staleHuman = clone(aiFirstState.base.document);
  setNodeBody(staleHuman, "node-a", "human semantic version must remain original");
  staleHuman.pages[0].nodes[0].position = { x: 777, y: 222 };
  const humanAfterAi = await saveModern(aiFirstState.secondSessionId, aiFirstState.projectPath, aiFirstState.base, staleHuman, "human-after-ai");
  assert.equal(humanAfterAi.status, "conflict-copy");
  assert.equal(nodeById(humanAfterAi.document, "node-a").data.body, "human semantic version must remain original");
  assert.deepEqual(nodeById(humanAfterAi.document, "node-a").position, { x: 777, y: 222 });
  const aiCopyMeta = humanAfterAi.merge.conflictCopies.find((item) => item.source === "ai");
  assert.ok(aiCopyMeta, "AI provenance must identify the losing AI candidate");
  const aiCopy = pageById(humanAfterAi.document, aiCopyMeta.conflictPageId);
  assert.equal(aiCopy.nodes.find((item) => item.data.title === "node-a").data.body, "AI saved before human");
  assert.deepEqual(aiCopy.nodes.find((item) => item.data.title === "node-a").position, { x: 777, y: 222 }, "manual position also wins in AI copy");
  assert.equal(humanAfterAi.document.activePageId, "page-main", "human remains on original Page");
  assertUniqueGraphIds(humanAfterAi.document);
}

try {
  await startDaemon();
  await assertDisjointMerge();
  await assertSameNodeConflictCopy();
  await assertIdenticalEditIsUnchanged();
  await assertOrientationAndTransientChangesAreNoop();
  await assertConflictMatrix();
  await assertDifferentEdgesMerge();
  await assertMutationReplayAndRestart();
  await assertAiWriterRace();
  await assertAiDragPageSwitchConflictAndReplay();
  console.log("Canvasight concurrent document smoke passed.");
} finally {
  await stopDaemon();
  await fsp.rm(tempRoot, { recursive: true, force: true });
}
