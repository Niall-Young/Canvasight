#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const pluginRoot = path.resolve(import.meta.dirname, "..");
const read = (...segments) => fs.readFileSync(path.join(pluginRoot, ...segments), "utf8");
const lines = (...segments) => read(...segments).split(/\r?\n/).length;

for (const name of fs.readdirSync(path.join(pluginRoot, "src", "domain")).filter((entry) => entry.endsWith(".ts") && !entry.endsWith(".test.ts"))) {
  const source = read("src", "domain", name);
  assert.doesNotMatch(
    source,
    /from\s+["'][^"']*(?:components|application|store|canvasightApi)[^"']*["']/,
    `domain module ${name} must not depend on UI, application state, or transport`
  );
}

for (const name of fs.readdirSync(path.join(pluginRoot, "mcp", "domain")).filter((entry) => entry.endsWith(".mjs") && !entry.endsWith(".test.mjs"))) {
  const source = read("mcp", "domain", name);
  assert.doesNotMatch(source, /server(?:\.source)?\.mjs/, `MCP domain module ${name} must not depend on the composition root`);
  assert.doesNotMatch(source, /node:(?:fs|http|child_process)/, `MCP domain module ${name} must remain free of infrastructure I/O`);
}

const appSource = read("src", "App.tsx");
assert.doesNotMatch(appSource, /function (?:normalizeDocument|rebaseLocalChangesAfterSave|isConnectionAllowed|assetPositionNextToTask)\b/, "App must consume domain interfaces instead of re-implementing rules");
assert.doesNotMatch(appSource, /setTaskNodeActions|taskNodeActions/, "workspace actions must be instance-bound through Context");
assert.ok(lines("src", "App.tsx") <= 3250, "App.tsx exceeded its post-refactor size ratchet; deepen an existing module before adding more orchestration");
assert.ok(lines("mcp", "server.source.mjs") <= 8750, "MCP composition root exceeded its post-refactor size ratchet; move logic behind a domain or infrastructure seam");
assert.ok(lines("src", "styles", "app.css") <= 10, "app.css must remain an ordered style entrypoint rather than collecting implementation rules");

console.log("Architecture boundary checks passed");
