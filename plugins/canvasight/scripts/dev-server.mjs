#!/usr/bin/env node
import { spawn } from "node:child_process";
import fs from "node:fs";
import fsp from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const pluginRoot = path.resolve(__dirname, "..");
const viteBin = path.join(pluginRoot, "node_modules", "vite", "bin", "vite.js");
const packageJson = JSON.parse(fs.readFileSync(path.join(pluginRoot, "package.json"), "utf8"));
const DEFAULT_CANVASIGHT_HOME = path.join(os.homedir(), ".canvasight");
const SERVER_VERSION = typeof packageJson.version === "string" ? packageJson.version : "";

function canvasightHome() {
  const configured = process.env.CANVASIGHT_HOME;
  return path.resolve(typeof configured === "string" && configured.trim() ? configured : DEFAULT_CANVASIGHT_HOME);
}

function devServerStatePath() {
  return path.join(canvasightHome(), "dev-server.json");
}

function devPort() {
  const parsed = Number(process.env.CANVASIGHT_DEV_PORT || process.env.PORT || 5173);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 5173;
}

function originForPort(port) {
  return `http://127.0.0.1:${port}`;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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

function stateMatchesCurrentServer(state, origin) {
  return state?.pluginRoot === pluginRoot && state?.origin === origin && state?.serverVersion === SERVER_VERSION;
}

function stateIsForThisServer(state, origin) {
  return state?.pluginRoot === pluginRoot && state?.origin === origin;
}

function stateIsStale(state, origin) {
  return stateIsForThisServer(state, origin) && state?.serverVersion !== SERVER_VERSION;
}

async function readState() {
  try {
    const raw = await fsp.readFile(devServerStatePath(), "utf8");
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    return parsed;
  } catch (error) {
    if (error?.code === "ENOENT" || error instanceof SyntaxError) return null;
    throw error;
  }
}

async function writeState(state) {
  await fsp.mkdir(canvasightHome(), { recursive: true });
  await fsp.writeFile(devServerStatePath(), `${JSON.stringify(state, null, 2)}\n`, "utf8");
}

async function removeState() {
  await fsp.rm(devServerStatePath(), { force: true });
}

async function fetchText(url, timeoutMs = 1200) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      signal: controller.signal
    });
    const text = await response.text();
    return {
      ok: response.ok,
      text
    };
  } catch {
    return {
      ok: false,
      text: ""
    };
  } finally {
    clearTimeout(timer);
  }
}

async function canvasightDevServerIsHealthy(origin) {
  const response = await fetchText(origin);
  return response.ok && response.text.includes("<title>Canvasight</title>");
}

async function waitForHealthy(origin, timeoutMs = 10000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await canvasightDevServerIsHealthy(origin)) return true;
    await sleep(150);
  }
  return false;
}

async function waitForStopped(origin, timeoutMs = 4000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (!(await canvasightDevServerIsHealthy(origin))) return true;
    await sleep(150);
  }
  return false;
}

function startDetachedVite(port) {
  if (!fs.existsSync(viteBin)) {
    throw new Error("Vite is not installed. Run npm install in plugins/canvasight first.");
  }
  const child = spawn(process.execPath, [viteBin, "--host", "127.0.0.1", "--port", String(port), "--strictPort"], {
    cwd: pluginRoot,
    detached: true,
    stdio: "ignore",
    env: {
      ...process.env,
      FORCE_COLOR: "0"
    }
  });
  child.unref();
  return child;
}

async function stopManagedServer(state, origin) {
  if (state?.managed && processIsAlive(Number(state.pid))) {
    process.kill(Number(state.pid), "SIGTERM");
    await waitForStopped(origin);
  }
}

async function start() {
  const port = devPort();
  const origin = originForPort(port);
  const state = await readState();
  const healthy = await canvasightDevServerIsHealthy(origin);

  if (stateMatchesCurrentServer(state, origin) && healthy) {
    process.stdout.write(`Canvasight dev server is already running: ${origin}\n`);
    return;
  }

  if (stateIsStale(state, origin)) {
    if (state?.managed) {
      process.stdout.write(
        `Restarting stale Canvasight dev server: ${origin} (${state.serverVersion || "unknown"} -> ${SERVER_VERSION})\n`
      );
      await stopManagedServer(state, origin);
      await removeState();
      if (await canvasightDevServerIsHealthy(origin)) {
        throw new Error(
          `Canvasight dev server at ${origin} is stale (${state.serverVersion || "unknown"}), but it could not be stopped. Run npm run dev:stop and retry.`
        );
      }
    } else if (healthy) {
      throw new Error(
        `Canvasight dev server at ${origin} is stale (${state.serverVersion || "unknown"}), but it is unmanaged. Stop it manually and retry.`
      );
    } else {
      await removeState();
    }
  }

  if (await canvasightDevServerIsHealthy(origin)) {
    await writeState({
      version: 1,
      serverVersion: SERVER_VERSION,
      pid: null,
      origin,
      port,
      pluginRoot,
      startedAt: new Date().toISOString(),
      managed: false
    });
    process.stdout.write(`Canvasight dev server is already reachable: ${origin}\n`);
    return;
  }

  if (state?.pluginRoot === pluginRoot && processIsAlive(Number(state.pid))) {
    try {
      process.kill(Number(state.pid), "SIGTERM");
    } catch {
      // Stale state can be ignored; a fresh process will be started below.
    }
    await sleep(250);
  }

  const child = startDetachedVite(port);
  await writeState({
    version: 1,
    serverVersion: SERVER_VERSION,
    pid: child.pid,
    origin,
    port,
    pluginRoot,
    startedAt: new Date().toISOString(),
    managed: true
  });

  if (!(await waitForHealthy(origin))) {
    try {
      process.kill(child.pid, "SIGTERM");
    } catch {
      // Ignore; the process may have already exited after failing to bind.
    }
    throw new Error(`Canvasight dev server did not become reachable at ${origin}`);
  }

  process.stdout.write(`Canvasight dev server running: ${origin}\n`);
}

async function stop() {
  const state = await readState();
  const port = devPort();
  const origin = state?.origin || originForPort(port);

  if (state?.managed && processIsAlive(Number(state.pid))) {
    process.kill(Number(state.pid), "SIGTERM");
    await waitForStopped(origin);
  }

  await removeState();

  if (await canvasightDevServerIsHealthy(origin)) {
    process.stdout.write(`Canvasight dev server is still reachable: ${origin}\n`);
    return;
  }

  process.stdout.write("Canvasight dev server stopped\n");
}

async function status() {
  const state = await readState();
  const origin = state?.origin || originForPort(devPort());
  const healthy = await canvasightDevServerIsHealthy(origin);
  const stale = healthy && stateIsStale(state, origin);
  process.stdout.write(
    `${healthy ? (stale ? "stale" : "running") : "stopped"} ${origin}${state?.pid ? ` pid=${state.pid}` : ""}${
      state?.serverVersion ? ` serverVersion=${state.serverVersion}` : ""
    }${stale ? ` expected=${SERVER_VERSION}` : ""}${state?.managed === false ? " unmanaged" : ""}\n`
  );
}

const action = process.argv[2] || "start";

try {
  if (action === "start") {
    await start();
  } else if (action === "stop") {
    await stop();
  } else if (action === "status") {
    await status();
  } else {
    throw new Error(`Unknown dev server action: ${action}`);
  }
} catch (error) {
  process.stderr.write(`${error?.message || "Canvasight dev server command failed"}\n`);
  process.exitCode = 1;
}
