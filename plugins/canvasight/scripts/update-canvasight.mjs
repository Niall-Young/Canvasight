#!/usr/bin/env node

import { spawn } from "node:child_process";
import { pathToFileURL } from "node:url";

const PLUGIN_ID = "canvasight@canvasight-local";
const MARKETPLACE_NAME = "canvasight-local";
const OFFICIAL_REPOSITORY = "https://github.com/Niall-Young/Canvasight.git";
const OFFICIAL_RELEASE_API = "https://api.github.com/repos/Niall-Young/Canvasight/releases/latest";
const STABLE_REF = "stable";

function normalizeRepository(source) {
  if (typeof source !== "string") return "";
  return source
    .trim()
    .replace(/^git@github\.com:/i, "https://github.com/")
    .replace(/^ssh:\/\/git@github\.com\//i, "https://github.com/")
    .replace(/\/$/, "")
    .replace(/\.git$/i, "")
    .toLowerCase();
}

function isOfficialRepository(source) {
  return normalizeRepository(source) === normalizeRepository(OFFICIAL_REPOSITORY);
}

function parseVersion(value) {
  if (typeof value !== "string") return null;
  const match = value.trim().replace(/^v/i, "").match(
    /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([0-9A-Za-z.-]+))?(?:\+[0-9A-Za-z.-]+)?$/,
  );
  if (!match) return null;
  return {
    raw: value,
    core: [Number(match[1]), Number(match[2]), Number(match[3])],
    prerelease: match[4] ? match[4].split(".") : [],
  };
}

function compareVersions(leftValue, rightValue) {
  const left = parseVersion(leftValue);
  const right = parseVersion(rightValue);
  if (!left || !right) return null;
  for (let index = 0; index < 3; index += 1) {
    if (left.core[index] !== right.core[index]) {
      return left.core[index] < right.core[index] ? -1 : 1;
    }
  }
  if (left.prerelease.length === 0 && right.prerelease.length === 0) return 0;
  if (left.prerelease.length === 0) return 1;
  if (right.prerelease.length === 0) return -1;
  const length = Math.max(left.prerelease.length, right.prerelease.length);
  for (let index = 0; index < length; index += 1) {
    const a = left.prerelease[index];
    const b = right.prerelease[index];
    if (a === undefined) return -1;
    if (b === undefined) return 1;
    if (a === b) continue;
    const aNumeric = /^\d+$/.test(a);
    const bNumeric = /^\d+$/.test(b);
    if (aNumeric && bNumeric) return Number(a) < Number(b) ? -1 : 1;
    if (aNumeric !== bNumeric) return aNumeric ? -1 : 1;
    return a < b ? -1 : 1;
  }
  return 0;
}

function resolveCodexCommand({ platform = process.platform, env = process.env } = {}) {
  return env.CANVASIGHT_CODEX_BIN || (platform === "win32" ? "codex.cmd" : "codex");
}

function needsCommandShell(command, platform = process.platform) {
  return platform === "win32" && /\.(?:cmd|bat)$/i.test(command);
}

function runProcess(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: options.cwd,
      env: options.env || process.env,
      shell: needsCommandShell(command),
      windowsHide: true,
    });
    let stdout = "";
    let stderr = "";
    child.stdout?.setEncoding("utf8");
    child.stderr?.setEncoding("utf8");
    child.stdout?.on("data", (chunk) => {
      stdout += chunk;
    });
    child.stderr?.on("data", (chunk) => {
      stderr += chunk;
    });
    child.once("error", reject);
    child.once("close", (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
        return;
      }
      const detail = stderr.trim() || stdout.trim() || `exit code ${code}`;
      reject(new Error(`${command} ${args.join(" ")} failed: ${detail}`));
    });
  });
}

function parseJsonOutput(result, label) {
  try {
    return JSON.parse(result.stdout);
  } catch {
    throw new Error(`${label} did not return valid JSON`);
  }
}

function makeRunner({ command = resolveCodexCommand(), env = process.env } = {}) {
  return async (...args) => parseJsonOutput(
    await runProcess(command, args, { env }),
    `codex ${args.join(" ")}`,
  );
}

async function readGitMetadata(root, env = process.env) {
  if (!root) return { ref: null, commit: null };
  const read = async (args) => {
    try {
      return (await runProcess("git", ["-C", root, ...args], { env })).stdout.trim() || null;
    } catch {
      return null;
    }
  };
  const commit = await read(["rev-parse", "HEAD"]);
  let ref = await read(["symbolic-ref", "--quiet", "--short", "HEAD"]);
  if (!ref && commit) {
    for (const candidate of [STABLE_REF, "main"]) {
      const remoteCommit = await read(["rev-parse", `refs/remotes/origin/${candidate}`]);
      if (remoteCommit === commit) {
        ref = candidate;
        break;
      }
    }
  }
  return { ref, commit };
}

async function readInstallation(runner, env = process.env) {
  const [pluginList, marketplaceList] = await Promise.all([
    runner("plugin", "list", "--available", "--json"),
    runner("plugin", "marketplace", "list", "--json"),
  ]);
  const installed = Array.isArray(pluginList.installed)
    ? pluginList.installed.find((item) => item.pluginId === PLUGIN_ID)
    : null;
  const candidates = [
    ...(Array.isArray(pluginList.available) ? pluginList.available : []),
    ...(Array.isArray(pluginList.installed) ? pluginList.installed : []),
  ].filter((item) => item.pluginId === PLUGIN_ID);
  const marketplace = Array.isArray(marketplaceList.marketplaces)
    ? marketplaceList.marketplaces.find((item) => item.name === MARKETPLACE_NAME)
    : null;
  const source = marketplace?.marketplaceSource || installed?.marketplaceSource || {};
  const git = source.sourceType === "git"
    ? await readGitMetadata(marketplace?.root, env)
    : { ref: null, commit: null };
  return {
    installed,
    candidates,
    marketplace,
    sourceType: source.sourceType || null,
    source: source.source || null,
    ref: marketplace?.ref || source.ref || git.ref,
    commit: marketplace?.commit || source.commit || git.commit,
  };
}

async function readLatestRelease({ fetchImpl = fetch, env = process.env } = {}) {
  const url = env.CANVASIGHT_RELEASE_API_URL || OFFICIAL_RELEASE_API;
  let response;
  try {
    response = await fetchImpl(url, {
      headers: {
        Accept: "application/vnd.github+json",
        "User-Agent": "canvasight-updater",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });
  } catch (error) {
    throw new Error(`Unable to query the official Canvasight release: ${error.message}`);
  }
  if (!response.ok) {
    throw new Error(`Unable to query the official Canvasight release: HTTP ${response.status}`);
  }
  const release = await response.json();
  const version = typeof release.tag_name === "string"
    ? release.tag_name.replace(/^v/i, "")
    : "";
  if (release.draft || release.prerelease || !parseVersion(version)) {
    throw new Error("The official latest release does not contain a valid stable version");
  }
  const apiBase = env.CANVASIGHT_REPOSITORY_API_URL
    || url.replace(/\/releases\/latest(?:\?.*)?$/, "");
  const readCommit = async (ref) => {
    let commitResponse;
    try {
      commitResponse = await fetchImpl(`${apiBase}/commits/${encodeURIComponent(ref)}`, {
        headers: {
          Accept: "application/vnd.github+json",
          "User-Agent": "canvasight-updater",
          "X-GitHub-Api-Version": "2022-11-28",
        },
      });
    } catch (error) {
      throw new Error(`Unable to verify the official Canvasight ${ref} commit: ${error.message}`);
    }
    if (!commitResponse.ok) {
      throw new Error(`Unable to verify the official Canvasight ${ref} commit: HTTP ${commitResponse.status}`);
    }
    const commit = await commitResponse.json();
    if (typeof commit.sha !== "string" || !/^[0-9a-f]{40}$/i.test(commit.sha)) {
      throw new Error(`The official Canvasight ${ref} commit could not be identified`);
    }
    return commit.sha.toLowerCase();
  };
  const [tagCommit, stableCommit] = await Promise.all([
    readCommit(release.tag_name),
    readCommit(STABLE_REF),
  ]);
  if (tagCommit !== stableCommit) {
    const error = new Error(
      `the official ${release.tag_name} release and ${STABLE_REF} branch do not point to the same commit`,
    );
    error.code = "release_mismatch";
    throw error;
  }
  return {
    version,
    tag: release.tag_name,
    url: release.html_url || `https://github.com/Niall-Young/Canvasight/releases/tag/${release.tag_name}`,
    commit: tagCommit,
  };
}

function publicSnapshot(state) {
  return {
    version: state.installed?.version || null,
    marketplaceSource: state.source || null,
    marketplaceSourceType: state.sourceType || null,
    marketplaceRef: state.ref || null,
    marketplaceCommit: state.commit || null,
    installed: Boolean(state.installed?.installed),
    enabled: Boolean(state.installed?.enabled),
  };
}

function findCandidateVersion(state) {
  const versions = state.candidates
    .map((item) => item.version)
    .filter((version) => parseVersion(version));
  return versions.sort((a, b) => compareVersions(b, a))[0] || null;
}

async function addMarketplace(runner, source, ref) {
  const args = ["plugin", "marketplace", "add", source];
  if (ref) args.push("--ref", ref);
  args.push("--json");
  return runner(...args);
}

async function restoreInstallation({ runner, previous, failure }) {
  const recovery = [];
  try {
    await runner("plugin", "marketplace", "remove", MARKETPLACE_NAME, "--json");
    recovery.push("removed_failed_marketplace");
    const recoveryRef = previous.commit || previous.ref;
    await addMarketplace(runner, previous.source, recoveryRef);
    recovery.push(`restored_snapshot:${recoveryRef || "default"}`);
    await runner("plugin", "add", PLUGIN_ID, "--json");
    recovery.push(`restored_plugin:${previous.installed.version}`);
    if (previous.ref && previous.commit && previous.ref !== previous.commit) {
      await runner("plugin", "marketplace", "remove", MARKETPLACE_NAME, "--json");
      await addMarketplace(runner, previous.source, previous.ref);
      recovery.push(`restored_tracking_ref:${previous.ref}`);
    }
    const restored = await readInstallation(runner);
    if (compareVersions(restored.installed?.version, previous.installed.version) !== 0) {
      throw new Error(
        `rollback installed ${restored.installed?.version || "unknown"}, expected ${previous.installed.version}`,
      );
    }
    return {
      status: "update_failed",
      message: `Canvasight update failed and v${previous.installed.version} was restored.`,
      error: failure.message,
      recovered: true,
      recovery,
      previous: publicSnapshot(previous),
    };
  } catch (rollbackError) {
    return {
      status: "rollback_failed",
      message: "Canvasight update failed, and the previous installation could not be fully restored.",
      error: failure.message,
      rollbackError: rollbackError.message,
      recovered: false,
      recovery,
      previous: publicSnapshot(previous),
    };
  }
}

async function inspect({ runner, fetchImpl, env }) {
  const [release, state] = await Promise.all([
    readLatestRelease({ fetchImpl, env }),
    readInstallation(runner, env),
  ]);
  const currentVersion = state.installed?.version;
  const comparison = compareVersions(currentVersion, release.version);
  if (!state.installed || !currentVersion || comparison === null) {
    return {
      result: {
        status: "version_unknown",
        message: "The installed Canvasight version could not be identified; no changes were made.",
        currentVersion: currentVersion || null,
        latestVersion: release.version,
      },
      state,
      release,
      comparison: null,
    };
  }
  if (comparison === 0) {
    return {
      result: {
        status: "up_to_date",
        message: `你当前使用的 Canvasight v${currentVersion} 已经是最新版，无需更新。`,
        currentVersion,
        latestVersion: release.version,
      },
      state,
      release,
      comparison,
    };
  }
  if (comparison > 0) {
    return {
      result: {
        status: "ahead_of_release",
        message: `Canvasight v${currentVersion} is newer than the latest official release v${release.version}; it will not be downgraded.`,
        currentVersion,
        latestVersion: release.version,
      },
      state,
      release,
      comparison,
    };
  }
  return {
    result: {
      status: "update_available",
      message: `Canvasight v${release.version} is available (current: v${currentVersion}).`,
      currentVersion,
      latestVersion: release.version,
      releaseUrl: release.url,
      canUpdate: state.sourceType === "git" && isOfficialRepository(state.source),
      sourceType: state.sourceType,
    },
    state,
    release,
    comparison,
  };
}

async function update({ runner, fetchImpl, env }) {
  const inspection = await inspect({ runner, fetchImpl, env });
  if (inspection.comparison !== -1) return inspection.result;

  const { state: previous, release } = inspection;
  if (previous.sourceType === "local") {
    return {
      status: "local_source",
      message: "Canvasight is installed from a local checkout. It was not modified; update the checkout manually.",
      currentVersion: previous.installed.version,
      latestVersion: release.version,
    };
  }
  if (previous.sourceType !== "git" || !isOfficialRepository(previous.source)) {
    return {
      status: "unsupported_source",
      message: "Canvasight is not installed from the official repository. No changes were made.",
      currentVersion: previous.installed.version,
      latestVersion: release.version,
      source: previous.source,
    };
  }
  if (![STABLE_REF, "main"].includes(previous.ref)) {
    return {
      status: "unsupported_source",
      message: `Canvasight tracks ${previous.ref || "an unknown ref"}, not the official stable update channel. No changes were made.`,
      currentVersion: previous.installed.version,
      latestVersion: release.version,
      source: previous.source,
      ref: previous.ref,
    };
  }

  let marketplaceChanged = false;
  try {
    if (previous.ref === "main") {
      marketplaceChanged = true;
      await runner("plugin", "marketplace", "remove", MARKETPLACE_NAME, "--json");
      await addMarketplace(runner, OFFICIAL_REPOSITORY, STABLE_REF);
    } else {
      marketplaceChanged = true;
      await runner("plugin", "marketplace", "upgrade", MARKETPLACE_NAME, "--json");
    }

    const refreshed = await readInstallation(runner, env);
    const candidateVersion = findCandidateVersion(refreshed);
    if (compareVersions(candidateVersion, release.version) !== 0) {
      const mismatch = new Error(
        `stable marketplace has v${candidateVersion || "unknown"}, but the latest release is v${release.version}`,
      );
      mismatch.code = "release_mismatch";
      throw mismatch;
    }

    await runner("plugin", "add", PLUGIN_ID, "--json");
    const installed = await readInstallation(runner, env);
    if (compareVersions(installed.installed?.version, release.version) !== 0) {
      throw new Error(
        `installation verification returned v${installed.installed?.version || "unknown"}, expected v${release.version}`,
      );
    }
    return {
      status: "updated",
      message: `Canvasight 已更新到 v${release.version}。请重新加载或重启 Codex Desktop，然后新建任务并重新 @Canvasight。重启由你自行完成。`,
      previousVersion: previous.installed.version,
      currentVersion: installed.installed.version,
      latestVersion: release.version,
      restartRequired: true,
    };
  } catch (failure) {
    if (!marketplaceChanged) {
      return {
        status: "update_failed",
        message: "Canvasight update failed before the marketplace changed; the current installation was kept.",
        error: failure.message,
        recovered: true,
        previous: publicSnapshot(previous),
      };
    }
    try {
      const afterFailure = await readInstallation(runner, env);
      const sourceUnchanged = afterFailure.sourceType === previous.sourceType
        && normalizeRepository(afterFailure.source) === normalizeRepository(previous.source)
        && afterFailure.ref === previous.ref
        && afterFailure.commit === previous.commit;
      const installUnchanged = compareVersions(
        afterFailure.installed?.version,
        previous.installed.version,
      ) === 0;
      if (sourceUnchanged && installUnchanged) {
        return {
          status: "update_failed",
          message: "Canvasight update failed before any effective switch; the current installation was kept.",
          error: failure.message,
          recovered: true,
          previous: publicSnapshot(previous),
        };
      }
    } catch {
      // Fall through to the explicit SHA-pinned recovery path.
    }
    const recovered = await restoreInstallation({ runner, previous, failure });
    if (failure.code === "release_mismatch" && recovered.status === "update_failed") {
      recovered.status = "release_mismatch";
    }
    return recovered;
  }
}

function parseMode(argv) {
  if (argv.length !== 1 || !["--check", "--update"].includes(argv[0])) {
    throw new Error("Usage: node update-canvasight.mjs --check|--update");
  }
  return argv[0];
}

async function main(argv = process.argv.slice(2), dependencies = {}) {
  const mode = parseMode(argv);
  const env = dependencies.env || process.env;
  const runner = dependencies.runner || makeRunner({ env });
  try {
    if (mode === "--check") {
      return (await inspect({ runner, fetchImpl: dependencies.fetchImpl, env })).result;
    }
    return await update({ runner, fetchImpl: dependencies.fetchImpl, env });
  } catch (error) {
    if (error.code === "release_mismatch") {
      return {
        status: "release_mismatch",
        message: "The official Canvasight Release and stable branch disagree; no changes were made.",
        error: error.message,
        recovered: true,
      };
    }
    throw error;
  }
}

async function cli() {
  try {
    const result = await main();
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    process.exitCode = ["error", "rollback_failed"].includes(result.status) ? 1 : 0;
  } catch (error) {
    process.stdout.write(`${JSON.stringify({
      status: "error",
      message: "Canvasight update could not be completed; no success was claimed.",
      error: error.message,
    }, null, 2)}\n`);
    process.exitCode = 1;
  }
}

const isEntrypoint = process.argv[1]
  && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isEntrypoint) await cli();

export {
  OFFICIAL_RELEASE_API,
  OFFICIAL_REPOSITORY,
  compareVersions,
  inspect,
  isOfficialRepository,
  main,
  needsCommandShell,
  parseVersion,
  readLatestRelease,
  resolveCodexCommand,
  update,
};
