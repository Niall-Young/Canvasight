#!/usr/bin/env node
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import os from "node:os";
import path from "node:path";
import { daemonNodeExecutableCandidates } from "../mcp/infrastructure/node-executable-candidates.mjs";

const macCandidates = daemonNodeExecutableCandidates({
  env: {
    CANVASIGHT_NODE_BIN: "/configured/node",
    VOLTA_HOME: "/managed/volta",
    NVM_BIN: "/managed/nvm/bin",
    FNM_MULTISHELL_PATH: "/managed/fnm",
    HOMEBREW_PREFIX: "/managed/brew",
    MISE_DATA_DIR: "/managed/mise"
  },
  execPath: "/removed/version-manager/node",
  platform: "darwin",
  homeDirectory: "/Users/canvasight"
});

assert.deepEqual(macCandidates.slice(0, 4), [
  { executable: "/configured/node", source: "configured" },
  { executable: "node", source: "path" },
  { executable: "/removed/version-manager/node", source: "process_exec_path" },
  { executable: "/managed/volta/bin/node", source: "volta_home" }
]);
assert.equal(macCandidates.some((item) => item.executable === "/Users/canvasight/.volta/bin/node"), true);
assert.equal(macCandidates.some((item) => item.executable === "/Users/canvasight/.local/share/mise/shims/node"), true);
assert.equal(macCandidates.some((item) => item.executable === "/opt/homebrew/bin/node" && item.source === "homebrew_apple_silicon"), true);
assert.equal(new Set(macCandidates.map((item) => item.executable)).size, macCandidates.length);

const windowsCandidates = daemonNodeExecutableCandidates({
  env: { ProgramFiles: "C:\\Program Files", LOCALAPPDATA: "C:\\Users\\canvasight\\AppData\\Local" },
  execPath: "C:\\removed\\node.exe",
  platform: "win32",
  homeDirectory: "C:\\Users\\canvasight"
});
assert.equal(windowsCandidates.some((item) => item.executable === "C:\\Program Files\\nodejs\\node.exe"), true);
assert.equal(windowsCandidates.some((item) => item.executable === "C:\\Users\\canvasight\\AppData\\Local\\Programs\\nodejs\\node.exe"), true);

const guiLikeEnvironment = {
  HOME: os.homedir(),
  ProgramFiles: process.env.ProgramFiles,
  LOCALAPPDATA: process.env.LOCALAPPDATA
};
const guiFallbackCandidates = daemonNodeExecutableCandidates({
  env: guiLikeEnvironment,
  execPath: path.join(os.tmpdir(), "removed-canvasight-node"),
  platform: process.platform,
  homeDirectory: os.homedir()
});
const workingFallback = guiFallbackCandidates.find((candidate) => {
  const probe = spawnSync(candidate.executable, ["--version"], { env: guiLikeEnvironment, encoding: "utf8" });
  return probe.status === 0 && /^v\d+/u.test(probe.stdout.trim());
});
assert.ok(workingFallback, "a GUI-like environment with no PATH and a stale execPath must still find Node");
assert.notEqual(workingFallback.source, "path");
assert.notEqual(workingFallback.source, "process_exec_path");

process.stdout.write("Canvasight daemon Node executable candidate smoke passed.\n");
