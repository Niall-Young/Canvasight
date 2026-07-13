#!/usr/bin/env node
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { access, cp, mkdtemp, readdir, realpath, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const sourcePluginRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), "canvasight-plugin-distribution-"));
const installedPluginRoot = path.join(temporaryRoot, "canvasight");
const excludedDirectoryNames = new Set(["node_modules", ".cache", "cache", "caches"]);

function copyFilter(sourcePath) {
  const relativePath = path.relative(sourcePluginRoot, sourcePath);
  if (!relativePath) return true;
  return !relativePath.split(path.sep).some((segment) => excludedDirectoryNames.has(segment));
}

async function findExcludedDirectories(root) {
  const found = [];
  const pending = [root];
  while (pending.length > 0) {
    const current = pending.pop();
    const entries = await readdir(current, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const entryPath = path.join(current, entry.name);
      if (excludedDirectoryNames.has(entry.name)) {
        found.push(path.relative(root, entryPath));
      } else {
        pending.push(entryPath);
      }
    }
  }
  return found;
}

try {
  await cp(sourcePluginRoot, installedPluginRoot, {
    recursive: true,
    force: true,
    filter: copyFilter
  });

  await assert.rejects(
    access(path.join(installedPluginRoot, "node_modules")),
    (error) => error?.code === "ENOENT",
    "distribution fixture unexpectedly contains a root node_modules directory"
  );
  assert.deepEqual(
    await findExcludedDirectories(installedPluginRoot),
    [],
    "distribution fixture unexpectedly contains dependency or cache directories"
  );

  const probePath = path.join(installedPluginRoot, "tests", "mcp-registration-probe.mjs");
  const probe = spawnSync(process.execPath, [probePath], {
    cwd: installedPluginRoot,
    env: {
      ...process.env,
      CANVASIGHT_MCP_PROBE_TIMEOUT_MS: process.env.CANVASIGHT_MCP_PROBE_TIMEOUT_MS || "20000"
    },
    encoding: "utf8",
    timeout: 30_000,
    maxBuffer: 10 * 1024 * 1024,
    windowsHide: true
  });

  assert.equal(
    probe.status,
    0,
    `installed MCP registration probe failed: ${probe.error?.message || probe.stderr || probe.stdout}`
  );

  const diagnostic = JSON.parse(probe.stdout);
  assert.equal(diagnostic.ok, true, "installed MCP registration probe did not report success");
  assert.equal(
    await realpath(diagnostic.cwd),
    await realpath(installedPluginRoot),
    "registration probe did not execute from the copied plugin"
  );
  const toolsStage = diagnostic.stages?.find((stage) => stage.stage === "tools_list_ok");
  assert.ok(toolsStage, "installed MCP registration probe did not complete tools/list");
  assert.equal(toolsStage.toolCount, 15, "installed MCP server must expose exactly 15 tools");
  assert.equal(
    toolsStage.requiredToolsPresent,
    true,
    "installed MCP server is missing open_canvasight or await_canvasight_widget_ready"
  );

  console.log(
    `Canvasight clean distribution smoke passed (${toolsStage.toolCount} tools, no node_modules or caches).`
  );
} finally {
  await rm(temporaryRoot, { recursive: true, force: true });
}
