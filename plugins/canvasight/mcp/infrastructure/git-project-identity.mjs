import { execFile } from "node:child_process";
import fsp from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { buildGitProjectIdentity } from "../domain/project-history-contract.mjs";

const execFileAsync = promisify(execFile);

async function git(cwd, args, { optionalExitCodes = [] } = {}) {
  try {
    const { stdout } = await execFileAsync("git", ["-C", cwd, ...args], {
      encoding: "utf8",
      maxBuffer: 4 * 1024 * 1024
    });
    return stdout.trim();
  } catch (error) {
    if (optionalExitCodes.includes(Number(error?.code))) return "";
    const detail = String(error?.stderr || error?.message || error).trim();
    throw new Error(`Project History Git probe failed for ${args.join(" ")}: ${detail}`, { cause: error });
  }
}

function lines(value) {
  return String(value || "").split(/\r?\n/u).map((item) => item.trim()).filter(Boolean);
}

async function canonicalPath(value, base) {
  const resolved = path.isAbsolute(value) ? value : path.resolve(base, value);
  return fsp.realpath(resolved);
}

export async function probeGitProjectIdentity(projectPath) {
  const cwd = await fsp.realpath(path.resolve(projectPath));
  const insideWorktree = await git(cwd, ["rev-parse", "--is-inside-work-tree"]);
  if (insideWorktree !== "true") throw new Error("Project History requires a Git worktree for this probe");

  const worktreeRoot = await canonicalPath(await git(cwd, ["rev-parse", "--show-toplevel"]), cwd);
  const gitCommonDir = await canonicalPath(await git(cwd, ["rev-parse", "--git-common-dir"]), worktreeRoot);
  const isShallow = await git(cwd, ["rev-parse", "--is-shallow-repository"]) === "true";
  const head = await git(cwd, ["rev-parse", "--verify", "HEAD"], { optionalExitCodes: [1, 128] });
  const rootCommits = head ? lines(await git(cwd, ["rev-list", "--max-parents=0", "HEAD"])) : [];
  const remoteConfig = lines(await git(cwd, ["config", "--get-regexp", "^remote\\..*\\.url$"], { optionalExitCodes: [1] }));
  const remoteUrls = remoteConfig.map((line) => line.replace(/^\S+\s+/u, "")).filter(Boolean);

  return buildGitProjectIdentity({
    gitCommonDir,
    worktreeRoot,
    rootCommits,
    remoteUrls,
    isShallow
  });
}
