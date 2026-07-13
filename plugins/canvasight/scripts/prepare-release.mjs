#!/usr/bin/env node

import { spawn } from "node:child_process";
import { access, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const pluginRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const releaseFiles = {
  manifest: path.join(pluginRoot, ".codex-plugin", "plugin.json"),
  package: path.join(pluginRoot, "package.json"),
  lock: path.join(pluginRoot, "package-lock.json"),
  server: path.join(pluginRoot, "mcp", "server.source.mjs"),
};

function parseReleaseVersion(value) {
  if (typeof value !== "string") return null;
  const version = value.trim().replace(/^v/i, "");
  return /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(version)
    ? version
    : null;
}

async function readJson(file) {
  return JSON.parse(await readFile(file, "utf8"));
}

async function writeJson(file, value) {
  await writeFile(file, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function readVersions() {
  const [manifest, pkg, lock, server] = await Promise.all([
    readJson(releaseFiles.manifest),
    readJson(releaseFiles.package),
    readJson(releaseFiles.lock),
    readFile(releaseFiles.server, "utf8"),
  ]);
  const serverVersion = server.match(/const SERVER_VERSION = "([^"]+)";/)?.[1] || null;
  return {
    manifest: manifest.version,
    package: pkg.version,
    lock: lock.version,
    lockRoot: lock.packages?.[""]?.version,
    server: serverVersion,
  };
}

async function verifyPluginSnapshot() {
  const manifest = await readJson(releaseFiles.manifest);
  if (manifest.name !== "canvasight" || manifest.skills !== "./skills/") {
    throw new Error("plugin manifest identity or skills path is invalid");
  }
  await Promise.all([
    access(path.join(pluginRoot, "mcp", "server.mjs")),
    access(path.join(pluginRoot, "dist", "index.html")),
    access(path.join(pluginRoot, "assets", "icon.png")),
    access(path.join(pluginRoot, "assets", "logo.png")),
  ]);
  const skillsRoot = path.join(pluginRoot, "skills");
  const entries = await readdir(skillsRoot, { withFileTypes: true });
  const skillDirectories = entries.filter((entry) => entry.isDirectory());
  if (skillDirectories.length === 0) throw new Error("release contains no Canvasight skills");
  for (const entry of skillDirectories) {
    const skillFile = path.join(skillsRoot, entry.name, "SKILL.md");
    const skill = await readFile(skillFile, "utf8");
    const frontmatter = skill.match(/^---\n([\s\S]*?)\n---\n/);
    if (!frontmatter || !/^name:\s*\S+/m.test(frontmatter[1]) || !/^description:\s*\S+/m.test(frontmatter[1])) {
      throw new Error(`${path.relative(pluginRoot, skillFile)} has invalid skill frontmatter`);
    }
  }
  return { skillCount: skillDirectories.length };
}

async function setVersions(version) {
  const [manifest, pkg, lock, server] = await Promise.all([
    readJson(releaseFiles.manifest),
    readJson(releaseFiles.package),
    readJson(releaseFiles.lock),
    readFile(releaseFiles.server, "utf8"),
  ]);
  manifest.version = version;
  pkg.version = version;
  lock.version = version;
  if (!lock.packages?.[""]) throw new Error("package-lock.json is missing the root package entry");
  lock.packages[""].version = version;
  const updatedServer = server.replace(
    /const SERVER_VERSION = "[^"]+";/,
    `const SERVER_VERSION = "${version}";`,
  );
  if (updatedServer === server) throw new Error("mcp/server.source.mjs SERVER_VERSION was not found");
  await Promise.all([
    writeJson(releaseFiles.manifest, manifest),
    writeJson(releaseFiles.package, pkg),
    writeJson(releaseFiles.lock, lock),
    writeFile(releaseFiles.server, updatedServer, "utf8"),
  ]);
}

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: pluginRoot,
      stdio: "inherit",
      shell: process.platform === "win32",
      windowsHide: true,
    });
    child.once("error", reject);
    child.once("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} ${args.join(" ")} exited with code ${code}`));
    });
  });
}

function assertVersions(expected, versions) {
  const mismatches = Object.entries(versions)
    .filter(([, value]) => value !== expected)
    .map(([name, value]) => `${name}=${value || "missing"}`);
  if (mismatches.length > 0) {
    throw new Error(`release version mismatch; expected ${expected}: ${mismatches.join(", ")}`);
  }
}

async function main(argv = process.argv.slice(2)) {
  const check = argv[0] === "--check";
  const value = check ? argv[1] : argv[0];
  const version = parseReleaseVersion(value);
  if (!version) {
    throw new Error(
      "Usage: node scripts/prepare-release.mjs [--check] X.Y.Z (stable releases use numeric versions only)",
    );
  }
  if (!check) {
    await setVersions(version);
    await run(process.platform === "win32" ? "npm.cmd" : "npm", ["run", "build"]);
  }
  const versions = await readVersions();
  assertVersions(version, versions);
  const snapshot = await verifyPluginSnapshot();
  process.stdout.write(`${JSON.stringify({
    status: check ? "verified" : "prepared",
    version,
    versions,
    snapshot,
  }, null, 2)}\n`);
}

try {
  await main();
} catch (error) {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
}

export { assertVersions, parseReleaseVersion, readVersions, setVersions, verifyPluginSnapshot };
