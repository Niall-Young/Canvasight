#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import ts from "typescript";

const pluginRoot = path.resolve(import.meta.dirname, "..");
const presentationPath = path.join(pluginRoot, "src", "lib", "assetPresentation.ts");
const assetNodePath = path.join(pluginRoot, "src", "components", "AssetNode.tsx");
const appCssPath = path.join(pluginRoot, "src", "styles", "app.css");

const compiled = ts.transpileModule(fs.readFileSync(presentationPath, "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  fileName: presentationPath
}).outputText;
const module = { exports: {} };
vm.runInNewContext(compiled, { exports: module.exports, module, require() {} }, { filename: "assetPresentation.cjs" });
const { fileIconName, isVideoAsset } = module.exports;

const expectedMappings = [
  ["brief.pdf", "application/octet-stream", "news-paper"],
  ["report.docx", "application/octet-stream", "notepad"],
  ["budget.xlsx", "application/octet-stream", "analyze-data"],
  ["deck.pptx", "application/octet-stream", "file-presentation"],
  ["bundle.zip", "application/octet-stream", "archive"],
  ["track.mp3", "application/octet-stream", "music"],
  ["clip.mp4", "application/octet-stream", "video"],
  ["analysis.ipynb", "application/octet-stream", "code-square"],
  ["warehouse.parquet", "application/octet-stream", "analyze-data"],
  ["table.arrow", "application/octet-stream", "analyze-data"],
  ["brand.woff2", "application/octet-stream", "writing"],
  ["scene.glb", "application/octet-stream", "all-gizmos"],
  ["installer.dmg", "application/octet-stream", "download-simple"],
  ["library.sqlite", "application/octet-stream", "storage"],
  ["book.epub", "application/octet-stream", "book"],
  ["artwork.psd", "application/octet-stream", "image-square"],
  ["layout.fig", "application/octet-stream", "compose-canvas"],
  ["layout.sketch", "application/octet-stream", "compose-canvas"],
  ["layout.xd", "application/octet-stream", "compose-canvas"],
  ["unknown.bin", "application/octet-stream", "notepad"]
];
for (const [name, mime, expectedIcon] of expectedMappings) {
  assert.equal(fileIconName(name, mime), expectedIcon, `${name} should use ${expectedIcon}`);
}
assert.equal(fileIconName("download", "font/woff2"), "writing");
assert.equal(fileIconName("model", "model/gltf-binary"), "all-gizmos");
assert.equal(fileIconName("dataset", "application/vnd.apache.parquet"), "analyze-data");
assert.equal(isVideoAsset("clip.mov", "application/octet-stream"), true);
assert.equal(isVideoAsset("notes.md", "text/markdown"), false);

const availableIcons = new Set();
for (const iconPath of fs.readdirSync(path.join(pluginRoot, "src", "assets", "icons", "icon"))) {
  if (!iconPath.endsWith(".svg")) continue;
  const base = iconPath.replace(/\.svg$/i, "").toLowerCase();
  availableIcons.add(base);
  base.split(",").forEach((alias) => availableIcons.add(alias.trim()));
}
for (const [, , icon] of expectedMappings) {
  assert.equal(availableIcons.has(icon), true, `mapped icon ${icon} must exist in the app SVG registry`);
}

const assetNodeSource = fs.readFileSync(assetNodePath, "utf8");
const appCssSource = fs.readFileSync(appCssPath, "utf8");
assert.match(assetNodeSource, /className="asset-role-trigger nodrag"/, "classification must stay visible at the top left");
assert.equal((assetNodeSource.match(/<AssetRoleOptions/g) ?? []).length, 1, "classification must not be duplicated in More");
assert.match(assetNodeSource, /className="asset-node-menu"/, "More must remain a distinct hover control");
assert.match(appCssSource, /\.asset-node-menu:has\(\.kit-icon-button\[data-state="open"\]\)/, "an open Portal menu must keep More visible");
assert.match(appCssSource, /\.asset-node-menu\s*\{[^}]*opacity:\s*0/s, "More must be hidden at rest");
assert.match(appCssSource, /\.asset-preview\.is-loading,[\s\S]*?min-height:\s*220px/, "only pending image states keep a placeholder");
assert.match(appCssSource, /\.asset-preview img\s*\{[^}]*width:\s*100%;[^}]*height:\s*auto;/s, "ready images must preserve their natural ratio");
assert.doesNotMatch(appCssSource, /\.asset-preview\s*\{[^}]*height:\s*280px/s, "images must not use a fixed viewport");
assert.doesNotMatch(assetNodeSource, /formatBytes|data\.asset\.size|asset-file-copy|asset-image-copy/, "Asset content must not render file names or sizes");
assert.doesNotMatch(appCssSource, /\.asset-file-summary\s*\{[^}]*background:\s*var\(--color-background-input\)/s, "file Assets must not add an inner gray card");

console.log("Asset presentation smoke test passed");
