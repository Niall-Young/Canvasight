import { createHash, randomUUID } from "node:crypto";
import fsp from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";

export const PORTABLE_HISTORY_SCHEMA_VERSION = 1;

const ZERO_OID = "0".repeat(40);
const CUSTOM_REF_PREFIX = "refs/canvasight/history/";
const FALLBACK_REF_PREFIX = "refs/heads/canvasight-history/";
const TEMP_REF_PREFIX = "refs/canvasight/imports/";
const EVENT_KEYS = new Set(["id", "type", "summary", "status", "source", "coverage", "parents", "git", "occurredAt"]);
const LAYOUT_KEYS = new Set(["eventId", "x", "y", "collapsed", "revision"]);
const CONFLICT_KEYS = new Set(["kind", "id", "variants"]);
const COVERAGE_KEYS = new Set(["complete", "excludedPathspecs", "gapCodes"]);
const MAX_PORTABLE_EVENTS = 50_000;
const MAX_PORTABLE_LAYOUT_ITEMS = 50_000;
const MAX_PORTABLE_CONFLICTS = 10_000;

function stableJson(value) {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function digest(value) {
  return createHash("sha256").update(stableJson(value)).digest("hex");
}

async function git(cwd, args, { env = {}, input = null, optionalExitCodes = [] } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn("git", ["-C", cwd, ...args], {
      env: { ...process.env, ...env },
      stdio: ["pipe", "pipe", "pipe"]
    });
    const stdout = [];
    const stderr = [];
    child.stdout.on("data", (chunk) => stdout.push(chunk));
    child.stderr.on("data", (chunk) => stderr.push(chunk));
    child.on("error", reject);
    child.on("close", (code) => {
      const output = Buffer.concat(stdout);
      if (code === 0 || optionalExitCodes.includes(code)) return resolve({ code, output });
      reject(new Error(`git ${args.join(" ")} failed (${code}): ${Buffer.concat(stderr).toString("utf8").trim()}`));
    });
    child.stdin.end(input ?? undefined);
  });
}

async function gitText(cwd, args, options) {
  return (await git(cwd, args, options)).output.toString("utf8").trim();
}

function assertPortableRef(historyRef) {
  const validPrefix = historyRef.startsWith(CUSTOM_REF_PREFIX) || historyRef.startsWith(FALLBACK_REF_PREFIX);
  if (!validPrefix || /\.\.|[~^:?*\\\s]|@\{|\/$|\/\//u.test(historyRef)) {
    throw new Error("invalid Project History sidecar ref");
  }
}

function assertObject(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`${label} must be an object`);
}

function assertAllowedKeys(value, allowed, label) {
  for (const key of Object.keys(value)) if (!allowed.has(key)) throw new Error(`${label} contains forbidden field: ${key}`);
}

function normalizeEvent(event) {
  assertObject(event, "event");
  assertAllowedKeys(event, EVENT_KEYS, "event");
  if (typeof event.id !== "string" || event.id.length === 0) throw new Error("event.id is required");
  if (typeof event.type !== "string" || event.type.length === 0) throw new Error("event.type is required");
  if (typeof event.summary !== "string" || event.summary.length === 0 || event.summary.length > 280) {
    throw new Error("event.summary must contain 1-280 characters");
  }
  if (event.parents !== undefined && (!Array.isArray(event.parents) || event.parents.some((item) => typeof item !== "string"))) {
    throw new Error("event.parents must be string IDs");
  }
  if (event.status !== undefined && (typeof event.status !== "string" || event.status.length > 40)) throw new Error("event.status is invalid");
  if (event.occurredAt !== undefined && (typeof event.occurredAt !== "string" || !Number.isFinite(Date.parse(event.occurredAt)))) {
    throw new Error("event.occurredAt is invalid");
  }
  if (event.source !== undefined && !new Set(["codex", "mixed", "external", "portable"]).has(event.source)) throw new Error("event.source is invalid");
  if (event.coverage !== undefined) {
    assertObject(event.coverage, "event.coverage");
    assertAllowedKeys(event.coverage, COVERAGE_KEYS, "event.coverage");
    if (typeof event.coverage.complete !== "boolean") throw new Error("event.coverage.complete is required");
    for (const key of ["excludedPathspecs", "gapCodes"]) {
      if (event.coverage[key] !== undefined && (!Array.isArray(event.coverage[key]) || event.coverage[key].some((item) => typeof item !== "string" || item.length > 160))) {
        throw new Error(`event.coverage.${key} must contain bounded strings`);
      }
    }
  }
  if (event.git !== undefined) {
    assertObject(event.git, "event.git");
    assertAllowedKeys(event.git, new Set(["objectId", "refName"]), "event.git");
    if (event.git.objectId !== undefined && !/^[0-9a-f]{40,64}$/u.test(event.git.objectId)) throw new Error("event.git.objectId is invalid");
    if (event.git.refName !== undefined && (typeof event.git.refName !== "string" || !event.git.refName.startsWith("refs/canvasight/"))) throw new Error("event.git.refName is invalid");
  }
  return structuredClone(event);
}

function normalizeLayout(item) {
  assertObject(item, "layout item");
  assertAllowedKeys(item, LAYOUT_KEYS, "layout item");
  if (typeof item.eventId !== "string" || !Number.isFinite(item.x) || !Number.isFinite(item.y)) {
    throw new Error("layout item requires eventId, x, and y");
  }
  if (Math.abs(item.x) > 1_000_000 || Math.abs(item.y) > 1_000_000) throw new Error("layout coordinates are out of bounds");
  if (item.collapsed !== undefined && typeof item.collapsed !== "boolean") throw new Error("layout collapsed must be boolean");
  if (item.revision !== undefined && (!Number.isSafeInteger(item.revision) || item.revision < 0)) throw new Error("layout revision is invalid");
  return structuredClone(item);
}

export function migratePortableHistory(input) {
  assertObject(input, "portable history");
  if (input.schemaVersion === PORTABLE_HISTORY_SCHEMA_VERSION) return structuredClone(input);
  if (input.schemaVersion === 0) {
    return {
      schemaVersion: PORTABLE_HISTORY_SCHEMA_VERSION,
      projectId: input.projectId,
      events: (input.nodes ?? []).map((node) => ({
        id: node.id,
        type: node.kind ?? "snapshot",
        summary: node.label,
        status: node.status ?? "recorded"
      })),
      layout: (input.positions ?? []).map((position) => ({
        eventId: position.nodeId,
        x: position.x,
        y: position.y,
        revision: 0
      }))
    };
  }
  throw new Error(`unsupported Project History schema version: ${input.schemaVersion}`);
}

export function validatePortableHistory(input) {
  const manifest = migratePortableHistory(input);
  assertAllowedKeys(manifest, new Set(["schemaVersion", "projectId", "events", "layout", "conflicts"]), "portable history");
  if (typeof manifest.projectId !== "string" || manifest.projectId.length === 0) throw new Error("projectId is required");
  if (!Array.isArray(manifest.events) || !Array.isArray(manifest.layout)) throw new Error("events and layout must be arrays");
  if (manifest.events.length > MAX_PORTABLE_EVENTS || manifest.layout.length > MAX_PORTABLE_LAYOUT_ITEMS) {
    throw new Error("portable history exceeds the supported event or layout limit");
  }
  const events = manifest.events.map(normalizeEvent);
  const ids = new Set();
  for (const event of events) {
    if (ids.has(event.id)) throw new Error(`duplicate event ID: ${event.id}`);
    ids.add(event.id);
  }
  const layout = manifest.layout.map(normalizeLayout);
  for (const item of layout) if (!ids.has(item.eventId)) throw new Error(`layout references unknown event: ${item.eventId}`);
  if (manifest.conflicts !== undefined && !Array.isArray(manifest.conflicts)) throw new Error("conflicts must be an array");
  if ((manifest.conflicts?.length ?? 0) > MAX_PORTABLE_CONFLICTS) throw new Error("portable history exceeds the supported conflict limit");
  const conflicts = (manifest.conflicts ?? []).map((conflict) => {
    assertObject(conflict, "conflict");
    assertAllowedKeys(conflict, CONFLICT_KEYS, "conflict");
    if ((conflict.kind !== "event" && conflict.kind !== "layout") || typeof conflict.id !== "string") {
      throw new Error("conflict requires an event or layout kind and stable ID");
    }
    if (!Array.isArray(conflict.variants) || conflict.variants.length < 2) throw new Error("conflict requires at least two variants");
    const variants = conflict.variants.map(conflict.kind === "event" ? normalizeEvent : normalizeLayout);
    if (variants.some((variant) => (conflict.kind === "event" ? variant.id : variant.eventId) !== conflict.id)) {
      throw new Error("conflict variants must share the conflict ID");
    }
    return { kind: conflict.kind, id: conflict.id, variants };
  });
  return { schemaVersion: PORTABLE_HISTORY_SCHEMA_VERSION, projectId: manifest.projectId, events, layout, conflicts };
}

export function mergePortableHistories(leftInput, rightInput) {
  const left = validatePortableHistory(leftInput);
  const right = validatePortableHistory(rightInput);
  if (left.projectId !== right.projectId) throw new Error("cannot merge sidecars from different projects");
  const events = new Map(left.events.map((event) => [event.id, event]));
  const conflicts = [...left.conflicts, ...right.conflicts];
  for (const event of right.events) {
    const current = events.get(event.id);
    if (!current) events.set(event.id, event);
    else if (stableJson(current) !== stableJson(event)) {
      conflicts.push({ kind: "event", id: event.id, variants: [current, event].sort((a, b) => digest(a).localeCompare(digest(b))) });
    }
  }
  const layout = new Map(left.layout.map((item) => [item.eventId, item]));
  for (const item of right.layout) {
    const current = layout.get(item.eventId);
    if (!current || (item.revision ?? 0) > (current.revision ?? 0)) layout.set(item.eventId, item);
    else if ((item.revision ?? 0) === (current.revision ?? 0) && stableJson(current) !== stableJson(item)) {
      conflicts.push({ kind: "layout", id: item.eventId, variants: [current, item].sort((a, b) => digest(a).localeCompare(digest(b))) });
    }
  }
  return validatePortableHistory({
    schemaVersion: PORTABLE_HISTORY_SCHEMA_VERSION,
    projectId: left.projectId,
    events: [...events.values()].sort((a, b) => a.id.localeCompare(b.id)),
    layout: [...layout.values()].sort((a, b) => a.eventId.localeCompare(b.eventId)),
    conflicts: conflicts.sort((a, b) => stableJson(a).localeCompare(stableJson(b)))
  });
}

async function refOid(repository, ref) {
  return gitText(repository, ["rev-parse", "--verify", ref], { optionalExitCodes: [1, 128] });
}

async function readManifestAtCommit(repository, commit) {
  const result = await git(repository, ["show", `${commit}:history.json`]);
  return validatePortableHistory(JSON.parse(result.output.toString("utf8")));
}

export async function readHistorySidecar(repository, historyRef) {
  assertPortableRef(historyRef);
  const commit = await refOid(repository, historyRef);
  if (!commit) return null;
  return { commit, manifest: await readManifestAtCommit(repository, commit) };
}

async function createMetadataCommit(repository, manifest, parents) {
  const temporaryRoot = await fsp.mkdtemp(path.join(os.tmpdir(), "canvasight-history-sidecar-"));
  const env = { GIT_INDEX_FILE: path.join(temporaryRoot, "index") };
  try {
    await git(repository, ["read-tree", "--empty"], { env });
    const blob = await gitText(repository, ["hash-object", "-w", "--stdin"], { input: `${stableJson(manifest)}\n` });
    await git(repository, ["update-index", "--add", "--cacheinfo", `100644,${blob},history.json`], { env });
    const tree = await gitText(repository, ["write-tree"], { env });
    const commitArgs = ["commit-tree", tree];
    for (const parent of parents) commitArgs.push("-p", parent);
    const identityEnv = {
      GIT_AUTHOR_NAME: "Canvasight Project History",
      GIT_AUTHOR_EMAIL: "canvasight-history@localhost.invalid",
      GIT_COMMITTER_NAME: "Canvasight Project History",
      GIT_COMMITTER_EMAIL: "canvasight-history@localhost.invalid"
    };
    return gitText(repository, commitArgs, {
      env: identityEnv,
      input: `Canvasight Project History metadata\n\nSidecar-Id: ${randomUUID()}\n`
    });
  } finally {
    await fsp.rm(temporaryRoot, { recursive: true, force: true });
  }
}

export async function writeHistorySidecar(repository, historyRef, input, { expectedCommit } = {}) {
  assertPortableRef(historyRef);
  const manifest = validatePortableHistory(input);
  const previousCommit = await refOid(repository, historyRef);
  if (expectedCommit !== undefined && (previousCommit || null) !== expectedCommit) throw new Error("sidecar changed concurrently");
  const commit = await createMetadataCommit(repository, manifest, previousCommit ? [previousCommit] : []);
  await git(repository, ["update-ref", historyRef, commit, previousCommit || ZERO_OID]);
  return { commit, manifest };
}

function requireAuthorization(authorized) {
  if (authorized !== true) throw new Error("project-scoped sidecar sync authorization is required");
}

export async function pushHistorySidecar(repository, remote, historyRef, { authorized = false } = {}) {
  requireAuthorization(authorized);
  assertPortableRef(historyRef);
  const commit = await refOid(repository, historyRef);
  if (!commit) throw new Error("local sidecar ref does not exist");
  await git(repository, ["push", remote, `${historyRef}:${historyRef}`]);
  return { historyRef, commit };
}

async function fetchIntoTemporaryRef(repository, remote, historyRef) {
  assertPortableRef(historyRef);
  const temporaryRef = `${TEMP_REF_PREFIX}${randomUUID()}`;
  await git(repository, ["fetch", "--no-tags", remote, `${historyRef}:${temporaryRef}`]);
  return { temporaryRef, commit: await refOid(repository, temporaryRef) };
}

export async function missingHistoryGitObjects(repository, manifest) {
  const candidates = [...new Set(manifest.events.map((event) => event.git?.objectId).filter(Boolean))];
  const missing = [];
  for (const objectId of candidates) {
    const result = await git(repository, ["cat-file", "-e", `${objectId}^{object}`], { optionalExitCodes: [1, 128] });
    if (result.code !== 0) missing.push(objectId);
  }
  return missing;
}

export async function importHistorySidecar(repository, remote, historyRef, { authorized = false } = {}) {
  requireAuthorization(authorized);
  const localCommit = await refOid(repository, historyRef);
  const { temporaryRef, commit } = await fetchIntoTemporaryRef(repository, remote, historyRef);
  try {
    const manifest = await readManifestAtCommit(repository, commit);
    if (localCommit && localCommit !== commit) {
      const ancestry = await git(repository, ["merge-base", "--is-ancestor", localCommit, commit], { optionalExitCodes: [1] });
      if (ancestry.code !== 0) throw new Error("local and remote sidecars diverged; synchronize instead of importing");
    }
    await git(repository, ["update-ref", historyRef, commit, localCommit || ZERO_OID]);
    return { commit, manifest, missingObjectIds: await missingHistoryGitObjects(repository, manifest) };
  } finally {
    await git(repository, ["update-ref", "-d", temporaryRef], { optionalExitCodes: [1] });
  }
}

export async function synchronizeHistorySidecar(repository, remote, historyRef, { authorized = false } = {}) {
  requireAuthorization(authorized);
  const local = await readHistorySidecar(repository, historyRef);
  if (!local) throw new Error("local sidecar ref does not exist");
  const { temporaryRef, commit: remoteCommit } = await fetchIntoTemporaryRef(repository, remote, historyRef);
  try {
    const remoteManifest = await readManifestAtCommit(repository, remoteCommit);
    if (remoteCommit === local.commit) return { commit: local.commit, manifest: local.manifest, changed: false };
    const manifest = mergePortableHistories(local.manifest, remoteManifest);
    const mergeCommit = await createMetadataCommit(repository, manifest, [remoteCommit, local.commit]);
    await git(repository, ["update-ref", historyRef, mergeCommit, local.commit]);
    await git(repository, ["push", remote, `${historyRef}:${historyRef}`]);
    return { commit: mergeCommit, manifest, changed: true, missingObjectIds: await missingHistoryGitObjects(repository, manifest) };
  } finally {
    await git(repository, ["update-ref", "-d", temporaryRef], { optionalExitCodes: [1] });
  }
}
