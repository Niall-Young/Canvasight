import fsp from "node:fs/promises";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const DEFAULT_EXCLUDED_DIRECTORIES = new Set([".git", "node_modules", "dist", "build", ".cache", ".next", "coverage"]);
const SENSITIVE_PATTERN = /(^|\/)(?:\.env(?:\..*)?|[^/]+\.(?:pem|key|p12|pfx))$/iu;

export async function isGitWorktree(projectPath) {
  try {
    const { stdout } = await execFileAsync("git", ["-C", path.resolve(projectPath), "rev-parse", "--is-inside-work-tree"], { encoding: "utf8" });
    return stdout.trim() === "true";
  } catch {
    return false;
  }
}

export async function scanProjectBootstrapScope(projectPath, { maxEntries = 20_000 } = {}) {
  const root = await fsp.realpath(path.resolve(projectPath));
  const result = { projectPath: root, fileCount: 0, directoryCount: 0, sensitiveCount: 0, excludedDirectoryCount: 0, truncated: false };
  const pending = [root];
  let entries = 0;
  while (pending.length > 0) {
    const current = pending.pop();
    const children = await fsp.readdir(current, { withFileTypes: true });
    for (const child of children) {
      entries += 1;
      if (entries > maxEntries) {
        result.truncated = true;
        return result;
      }
      const absolute = path.join(current, child.name);
      const relative = path.relative(root, absolute).split(path.sep).join("/");
      if (child.isSymbolicLink()) continue;
      if (child.isDirectory()) {
        if (DEFAULT_EXCLUDED_DIRECTORIES.has(child.name)) result.excludedDirectoryCount += 1;
        else {
          result.directoryCount += 1;
          pending.push(absolute);
        }
      } else if (child.isFile()) {
        result.fileCount += 1;
        if (SENSITIVE_PATTERN.test(relative)) result.sensitiveCount += 1;
      }
    }
  }
  return result;
}

export async function initializeLocalGitRepository(projectPath, { confirmed = false } = {}) {
  if (confirmed !== true) throw new Error("explicit confirmation is required before Git initialization");
  const root = await fsp.realpath(path.resolve(projectPath));
  if (await isGitWorktree(root)) return { initialized: false, alreadyGit: true, projectPath: root };
  await execFileAsync("git", ["-C", root, "init", "-b", "main"], { encoding: "utf8" });
  if (!(await isGitWorktree(root))) throw new Error("Git initialization did not produce a worktree");
  return { initialized: true, alreadyGit: false, projectPath: root };
}
