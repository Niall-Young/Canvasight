import { createHash, randomUUID } from "node:crypto";
import fsp from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";

const ZERO_OID = "0".repeat(40);

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
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
      if (code === 0) return resolve(output);
      if (optionalExitCodes.includes(code)) return resolve(Buffer.alloc(0));
      reject(new Error(`git ${args.join(" ")} failed (${code}): ${Buffer.concat(stderr).toString("utf8").trim()}`));
    });
    if (input === null) child.stdin.end();
    else child.stdin.end(input);
  });
}

async function gitText(cwd, args, options) {
  return (await git(cwd, args, options)).toString("utf8").trim();
}

async function repositoryPaths(projectPath) {
  const cwd = await fsp.realpath(path.resolve(projectPath));
  const worktreeRoot = await fsp.realpath(await gitText(cwd, ["rev-parse", "--show-toplevel"]));
  const rawCommonDir = await gitText(cwd, ["rev-parse", "--git-common-dir"]);
  const commonDir = await fsp.realpath(path.isAbsolute(rawCommonDir) ? rawCommonDir : path.resolve(worktreeRoot, rawCommonDir));
  const rawIndex = await gitText(cwd, ["rev-parse", "--git-path", "index"]);
  const indexPath = path.isAbsolute(rawIndex) ? rawIndex : path.resolve(worktreeRoot, rawIndex);
  return { cwd, worktreeRoot, commonDir, indexPath };
}

async function fileDigest(filePath) {
  try {
    return sha256(await fsp.readFile(filePath));
  } catch (error) {
    if (error?.code === "ENOENT") return null;
    throw error;
  }
}

export async function captureGitUserState(projectPath) {
  const paths = await repositoryPaths(projectPath);
  const head = await gitText(paths.cwd, ["rev-parse", "--verify", "HEAD"], { optionalExitCodes: [1, 128] });
  const symbolicHead = await gitText(paths.cwd, ["symbolic-ref", "-q", "HEAD"], { optionalExitCodes: [1] });
  const status = await git(paths.cwd, ["status", "--porcelain=v2", "-z", "--untracked-files=all", "--ignored=matching"]);
  const refs = await git(paths.cwd, [
    "for-each-ref",
    "--format=%(refname)%00%(objectname)%00%(symref)%00",
    "refs/heads",
    "refs/tags",
    "refs/remotes"
  ]);
  const worktrees = await git(paths.cwd, ["worktree", "list", "--porcelain", "-z"]);
  const evidence = {
    head: head || null,
    symbolicHead: symbolicHead || null,
    indexDigest: await fileDigest(paths.indexPath),
    statusDigest: sha256(status),
    refsDigest: sha256(refs),
    worktreesDigest: sha256(worktrees)
  };
  return { ...evidence, digest: sha256(JSON.stringify(evidence)) };
}

export async function readGitSnapshotRevision(projectPath, revision = "HEAD") {
  const commit = await gitText(projectPath, ["rev-parse", "--verify", revision], { optionalExitCodes: [1, 128] });
  if (!commit) return null;
  const tree = await gitText(projectPath, ["rev-parse", `${commit}^{tree}`]);
  return { commit, tree };
}

function parseCommittedChangedPaths(buffer) {
  const fields = buffer.toString("utf8").split("\0").filter(Boolean);
  const changedPaths = [];
  for (let index = 0; index < fields.length;) {
    const rawStatus = fields[index++] ?? "";
    const status = rawStatus.slice(0, 1);
    const firstPath = fields[index++]?.replaceAll("\\", "/") ?? "";
    if (!status || !firstPath) continue;
    if ((status === "R" || status === "C") && fields[index]) {
      const nextPath = fields[index++].replaceAll("\\", "/");
      changedPaths.push({ status, path: nextPath, previousPath: firstPath });
    } else {
      changedPaths.push({ status, path: firstPath });
    }
  }
  return changedPaths;
}

export async function readCommittedHistorySnapshot(projectPath, revision) {
  const snapshot = await readGitSnapshotRevision(projectPath, revision);
  if (!snapshot) throw new Error("Project History branch tip commit does not exist");
  const changedPaths = parseCommittedChangedPaths(await git(projectPath, [
    "diff-tree",
    "--root",
    "-r",
    "--name-status",
    "-z",
    "--find-renames",
    "--no-commit-id",
    snapshot.commit
  ]));
  return {
    ...snapshot,
    changedPaths,
    coverage: {
      complete: true,
      excludedPathspecs: [],
      policyExcludedPaths: [],
      informationalExcludedPaths: [],
      automaticExcludedPaths: [],
      largePaths: [],
      externalSymlinkPaths: [],
      submodulePaths: [],
      lfsPaths: [],
      scanTruncated: false,
      gapCodes: []
    }
  };
}

function assertSnapshotRef(snapshotRef) {
  if (typeof snapshotRef !== "string" || !snapshotRef.startsWith("refs/canvasight/snapshots/")) {
    throw new Error("Project History snapshot refs must stay below refs/canvasight/snapshots/");
  }
  if (/\.\.|[~^:?*\\\s]|@\{|\/$|\/\//u.test(snapshotRef)) throw new Error("invalid Project History snapshot ref");
}

export async function pinHistorySnapshot(projectPath, snapshotRef, commit) {
  assertSnapshotRef(snapshotRef);
  const existing = await gitText(projectPath, ["rev-parse", "--verify", snapshotRef], { optionalExitCodes: [1, 128] });
  if (existing) {
    if (existing !== commit) throw new Error("immutable Project History node ref already points to another commit");
    return { snapshotRef, commit, duplicate: true };
  }
  await git(projectPath, ["update-ref", snapshotRef, commit, ZERO_OID]);
  return { snapshotRef, commit, duplicate: false };
}

async function candidateTree(projectPath, baseCommit, excludePathspecs) {
  const tempRoot = await fsp.mkdtemp(path.join(os.tmpdir(), "canvasight-history-index-"));
  const indexPath = path.join(tempRoot, "index");
  const env = { GIT_INDEX_FILE: indexPath };
  try {
    if (baseCommit) await git(projectPath, ["read-tree", baseCommit], { env });
    else await git(projectPath, ["read-tree", "--empty"], { env });
    // Negative pathspecs can make `git add` reject an ignored parent directory
    // even when the excluded child should never be captured. Stage normally in
    // the temporary index, then restore policy exclusions to their base state.
    await git(projectPath, ["add", "-A", "--", "."], { env });
    if (excludePathspecs.length > 0) {
      const gitExclusions = expandedGitExclusionPathspecs(excludePathspecs);
      if (baseCommit) {
        await git(projectPath, ["reset", "-q", baseCommit, "--", ...gitExclusions], { env });
      } else {
        await git(projectPath, ["rm", "-r", "--cached", "--ignore-unmatch", "--", ...gitExclusions], { env });
      }
    }
    return await gitText(projectPath, ["write-tree"], { env });
  } finally {
    await fsp.rm(tempRoot, { recursive: true, force: true });
  }
}

function expandedGitExclusionPathspecs(patterns) {
  const expanded = [];
  for (const value of patterns) {
    const pattern = String(value || "");
    if (!pattern) continue;
    expanded.push(pattern);
    if (pattern.startsWith(":(") || pattern.startsWith(":/") || !pattern.endsWith("/")) continue;
    const normalized = pattern.replace(/^\.\//u, "").replace(/\/+$/u, "");
    if (normalized && !/[?*[\]\\]/u.test(normalized)) expanded.push(`:(glob)**/${normalized}/**`);
  }
  return [...new Set(expanded)];
}

function parsePorcelainPaths(buffer) {
  const entries = buffer.toString("utf8").split("\0").filter(Boolean);
  const paths = [];
  for (let index = 0; index < entries.length; index += 1) {
    const entry = entries[index];
    if (entry.length < 4 || entry[2] !== " ") continue;
    const status = entry.slice(0, 2);
    const filePath = entry.slice(3);
    if (filePath) paths.push(filePath.replaceAll("\\", "/"));
    if (/^[RC]/u.test(status) && entries[index + 1] && entries[index + 1][2] !== " ") index += 1;
  }
  return [...new Set(paths)].sort();
}

function informationalExcludedPath(filePath) {
  const normalized = filePath.replace(/^\.\//u, "").replace(/\/+$/u, "");
  return normalized === ".scatter"
    || normalized.startsWith(".scatter/")
    || normalized === ".cache"
    || normalized.startsWith(".cache/")
    || normalized === "node_modules"
    || normalized.includes("/node_modules/")
    || normalized.endsWith("/node_modules")
    || normalized === "dist"
    || normalized.startsWith("dist/")
    || normalized.includes("/dist/")
    || normalized === "build"
    || normalized.startsWith("build/")
    || normalized.includes("/build/");
}

function exclusionMatchesPath(pattern, filePath) {
  const normalizedPattern = String(pattern || "").replace(/^\.\//u, "").replace(/\/+$/u, "");
  const normalizedPath = String(filePath || "").replace(/^\.\//u, "").replace(/\/+$/u, "");
  if (!normalizedPattern || !normalizedPath) return false;
  if (String(pattern).endsWith("/")) {
    if (normalizedPath === normalizedPattern || normalizedPath.startsWith(`${normalizedPattern}/`) || normalizedPattern.startsWith(`${normalizedPath}/`)) return true;
    const pathParts = normalizedPath.split("/");
    const patternParts = normalizedPattern.split("/");
    return pathParts.some((_, start) => patternParts.every((part, offset) => pathParts[start + offset] === part));
  }
  const escaped = normalizedPattern
    .replace(/[.+^${}()|[\]\\]/gu, "\\$&")
    .replaceAll("*", ".*")
    .replaceAll("?", ".");
  const matcher = new RegExp(`^${escaped}$`, "u");
  return normalizedPattern.includes("/")
    ? matcher.test(normalizedPath)
    : matcher.test(path.basename(normalizedPath));
}

async function actualPolicyExclusions(projectPath, excludePathspecs) {
  if (excludePathspecs.length === 0) return { policyExcludedPaths: [], informationalExcludedPaths: [] };
  const status = await git(projectPath, [
    "status",
    "--porcelain=v1",
    "-z",
    "--untracked-files=all",
    "--ignored=matching",
    "--",
    ...expandedGitExclusionPathspecs(excludePathspecs)
  ]);
  const paths = parsePorcelainPaths(status).filter((filePath) => excludePathspecs.some((pattern) => exclusionMatchesPath(pattern, filePath)));
  return {
    policyExcludedPaths: paths.filter((filePath) => !informationalExcludedPath(filePath)),
    informationalExcludedPaths: paths.filter(informationalExcludedPath)
  };
}

async function analyzeCoverage(projectPath, worktreeRoot, excludePathspecs, largeFileBytes) {
  const rawCandidates = await git(projectPath, ["ls-files", "-co", "--exclude-standard", "-z"]);
  const allCandidates = rawCandidates.toString("utf8").split("\0").filter(Boolean);
  const scanTruncated = allCandidates.length > 20_000;
  const candidates = allCandidates.slice(0, 20_000);
  const largePaths = [];
  const externalSymlinkPaths = [];
  for (const relativePath of candidates) {
    const absolutePath = path.resolve(worktreeRoot, relativePath);
    try {
      const stat = await fsp.lstat(absolutePath);
      if (stat.isFile() && stat.size > largeFileBytes) largePaths.push(relativePath);
      if (stat.isSymbolicLink()) {
        const target = await fsp.readlink(absolutePath);
        const resolvedTarget = path.resolve(path.dirname(absolutePath), target);
        const relativeTarget = path.relative(worktreeRoot, resolvedTarget);
        if (path.isAbsolute(target) || relativeTarget.startsWith("..") || path.isAbsolute(relativeTarget)) externalSymlinkPaths.push(relativePath);
      }
    } catch (error) {
      if (error?.code !== "ENOENT") throw error;
    }
  }
  const staged = await git(projectPath, ["ls-files", "-s", "-z"]);
  const submodulePaths = staged.toString("utf8").split("\0").filter(Boolean).flatMap((entry) => {
    const match = entry.match(/^160000 [0-9a-f]+ \d+\t(.+)$/u);
    return match ? [match[1]] : [];
  });
  const lfsPaths = [];
  if (candidates.length > 0) {
    const attributes = await git(projectPath, ["check-attr", "-z", "--stdin", "filter"], { input: `${candidates.join("\0")}\0` });
    const fields = attributes.toString("utf8").split("\0").filter(Boolean);
    for (let index = 0; index + 2 < fields.length; index += 3) if (fields[index + 2] === "lfs") lfsPaths.push(fields[index]);
  }
  const automaticExcludedPaths = [...new Set([...largePaths, ...externalSymlinkPaths])];
  const policy = await actualPolicyExclusions(projectPath, excludePathspecs);
  const gapCodes = [
    ...(policy.policyExcludedPaths.length > 0 ? ["policy-exclusions"] : []),
    ...(largePaths.length > 0 ? ["large-files-excluded"] : []),
    ...(externalSymlinkPaths.length > 0 ? ["external-symlinks-excluded"] : []),
    ...(submodulePaths.length > 0 ? ["submodule-content-not-captured"] : []),
    ...(lfsPaths.length > 0 ? ["lfs-content-requires-local-object"] : []),
    ...(scanTruncated ? ["coverage-scan-truncated"] : [])
  ];
  return {
    complete: gapCodes.length === 0,
    excludedPathspecs: [...excludePathspecs],
    policyExcludedPaths: policy.policyExcludedPaths,
    informationalExcludedPaths: policy.informationalExcludedPaths,
    automaticExcludedPaths,
    largePaths,
    externalSymlinkPaths,
    submodulePaths,
    lfsPaths,
    scanTruncated,
    gapCodes
  };
}

async function rollbackSnapshotRef(projectPath, snapshotRef, previousCommit, writtenCommit) {
  if (previousCommit) await git(projectPath, ["update-ref", snapshotRef, previousCommit, writtenCommit]);
  else await git(projectPath, ["update-ref", "-d", snapshotRef, writtenCommit]);
}

async function acquireProjectHistoryLock(commonDir) {
  const lockRoot = path.join(commonDir, "canvasight");
  const lockPath = path.join(lockRoot, "project-history.lock");
  await fsp.mkdir(lockRoot, { recursive: true });
  try {
    await fsp.mkdir(lockPath);
  } catch (error) {
    if (error?.code === "EEXIST") throw new Error("another Canvasight Project History Git operation is active");
    throw error;
  }
  return async () => {
    await fsp.rmdir(lockPath);
  };
}

export async function createIsolatedHistorySnapshot(projectPath, {
  snapshotRef,
  excludePathspecs = [],
  message = "Canvasight Project History snapshot",
  skipIfUnchanged = false,
  skipIfHeadUnchanged = skipIfUnchanged,
  changeBase = "previous-snapshot",
  largeFileBytes = 50 * 1024 * 1024,
  recoveryToken = null,
  beforeRefUpdate
}) {
  assertSnapshotRef(snapshotRef);
  if (recoveryToken !== null && (typeof recoveryToken !== "string" || !recoveryToken || /[\r\n]/u.test(recoveryToken))) {
    throw new Error("snapshot recoveryToken must be a non-empty single line");
  }
  const paths = await repositoryPaths(projectPath);
  const releaseLock = await acquireProjectHistoryLock(paths.commonDir);
  try {
    if (!Number.isSafeInteger(largeFileBytes) || largeFileBytes < 1) throw new Error("largeFileBytes must be a positive integer");
    if (changeBase !== "previous-snapshot" && changeBase !== "head") throw new Error("snapshot changeBase must be previous-snapshot or head");
    const before = await captureGitUserState(projectPath);
    const head = await gitText(projectPath, ["rev-parse", "--verify", "HEAD"], { optionalExitCodes: [1, 128] });
    const previousCommit = await gitText(projectPath, ["rev-parse", "--verify", snapshotRef], { optionalExitCodes: [1, 128] });
    const coverage = await analyzeCoverage(projectPath, paths.worktreeRoot, excludePathspecs, largeFileBytes);
    const automaticExclusions = coverage.automaticExcludedPaths.map((item) => `:(top,literal)${item}`);
    const tree = await candidateTree(projectPath, head || null, [...excludePathspecs, ...automaticExclusions]);
    const parent = previousCommit || head || null;
    const previousSnapshotTree = parent
      ? await gitText(projectPath, ["rev-parse", `${parent}^{tree}`])
      : await gitText(projectPath, ["mktree"], { input: "" });
    const headTree = head ? await gitText(projectPath, ["rev-parse", `${head}^{tree}`]) : null;
    const unchangedFromPreviousSnapshot = Boolean(previousCommit && tree === previousSnapshotTree);
    const unchangedFromHead = Boolean(skipIfHeadUnchanged && headTree && tree === headTree);
    if (skipIfUnchanged && (unchangedFromPreviousSnapshot || unchangedFromHead)) {
      const after = await captureGitUserState(projectPath);
      if (after.digest !== before.digest) throw new Error("snapshot scan observed a concurrent Git state change");
      let changedPaths = [];
      if (unchangedFromPreviousSnapshot && previousCommit) {
        const previousParentTree = await gitText(projectPath, ["rev-parse", `${previousCommit}^1^{tree}`], { optionalExitCodes: [1, 128] });
        if (previousParentTree) {
          const rawChanges = await git(projectPath, ["diff-tree", "-r", "--no-commit-id", "--name-status", "-z", previousParentTree, tree]);
          const fields = rawChanges.toString("utf8").split("\0").filter(Boolean);
          for (let index = 0; index < fields.length;) {
            const status = fields[index++];
            const firstPath = fields[index++];
            const secondPath = /^[RC]/u.test(status) ? fields[index++] : null;
            changedPaths.push({ status, path: secondPath ?? firstPath, ...(secondPath ? { previousPath: firstPath } : {}) });
          }
        }
      }
      const existingMessage = previousCommit
        ? await gitText(projectPath, ["show", "-s", "--format=%B", previousCommit])
        : "";
      const recovered = Boolean(unchangedFromPreviousSnapshot && recoveryToken && existingMessage.includes(`Recovery-Token: ${recoveryToken}`));
      return {
        snapshotRef,
        skipped: true,
        recovered,
        commit: recovered ? previousCommit : null,
        tree,
        parent,
        coverage,
        gitBranch: before.symbolicHead?.startsWith("refs/heads/") ? before.symbolicHead.slice("refs/heads/".length) : null,
        headCommit: head || null,
        userStateDigest: before.digest,
        changedPaths
      };
    }
    let changeBaseTree = changeBase === "head" && headTree ? headTree : previousSnapshotTree;
    if (changeBase === "head" && head && headTree && tree === headTree) {
      const headParentTree = await gitText(projectPath, ["rev-parse", `${head}^1^{tree}`], { optionalExitCodes: [1, 128] });
      changeBaseTree = headParentTree || await gitText(projectPath, ["mktree"], { input: "" });
    }
    const identityEnv = {
      GIT_AUTHOR_NAME: "Canvasight Project History",
      GIT_AUTHOR_EMAIL: "canvasight-history@localhost.invalid",
      GIT_COMMITTER_NAME: "Canvasight Project History",
      GIT_COMMITTER_EMAIL: "canvasight-history@localhost.invalid"
    };
    const commitArgs = ["commit-tree", tree];
    if (parent) commitArgs.push("-p", parent);
    const trailers = [`Snapshot-Id: ${randomUUID()}`];
    if (recoveryToken) trailers.push(`Recovery-Token: ${recoveryToken}`);
    const commit = await gitText(projectPath, commitArgs, { env: identityEnv, input: `${message}\n\n${trailers.join("\n")}\n` });
    if (beforeRefUpdate !== undefined) {
      if (typeof beforeRefUpdate !== "function") throw new Error("beforeRefUpdate must be a function");
      await beforeRefUpdate({ snapshotRef, previousCommit: previousCommit || null, commit, tree });
    }
    await git(projectPath, ["update-ref", snapshotRef, commit, previousCommit || ZERO_OID]);

    try {
      const verificationTree = await candidateTree(projectPath, head || null, [...excludePathspecs, ...automaticExclusions]);
      const after = await captureGitUserState(projectPath);
      if (verificationTree !== tree) throw new Error("working tree changed while the snapshot was being created");
      if (after.digest !== before.digest) throw new Error("snapshot changed the user's Git state");
      const rawChanges = await git(projectPath, ["diff-tree", "-r", "--no-commit-id", "--name-status", "-z", changeBaseTree, tree]);
      const fields = rawChanges.toString("utf8").split("\0").filter(Boolean);
      const changedPaths = [];
      for (let index = 0; index < fields.length;) {
        const status = fields[index++];
        const firstPath = fields[index++];
        const secondPath = /^[RC]/u.test(status) ? fields[index++] : null;
        changedPaths.push({ status, path: secondPath ?? firstPath, ...(secondPath ? { previousPath: firstPath } : {}) });
      }
      return {
        snapshotRef,
        commit,
        tree,
        parent,
        coverage,
        gitBranch: before.symbolicHead?.startsWith("refs/heads/") ? before.symbolicHead.slice("refs/heads/".length) : null,
        headCommit: head || null,
        userStateDigest: before.digest,
        changedPaths
      };
    } catch (error) {
      await rollbackSnapshotRef(projectPath, snapshotRef, previousCommit || null, commit);
      throw error;
    }
  } finally {
    await releaseLock();
  }
}

export async function restoreSnapshotToNewWorktree(projectPath, snapshotCommit, targetPath) {
  const resolvedTarget = path.resolve(targetPath);
  try {
    await fsp.lstat(resolvedTarget);
    throw new Error("restore target already exists");
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
  let added = false;
  try {
    await git(projectPath, ["worktree", "add", "--detach", resolvedTarget, snapshotCommit]);
    added = true;
    const restoredTree = await gitText(resolvedTarget, ["rev-parse", "HEAD^{tree}"]);
    const expectedTree = await gitText(projectPath, ["rev-parse", `${snapshotCommit}^{tree}`]);
    if (restoredTree !== expectedTree) throw new Error("restored worktree tree does not match the snapshot");
    return { targetPath: resolvedTarget, commit: snapshotCommit, tree: restoredTree };
  } catch (error) {
    if (added) await git(projectPath, ["worktree", "remove", resolvedTarget]);
    throw error;
  }
}

export async function removeIsolatedHistoryWorktree(projectPath, targetPath) {
  const resolvedTarget = path.resolve(targetPath);
  await git(projectPath, ["worktree", "remove", resolvedTarget]);
}
