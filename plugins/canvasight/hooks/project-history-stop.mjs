#!/usr/bin/env node
import { spawn } from "node:child_process";
import fsp from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const MAX_STDIN_BYTES = 2 * 1024 * 1024;
const START_WAIT_MS = 3_500;

function canvasightHome() {
  const configured = process.env.CANVASIGHT_HOME;
  return path.resolve(typeof configured === "string" && configured.trim() ? configured : path.join(os.homedir(), ".canvasight"));
}

function daemonStatePath() {
  return path.join(canvasightHome(), "daemon.json");
}

function boundedText(value, limit = 8_000) {
  return typeof value === "string" ? value.slice(0, limit) : null;
}

function normalizeHookInput(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Canvasight Project History hook input must be an object");
  if (value.hook_event_name !== "Stop" && value.hook_event_name !== "UserPromptSubmit") return null;
  const taskId = typeof value.session_id === "string" ? value.session_id.trim() : "";
  const turnId = typeof value.turn_id === "string" ? value.turn_id.trim() : "";
  const cwd = typeof value.cwd === "string" ? value.cwd.trim() : "";
  if (!taskId || !turnId || !cwd) throw new Error("Canvasight Project History hook requires session_id, turn_id, and cwd");
  return {
    hookEventName: value.hook_event_name,
    taskId,
    turnId,
    cwd: path.resolve(cwd),
    transcriptPath: boundedText(value.transcript_path, 4_000),
    lastAssistantMessage: boundedText(value.last_assistant_message, 16_000),
    prompt: boundedText(value.prompt, 16_000),
    stopHookActive: value.stop_hook_active === true,
    model: boundedText(value.model, 200),
    receivedAt: new Date().toISOString()
  };
}

async function readStdin() {
  const chunks = [];
  let size = 0;
  for await (const chunk of process.stdin) {
    size += chunk.length;
    if (size > MAX_STDIN_BYTES) throw new Error("Canvasight Project History hook input is too large");
    chunks.push(chunk);
  }
  const raw = Buffer.concat(chunks).toString("utf8").trim();
  return raw ? JSON.parse(raw) : {};
}

async function readDaemonState() {
  try {
    const state = JSON.parse(await fsp.readFile(daemonStatePath(), "utf8"));
    if (!state || typeof state.origin !== "string" || !state.origin.startsWith("http://127.0.0.1:")) return null;
    return state;
  } catch {
    return null;
  }
}

async function daemonHealthy(state) {
  if (!state) return false;
  try {
    const response = await fetch(new URL("/api/health", state.origin), { signal: AbortSignal.timeout(900) });
    if (!response.ok) return false;
    const health = await response.json();
    return health?.status === "ok" && health?.name === "canvasight";
  } catch {
    return false;
  }
}

async function ensureDaemon(pluginRoot) {
  const existing = await readDaemonState();
  // Hooks are an installation-level capture surface while the daemon is a
  // project-level singleton. A task can legitimately keep an older cached
  // hook process alive after Canvasight is upgraded. Forward the stable hook
  // event contract to the active Canvasight daemon instead of letting cached
  // plugin roots fight over daemon ownership and silently lose attribution.
  if (await daemonHealthy(existing)) return existing;
  if (existing?.pluginRoot && path.resolve(existing.pluginRoot) !== path.resolve(pluginRoot)) {
    throw new Error("Canvasight daemon state belongs to another plugin snapshot and is not reachable");
  }
  const serverPath = path.join(pluginRoot, "mcp", "server.mjs");
  const child = spawn(process.execPath, [serverPath, "--daemon"], {
    cwd: pluginRoot,
    detached: true,
    stdio: "ignore",
    env: { ...process.env, CANVASIGHT_HOME: canvasightHome() }
  });
  child.unref();
  const deadline = Date.now() + START_WAIT_MS;
  while (Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, 100));
    const state = await readDaemonState();
    if (await daemonHealthy(state)) return state;
  }
  throw new Error("Canvasight daemon did not become ready for the Project History hook");
}

async function postHookEvent(state, event) {
  const route = event.hookEventName === "UserPromptSubmit" ? "/api/project-history/hooks/user-prompt-submit" : "/api/project-history/hooks/stop";
  const response = await fetch(new URL(route, state.origin), {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(state.token ? { "x-canvasight-token": state.token } : {})
    },
    body: JSON.stringify(event),
    signal: AbortSignal.timeout(5_000)
  });
  const text = await response.text();
  if (!response.ok) throw new Error(text || `Canvasight Project History hook request failed: ${response.status}`);
  return text ? JSON.parse(text) : null;
}

async function appendFailure(error, event) {
  try {
    const logPath = path.join(canvasightHome(), "project-history-hook.log");
    await fsp.mkdir(path.dirname(logPath), { recursive: true });
    const line = `${JSON.stringify({
      at: new Date().toISOString(),
      taskId: event?.taskId ?? null,
      turnId: event?.turnId ?? null,
      error: error instanceof Error ? error.message : String(error)
    })}\n`;
    let previous = "";
    try {
      previous = await fsp.readFile(logPath, "utf8");
    } catch {}
    await fsp.writeFile(logPath, `${previous}${line}`.slice(-1024 * 1024), { encoding: "utf8", mode: 0o600 });
  } catch {
    // History capture must never block or fail the Codex turn.
  }
}

export async function runProjectHistoryHook({ pluginRoot = process.env.PLUGIN_ROOT || path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..") } = {}) {
  let event = null;
  try {
    event = normalizeHookInput(await readStdin());
    if (event) await postHookEvent(await ensureDaemon(pluginRoot), event);
  } catch (error) {
    await appendFailure(error, event);
  }
  process.stdout.write("{}\n");
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await runProjectHistoryHook();
}
