import path from "node:path";
import { ProjectHistoryService } from "./project-history-service.mjs";
import { ProjectHistoryPortabilityService } from "./project-history-portability-service.mjs";
import { ProjectHistoryExternalWatcher } from "./project-history-external-watcher.mjs";
import { ProjectHistoryHostActionService } from "./project-history-host-action-service.mjs";
import { probeGitProjectIdentity } from "../infrastructure/git-project-identity.mjs";
import { initializeLocalGitRepository, isGitWorktree, scanProjectBootstrapScope } from "../infrastructure/git-project-bootstrap.mjs";
import { ProjectHistoryObserverState } from "../infrastructure/project-history-observer-state.mjs";
import { ProjectHistoryViewStore } from "../infrastructure/project-history-view-store.mjs";

function historyTimestamp(value) {
  if (typeof value === "string" && Number.isFinite(Date.parse(value))) return new Date(value).toISOString();
  if (!Number.isFinite(value)) return new Date().toISOString();
  const milliseconds = value < 10_000_000_000 ? value * 1000 : value;
  const date = new Date(milliseconds);
  return Number.isFinite(date.getTime()) ? date.toISOString() : new Date().toISOString();
}

const TERMINAL_TURN_STATUSES = new Set(["completed", "interrupted", "failed"]);

function isPathInside(candidatePath, rootPath) {
  const relative = path.relative(path.resolve(rootPath), path.resolve(candidatePath));
  return relative === "" || (!relative.startsWith(`..${path.sep}`) && relative !== ".." && !path.isAbsolute(relative));
}

function compactText(value, limit = 160) {
  if (typeof value !== "string") return "";
  return value
    .replace(/<codex_internal_context[\s\S]*?<\/codex_internal_context>/giu, " ")
    .replace(/<[^>]+>/gu, " ")
    .replace(/\s+/gu, " ")
    .trim()
    .slice(0, limit);
}

function textFromMessageContent(content) {
  if (!Array.isArray(content)) return "";
  return content
    .filter((item) => item?.type === "text" && typeof item.text === "string")
    .map((item) => item.text)
    .join("\n")
    .trim();
}

function requestedText(value) {
  const text = typeof value === "string" ? value : "";
  const requestMarker = text.match(/##\s*My request:\s*([\s\S]*)/iu);
  return compactText(requestMarker?.[1] || text);
}

function canvasightWorkflowContext(turn) {
  const texts = (Array.isArray(turn?.items) ? turn.items : [])
    .filter((item) => item?.type === "userMessage")
    .map((item) => textFromMessageContent(item.content))
    .filter(Boolean);
  for (const text of texts.reverse()) {
    const title = text.match(/^#\s*Canvasight\s+任务:\s*(.+)$/imu)?.[1]?.trim();
    const nodeId = text.match(/^节点 ID:\s*([^\s]+)$/imu)?.[1]?.trim();
    if (!title || !nodeId) continue;
    const prompt = text.match(/###\s*提示词\s*\n([\s\S]*?)(?=\n###\s|\n##\s|$)/iu)?.[1]?.trim();
    return { nodeId, title: compactText(title, 80), prompt: compactText(prompt, 160) };
  }
  return null;
}

function summarizeTurnIntent(turn, hookInput) {
  const bootstrapSummary = compactText(hookInput?.bootstrapSummary);
  if (bootstrapSummary) return bootstrapSummary;
  const workflow = canvasightWorkflowContext(turn);
  if (workflow?.prompt) return workflow.prompt;
  const items = Array.isArray(turn?.items) ? turn.items : [];
  const userTexts = items
    .filter((item) => item?.type === "userMessage")
    .map((item) => requestedText(textFromMessageContent(item.content)))
    .filter(Boolean);
  if (userTexts.length) return userTexts.at(-1);
  const finalAssistant = [...items]
    .reverse()
    .find((item) => item?.type === "agentMessage" && typeof item.text === "string" && item.text.trim());
  return compactText(finalAssistant?.text || hookInput?.lastAssistantMessage || "完成当前 Codex 开发轮次");
}

function turnFileChanges(turn) {
  const changes = [];
  for (const item of Array.isArray(turn?.items) ? turn.items : []) {
    if (item?.type !== "fileChange" || !Array.isArray(item.changes)) continue;
    for (const change of item.changes) {
      if (typeof change?.path !== "string" || !change.path.trim()) continue;
      changes.push({
        path: path.resolve(change.path),
        kind: typeof change.kind?.type === "string" ? change.kind.type : "update",
        ...(typeof change.kind?.move_path === "string" && change.kind.move_path ? { previousPath: path.resolve(change.kind.move_path) } : {})
      });
    }
  }
  return changes;
}

export function createProjectHistoryRuntime({ appServerRequest, optionalProjectPath, optionalThreadId, HttpError }) {
  async function inspectCodexTurn(hookInput) {
    const taskId = optionalThreadId(hookInput?.taskId);
    const turnId = typeof hookInput?.turnId === "string" ? hookInput.turnId.trim() : "";
    if (!taskId || !turnId) throw new HttpError(400, "Project History Stop hook requires taskId and turnId.", "history_hook_identity_required");
    const threadRead = await appServerRequest("thread/read", { threadId: taskId, includeTurns: false });
    let matchedTurn = null;
    for (let attempt = 0; attempt < 3 && !matchedTurn; attempt += 1) {
      let cursor = null;
      let pages = 0;
      do {
        const page = await appServerRequest("thread/turns/list", {
          threadId: taskId,
          cursor,
          limit: 100,
          sortDirection: "desc",
          itemsView: "full"
        }, { experimentalApi: true });
        matchedTurn = (Array.isArray(page?.data) ? page.data : []).find((turn) => turn?.id === turnId) || null;
        cursor = typeof page?.nextCursor === "string" && page.nextCursor ? page.nextCursor : null;
        pages += 1;
      } while (!matchedTurn && cursor && pages < 20);
      if (!matchedTurn && attempt < 2) await new Promise((resolve) => setTimeout(resolve, 120));
    }
    if (!matchedTurn) throw new HttpError(404, "Codex turn was not found for Project History capture.", "history_hook_turn_not_found");
    const status = typeof matchedTurn.status === "string" ? matchedTurn.status : "unknown";
    if (!TERMINAL_TURN_STATUSES.has(status)) {
      throw new HttpError(409, `Codex turn is not terminal yet: ${status}`, "history_hook_turn_not_terminal");
    }
    const thread = threadRead?.thread || {};
    const workflow = canvasightWorkflowContext(matchedTurn);
    return {
      id: `codex:${taskId}:${turnId}:terminal:${status}`,
      taskId,
      turnId,
      status,
      cwd: optionalProjectPath(hookInput?.cwd) || optionalProjectPath(thread.cwd),
      taskName: typeof thread.name === "string" && thread.name.trim() ? thread.name.trim() : null,
      occurredAt: historyTimestamp(matchedTurn.completedAt ?? matchedTurn.startedAt),
      summary: summarizeTurnIntent(matchedTurn, hookInput),
      workflow,
      fileChanges: turnFileChanges(matchedTurn),
      hook: {
        eventName: hookInput?.hookEventName === "Stop" ? "Stop" : "manual-bootstrap",
        receivedAt: historyTimestamp(hookInput?.receivedAt),
        stopHookActive: hookInput?.stopHookActive === true
      }
    };
  }

  async function observationMatchForProject(projectPath, observation) {
    const resolvedProjectPath = optionalProjectPath(projectPath);
    if (!resolvedProjectPath) return { matches: false, reason: "invalid-project" };
    if (observation.fileChanges.some((change) => isPathInside(change.path, resolvedProjectPath))) {
      return { matches: true, reason: "changed-path" };
    }
    const projectIdentity = await probeGitProjectIdentity(resolvedProjectPath).catch(() => null);
    const cwdIdentity = observation.cwd ? await probeGitProjectIdentity(observation.cwd).catch(() => null) : null;
    if (projectIdentity && cwdIdentity?.localProjectId === projectIdentity.localProjectId) {
      return { matches: true, reason: "git-worktree" };
    }
    return { matches: false, reason: "unrelated" };
  }

  async function recordProjectHistoryHookTurn(projectPath, observation, binding = null) {
    const service = await ProjectHistoryService.forRepository(projectPath);
    const observer = new ProjectHistoryObserverState(service.store.storageDirectory);
    try {
      const before = await service.readIndex();
      if (!before.protection.enabled) return { status: "ignored", reason: "protection-disabled", projectPath };
      const projectIdentity = service.identity;
      const cwdIdentity = observation.cwd ? await probeGitProjectIdentity(observation.cwd).catch(() => null) : null;
      const workingTreePath = cwdIdentity?.localProjectId === projectIdentity.localProjectId
        ? cwdIdentity.worktreeRoot
        : service.projectPath;
      const attributedPaths = observation.fileChanges
        .filter((change) => isPathInside(change.path, workingTreePath))
        .map((change) => path.relative(workingTreePath, change.path).replaceAll(path.sep, "/"));
      const featureLineId = typeof binding?.featureLineId === "string" && binding.featureLineId ? binding.featureLineId : undefined;
      const recorded = await service.recordTurn({
        taskId: observation.taskId,
        turnId: observation.turnId,
        status: observation.status,
        featureLineId,
        featureName: observation.taskName || observation.summary,
        source: "codex",
        occurredAt: observation.occurredAt,
        summary: observation.summary,
        chatSummary: observation.summary,
        workflowNodeId: observation.workflow?.nodeId,
        workflowTitle: observation.workflow?.title,
        workingTreePath,
        attributedPaths,
        hasProjectFileChanges: attributedPaths.length > 0,
        captureTrigger: observation.hook?.eventName === "Stop" ? "codex-stop-hook" : "manual-current-task-bootstrap"
      });
      if (recorded.failed) return { status: "failed", projectPath, recorded };
      const existingIndex = recorded.duplicate ? await service.readIndex() : null;
      const existingSnapshot = existingIndex?.nodes.some((node) => node.taskId === observation.taskId && node.turnId === observation.turnId);
      const existingChat = existingIndex?.chatActivities.some((chat) => chat.taskId === observation.taskId && chat.turnId === observation.turnId);
      if (!before.protection.initialized) {
        await service.enableProtection({ currentTaskId: observation.taskId, classifyDirtyState: "project-start" });
      }
      await observer.markProcessed(observation);
      await observer.updateProviderCoverage({
        complete: true,
        source: "codex-stop-hook",
        scannedThreadCount: 1,
        observedTurnCount: 1,
        lastCapturedAt: new Date().toISOString()
      });
      if (recorded.snapshotRecorded || existingSnapshot) await new ProjectHistoryExternalWatcher(service, observer).acknowledgeCurrent();
      return {
        status: recorded.snapshotRecorded || existingSnapshot ? "snapshot-recorded" : recorded.snapshotRecorded === false || existingChat ? "chat-recorded" : "ignored",
        projectPath,
        taskId: observation.taskId,
        turnId: observation.turnId,
        summary: observation.summary,
        source: "codex-stop-hook",
        history: await projectHistorySnapshot(projectPath)
      };
    } finally {
      await observer.markTurnStopped(observation.taskId, observation.turnId).catch(() => {});
    }
  }

  async function recordProjectHistoryHookTurnStarted(projectPath, hookInput) {
    const taskId = optionalThreadId(hookInput?.taskId);
    const turnId = typeof hookInput?.turnId === "string" ? hookInput.turnId.trim() : "";
    if (!taskId || !turnId) throw new HttpError(400, "Project History UserPromptSubmit hook requires taskId and turnId.", "history_hook_identity_required");
    const service = await ProjectHistoryService.forRepository(projectPath);
    const index = await service.readIndex();
    if (!index.protection.enabled) return { status: "ignored", reason: "protection-disabled", projectPath };
    const startedAt = historyTimestamp(hookInput?.receivedAt);
    await new ProjectHistoryObserverState(service.store.storageDirectory).markTurnActive({
      taskId,
      turnId,
      cwd: optionalProjectPath(hookInput?.cwd),
      promptSummary: compactText(hookInput?.prompt),
      startedAt,
      expiresAt: new Date(Date.parse(startedAt) + 12 * 60 * 60 * 1000).toISOString()
    });
    return { status: "active-turn-recorded", projectPath, taskId, turnId };
  }

  async function codexTerminalObservationsForProject(projectPath) {
    const projectIdentity = await probeGitProjectIdentity(projectPath);
    const listedThreads = [];
    let threadCursor = null;
    let threadPages = 0;
    let threadListTruncated = false;
    do {
      const listed = await appServerRequest("thread/list", {
        archived: false,
        cwd: null,
        cursor: threadCursor,
        limit: 100,
        sortKey: "updated_at",
        sortDirection: "desc",
        sourceKinds: ["appServer", "vscode", "cli", "unknown"],
        useStateDbOnly: false
      }, { experimentalApi: true });
      listedThreads.push(...(Array.isArray(listed?.data) ? listed.data : []));
      threadCursor = typeof listed?.nextCursor === "string" && listed.nextCursor ? listed.nextCursor : null;
      threadPages += 1;
      if (threadCursor && threadPages >= 5) {
        threadListTruncated = true;
        break;
      }
    } while (threadCursor);
    const threads = [];
    const identityByCwd = new Map();
    for (const thread of listedThreads) {
      const cwd = optionalProjectPath(thread?.cwd);
      if (!cwd || typeof thread?.id !== "string") continue;
      let identity = identityByCwd.get(cwd);
      if (identity === undefined) {
        identity = await probeGitProjectIdentity(cwd).catch(() => null);
        identityByCwd.set(cwd, identity);
      }
      if (identity?.localProjectId === projectIdentity.localProjectId) {
        threads.push({ id: thread.id, cwd, name: typeof thread?.name === "string" ? thread.name : null });
      }
    }
    const observations = [];
    let turnListTruncated = false;
    for (const thread of threads) {
      let cursor = null;
      let pages = 0;
      do {
        const page = await appServerRequest("thread/turns/list", {
          threadId: thread.id,
          cursor,
          limit: 100,
          sortDirection: "asc",
          itemsView: "notLoaded"
        }, { experimentalApi: true });
        for (const turn of Array.isArray(page?.data) ? page.data : []) {
          const status = typeof turn?.status === "string" ? turn.status : "unknown";
          if (!new Set(["completed", "interrupted", "failed"]).has(status) || typeof turn?.id !== "string") continue;
          observations.push({
            id: `codex:${thread.id}:${turn.id}:terminal:${status}`,
            taskId: thread.id,
            turnId: turn.id,
            status,
            cwd: thread.cwd,
            taskName: thread.name,
            occurredAt: historyTimestamp(turn.completedAt ?? turn.startedAt)
          });
        }
        cursor = typeof page?.nextCursor === "string" && page.nextCursor ? page.nextCursor : null;
        pages += 1;
        if (cursor && pages >= 20) {
          turnListTruncated = true;
          break;
        }
      } while (cursor);
    }
    observations.sort((left, right) => left.occurredAt.localeCompare(right.occurredAt) || left.id.localeCompare(right.id));
    return {
      observations,
      coverage: {
        complete: !threadListTruncated && !turnListTruncated,
        threadListTruncated,
        turnListTruncated,
        scannedThreadCount: threads.length,
        observedTurnCount: observations.length
      }
    };
  }

  async function projectHistorySnapshot(projectPath) {
    if (!(await isGitWorktree(projectPath))) {
      return { status: "needs-git-confirmation", enabled: false, scan: await scanProjectBootstrapScope(projectPath) };
    }
    const service = await ProjectHistoryService.forRepository(projectPath);
    const observer = new ProjectHistoryObserverState(service.store.storageDirectory);
    const provider = await observer.read();
    const activeCodexTurns = await observer.activeTurns();
    const viewStore = new ProjectHistoryViewStore(service.store.storageDirectory);
    const portability = new ProjectHistoryPortabilityService(service, viewStore);
    const index = await service.readIndex();
    const gitState = index.protection.initialized
      ? await service.ensureMainBranch()
      : await service.readGitState();
    const gitTopology = await service.readGitTopology();
    const view = await viewStore.read();
    const imported = await portability.readImportStatus();
    if (imported) {
      const localIds = new Set(index.nodes.map((node) => node.id));
      const missingObjects = new Set(imported.missingObjectIds);
      imported.manifest.events.forEach((portableEvent, eventIndex) => {
        if (localIds.has(portableEvent.id)) return;
        const objectId = portableEvent.git?.objectId || "";
        const unavailable = !objectId || missingObjects.has(objectId);
        const portableOccurredAt = typeof portableEvent.occurredAt === "string" && Number.isFinite(Date.parse(portableEvent.occurredAt))
          ? new Date(portableEvent.occurredAt).toISOString()
          : new Date(eventIndex).toISOString();
        index.nodes.push({
          id: portableEvent.id,
          kind: portableEvent.type === "baseline" ? "baseline" : "snapshot",
          summary: portableEvent.summary,
          status: unavailable ? "content-unavailable" : "protected",
          source: "portable",
          featureLineId: null,
          taskId: null,
          turnId: null,
          snapshotRef: portableEvent.git?.refName || "",
          commit: objectId,
          tree: "",
          changedPaths: [],
          coverage: unavailable ? { complete: false, gapCodes: ["git-object-unavailable"] } : portableEvent.coverage,
          occurredAt: portableOccurredAt,
          confirmed: portableEvent.status === "confirmed" || portableEvent.status === "merged",
          merged: portableEvent.status === "merged",
          ...(portableEvent.status?.startsWith("agent-") ? {
            agentCheck: {
              status: portableEvent.status.slice("agent-".length),
              requestId: "portable-status",
              occurredAt: portableOccurredAt
            }
          } : {}),
          edits: [],
          portableOnly: true
        });
      });
      for (const item of imported.manifest.layout) {
        if (!view.positions[item.eventId]) view.positions[item.eventId] = { x: item.x, y: item.y };
      }
    }
    const portabilityStatus = await portability.status();
    const hostActions = await new ProjectHistoryHostActionService(service).list();
    return {
      status: "ready",
      enabled: index.protection.initialized,
      identity: service.identity,
      git: {
        ...gitState,
        featureModel: "logical-lines",
        snapshotRefNamespace: "refs/canvasight/snapshots/"
      },
      gitTopology: {
        ...gitTopology,
        commits: gitTopology.commits.map((commit) => {
          const historyNodes = index.nodes.filter((node) =>
            node.commit === commit.id || node.confirmationCommit === commit.id || node.mergeCommit === commit.id
          );
          return {
            ...commit,
            historyNodeIds: historyNodes.map((node) => node.id),
            ...(commit.isCanvasightGenerated && historyNodes[0]?.summary ? { displaySubject: historyNodes[0].summary } : {})
          };
        })
      },
      index,
      view,
      provider: {
        coverageStartedAt: provider.coverageStartedAt,
        observedTurnCount: Object.keys(provider.observations).length,
        coverageComplete: provider.providerCoverage?.complete !== false,
        coverage: provider.providerCoverage,
        activeTurnCount: activeCodexTurns.length,
        navigation: "native-host-bridge",
        taskCreation: "native-host-bridge"
      },
      hostActions,
      portability: {
        ...portabilityStatus,
        importedEventCount: imported?.manifest.events.length ?? 0,
        missingObjectCount: imported?.missingObjectIds.length ?? 0
      }
    };
  }

  async function enableProjectHistory(projectPath, body) {
    if (!(await isGitWorktree(projectPath))) {
      if (body?.confirmGitInitialization !== true) {
        throw new HttpError(409, "Project History requires confirmation before initializing local Git.", "git_initialization_confirmation_required");
      }
      await initializeLocalGitRepository(projectPath, { confirmed: true });
    }
    const service = await ProjectHistoryService.forRepository(projectPath);
    await service.enableProtection({
      currentTaskId: optionalThreadId(body?.threadId),
      classifyDirtyState: body?.classifyDirtyState === "feature-line" ? "feature-line" : "project-start"
    });
    let providerWarning = null;
    const observer = new ProjectHistoryObserverState(service.store.storageDirectory);
    try {
      const scan = await codexTerminalObservationsForProject(projectPath);
      await observer.initializeCoverage(scan.observations);
      await observer.updateProviderCoverage(scan.coverage);
      if (!scan.coverage.complete) await service.recordCoverageGap("provider-pagination-limit", scan.coverage);
    } catch (error) {
      providerWarning = error instanceof Error ? error.message : String(error);
    }
    await new ProjectHistoryExternalWatcher(service, observer).inspect().catch((error) => {
      providerWarning = providerWarning || (error instanceof Error ? error.message : String(error));
    });
    return { ...(await projectHistorySnapshot(projectPath)), providerWarning };
  }

  async function refreshProjectHistory(projectPath) {
    const service = await ProjectHistoryService.forRepository(projectPath);
    const currentIndex = await service.readIndex();
    if (!currentIndex.protection.initialized) {
      throw new HttpError(409, "Project History protection is not enabled.", "history_not_enabled");
    }
    const observer = new ProjectHistoryObserverState(service.store.storageDirectory);
    const provider = await observer.read();
    let providerWarning = null;
    let scan = { observations: [], coverage: { complete: false, unavailable: true } };
    try {
      scan = await codexTerminalObservationsForProject(projectPath);
    } catch (error) {
      providerWarning = error instanceof Error ? error.message : String(error);
    }
    await observer.updateProviderCoverage(scan.coverage);
    if (!scan.coverage.complete) await service.recordCoverageGap("provider-pagination-limit", scan.coverage);
    if (!provider.coverageStartedAt) {
      await observer.initializeCoverage(scan.observations);
      const externalWatcher = await new ProjectHistoryExternalWatcher(service, observer).inspect();
      return { ...(await projectHistorySnapshot(projectPath)), externalWatcher, providerWarning };
    }
    const pending = await observer.unprocessed(scan.observations);
    const newestFirst = pending.sort((left, right) => right.occurredAt.localeCompare(left.occurredAt) || right.id.localeCompare(left.id));
    let capturedCurrentSnapshot = false;
    for (const observation of newestFirst) {
      const recorded = await service.recordTurn({
        taskId: observation.taskId,
        turnId: observation.turnId,
        status: observation.status,
        featureName: observation.taskName,
        source: "mixed",
        occurredAt: observation.occurredAt
      });
      if (!recorded.failed) {
        await observer.markProcessed(observation);
        capturedCurrentSnapshot ||= recorded.snapshotRecorded === true;
      }
    }
    const watcher = new ProjectHistoryExternalWatcher(service, observer);
    if (capturedCurrentSnapshot) await watcher.acknowledgeCurrent();
    const externalWatcher = await watcher.inspect();
    return {
      ...(await projectHistorySnapshot(projectPath)),
      refreshedObservationCount: newestFirst.length,
      externalWatcher,
      providerWarning
    };
  }

  return {
    projectHistorySnapshot,
    enableProjectHistory,
    refreshProjectHistory,
    inspectCodexTurn,
    observationMatchForProject,
    recordProjectHistoryHookTurn,
    recordProjectHistoryHookTurnStarted
  };
}
