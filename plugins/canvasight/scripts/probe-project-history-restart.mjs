#!/usr/bin/env node
import process from "node:process";
import { codexTurnObservationIds } from "../mcp/domain/project-history-contract.mjs";
import { CodexAppServerClient, listCodexTurns } from "../mcp/infrastructure/codex-activity-provider.mjs";

const threadId = process.argv[2] || process.env.CODEX_THREAD_ID || null;
if (!threadId) throw new Error("usage: probe-project-history-restart.mjs THREAD_ID");

async function snapshot() {
  const client = new CodexAppServerClient();
  try {
    const initialized = await client.connect();
    const read = await client.request("thread/read", { threadId, includeTurns: false });
    const turns = await listCodexTurns(client, threadId);
    return {
      runtimeVersion: initialized.userAgent || null,
      thread: { id: read.thread?.id || null, cwd: read.thread?.cwd || null },
      turns: turns.map((turn) => ({ id: turn.id, status: turn.status })),
      observationIds: turns.flatMap((turn) => codexTurnObservationIds(threadId, turn))
    };
  } finally {
    await client.close();
  }
}

try {
  const before = await snapshot();
  const after = await snapshot();
  const stable = JSON.stringify(before) === JSON.stringify(after);
  process.stdout.write(`${JSON.stringify({
    probe: "R0-06 RestartContinuity",
    status: stable ? "passed" : "failed",
    threadId,
    runtimeVersion: before.runtimeVersion,
    turnCount: before.turns.length,
    observationCount: before.observationIds.length,
    stableAcrossFreshAppServerProcesses: stable
  }, null, 2)}\n`);
  if (!stable) process.exitCode = 2;
} catch (error) {
  process.stderr.write(`${JSON.stringify({
    probe: "R0-06 RestartContinuity",
    status: "error",
    error: error instanceof Error ? error.message : String(error)
  }, null, 2)}\n`);
  process.exitCode = 1;
}
