#!/usr/bin/env node
import assert from "node:assert/strict";
import path from "node:path";
import {
  activityProviderDescriptor,
  CodexAppServerClient,
  listCodexThreads,
  listCodexTurns
} from "../mcp/infrastructure/codex-activity-provider.mjs";

const fixture = path.resolve(import.meta.dirname, "fixtures", "fake-codex-app-server.mjs");
const client = new CodexAppServerClient({ bin: process.execPath, args: [fixture], timeoutMs: 5000 });

try {
  const initialized = await client.connect();
  assert.equal(activityProviderDescriptor(initialized).runtimeVersion, "codex-cli-test/0.143.0");
  assert.deepEqual((await listCodexThreads(client, { cwd: "/repo" })).map((thread) => thread.id), ["thread-existing"]);
  assert.deepEqual((await listCodexTurns(client, "thread-existing")).map((turn) => [turn.id, turn.status, turn.terminal]), [
    ["turn-complete", "completed", true],
    ["turn-interrupted", "interrupted", true]
  ]);
  const created = await client.request("thread/start", { cwd: "/repo", ephemeral: false });
  assert.equal(created.thread.cwd, "/repo");
  assert.equal(client.notifications.some((notification) => notification.method === "thread/started"), true);
  process.stdout.write("Project History R0-02/03/05 host contract smoke passed.\n");
} finally {
  await client.close();
}
