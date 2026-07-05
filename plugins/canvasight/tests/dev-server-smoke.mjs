#!/usr/bin/env node
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import fsp from "node:fs/promises";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const pluginRoot = path.resolve(__dirname, "..");
const scriptPath = path.join(pluginRoot, "scripts", "dev-server.mjs");
const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "canvasight-dev-server-"));
const canvasightHome = path.join(tempRoot, "home");
const port = await findFreePort();
const origin = `http://127.0.0.1:${port}`;

function findFreePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      const selectedPort = typeof address === "object" && address ? address.port : 0;
      server.close(() => resolve(selectedPort));
    });
  });
}

function run(action) {
  return spawnSync(process.execPath, [scriptPath, action], {
    cwd: pluginRoot,
    env: {
      ...process.env,
      CANVASIGHT_HOME: canvasightHome,
      CANVASIGHT_DEV_PORT: String(port)
    },
    encoding: "utf8"
  });
}

function processIsAlive(pid) {
  if (!Number.isFinite(pid) || pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

async function fetchText(url) {
  try {
    const response = await fetch(url);
    return {
      ok: response.ok,
      text: await response.text()
    };
  } catch {
    return {
      ok: false,
      text: ""
    };
  }
}

async function main() {
  try {
    const started = run("start");
    assert.equal(started.status, 0, started.stderr || started.stdout);
    assert.match(started.stdout, /Canvasight dev server running|Canvasight dev server is already reachable/);

    const state = JSON.parse(await fsp.readFile(path.join(canvasightHome, "dev-server.json"), "utf8"));
    assert.equal(state.origin, origin);
    assert.equal(state.pluginRoot, pluginRoot);
    assert.equal(state.managed, true);
    assert.equal(processIsAlive(Number(state.pid)), true);

    const page = await fetchText(origin);
    assert.equal(page.ok, true);
    assert.equal(page.text.includes("<title>Canvasight</title>"), true);

    const status = run("status");
    assert.equal(status.status, 0, status.stderr || status.stdout);
    assert.match(status.stdout, /running/);

    const stopped = run("stop");
    assert.equal(stopped.status, 0, stopped.stderr || stopped.stdout);

    const afterStop = await fetchText(origin);
    assert.equal(afterStop.ok, false);

    console.log("Canvasight dev server smoke test passed");
  } finally {
    run("stop");
    await fsp.rm(tempRoot, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
