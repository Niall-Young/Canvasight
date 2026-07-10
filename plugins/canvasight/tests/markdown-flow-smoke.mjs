#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const pluginRoot = path.resolve(__dirname, "..");
const markdownPath = path.join(pluginRoot, "src", "lib", "markdown.ts");
const source = fs.readFileSync(markdownPath, "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022
  },
  fileName: markdownPath
}).outputText;

const module = { exports: {} };
vm.runInNewContext(
  compiled,
  {
    exports: module.exports,
    module,
    require(request) {
      throw new Error(`Unexpected runtime import in markdown smoke test: ${request}`);
    }
  },
  { filename: "markdown.cjs" }
);

const { buildMarkdown } = module.exports;

function taskNode(id, title, body, position, legacyMode = null) {
  return {
    id,
    type: "task",
    position,
    data: {
      title,
      body,
      attachments: [],
      ...(legacyMode ? { codexMode: legacyMode } : {}),
      effort: "high",
      ...(legacyMode === "plan" ? { planMode: true } : {}),
      runMode: "flow"
    }
  };
}

const nodes = [
  taskNode("a", "A", "Root prompt", { x: 0, y: 0 }, "plan"),
  taskNode("b", "B", "First child", { x: 0, y: 120 }),
  taskNode("c", "C", "Second child", { x: 240, y: 120 }),
  taskNode("d", "D", "Unrelated node", { x: 0, y: 320 })
];
const edges = [
  { id: "a-c", source: "a", target: "c" },
  { id: "a-b", source: "a", target: "b" }
];

const result = buildMarkdown(nodes, edges, "a", "flow", "Smoke Project", "/tmp/canvasight-smoke", "en", false);
assert.equal(result.nodes.map((node) => node.id).join(","), "a,b,c");
assert.equal("codexMode" in result, false, "removed node execution modes must not leak from Markdown output");
assert.equal("planMode" in result, false, "removed Plan state must not leak from Markdown output");
assert.doesNotMatch(result.markdown, /Codex mode: (Plan|Goal)/);
assert.doesNotMatch(result.markdown, /Plan mode requested:/);
assert.doesNotMatch(result.markdown, /Goal mode requested:/);
assert.match(result.markdown, /A/);
assert.match(result.markdown, /Root prompt/);
assert.match(result.markdown, /B/);
assert.match(result.markdown, /First child/);
assert.match(result.markdown, /C/);
assert.match(result.markdown, /Second child/);
assert.doesNotMatch(result.markdown, /Unrelated node/);
assert.ok(result.markdown.indexOf("Root prompt") < result.markdown.indexOf("First child"));
assert.ok(result.markdown.indexOf("First child") < result.markdown.indexOf("Second child"));

console.log("Markdown flow smoke test passed");
