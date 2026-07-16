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
const visualOutputPath = path.resolve(pluginRoot, "..", "..", "output", "playwright", "framework-questions");
fs.mkdirSync(projectPath, { recursive: true });
const thumbnailPng = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=", "base64");
const thumbnailDataUrl = `data:image/png;base64,${thumbnailPng.toString("base64")}`;
const thumbnailGif = Buffer.from("R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==", "base64");
const thumbnailGifDataUrl = `data:image/gif;base64,${thumbnailGif.toString("base64")}`;

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
  const thumbnailPath = path.join(projectPath, ".scatter", "assets", "thumbnail.png");
  const thumbnailGifPath = path.join(projectPath, ".scatter", "assets", "thumbnail.gif");
  const page = {
    id: "page-composed",
    name: "Page 1",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    viewport: { x: 80, y: 60, zoom: 0.8 },
    nodes: [
      {
        id: "node-a",
        type: "task",
        position: { x: 100, y: 120 },
        data: {
          title: "Thread return source",
          body: "Must remain visible after host restore.",
          attachments: [{
            id: "attachment-image",
            kind: "image",
            source: "paste",
            originalName: "thumbnail.png",
            storedPath: thumbnailPath,
            relativePath: ".scatter/assets/thumbnail.png",
            fileUrl: `/api/asset?path=${encodeURIComponent(Buffer.from(thumbnailPath).toString("base64url"))}&token=daemon-secret-must-not-cross-widget-tool`,
            mime: "image/png",
            size: thumbnailPng.length,
            createdAt: new Date().toISOString()
          }, {
            id: "attachment-image-gif",
            kind: "image",
            source: "paste",
            originalName: "thumbnail.gif",
            storedPath: thumbnailGifPath,
            relativePath: ".scatter/assets/thumbnail.gif",
            fileUrl: `/api/asset?path=${encodeURIComponent(Buffer.from(thumbnailGifPath).toString("base64url"))}&token=second-daemon-secret`,
            mime: "image/gif",
            size: thumbnailGif.length,
            createdAt: new Date().toISOString()
          }],
          effort: "xhigh",
          runMode: "flow"
        }
      },
      {
        id: "node-b",
        type: "task",
        position: { x: 680, y: 120 },
        data: { title: "Thread return target", body: "The edge and viewport must survive.", attachments: [], effort: "xhigh", runMode: "flow" }
      }
    ],
    edges: [{ id: "edge-a-b", source: "node-a", target: "node-b" }]
  };
  const document = {
    version: 1,
    projectName: "Composed Widget Project",
    updatedAt: new Date().toISOString(),
    activePageId: page.id,
    pages: [page],
    viewport: page.viewport,
    nodes: page.nodes,
    edges: page.edges
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
  const widgetData = ${JSON.stringify({ ...widgetData, apiBaseUrl: "http://127.0.0.1:1" })};
  const session = ${JSON.stringify(session)};
  const opened = ${JSON.stringify(opened)};
  window.__HOST_RECORDS__ = { messages: [], toolCalls: [], ready: null, readyInstances: [], errors: [], revisionPolls: [], revisionOwner: null, revisionInFlight: 0, revisionMaxInFlight: 0, teardownResponses: [] };
  const frame = document.getElementById('widget');
  function send(message, target = frame.contentWindow) { target.postMessage(message, '*'); }
  function result(target, id, value) { send({ jsonrpc: '2.0', id, result: value }, target); }
  window.__HOST_SEND_WIDGET_DATA__ = (nextWidgetData, target = frame.contentWindow) => send({
    jsonrpc: '2.0',
    method: 'ui/notifications/tool-result',
    params: { content: [], structuredContent: { status: 'opening' }, _meta: { widgetData: nextWidgetData } }
  }, target);
  window.__HOST_TEARDOWN__ = (target = frame.contentWindow) => {
    const id = 900000 + window.__HOST_RECORDS__.teardownResponses.length;
    send({ jsonrpc: '2.0', id, method: 'ui/resource-teardown', params: {} }, target);
    return id;
  };
  window.addEventListener('error', (event) => window.__HOST_RECORDS__.errors.push(event.message));
  window.addEventListener('message', (event) => {
    const knownFrame = Array.from(document.querySelectorAll('iframe')).some((candidate) => candidate.contentWindow === event.source);
    if (!knownFrame || !event.data || typeof event.data !== 'object') return;
    const message = event.data;
    window.__HOST_RECORDS__.messages.push(message);
    if (!message.method && message.id >= 900000) {
      window.__HOST_RECORDS__.teardownResponses.push(message);
      return;
    }
    if (message.method === 'ui/initialize') {
      result(event.source, message.id, {
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
      result(event.source, message.id, { mode: 'fullscreen' });
      return;
    }
    if (message.method === 'ui/message') {
      result(event.source, message.id, {});
      return;
    }
    if (message.method === 'tools/call') {
      const request = message.params || {};
      const args = request.arguments || {};
      window.__HOST_RECORDS__.toolCalls.push(args);
      let data = null;
      if (args.path === '/api/templates') data = [];
      else if (args.path === '/api/preferences') data = { aiSkillAssignmentEnabled: false };
      else if (args.path && args.path.endsWith('/attachment-preview')) {
        data = args.body && args.body.storedPath === ${JSON.stringify(thumbnailGifPath)}
          ? { dataBase64: ${JSON.stringify(thumbnailGif.toString("base64"))}, mime: 'image/gif', size: ${thumbnailGif.length} }
          : { dataBase64: ${JSON.stringify(thumbnailPng.toString("base64"))}, mime: 'image/png', size: ${thumbnailPng.length} };
      }
      else if (args.path && args.path.startsWith('/api/skills')) data = { status: 'ok', query: '', count: 0, total: 0, skills: [] };
      else if (args.path && args.path.endsWith('/open-project')) data = opened;
      else if (args.path && args.path.endsWith('/widget-ready')) {
        window.__HOST_RECORDS__.ready = { identity: args, body: args.body };
        window.__HOST_RECORDS__.readyInstances.push(args.widgetInstanceId);
        data = { ...args.body, status: 'ready', verified: true, reportedAt: new Date().toISOString() };
      } else if (args.path && args.path.endsWith('/revision-poll')) {
        const ownerId = args.widgetInstanceId;
        const now = Date.now();
        window.__HOST_RECORDS__.revisionInFlight += 1;
        window.__HOST_RECORDS__.revisionMaxInFlight = Math.max(window.__HOST_RECORDS__.revisionMaxInFlight, window.__HOST_RECORDS__.revisionInFlight);
        window.__HOST_RECORDS__.revisionPolls.push({ at: now, method: args.method, widgetInstanceId: ownerId });
        if (args.method === 'DELETE') {
          const released = window.__HOST_RECORDS__.revisionOwner === ownerId;
          if (released) window.__HOST_RECORDS__.revisionOwner = null;
          data = { status: released ? 'released' : 'not-owner', released };
        } else if (!window.__HOST_RECORDS__.revisionOwner || window.__HOST_RECORDS__.revisionOwner === ownerId) {
          window.__HOST_RECORDS__.revisionOwner = ownerId;
          data = { status: 'owner', owner: true, documentRevision: 1, pollIntervalMs: 5000, retryAfterMs: 5000 };
        } else {
          data = { status: 'standby', owner: false, pollIntervalMs: 5000, retryAfterMs: 10000 };
        }
        setTimeout(() => {
          window.__HOST_RECORDS__.revisionInFlight -= 1;
          result(event.source, message.id, { content: [], structuredContent: { ok: true, status: 200, data, error: null, code: null } });
        }, 120);
        return;
      } else if (args.path && args.path.includes('/api/sessions/')) data = session;
      result(event.source, message.id, { content: [], structuredContent: { ok: true, status: 200, data, error: null, code: null } });
      return;
    }
    if (message.method === 'ui/notifications/initialized') {
      send({
        jsonrpc: '2.0',
        method: 'ui/notifications/tool-result',
        params: { content: [], structuredContent: { status: 'opening' }, _meta: { widgetData } }
      }, event.source);
    }
  });
  </script></body></html>`;
}

function frameworkQuestionsHostHtml(toolResult) {
  return `<!doctype html><html><body style="margin:0"><iframe id="widget" src="/framework-widget" style="display:block;width:100%;height:720px;border:0"></iframe><script>
  const toolResult = ${JSON.stringify(toolResult)};
  window.__HOST_RECORDS__ = { displayRequests: [], errors: [], messageAttempts: 0, messages: [], sentMessages: [], toolCalls: [] };
  const frame = document.getElementById('widget');
  function send(message) { frame.contentWindow.postMessage(message, '*'); }
  function result(id, value) { send({ jsonrpc: '2.0', id, result: value }); }
  window.__HOST_SET_THEME__ = (theme) => send({ jsonrpc: '2.0', method: 'ui/notifications/host-context-changed', params: { theme } });
  window.addEventListener('error', (event) => window.__HOST_RECORDS__.errors.push(event.message));
  window.addEventListener('message', (event) => {
    if (event.source !== frame.contentWindow || !event.data || typeof event.data !== 'object') return;
    const message = event.data;
    window.__HOST_RECORDS__.messages.push(message);
    if (message.method === 'ui/notifications/size-changed') {
      const height = Number(message.params && message.params.height);
      if (Number.isFinite(height) && height > 0) frame.style.height = Math.ceil(height) + 'px';
      return;
    }
    if (message.method === 'ui/initialize') {
      result(message.id, {
        protocolVersion: '2026-01-26',
        hostInfo: { name: 'canvasight-inline-fake-host', version: '1.0.0' },
        hostCapabilities: { message: {} },
        hostContext: {
          theme: 'light',
          displayMode: 'inline',
          availableDisplayModes: ['inline', 'fullscreen'],
          containerDimensions: { width: 760, height: 720 }
        }
      });
      return;
    }
    if (message.method === 'ui/request-display-mode') {
      window.__HOST_RECORDS__.displayRequests.push(message.params);
      result(message.id, { mode: 'inline' });
      return;
    }
    if (message.method === 'ui/message') {
      window.__HOST_RECORDS__.messageAttempts += 1;
      window.__HOST_RECORDS__.sentMessages.push(message.params);
      result(message.id, window.__HOST_RECORDS__.messageAttempts === 1 ? { isError: true } : {});
      return;
    }
    if (message.method === 'tools/call') {
      window.__HOST_RECORDS__.toolCalls.push(message.params);
      result(message.id, { content: [], structuredContent: { ok: false, error: 'inline questions must not call server tools' } });
      return;
    }
    if (message.method === 'ui/notifications/initialized') {
      send({
        jsonrpc: '2.0',
        method: 'ui/notifications/tool-result',
        params: toolResult
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

async function captureFrameworkQuestions(cdp, filename) {
  await fsp.mkdir(visualOutputPath, { recursive: true });
  const screenshot = await cdp.send("Page.captureScreenshot", { format: "png", fromSurface: true, captureBeyondViewport: true });
  await fsp.writeFile(path.join(visualOutputPath, filename), Buffer.from(screenshot.data, "base64"));
}

const mcp = createMcpClient();
let chrome;
let webServer;
try {
  await mcp.request("initialize", { protocolVersion: "2024-11-05", capabilities: {}, clientInfo: { name: "widget-runtime-smoke", version: "1" } });
  mcp.notify("notifications/initialized", {});
  const frameworkQuestions = await mcp.request("tools/call", {
    name: "ask_canvasight_framework_questions",
    arguments: {
      title: "Confirm framework direction",
      description: "These answers materially change the graph.",
      language: "en",
      questions: [{
        id: "scope",
        question: "Which scope should the framework cover?",
        selectionMode: "single",
        options: [
          { id: "product", label: "Product only", description: "Keep the framework focused on product responsibilities.", recommended: true },
          { id: "delivery", label: "Product and delivery" }
        ],
        customAnswerLabel: "Another scope"
      }, {
        id: "dimensions",
        question: "Which dimensions must stay explicit?",
        selectionMode: "multiple",
        options: [
          { id: "roles", label: "Roles", description: "Keep ownership explicit across the framework.", recommended: true },
          { id: "stages", label: "Stages" },
          { id: "risks", label: "Risks" }
        ],
        customAnswerLabel: "Additional dimensions"
      }]
    }
  });
  const frameworkResource = await mcp.request("resources/read", { uri: "ui://widget/canvasight/framework-questions.html" });
  const frameworkWidgetHtml = frameworkResource.contents[0].text;
  assert.equal(fs.existsSync(path.join(canvasightHome, "daemon.json")), false, "inline questions must not start the daemon");
  assert.match(frameworkWidgetHtml, /id="canvasightAppModule" type="module"/);
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
    if (req.url === "/thumbnail.png") {
      res.setHeader("content-type", "image/png");
      res.end(thumbnailPng);
    } else {
      res.setHeader("content-type", "text/html; charset=utf-8");
      if (req.url === "/widget") res.end(widgetHtml);
      else if (req.url === "/framework-widget") res.end(frameworkWidgetHtml);
      else if (req.url === "/framework-host") res.end(frameworkQuestionsHostHtml(frameworkQuestions));
      else res.end(hostHtml(widgetData));
    }
  });
  await new Promise((resolve) => webServer.listen(0, "127.0.0.1", resolve));
  const address = webServer.address();
  const hostUrl = `http://127.0.0.1:${address.port}/host`;
  const frameworkHostUrl = `http://127.0.0.1:${address.port}/framework-host`;

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
  const targets = await (await fetch(`http://${endpoint.host}/json/new?${encodeURIComponent(frameworkHostUrl)}`, { method: "PUT" })).json();
  const cdp = createCdpClient(targets.webSocketDebuggerUrl);
  await cdp.send("Runtime.enable");
  await cdp.send("Page.enable");

  const inlineReady = await waitForEvaluation(cdp, `(() => {
    const frame = document.getElementById('widget');
    const doc = frame && frame.contentDocument;
    const form = doc && doc.querySelector('[data-testid="framework-questions"]');
    if (!form) return false;
    return {
      questions: doc.querySelectorAll('[data-testid^="framework-question-"]').length,
      radios: doc.querySelectorAll('input[type="radio"]').length,
      checkboxes: doc.querySelectorAll('input[type="checkbox"]').length,
      textareas: doc.querySelectorAll('textarea').length,
      recommended: doc.body.innerText.includes('Recommended'),
      displayRequests: window.__HOST_RECORDS__.displayRequests,
      toolCalls: window.__HOST_RECORDS__.toolCalls,
      errors: window.__HOST_RECORDS__.errors
    };
  })()`, "inline framework questions mounted");
  assert.deepEqual(inlineReady, {
    questions: 2,
    radios: 2,
    checkboxes: 3,
    textareas: 2,
    recommended: true,
    displayRequests: [],
    toolCalls: [],
    errors: []
  });
  const componentReuse = await waitForEvaluation(cdp, `(() => {
    const doc = document.getElementById('widget').contentDocument;
    const submit = doc.querySelector('[data-testid="framework-submit"]');
    const options = Array.from(doc.querySelectorAll('.framework-question-option'));
    const customInputs = Array.from(doc.querySelectorAll('.framework-question-custom-input'));
    const controls = Array.from(doc.querySelectorAll('.framework-question-control'));
    return {
      kitButton: submit.classList.contains('kit-button') && submit.classList.contains('is-filled'),
      providerCards: options.length > 0 && options.every((option) => option.classList.contains('assistant-provider-card')),
      settingsInputs: customInputs.length > 0 && customInputs.every((input) => input.classList.contains('settings-dialog-input')),
      kitControls: controls.length > 0 && controls.every((control) => control.classList.contains('kit-checkbox'))
    };
  })()`, "inline Canvasight component reuse");
  assert.deepEqual(componentReuse, {
    kitButton: true,
    providerCards: true,
    settingsInputs: true,
    kitControls: true
  });
  const lightCustomInput = await waitForEvaluation(cdp, `(async () => {
    const doc = document.getElementById('widget').contentDocument;
    const input = doc.querySelector('.framework-question-custom-input');
    const custom = input.closest('.framework-question-custom');
    const resolveColor = (variable) => {
      const probe = doc.createElement('span');
      probe.style.color = \`var(\${variable})\`;
      doc.body.appendChild(probe);
      const color = getComputedStyle(probe).color;
      probe.remove();
      return color;
    };
    const baseStyle = getComputedStyle(input);
    const inputRect = input.getBoundingClientRect();
    const customRect = custom.getBoundingClientRect();
    const base = {
      background: baseStyle.backgroundColor,
      minHeight: baseStyle.minHeight,
      height: inputRect.height,
      padding: [baseStyle.paddingTop, baseStyle.paddingRight, baseStyle.paddingBottom, baseStyle.paddingLeft],
      border: baseStyle.borderTopWidth,
      radius: baseStyle.borderRadius,
      lineHeight: baseStyle.lineHeight,
      resize: baseStyle.resize,
      boxSizing: baseStyle.boxSizing,
      contained: inputRect.left >= customRect.left && inputRect.right <= customRect.right && inputRect.width <= customRect.width
    };
    input.focus();
    await new Promise((resolve) => setTimeout(resolve, 200));
    const focusStyle = getComputedStyle(input);
    const focus = {
      visible: input.matches(':focus-visible'),
      background: focusStyle.backgroundColor,
      outlineWidth: focusStyle.outlineWidth,
      outlineColor: focusStyle.outlineColor,
      outlineOffset: focusStyle.outlineOffset
    };
    input.blur();
    input.disabled = true;
    const disabled = { matches: input.matches(':disabled'), background: getComputedStyle(input).backgroundColor, height: input.getBoundingClientRect().height };
    input.disabled = false;
    return {
      tokens: { input: resolveColor('--color-background-input'), raised: resolveColor('--color-background-raised'), focus: resolveColor('--color-border-focus') },
      base,
      focus,
      disabled
    };
  })()`, "light custom-answer input background");
  assert.equal(lightCustomInput.base.background, lightCustomInput.tokens.input, "light custom-answer input must use the input background token");
  assert.notEqual(lightCustomInput.base.background, lightCustomInput.tokens.raised, "light custom-answer input must not fall back to the raised white surface");
  assert.equal(lightCustomInput.base.minHeight, "64px");
  assert.ok(lightCustomInput.base.height >= 64);
  assert.deepEqual(lightCustomInput.base.padding, ["8px", "8px", "8px", "8px"]);
  assert.equal(lightCustomInput.base.border, "1px");
  assert.equal(lightCustomInput.base.radius, "9px");
  assert.equal(lightCustomInput.base.lineHeight, "22px");
  assert.equal(lightCustomInput.base.resize, "none");
  assert.equal(lightCustomInput.base.boxSizing, "border-box");
  assert.equal(lightCustomInput.base.contained, true);
  assert.deepEqual(lightCustomInput.focus, {
    visible: true,
    background: lightCustomInput.tokens.input,
    outlineWidth: "2px",
    outlineColor: lightCustomInput.tokens.focus,
    outlineOffset: "2px"
  });
  assert.deepEqual(lightCustomInput.disabled, { matches: true, background: lightCustomInput.tokens.input, height: lightCustomInput.base.height });
  const inlineChoiceContract = await waitForEvaluation(cdp, `(() => {
    const doc = document.getElementById('widget').contentDocument;
    const resolveColor = (variable) => {
      const probe = doc.createElement('span');
      probe.style.color = \`var(\${variable})\`;
      doc.body.appendChild(probe);
      const color = getComputedStyle(probe).color;
      probe.remove();
      return color;
    };
    const inspect = (type) => {
      const input = doc.querySelector(\`input[type="\${type}"]\`);
      const item = input.closest('.framework-question-option');
      const control = item.querySelector('.framework-question-control');
      const content = item.querySelector('.framework-question-option-copy');
      const heading = item.querySelector('.framework-question-option-title');
      const description = item.querySelector('.framework-question-option-description');
      const itemStyle = getComputedStyle(item);
      const controlStyle = getComputedStyle(control);
      return {
        itemBackground: itemStyle.backgroundColor,
        itemBorder: [itemStyle.borderTopWidth, itemStyle.borderTopColor],
        itemRadius: itemStyle.borderRadius,
        itemPadding: [itemStyle.paddingTop, itemStyle.paddingRight, itemStyle.paddingBottom, itemStyle.paddingLeft],
        itemGap: itemStyle.gap,
        itemShadow: itemStyle.boxShadow,
        controlSize: [controlStyle.width, controlStyle.height],
        controlBorder: controlStyle.borderTopWidth,
        controlBorderColor: controlStyle.borderTopColor,
        controlRadius: controlStyle.borderRadius,
        controlTopOffset: controlStyle.marginTop,
        contentGap: getComputedStyle(content).gap,
        headingType: [getComputedStyle(heading).fontSize, getComputedStyle(heading).lineHeight],
        descriptionType: [getComputedStyle(description).fontSize, getComputedStyle(description).lineHeight]
      };
    };
    return {
      colors: {
        input: resolveColor('--color-background-input'),
        connecting: resolveColor('--color-border-connecting'),
        dark: resolveColor('--color-background-dark'),
        inverted: resolveColor('--color-inverted')
      },
      checkbox: inspect('checkbox'),
      radio: inspect('radio')
    };
  })()`, "inline choice item contract");
  for (const choice of [inlineChoiceContract.checkbox, inlineChoiceContract.radio]) {
    assert.equal(choice.itemBackground, inlineChoiceContract.colors.input);
    assert.deepEqual(choice.itemBorder, ["1px", "rgba(0, 0, 0, 0)"]);
    assert.equal(choice.itemRadius, "12px");
    assert.deepEqual(choice.itemPadding, ["12px", "16px", "12px", "16px"]);
    assert.equal(choice.itemGap, "12px");
    assert.equal(choice.itemShadow, "none");
    assert.deepEqual(choice.controlSize, ["16px", "16px"]);
    assert.equal(choice.controlBorder, "2px");
    assert.equal(choice.controlBorderColor, inlineChoiceContract.colors.connecting);
    assert.equal(choice.controlTopOffset, "3px");
    assert.equal(choice.contentGap, "2px");
    assert.deepEqual(choice.headingType, ["14px", "22px"]);
    assert.deepEqual(choice.descriptionType, ["14px", "22px"]);
  }
  assert.equal(inlineChoiceContract.checkbox.controlRadius, "6px");
  assert.equal(inlineChoiceContract.radio.controlRadius, "99999px");
  const responsiveLayout = await waitForEvaluation(cdp, `(() => {
    const frame = document.getElementById('widget');
    const doc = frame && frame.contentDocument;
    if (!doc) return false;
    const shell = doc.querySelector('.framework-questions-shell');
    const card = doc.querySelector('.framework-questions-card');
    const options = doc.querySelector('.framework-question-options');
    const firstQuestion = doc.querySelector('.framework-question');
    const firstLegend = firstQuestion.querySelector('legend');
    const legendTextRange = doc.createRange();
    legendTextRange.selectNodeContents(firstLegend);
    const questionRect = firstQuestion.getBoundingClientRect();
    const legendRect = firstLegend.getBoundingClientRect();
    const legendTextRect = legendTextRange.getBoundingClientRect();
    const optionsRect = options.getBoundingClientRect();
    const borderProbe = doc.createElement('span');
    borderProbe.style.color = 'var(--color-border-divider)';
    doc.body.appendChild(borderProbe);
    const dividerColor = getComputedStyle(borderProbe).color;
    borderProbe.remove();
    const wide = {
      viewport: doc.documentElement.clientWidth,
      scrollWidth: doc.documentElement.scrollWidth,
      shellWidth: shell.getBoundingClientRect().width,
      shellPadding: [getComputedStyle(shell).paddingTop, getComputedStyle(shell).paddingRight, getComputedStyle(shell).paddingBottom, getComputedStyle(shell).paddingLeft],
      shellBorder: [getComputedStyle(shell).borderTopWidth, getComputedStyle(shell).borderTopColor],
      dividerColor,
      shellRadius: getComputedStyle(shell).borderRadius,
      shellBoxSizing: getComputedStyle(shell).boxSizing,
      cardWidth: card.getBoundingClientRect().width,
      cardBorder: getComputedStyle(card).borderTopWidth,
      cardRadius: getComputedStyle(card).borderRadius,
      cardShadow: getComputedStyle(card).boxShadow,
      cardBackground: getComputedStyle(card).backgroundColor,
      legendPaddingTop: getComputedStyle(doc.querySelector('.framework-question legend')).paddingTop,
      legendTextOffset: legendTextRect.top - questionRect.top,
      legendOptionsGap: optionsRect.top - legendRect.bottom,
      optionTracks: getComputedStyle(options).gridTemplateColumns.split(' ').length
    };
    frame.style.width = '360px';
    return new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => {
      const submit = doc.querySelector('[data-testid="framework-submit"]');
      const footer = doc.querySelector('.framework-questions-footer');
      const narrow = {
        viewport: doc.documentElement.clientWidth,
        scrollWidth: doc.documentElement.scrollWidth,
        bodyScrollWidth: doc.body.scrollWidth,
        shellWidth: shell.getBoundingClientRect().width,
        shellRight: shell.getBoundingClientRect().right,
        submitWidth: submit.getBoundingClientRect().width,
        footerWidth: footer.getBoundingClientRect().width,
        customInputWidth: doc.querySelector('.framework-question-custom-input').getBoundingClientRect().width,
        customWidth: doc.querySelector('.framework-question-custom').getBoundingClientRect().width
      };
      frame.style.width = '100%';
      resolve({ wide, narrow });
    })));
  })()`, "inline responsive layout");
  assert.equal(responsiveLayout.wide.scrollWidth, responsiveLayout.wide.viewport, "wide inline card must not overflow horizontally");
  assert.equal(responsiveLayout.wide.shellWidth, responsiveLayout.wide.viewport, "inline form shell must fill the message surface width");
  assert.deepEqual(responsiveLayout.wide.shellPadding, ["24px", "24px", "24px", "24px"], "inline form shell must keep 24px inner spacing");
  assert.deepEqual(responsiveLayout.wide.shellBorder, ["1px", responsiveLayout.wide.dividerColor], "inline form shell must use the divider border token");
  assert.equal(responsiveLayout.wide.shellRadius, "16px", "inline form shell must use the requested outer radius");
  assert.equal(responsiveLayout.wide.shellBoxSizing, "border-box", "inline form shell padding must be included in its full width");
  assert.ok(responsiveLayout.wide.cardWidth < responsiveLayout.wide.viewport, "inline form content must fit inside the padded shell");
  assert.equal(responsiveLayout.wide.cardBorder, "0px", "inline form must not draw a second outer border");
  assert.equal(responsiveLayout.wide.cardRadius, "0px", "inline form must not draw a second outer radius");
  assert.equal(responsiveLayout.wide.cardShadow, "none", "inline form must not draw a second outer shadow");
  assert.equal(responsiveLayout.wide.cardBackground, "rgba(0, 0, 0, 0)", "inline form must keep the host message surface visible");
  assert.equal(responsiveLayout.wide.legendPaddingTop, "14px", "question legend must keep space below the section divider");
  assert.ok(responsiveLayout.wide.legendTextOffset >= 12, "question text must be visibly separated from the section divider");
  assert.ok(responsiveLayout.wide.legendOptionsGap >= 8, "question text must keep the existing gap before its options");
  assert.equal(responsiveLayout.wide.optionTracks, 1, "framework choices must remain a single-column reading flow");
  assert.ok(responsiveLayout.narrow.viewport <= 360 && responsiveLayout.narrow.viewport >= 320, "narrow inline viewport must stay within the supported message width");
  assert.equal(responsiveLayout.narrow.scrollWidth, responsiveLayout.narrow.viewport, "narrow inline document must not overflow horizontally");
  assert.equal(responsiveLayout.narrow.bodyScrollWidth, responsiveLayout.narrow.viewport, "narrow inline body must not overflow horizontally");
  assert.equal(responsiveLayout.narrow.shellWidth, responsiveLayout.narrow.viewport, "narrow inline shell must remain fluid");
  assert.ok(responsiveLayout.narrow.shellRight <= responsiveLayout.narrow.viewport, "narrow inline shell must stay fully visible");
  assert.ok(responsiveLayout.narrow.submitWidth >= responsiveLayout.narrow.footerWidth - 34, "narrow submit action must expand to the footer width");
  assert.ok(responsiveLayout.narrow.customInputWidth <= responsiveLayout.narrow.customWidth, "narrow custom-answer input must stay inside its label");
  const autoResizeNotice = await waitForEvaluation(cdp, `(() => {
    const notices = window.__HOST_RECORDS__.messages.filter((message) => message.method === 'ui/notifications/size-changed');
    const latest = notices.at(-1);
    const frame = document.getElementById('widget');
    const doc = frame && frame.contentDocument;
    const shell = doc && doc.querySelector('.framework-questions-shell');
    if (!latest || latest.params.height <= 0 || !shell) return false;
    const shellBottom = shell.getBoundingClientRect().bottom;
    const documentHeight = Math.max(doc.documentElement.scrollHeight, doc.body.scrollHeight, shellBottom);
    const frameHeight = frame.getBoundingClientRect().height;
    return frameHeight + 1 >= latest.params.height
      ? { ...latest.params, shellBottom, documentHeight, frameHeight }
      : false;
  })()`, "inline widget auto-resize notification");
  assert.ok(autoResizeNotice.width > 0 && autoResizeNotice.height > 0);
  assert.ok(autoResizeNotice.height + 1 >= autoResizeNotice.shellBottom, "inline auto-resize height must include the shell border and padding");
  assert.ok(autoResizeNotice.height + 1 >= autoResizeNotice.documentHeight, "inline auto-resize height must cover the complete document");
  assert.ok(autoResizeNotice.frameHeight + 1 >= autoResizeNotice.height, "fake host must apply the requested inline height before visual capture");
  await captureFrameworkQuestions(cdp, "framework-questions-flat-light-unselected.png");
  const darkTheme = await waitForEvaluation(cdp, `(async () => {
    window.__HOST_SET_THEME__('dark');
    const doc = document.getElementById('widget').contentDocument;
    if (doc.documentElement.getAttribute('data-theme') !== 'dark') return false;
    const input = doc.querySelector('.framework-question-custom-input');
    const option = doc.querySelector('.framework-question-option:not(.is-selected)');
    const shell = doc.querySelector('.framework-questions-shell');
    const optionStyle = getComputedStyle(option);
    const probe = doc.createElement('span');
    probe.style.color = 'var(--color-background-input)';
    doc.body.appendChild(probe);
    const inputToken = getComputedStyle(probe).color;
    probe.style.color = 'var(--color-border-divider)';
    const dividerToken = getComputedStyle(probe).color;
    probe.remove();
    input.focus();
    await new Promise((resolve) => setTimeout(resolve, 200));
    const focusBackground = getComputedStyle(input).backgroundColor;
    input.blur();
    input.disabled = true;
    const disabledBackground = getComputedStyle(input).backgroundColor;
    input.disabled = false;
    return {
      theme: doc.documentElement.getAttribute('data-theme'),
      colorScheme: doc.documentElement.style.colorScheme,
      inputBackground: getComputedStyle(input).backgroundColor,
      inputToken,
      shellBorder: getComputedStyle(shell).borderTopColor,
      dividerToken,
      unselectedOption: {
        background: optionStyle.backgroundColor,
        border: optionStyle.borderTopColor
      },
      focusBackground,
      disabledBackground
    };
  })()`, "inline dark theme update");
  assert.equal(darkTheme.theme, "dark");
  assert.equal(darkTheme.colorScheme, "dark");
  assert.equal(darkTheme.inputBackground, darkTheme.inputToken, "dark custom-answer input must use the input background token");
  assert.equal(darkTheme.shellBorder, darkTheme.dividerToken, "dark inline form shell must use the themed divider border token");
  assert.equal(darkTheme.unselectedOption.background, darkTheme.inputToken, "dark unselected choice must retain the established input surface");
  assert.equal(darkTheme.unselectedOption.border, "rgba(0, 0, 0, 0)", "dark unselected choice must retain the established borderless row state");
  assert.equal(darkTheme.focusBackground, darkTheme.inputToken, "dark focused custom-answer input must keep the input background token");
  assert.equal(darkTheme.disabledBackground, darkTheme.inputToken, "dark disabled custom-answer input must keep the input background token");
  await captureFrameworkQuestions(cdp, "framework-questions-flat-dark-unselected.png");
  await waitForEvaluation(cdp, `(() => {
    window.__HOST_SET_THEME__('light');
    return document.getElementById('widget').contentDocument.documentElement.getAttribute('data-theme') === 'light';
  })()`, "inline light theme restore");

  await cdp.send("Runtime.evaluate", {
    expression: `(() => {
      const doc = document.getElementById('widget').contentDocument;
      const checkbox = doc.querySelector('input[type="checkbox"]');
      checkbox.focus();
      return checkbox.checked;
    })()`,
    returnByValue: true
  });
  await cdp.send("Input.dispatchKeyEvent", { type: "keyDown", key: " ", code: "Space" });
  await cdp.send("Input.dispatchKeyEvent", { type: "keyUp", key: " ", code: "Space" });
  const keyboardSelection = await waitForEvaluation(cdp, `(() => document.getElementById('widget').contentDocument.querySelector('input[type="checkbox"]').checked)()`, "keyboard checkbox selection");
  assert.equal(keyboardSelection, true);
  const keyboardFocusContract = await waitForEvaluation(cdp, `(async () => {
    await new Promise((resolve) => setTimeout(resolve, 200));
    const doc = document.getElementById('widget').contentDocument;
    const input = doc.querySelector('input[type="checkbox"]');
    const item = input.closest('.framework-question-option');
    const probe = doc.createElement('span');
    probe.style.color = 'var(--color-border-focus)';
    doc.body.appendChild(probe);
    const focus = getComputedStyle(probe).color;
    probe.remove();
    return input.matches(':focus-visible') ? { border: getComputedStyle(item).borderTopColor, focus } : false;
  })()`, "keyboard-visible inline choice focus");
  assert.equal(keyboardFocusContract.border, keyboardFocusContract.focus);
  await cdp.send("Runtime.evaluate", {
    expression: `document.getElementById('widget').contentDocument.activeElement.blur()`,
    returnByValue: true
  });
  const selectedChoiceContract = await waitForEvaluation(cdp, `(async () => {
    const doc = document.getElementById('widget').contentDocument;
    const resolveColor = (variable) => {
      const probe = doc.createElement('span');
      probe.style.color = \`var(\${variable})\`;
      doc.body.appendChild(probe);
      const color = getComputedStyle(probe).color;
      probe.remove();
      return color;
    };
    const inspectSelected = (input) => {
      const item = input.closest('.framework-question-option');
      const control = item.querySelector('.framework-question-control');
      const itemStyle = getComputedStyle(item);
      const controlStyle = getComputedStyle(control);
      return {
        itemBackground: itemStyle.backgroundColor,
        itemBorder: [itemStyle.borderTopWidth, itemStyle.borderTopColor],
        itemShadow: itemStyle.boxShadow,
        controlBackground: controlStyle.backgroundColor,
        controlColor: controlStyle.color,
        checkOpacity: control.classList.contains('is-radio') ? null : getComputedStyle(control.querySelector('path')).opacity,
        dot: control.classList.contains('is-radio') ? [
          getComputedStyle(control, '::after').width,
          getComputedStyle(control, '::after').height,
          getComputedStyle(control, '::after').backgroundColor
        ] : null
      };
    };
    const radio = doc.querySelector('input[type="radio"]');
    radio.click();
    await new Promise((resolve) => setTimeout(resolve, 200));
    return {
      colors: {
        input: resolveColor('--color-background-input'),
        connecting: resolveColor('--color-border-connecting'),
        dark: resolveColor('--color-background-dark'),
        inverted: resolveColor('--color-inverted')
      },
      checkbox: inspectSelected(doc.querySelector('input[type="checkbox"]')),
      radio: inspectSelected(radio)
    };
  })()`, "selected inline choice states");
  for (const choice of [selectedChoiceContract.checkbox, selectedChoiceContract.radio]) {
    assert.equal(choice.itemBackground, selectedChoiceContract.colors.input);
    assert.deepEqual(choice.itemBorder, ["1px", selectedChoiceContract.colors.connecting]);
    assert.equal(choice.itemShadow, "none");
    assert.equal(choice.controlBackground, selectedChoiceContract.colors.dark);
    assert.equal(choice.controlColor, selectedChoiceContract.colors.inverted);
  }
  assert.equal(selectedChoiceContract.checkbox.checkOpacity, "1");
  assert.deepEqual(selectedChoiceContract.radio.dot, ["8px", "8px", selectedChoiceContract.colors.inverted]);
  await captureFrameworkQuestions(cdp, "framework-questions-flat-light-selected.png");
  await waitForEvaluation(cdp, `(() => {
    window.__HOST_SET_THEME__('dark');
    return document.getElementById('widget').contentDocument.documentElement.getAttribute('data-theme') === 'dark';
  })()`, "dark theme applied for Figma state check");
  const darkSelectedChoiceContract = await waitForEvaluation(cdp, `(async () => {
    await new Promise((resolve) => setTimeout(resolve, 200));
    const doc = document.getElementById('widget').contentDocument;
    const resolveColor = (variable) => {
      const probe = doc.createElement('span');
      probe.style.color = \`var(\${variable})\`;
      doc.body.appendChild(probe);
      const color = getComputedStyle(probe).color;
      probe.remove();
      return color;
    };
    const inspect = (type) => {
      const input = doc.querySelector(\`input[type="\${type}"]:checked\`);
      const item = input.closest('.framework-question-option');
      const control = item.querySelector('.framework-question-control');
      const itemStyle = getComputedStyle(item);
      const controlStyle = getComputedStyle(control);
      return {
        itemBackground: itemStyle.backgroundColor,
        itemBorder: itemStyle.borderTopColor,
        controlBackground: controlStyle.backgroundColor,
        controlColor: controlStyle.color,
        markBackground: type === 'radio' ? getComputedStyle(control, '::after').backgroundColor : null
      };
    };
    const checkbox = inspect('checkbox');
    const radio = inspect('radio');
    const radioInput = doc.querySelector('input[type="radio"]');
    const radioItem = radioInput.closest('.framework-question-option');
    radioInput.focus();
    await new Promise((resolve) => setTimeout(resolve, 200));
    const keyboardFocus = radioInput.matches(':focus-visible') ? getComputedStyle(radioItem).borderTopColor : null;
    radioInput.blur();
    return {
      theme: doc.documentElement.getAttribute('data-theme'),
      colors: {
        input: resolveColor('--color-background-input'),
        connecting: resolveColor('--color-border-connecting'),
        focus: resolveColor('--color-border-focus'),
        dark: resolveColor('--color-background-dark'),
        inverted: resolveColor('--color-inverted')
      },
      checkbox,
      radio,
      keyboardFocus
    };
  })()`, "dark selected inline choice states");
  assert.equal(darkSelectedChoiceContract.theme, "dark");
  for (const choice of [darkSelectedChoiceContract.checkbox, darkSelectedChoiceContract.radio]) {
    assert.equal(choice.itemBackground, darkSelectedChoiceContract.colors.input);
    assert.equal(choice.itemBorder, darkSelectedChoiceContract.colors.connecting);
    assert.equal(choice.controlBackground, darkSelectedChoiceContract.colors.dark);
    assert.equal(choice.controlColor, darkSelectedChoiceContract.colors.inverted);
  }
  assert.equal(darkSelectedChoiceContract.radio.markBackground, darkSelectedChoiceContract.colors.inverted);
  assert.equal(darkSelectedChoiceContract.keyboardFocus, darkSelectedChoiceContract.colors.focus);
  await captureFrameworkQuestions(cdp, "framework-questions-flat-dark-selected.png");
  await waitForEvaluation(cdp, `(() => {
    window.__HOST_SET_THEME__('light');
    return document.getElementById('widget').contentDocument.documentElement.getAttribute('data-theme') === 'light';
  })()`, "light theme restored after Figma state check");

  const firstSubmit = await waitForEvaluation(cdp, `(async () => {
    const doc = document.getElementById('widget').contentDocument;
    const radios = Array.from(doc.querySelectorAll('input[type="radio"]'));
    radios[1].click();
    const textareas = Array.from(doc.querySelectorAll('textarea'));
    const textareaValueSetter = Object.getOwnPropertyDescriptor(document.getElementById('widget').contentWindow.HTMLTextAreaElement.prototype, 'value').set;
    textareaValueSetter.call(textareas[0], 'Platform and ecosystem');
    textareas[0].dispatchEvent(new Event('input', { bubbles: true }));
    const checkboxes = Array.from(doc.querySelectorAll('input[type="checkbox"]'));
    checkboxes[1].click();
    textareaValueSetter.call(textareas[1], 'Dependencies');
    textareas[1].dispatchEvent(new Event('input', { bubbles: true }));
    await new Promise((resolve) => setTimeout(resolve, 50));
    const submit = doc.querySelector('[data-testid="framework-submit"]');
    const singleClearedByCustom = radios.every((radio) => !radio.checked);
    submit.click();
    return { singleClearedByCustom, disabledBeforeSubmit: submit.disabled };
  })()`, "first inline submission attempted");
  assert.equal(firstSubmit.singleClearedByCustom, true, "a single-select custom answer must clear preset radio choices");
  assert.equal(firstSubmit.disabledBeforeSubmit, false);

  const retryReady = await waitForEvaluation(cdp, `(() => {
    const doc = document.getElementById('widget').contentDocument;
    const status = doc.querySelector('[data-testid="framework-status"]');
    const submit = doc.querySelector('[data-testid="framework-submit"]');
    return window.__HOST_RECORDS__.messageAttempts === 1 && status && submit && !submit.disabled
      ? { status: status.textContent, button: submit.textContent, retained: Array.from(doc.querySelectorAll('textarea')).map((field) => field.value) }
      : false;
  })()`, "failed inline submission retained for retry");
  assert.match(retryReady.status, /fail|retry|again/i);
  assert.match(retryReady.button, /retry|continue/i);
  assert.deepEqual(retryReady.retained, ["Platform and ecosystem", "Dependencies"]);

  const submitted = await waitForEvaluation(cdp, `(async () => {
    const doc = document.getElementById('widget').contentDocument;
    doc.querySelector('[data-testid="framework-submit"]').click();
    await new Promise((resolve) => setTimeout(resolve, 100));
    const controls = Array.from(doc.querySelectorAll('input, textarea'));
    const attemptsAfterSuccess = window.__HOST_RECORDS__.messageAttempts;
    doc.querySelector('[data-testid="framework-submit"]')?.click();
    await new Promise((resolve) => setTimeout(resolve, 100));
    return {
      attemptsAfterSuccess,
      attemptsAfterDuplicateClick: window.__HOST_RECORDS__.messageAttempts,
      allLocked: controls.every((control) => control.matches(':disabled')) && !doc.querySelector('[data-testid="framework-submit"]'),
      status: doc.querySelector('[data-testid="framework-status"]')?.textContent || '',
      summary: doc.querySelector('[data-testid="framework-answer-summary"]')?.textContent || '',
      sent: window.__HOST_RECORDS__.sentMessages.at(-1),
      displayRequests: window.__HOST_RECORDS__.displayRequests,
      toolCalls: window.__HOST_RECORDS__.toolCalls,
      errors: window.__HOST_RECORDS__.errors
    };
  })()`, "successful inline submission locked");
  assert.equal(submitted.attemptsAfterSuccess, 2);
  assert.equal(submitted.attemptsAfterDuplicateClick, 2, "confirmationId state must prevent duplicate sends");
  assert.equal(submitted.allLocked, true);
  assert.match(submitted.status, /confirmed|sent|continue/i);
  assert.match(submitted.summary, /Which scope should the framework cover\?/);
  assert.match(submitted.summary, /Platform and ecosystem/);
  assert.match(submitted.summary, /Roles/);
  assert.match(submitted.summary, /Stages/);
  assert.match(submitted.summary, /Dependencies/);
  assert.match(JSON.stringify(submitted.sent), /Canvasight framework confirmation/);
  assert.match(JSON.stringify(submitted.sent), /questionId.*scope/);
  assert.match(JSON.stringify(submitted.sent), /customAnswer.*Platform and ecosystem/);
  assert.match(JSON.stringify(submitted.sent), /selectedOptionIds.*roles.*stages/);
  assert.match(JSON.stringify(submitted.sent), /get_canvasight_graph_context/);
  assert.match(JSON.stringify(submitted.sent), /continue.*Graph Writer/i);
  assert.deepEqual(submitted.displayRequests, []);
  assert.deepEqual(submitted.toolCalls, []);
  assert.deepEqual(submitted.errors, []);

  await cdp.send("Page.reload", { ignoreCache: true });
  const restoredConfirmation = await waitForEvaluation(cdp, `(() => {
    const frame = document.getElementById('widget');
    const doc = frame && frame.contentDocument;
    const summary = doc && doc.querySelector('[data-testid="framework-answer-summary"]');
    const status = doc && doc.querySelector('[data-testid="framework-status"]');
    if (!summary || !status) return false;
    return {
      summary: summary.textContent,
      status: status.textContent,
      attempts: window.__HOST_RECORDS__.messageAttempts,
      disabled: Array.from(doc.querySelectorAll('input, textarea')).every((control) => control.matches(':disabled')),
      submitExists: Boolean(doc.querySelector('[data-testid="framework-submit"]'))
    };
  })()`, "submitted confirmation restored after widget remount");
  assert.match(restoredConfirmation.summary, /Platform and ecosystem/);
  assert.match(restoredConfirmation.summary, /Roles/);
  assert.match(restoredConfirmation.summary, /Stages/);
  assert.match(restoredConfirmation.summary, /Dependencies/);
  assert.match(restoredConfirmation.status, /confirmed|sent|continue/i);
  assert.equal(restoredConfirmation.attempts, 0, "restoring the same confirmationId must not send another user message");
  assert.equal(restoredConfirmation.disabled, true);
  assert.equal(restoredConfirmation.submitExists, false);

  await cdp.send("Page.navigate", { url: hostUrl });
  await waitForEvaluation(cdp, `Boolean(document.getElementById('widget') && document.getElementById('widget').contentDocument)`, "fullscreen host navigation");

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
      workspaceSizeNotices: window.__HOST_RECORDS__.messages.filter((message) => message.method === 'ui/notifications/size-changed').length,
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
  assert.equal(evidence.workspaceSizeNotices, 0, "fullscreen workspace must not start ext-apps auto ResizeObserver");
  assert.deepEqual(evidence.errors, []);

  const proxiedThumbnail = await waitForEvaluation(cdp, `(async () => {
    const frame = document.getElementById('widget');
    const doc = frame.contentDocument;
    const images = Array.from(doc.querySelectorAll('.kit-upload-chip-thumbnail img'));
    return images.length === 2 && images.every((image) => image.complete && image.naturalWidth > 0)
      ? {
          images: images.map((image) => ({ src: image.src, naturalWidth: image.naturalWidth, naturalHeight: image.naturalHeight })),
          assetCalls: window.__HOST_RECORDS__.toolCalls.filter((call) => call.path && call.path.endsWith('/attachment-preview'))
        }
      : false;
  })()`, "attachment thumbnail loaded through the native widget asset proxy");
  assert.deepEqual(proxiedThumbnail.images.map((image) => image.src).sort(), [thumbnailDataUrl, thumbnailGifDataUrl].sort());
  assert.equal(proxiedThumbnail.images.every((image) => image.naturalWidth === 1 && image.naturalHeight === 1), true);
  assert.equal(proxiedThumbnail.assetCalls.length, 2);
  assert.equal(proxiedThumbnail.assetCalls.every((call) => /^\/api\/sessions\/[^/]+\/attachment-preview$/.test(call.path)), true);
  assert.deepEqual(proxiedThumbnail.assetCalls.map((call) => call.body.storedPath).sort(), [
    path.join(projectPath, ".scatter", "assets", "thumbnail.gif"),
    path.join(projectPath, ".scatter", "assets", "thumbnail.png")
  ]);
  assert.doesNotMatch(JSON.stringify(proxiedThumbnail.assetCalls), /daemon-secret/);
  assert.equal(proxiedThumbnail.assetCalls.some((call) => call.path.includes('/api/asset')), false);

  const restored = await waitForEvaluation(cdp, `(async () => {
    const frame = document.getElementById('widget');
    await new Promise((resolve) => setTimeout(resolve, 650));
    const beforeCalls = window.__HOST_RECORDS__.toolCalls.filter((call) => call.path && call.path.endsWith('/open-project')).length;
    const beforeSaveCalls = window.__HOST_RECORDS__.toolCalls.filter((call) => call.path && call.path.endsWith('/document')).length;
    frame.style.display = 'none';
    await new Promise((resolve) => setTimeout(resolve, 80));
    frame.style.display = 'block';
    await new Promise((resolve) => setTimeout(resolve, 700));
    const doc = frame.contentDocument;
    const canvas = doc.querySelector('.canvas-shell');
    const viewport = doc.querySelector('.react-flow__viewport');
    const nodeEls = Array.from(doc.querySelectorAll('.react-flow__node'));
    const edgeEls = Array.from(doc.querySelectorAll('.react-flow__edge'));
    const canvasRect = canvas && canvas.getBoundingClientRect();
    const visibleNodes = nodeEls.filter((node) => {
      const rect = node.getBoundingClientRect();
      return rect.right > canvasRect.left && rect.bottom > canvasRect.top && rect.left < canvasRect.right && rect.top < canvasRect.bottom;
    });
    const transform = viewport && getComputedStyle(viewport).transform;
    const afterCalls = window.__HOST_RECORDS__.toolCalls.filter((call) => call.path && call.path.endsWith('/open-project')).length;
    const afterSaveCalls = window.__HOST_RECORDS__.toolCalls.filter((call) => call.path && call.path.endsWith('/document')).length;
    const bridgeStage = frame.contentWindow.__CANVASIGHT_BRIDGE_STATE__ && frame.contentWindow.__CANVASIGHT_BRIDGE_STATE__.startupStage;
    const overlay = Boolean(doc.querySelector('.canvasight-startup-overlay'));
    return canvasRect && canvasRect.width > 0 && canvasRect.height > 0 && nodeEls.length === 2 && edgeEls.length === 1 && visibleNodes.length > 0 && transform && transform !== 'none'
      ? { nodeCount: nodeEls.length, edgeCount: edgeEls.length, visibleNodeCount: visibleNodes.length, transform, beforeCalls, afterCalls, beforeSaveCalls, afterSaveCalls, bridgeStage, overlay }
      : false;
  })()`, "same-binding canvas after host hide and restore");
  assert.equal(restored.nodeCount, 2);
  assert.equal(restored.edgeCount, 1);
  assert.ok(restored.visibleNodeCount > 0);
  assert.match(restored.transform, /matrix|translate/);
  assert.equal(restored.afterCalls, restored.beforeCalls, "same binding recovery must not rehydrate the project");
  assert.equal(restored.afterSaveCalls, restored.beforeSaveCalls, "programmatic viewport recovery must not overwrite the saved Page viewport");
  assert.equal(restored.bridgeStage, "ready");
  assert.equal(restored.overlay, false);

  const zoomRegression = await waitForEvaluation(cdp, `(async () => {
    const frame = document.getElementById('widget');
    const win = frame.contentWindow;
    const doc = frame.contentDocument;
    const canvas = doc.querySelector('.canvas-shell');
    const pane = doc.querySelector('.react-flow__pane');
    const viewport = doc.querySelector('.react-flow__viewport');
    const zoomTrigger = doc.querySelector('.canvas-zoom-trigger');
    if (!canvas || !pane || !viewport || !zoomTrigger) return false;

    const nextFrame = () => new Promise((resolve) => win.requestAnimationFrame(resolve));
    const transformZoom = () => {
      const transform = win.getComputedStyle(viewport).transform;
      if (!transform || transform === 'none') return 1;
      return new win.DOMMatrixReadOnly(transform).a;
    };
    const zoomLabel = () => Number.parseInt(zoomTrigger.textContent || '', 10);
    const openZoomMenu = () => {
      zoomTrigger.dispatchEvent(new win.PointerEvent('pointerdown', {
        bubbles: true,
        button: 0,
        buttons: 1,
        pointerId: 1,
        pointerType: 'mouse'
      }));
    };
    const selectZoom = async (label) => {
      openZoomMenu();
      await nextFrame();
      await nextFrame();
      const item = Array.from(doc.querySelectorAll('[role="menuitemradio"]')).find((candidate) => candidate.textContent.trim() === label);
      if (!item) throw new Error('Missing zoom menu option: ' + label);
      item.click();
    };
    const wheel = (deltaY) => {
      pane.dispatchEvent(new win.WheelEvent('wheel', {
        bubbles: true,
        cancelable: true,
        deltaMode: 0,
        deltaY,
        metaKey: true,
        clientX: 600,
        clientY: 400
      }));
    };
    const setMetaPressed = (pressed) => {
      doc.dispatchEvent(new win.KeyboardEvent(pressed ? 'keydown' : 'keyup', {
        bubbles: true,
        code: 'MetaLeft',
        key: 'Meta',
        metaKey: pressed
      }));
    };
    const sampleFrames = async (count) => {
      const samples = [];
      for (let index = 0; index < count; index += 1) {
        await nextFrame();
        samples.push({ zoom: transformZoom(), label: zoomLabel() });
      }
      return samples;
    };

    await selectZoom('75%');
    await sampleFrames(3);
    openZoomMenu();
    await nextFrame();
    await nextFrame();
    const maxItem = Array.from(doc.querySelectorAll('[role="menuitemradio"]')).find((candidate) => candidate.textContent.trim() === '200%');
    if (!maxItem) throw new Error('Missing 200% zoom menu option');

    win.dispatchEvent(new win.CustomEvent('canvasight:host-context-changed', {
      detail: { displayMode: 'fullscreen', containerDimensions: { width: 1200, height: 800 } }
    }));
    maxItem.click();
    const recoveryRaceSamples = await sampleFrames(12);

    setMetaPressed(true);
    for (let index = 0; index < 16; index += 1) wheel(-240);
    const maxBoundarySamples = await sampleFrames(12);
    for (let index = 0; index < 48; index += 1) wheel(240);
    const minBoundaryArrival = await sampleFrames(12);
    for (let index = 0; index < 16; index += 1) wheel(240);
    const minBoundarySamples = await sampleFrames(12);
    setMetaPressed(false);

    await selectZoom('200%');
    const finalSamples = await sampleFrames(12);
    await new Promise((resolve) => win.setTimeout(resolve, 750));
    const saveCalls = window.__HOST_RECORDS__.toolCalls.filter((call) => call.path && call.path.endsWith('/document'));
    const lastSave = saveCalls.at(-1);
    const savedPage = lastSave && lastSave.body && lastSave.body.document && lastSave.body.document.pages
      ? lastSave.body.document.pages.find((page) => page.id === 'page-composed')
      : null;
    return {
      recoveryRaceSamples,
      maxBoundarySamples,
      minBoundaryArrival,
      minBoundarySamples,
      finalSamples,
      finalZoom: transformZoom(),
      finalLabel: zoomLabel(),
      saveCallCount: saveCalls.length,
      savedViewport: savedPage && savedPage.viewport,
      overlay: Boolean(doc.querySelector('.canvasight-startup-overlay')),
      errors: window.__HOST_RECORDS__.errors
    };
  })()`, "viewport recovery and zoom boundary regression");
  const near = (actual, expected, epsilon = 0.02) => Math.abs(actual - expected) <= epsilon;
  assert.equal(
    zoomRegression.recoveryRaceSamples.every((sample) => near(sample.zoom, 2) && sample.label === 200),
    true,
    `queued recovery must not overwrite active user zoom: ${JSON.stringify(zoomRegression.recoveryRaceSamples)}`
  );
  assert.equal(
    zoomRegression.maxBoundarySamples.every((sample) => near(sample.zoom, 2) && sample.label === 200),
    true,
    `continued Cmd+zoom at max must remain stable: ${JSON.stringify(zoomRegression.maxBoundarySamples)}`
  );
  assert.equal(
    zoomRegression.minBoundarySamples.every((sample) => near(sample.zoom, 0.2) && sample.label === 20),
    true,
    `continued Cmd+zoom at min must remain stable: ${JSON.stringify({ arrival: zoomRegression.minBoundaryArrival, boundary: zoomRegression.minBoundarySamples })}`
  );
  assert.equal(near(zoomRegression.finalZoom, 2), true);
  assert.equal(zoomRegression.finalLabel, 200);
  assert.ok(zoomRegression.saveCallCount > 0, "the final user viewport must schedule document persistence");
  assert.equal(near(zoomRegression.savedViewport?.zoom, 2), true, `saved viewport must match final zoom: ${JSON.stringify(zoomRegression.savedViewport)}`);
  assert.equal(zoomRegression.overlay, false);
  assert.deepEqual(zoomRegression.errors, []);

  const historicalPolling = await waitForEvaluation(cdp, `(async () => {
    const original = document.getElementById('widget');
    for (let index = 1; index < 4; index += 1) {
      const historical = document.createElement('iframe');
      historical.id = 'widget-history-' + index;
      historical.src = '/widget';
      historical.style.cssText = 'position:fixed;inset:0;width:1200px;height:800px;border:0;';
      document.body.appendChild(historical);
    }
    const deadline = Date.now() + 12000;
    while (Date.now() < deadline && new Set(window.__HOST_RECORDS__.readyInstances).size < 4) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    const frames = Array.from(document.querySelectorAll('iframe'));
    const active = frames.at(-1);
    active.focus();
    active.contentWindow.focus();
    await new Promise((resolve) => setTimeout(resolve, 800));
    window.__HOST_RECORDS__.revisionPolls = [];
    window.__HOST_RECORDS__.revisionMaxInFlight = window.__HOST_RECORDS__.revisionInFlight;
    const startedAt = Date.now();
    await new Promise((resolve) => setTimeout(resolve, 30500));
    const calls = window.__HOST_RECORDS__.revisionPolls.filter((call) => call.at >= startedAt);
    const posts = calls.filter((call) => call.method === 'POST');
    return {
      readyCount: new Set(window.__HOST_RECORDS__.readyInstances).size,
      postCount: posts.length,
      postWidgetIds: Array.from(new Set(posts.map((call) => call.widgetInstanceId))),
      maxInFlight: window.__HOST_RECORDS__.revisionMaxInFlight,
      revisionInFlight: window.__HOST_RECORDS__.revisionInFlight,
      activeFrameId: active.id,
      originalStillMounted: original.isConnected
    };
  })()`, "four historical production widgets bounded polling", 50000);
  assert.equal(historicalPolling.readyCount, 4);
  assert.equal(historicalPolling.originalStillMounted, true);
  assert.ok(historicalPolling.postCount >= 5 && historicalPolling.postCount <= 7, `30s owner poll count must remain bounded: ${JSON.stringify(historicalPolling)}`);
  assert.equal(historicalPolling.postWidgetIds.length, 1, "only the focused eligible historical widget may poll");
  assert.ok(historicalPolling.maxInFlight <= 1, `revision polling must remain serial: ${JSON.stringify(historicalPolling)}`);
  assert.equal(historicalPolling.revisionInFlight, 0);

  const teardown = await waitForEvaluation(cdp, `(async () => {
    const active = document.getElementById(${JSON.stringify("widget-history-3")});
    const activeWidgetInstanceId = active.contentWindow.__CANVASIGHT_BRIDGE_STATE__.widgetInstanceId;
    const beforePosts = window.__HOST_RECORDS__.revisionPolls.filter((call) => call.method === 'POST').length;
    window.__HOST_TEARDOWN__(active.contentWindow);
    window.__HOST_TEARDOWN__(active.contentWindow);
    const deadline = Date.now() + 3000;
    while (Date.now() < deadline && window.__HOST_RECORDS__.teardownResponses.length < 2) {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    await new Promise((resolve) => setTimeout(resolve, 5500));
    const afterPosts = window.__HOST_RECORDS__.revisionPolls.filter((call) => call.method === 'POST').length;
    const deletes = window.__HOST_RECORDS__.revisionPolls.filter((call) => call.method === 'DELETE' && call.widgetInstanceId === activeWidgetInstanceId).length;
    const next = document.getElementById('widget-history-2');
    const nextWidgetInstanceId = next.contentWindow.__CANVASIGHT_BRIDGE_STATE__.widgetInstanceId;
    next.focus();
    next.contentWindow.focus();
    const takeoverDeadline = Date.now() + 3000;
    while (
      Date.now() < takeoverDeadline &&
      !window.__HOST_RECORDS__.revisionPolls.some((call) => call.method === 'POST' && call.widgetInstanceId === nextWidgetInstanceId)
    ) {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    const takeover = window.__HOST_RECORDS__.revisionPolls.find((call) => call.method === 'POST' && call.widgetInstanceId === nextWidgetInstanceId);
    return {
      beforePosts,
      afterPosts,
      responseCount: window.__HOST_RECORDS__.teardownResponses.length,
      deletes,
      activeWidgetInstanceId,
      nextWidgetInstanceId,
      takeoverWidgetInstanceId: takeover && takeover.widgetInstanceId
    };
  })()`, "idempotent resource teardown stops polling", 12000);
  assert.equal(teardown.responseCount, 2, "concurrent ui/resource-teardown requests are both acknowledged");
  assert.equal(teardown.afterPosts, teardown.beforePosts, "teardown must stop every later revision poll");
  assert.ok(teardown.deletes <= 1, "teardown must not issue duplicate owner release requests");
  assert.notEqual(teardown.nextWidgetInstanceId, teardown.activeWidgetInstanceId);
  assert.equal(teardown.takeoverWidgetInstanceId, teardown.nextWidgetInstanceId, "focus transfers revision polling ownership to the next eligible widget");
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
