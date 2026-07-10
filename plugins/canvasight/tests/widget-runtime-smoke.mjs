#!/usr/bin/env node
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import fs from "node:fs";
import fsp from "node:fs/promises";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pluginRoot = path.resolve(__dirname, "..");
const serverPath = path.join(pluginRoot, "mcp", "server.mjs");
const chromePath = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

assert.equal(fs.existsSync(chromePath), true, `Chrome is required for the composed widget smoke: ${chromePath}`);

const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "canvasight-widget-runtime-"));
const canvasightHome = path.join(tempRoot, "home");
const projectPath = path.join(tempRoot, "project");
fs.mkdirSync(projectPath, { recursive: true });

function createMcpClient() {
  const child = spawn(process.execPath, [serverPath], {
    cwd: pluginRoot,
    env: {
      ...process.env,
      CANVASIGHT_HOME: canvasightHome,
      CANVASIGHT_DEFAULT_PROJECT_PATH: projectPath,
      CANVASIGHT_OPEN_BROWSER: "0",
      CANVASIGHT_OPEN_EXTERNAL_BROWSER: "0",
      CODEX_THREAD_ID: "thread-composed-widget"
    },
    stdio: ["pipe", "pipe", "pipe"]
  });
  let nextId = 1;
  let buffer = "";
  let stderr = "";
  const pending = new Map();
  child.stdout.setEncoding("utf8");
  child.stdout.on("data", (chunk) => {
    buffer += chunk;
    while (buffer.includes("\n")) {
      const index = buffer.indexOf("\n");
      const line = buffer.slice(0, index).trim();
      buffer = buffer.slice(index + 1);
      if (!line) continue;
      const message = JSON.parse(line);
      const handler = pending.get(message.id);
      if (!handler) continue;
      pending.delete(message.id);
      if (message.error) handler.reject(new Error(message.error.message));
      else handler.resolve(message.result);
    }
  });
  child.stderr.setEncoding("utf8");
  child.stderr.on("data", (chunk) => { stderr += chunk; });
  child.on("exit", (code, signal) => {
    for (const handler of pending.values()) handler.reject(new Error(`MCP exited code=${code} signal=${signal}: ${stderr}`));
    pending.clear();
  });
  return {
    child,
    request(method, params) {
      const id = nextId++;
      const promise = new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
      child.stdin.write(`${JSON.stringify({ jsonrpc: "2.0", id, method, params })}\n`);
      return promise;
    },
    notify(method, params) {
      child.stdin.write(`${JSON.stringify({ jsonrpc: "2.0", method, params })}\n`);
    }
  };
}

function hostHtml(widgetData) {
  const page = {
    id: "page-composed",
    name: "Page 1",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    viewport: { x: 0, y: 0, zoom: 1 },
    nodes: [],
    edges: []
  };
  const document = {
    version: 1,
    projectName: "Composed Widget Project",
    updatedAt: new Date().toISOString(),
    activePageId: page.id,
    pages: [page],
    viewport: page.viewport,
    nodes: [],
    edges: []
  };
  const session = {
    sessionId: widgetData.sessionId,
    projectPath,
    documentRevision: 1,
    language: "en",
    codexThreadId: "thread-composed-widget"
  };
  const opened = {
    project: { name: "Composed Widget Project", path: projectPath, updatedAt: document.updatedAt },
    document,
    documentRevision: 1
  };
  return `<!doctype html><html><body style="margin:0"><iframe id="widget" src="/widget" style="width:1200px;height:800px;border:0"></iframe><script>
  const widgetData = ${JSON.stringify(widgetData)};
  const session = ${JSON.stringify(session)};
  const opened = ${JSON.stringify(opened)};
  window.__HOST_RECORDS__ = { messages: [], toolCalls: [], ready: null, errors: [] };
  const frame = document.getElementById('widget');
  function send(message) { frame.contentWindow.postMessage(message, '*'); }
  function result(id, value) { send({ jsonrpc: '2.0', id, result: value }); }
  window.addEventListener('error', (event) => window.__HOST_RECORDS__.errors.push(event.message));
  window.addEventListener('message', (event) => {
    if (event.source !== frame.contentWindow || !event.data || typeof event.data !== 'object') return;
    const message = event.data;
    window.__HOST_RECORDS__.messages.push(message);
    if (message.method === 'ui/initialize') {
      result(message.id, {
        protocolVersion: '2026-01-26',
        hostInfo: { name: 'canvasight-composed-fake-host', version: '1.0.0' },
        hostCapabilities: { message: {} },
        hostContext: {
          theme: 'light',
          displayMode: 'fullscreen',
          availableDisplayModes: ['inline', 'fullscreen'],
          containerDimensions: { width: 1200, height: 800 }
        }
      });
      return;
    }
    if (message.method === 'ui/request-display-mode') {
      result(message.id, { mode: 'fullscreen' });
      return;
    }
    if (message.method === 'ui/message') {
      result(message.id, {});
      return;
    }
    if (message.method === 'tools/call') {
      const request = message.params || {};
      const args = request.arguments || {};
      window.__HOST_RECORDS__.toolCalls.push(args);
      let data = null;
      if (args.path === '/api/templates') data = [];
      else if (args.path && args.path.endsWith('/open-project')) data = opened;
      else if (args.path && args.path.endsWith('/widget-ready')) {
        window.__HOST_RECORDS__.ready = { identity: args, body: args.body };
        data = { ...args.body, status: 'ready', verified: true, reportedAt: new Date().toISOString() };
      } else if (args.path && args.path.includes('/api/sessions/')) data = session;
      result(message.id, { content: [], structuredContent: { ok: true, status: 200, data, error: null, code: null } });
      return;
    }
    if (message.method === 'ui/notifications/initialized') {
      send({
        jsonrpc: '2.0',
        method: 'ui/notifications/tool-result',
        params: { content: [], structuredContent: { status: 'opening' }, _meta: { widgetData } }
      });
    }
  });
  </script></body></html>`;
}

function createCdpClient(webSocketUrl) {
  const socket = new WebSocket(webSocketUrl);
  let nextId = 1;
  const pending = new Map();
  socket.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    const handler = pending.get(message.id);
    if (!handler) return;
    pending.delete(message.id);
    if (message.error) handler.reject(new Error(message.error.message));
    else handler.resolve(message.result);
  });
  const opened = new Promise((resolve, reject) => {
    socket.addEventListener("open", resolve, { once: true });
    socket.addEventListener("error", reject, { once: true });
  });
  return {
    async send(method, params = {}) {
      await opened;
      const id = nextId++;
      const promise = new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
      socket.send(JSON.stringify({ id, method, params }));
      return promise;
    },
    close() { socket.close(); }
  };
}

async function waitForEvaluation(cdp, expression, label, timeoutMs = 20_000) {
  const deadline = Date.now() + timeoutMs;
  let last;
  while (Date.now() < deadline) {
    const response = await cdp.send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
    if (response.exceptionDetails) last = response.exceptionDetails.text;
    else if (response.result.value) return response.result.value;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  const diagnostics = await cdp.send("Runtime.evaluate", {
    expression: `(() => { const frame=document.getElementById('widget'); const doc=frame&&frame.contentDocument; return { host: window.__HOST_RECORDS__, body: doc&&doc.body&&doc.body.innerText.slice(0,1000), status: doc&&doc.getElementById('canvasight-widget-status')&&doc.getElementById('canvasight-widget-status').textContent, bridge: frame&&frame.contentWindow.__CANVASIGHT_BRIDGE_STATE__, overlay: Boolean(doc&&doc.querySelector('.canvasight-startup-overlay')), canvas: Boolean(doc&&doc.querySelector('.canvas-shell')) }; })()`,
    returnByValue: true
  });
  assert.fail(`Timed out waiting for ${label}${last ? `: ${last}` : ""}; diagnostics=${JSON.stringify(diagnostics.result?.value)}`);
}

const mcp = createMcpClient();
let chrome;
let webServer;
try {
  await mcp.request("initialize", { protocolVersion: "2024-11-05", capabilities: {}, clientInfo: { name: "widget-runtime-smoke", version: "1" } });
  mcp.notify("notifications/initialized", {});
  const opened = await mcp.request("tools/call", {
    name: "open_canvasight",
    arguments: { projectPath, language: "en", threadId: "thread-composed-widget" }
  });
  assert.equal(opened.structuredContent.status, "opening");
  assert.equal(opened.structuredContent.targetDisplayMode, "fullscreen");
  const resource = await mcp.request("resources/read", { uri: "ui://widget/canvasight/canvas.html" });
  const widgetHtml = resource.contents[0].text;
  assert.match(widgetHtml, /id="canvasightAppModule" type="module"/);
  assert.ok(widgetHtml.length > 100_000, "generated widget must contain the production bundle, not a shell stub");

  const widgetData = opened._meta.widgetData;
  webServer = http.createServer((req, res) => {
    res.setHeader("content-type", "text/html; charset=utf-8");
    if (req.url === "/widget") res.end(widgetHtml);
    else res.end(hostHtml(widgetData));
  });
  await new Promise((resolve) => webServer.listen(0, "127.0.0.1", resolve));
  const address = webServer.address();
  const hostUrl = `http://127.0.0.1:${address.port}/host`;

  chrome = spawn(chromePath, [
    "--headless=new",
    "--no-sandbox",
    "--disable-gpu",
    "--no-first-run",
    `--user-data-dir=${path.join(tempRoot, "chrome")}`,
    "--remote-debugging-port=0",
    "about:blank"
  ], { stdio: ["ignore", "ignore", "pipe"] });
  let chromeStderr = "";
  const browserWs = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Chrome DevTools endpoint timed out: ${chromeStderr}`)), 10_000);
    chrome.stderr.setEncoding("utf8");
    chrome.stderr.on("data", (chunk) => {
      chromeStderr += chunk;
      const match = chromeStderr.match(/DevTools listening on (ws:\/\/[^\s]+)/);
      if (!match) return;
      clearTimeout(timer);
      resolve(match[1]);
    });
  });
  const endpoint = new URL(browserWs);
  const targets = await (await fetch(`http://${endpoint.host}/json/new?${encodeURIComponent(hostUrl)}`, { method: "PUT" })).json();
  const cdp = createCdpClient(targets.webSocketDebuggerUrl);
  await cdp.send("Runtime.enable");
  await cdp.send("Page.enable");

  const evidence = await waitForEvaluation(cdp, `(() => {
    const frame = document.getElementById('widget');
    const doc = frame && frame.contentDocument;
    const canvas = doc && doc.querySelector('.canvas-shell');
    const overlay = doc && doc.querySelector('.canvasight-startup-overlay');
    const ready = window.__HOST_RECORDS__ && window.__HOST_RECORDS__.ready;
    if (!canvas || overlay || !ready) return false;
    const rect = canvas.getBoundingClientRect();
    const style = frame.contentWindow.getComputedStyle(canvas);
    const point = doc.elementFromPoint(rect.left + Math.min(40, rect.width / 2), rect.top + Math.min(40, rect.height / 2));
    return {
      width: rect.width,
      height: rect.height,
      display: style.display,
      visibility: style.visibility,
      hitCanvas: Boolean(point && point.closest('.canvas-shell')),
      statusText: (doc.getElementById('canvasight-widget-status') || {}).textContent || '',
      ready,
      bridgeStage: frame.contentWindow.__CANVASIGHT_BRIDGE_STATE__ && frame.contentWindow.__CANVASIGHT_BRIDGE_STATE__.startupStage,
      errors: window.__HOST_RECORDS__.errors
    };
  })()`, "production canvas ready and visible");

  assert.ok(evidence.width > 0 && evidence.height > 0);
  assert.notEqual(evidence.display, "none");
  assert.notEqual(evidence.visibility, "hidden");
  assert.equal(evidence.hitCanvas, true, "a point on the canvas must be interactively hit-testable");
  assert.equal(evidence.statusText, "", "the static fallback status must leave after React owns startup");
  assert.equal(evidence.bridgeStage, "ready");
  assert.equal(evidence.ready.identity.openAttemptId, widgetData.openAttemptId);
  assert.match(evidence.ready.identity.widgetInstanceId, /^widget-/);
  assert.equal(evidence.ready.identity.displayMode, "fullscreen");
  assert.equal(evidence.ready.body.reactMounted, true);
  assert.equal(evidence.ready.body.projectHydrated, true);
  assert.equal(evidence.ready.body.canvasRendered, true);
  assert.equal(evidence.ready.body.canvasVisible, true);
  assert.ok(evidence.ready.body.canvasWidth > 0 && evidence.ready.body.canvasHeight > 0);
  assert.deepEqual(evidence.errors, []);
  cdp.close();
  console.log("Canvasight composed production widget smoke passed.");
} finally {
  if (chrome && !chrome.killed) chrome.kill("SIGTERM");
  if (webServer) await new Promise((resolve) => webServer.close(resolve));
  if (mcp.child && !mcp.child.killed) mcp.child.kill("SIGTERM");
  const stopper = spawn(process.execPath, [serverPath, "--stop-daemon", `--canvasight-home=${canvasightHome}`], { cwd: pluginRoot, stdio: "ignore" });
  await new Promise((resolve) => stopper.on("exit", resolve));
  await fsp.rm(tempRoot, { recursive: true, force: true });
}
