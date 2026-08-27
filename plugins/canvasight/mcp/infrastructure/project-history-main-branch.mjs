import { spawn } from "node:child_process";

const ZERO_OID = "0".repeat(40);

async function git(projectPath, args, { optionalExitCodes = [] } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn("git", ["-C", projectPath, ...args], { stdio: ["ignore", "pipe", "pipe"] });
    const stdout = [];
    const stderr = [];
    child.stdout.on("data", (chunk) => stdout.push(chunk));
    child.stderr.on("data", (chunk) => stderr.push(chunk));
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) return resolve(Buffer.concat(stdout).toString("utf8").trim());
      if (optionalExitCodes.includes(code)) return resolve("");
      reject(new Error(`git ${args.join(" ")} failed (${code}): ${Buffer.concat(stderr).toString("utf8").trim()}`));
    });
  });
}

async function commitFor(projectPath, revision) {
  if (!revision) return "";
  return git(projectPath, ["rev-parse", "--verify", `${revision}^{commit}`], { optionalExitCodes: [1, 128] });
}

export async function readProjectHistoryGitState(projectPath) {
  const [mainCommit, currentBranch, headCommit] = await Promise.all([
    commitFor(projectPath, "refs/heads/main"),
    git(projectPath, ["branch", "--show-current"]),
    commitFor(projectPath, "HEAD")
  ]);
  return {
    mainBranch: mainCommit ? "main" : null,
    mainCommit: mainCommit || null,
    currentBranch: currentBranch || null,
    headCommit: headCommit || null,
    detached: Boolean(headCommit && !currentBranch)
  };
}

export async function ensureLocalMainBranch(projectPath, { fallbackCommit = null } = {}) {
  const existing = await readProjectHistoryGitState(projectPath);
  if (existing.mainCommit) return { ...existing, created: false, source: "refs/heads/main" };

  const remoteRefs = (await git(projectPath, ["for-each-ref", "--format=%(refname:short)", "refs/remotes"]))
    .split(/\r?\n/u)
    .filter((ref) => ref && !ref.endsWith("/HEAD") && ref.endsWith("/main"));
  const orderedRemoteRefs = [
    "origin/main",
    "upstream/main",
    ...remoteRefs.filter((ref) => ref !== "origin/main" && ref !== "upstream/main").sort()
  ];
  const candidates = [
    ...orderedRemoteRefs,
    "refs/heads/master",
    "HEAD",
    fallbackCommit
  ].filter(Boolean);

  let source = "";
  let commit = "";
  for (const candidate of candidates) {
    commit = await commitFor(projectPath, candidate);
    if (commit) {
      source = candidate;
      break;
    }
  }
  if (!commit) throw new Error("Project History could not create main because the repository has no commit yet");

  await git(projectPath, ["update-ref", "refs/heads/main", commit, ZERO_OID]);
  return {
    ...(await readProjectHistoryGitState(projectPath)),
    created: true,
    source,
    mainBranch: "main",
    mainCommit: commit
  };
}
