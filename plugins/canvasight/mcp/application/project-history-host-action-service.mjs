import { createHash, createHmac, randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import fsp from "node:fs/promises";
import path from "node:path";

const ACTION_TTL_MS = 10 * 60 * 1000;
const DEFAULT_PENDING_ACK_TIMEOUT_MS = 30 * 1000;
const MAX_ACTIONS = 100;
const HOST_ACTIONS = new Set(["navigate", "continue"]);
const HOST_ACTION_OUTCOMES = new Set(["succeeded", "queued", "failed"]);

function compactText(value, maximum) {
  const normalized = typeof value === "string" ? value.trim().replace(/\s+/gu, " ") : "";
  if (!normalized) return "";
  return normalized.slice(0, maximum);
}

function requiredText(value, label, maximum) {
  const normalized = compactText(value, maximum);
  if (!normalized) throw new Error(`${label} is required`);
  return normalized;
}

function base64url(value) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function tokenDigest(value) {
  return createHash("sha256").update(value).digest("hex");
}

function emptyState() {
  return { schemaVersion: 1, revision: 0, actions: [] };
}

function normalizedAction(value) {
  if (!value || typeof value !== "object") return null;
  const requestId = compactText(value.requestId, 160);
  const nodeId = compactText(value.nodeId, 240);
  const action = compactText(value.action, 20);
  const sourceTaskId = compactText(value.sourceTaskId, 160);
  if (!requestId || !nodeId || !HOST_ACTIONS.has(action) || !sourceTaskId) return null;
  const status = new Set(["pending", "succeeded", "queued", "failed"]).has(value.status) ? value.status : "failed";
  return {
    requestId,
    nodeId,
    action,
    status,
    sourceTaskId,
    expectedTargetTaskId: compactText(value.expectedTargetTaskId, 160) || null,
    targetTaskId: compactText(value.targetTaskId, 160) || null,
    clientThreadId: compactText(value.clientThreadId, 160) || null,
    summary: compactText(value.summary, 160),
    tokenDigest: compactText(value.tokenDigest, 64),
    issuedAt: compactText(value.issuedAt, 40),
    expiresAt: compactText(value.expiresAt, 40),
    updatedAt: compactText(value.updatedAt, 40),
    error: compactText(value.error, 500) || null
  };
}

function normalizeState(value) {
  const actions = Array.isArray(value?.actions) ? value.actions.map(normalizedAction).filter(Boolean).slice(-MAX_ACTIONS) : [];
  return {
    schemaVersion: 1,
    revision: Number.isInteger(value?.revision) && value.revision >= 0 ? value.revision : 0,
    actions
  };
}

function pendingAcknowledgementExpired(action, now, timeoutMs) {
  const issuedAt = Date.parse(action.issuedAt);
  return action.status === "pending" && Number.isFinite(issuedAt) && now - issuedAt >= timeoutMs;
}

function publicAction(action, now = Date.now(), pendingAckTimeoutMs = DEFAULT_PENDING_ACK_TIMEOUT_MS) {
  const acknowledgementExpired = pendingAcknowledgementExpired(action, now, pendingAckTimeoutMs);
  const tokenExpired = action.status === "pending" && Number.isFinite(Date.parse(action.expiresAt)) && now > Date.parse(action.expiresAt);
  return {
    requestId: action.requestId,
    nodeId: action.nodeId,
    action: action.action,
    status: acknowledgementExpired ? "cancelled" : tokenExpired ? "failed" : action.status,
    sourceTaskId: action.sourceTaskId,
    expectedTargetTaskId: action.expectedTargetTaskId,
    targetTaskId: action.targetTaskId,
    clientThreadId: action.clientThreadId,
    summary: action.summary,
    issuedAt: action.issuedAt,
    expiresAt: action.expiresAt,
    updatedAt: action.updatedAt,
    error: tokenExpired ? "The Codex host action did not return a receipt before it expired." : action.error
  };
}

export class ProjectHistoryHostActionService {
  constructor(historyService, { pendingAckTimeoutMs = DEFAULT_PENDING_ACK_TIMEOUT_MS } = {}) {
    this.history = historyService;
    this.pendingAckTimeoutMs = pendingAckTimeoutMs;
    this.filePath = path.join(historyService.store.storageDirectory, "host-actions.json");
    this.secretPath = path.join(historyService.store.storageDirectory, "host-action-token.key");
    this.lockPath = path.join(historyService.store.storageDirectory, ".host-action-lock");
  }

  #public(action) {
    return publicAction(action, Date.now(), this.pendingAckTimeoutMs);
  }

  async #secret() {
    try {
      return await fsp.readFile(this.secretPath);
    } catch (error) {
      if (error?.code !== "ENOENT") throw error;
      const secret = randomBytes(32);
      await fsp.mkdir(path.dirname(this.secretPath), { recursive: true });
      try {
        await fsp.writeFile(this.secretPath, secret, { mode: 0o600, flag: "wx" });
        return secret;
      } catch (writeError) {
        if (writeError?.code !== "EEXIST") throw writeError;
        return fsp.readFile(this.secretPath);
      }
    }
  }

  async #sign(payload) {
    const encoded = base64url(JSON.stringify(payload));
    const signature = createHmac("sha256", await this.#secret()).update(encoded).digest("base64url");
    return `${encoded}.${signature}`;
  }

  async #verify(token) {
    if (typeof token !== "string" || !token.includes(".")) throw new Error("Project History host action token is invalid");
    const [encoded, signature] = token.split(".");
    const expected = createHmac("sha256", await this.#secret()).update(encoded).digest("base64url");
    const suppliedBytes = Buffer.from(signature, "utf8");
    const expectedBytes = Buffer.from(expected, "utf8");
    if (suppliedBytes.length !== expectedBytes.length || !timingSafeEqual(suppliedBytes, expectedBytes)) {
      throw new Error("Project History host action token signature is invalid");
    }
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
    if (payload.type !== "host-action" || payload.projectId !== this.history.identity.localProjectId || !HOST_ACTIONS.has(payload.action)) {
      throw new Error("Project History host action token scope is invalid");
    }
    if (!Number.isFinite(payload.expiresAt) || Date.now() > payload.expiresAt) throw new Error("Project History host action token has expired");
    return payload;
  }

  async #read() {
    try {
      return normalizeState(JSON.parse(await fsp.readFile(this.filePath, "utf8")));
    } catch (error) {
      if (error?.code === "ENOENT" || error instanceof SyntaxError) return emptyState();
      throw error;
    }
  }

  async #withWrite(mutator) {
    await fsp.mkdir(path.dirname(this.filePath), { recursive: true });
    let locked = false;
    for (let attempt = 0; attempt < 40 && !locked; attempt += 1) {
      try {
        await fsp.mkdir(this.lockPath);
        locked = true;
      } catch (error) {
        if (error?.code !== "EEXIST") throw error;
        try {
          const lock = await fsp.stat(this.lockPath);
          if (Date.now() - lock.mtimeMs > 10_000) await fsp.rmdir(this.lockPath);
        } catch (lockError) {
          if (lockError?.code !== "ENOENT" && lockError?.code !== "ENOTEMPTY") throw lockError;
        }
        await new Promise((resolve) => setTimeout(resolve, 25));
      }
    }
    if (!locked) throw new Error("Project History host action store is busy");
    try {
      const current = await this.#read();
      const result = await mutator(current);
      const next = normalizeState({ ...current, revision: current.revision + 1, actions: result.actions });
      const temporaryPath = `${this.filePath}.${process.pid}.${randomUUID()}.tmp`;
      await fsp.writeFile(temporaryPath, `${JSON.stringify(next, null, 2)}\n`, { encoding: "utf8", mode: 0o600 });
      await fsp.rename(temporaryPath, this.filePath);
      return { value: result.value, state: next };
    } finally {
      await fsp.rmdir(this.lockPath).catch(() => {});
    }
  }

  async prepare(nodeId, action, sourceTaskId) {
    const normalizedActionName = requiredText(action, "Project History host action", 20);
    if (!HOST_ACTIONS.has(normalizedActionName)) throw new Error("Project History host action must be navigate or continue");
    const normalizedSourceTaskId = requiredText(sourceTaskId, "Project History source task id", 160);
    const index = await this.history.readIndex();
    const node = index.nodes.find((candidate) => candidate.id === nodeId);
    if (!node) throw new Error("Project History host action node was not found");
    if (normalizedActionName === "navigate" && !node.taskId) throw new Error("This history node has no original Codex task");
    if (normalizedActionName === "continue" && (!node.snapshotRef || !node.commit || node.status === "content-unavailable")) {
      throw new Error("This history node cannot create an isolated continuation task");
    }
    const issuedAt = Date.now();
    const payload = {
      type: "host-action",
      projectId: this.history.identity.localProjectId,
      requestId: randomUUID(),
      action: normalizedActionName,
      nodeId: node.id,
      nodeCommit: node.commit,
      sourceTaskId: normalizedSourceTaskId,
      expectedTargetTaskId: normalizedActionName === "navigate" ? node.taskId : null,
      issuedAt,
      expiresAt: issuedAt + ACTION_TTL_MS
    };
    const token = await this.#sign(payload);
    const stored = {
      requestId: payload.requestId,
      nodeId: node.id,
      action: normalizedActionName,
      status: "pending",
      sourceTaskId: normalizedSourceTaskId,
      expectedTargetTaskId: payload.expectedTargetTaskId,
      targetTaskId: null,
      clientThreadId: null,
      summary: node.summary,
      tokenDigest: tokenDigest(token),
      issuedAt: new Date(payload.issuedAt).toISOString(),
      expiresAt: new Date(payload.expiresAt).toISOString(),
      updatedAt: new Date(payload.issuedAt).toISOString(),
      error: null
    };
    await this.#withWrite((current) => ({ actions: current.actions.concat(stored).slice(-MAX_ACTIONS), value: stored }));
    return {
      ...this.#public(stored),
      token,
      projectPath: this.history.projectPath,
      snapshotRef: node.snapshotRef,
      commit: node.commit,
      coverageComplete: node.coverage?.complete === true,
      prompt: this.#prompt({ node, payload, token })
    };
  }

  #prompt({ node, payload, token }) {
    const receipt = `Then call record_project_history_host_action with projectPath ${JSON.stringify(this.history.projectPath)}, threadId ${JSON.stringify(payload.sourceTaskId)}, token ${JSON.stringify(token)}, and the real outcome. Record succeeded only after the native host tool returns success; record queued when task creation returns only clientThreadId; record failed with the bounded error if any native call fails. If task creation was queued, call codex_app__list_threads once. Promote the same receipt from queued to succeeded only after one real task is unambiguously identified by its new-task time, exact title, Worktree repository path, source task, node id, and snapshot commit; pass both the original clientThreadId and the real targetTaskId. Otherwise leave it queued.`;
    if (payload.action === "navigate") {
      return `Use $canvasight to handle this exact widget-issued action. The user explicitly clicked Canvasight Project History action ${JSON.stringify(payload.requestId)}. Call codex_app__navigate_to_codex_page with threadId ${JSON.stringify(node.taskId)}. Do not summarize or copy the chat. ${receipt}`;
    }
    const recoveryWarning = node.coverage?.complete === true
      ? "The protected snapshot reports complete recovery coverage."
      : "Recovery coverage is incomplete; the new task must warn that excluded, generated, sensitive, or external files may be missing.";
    return `Use $canvasight to handle this exact widget-issued action. The user explicitly clicked Canvasight Project History action ${JSON.stringify(payload.requestId)} to continue from node ${JSON.stringify(node.id)}. First call codex_app__list_projects and select the project whose path exactly equals ${JSON.stringify(this.history.projectPath)}. Then call codex_app__create_thread for that project using a worktree environment with startingState { type: \"branch\", branchName: ${JSON.stringify(node.snapshotRef)} }, title ${JSON.stringify(node.summary)}, and an initial prompt that says this task continues from Canvasight history node ${JSON.stringify(node.id)} at snapshot commit ${JSON.stringify(node.commit)}. ${recoveryWarning} Do not modify the current checkout, merge, or push. ${receipt}`;
  }

  async markDispatchFailed(requestId, errorMessage) {
    const normalizedRequestId = requiredText(requestId, "Project History host action request id", 160);
    const message = requiredText(errorMessage, "Project History host action dispatch error", 500);
    const result = await this.#withWrite((current) => {
      const index = current.actions.findIndex((action) => action.requestId === normalizedRequestId);
      if (index < 0) throw new Error("Project History host action request was not found");
      const existing = current.actions[index];
      if (existing.status !== "pending") return { actions: current.actions, value: existing };
      const next = { ...existing, status: "failed", error: message, updatedAt: new Date().toISOString() };
      const actions = [...current.actions];
      actions[index] = next;
      return { actions, value: next };
    });
    return this.#public(result.value);
  }

  async record(token, { outcome, sourceTaskId, targetTaskId = null, clientThreadId = null, error = null }) {
    const payload = await this.#verify(token);
    const normalizedOutcome = requiredText(outcome, "Project History host action outcome", 20);
    if (!HOST_ACTION_OUTCOMES.has(normalizedOutcome)) throw new Error("Project History host action outcome must be succeeded, queued, or failed");
    const normalizedSourceTaskId = requiredText(sourceTaskId, "Project History source task id", 160);
    if (normalizedSourceTaskId !== payload.sourceTaskId) throw new Error("Project History host action receipt came from the wrong source task");
    const normalizedTargetTaskId = compactText(targetTaskId, 160) || null;
    const normalizedClientThreadId = compactText(clientThreadId, 160) || null;
    const normalizedError = compactText(error, 500) || null;
    if (normalizedOutcome === "failed" && !normalizedError) throw new Error("A failed Project History host action receipt requires an error");
    if (payload.action === "navigate" && normalizedOutcome === "succeeded" && normalizedTargetTaskId !== payload.expectedTargetTaskId) {
      throw new Error("Project History navigation receipt does not match the requested target task");
    }
    if (payload.action === "continue" && normalizedOutcome === "succeeded" && !normalizedTargetTaskId) {
      throw new Error("A successful Project History continuation receipt requires the new task id");
    }
    if (payload.action === "continue" && normalizedOutcome === "queued" && !normalizedClientThreadId) {
      throw new Error("A queued Project History continuation receipt requires clientThreadId");
    }
    const result = await this.#withWrite((current) => {
      const index = current.actions.findIndex((action) => action.requestId === payload.requestId);
      if (index < 0) throw new Error("Project History host action request was not found");
      const existing = current.actions[index];
      if (existing.tokenDigest !== tokenDigest(token)) throw new Error("Project History host action token does not match the request");
      if (pendingAcknowledgementExpired(existing, Date.now(), this.pendingAckTimeoutMs)) {
        throw new Error("Project History host action is no longer waiting for a receipt");
      }
      const desired = {
        ...existing,
        status: normalizedOutcome,
        targetTaskId: normalizedTargetTaskId,
        clientThreadId: normalizedClientThreadId,
        error: normalizedError,
        updatedAt: new Date().toISOString()
      };
      if (existing.status !== "pending") {
        const same = existing.status === desired.status
          && existing.targetTaskId === desired.targetTaskId
          && existing.clientThreadId === desired.clientThreadId
          && existing.error === desired.error;
        if (same) return { actions: current.actions, value: existing };
        const isQueuedContinuationPromotion = payload.action === "continue"
          && existing.status === "queued"
          && desired.status === "succeeded"
          && existing.clientThreadId
          && desired.clientThreadId === existing.clientThreadId
          && desired.targetTaskId
          && !desired.error;
        if (!isQueuedContinuationPromotion) {
          throw new Error("Project History host action receipt was replayed with different content");
        }
        const actions = [...current.actions];
        actions[index] = desired;
        return { actions, value: desired };
      }
      const actions = [...current.actions];
      actions[index] = desired;
      return { actions, value: desired };
    });
    return this.#public(result.value);
  }

  async status(requestId) {
    const normalizedRequestId = requiredText(requestId, "Project History host action request id", 160);
    const state = await this.#read();
    const action = state.actions.find((candidate) => candidate.requestId === normalizedRequestId);
    if (!action) throw new Error("Project History host action request was not found");
    return this.#public(action);
  }

  async list() {
    const state = await this.#read();
    return { revision: state.revision, actions: state.actions.map((action) => this.#public(action)) };
  }
}
