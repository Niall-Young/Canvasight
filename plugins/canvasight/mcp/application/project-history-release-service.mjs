import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { spawn } from "node:child_process";
import fsp from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pinHistorySnapshot, removeIsolatedHistoryWorktree, restoreSnapshotToNewWorktree } from "../infrastructure/git-history-snapshot.mjs";

const TOKEN_TTL_MS = 10 * 60 * 1000;
const OUTPUT_LIMIT = 64 * 1024;
const VERIFIER_TIMEOUT_MS = 120_000;
const VERIFIER_ALLOWLIST = ["lint", "typecheck", "test"];

function hash(value) {
  return createHash("sha256").update(value).digest("hex");
}

function base64url(value) {
  return Buffer.from(value, "utf8").toString("base64url");
}

async function run(cwd, command, args, { env = {}, input = null, timeoutMs = 30_000, allowExitCodes = [] } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd, env: { ...process.env, ...env }, stdio: ["pipe", "pipe", "pipe"] });
    const stdout = [];
    const stderr = [];
    let outputBytes = 0;
    let timedOut = false;
    const collect = (target) => (chunk) => {
      if (outputBytes >= OUTPUT_LIMIT) return;
      const remaining = OUTPUT_LIMIT - outputBytes;
      target.push(chunk.subarray(0, remaining));
      outputBytes += Math.min(chunk.length, remaining);
    };
    child.stdout.on("data", collect(stdout));
    child.stderr.on("data", collect(stderr));
    child.on("error", reject);
    child.stdin.end(input === null ? undefined : input);
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill("SIGTERM");
    }, timeoutMs);
    child.on("close", (code) => {
      clearTimeout(timer);
      const result = {
        code: Number(code),
        timedOut,
        truncated: outputBytes >= OUTPUT_LIMIT,
        stdout: Buffer.concat(stdout).toString("utf8"),
        stderr: Buffer.concat(stderr).toString("utf8")
      };
      if (!timedOut && (code === 0 || allowExitCodes.includes(code))) resolve(result);
      else reject(Object.assign(new Error(timedOut ? `${command} timed out` : `${command} exited with ${code}`), { result }));
    });
  });
}

async function git(cwd, args, options = {}) {
  const result = await run(cwd, "git", args, options);
  return result.stdout.trim();
}

async function readJson(filePath) {
  try {
    return JSON.parse(await fsp.readFile(filePath, "utf8"));
  } catch (error) {
    if (error?.code === "ENOENT") return null;
    throw error;
  }
}

function safeSummary(summary) {
  return String(summary || "Project History confirmed change").replace(/[\r\n]+/gu, " ").trim().slice(0, 120);
}

function documentationOnly(changedPaths) {
  return Array.isArray(changedPaths) && changedPaths.length > 0 && changedPaths.every((change) => {
    const filePath = String(change?.path || "").toLowerCase();
    const base = path.basename(filePath);
    return filePath.startsWith("docs/") || /\.(md|mdx)$/u.test(filePath) || /^(readme|license|changelog|contributing)(\.|$)/u.test(base);
  });
}

export class ProjectHistoryReleaseService {
  constructor(historyService) {
    this.history = historyService;
    this.projectPath = historyService.projectPath;
    this.storageDirectory = historyService.store.storageDirectory;
    this.secretPath = path.join(this.storageDirectory, "release-token.key");
  }

  async #secret() {
    try {
      return await fsp.readFile(this.secretPath);
    } catch (error) {
      if (error?.code !== "ENOENT") throw error;
      const secret = randomBytes(32);
      await fsp.mkdir(this.storageDirectory, { recursive: true });
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

  async #verifyToken(token, type) {
    if (typeof token !== "string" || !token.includes(".")) throw new Error("Project History confirmation token is invalid");
    const [encoded, signature] = token.split(".");
    const expected = createHmac("sha256", await this.#secret()).update(encoded).digest("base64url");
    const suppliedBytes = Buffer.from(signature, "utf8");
    const expectedBytes = Buffer.from(expected, "utf8");
    if (suppliedBytes.length !== expectedBytes.length || !timingSafeEqual(suppliedBytes, expectedBytes)) {
      throw new Error("Project History confirmation token signature is invalid");
    }
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
    if (payload.type !== type || payload.projectId !== this.history.identity.localProjectId) throw new Error("Project History confirmation token scope is invalid");
    if (!Number.isFinite(payload.expiresAt) || Date.now() > payload.expiresAt) throw new Error("Project History confirmation token has expired");
    return payload;
  }

  async #mainState() {
    const state = await this.history.ensureMainBranch();
    if (state.mainBranch !== "main" || !state.mainCommit) {
      throw new Error("Project History requires a local main branch before confirmation or merge");
    }
    return { branch: "main", commit: state.mainCommit };
  }

  async runVerifier(nodeId) {
    const index = await this.history.readIndex();
    const node = index.nodes.find((candidate) => candidate.id === nodeId);
    if (!node) throw new Error("history node was not found");
    const fixtureRoot = await fsp.mkdtemp(path.join(os.tmpdir(), "canvasight-history-verify-"));
    const worktreePath = path.join(fixtureRoot, "worktree");
    let added = false;
    try {
      await restoreSnapshotToNewWorktree(this.projectPath, node.commit, worktreePath);
      added = true;
      const sourceModules = path.join(this.projectPath, "node_modules");
      const targetModules = path.join(worktreePath, "node_modules");
      try {
        const stat = await fsp.stat(sourceModules);
        if (stat.isDirectory()) await fsp.symlink(sourceModules, targetModules, "dir");
      } catch (error) {
        if (error?.code !== "ENOENT") throw error;
      }
      const manifest = await readJson(path.join(worktreePath, "package.json"));
      const scripts = manifest?.scripts && typeof manifest.scripts === "object" ? manifest.scripts : {};
      const selected = VERIFIER_ALLOWLIST.filter((name) => typeof scripts[name] === "string" && scripts[name].trim());
      if (selected.length === 0) return { status: "unavailable", passed: false, checks: [], reason: "No declared lint, typecheck, or test script" };
      const checks = [];
      for (const script of selected) {
        try {
          const result = await run(worktreePath, "npm", ["run", script], { timeoutMs: VERIFIER_TIMEOUT_MS });
          checks.push({ name: script, status: "passed", ...result });
        } catch (error) {
          checks.push({ name: script, status: "failed", ...(error?.result ?? { code: -1, timedOut: false, truncated: false, stdout: "", stderr: String(error) }) });
        }
      }
      return { status: checks.every((check) => check.status === "passed") ? "passed" : "failed", passed: checks.every((check) => check.status === "passed"), checks };
    } finally {
      if (added) await removeIsolatedHistoryWorktree(this.projectPath, worktreePath).catch(() => undefined);
      await fsp.rm(fixtureRoot, { recursive: true, force: true });
    }
  }

  async prepareConfirmation(nodeId) {
    const index = await this.history.readIndex();
    const node = index.nodes.find((candidate) => candidate.id === nodeId);
    if (!node) throw new Error("history node was not found");
    if (node.merged) throw new Error("history node is already merged");
    const requiresAgentCheck = !documentationOnly(node.changedPaths);
    if (requiresAgentCheck && node.agentCheck?.status !== "passed") {
      throw new Error("a passed Agent functional check is required before confirming this node");
    }
    const main = await this.#mainState();
    const verification = await this.runVerifier(nodeId);
    const issuedAt = Date.now();
    const payload = {
      type: "confirm",
      projectId: this.history.identity.localProjectId,
      nodeId,
      snapshotCommit: node.commit,
      mainBranch: main.branch,
      mainCommit: main.commit,
      historyRevision: index.revision,
      verificationPassed: verification.passed,
      agentCheckRequestId: requiresAgentCheck ? node.agentCheck.requestId : null,
      issuedAt,
      expiresAt: issuedAt + TOKEN_TTL_MS
    };
    return {
      nodeId,
      summary: node.summary,
      changedPaths: node.changedPaths,
      verification,
      requiresRiskConfirmation: !verification.passed,
      autoMergeEligible: verification.passed && documentationOnly(node.changedPaths),
      token: await this.#sign(payload),
      expiresAt: new Date(payload.expiresAt).toISOString(),
      targetBranch: main.branch
    };
  }

  async confirmNode(token, { acceptVerificationRisk = false } = {}) {
    const payload = await this.#verifyToken(token, "confirm");
    if (!payload.verificationPassed && acceptVerificationRisk !== true) throw new Error("Project checks did not pass; explicit risk confirmation is required");
    const index = await this.history.readIndex();
    const node = index.nodes.find((candidate) => candidate.id === payload.nodeId);
    if (!node || node.commit !== payload.snapshotCommit) throw new Error("history node changed after confirmation was prepared");
    if (payload.agentCheckRequestId && (node.agentCheck?.status !== "passed" || node.agentCheck.requestId !== payload.agentCheckRequestId)) {
      throw new Error("Agent functional check changed after confirmation was prepared");
    }
    const main = await this.#mainState();
    if (main.branch !== payload.mainBranch || main.commit !== payload.mainCommit) throw new Error("main changed after confirmation was prepared");
    let mergeTree;
    try {
      const output = await git(this.projectPath, ["merge-tree", "--write-tree", main.commit, node.commit]);
      mergeTree = output.split(/\r?\n/u)[0];
    } catch (error) {
      return { status: "conflict", nodeId: node.id, targetBranch: main.branch, snapshotRef: node.snapshotRef, snapshotCommit: node.commit, mainCommit: main.commit, details: error?.result?.stdout || error?.message || String(error) };
    }
    if (!/^[0-9a-f]{40,64}$/u.test(mergeTree)) throw new Error("Project History could not produce a verified merge tree");
    const message = `${safeSummary(node.summary)}\n\nCanvasight-History-Node: ${node.id}\n`;
    const commitResult = await run(this.projectPath, "git", ["commit-tree", mergeTree, "-p", main.commit], {
      env: {
        GIT_AUTHOR_NAME: "Canvasight Project History",
        GIT_AUTHOR_EMAIL: "canvasight-history@localhost.invalid",
        GIT_COMMITTER_NAME: "Canvasight Project History",
        GIT_COMMITTER_EMAIL: "canvasight-history@localhost.invalid"
      }, input: message,
      timeoutMs: 30_000
    });
    const commit = commitResult.stdout.trim();
    const ref = `refs/canvasight/snapshots/confirmed/${hash(node.id).slice(0, 24)}`;
    await pinHistorySnapshot(this.projectPath, ref, commit);
    const recorded = await this.history.recordConfirmation(node.id, {
      commit,
      ref,
      verification: { passed: payload.verificationPassed, acceptedRisk: !payload.verificationPassed }
    });
    return {
      status: "confirmed",
      nodeId: node.id,
      commit,
      ref,
      targetBranch: main.branch,
      autoMergeEligible: payload.verificationPassed && documentationOnly(node.changedPaths),
      index: recorded.index
    };
  }

  async prepareMerge(nodeId) {
    const index = await this.history.readIndex();
    const node = index.nodes.find((candidate) => candidate.id === nodeId);
    if (!node?.confirmed || !node.confirmationCommit) throw new Error("history node must be confirmed before merge");
    if (node.merged) return { status: "already-merged", nodeId, index };
    const main = await this.#mainState();
    const parent = await git(this.projectPath, ["rev-parse", `${node.confirmationCommit}^1`]);
    if (parent !== main.commit) throw new Error("main changed after node confirmation; prepare confirmation again");
    const issuedAt = Date.now();
    const payload = {
      type: "merge",
      projectId: this.history.identity.localProjectId,
      nodeId,
      confirmedCommit: node.confirmationCommit,
      mainBranch: main.branch,
      mainCommit: main.commit,
      issuedAt,
      expiresAt: issuedAt + TOKEN_TTL_MS
    };
    return { status: "ready", nodeId, targetBranch: main.branch, commit: node.confirmationCommit, token: await this.#sign(payload), expiresAt: new Date(payload.expiresAt).toISOString() };
  }

  async mergeNode(token) {
    const payload = await this.#verifyToken(token, "merge");
    const index = await this.history.readIndex();
    const node = index.nodes.find((candidate) => candidate.id === payload.nodeId);
    if (!node?.confirmed || node.confirmationCommit !== payload.confirmedCommit) throw new Error("confirmed node changed after merge was prepared");
    if (node.merged) return { status: "already-merged", nodeId: node.id, index };
    const main = await this.#mainState();
    if (main.branch !== payload.mainBranch || main.commit !== payload.mainCommit) throw new Error("main changed after merge was prepared");
    const porcelain = await git(this.projectPath, ["worktree", "list", "--porcelain"]);
    const records = porcelain.split(/\n\n+/u).map((record) => Object.fromEntries(record.split(/\r?\n/u).map((line) => {
      const separator = line.indexOf(" ");
      return separator < 0 ? [line, true] : [line.slice(0, separator), line.slice(separator + 1)];
    })));
    const branchRef = `refs/heads/${main.branch}`;
    const checkedOut = records.find((record) => record.branch === branchRef);
    if (checkedOut?.worktree) {
      const status = await git(checkedOut.worktree, ["status", "--porcelain=v2", "--untracked-files=all"]);
      if (status) throw new Error("main worktree has local changes; merge stopped without modifying it");
      await git(checkedOut.worktree, ["merge", "--ff-only", node.confirmationCommit]);
    } else {
      await git(this.projectPath, ["update-ref", branchRef, node.confirmationCommit, main.commit]);
    }
    const recorded = await this.history.recordMerge(node.id, {
      featureLineId: node.featureLineId,
      commit: node.confirmationCommit,
      targetBranch: main.branch
    });
    return { status: "merged", nodeId: node.id, commit: node.confirmationCommit, targetBranch: main.branch, index: recorded.index };
  }
}
