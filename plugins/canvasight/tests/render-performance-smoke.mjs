#!/usr/bin/env node
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import react from "@vitejs/plugin-react";
import { createServer } from "vite";

const pluginRoot = path.resolve(import.meta.dirname, "..");
const chromeCandidates = [
  process.env.CHROME_PATH,
  process.env.CHROME_BIN,
  ...(process.platform === "darwin"
    ? ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"]
    : process.platform === "win32"
      ? [process.env.PROGRAMFILES && path.join(process.env.PROGRAMFILES, "Google", "Chrome", "Application", "chrome.exe")]
      : ["/usr/bin/google-chrome", "/usr/bin/google-chrome-stable", "/usr/bin/chromium"])
].filter(Boolean);
const chromePath = chromeCandidates.find((candidate) => fs.existsSync(candidate));
assert.equal(typeof chromePath, "string", `Chrome is required for render performance smoke; checked: ${chromeCandidates.join(", ")}`);

function cdpClient(webSocketUrl) {
  const socket = new WebSocket(webSocketUrl);
  let nextId = 1;
  const pending = new Map();
  const opened = new Promise((resolve, reject) => {
    socket.addEventListener("open", resolve, { once: true });
    socket.addEventListener("error", reject, { once: true });
  });
  socket.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    const handler = pending.get(message.id);
    if (!handler) return;
    pending.delete(message.id);
    if (message.error) handler.reject(new Error(message.error.message));
    else handler.resolve(message.result);
  });
  return {
    async send(method, params = {}) {
      await opened;
      const id = nextId++;
      const result = new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
      socket.send(JSON.stringify({ id, method, params }));
      return result;
    },
    close() { socket.close(); }
  };
}

async function terminate(child) {
  if (!child || child.exitCode !== null || child.signalCode !== null) return;
  const exited = new Promise((resolve) => child.once("exit", resolve));
  child.kill("SIGTERM");
  const graceful = await Promise.race([exited.then(() => true), new Promise((resolve) => setTimeout(() => resolve(false), 5000))]);
  if (!graceful) child.kill("SIGKILL");
  await exited;
}

const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "canvasight-render-performance-"));
let chrome;
let vite;
let cdp;
try {
  vite = await createServer({
    configFile: false,
    root: pluginRoot,
    plugins: [react()],
    server: { host: "127.0.0.1", port: 0, strictPort: false }
  });
  await vite.listen();
  const address = vite.httpServer.address();
  const origin = `http://127.0.0.1:${address.port}`;

  chrome = spawn(chromePath, [
    "--headless=new",
    "--no-sandbox",
    "--disable-gpu",
    "--enable-precise-memory-info",
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
  const target = await (await fetch(`http://${endpoint.host}/json/new?${encodeURIComponent("about:blank")}`, { method: "PUT" })).json();
  cdp = cdpClient(target.webSocketDebuggerUrl);
  await cdp.send("Runtime.enable");
  await cdp.send("Page.enable");

  const results = [];
  for (const count of [50, 200, 500]) {
    await cdp.send("Page.navigate", { url: `${origin}/tests/render-performance.html?nodes=${count}` });
    const deadline = Date.now() + 120_000;
    let result = null;
    while (Date.now() < deadline) {
      const response = await cdp.send("Runtime.evaluate", {
        expression: "window.__CANVASIGHT_PERFORMANCE_RESULT__ || null",
        returnByValue: true
      });
      if (response.exceptionDetails) throw new Error(response.exceptionDetails.text);
      result = response.result.value;
      if (result) break;
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    assert.ok(result, `render performance profile timed out for ${count} nodes`);
    assert.equal(result.nodeCount, count);
    assert.equal(result.unrelatedCommits, 0, `unrelated UI updates committed the ${count}-node ReactFlow surface`);
    assert.ok(result.nodeUpdateCommits > 0, `node updates did not exercise the ${count}-node ReactFlow surface`);
    assert.ok(Number.isFinite(result.p95CanvasCommitMs));
    results.push(result);
  }

  console.log(JSON.stringify({ environment: { chrome: path.basename(chromePath), node: process.version }, profiles: results }, null, 2));
  console.log("Canvasight render performance smoke passed.");
} finally {
  cdp?.close();
  await vite?.close();
  await terminate(chrome);
}
