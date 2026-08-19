import path from "node:path";
import { ProjectHistoryService } from "./project-history-service.mjs";
import { isGitWorktree } from "../infrastructure/git-project-bootstrap.mjs";
import { ProjectHistoryObserverState } from "../infrastructure/project-history-observer-state.mjs";

export function createProjectHistoryHookController({
  HttpError,
  activeSessions,
  appendLifecycle,
  inspectCodexTurn,
  maxRecentProjects,
  observationMatchForProject,
  optionalProjectPath,
  optionalThreadId,
  projectHistoryTaskBindings,
  recentProjects,
  recordProjectHistoryHookTurn,
  recordProjectHistoryHookTurnStarted
}) {
  async function candidatesFor(observation) {
    const bound = await projectHistoryTaskBindings.bindingsForThread(observation.taskId);
    const boundByPath = new Map(bound.map((binding) => [path.resolve(binding.projectPath), binding]));
    for (const session of activeSessions()) {
      if (session.codexThreadId !== observation.taskId) continue;
      const projectPath = path.resolve(session.projectPath);
      if (!boundByPath.has(projectPath)) {
        const binding = await projectHistoryTaskBindings.bind({
          threadId: observation.taskId,
          projectPath,
          source: "active-canvasight-session"
        });
        if (binding) boundByPath.set(projectPath, binding);
      }
    }
    const recent = await recentProjects(maxRecentProjects);
    const candidatePaths = new Set([...boundByPath.keys(), ...recent.map((project) => path.resolve(project.path))]);
    const matched = [];
    for (const projectPath of candidatePaths) {
      if (!(await isGitWorktree(projectPath).catch(() => false))) continue;
      const binding = boundByPath.get(projectPath) || null;
      const match = binding ? { matches: true, reason: "task-binding" } : await observationMatchForProject(projectPath, observation);
      if (match.matches) matched.push({ projectPath, binding, reason: match.reason });
    }
    return matched;
  }

  async function captureStop(body) {
    const taskId = optionalThreadId(body?.taskId);
    const turnId = typeof body?.turnId === "string" ? body.turnId.trim() : "";
    const fallbackCandidates = taskId && turnId
      ? await candidatesFor({ taskId, turnId, cwd: optionalProjectPath(body?.cwd), fileChanges: [] })
      : [];
    try {
      const observation = await inspectCodexTurn(body);
      const candidates = await candidatesFor(observation);
      const results = [];
      for (const candidate of candidates) {
        results.push({
          matchReason: candidate.reason,
          ...(await recordProjectHistoryHookTurn(candidate.projectPath, observation, candidate.binding))
        });
      }
      appendLifecycle("project_history_stop_hook", {
        taskId: observation.taskId,
        turnId: observation.turnId,
        candidateCount: candidates.length,
        results: results.map((result) => ({ projectPath: result.projectPath, status: result.status, reason: result.reason || null }))
      });
      return {
        status: results.some((result) => result.status === "snapshot-recorded")
          ? "snapshot-recorded"
          : results.some((result) => result.status === "chat-recorded") ? "chat-recorded" : "ignored",
        taskId: observation.taskId,
        turnId: observation.turnId,
        summary: observation.summary,
        fileChangeCount: observation.fileChanges.length,
        results
      };
    } finally {
      for (const candidate of fallbackCandidates) {
        await ProjectHistoryService.forRepository(candidate.projectPath)
          .then((service) => new ProjectHistoryObserverState(service.store.storageDirectory).markTurnStopped(taskId, turnId))
          .catch(() => {});
      }
    }
  }

  async function captureUserPrompt(body) {
    const taskId = optionalThreadId(body?.taskId);
    const turnId = typeof body?.turnId === "string" ? body.turnId.trim() : "";
    const cwd = optionalProjectPath(body?.cwd);
    if (!taskId || !turnId || !cwd) {
      throw new HttpError(400, "Project History UserPromptSubmit hook requires taskId, turnId, and cwd.", "history_hook_identity_required");
    }
    const candidates = await candidatesFor({ taskId, turnId, cwd, fileChanges: [] });
    const results = [];
    for (const candidate of candidates) {
      results.push({
        matchReason: candidate.reason,
        ...(await recordProjectHistoryHookTurnStarted(candidate.projectPath, body, candidate.binding))
      });
    }
    appendLifecycle("project_history_user_prompt_hook", {
      taskId,
      turnId,
      candidateCount: candidates.length,
      results: results.map((result) => ({ projectPath: result.projectPath, status: result.status, reason: result.reason || null }))
    });
    return {
      status: results.some((result) => result.status === "active-turn-recorded") ? "active-turn-recorded" : "ignored",
      taskId,
      turnId,
      results
    };
  }

  return { captureStop, captureUserPrompt };
}
