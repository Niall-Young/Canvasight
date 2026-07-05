#!/usr/bin/env node
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import fs from "node:fs";
import fsp from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const pluginRoot = path.resolve(__dirname, "..");
const serverPath = path.join(pluginRoot, "mcp", "server.mjs");

const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "canvasight-mcp-"));
const defaultProjectPath = path.join(tempRoot, "auto-project");
const canvasightHome = path.join(tempRoot, "canvasight-home");
const nativeLogPath = path.join(tempRoot, "native-codex.jsonl");
const fakeCodexPath = path.join(tempRoot, "fake-codex.mjs");

fs.writeFileSync(
  fakeCodexPath,
  `#!/usr/bin/env node
import fs from "node:fs";

const logPath = process.env.CANVASIGHT_NATIVE_LOG;
let buffer = "";

function write(message) {
  process.stdout.write(JSON.stringify(message) + "\\n");
}

function append(method, params) {
  if (!logPath) return;
  fs.appendFileSync(logPath, JSON.stringify({ method, params }) + "\\n");
}

function handle(message) {
  if (message.method === "initialize") {
    write({ id: message.id, result: { userAgent: "fake-codex", codexHome: process.cwd(), platformFamily: "unix", platformOs: "test" } });
    return;
  }
  append(message.method, message.params);
  if (message.method === "thread/goal/set") {
    write({ id: message.id, result: { goal: { threadId: message.params.threadId, objective: message.params.objective, status: "active", tokenBudget: null, tokensUsed: 0, timeUsedSeconds: 0, createdAt: 0, updatedAt: 0 } } });
    return;
  }
  if (message.method === "thread/settings/update") {
    write({ id: message.id, result: {} });
    return;
  }
  write({ id: message.id, error: { code: -32601, message: "Method not found" } });
}

process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => {
  buffer += chunk;
  while (buffer.includes("\\n")) {
    const newline = buffer.indexOf("\\n");
    const line = buffer.slice(0, newline).trim();
    buffer = buffer.slice(newline + 1);
    if (!line) continue;
    handle(JSON.parse(line));
  }
});
`,
  "utf8"
);
fs.chmodSync(fakeCodexPath, 0o755);

let nextId = 1;
let stdoutBuffer = "";
let stderrBuffer = "";
let daemonToken = "";
const pending = new Map();

const child = spawn(process.execPath, [serverPath], {
  cwd: pluginRoot,
  env: {
    ...process.env,
    CANVASIGHT_DEFAULT_PROJECT_PATH: defaultProjectPath,
    CANVASIGHT_OPEN_BROWSER: "0",
    CANVASIGHT_HOME: canvasightHome,
    CANVASIGHT_CODEX_BIN: fakeCodexPath,
    CANVASIGHT_NATIVE_LOG: nativeLogPath,
    CODEX_THREAD_ID: "thread-smoke"
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

async function readNativeLog() {
  try {
    const raw = await fsp.readFile(nativeLogPath, "utf8");
    return raw
      .split("\n")
      .filter(Boolean)
      .map((line) => JSON.parse(line));
  } catch (error) {
    if (error?.code === "ENOENT") return [];
    throw error;
  }
}

async function fetchJson(url, init) {
  const response = await fetch(url, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(daemonToken ? { "x-canvasight-token": daemonToken } : {}),
      ...(init?.headers || {})
    }
  });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`${init?.method || "GET"} ${url} failed: ${response.status} ${text}`);
  }
  return text ? JSON.parse(text) : null;
}

function createMcpClient(label, envOverrides = {}) {
  let clientNextId = 1;
  let clientStdoutBuffer = "";
  let clientStderrBuffer = "";
  const clientPending = new Map();
  const clientChild = spawn(process.execPath, [serverPath], {
    cwd: pluginRoot,
    env: {
      ...process.env,
      CANVASIGHT_DEFAULT_PROJECT_PATH: defaultProjectPath,
      CANVASIGHT_OPEN_BROWSER: "0",
      CANVASIGHT_HOME: canvasightHome,
      CANVASIGHT_CODEX_BIN: fakeCodexPath,
      CANVASIGHT_NATIVE_LOG: nativeLogPath,
      CODEX_THREAD_ID: `thread-${label}`,
      ...envOverrides
    },
    stdio: ["pipe", "pipe", "pipe"]
  });

  function rejectClientPending(error) {
    for (const { reject } of clientPending.values()) reject(error);
    clientPending.clear();
  }

  function parseClientStdout() {
    while (clientStdoutBuffer.includes("\n")) {
      const newline = clientStdoutBuffer.indexOf("\n");
      const line = clientStdoutBuffer.slice(0, newline).trim();
      clientStdoutBuffer = clientStdoutBuffer.slice(newline + 1);
      if (!line) continue;
      const message = JSON.parse(line);
      const handler = clientPending.get(message.id);
      if (!handler) continue;
      clientPending.delete(message.id);
      if (message.error) {
        handler.reject(new Error(message.error.message));
      } else {
        handler.resolve(message.result);
      }
    }
  }

  clientChild.stdout.setEncoding("utf8");
  clientChild.stdout.on("data", (chunk) => {
    clientStdoutBuffer += chunk;
    parseClientStdout();
  });

  clientChild.stderr.setEncoding("utf8");
  clientChild.stderr.on("data", (chunk) => {
    clientStderrBuffer += chunk;
  });

  clientChild.on("exit", (code, signal) => {
    if (clientPending.size) {
      rejectClientPending(new Error(`MCP ${label} exited early: code=${code} signal=${signal} stderr=${clientStderrBuffer}`));
    }
  });

  return {
    child: clientChild,
    request(method, params) {
      const id = clientNextId;
      clientNextId += 1;
      const promise = new Promise((resolve, reject) => {
        clientPending.set(id, { resolve, reject });
      });
      clientChild.stdin.write(`${JSON.stringify({ jsonrpc: "2.0", id, method, params })}\n`);
      return promise;
    },
    notify(method, params) {
      clientChild.stdin.write(`${JSON.stringify({ jsonrpc: "2.0", method, params })}\n`);
    },
    stop() {
      clientChild.stdin.end();
      clientChild.kill("SIGTERM");
    },
    stderr() {
      return clientStderrBuffer;
    }
  };
}

function stopDaemon() {
  return new Promise((resolve) => {
    const stopper = spawn(process.execPath, [serverPath, "--stop-daemon"], {
      cwd: pluginRoot,
      env: {
        ...process.env,
        CANVASIGHT_HOME: canvasightHome
      },
      stdio: "ignore"
    });
    stopper.on("exit", () => resolve());
    stopper.on("error", () => resolve());
  });
}

async function main() {
  const killTimer = setTimeout(() => {
    child.kill("SIGTERM");
    rejectPending(new Error(`MCP smoke test timed out. stderr=${stderrBuffer}`));
  }, 20000);

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
    assert.equal(initialized.serverInfo.version, "0.1.2");
    notify("notifications/initialized", {});

    const listed = await request("tools/list", {});
    const toolNames = new Set(listed.tools.map((tool) => tool.name));
    assert.equal(toolNames.has("open_canvasight"), true);
    assert.equal(toolNames.has("list_canvasight_recent_projects"), true);
    assert.equal(toolNames.has("open_canvasight_recent_project"), true);
    assert.equal(toolNames.has("write_canvasight_graph"), true);
    assert.equal(toolNames.has("await_canvasight_run"), true);
    assert.equal(toolNames.has("close_canvasight"), true);

    const autoOpened = await request("tools/call", {
      name: "open_canvasight",
      arguments: {
        language: "zh"
      }
    });
    assert.equal(autoOpened.structuredContent.status, "opened");
    daemonToken = new URL(autoOpened.structuredContent.url).searchParams.get("token") || daemonToken;
    assert.equal(autoOpened.structuredContent.browserUrl, autoOpened.structuredContent.url);
    assert.match(autoOpened.content[0].text, /Navigate the in-app browser to this full URL:/);
    assert.equal(autoOpened.structuredContent.projectPath, defaultProjectPath);
    assert.equal(await fsp.stat(path.join(defaultProjectPath, ".scatter", "scatter.json")).then((stat) => stat.isFile()), true);
    const autoPageResponse = await fetch(autoOpened.structuredContent.browserUrl);
    assert.equal(autoPageResponse.ok, true);
    assert.match(await autoPageResponse.text(), /id="root"/);
    const autoHealth = await fetchJson(`${autoOpened.structuredContent.origin}/api/health`);
    assert.equal(autoHealth.serverVersion, "0.1.2");
    const autoSession = await fetchJson(`${autoOpened.structuredContent.origin}/api/sessions/${autoOpened.structuredContent.sessionId}`);
    assert.deepEqual(autoSession, {
      codexThreadId: "thread-smoke",
      language: "zh",
      projectPath: defaultProjectPath,
      sessionId: autoOpened.structuredContent.sessionId
    });
    const recentAfterAutoOpen = await request("tools/call", {
      name: "list_canvasight_recent_projects",
      arguments: {}
    });
    assert.equal(recentAfterAutoOpen.structuredContent.status, "listed");
    assert.equal(recentAfterAutoOpen.structuredContent.projects[0].path, defaultProjectPath);
    assert.equal(recentAfterAutoOpen.structuredContent.projects[0].hasScatter, true);
    await request("tools/call", {
      name: "close_canvasight",
      arguments: {
        sessionId: autoOpened.structuredContent.sessionId
      }
    });

    const projectPath = path.join(tempRoot, "demo-project");
    const opened = await request("tools/call", {
      name: "open_canvasight",
      arguments: {
        projectPath,
        language: "en"
      }
    });
    assert.equal(opened.structuredContent.status, "opened");
    daemonToken = new URL(opened.structuredContent.url).searchParams.get("token") || daemonToken;
    assert.equal(opened.structuredContent.browserUrl, opened.structuredContent.url);
    assert.equal(opened.structuredContent.projectPath, projectPath);
    assert.equal(opened.structuredContent.codexThreadId, "thread-smoke");

    const recentAfterProjectOpen = await request("tools/call", {
      name: "list_canvasight_recent_projects",
      arguments: {
        limit: 2
      }
    });
    assert.equal(recentAfterProjectOpen.structuredContent.projects.length, 2);
    assert.equal(recentAfterProjectOpen.structuredContent.projects[0].path, projectPath);
    assert.equal(recentAfterProjectOpen.structuredContent.projects[1].path, defaultProjectPath);

    const recentOpened = await request("tools/call", {
      name: "open_canvasight_recent_project",
      arguments: {
        language: "zh"
      }
    });
    assert.equal(recentOpened.structuredContent.status, "opened");
    assert.equal(recentOpened.structuredContent.projectPath, projectPath);
    assert.equal(recentOpened.structuredContent.language, "zh");
    await request("tools/call", {
      name: "close_canvasight",
      arguments: {
        sessionId: recentOpened.structuredContent.sessionId
      }
    });

    const sessionId = opened.structuredContent.sessionId;
    const origin = opened.structuredContent.origin;
    const session = await fetchJson(`${origin}/api/sessions/${sessionId}`);
    assert.deepEqual(session, {
      codexThreadId: "thread-smoke",
      language: "en",
      projectPath,
      sessionId
    });

    const emptyTemplates = await fetchJson(`${origin}/api/templates`);
    assert.deepEqual(emptyTemplates, []);
    const templateSourceAttachmentPath = path.join(tempRoot, "template-source.txt");
    await fsp.writeFile(templateSourceAttachmentPath, "template attachment", "utf8");
    const savedTemplate = await fetchJson(`${origin}/api/templates`, {
      method: "POST",
      body: JSON.stringify({
        template: {
          title: "Smoke template",
          body: "Use this reusable prompt in any project.",
          attachments: [
            {
              id: "template-source",
              kind: "file",
              source: "upload",
              originalName: "template-source.txt",
              storedPath: templateSourceAttachmentPath,
              relativePath: "",
              fileUrl: "",
              mime: "text/plain",
              size: 19,
              createdAt: "2026-07-04T00:00:00.000Z"
            }
          ]
        }
      })
    });
    assert.equal(savedTemplate.title, "Smoke template");
    assert.equal(savedTemplate.attachments.length, 1);
    assert.equal(savedTemplate.attachments[0].originalName, "template-source.txt");
    assert.equal(savedTemplate.attachments[0].storedPath.startsWith(canvasightHome), true);
    assert.equal(await fsp.readFile(savedTemplate.attachments[0].storedPath, "utf8"), "template attachment");
    const templateAssetResponse = await fetch(`${origin}${savedTemplate.attachments[0].fileUrl}`);
    assert.equal(templateAssetResponse.ok, true);
    assert.equal(await templateAssetResponse.text(), "template attachment");
    const templatesAfterSave = await fetchJson(`${origin}/api/templates`);
    assert.equal(templatesAfterSave.length, 1);
    assert.equal(templatesAfterSave[0].id, savedTemplate.id);

    const openProject = await fetchJson(`${origin}/api/sessions/${sessionId}/open-project`, {
      method: "POST",
      body: JSON.stringify({ projectPath })
    });
    assert.equal(openProject.document.version, 1);
    assert.equal(openProject.project.path, projectPath);
    assert.equal(Array.isArray(openProject.document.pages), true);
    assert.equal(openProject.document.pages.length, 1);
    assert.equal(openProject.document.activePageId, openProject.document.pages[0].id);

    const graphWritten = await request("tools/call", {
      name: "write_canvasight_graph",
      arguments: {
        projectPath,
        pageName: "Code Architecture",
        layout: "grid",
        nodes: [
          {
            id: "entry",
            title: "Entry points",
            body: "Map CLI and browser entry points.",
            codexMode: "chat"
          },
          {
            id: "api",
            title: "API layer",
            body: "Summarize HTTP and MCP API responsibilities.",
            codexMode: "plan"
          },
          {
            id: "store",
            title: "Canvas store",
            body: "Explain page, node, and edge state ownership.",
            codexMode: "goal"
          }
        ],
        edges: [
          {
            id: "entry-api",
            source: "entry",
            target: "api",
            label: "calls"
          },
          {
            id: "api-store",
            source: "api",
            target: "store",
            label: "updates"
          }
        ]
      }
    });
    assert.equal(graphWritten.structuredContent.status, "written");
    assert.equal(graphWritten.structuredContent.projectPath, projectPath);
    assert.equal(graphWritten.structuredContent.activePageName, "Code Architecture");
    assert.deepEqual(graphWritten.structuredContent.nodeIds, ["entry", "api", "store"]);
    assert.deepEqual(graphWritten.structuredContent.edgeIds, ["entry-api", "api-store"]);

    const graphScatterJson = JSON.parse(await fsp.readFile(path.join(projectPath, ".scatter", "scatter.json"), "utf8"));
    assert.equal(graphScatterJson.version, 1);
    assert.equal(graphScatterJson.projectName, "demo-project");
    assert.equal(graphScatterJson.activePageId, graphWritten.structuredContent.activePageId);
    assert.equal(graphScatterJson.pages.length, 2);
    assert.equal(graphScatterJson.nodes.length, 3);
    assert.equal(graphScatterJson.edges.length, 2);
    assert.equal(graphScatterJson.nodes[1].data.codexMode, "plan");
    assert.equal(graphScatterJson.nodes[1].data.planMode, true);
    assert.equal(graphScatterJson.nodes[2].data.codexMode, "goal");
    assert.equal(graphScatterJson.nodes[2].position.x, 920);
    assert.equal(graphScatterJson.edges[0].source, "entry");
    assert.equal(graphScatterJson.edges[1].target, "store");

    const fanOutGraph = await request("tools/call", {
      name: "write_canvasight_graph",
      arguments: {
        projectPath,
        pageName: "Fan-out Requirements",
        layout: "grid",
        nodes: [
          { id: "root", title: "Product goal", body: "Define the core product outcome." },
          { id: "research", title: "Research", body: "Collect user and market constraints." },
          { id: "design", title: "Design", body: "Turn constraints into interface structure." },
          { id: "build", title: "Build", body: "Implement the selected product path." }
        ],
        edges: [
          { id: "root-research", source: "root", target: "research" },
          { id: "root-design", source: "root", target: "design" },
          { id: "root-build", source: "root", target: "build" }
        ]
      }
    });
    assert.equal(fanOutGraph.structuredContent.status, "written");
    assert.equal(fanOutGraph.structuredContent.activePageName, "Fan-out Requirements");
    assert.deepEqual(fanOutGraph.structuredContent.nodeIds, ["root", "research", "design", "build"]);
    assert.deepEqual(fanOutGraph.structuredContent.edgeIds, ["root-research", "root-design", "root-build"]);

    const fanOutScatterJson = JSON.parse(await fsp.readFile(path.join(projectPath, ".scatter", "scatter.json"), "utf8"));
    assert.equal(fanOutScatterJson.pages.length, 3);
    assert.equal(fanOutScatterJson.nodes.length, 4);
    assert.equal(fanOutScatterJson.edges.length, 3);
    assert.equal(fanOutScatterJson.edges.every((edge) => edge.source === "root"), true);
    assert.deepEqual(
      fanOutScatterJson.edges.map((edge) => edge.target),
      ["research", "design", "build"]
    );

    await assert.rejects(
      () =>
        request("tools/call", {
          name: "write_canvasight_graph",
          arguments: {
            projectPath,
            pageName: "Invalid Graph",
            nodes: [
              {
                id: "only-node",
                title: "Only node",
                body: "This graph has an invalid edge."
              }
            ],
            edges: [
              {
                source: "only-node",
                target: "missing-node"
              }
            ]
          }
        }),
      /target must reference an existing node id/
    );

    await assert.rejects(
      () =>
        request("tools/call", {
          name: "write_canvasight_graph",
          arguments: {
            projectPath,
            pageName: "Invalid Parent Graph",
            nodes: [
              { id: "parent-a", title: "Parent A", body: "First parent." },
              { id: "parent-b", title: "Parent B", body: "Second parent." },
              { id: "child", title: "Child", body: "Only one parent is allowed." }
            ],
            edges: [
              { source: "parent-a", target: "child" },
              { source: "parent-b", target: "child" }
            ]
          }
        }),
      /Node already has a parent edge: child/
    );

    const document = {
      version: 1,
      projectName: "demo-project",
      updatedAt: "2026-07-04T00:00:00.000Z",
      activePageId: "page-main",
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
            codexMode: "plan",
            effort: "high",
            planMode: true,
            runMode: "flow"
          }
        }
      ],
      edges: [],
      pages: [
        {
          id: "page-main",
          name: "Main Page",
          createdAt: "2026-07-04T00:00:00.000Z",
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
                codexMode: "plan",
                effort: "high",
                planMode: true,
                runMode: "flow"
              }
            }
          ],
          edges: []
        },
        {
          id: "page-empty",
          name: "Empty Page",
          createdAt: "2026-07-04T00:00:00.000Z",
          updatedAt: "2026-07-04T00:00:00.000Z",
          viewport: { x: 0, y: 0, zoom: 1 },
          nodes: [],
          edges: []
        }
      ]
    };
    const savedDocument = await fetchJson(`${origin}/api/sessions/${sessionId}/document`, {
      method: "POST",
      body: JSON.stringify({ projectPath, document })
    });
    assert.equal(savedDocument.nodes[0].id, "node-a");
    assert.equal(savedDocument.activePageId, "page-main");
    assert.equal(savedDocument.pages.length, 2);
    assert.equal(savedDocument.pages[0].nodes[0].id, "node-a");
    assert.equal(savedDocument.pages[1].nodes.length, 0);
    const recentAfterDocumentSave = await request("tools/call", {
      name: "list_canvasight_recent_projects",
      arguments: {
        limit: 1
      }
    });
    assert.equal(recentAfterDocumentSave.structuredContent.projects[0].updatedAt, document.updatedAt);

    const scatterJson = JSON.parse(await fsp.readFile(path.join(projectPath, ".scatter", "scatter.json"), "utf8"));
    assert.equal(scatterJson.version, 1);
    assert.equal(scatterJson.nodes[0].data.title, "Smoke task");
    assert.equal(scatterJson.nodes[0].data.codexMode, "plan");
    assert.equal(scatterJson.nodes[0].data.planMode, true);

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
      codexMode: "goal",
      effort: "high",
      planMode: false,
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
    assert.equal(awaited.structuredContent.codexMode, "goal");
    assert.equal(awaited.structuredContent.planMode, false);
    assert.equal(awaited.structuredContent.codexNative.status, "applied");
    assert.equal(awaited.structuredContent.codexNative.action, "thread/goal/set");
    assert.equal(awaited.structuredContent.codexNative.threadId, "thread-smoke");
    assert.deepEqual(awaited.structuredContent.nodeIds, ["node-a"]);
    assert.equal(awaited.structuredContent.attachments[0].originalName, "note.txt");

    const goalNativeLog = await readNativeLog();
    assert.equal(goalNativeLog.some((entry) => entry.method === "thread/goal/set" && entry.params.threadId === "thread-smoke"), true);
    assert.equal(
      goalNativeLog.some(
        (entry) =>
          entry.method === "thread/settings/update" &&
          entry.params.threadId === "thread-smoke" &&
          entry.params.collaborationMode.mode === "default"
      ),
      true
    );

    const waitForLegacyRun = request("tools/call", {
      name: "await_canvasight_run",
      arguments: {
        sessionId,
        timeoutMs: 5000
      }
    });
    await fetchJson(`${origin}/api/sessions/${sessionId}/run`, {
      method: "POST",
      body: JSON.stringify({
        ...runPayload,
        codexMode: undefined,
        planMode: true,
        threadName: "Scatter Flow: Legacy plan task"
      })
    });
    const legacyAwaited = await waitForLegacyRun;
    assert.equal(legacyAwaited.structuredContent.codexMode, "plan");
    assert.equal(legacyAwaited.structuredContent.planMode, true);
    assert.equal(legacyAwaited.structuredContent.codexNative.status, "applied");
    assert.equal(legacyAwaited.structuredContent.codexNative.action, "thread/settings/update");
    assert.equal(legacyAwaited.structuredContent.codexNative.collaborationMode, "plan");

    const planNativeLog = await readNativeLog();
    assert.equal(
      planNativeLog.some(
        (entry) =>
          entry.method === "thread/settings/update" &&
          entry.params.threadId === "thread-smoke" &&
          entry.params.collaborationMode.mode === "plan"
      ),
      true
    );

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

    const persistentProjectPath = path.join(tempRoot, "persistent-project");
    const persistentOpened = await request("tools/call", {
      name: "open_canvasight",
      arguments: {
        projectPath: persistentProjectPath,
        language: "en"
      }
    });
    assert.equal(persistentOpened.structuredContent.status, "opened");
    daemonToken = new URL(persistentOpened.structuredContent.url).searchParams.get("token") || daemonToken;
    const persistentOrigin = persistentOpened.structuredContent.origin;
    const persistentSessionId = persistentOpened.structuredContent.sessionId;
    assert.equal(await fetchJson(`${persistentOrigin}/api/health`).then((health) => health.status), "ok");

    child.stdin.end();
    child.kill("SIGTERM");
    await new Promise((resolve) => child.once("exit", resolve));

    const persistedSession = await fetchJson(`${persistentOrigin}/api/sessions/${persistentSessionId}`);
    assert.equal(persistedSession.sessionId, persistentSessionId);
    assert.equal(persistedSession.projectPath, persistentProjectPath);
    const persistedTemplates = await fetchJson(`${persistentOrigin}/api/templates`);
    const persistedTemplate = persistedTemplates.find((template) => template.id === savedTemplate.id);
    assert.equal(persistedTemplate?.body, savedTemplate.body);
    assert.equal(persistedTemplate?.attachments[0]?.originalName, "template-source.txt");

    const mcpB = createMcpClient("smoke-b", {
      CANVASIGHT_CODEX_NATIVE: "0",
      CODEX_THREAD_ID: "thread-smoke-b"
    });
    try {
      const initializedB = await mcpB.request("initialize", {
        protocolVersion: "2024-11-05",
        capabilities: {},
        clientInfo: {
          name: "canvasight-smoke-b",
          version: "0.0.0"
        }
      });
      assert.equal(initializedB.serverInfo.name, "canvasight");
      mcpB.notify("notifications/initialized", {});

      const crossWait = mcpB.request("tools/call", {
        name: "await_canvasight_run",
        arguments: {
          projectPath: persistentProjectPath,
          timeoutMs: 5000
        }
      });

      const crossPayload = {
        sessionId: persistentSessionId,
        threadName: "Persistent Flow",
        projectPath: persistentProjectPath,
        markdown: "# Persistent Flow\n\nRun from the old browser session.",
        imagePaths: [],
        codexMode: "plan",
        effort: "medium",
        planMode: true,
        runMode: "flow",
        nodeIds: ["persistent-node"],
        attachments: []
      };
      const crossQueued = await fetchJson(`${persistentOrigin}/api/sessions/${persistentSessionId}/run`, {
        method: "POST",
        body: JSON.stringify(crossPayload)
      });
      assert.equal(crossQueued.status, "queued");

      const crossAwaited = await crossWait;
      assert.equal(crossAwaited.content[0].text, crossPayload.markdown);
      assert.equal(crossAwaited.structuredContent.status, "received");
      assert.equal(crossAwaited.structuredContent.sessionId, persistentSessionId);
      assert.equal(crossAwaited.structuredContent.projectPath, persistentProjectPath);
      assert.equal(crossAwaited.structuredContent.codexMode, "plan");
      assert.equal(crossAwaited.structuredContent.codexNative.status, "disabled");
      assert.deepEqual(crossAwaited.structuredContent.nodeIds, ["persistent-node"]);

      const drained = await mcpB.request("tools/call", {
        name: "await_canvasight_run",
        arguments: {
          projectPath: persistentProjectPath,
          timeoutMs: 20
        }
      });
      assert.equal(drained.structuredContent.status, "timeout");
    } finally {
      mcpB.stop();
    }

    clearTimeout(killTimer);
    console.log("MCP smoke test passed");
  } finally {
    clearTimeout(killTimer);
    await stopDaemon();
    await fsp.rm(tempRoot, { recursive: true, force: true });
    if (!child.stdin.destroyed) child.stdin.end();
    if (!child.killed) child.kill("SIGTERM");
  }
}

main().catch((error) => {
  console.error(error);
  child.kill("SIGTERM");
  process.exitCode = 1;
});
