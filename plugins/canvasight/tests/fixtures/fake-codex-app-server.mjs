#!/usr/bin/env node
import readline from "node:readline";
import fs from "node:fs";

const threads = [
  { id: "thread-existing", cwd: process.env.CANVASIGHT_FAKE_THREAD_CWD || "/repo", name: "Existing", createdAt: 1, updatedAt: 2, recencyAt: 2, status: { type: "idle" }, source: "appServer", ephemeral: false, turns: [] }
];

function listedTurns() {
  if (process.env.CANVASIGHT_FAKE_TURNS_PATH) {
    try {
      return JSON.parse(fs.readFileSync(process.env.CANVASIGHT_FAKE_TURNS_PATH, "utf8"));
    } catch {
      return [];
    }
  }
  return [
    { id: "turn-complete", status: "completed", startedAt: 10, completedAt: 11, durationMs: 1000, items: [] },
    { id: "turn-interrupted", status: "interrupted", startedAt: 12, completedAt: 13, durationMs: 1000, items: [] }
  ];
}

function result(id, value) {
  process.stdout.write(`${JSON.stringify({ jsonrpc: "2.0", id, result: value })}\n`);
}

const input = readline.createInterface({ input: process.stdin });
input.on("line", (line) => {
  const message = JSON.parse(line);
  const { id, method, params = {} } = message;
  if (method === "initialize") return result(id, { userAgent: "codex-cli-test/0.143.0", codexHome: "/tmp/codex", platformFamily: "unix", platformOs: "macos" });
  if (method === "thread/list") {
    const data = params.cwd ? threads.filter((thread) => Array.isArray(params.cwd) ? params.cwd.includes(thread.cwd) : thread.cwd === params.cwd) : threads;
    return result(id, { data, nextCursor: null });
  }
  if (method === "thread/read") {
    const thread = threads.find((candidate) => candidate.id === params.threadId) || null;
    if (!thread) {
      process.stdout.write(`${JSON.stringify({ jsonrpc: "2.0", id, error: { code: -32001, message: "thread not found" } })}\n`);
      return;
    }
    return result(id, { thread: { ...thread, ...(params.includeTurns ? { turns: listedTurns() } : {}) } });
  }
  if (method === "thread/turns/list") {
    return result(id, { data: listedTurns(), nextCursor: null });
  }
  if (method === "thread/start") {
    const thread = { id: `thread-${threads.length + 1}`, cwd: params.cwd, name: null, createdAt: 3, updatedAt: 3, status: { type: "idle" }, source: "appServer", ephemeral: params.ephemeral === true, turns: [] };
    threads.push(thread);
    process.stdout.write(`${JSON.stringify({ jsonrpc: "2.0", method: "thread/started", params: { thread } })}\n`);
    return result(id, { thread, cwd: thread.cwd, model: "test", modelProvider: "test", approvalPolicy: "never", approvalsReviewer: "autoReview", sandbox: { type: "readOnly" } });
  }
  process.stdout.write(`${JSON.stringify({ jsonrpc: "2.0", id, error: { code: -32601, message: `unsupported ${method}` } })}\n`);
});
