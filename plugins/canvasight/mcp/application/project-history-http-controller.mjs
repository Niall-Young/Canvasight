import { ProjectHistoryAgentCheckService } from "./project-history-agent-check-service.mjs";
import { ProjectHistoryExternalWatcher } from "./project-history-external-watcher.mjs";
import { ProjectHistoryHostActionService } from "./project-history-host-action-service.mjs";
import { ProjectHistoryPortabilityService } from "./project-history-portability-service.mjs";
import { ProjectHistoryReleaseService } from "./project-history-release-service.mjs";
import { ProjectHistoryService } from "./project-history-service.mjs";
import { ProjectHistoryObserverState } from "../infrastructure/project-history-observer-state.mjs";
import { ProjectHistoryViewStore } from "../infrastructure/project-history-view-store.mjs";

const HISTORY_ACTIONS = new Set([
  "history",
  "history-enable",
  "history-refresh",
  "history-save-now",
  "history-view",
  "history-node",
  "history-feature",
  "history-agent-check-prepare",
  "history-agent-check-dispatched",
  "history-host-action",
  "history-confirm-prepare",
  "history-confirm",
  "history-merge-prepare",
  "history-merge",
  "history-portability"
]);

export function createProjectHistoryHttpController({
  HttpError,
  assertMethod,
  enableProjectHistory,
  normalizeProjectPath,
  optionalThreadId,
  projectHistorySnapshot,
  readJsonBody,
  refreshProjectHistory,
  sendJson
}) {
  return async function handleProjectHistorySessionAction(req, res, action, session) {
    if (!HISTORY_ACTIONS.has(action)) return false;
    const projectPath = normalizeProjectPath(session.projectPath);

    if (action === "history") {
      assertMethod(req, "GET");
      sendJson(res, 200, await projectHistorySnapshot(projectPath));
      return true;
    }
    if (action === "history-enable") {
      assertMethod(req, "POST");
      const body = await readJsonBody(req);
      sendJson(res, 200, await enableProjectHistory(projectPath, {
        ...body,
        threadId: optionalThreadId(body?.threadId) || session.codexThreadId
      }));
      return true;
    }
    if (action === "history-refresh") {
      assertMethod(req, "POST");
      sendJson(res, 200, await refreshProjectHistory(projectPath));
      return true;
    }

    const service = await ProjectHistoryService.forRepository(projectPath);
    if (action === "history-save-now") {
      assertMethod(req, "POST");
      const observer = new ProjectHistoryObserverState(service.store.storageDirectory);
      const externalWatcher = await new ProjectHistoryExternalWatcher(service, observer).inspect({ force: true });
      sendJson(res, 200, { ...(await projectHistorySnapshot(projectPath)), externalWatcher });
      return true;
    }
    if (action === "history-view") {
      if (req.method !== "PUT" && req.method !== "POST") throw new HttpError(405, "Expected POST or PUT");
      const body = await readJsonBody(req);
      const expectedRevision = Number(body?.expectedRevision);
      if (!Number.isFinite(expectedRevision)) throw new HttpError(400, "History view expectedRevision is required.", "history_view_revision_required");
      try {
        sendJson(res, 200, await new ProjectHistoryViewStore(service.store.storageDirectory).save(body.view, expectedRevision));
      } catch (error) {
        if (error instanceof Error && error.message.includes("concurrently")) throw new HttpError(409, error.message, "history_view_stale");
        throw error;
      }
      return true;
    }
    if (action === "history-node") {
      if (req.method !== "PUT" && req.method !== "POST") throw new HttpError(405, "Expected POST or PUT");
      const body = await readJsonBody(req);
      if (typeof body?.nodeId !== "string" || !body.nodeId) throw new HttpError(400, "History nodeId is required.", "history_node_required");
      if (body.operation === "edit-summary") await service.editNodeSummary(body.nodeId, body.summary);
      else if (body.operation === "reclassify") await service.reclassifyNode(body.nodeId, { featureLineId: body.featureLineId, name: body.featureName });
      else throw new HttpError(400, "Unsupported History node operation.", "history_node_operation_invalid");
      sendJson(res, 200, await projectHistorySnapshot(projectPath));
      return true;
    }
    if (action === "history-feature") {
      if (req.method !== "PUT" && req.method !== "POST") throw new HttpError(405, "Expected POST or PUT");
      const body = await readJsonBody(req);
      if (typeof body?.featureLineId !== "string" || !body.featureLineId) throw new HttpError(400, "History featureLineId is required.", "history_feature_required");
      if (body.operation === "abandon" || body.operation === "reactivate") await service.setFeatureAbandoned(body.featureLineId, body.operation === "abandon");
      else if (body.operation === "rename") await service.renameFeature(body.featureLineId, body.name);
      else throw new HttpError(400, "Unsupported History feature operation.", "history_feature_operation_invalid");
      sendJson(res, 200, await projectHistorySnapshot(projectPath));
      return true;
    }
    if (action === "history-agent-check-prepare") {
      assertMethod(req, "POST");
      const body = await readJsonBody(req);
      sendJson(res, 200, await new ProjectHistoryAgentCheckService(service).prepare(body?.nodeId));
      return true;
    }
    if (action === "history-agent-check-dispatched") {
      assertMethod(req, "POST");
      const body = await readJsonBody(req);
      await new ProjectHistoryAgentCheckService(service).markRequested(body?.token);
      sendJson(res, 200, await projectHistorySnapshot(projectPath));
      return true;
    }
    if (action === "history-host-action") {
      assertMethod(req, "POST");
      const body = await readJsonBody(req);
      const hostActions = new ProjectHistoryHostActionService(service);
      if (body?.operation === "prepare") {
        const sessionTaskId = optionalThreadId(session.codexThreadId);
        const requestedTaskId = optionalThreadId(body?.sourceTaskId);
        if (sessionTaskId && requestedTaskId && sessionTaskId !== requestedTaskId) {
          throw new HttpError(409, "Project History host action source task does not match this Canvasight session.", "history_host_action_task_mismatch");
        }
        const sourceTaskId = sessionTaskId || requestedTaskId;
        sendJson(res, 200, await hostActions.prepare(body?.nodeId, body?.action, sourceTaskId));
      } else if (body?.operation === "status") {
        sendJson(res, 200, await hostActions.status(body?.requestId));
      } else if (body?.operation === "dispatch-failed") {
        sendJson(res, 200, await hostActions.markDispatchFailed(body?.requestId, body?.error));
      } else {
        throw new HttpError(400, "Unsupported Project History host action operation.", "history_host_action_operation_invalid");
      }
      return true;
    }
    if (action === "history-confirm-prepare") {
      assertMethod(req, "POST");
      const body = await readJsonBody(req);
      sendJson(res, 200, await new ProjectHistoryReleaseService(service).prepareConfirmation(body?.nodeId));
      return true;
    }
    if (action === "history-confirm") {
      assertMethod(req, "POST");
      const body = await readJsonBody(req);
      const release = new ProjectHistoryReleaseService(service);
      let operation = await release.confirmNode(body?.token, { acceptVerificationRisk: body?.acceptVerificationRisk === true });
      if (body?.autoMergeIfEligible === true && operation?.status === "confirmed" && operation.autoMergeEligible === true) {
        try {
          const preparedMerge = await release.prepareMerge(operation.nodeId);
          if (preparedMerge?.token) operation = { ...(await release.mergeNode(preparedMerge.token)), automatic: true, reason: "documentation-only" };
        } catch (error) {
          operation = {
            ...operation,
            automatic: false,
            reason: "auto-merge-stopped",
            details: String(error?.message || error || "automatic merge stopped").slice(0, 600)
          };
        }
      }
      sendJson(res, 200, { operation, history: await projectHistorySnapshot(projectPath) });
      return true;
    }
    if (action === "history-merge-prepare") {
      assertMethod(req, "POST");
      const body = await readJsonBody(req);
      sendJson(res, 200, await new ProjectHistoryReleaseService(service).prepareMerge(body?.nodeId));
      return true;
    }
    if (action === "history-merge") {
      assertMethod(req, "POST");
      const body = await readJsonBody(req);
      const operation = await new ProjectHistoryReleaseService(service).mergeNode(body?.token);
      sendJson(res, 200, { operation, history: await projectHistorySnapshot(projectPath) });
      return true;
    }
    const portability = new ProjectHistoryPortabilityService(service, new ProjectHistoryViewStore(service.store.storageDirectory));
    if (req.method === "GET") {
      sendJson(res, 200, await portability.status());
      return true;
    }
    if (req.method !== "POST") throw new HttpError(405, "Expected GET or POST");
    const body = await readJsonBody(req);
    let operation;
    if (body?.operation === "authorize") operation = await portability.authorize(body.remote);
    else if (body?.operation === "revoke") operation = await portability.revoke();
    else if (body?.operation === "sync") operation = await portability.sync();
    else if (body?.operation === "import") operation = await portability.importRemote(body.remote);
    else if (body?.operation === "write-local") operation = await portability.writeLocal();
    else if (body?.operation === "export-local") operation = await portability.exportManifest();
    else if (body?.operation === "import-local") operation = await portability.importManifest(body.manifest);
    else throw new HttpError(400, "Unsupported History portability operation.", "history_portability_operation_invalid");
    sendJson(res, 200, { operation, history: await projectHistorySnapshot(projectPath) });
    return true;
  };
}
