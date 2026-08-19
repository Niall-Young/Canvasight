import { createHmac, randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import fsp from "node:fs/promises";
import path from "node:path";

const TOKEN_TTL_MS = 30 * 60 * 1000;

function base64url(value) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function boundedText(value, label, maximum) {
  const normalized = typeof value === "string" ? value.trim().replace(/\s+/gu, " ") : "";
  if (!normalized) throw new Error(`${label} is required`);
  if (normalized.length > maximum) throw new Error(`${label} must be ${maximum} characters or fewer`);
  return normalized;
}

export class ProjectHistoryAgentCheckService {
  constructor(historyService) {
    this.history = historyService;
    this.secretPath = path.join(historyService.store.storageDirectory, "agent-check-token.key");
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
    if (typeof token !== "string" || !token.includes(".")) throw new Error("Project History Agent check token is invalid");
    const [encoded, signature] = token.split(".");
    const expected = createHmac("sha256", await this.#secret()).update(encoded).digest("base64url");
    const suppliedBytes = Buffer.from(signature, "utf8");
    const expectedBytes = Buffer.from(expected, "utf8");
    if (suppliedBytes.length !== expectedBytes.length || !timingSafeEqual(suppliedBytes, expectedBytes)) {
      throw new Error("Project History Agent check token signature is invalid");
    }
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
    if (payload.type !== "agent-check" || payload.projectId !== this.history.identity.localProjectId) {
      throw new Error("Project History Agent check token scope is invalid");
    }
    if (!Number.isFinite(payload.expiresAt) || Date.now() > payload.expiresAt) throw new Error("Project History Agent check token has expired");
    return payload;
  }

  async prepare(nodeId) {
    const index = await this.history.readIndex();
    const node = index.nodes.find((candidate) => candidate.id === nodeId);
    if (!node || node.kind === "baseline") throw new Error("a snapshot history node is required for Agent checking");
    if (node.merged) throw new Error("merged history nodes cannot start a new Agent check");
    const issuedAt = Date.now();
    const payload = {
      type: "agent-check",
      projectId: this.history.identity.localProjectId,
      requestId: randomUUID(),
      nodeId,
      snapshotCommit: node.commit,
      issuedAt,
      expiresAt: issuedAt + TOKEN_TTL_MS
    };
    return {
      requestId: payload.requestId,
      nodeId,
      summary: node.summary,
      changedPaths: node.changedPaths,
      snapshotRef: node.snapshotRef,
      commit: node.commit,
      token: await this.#sign(payload),
      expiresAt: new Date(payload.expiresAt).toISOString()
    };
  }

  async markRequested(token) {
    const payload = await this.#verify(token);
    const index = await this.history.readIndex();
    const node = index.nodes.find((candidate) => candidate.id === payload.nodeId);
    if (!node || node.commit !== payload.snapshotCommit) throw new Error("history node changed before the Agent check was dispatched");
    return this.history.recordAgentCheckRequested(node.id, {
      requestId: payload.requestId,
      expiresAt: new Date(payload.expiresAt).toISOString()
    });
  }

  async record(token, { outcome, summary, evidence = [], taskId }) {
    const payload = await this.#verify(token);
    if (outcome !== "passed" && outcome !== "failed") throw new Error("Agent check outcome must be passed or failed");
    if (!Array.isArray(evidence) || evidence.length > 20) throw new Error("Agent check evidence must contain at most 20 items");
    const normalizedEvidence = evidence.map((item, index) => boundedText(item, `evidence[${index}]`, 280));
    const index = await this.history.readIndex();
    const node = index.nodes.find((candidate) => candidate.id === payload.nodeId);
    if (!node || node.commit !== payload.snapshotCommit) throw new Error("history node changed before the Agent check result was recorded");
    const recorded = await this.history.recordAgentCheckResult(node.id, {
      requestId: payload.requestId,
      outcome,
      summary: boundedText(summary, "Agent check summary", 500),
      evidence: normalizedEvidence,
      taskId: boundedText(taskId, "Agent check taskId", 160)
    });
    return { ...recorded, nodeId: node.id, requestId: payload.requestId };
  }
}
