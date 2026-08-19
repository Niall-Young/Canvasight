import { spawn } from "node:child_process";
import {
  ACTIVITY_PROVIDER_CONTRACT_ID,
  PROJECT_HISTORY_CONTRACT_VERSION,
  summarizeCodexThread,
  summarizeCodexTurn
} from "../domain/project-history-contract.mjs";

export class CodexAppServerClient {
  constructor({
    bin = process.env.CANVASIGHT_CODEX_BIN || "codex",
    args = ["app-server", "--listen", "stdio://"],
    timeoutMs = 30_000,
    clientName = "canvasight-project-history-probe",
    clientVersion = "0.1.0"
  } = {}) {
    this.bin = bin;
    this.args = args;
    this.timeoutMs = timeoutMs;
    this.clientName = clientName;
    this.clientVersion = clientVersion;
    this.child = null;
    this.buffer = "";
    this.stderr = "";
    this.nextId = 1;
    this.pending = new Map();
    this.notifications = [];
    this.notificationWaiters = new Set();
    this.initializeResult = null;
  }

  async connect() {
    if (this.child) return this.initializeResult;
    this.child = spawn(this.bin, this.args, { stdio: ["pipe", "pipe", "pipe"] });
    this.child.stdout.setEncoding("utf8");
    this.child.stderr.setEncoding("utf8");
    this.child.stdout.on("data", (chunk) => {
      this.buffer += chunk;
      this.#parseBuffer();
    });
    this.child.stderr.on("data", (chunk) => {
      this.stderr = `${this.stderr}${chunk}`.slice(-8000);
    });
    this.child.on("error", (error) => this.#failAll(error));
    this.child.on("exit", (code, signal) => {
      if (this.pending.size > 0) this.#failAll(new Error(`Codex app-server exited code=${code} signal=${signal}: ${this.stderr}`));
      this.child = null;
    });
    this.initializeResult = await this.request("initialize", {
      clientInfo: { name: this.clientName, version: this.clientVersion },
      capabilities: { experimentalApi: true }
    });
    return this.initializeResult;
  }

  request(method, params = {}) {
    if (!this.child?.stdin?.writable) return Promise.reject(new Error("Codex app-server is not connected"));
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`Codex app-server ${method} timed out after ${this.timeoutMs}ms`));
      }, this.timeoutMs);
      this.pending.set(id, { method, resolve, reject, timer });
      this.child.stdin.write(`${JSON.stringify({ jsonrpc: "2.0", id, method, params })}\n`);
    });
  }

  async close() {
    const child = this.child;
    if (!child) return;
    this.child = null;
    if (child.exitCode !== null || child.signalCode !== null) return;
    const exited = new Promise((resolve) => child.once("exit", resolve));
    child.kill("SIGTERM");
    await Promise.race([exited, new Promise((resolve) => setTimeout(resolve, 2000))]);
  }

  waitForNotification(predicate, timeoutMs = this.timeoutMs) {
    const existing = this.notifications.find(predicate);
    if (existing) return Promise.resolve(existing);
    return new Promise((resolve, reject) => {
      const waiter = {
        predicate,
        resolve: (notification) => {
          clearTimeout(waiter.timer);
          this.notificationWaiters.delete(waiter);
          resolve(notification);
        },
        reject,
        timer: null
      };
      waiter.timer = setTimeout(() => {
        this.notificationWaiters.delete(waiter);
        reject(new Error(`Codex app-server notification timed out after ${timeoutMs}ms`));
      }, timeoutMs);
      this.notificationWaiters.add(waiter);
    });
  }

  #parseBuffer() {
    while (this.buffer.includes("\n")) {
      const newline = this.buffer.indexOf("\n");
      const line = this.buffer.slice(0, newline).trim();
      this.buffer = this.buffer.slice(newline + 1);
      if (!line) continue;
      let message;
      try {
        message = JSON.parse(line);
      } catch (error) {
        this.#failAll(error);
        continue;
      }
      if (!Object.prototype.hasOwnProperty.call(message, "id")) {
        if (typeof message.method === "string") {
          const notification = { method: message.method, params: message.params ?? {} };
          this.notifications.push(notification);
          for (const waiter of [...this.notificationWaiters]) {
            if (waiter.predicate(notification)) waiter.resolve(notification);
          }
        }
        continue;
      }
      const pending = this.pending.get(message.id);
      if (!pending) continue;
      clearTimeout(pending.timer);
      this.pending.delete(message.id);
      if (message.error) pending.reject(new Error(message.error.message || `Codex app-server ${pending.method} failed`));
      else pending.resolve(message.result ?? {});
    }
  }

  #failAll(error) {
    for (const pending of this.pending.values()) {
      clearTimeout(pending.timer);
      pending.reject(error);
    }
    this.pending.clear();
    for (const waiter of this.notificationWaiters) {
      clearTimeout(waiter.timer);
      waiter.reject(error);
    }
    this.notificationWaiters.clear();
  }
}

export function summarizeThreadPage(response) {
  return {
    data: Array.isArray(response?.data) ? response.data.map(summarizeCodexThread) : [],
    nextCursor: typeof response?.nextCursor === "string" ? response.nextCursor : null
  };
}

export function summarizeTurnPage(response) {
  return {
    data: Array.isArray(response?.data) ? response.data.map(summarizeCodexTurn) : [],
    nextCursor: typeof response?.nextCursor === "string" ? response.nextCursor : null
  };
}

export async function listCodexThreads(client, {
  cwd = null,
  archived = false,
  limit = 100,
  useStateDbOnly = false,
  sourceKinds = ["appServer", "vscode", "cli", "unknown"]
} = {}) {
  const threads = [];
  let cursor = null;
  do {
    const response = await client.request("thread/list", {
      archived,
      cwd,
      cursor,
      limit,
      sortKey: "updated_at",
      sortDirection: "desc",
      sourceKinds,
      useStateDbOnly
    });
    const page = summarizeThreadPage(response);
    threads.push(...page.data);
    cursor = page.nextCursor;
  } while (cursor);
  return threads;
}

export async function listCodexTurns(client, threadId, { limit = 100 } = {}) {
  const turns = [];
  let cursor = null;
  do {
    const response = await client.request("thread/turns/list", {
      threadId,
      cursor,
      limit,
      sortDirection: "asc",
      itemsView: "notLoaded"
    });
    const page = summarizeTurnPage(response);
    turns.push(...page.data);
    cursor = page.nextCursor;
  } while (cursor);
  return turns;
}

export function activityProviderDescriptor(initializeResult) {
  return {
    contractId: ACTIVITY_PROVIDER_CONTRACT_ID,
    contractVersion: PROJECT_HISTORY_CONTRACT_VERSION,
    provider: "codex-app-server",
    runtimeVersion: typeof initializeResult?.userAgent === "string" ? initializeResult.userAgent : null,
    capabilities: {
      projectTaskListing: "thread/list",
      pagedTurnListing: "thread/turns/list",
      taskRead: "thread/read",
      taskCreation: "thread/start",
      taskFork: "thread/fork",
      turnStarted: "turn/started",
      turnCompleted: "turn/completed"
    }
  };
}
