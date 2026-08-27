import { createHash } from "node:crypto";

export const PROJECT_HISTORY_CONTRACT_VERSION = 1;
export const PROJECT_IDENTITY_CONTRACT_ID = "canvasight.project-identity.v1";
export const ACTIVITY_PROVIDER_CONTRACT_ID = "canvasight.activity-provider.v1";

const TERMINAL_TURN_STATUSES = new Set(["completed", "interrupted", "failed"]);

function stableHash(parts) {
  const hash = createHash("sha256");
  for (const part of parts) {
    const value = String(part);
    hash.update(String(Buffer.byteLength(value, "utf8")));
    hash.update(":");
    hash.update(value);
    hash.update(";");
  }
  return hash.digest("hex");
}

function normalizedRepositoryPath(value) {
  return String(value || "")
    .trim()
    .replace(/^\/+|\/+$/g, "")
    .replace(/\.git$/i, "");
}

export function normalizeGitRemoteIdentity(value) {
  const remote = String(value || "").trim();
  if (!remote) return null;

  const scpMatch = remote.match(/^(?:[^@/\s]+@)?([^:/\s]+):(.+)$/u);
  if (scpMatch && !/^[a-z][a-z0-9+.-]*:\/\//iu.test(remote)) {
    const repositoryPath = normalizedRepositoryPath(scpMatch[2]);
    return repositoryPath ? `${scpMatch[1].toLowerCase()}/${repositoryPath}` : null;
  }

  try {
    const url = new URL(remote);
    if (!url.hostname) return null;
    const repositoryPath = normalizedRepositoryPath(decodeURIComponent(url.pathname));
    if (!repositoryPath) return null;
    const port = url.port && !((url.protocol === "https:" && url.port === "443") || (url.protocol === "ssh:" && url.port === "22"))
      ? `:${url.port}`
      : "";
    return `${url.hostname.toLowerCase()}${port}/${repositoryPath}`;
  } catch {
    return null;
  }
}

export function buildGitProjectIdentity({ gitCommonDir, worktreeRoot, rootCommits, remoteUrls, isShallow = false }) {
  const commonDir = String(gitCommonDir || "").trim();
  const root = String(worktreeRoot || "").trim();
  if (!commonDir || !root) throw new TypeError("gitCommonDir and worktreeRoot are required");

  const roots = Array.from(new Set((rootCommits || []).map((value) => String(value).trim()).filter(Boolean))).sort();
  const remotes = Array.from(new Set((remoteUrls || []).map(normalizeGitRemoteIdentity).filter(Boolean))).sort();
  const portableEvidence = remotes.length > 0
    ? ["remotes", ...remotes]
    : isShallow || roots.length === 0
      ? null
      : ["roots", ...roots];
  const warnings = [];
  if (remotes.length === 0 && roots.length === 0) {
    warnings.push("portable identity is unavailable because this repository has no credential-free remote identity or root commit");
  } else if (remotes.length === 0 && isShallow) {
    warnings.push("portable identity is unavailable because this shallow repository has no credential-free remote identity");
  } else if (remotes.length === 0) {
    warnings.push("portable identity is based on root commits because no credential-free remote identity is available");
  }
  return {
    contractId: PROJECT_IDENTITY_CONTRACT_ID,
    contractVersion: PROJECT_HISTORY_CONTRACT_VERSION,
    source: "git",
    localProjectId: `git-local-${stableHash([commonDir])}`,
    portableProjectId: portableEvidence ? `git-portable-${stableHash(portableEvidence)}` : null,
    worktreeRoot: root,
    gitCommonDir: commonDir,
    rootCommits: roots,
    remoteIdentities: remotes,
    isShallow: isShallow === true,
    portabilityBasis: remotes.length > 0 ? "remote" : isShallow || roots.length === 0 ? "unavailable" : "root-only",
    warnings
  };
}

export function compareGitProjectIdentities(left, right) {
  return {
    sameLocalProject: left?.localProjectId === right?.localProjectId,
    samePortableProject: Boolean(left?.portableProjectId) && left.portableProjectId === right?.portableProjectId
  };
}

export function summarizeCodexThread(thread) {
  if (!thread || typeof thread.id !== "string" || !thread.id.trim()) throw new TypeError("Codex thread id is required");
  if (typeof thread.cwd !== "string" || !thread.cwd.trim()) throw new TypeError("Codex thread cwd is required");
  return {
    id: thread.id.trim(),
    cwd: thread.cwd,
    name: typeof thread.name === "string" && thread.name.trim() ? thread.name.trim() : null,
    createdAt: Number.isFinite(thread.createdAt) ? thread.createdAt : null,
    updatedAt: Number.isFinite(thread.updatedAt) ? thread.updatedAt : null,
    recencyAt: Number.isFinite(thread.recencyAt) ? thread.recencyAt : null,
    status: typeof thread.status?.type === "string" ? thread.status.type : "unknown",
    source: thread.source ?? null,
    ephemeral: thread.ephemeral === true,
    forkedFromId: typeof thread.forkedFromId === "string" && thread.forkedFromId ? thread.forkedFromId : null
  };
}

export function summarizeCodexTurn(turn) {
  if (!turn || typeof turn.id !== "string" || !turn.id.trim()) throw new TypeError("Codex turn id is required");
  const status = typeof turn.status === "string" ? turn.status : "unknown";
  return {
    id: turn.id.trim(),
    status,
    terminal: TERMINAL_TURN_STATUSES.has(status),
    startedAt: Number.isFinite(turn.startedAt) ? turn.startedAt : null,
    completedAt: Number.isFinite(turn.completedAt) ? turn.completedAt : null,
    durationMs: Number.isFinite(turn.durationMs) ? turn.durationMs : null,
    failed: status === "failed",
    interrupted: status === "interrupted"
  };
}

export function codexTurnBoundaryFromNotification(method, params) {
  if (method !== "turn/started" && method !== "turn/completed") return null;
  const threadId = typeof params?.threadId === "string" ? params.threadId.trim() : "";
  if (!threadId) throw new TypeError("turn notification threadId is required");
  const turn = summarizeCodexTurn(params?.turn);
  if (method === "turn/started") return { threadId, phase: "started", ...turn };
  if (!turn.terminal) throw new TypeError(`turn/completed carried non-terminal status ${turn.status}`);
  return { threadId, phase: "completed", ...turn };
}

export function codexTurnObservationIds(threadId, turn) {
  const resolvedThreadId = String(threadId || "").trim();
  if (!resolvedThreadId) throw new TypeError("Codex thread id is required");
  const summary = summarizeCodexTurn(turn);
  const ids = [`codex:${resolvedThreadId}:${summary.id}:started`];
  if (summary.terminal) ids.push(`codex:${resolvedThreadId}:${summary.id}:terminal:${summary.status}`);
  return ids;
}
