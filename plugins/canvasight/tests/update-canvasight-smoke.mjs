import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { cp, mkdir, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  compareVersions,
  main,
  needsCommandShell,
  resolveCodexCommand,
} from "../scripts/update-canvasight.mjs";

const OLD_SHA = "1".repeat(40);
const NEW_SHA = "2".repeat(40);
const OFFICIAL = "https://github.com/Niall-Young/Canvasight.git";

function releaseFetch({ version = "0.4.11", stableSha = NEW_SHA, tagSha = NEW_SHA } = {}) {
  return async (url) => {
    if (url.endsWith("/releases/latest")) {
      return new Response(JSON.stringify({
        tag_name: `v${version}`,
        draft: false,
        prerelease: false,
        html_url: `https://github.com/Niall-Young/Canvasight/releases/tag/v${version}`,
      }), { status: 200 });
    }
    if (url.endsWith("/commits/stable")) {
      return new Response(JSON.stringify({ sha: stableSha }), { status: 200 });
    }
    if (url.endsWith(`/commits/${encodeURIComponent(`v${version}`)}`)) {
      return new Response(JSON.stringify({ sha: tagSha }), { status: 200 });
    }
    return new Response("not found", { status: 404 });
  };
}

function createCodex({
  version = "0.4.10+codex.20260713151335",
  candidateVersion = "0.4.11",
  sourceType = "git",
  source = OFFICIAL,
  ref = "stable",
  failInstall = false,
  failRollback = false,
  failPostVerify = false,
  onInstall = null,
} = {}) {
  const commands = [];
  let currentVersion = version;
  let currentCandidate = version;
  let currentSourceType = sourceType;
  let currentSource = source;
  let currentRef = ref;
  let currentCommit = OLD_SHA;
  let removed = false;
  let failedNewInstall = false;
  let wrongVerificationPending = false;

  const runner = async (...args) => {
    const key = args.join(" ");
    if (key === "plugin list --available --json") {
      const reportedVersion = wrongVerificationPending ? version : currentVersion;
      wrongVerificationPending = false;
      return {
        installed: [{
          pluginId: "canvasight@canvasight-local",
          marketplaceName: "canvasight-local",
          version: reportedVersion,
          installed: true,
          enabled: true,
          marketplaceSource: { sourceType: currentSourceType, source: currentSource },
        }],
        available: currentCandidate === currentVersion ? [] : [{
          pluginId: "canvasight@canvasight-local",
          marketplaceName: "canvasight-local",
          version: currentCandidate,
          installed: false,
          enabled: false,
          marketplaceSource: { sourceType: currentSourceType, source: currentSource },
        }],
      };
    }
    if (key === "plugin marketplace list --json") {
      return {
        marketplaces: removed ? [] : [{
          name: "canvasight-local",
          root: "/does/not/matter",
          ref: currentRef,
          commit: currentCommit,
          marketplaceSource: { sourceType: currentSourceType, source: currentSource },
        }],
      };
    }

    commands.push(args);
    if (args.slice(0, 4).join(" ") === "plugin marketplace upgrade canvasight-local") {
      currentCandidate = candidateVersion;
      currentCommit = NEW_SHA;
      return { upgraded: true };
    }
    if (args.slice(0, 4).join(" ") === "plugin marketplace remove canvasight-local") {
      removed = true;
      return { removed: true };
    }
    if (args.slice(0, 3).join(" ") === "plugin marketplace add") {
      const requestedSource = args[3];
      const refIndex = args.indexOf("--ref");
      const requestedRef = refIndex >= 0 ? args[refIndex + 1] : null;
      if (failRollback && requestedRef === OLD_SHA) throw new Error("simulated rollback failure");
      removed = false;
      currentSourceType = "git";
      currentSource = requestedSource;
      currentRef = requestedRef;
      currentCommit = requestedRef === OLD_SHA ? OLD_SHA : NEW_SHA;
      currentCandidate = requestedRef === OLD_SHA ? version : candidateVersion;
      return { added: true };
    }
    if (args.slice(0, 3).join(" ") === "plugin add canvasight@canvasight-local") {
      if (failInstall && currentCandidate === candidateVersion && !failedNewInstall) {
        failedNewInstall = true;
        throw new Error("simulated install failure");
      }
      currentVersion = currentCandidate;
      if (onInstall) await onInstall({ currentVersion, isRollback: currentVersion === version });
      if (failPostVerify && currentVersion === candidateVersion) wrongVerificationPending = true;
      return { installed: true, version: currentVersion };
    }
    throw new Error(`Unexpected fake codex command: ${key}`);
  };
  return { runner, commands, state: () => ({ currentVersion, currentRef, currentCommit }) };
}

async function digestTree(root) {
  const hash = createHash("sha256");
  async function visit(directory, prefix = "") {
    const entries = await readdir(directory, { withFileTypes: true });
    entries.sort((left, right) => left.name.localeCompare(right.name));
    for (const entry of entries) {
      const relative = path.join(prefix, entry.name);
      hash.update(relative);
      if (entry.isDirectory()) await visit(path.join(directory, entry.name), relative);
      else hash.update(await readFile(path.join(directory, entry.name)));
    }
  }
  await visit(root);
  return hash.digest("hex");
}

const env = { CANVASIGHT_RELEASE_API_URL: "https://example.test/releases/latest" };

test("semver comparison ignores build metadata and never treats it as an upgrade", () => {
  assert.equal(compareVersions("0.4.11+codex.123", "0.4.11"), 0);
  assert.equal(compareVersions("0.4.12", "0.4.11"), 1);
  assert.equal(compareVersions("0.4.10", "0.4.11"), -1);
});

test("already latest performs zero mutating Codex commands and has no restart prompt", async () => {
  const codex = createCodex({
    version: "0.4.11+local.1",
    candidateVersion: "0.4.11",
    sourceType: "local",
    ref: "main",
  });
  const result = await main(["--update"], { runner: codex.runner, fetchImpl: releaseFetch(), env });
  assert.equal(result.status, "up_to_date");
  assert.equal(result.restartRequired, undefined);
  assert.doesNotMatch(result.message, /restart|reload|重启|重新加载|新建任务|@Canvasight/i);
  assert.deepEqual(codex.commands, []);
});

test("check reports an update but never mutates even for a local checkout", async () => {
  const codex = createCodex({ sourceType: "local", source: "/workspace/Canvasight" });
  const result = await main(["--check"], { runner: codex.runner, fetchImpl: releaseFetch(), env });
  assert.equal(result.status, "update_available");
  assert.equal(result.canUpdate, false);
  assert.deepEqual(codex.commands, []);
});

test("update refuses a local checkout without touching it", async () => {
  const codex = createCodex({ sourceType: "local", source: "/workspace/Canvasight" });
  const result = await main(["--update"], { runner: codex.runner, fetchImpl: releaseFetch(), env });
  assert.equal(result.status, "local_source");
  assert.deepEqual(codex.commands, []);
});

test("update refuses custom repositories and development refs", async () => {
  const fork = createCodex({ source: "https://github.com/example/Canvasight.git" });
  const forkResult = await main(["--update"], { runner: fork.runner, fetchImpl: releaseFetch(), env });
  assert.equal(forkResult.status, "unsupported_source");
  assert.deepEqual(fork.commands, []);

  const branch = createCodex({ ref: "feature/custom" });
  const branchResult = await main(["--update"], { runner: branch.runner, fetchImpl: releaseFetch(), env });
  assert.equal(branchResult.status, "unsupported_source");
  assert.deepEqual(branch.commands, []);
});

test("versions ahead of the release are not downgraded", async () => {
  const codex = createCodex({ version: "0.5.0" });
  const result = await main(["--update"], { runner: codex.runner, fetchImpl: releaseFetch(), env });
  assert.equal(result.status, "ahead_of_release");
  assert.doesNotMatch(result.message, /restart|reload|重启|重新加载|新建任务|@Canvasight/i);
  assert.deepEqual(codex.commands, []);
});

test("official stable update refreshes, verifies, installs the whole plugin, then requests restart", async () => {
  const codex = createCodex();
  const result = await main(["--update"], { runner: codex.runner, fetchImpl: releaseFetch(), env });
  assert.equal(result.status, "updated");
  assert.equal(result.currentVersion, "0.4.11");
  assert.equal(result.restartRequired, true);
  assert.match(result.message, /重启|重新加载/);
  assert.deepEqual(codex.commands.map((args) => args.slice(0, 3).join(" ")), [
    "plugin marketplace upgrade",
    "plugin add canvasight@canvasight-local",
  ]);
});

test("a successful add replaces Skill, MCP, and web sentinels while user data remains byte-identical", async () => {
  const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), "canvasight-update-snapshot-"));
  const installedRoot = path.join(temporaryRoot, "installed");
  const releaseRoot = path.join(temporaryRoot, "release");
  const protectedRoot = path.join(temporaryRoot, "protected-user-data");
  const sentinels = [
    "skills/canvasight/SKILL.md",
    "mcp/server.mjs",
    "dist/index.html",
  ];
  try {
    for (const relative of sentinels) {
      await mkdir(path.dirname(path.join(installedRoot, relative)), { recursive: true });
      await mkdir(path.dirname(path.join(releaseRoot, relative)), { recursive: true });
      await writeFile(path.join(installedRoot, relative), `old:${relative}`);
      await writeFile(path.join(releaseRoot, relative), `new:${relative}`);
    }
    await mkdir(path.join(protectedRoot, "project", ".scatter", "assets"), { recursive: true });
    await mkdir(path.join(protectedRoot, "home", ".canvasight"), { recursive: true });
    await writeFile(
      path.join(protectedRoot, "project", ".scatter", "scatter.json"),
      '{"pages":[{"id":"kept"}]}',
    );
    await writeFile(
      path.join(protectedRoot, "project", ".scatter", "assets", "attachment.bin"),
      Buffer.from([0, 1, 2, 3]),
    );
    await writeFile(path.join(protectedRoot, "home", ".canvasight", "runtime.json"), '{"kept":true}');
    const protectedDigest = await digestTree(protectedRoot);

    const codex = createCodex({
      onInstall: async ({ isRollback }) => {
        if (!isRollback) await cp(releaseRoot, installedRoot, { recursive: true, force: true });
      },
    });
    const result = await main(["--update"], { runner: codex.runner, fetchImpl: releaseFetch(), env });
    assert.equal(result.status, "updated");
    for (const relative of sentinels) {
      assert.equal(await readFile(path.join(installedRoot, relative), "utf8"), `new:${relative}`);
    }
    assert.equal(await digestTree(protectedRoot), protectedDigest);
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true });
  }
});

test("main source migrates to stable only when an update actually exists", async () => {
  const codex = createCodex({ ref: "main" });
  const result = await main(["--update"], { runner: codex.runner, fetchImpl: releaseFetch(), env });
  assert.equal(result.status, "updated");
  assert.deepEqual(codex.commands.slice(0, 2).map((args) => args.slice(0, 3).join(" ")), [
    "plugin marketplace remove",
    "plugin marketplace add",
  ]);
  assert.equal(codex.state().currentRef, "stable");
});

test("release and stable must resolve to the same Git commit before mutation", async () => {
  const codex = createCodex();
  const result = await main(["--update"], {
    runner: codex.runner,
    fetchImpl: releaseFetch({ stableSha: OLD_SHA }),
    env,
  });
  assert.equal(result.status, "release_mismatch");
  assert.equal(result.recovered, true);
  assert.match(result.error, /do not point to the same commit/);
  assert.doesNotMatch(result.message, /restart|reload|重启|重新加载|新建任务|@Canvasight/i);
  assert.deepEqual(codex.commands, []);
});

test("an unrecognized installed version fails closed before mutation", async () => {
  const codex = createCodex({ version: "development-build" });
  const result = await main(["--update"], { runner: codex.runner, fetchImpl: releaseFetch(), env });
  assert.equal(result.status, "version_unknown");
  assert.deepEqual(codex.commands, []);
  assert.doesNotMatch(result.message, /restart|reload|重启|重新加载|新建任务|@Canvasight/i);
});

test("stable manifest mismatch rolls the marketplace and plugin back to the previous SHA", async () => {
  const codex = createCodex({ candidateVersion: "0.4.12" });
  const result = await main(["--update"], { runner: codex.runner, fetchImpl: releaseFetch(), env });
  assert.equal(result.status, "release_mismatch");
  assert.equal(result.recovered, true);
  assert.ok(result.recovery.includes(`restored_snapshot:${OLD_SHA}`));
  assert.equal(codex.state().currentVersion, "0.4.10+codex.20260713151335");
  assert.equal(codex.state().currentRef, "stable");
});

test("install failure and post-install verification failure both restore the old version", async () => {
  for (const options of [{ failInstall: true }, { failPostVerify: true }]) {
    const codex = createCodex(options);
    const result = await main(["--update"], { runner: codex.runner, fetchImpl: releaseFetch(), env });
    assert.equal(result.status, "update_failed");
    assert.equal(result.recovered, true);
    assert.equal(codex.state().currentVersion, "0.4.10+codex.20260713151335");
  }
});

test("rollback failures are explicit and never claim success", async () => {
  const codex = createCodex({ failInstall: true, failRollback: true });
  const result = await main(["--update"], { runner: codex.runner, fetchImpl: releaseFetch(), env });
  assert.equal(result.status, "rollback_failed");
  assert.equal(result.recovered, false);
  assert.match(result.rollbackError, /simulated rollback failure/);
  assert.doesNotMatch(result.message, /restart|reload|重启|重新加载|新建任务|@Canvasight/i);
});

test("Windows uses codex.cmd unless an explicit test or operator override is provided", () => {
  assert.equal(resolveCodexCommand({ platform: "win32", env: {} }), "codex.cmd");
  assert.equal(needsCommandShell("codex.cmd", "win32"), true);
  assert.equal(needsCommandShell("C:\\tools\\codex.exe", "win32"), false);
  assert.equal(needsCommandShell("codex", "linux"), false);
  assert.equal(resolveCodexCommand({ platform: "linux", env: {} }), "codex");
  assert.equal(
    resolveCodexCommand({ platform: "win32", env: { CANVASIGHT_CODEX_BIN: "C:\\tools\\codex.exe" } }),
    "C:\\tools\\codex.exe",
  );
});
