#!/usr/bin/env node
import process from "node:process";
import { compareGitProjectIdentities, PROJECT_HISTORY_CONTRACT_VERSION } from "../mcp/domain/project-history-contract.mjs";
import { probeGitProjectIdentity } from "../mcp/infrastructure/git-project-identity.mjs";

const projectPaths = process.argv.slice(2);
const targets = projectPaths.length > 0 ? projectPaths : [process.cwd()];

try {
  const projects = await Promise.all(targets.map((projectPath) => probeGitProjectIdentity(projectPath)));
  const comparisons = projects.slice(1).map((project, index) => ({
    leftIndex: 0,
    rightIndex: index + 1,
    ...compareGitProjectIdentities(projects[0], project)
  }));
  const status = comparisons.length === 0
    ? "inconclusive"
    : comparisons.every((comparison) => comparison.sameLocalProject)
      ? "passed"
      : "failed";
  process.stdout.write(`${JSON.stringify({
    probe: "R0-01 ProjectIdentity",
    contractVersion: PROJECT_HISTORY_CONTRACT_VERSION,
    status,
    projects,
    comparisons
  }, null, 2)}\n`);
  if (status === "failed") process.exitCode = 2;
} catch (error) {
  process.stderr.write(`${JSON.stringify({
    probe: "R0-01 ProjectIdentity",
    contractVersion: PROJECT_HISTORY_CONTRACT_VERSION,
    status: "error",
    error: error instanceof Error ? error.message : String(error)
  }, null, 2)}\n`);
  process.exitCode = 1;
}
