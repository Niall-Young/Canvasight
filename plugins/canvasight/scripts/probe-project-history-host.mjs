#!/usr/bin/env node
import process from "node:process";
import { randomUUID } from "node:crypto";
import {
  activityProviderDescriptor,
  CodexAppServerClient,
  listCodexThreads,
  listCodexTurns
} from "../mcp/infrastructure/codex-activity-provider.mjs";

function argument(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] || null : null;
}

const threadId = argument("--thread-id") || process.env.CODEX_THREAD_ID || null;
const createCwd = argument("--create-cwd");
const listCwd = argument("--list-cwd");
const materializeTaskId = argument("--materialize-task-id");
const archiveTaskId = argument("--archive-task-id");
const createName = argument("--create-name") || "Canvasight Project History R0 probe";
const client = new CodexAppServerClient();

function summarizeTurns(turns) {
  const byStatus = {};
  for (const turn of turns) byStatus[turn.status] = (byStatus[turn.status] || 0) + 1;
  return {
    count: turns.length,
    byStatus,
    recent: turns.slice(-3).map((turn) => ({ id: turn.id, status: turn.status, terminal: turn.terminal }))
  };
}

try {
  const initialized = await client.connect();
  const report = {
    probe: "R0-02/03/05 CodexHost",
    status: "passed",
    provider: activityProviderDescriptor(initialized),
    currentTask: null,
    currentTurns: { count: 0, byStatus: {}, recent: [] },
    projectTasks: null,
    materializedTask: null,
    archivedTask: null,
    createdTask: null
  };

  if (threadId) {
    const read = await client.request("thread/read", { threadId, includeTurns: false });
    report.currentTask = read.thread ? {
      id: read.thread.id,
      cwd: read.thread.cwd,
      status: read.thread.status?.type || "unknown",
      source: read.thread.source ?? null,
      ephemeral: read.thread.ephemeral === true
    } : null;
    report.currentTurns = summarizeTurns(await listCodexTurns(client, threadId));
  }

  if (listCwd) {
    const stateDb = await listCodexThreads(client, { cwd: listCwd, useStateDbOnly: true });
    const scanAndRepair = await listCodexThreads(client, { cwd: listCwd, useStateDbOnly: false });
    report.projectTasks = {
      cwd: listCwd,
      stateDbIds: stateDb.map((thread) => thread.id),
      scanAndRepairIds: scanAndRepair.map((thread) => thread.id)
    };
  }

  if (materializeTaskId) {
    const resumed = await client.request("thread/resume", { threadId: materializeTaskId, excludeTurns: true });
    const materializeCwd = resumed.thread?.cwd;
    const started = await client.request("turn/start", {
      threadId: materializeTaskId,
      input: [{ type: "text", text: "Project History R0 task creation probe. Reply only READY." }],
      clientUserMessageId: randomUUID(),
      effort: "low",
      ...(materializeCwd ? { cwd: materializeCwd, runtimeWorkspaceRoots: [materializeCwd] } : {})
    });
    const turnId = started.turn?.id;
    if (!turnId) throw new Error("turn/start did not return a turn id");
    const completed = await client.waitForNotification((notification) =>
      notification.method === "turn/completed" &&
      notification.params?.threadId === materializeTaskId &&
      notification.params?.turn?.id === turnId,
    120_000);
    const stateDb = materializeCwd
      ? await listCodexThreads(client, { cwd: materializeCwd, useStateDbOnly: true })
      : [];
    report.materializedTask = {
      id: materializeTaskId,
      cwd: materializeCwd || null,
      turnId,
      turnStatus: completed.params.turn.status,
      listedByStateDb: stateDb.some((thread) => thread.id === materializeTaskId)
    };
    if (!report.materializedTask.listedByStateDb) report.status = "failed";
  }

  if (archiveTaskId) {
    await client.request("thread/archive", { threadId: archiveTaskId });
    report.archivedTask = { id: archiveTaskId, archived: true };
  }

  if (createCwd) {
    const created = await client.request("thread/start", {
      cwd: createCwd,
      ephemeral: false,
      runtimeWorkspaceRoots: [createCwd]
    });
    const createdId = created.thread?.id;
    if (!createdId) throw new Error("thread/start did not return a task id");
    await client.request("thread/name/set", { threadId: createdId, name: createName });
    const stateDbMatching = await listCodexThreads(client, { cwd: createCwd, useStateDbOnly: true });
    const repairedMatching = await listCodexThreads(client, { cwd: createCwd, useStateDbOnly: false });
    report.createdTask = {
      id: createdId,
      cwd: created.thread.cwd,
      listedByStateDb: stateDbMatching.some((thread) => thread.id === createdId),
      listedByScanAndRepair: repairedMatching.some((thread) => thread.id === createdId)
    };
    if (!report.createdTask.listedByStateDb) report.status = "failed";
  }

  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  if (report.status !== "passed") process.exitCode = 2;
} catch (error) {
  process.stderr.write(`${JSON.stringify({
    probe: "R0-02/03/05 CodexHost",
    status: "error",
    error: error instanceof Error ? error.message : String(error)
  }, null, 2)}\n`);
  process.exitCode = 1;
} finally {
  await client.close();
}
