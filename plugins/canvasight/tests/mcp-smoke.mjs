#!/usr/bin/env node
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import fsp from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const pluginRoot = path.resolve(__dirname, "..");
const serverPath = path.join(pluginRoot, "mcp", "server.mjs");

let nextId = 1;
let stdoutBuffer = "";
let stderrBuffer = "";
const pending = new Map();

const child = spawn(process.execPath, [serverPath], {
  cwd: pluginRoot,
  env: {
    ...process.env,
    CANVASIGHT_OPEN_BROWSER: "0"
  },
  stdio: ["pipe", "pipe", "pipe"]
});

function rejectPending(error) {
  for (const { reject } of pending.values()) reject(error);
  pending.clear();
}

function parseStdout() {
  while (stdoutBuffer.includes("\n")) {
    const newline = stdoutBuffer.indexOf("\n");
    const line = stdoutBuffer.slice(0, newline).trim();
    stdoutBuffer = stdoutBuffer.slice(newline + 1);
    if (!line) continue;
    const message = JSON.parse(line);
    const handler = pending.get(message.id);
    if (!handler) continue;
    pending.delete(message.id);
    if (message.error) {
      handler.reject(new Error(message.error.message));
    } else {
      handler.resolve(message.result);
    }
  }
}

child.stdout.setEncoding("utf8");
child.stdout.on("data", (chunk) => {
  stdoutBuffer += chunk;
  parseStdout();
});

child.stderr.setEncoding("utf8");
child.stderr.on("data", (chunk) => {
  stderrBuffer += chunk;
});

child.on("exit", (code, signal) => {
  if (pending.size) {
    rejectPending(new Error(`MCP server exited early: code=${code} signal=${signal} stderr=${stderrBuffer}`));
  }
});

function request(method, params) {
  const id = nextId;
  nextId += 1;
  const payload = {
    jsonrpc: "2.0",
    id,
    method,
    params
  };
  const promise = new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
  });
  child.stdin.write(`${JSON.stringify(payload)}\n`);
  return promise;
}

function notify(method, params) {
  child.stdin.write(`${JSON.stringify({ jsonrpc: "2.0", method, params })}\n`);
}

async function fetchJson(url, init) {
  const response = await fetch(url, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(init?.headers || {})
    }
  });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`${init?.method || "GET"} ${url} failed: ${response.status} ${text}`);
  }
  return text ? JSON.parse(text) : null;
}

async function main() {
  const killTimer = setTimeout(() => {
    child.kill("SIGTERM");
    rejectPending(new Error(`MCP smoke test timed out. stderr=${stderrBuffer}`));
  }, 20000);

  const tempRoot = await fsp.mkdtemp(path.join(os.tmpdir(), "canvasight-mcp-"));
  try {
    const initialized = await request("initialize", {
      protocolVersion: "2024-11-05",
      capabilities: {},
      clientInfo: {
        name: "canvasight-smoke",
        version: "0.0.0"
      }
    });
    assert.equal(initialized.serverInfo.name, "canvasight");
    notify("notifications/initialized", {});

    const listed = await request("tools/list", {});
    const toolNames = new Set(listed.tools.map((tool) => tool.name));
    assert.equal(toolNames.has("open_canvasight"), true);
    assert.equal(toolNames.has("await_canvasight_run"), true);
    assert.equal(toolNames.has("close_canvasight"), true);

    const projectPath = path.join(tempRoot, "demo-project");
    const opened = await request("tools/call", {
      name: "open_canvasight",
      arguments: {
        projectPath,
        language: "en"
      }
    });
    assert.equal(opened.structuredContent.status, "opened");
    assert.equal(opened.structuredContent.projectPath, projectPath);

    const sessionId = opened.structuredContent.sessionId;
    const origin = opened.structuredContent.origin;
    const session = await fetchJson(`${origin}/api/sessions/${sessionId}`);
    assert.deepEqual(session, {
      language: "en",
      projectPath,
      sessionId
    });

    const openProject = await fetchJson(`${origin}/api/sessions/${sessionId}/open-project`, {
      method: "POST",
      body: JSON.stringify({ projectPath })
    });
    assert.equal(openProject.document.version, 1);
    assert.equal(openProject.project.path, projectPath);

    const document = {
      version: 1,
      projectName: "demo-project",
      updatedAt: "2026-07-04T00:00:00.000Z",
      viewport: { x: 12, y: 24, zoom: 1 },
      nodes: [
        {
          id: "node-a",
          type: "task",
          position: { x: 0, y: 0 },
          data: {
            title: "Smoke task",
            body: "Run the smoke payload.",
            attachments: [],
            effort: "high",
            planMode: true,
            runMode: "flow"
          }
        }
      ],
      edges: []
    };
    const savedDocument = await fetchJson(`${origin}/api/sessions/${sessionId}/document`, {
      method: "POST",
      body: JSON.stringify({ projectPath, document })
    });
    assert.equal(savedDocument.nodes[0].id, "node-a");

    const scatterJson = JSON.parse(await fsp.readFile(path.join(projectPath, ".scatter", "scatter.json"), "utf8"));
    assert.equal(scatterJson.version, 1);
    assert.equal(scatterJson.nodes[0].data.title, "Smoke task");

    const attachments = await fetchJson(`${origin}/api/sessions/${sessionId}/attachments`, {
      method: "POST",
      body: JSON.stringify({
        projectPath,
        files: [
          {
            name: "note.txt",
            mime: "text/plain",
            source: "upload",
            dataBase64: Buffer.from("hello canvasight", "utf8").toString("base64")
          }
        ]
      })
    });
    assert.equal(attachments.length, 1);
    assert.equal(attachments[0].relativePath.startsWith(".scatter/assets/"), true);
    assert.equal(await fsp.readFile(attachments[0].storedPath, "utf8"), "hello canvasight");
    const assetResponse = await fetch(`${origin}${attachments[0].fileUrl}`);
    assert.equal(assetResponse.ok, true);
    assert.equal(await assetResponse.text(), "hello canvasight");

    const waitForRun = request("tools/call", {
      name: "await_canvasight_run",
      arguments: {
        sessionId,
        timeoutMs: 5000
      }
    });

    const runPayload = {
      sessionId,
      threadName: "Scatter Flow: Smoke task",
      projectPath,
      markdown: "# Smoke task\n\nRun the smoke payload.",
      imagePaths: [],
      effort: "high",
      planMode: true,
      runMode: "flow",
      nodeIds: ["node-a"],
      attachments
    };
    const queued = await fetchJson(`${origin}/api/sessions/${sessionId}/run`, {
      method: "POST",
      body: JSON.stringify(runPayload)
    });
    assert.equal(queued.status, "queued");

    const awaited = await waitForRun;
    assert.equal(awaited.content[0].text, runPayload.markdown);
    assert.equal(awaited.structuredContent.status, "received");
    assert.equal(awaited.structuredContent.threadName, runPayload.threadName);
    assert.deepEqual(awaited.structuredContent.nodeIds, ["node-a"]);
    assert.equal(awaited.structuredContent.attachments[0].originalName, "note.txt");

    const closed = await request("tools/call", {
      name: "close_canvasight",
      arguments: { sessionId }
    });
    assert.equal(closed.structuredContent.status, "closed");
    assert.equal(closed.structuredContent.existed, true);

    const closedAgain = await request("tools/call", {
      name: "close_canvasight",
      arguments: { sessionId }
    });
    assert.equal(closedAgain.structuredContent.status, "closed");
    assert.equal(closedAgain.structuredContent.existed, false);

    clearTimeout(killTimer);
    console.log("MCP smoke test passed");
  } finally {
    await fsp.rm(tempRoot, { recursive: true, force: true });
    child.stdin.end();
    child.kill("SIGTERM");
  }
}

main().catch((error) => {
  console.error(error);
  child.kill("SIGTERM");
  process.exitCode = 1;
});
