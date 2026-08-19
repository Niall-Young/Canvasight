import { createHash } from "node:crypto";
import { spawn } from "node:child_process";

function digest(value) {
  return createHash("sha256").update(value).digest("hex");
}

async function git(cwd, args) {
  return new Promise((resolve, reject) => {
    const child = spawn("git", ["-C", cwd, ...args], { stdio: ["ignore", "pipe", "pipe"] });
    const stdout = [];
    const stderr = [];
    child.stdout.on("data", (chunk) => stdout.push(chunk));
    child.stderr.on("data", (chunk) => stderr.push(chunk));
    child.on("error", reject);
    child.on("close", (code) => code === 0
      ? resolve(Buffer.concat(stdout))
      : reject(new Error(`git ${args.join(" ")} failed (${code}): ${Buffer.concat(stderr).toString("utf8").trim()}`)));
  });
}

async function fingerprint(projectPath) {
  const head = (await git(projectPath, ["rev-parse", "HEAD"])).toString("utf8").trim();
  const headSubject = (await git(projectPath, ["log", "-1", "--format=%s", "HEAD"])).toString("utf8").trim();
  const status = await git(projectPath, ["status", "--porcelain=v2", "-z", "--untracked-files=all", "--", ".", ":(exclude).scatter", ":(exclude).scatter/**"]);
  const statusDigest = digest(status);
  return { head, headSubject, dirty: status.length > 0, statusDigest, fingerprint: digest(`${head}:${statusDigest}`) };
}

export class ProjectHistoryExternalWatcher {
  constructor(historyService, observerState, { silenceMs = 120_000 } = {}) {
    this.history = historyService;
    this.observer = observerState;
    this.silenceMs = silenceMs;
  }

  async acknowledgeCurrent({ now = new Date() } = {}) {
    const current = await fingerprint(this.history.projectPath);
    const nowIso = now.toISOString();
    await this.observer.updateExternal({
      ...current,
      firstSeenAt: nowIso,
      lastSeenAt: nowIso,
      lastSealedFingerprint: current.fingerprint
    });
    return current;
  }

  async reconcileLocalBranchTips() {
    const topology = await this.history.readGitTopology();
    const commits = new Map(topology.commits.map((commit) => [commit.id, commit]));
    const refsByCommit = new Map();
    for (const ref of topology.refs) {
      if (ref.kind !== "local-branch" || ref.shortName === "main" || ref.shortName === "master") continue;
      const refs = refsByCommit.get(ref.commit) ?? [];
      refs.push(ref);
      refsByCommit.set(ref.commit, refs);
    }
    const candidates = [...refsByCommit.entries()]
      .map(([commitId, refs]) => ({ commit: commits.get(commitId), ref: [...refs].sort((left, right) => left.shortName.localeCompare(right.shortName))[0] }))
      .filter((candidate) => candidate.commit && candidate.ref)
      .sort((left, right) => left.commit.committedAt.localeCompare(right.commit.committedAt) || left.ref.shortName.localeCompare(right.ref.shortName));
    const captured = [];
    const skipped = [];
    for (const candidate of candidates) {
      const result = await this.history.recordCommittedBranchTip({
        branch: candidate.ref.shortName,
        commit: candidate.commit.id,
        summary: candidate.commit.subject,
        occurredAt: candidate.commit.committedAt
      });
      if (result.skipped || result.duplicate) skipped.push({ branch: candidate.ref.shortName, commit: candidate.commit.id });
      else captured.push({ branch: candidate.ref.shortName, commit: candidate.commit.id });
    }
    return { captured, skipped };
  }

  async inspect({ force = false, now = new Date() } = {}) {
    const branchTips = await this.reconcileLocalBranchTips();
    const current = await fingerprint(this.history.projectPath);
    const provider = await this.observer.read();
    const prior = provider.external;
    const nowIso = now.toISOString();
    if (!prior) {
      await this.observer.updateExternal({ ...current, firstSeenAt: nowIso, lastSeenAt: nowIso, lastSealedFingerprint: null });
      return { status: "observing", sealed: false, current, branchTips };
    }
    if (current.fingerprint === prior.lastSealedFingerprint) {
      await this.observer.updateExternal({ ...prior, ...current, firstSeenAt: nowIso, lastSeenAt: nowIso });
      return { status: "unchanged", sealed: false, current, branchTips };
    }
    const headChanged = current.head !== prior.head;
    const samePending = current.fingerprint === prior.fingerprint;
    const firstSeenAt = samePending ? prior.firstSeenAt : nowIso;
    const silentForMs = Math.max(0, now.getTime() - Date.parse(firstSeenAt));
    const activeCodexTurns = await this.observer.activeTurns(now);
    if (activeCodexTurns.length > 0) {
      await this.observer.updateExternal({ ...current, firstSeenAt, lastSeenAt: nowIso, lastSealedFingerprint: prior.lastSealedFingerprint ?? null });
      return {
        status: "waiting-for-codex-turn",
        sealed: false,
        silentForMs,
        activeCodexTurns: activeCodexTurns.map((turn) => ({ taskId: turn.taskId, turnId: turn.turnId, startedAt: turn.startedAt })),
        current,
        branchTips
      };
    }
    const shouldSeal = force || headChanged || (current.dirty && samePending && silentForMs >= this.silenceMs);
    if (!shouldSeal) {
      await this.observer.updateExternal({ ...current, firstSeenAt, lastSeenAt: nowIso, lastSealedFingerprint: prior.lastSealedFingerprint ?? null });
      return { status: current.dirty ? "waiting-for-silence" : "observing", sealed: false, silentForMs, current, branchTips };
    }
    const reason = force ? "manual" : headChanged ? "external-commit" : "two-minute-silence";
    const result = await this.history.recordTurn({
      taskId: "external-change",
      turnId: `${reason}:${current.fingerprint}`,
      status: "completed",
      featureName: "外部变化",
      source: "external",
      summary: headChanged ? current.headSubject : undefined,
      snapshotOptions: { skipIfUnchanged: headChanged ? false : true }
    });
    if (result.failed) return { status: "failed", sealed: false, reason, current, branchTips };
    await this.observer.updateExternal({ ...current, firstSeenAt: nowIso, lastSeenAt: nowIso, lastSealedFingerprint: current.fingerprint });
    return { status: "sealed", sealed: true, reason, current, index: result.index, branchTips };
  }
}
