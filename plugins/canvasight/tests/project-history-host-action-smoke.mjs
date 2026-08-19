#!/usr/bin/env node
import assert from "node:assert/strict";
import { execFileSync, spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ProjectHistoryHostActionService } from "../mcp/application/project-history-host-action-service.mjs";
import { ProjectHistoryService } from "../mcp/application/project-history-service.mjs";

const root = fs.mkdtempSync(path.join(os.tmpdir(), "canvasight-history-host-action-"));
const repository = path.join(root, "repository");
const git = (...args) => execFileSync("git", ["-C", repository, ...args], { encoding: "utf8" }).trim();

function createMcpClient(serverPath) {
  const child = spawn(process.execPath, [serverPath], {
    cwd: path.dirname(serverPath),
    env: { ...process.env, CANVASIGHT_CODEX_NATIVE: "1", CANVASIGHT_HOME: path.join(root, "canvasight-home") },
    stdio: ["pipe", "pipe", "pipe"],
    windowsHide: true
  });
  let nextId = 1;
  let stdoutBuffer = Buffer.alloc(0);
  let stderr = "";
  const pending = new Map();
  child.stderr.setEncoding("utf8");
  child.stderr.on("data", (chunk) => { stderr += chunk; });
  child.stdout.on("data", (chunk) => {
    stdoutBuffer = Buffer.concat([stdoutBuffer, chunk]);
    while (stdoutBuffer.length) {
      const headerEnd = stdoutBuffer.indexOf("\r\n\r\n");
      if (headerEnd < 0) return;
      const header = stdoutBuffer.subarray(0, headerEnd).toString("ascii");
      const match = header.match(/content-length:\s*(\d+)/iu);
      if (!match) throw new Error(`Missing Content-Length header: ${header}`);
      const bodyStart = headerEnd + 4;
      const bodyEnd = bodyStart + Number(match[1]);
      if (stdoutBuffer.length < bodyEnd) return;
      const message = JSON.parse(stdoutBuffer.subarray(bodyStart, bodyEnd).toString("utf8"));
      stdoutBuffer = stdoutBuffer.subarray(bodyEnd);
      const request = pending.get(message.id);
      if (!request) continue;
      pending.delete(message.id);
      if (message.error) request.reject(new Error(message.error.message));
      else request.resolve(message.result);
    }
  });
  child.once("exit", (code, signal) => {
    const error = new Error(`MCP server exited early: code=${code} signal=${signal}. stderr=${stderr}`);
    for (const request of pending.values()) request.reject(error);
    pending.clear();
  });
  const request = (method, params) => {
    const id = nextId++;
    const body = JSON.stringify({ jsonrpc: "2.0", id, method, params });
    const result = new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
    child.stdin.write(`Content-Length: ${Buffer.byteLength(body, "utf8")}\r\n\r\n${body}`);
    return result;
  };
  const notify = (method, params) => {
    const body = JSON.stringify({ jsonrpc: "2.0", method, params });
    child.stdin.write(`Content-Length: ${Buffer.byteLength(body, "utf8")}\r\n\r\n${body}`);
  };
  return { child, notify, request };
}

try {
  fs.mkdirSync(repository);
  git("init", "-b", "main");
  git("config", "user.name", "Canvasight Host Action Probe");
  git("config", "user.email", "canvasight-host-action@example.invalid");
  fs.writeFileSync(path.join(repository, "app.txt"), "baseline\n");
  git("add", "app.txt");
  git("commit", "-m", "baseline");

  const history = await ProjectHistoryService.forRepository(repository, { exclusions: [] });
  await history.enableProtection({ currentTaskId: "source-task" });
  fs.writeFileSync(path.join(repository, "app.txt"), "real change\n");
  const node = (await history.recordTurn({
    taskId: "original-task",
    turnId: "original-turn",
    status: "completed",
    summary: "Build the real history loop"
  })).index.nodes.at(-1);
  const actions = new ProjectHistoryHostActionService(history);

  const navigation = await actions.prepare(node.id, "navigate", "source-task");
  assert.equal(navigation.status, "pending");
  assert.equal(navigation.expectedTargetTaskId, "original-task");
  assert.match(navigation.prompt, /codex_app__navigate_to_codex_page/u);
  assert.match(navigation.prompt, /record_project_history_host_action/u);
  assert.match(navigation.prompt, /Use \$canvasight/u);
  await assert.rejects(actions.record(navigation.token, {
    outcome: "succeeded",
    sourceTaskId: "wrong-task",
    targetTaskId: "original-task"
  }), /wrong source task/u);
  await assert.rejects(actions.record(navigation.token, {
    outcome: "succeeded",
    sourceTaskId: "source-task",
    targetTaskId: "wrong-target"
  }), /does not match/u);
  const navigated = await actions.record(navigation.token, {
    outcome: "succeeded",
    sourceTaskId: "source-task",
    targetTaskId: "original-task"
  });
  assert.equal(navigated.status, "succeeded");
  assert.equal((await actions.status(navigation.requestId)).targetTaskId, "original-task");
  assert.equal((await actions.markDispatchFailed(navigation.requestId, "late bridge error")).status, "succeeded", "a late dispatch error must not overwrite a completed receipt");
  assert.equal((await actions.record(navigation.token, {
    outcome: "succeeded",
    sourceTaskId: "source-task",
    targetTaskId: "original-task"
  })).status, "succeeded", "identical receipts should be idempotent");
  await assert.rejects(actions.record(navigation.token, {
    outcome: "failed",
    sourceTaskId: "source-task",
    error: "different replay"
  }), /different content/u);

  const continuation = await actions.prepare(node.id, "continue", "source-task");
  assert.match(continuation.prompt, /codex_app__list_projects/u);
  assert.match(continuation.prompt, /codex_app__create_thread/u);
  assert.match(continuation.prompt, new RegExp(node.snapshotRef.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&"), "u"));
  await assert.rejects(actions.record(continuation.token, {
    outcome: "queued",
    sourceTaskId: "source-task"
  }), /clientThreadId/u);
  const queued = await actions.record(continuation.token, {
    outcome: "queued",
    sourceTaskId: "source-task",
    clientThreadId: "queued-client-thread"
  });
  assert.equal(queued.status, "queued");
  assert.equal(queued.clientThreadId, "queued-client-thread");
  await assert.rejects(actions.record(continuation.token, {
    outcome: "succeeded",
    sourceTaskId: "source-task",
    targetTaskId: "continued-task",
    clientThreadId: "wrong-client-thread"
  }), /different content/u);
  const promoted = await actions.record(continuation.token, {
    outcome: "succeeded",
    sourceTaskId: "source-task",
    targetTaskId: "continued-task",
    clientThreadId: "queued-client-thread"
  });
  assert.equal(promoted.status, "succeeded");
  assert.equal(promoted.targetTaskId, "continued-task");
  assert.equal(promoted.clientThreadId, "queued-client-thread");
  assert.equal((await actions.record(continuation.token, {
    outcome: "succeeded",
    sourceTaskId: "source-task",
    targetTaskId: "continued-task",
    clientThreadId: "queued-client-thread"
  })).status, "succeeded", "an identical promoted receipt should be idempotent");
  await assert.rejects(actions.record(continuation.token, {
    outcome: "succeeded",
    sourceTaskId: "source-task",
    targetTaskId: "different-task",
    clientThreadId: "queued-client-thread"
  }), /different content/u);

  const failedDispatch = await actions.prepare(node.id, "continue", "source-task");
  const failed = await actions.markDispatchFailed(failedDispatch.requestId, "host bridge unavailable");
  assert.equal(failed.status, "failed");
  assert.equal(failed.error, "host bridge unavailable");
  await assert.rejects(actions.record(`${failedDispatch.token}tampered`, {
    outcome: "failed",
    sourceTaskId: "source-task",
    error: "bad token"
  }), /signature|invalid/u);

  const expiringActions = new ProjectHistoryHostActionService(history, { pendingAckTimeoutMs: 20 });
  const abandonedDraft = await expiringActions.prepare(node.id, "navigate", "source-task");
  await new Promise((resolve) => setTimeout(resolve, 30));
  assert.equal((await expiringActions.status(abandonedDraft.requestId)).status, "cancelled");
  await assert.rejects(expiringActions.record(abandonedDraft.token, {
    outcome: "succeeded",
    sourceTaskId: "source-task",
    targetTaskId: "original-task"
  }), /no longer waiting/u);

  const rpcNavigation = await actions.prepare(node.id, "navigate", "source-task");
  const serverPath = process.env.CANVASIGHT_HISTORY_HOST_ACTION_SERVER || path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../mcp/server.mjs");
  const mcp = createMcpClient(serverPath);
  try {
    await mcp.request("initialize", {
      protocolVersion: "2024-11-05",
      capabilities: {},
      clientInfo: { name: "project-history-host-action-smoke", version: "1" }
    });
    mcp.notify("notifications/initialized", {});
    const recorded = await mcp.request("tools/call", {
      name: "record_project_history_host_action",
      arguments: {
        projectPath: repository,
        threadId: "source-task",
        token: rpcNavigation.token,
        outcome: "succeeded",
        targetTaskId: "original-task"
      }
    });
    assert.equal(recorded.structuredContent?.status, "recorded");
    assert.equal(recorded.structuredContent?.action?.status, "succeeded");
    assert.equal((await actions.status(rpcNavigation.requestId)).status, "succeeded");

    const rpcContinuation = await actions.prepare(node.id, "continue", "source-task");
    const rpcQueued = await mcp.request("tools/call", {
      name: "record_project_history_host_action",
      arguments: {
        projectPath: repository,
        threadId: "source-task",
        token: rpcContinuation.token,
        outcome: "queued",
        clientThreadId: "rpc-client-thread"
      }
    });
    assert.equal(rpcQueued.structuredContent?.action?.status, "queued");
    const rpcPromoted = await mcp.request("tools/call", {
      name: "record_project_history_host_action",
      arguments: {
        projectPath: repository,
        threadId: "source-task",
        token: rpcContinuation.token,
        outcome: "succeeded",
        clientThreadId: "rpc-client-thread",
        targetTaskId: "rpc-continued-task"
      }
    });
    assert.equal(rpcPromoted.structuredContent?.action?.status, "succeeded");
    assert.equal(rpcPromoted.structuredContent?.action?.targetTaskId, "rpc-continued-task");
  } finally {
    mcp.child.kill();
  }

  const persisted = await new ProjectHistoryHostActionService(history).list();
  assert.equal(persisted.actions.length, 6);
  assert.deepEqual(persisted.actions.map((action) => action.status), ["succeeded", "succeeded", "failed", "pending", "succeeded", "succeeded"]);
  assert.equal(persisted.actions.some((action) => Object.hasOwn(action, "tokenDigest")), false, "public state must not expose token digests");

  process.stdout.write("Project History native host action prepare -> prompt -> signed receipt -> persisted status smoke passed.\n");
} finally {
  fs.rmSync(root, { recursive: true, force: true });
}
