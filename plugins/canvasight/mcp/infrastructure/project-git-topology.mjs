import { spawn } from "node:child_process";

const DEFAULT_COMMIT_LIMIT = 1000;

async function git(projectPath, args, { optionalExitCodes = [] } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn("git", ["-C", projectPath, ...args], { stdio: ["ignore", "pipe", "pipe"] });
    const stdout = [];
    const stderr = [];
    child.stdout.on("data", (chunk) => stdout.push(chunk));
    child.stderr.on("data", (chunk) => stderr.push(chunk));
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) return resolve(Buffer.concat(stdout).toString("utf8"));
      if (optionalExitCodes.includes(code)) return resolve("");
      reject(new Error(`git ${args.join(" ")} failed (${code}): ${Buffer.concat(stderr).toString("utf8").trim()}`));
    });
  });
}

function normalizedText(value, maxLength) {
  return String(value || "").replace(/[\u0000-\u001f\u007f]+/gu, " ").replace(/\s+/gu, " ").trim().slice(0, maxLength);
}

function refKind(refName) {
  if (refName.startsWith("refs/heads/")) return "local-branch";
  if (refName.startsWith("refs/remotes/")) return "remote-branch";
  return "tag";
}

function shortRefName(refName) {
  return refName
    .replace(/^refs\/heads\//u, "")
    .replace(/^refs\/remotes\//u, "")
    .replace(/^refs\/tags\//u, "");
}

function parseRefs(raw, currentBranch) {
  return raw.split(/\r?\n/u).filter(Boolean).map((line) => {
    const [name, objectId, peeledObjectId] = line.split("\u001f");
    const commit = peeledObjectId || objectId;
    const kind = refKind(name);
    return {
      name,
      shortName: shortRefName(name),
      kind,
      commit,
      current: kind === "local-branch" && shortRefName(name) === currentBranch
    };
  }).filter((ref) => ref.commit && !ref.name.endsWith("/HEAD"));
}

function parseCommits(raw, refsByCommit, mainCommits, mainlineCommits, headCommit) {
  return raw.split("\u001e").map((record) => record.trim()).filter(Boolean).map((record) => {
    const [id, parentText, committedAtSeconds, author, ...subjectParts] = record.split("\u001f");
    const parents = parentText.trim() ? parentText.trim().split(/\s+/u) : [];
    const seconds = Number(committedAtSeconds);
    const subject = normalizedText(subjectParts.join(" "), 160) || "Untitled commit";
    return {
      id,
      shortId: id.slice(0, 8),
      parents,
      subject,
      author: normalizedText(author, 80) || "Unknown author",
      committedAt: Number.isFinite(seconds) ? new Date(seconds * 1000).toISOString() : new Date(0).toISOString(),
      refs: refsByCommit.get(id) ?? [],
      isHead: id === headCommit,
      isOnMain: mainCommits.has(id),
      isOnMainline: mainlineCommits.has(id),
      isCanvasightGenerated: subject.startsWith("Canvasight Project History turn "),
      isMerge: parents.length > 1
    };
  });
}

function workingTreeState(raw) {
  const entries = raw.split("\u0000").filter(Boolean);
  let stagedCount = 0;
  let unstagedCount = 0;
  let untrackedCount = 0;
  let changeCount = 0;
  for (let index = 0; index < entries.length; index += 1) {
    const entry = entries[index];
    const status = entry.slice(0, 2);
    const firstPath = entry.slice(3).replaceAll("\\", "/");
    const renamed = /[RC]/u.test(status) && index + 1 < entries.length;
    const secondPath = renamed ? entries[index + 1].replaceAll("\\", "/") : null;
    if (renamed) index += 1;
    const internal = (value) => value === ".scatter" || value?.startsWith(".scatter/");
    if (internal(firstPath) && (!secondPath || internal(secondPath))) continue;
    changeCount += 1;
    if (status === "??") {
      untrackedCount += 1;
      continue;
    }
    if (status[0] && status[0] !== " ") stagedCount += 1;
    if (status[1] && status[1] !== " ") unstagedCount += 1;
  }
  return {
    dirty: changeCount > 0,
    changeCount,
    stagedCount,
    unstagedCount,
    untrackedCount
  };
}

function topologyKind(commits) {
  const childCounts = new Map();
  for (const commit of commits) {
    for (const parent of commit.parents) childCounts.set(parent, (childCounts.get(parent) ?? 0) + 1);
  }
  return commits.some((commit) => commit.isMerge) || [...childCounts.values()].some((count) => count > 1)
    ? "branched"
    : "linear";
}

function mergeStatus({ currentBranch, headCommit, mainCommit, ahead, behind, workingTree }) {
  if (!mainCommit) return "main-unavailable";
  if (workingTree.dirty) return "uncommitted";
  if (!headCommit || headCommit === mainCommit || currentBranch === "main") return "up-to-date";
  if (ahead > 0 && behind > 0) return "diverged";
  if (ahead > 0) return "ready-to-merge";
  if (behind > 0) return "behind-main";
  return "up-to-date";
}

export async function readProjectGitTopology(projectPath, { limit = DEFAULT_COMMIT_LIMIT } = {}) {
  const boundedLimit = Number.isInteger(limit) && limit > 0 ? Math.min(limit, 5000) : DEFAULT_COMMIT_LIMIT;
  const [currentBranchRaw, headCommitRaw, refsRaw, statusRaw] = await Promise.all([
    git(projectPath, ["branch", "--show-current"]),
    git(projectPath, ["rev-parse", "--verify", "HEAD^{commit}"], { optionalExitCodes: [1, 128] }),
    git(projectPath, ["for-each-ref", "--format=%(refname)%1f%(objectname)%1f%(*objectname)", "refs/heads", "refs/remotes", "refs/tags"]),
    git(projectPath, ["status", "--porcelain=v1", "-z", "--untracked-files=all"])
  ]);
  const currentBranch = currentBranchRaw.trim() || null;
  const headCommit = headCommitRaw.trim() || null;
  const refs = parseRefs(refsRaw, currentBranch);
  const roots = [...new Set(refs.map((ref) => ref.name))];
  if (headCommit && roots.length === 0) roots.push("HEAD");
  if (!headCommit || roots.length === 0) {
    const workingTree = workingTreeState(statusRaw);
    return {
      schemaVersion: 1,
      commits: [],
      refs,
      totalCommitCount: 0,
      truncated: false,
      topology: "linear",
      mergeStatus: "main-unavailable",
      currentBranch,
      headCommit,
      mainCommit: null,
      ahead: 0,
      behind: 0,
      workingTree
    };
  }

  const mainCommit = refs.find((ref) => ref.name === "refs/heads/main")?.commit ?? null;
  const [commitCountRaw, logRaw, mainListRaw, mainlineListRaw, aheadBehindRaw] = await Promise.all([
    git(projectPath, ["rev-list", "--count", ...roots]),
    git(projectPath, ["log", "--topo-order", "--date-order", `--max-count=${boundedLimit}`, "--format=%x1e%H%x1f%P%x1f%ct%x1f%an%x1f%s", ...roots]),
    mainCommit ? git(projectPath, ["rev-list", `--max-count=${boundedLimit}`, "refs/heads/main"]) : Promise.resolve(""),
    mainCommit ? git(projectPath, ["rev-list", "--first-parent", `--max-count=${boundedLimit}`, "refs/heads/main"]) : Promise.resolve(""),
    mainCommit ? git(projectPath, ["rev-list", "--left-right", "--count", "refs/heads/main...HEAD"]) : Promise.resolve("0\t0")
  ]);
  const totalCommitCount = Number.parseInt(commitCountRaw.trim(), 10) || 0;
  const mainCommits = new Set(mainListRaw.split(/\r?\n/u).filter(Boolean));
  const mainlineCommits = new Set(mainlineListRaw.split(/\r?\n/u).filter(Boolean));
  const refsByCommit = new Map();
  for (const ref of refs) {
    const list = refsByCommit.get(ref.commit) ?? [];
    list.push({ name: ref.shortName, kind: ref.kind, current: ref.current });
    refsByCommit.set(ref.commit, list);
  }
  const commits = parseCommits(logRaw, refsByCommit, mainCommits, mainlineCommits, headCommit);
  const [behindText, aheadText] = aheadBehindRaw.trim().split(/\s+/u);
  const behind = Number.parseInt(behindText, 10) || 0;
  const ahead = Number.parseInt(aheadText, 10) || 0;
  const workingTree = workingTreeState(statusRaw);
  return {
    schemaVersion: 1,
    commits,
    refs,
    totalCommitCount,
    truncated: totalCommitCount > commits.length,
    topology: topologyKind(commits),
    mergeStatus: mergeStatus({ currentBranch, headCommit, mainCommit, ahead, behind, workingTree }),
    currentBranch,
    headCommit,
    mainCommit,
    ahead,
    behind,
    workingTree
  };
}
