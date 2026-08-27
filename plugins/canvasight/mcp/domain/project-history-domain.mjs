export const PROJECT_HISTORY_EVENT_VERSION = 1;

const EVENT_TYPES = new Set([
  "protection.enabled",
  "snapshot.recorded",
  "snapshot.failed",
  "chat.recorded",
  "feature.created",
  "feature.reclassified",
  "feature.renamed",
  "feature.abandoned",
  "feature.reactivated",
  "node.summary-edited",
  "node.agent-check-requested",
  "node.agent-check-recorded",
  "node.confirmed",
  "merge.recorded",
  "coverage.gap-recorded"
]);

export function validateProjectHistoryEvent(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("history event must be an object");
  const event = structuredClone(input);
  if (event.version !== PROJECT_HISTORY_EVENT_VERSION) throw new Error(`unsupported history event version: ${event.version}`);
  if (typeof event.id !== "string" || !event.id) throw new Error("history event id is required");
  if (!EVENT_TYPES.has(event.type)) throw new Error(`unsupported history event type: ${event.type}`);
  if (typeof event.projectId !== "string" || !event.projectId) throw new Error("history event projectId is required");
  if (typeof event.occurredAt !== "string" || !Number.isFinite(Date.parse(event.occurredAt))) throw new Error("history event occurredAt is invalid");
  if (!event.payload || typeof event.payload !== "object" || Array.isArray(event.payload)) throw new Error("history event payload is required");
  return event;
}

function exclusionMatchesCoveragePath(pattern, filePath) {
  const normalizedPattern = String(pattern || "").replace(/^\.\//u, "").replace(/\/+$/u, "");
  const normalizedPath = String(filePath || "").replace(/^\.\//u, "").replace(/\/+$/u, "");
  if (!normalizedPattern || !normalizedPath) return false;
  if (String(pattern).endsWith("/")) {
    if (normalizedPath === normalizedPattern || normalizedPath.startsWith(`${normalizedPattern}/`) || normalizedPattern.startsWith(`${normalizedPath}/`)) return true;
    const pathParts = normalizedPath.split("/");
    const patternParts = normalizedPattern.split("/");
    return pathParts.some((_, start) => patternParts.every((part, offset) => pathParts[start + offset] === part));
  }
  const escaped = normalizedPattern.replace(/[.+^${}()|[\]\\]/gu, "\\$&").replaceAll("*", ".*").replaceAll("?", ".");
  const matcher = new RegExp(`^${escaped}$`, "u");
  const baseName = normalizedPath.split("/").at(-1) ?? normalizedPath;
  return normalizedPattern.includes("/") ? matcher.test(normalizedPath) : matcher.test(baseName);
}

function normalizedCoverage(input) {
  const coverage = input && typeof input === "object" && !Array.isArray(input)
    ? structuredClone(input)
    : { complete: false, gapCodes: ["coverage-unavailable"] };
  let gapCodes = Array.isArray(coverage.gapCodes) ? coverage.gapCodes.filter((code) => typeof code === "string" && code) : [];
  if (Array.isArray(coverage.policyExcludedPaths) && Array.isArray(coverage.excludedPathspecs)) {
    const auditedPaths = coverage.policyExcludedPaths.filter((filePath) => coverage.excludedPathspecs.some((pattern) => exclusionMatchesCoveragePath(pattern, filePath)));
    if (auditedPaths.length !== coverage.policyExcludedPaths.length) coverage.coverageAuditCorrected = true;
    coverage.policyExcludedPaths = auditedPaths;
    if (auditedPaths.length === 0) {
      gapCodes = gapCodes.filter((code) => code !== "policy-exclusions");
      coverage.gapCodes = gapCodes;
      coverage.complete = gapCodes.length === 0;
    }
  }
  const hasAuditedPolicyPaths = Array.isArray(coverage.policyExcludedPaths);
  if (!hasAuditedPolicyPaths && gapCodes.includes("policy-exclusions")) {
    coverage.gapCodes = gapCodes.filter((code) => code !== "policy-exclusions");
    coverage.legacyPolicyUnverified = true;
    coverage.complete = coverage.gapCodes.length === 0;
  }
  return coverage;
}

function nodeFromSnapshot(event) {
  const payload = event.payload;
  return {
    id: payload.nodeId,
    kind: payload.baseline ? "baseline" : "snapshot",
    summary: payload.summary,
    status: "protected",
    source: payload.source,
    featureLineId: payload.featureLineId ?? null,
    taskId: payload.taskId ?? null,
    turnId: payload.turnId ?? null,
    workflowNodeId: payload.workflowNodeId ?? null,
    workflowTitle: payload.workflowTitle ?? null,
    snapshotRef: payload.snapshotRef,
    commit: payload.commit,
    tree: payload.tree,
    gitBranch: payload.gitBranch ?? null,
    headCommit: payload.headCommit ?? null,
    changedPaths: payload.changedPaths ?? [],
    coverage: normalizedCoverage(payload.coverage),
    occurredAt: event.occurredAt,
    confirmed: false,
    merged: false,
    edits: []
  };
}

export function buildProjectHistoryIndex(eventsInput) {
  const events = eventsInput.map(validateProjectHistoryEvent);
  const nodes = new Map();
  const features = new Map();
  const chats = [];
  const failures = new Map();
  const coverageGaps = [];
  let protectionEnabled = false;

  for (const event of events) {
    const payload = event.payload;
    if (event.type === "protection.enabled") protectionEnabled = true;
    if (event.type === "snapshot.recorded") {
      if (typeof payload.nodeId !== "string" || !payload.nodeId) throw new Error("snapshot nodeId is required");
      if (!nodes.has(payload.nodeId)) nodes.set(payload.nodeId, nodeFromSnapshot(event));
      if (payload.observationId) failures.delete(payload.observationId);
    }
    if (event.type === "snapshot.failed") failures.set(payload.observationId, {
      observationId: payload.observationId,
      reason: payload.reason,
      retryable: payload.retryable !== false,
      occurredAt: event.occurredAt
    });
    if (event.type === "chat.recorded") {
      chats.push({ ...structuredClone(payload), occurredAt: event.occurredAt });
      // A chat record is the terminal outcome for an observation that produced
      // no net project change. If an earlier concurrent snapshot attempt for
      // the same observation failed, the later chat record proves that no
      // checkpoint was required and closes that stale failure honestly.
      if (payload.observationId) failures.delete(payload.observationId);
    }
    if (event.type === "feature.created") features.set(payload.featureLineId, {
      id: payload.featureLineId,
      name: payload.name,
      status: "active",
      originalClassification: payload.originalClassification ?? null,
      classificationEdits: []
    });
    if (event.type === "feature.reclassified") {
      const feature = features.get(payload.featureLineId);
      if (feature) feature.classificationEdits.push({ from: payload.from, to: payload.to, occurredAt: event.occurredAt });
      const node = nodes.get(payload.nodeId);
      if (node) node.featureLineId = payload.to;
    }
    if (event.type === "feature.renamed") {
      const feature = features.get(payload.featureLineId);
      if (feature) feature.name = payload.name;
    }
    if (event.type === "feature.abandoned" || event.type === "feature.reactivated") {
      const feature = features.get(payload.featureLineId);
      if (feature) feature.status = event.type === "feature.abandoned" ? "abandoned" : "active";
    }
    if (event.type === "node.summary-edited") {
      const node = nodes.get(payload.nodeId);
      if (node) {
        node.edits.push({ previous: node.summary, next: payload.summary, occurredAt: event.occurredAt });
        node.summary = payload.summary;
      }
    }
    if (event.type === "node.agent-check-requested") {
      const node = nodes.get(payload.nodeId);
      const sameRequestAlreadyFinished = node?.agentCheck?.requestId === payload.requestId
        && (node.agentCheck.status === "passed" || node.agentCheck.status === "failed");
      if (node && !sameRequestAlreadyFinished) {
        node.agentCheck = {
          status: "requested",
          requestId: payload.requestId,
          expiresAt: payload.expiresAt,
          occurredAt: event.occurredAt
        };
      }
    }
    if (event.type === "node.agent-check-recorded") {
      const node = nodes.get(payload.nodeId);
      if (node) node.agentCheck = {
        status: payload.outcome,
        requestId: payload.requestId,
        summary: payload.summary,
        evidence: structuredClone(payload.evidence ?? []),
        taskId: payload.taskId,
        occurredAt: event.occurredAt
      };
    }
    if (event.type === "node.confirmed") {
      const node = nodes.get(payload.nodeId);
      if (node) {
        node.confirmed = true;
        node.confirmationCommit = payload.commit;
        node.confirmationRef = payload.ref;
        node.verification = structuredClone(payload.verification ?? null);
      }
    }
    if (event.type === "merge.recorded") {
      const node = nodes.get(payload.nodeId);
      if (node) {
        node.merged = true;
        node.mergeCommit = payload.commit;
        node.targetBranch = payload.targetBranch ?? null;
      }
      const feature = features.get(payload.featureLineId);
      if (feature) feature.status = "merged";
    }
    if (event.type === "coverage.gap-recorded") coverageGaps.push({ ...structuredClone(payload), occurredAt: event.occurredAt });
  }

  const orderedNodes = [...nodes.values()].sort((a, b) => a.occurredAt.localeCompare(b.occurredAt) || a.id.localeCompare(b.id));
  const protectionInitialized = protectionEnabled && orderedNodes.some((node) => node.kind === "baseline");
  return {
    schemaVersion: PROJECT_HISTORY_EVENT_VERSION,
    revision: events.length,
    protection: {
      enabled: protectionEnabled,
      initialized: protectionInitialized,
      healthy: protectionInitialized && failures.size === 0,
      unresolvedFailures: [...failures.values()]
    },
    nodes: orderedNodes,
    featureLines: [...features.values()],
    chatActivities: chats,
    coverageGaps,
    processGroups: foldSnapshotProcessGroups(orderedNodes)
  };
}

export function foldSnapshotProcessGroups(nodes) {
  const groups = [];
  let pending = [];
  const flush = () => {
    if (pending.length >= 3) groups.push({
      id: `process:${pending[0].id}:${pending.at(-1).id}`,
      featureLineId: pending[0].featureLineId,
      taskId: pending[0].taskId,
      nodeIds: pending.map((node) => node.id),
      count: pending.length
    });
    pending = [];
  };
  for (const node of nodes) {
    const foldable = node.kind === "snapshot" && !node.confirmed && !node.merged && !node.agentCheck && node.status === "protected";
    const sameSeries = pending.length === 0 || (
      pending[0].featureLineId === node.featureLineId && pending[0].taskId === node.taskId
    );
    if (!foldable || !sameSeries) flush();
    if (foldable) pending.push(node);
  }
  flush();
  return groups;
}
