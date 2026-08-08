#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import ts from "typescript";

const pluginRoot = path.resolve(import.meta.dirname, "..");
const presentationPath = path.join(pluginRoot, "src", "lib", "assetPresentation.ts");
const assetNodePath = path.join(pluginRoot, "src", "components", "AssetNode.tsx");
const scatterEdgePath = path.join(pluginRoot, "src", "components", "ScatterEdge.tsx");
const appPath = path.join(pluginRoot, "src", "App.tsx");

const compiled = ts.transpileModule(fs.readFileSync(presentationPath, "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  fileName: presentationPath
}).outputText;
const module = { exports: {} };
vm.runInNewContext(compiled, { exports: module.exports, module, require() {} }, { filename: "assetPresentation.cjs" });
const { fileIconName, isVideoAsset } = module.exports;

const expectedMappings = [
  ["brief.pdf", "application/octet-stream", "file-format-pdf"],
  ["README.md", "application/octet-stream", "file-format-md"],
  ["deck.pptx", "application/octet-stream", "file-format-ppt"],
  ["keynote.key", "application/octet-stream", "file-format-ppt"],
  ["records.csv", "application/octet-stream", "file-format-csv"],
  ["records.tsv", "application/octet-stream", "file-format-csv"],
  ["budget.xlsx", "application/octet-stream", "file-format-xls"],
  ["budget.numbers", "application/octet-stream", "file-format-xls"],
  ["report.docx", "application/octet-stream", "file-format-doc"],
  ["report.odt", "application/octet-stream", "file-format-doc"],
  ["index.tsx", "application/octet-stream", "file-format-code"],
  ["analysis.py", "application/octet-stream", "file-format-code"],
  ["unknown.bin", "application/octet-stream", "file-format-unknown"],
  ["bundle.zip", "application/zip", "file-format-unknown"]
];
for (const [name, mime, expectedIcon] of expectedMappings) {
  assert.equal(fileIconName(name, mime), expectedIcon, `${name} should use ${expectedIcon}`);
}
assert.equal(fileIconName("download", "application/pdf"), "file-format-pdf");
assert.equal(fileIconName("notes", "text/markdown"), "file-format-md");
assert.equal(fileIconName("dataset", "application/vnd.ms-excel"), "file-format-xls");
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
const scatterEdgeSource = fs.readFileSync(scatterEdgePath, "utf8");
const appSource = fs.readFileSync(appPath, "utf8");
const appCssSource = fs.readdirSync(path.join(pluginRoot, "src", "styles"))
  .filter((name) => name.endsWith(".css"))
  .sort()
  .map((name) => fs.readFileSync(path.join(pluginRoot, "src", "styles", name), "utf8"))
  .join("\n");
assert.doesNotMatch(assetNodeSource, /AssetRoleOptions|asset-role-trigger|asset-role-option|asset\.classification|asset\.role\.|data\.role/, "Asset nodes must not render or expose the persisted compatibility role");
assert.doesNotMatch(assetNodeSource, /RadioGroup|RadioItem/, "Asset classification must not return inside More");
assert.match(assetNodeSource, /className="asset-node-menu"/, "More must remain a distinct hover control");
assert.match(appCssSource, /\.asset-node-controls\s*\{[^}]*right:\s*12px;[^}]*left:\s*auto;[^}]*justify-content:\s*flex-end;/s, "Asset controls must remain right-aligned after classification removal");
assert.match(appCssSource, /\.asset-node-menu:has\(\.kit-icon-button\[data-state="open"\]\)/, "an open Portal menu must keep More visible");
assert.match(appCssSource, /\.asset-node-menu\s*\{[^}]*opacity:\s*0/s, "More must be hidden at rest");
assert.match(appCssSource, /\.asset-node-menu \.kit-icon-button,[\s\S]*?\.asset-node-menu \.kit-icon-button\[data-state="open"\][\s\S]*?background:\s*var\(--color-background-surface\);/s, "More must keep one opaque surface across visible states");
assert.doesNotMatch(appCssSource, /\.asset-node-menu \.kit-icon-button\s*\{[^}]*color-mix\([^}]*transparent/s, "video must not show through the More button");
assert.match(appCssSource, /\.asset-preview\.is-loading,[\s\S]*?min-height:\s*220px/, "only pending image states keep a placeholder");
assert.match(appCssSource, /\.asset-preview img\s*\{[^}]*width:\s*100%;[^}]*height:\s*auto;/s, "ready images must preserve their natural ratio");
assert.doesNotMatch(appCssSource, /\.asset-preview\s*\{[^}]*height:\s*280px/s, "images must not use a fixed viewport");
assert.match(appCssSource, /\.asset-node-content\s*\{[^}]*position:\s*relative;/s, "media selection decoration must anchor without changing Asset geometry");
assert.match(
  appCssSource,
  /\.asset-node\.is-image\.is-selected \.asset-node-content::after,\s*\.asset-node\.is-video\.is-selected \.asset-node-content::after\s*\{[^}]*position:\s*absolute;[^}]*inset:\s*0;[^}]*pointer-events:\s*none;[^}]*border:\s*var\(--border-weight-sm\) solid var\(--color-border-focus\);[^}]*border-radius:\s*inherit;/s,
  "selected image and video Assets must draw a focus-token overlay border without moving Handles or Edges"
);
assert.match(assetNodeSource, /<video[^>]*className="asset-video"[^>]*src=\{videoSrc\}[^>]*controls[^>]*preload="metadata"[^>]*aria-label=\{displayName\}[^>]*\/>/s, "video Assets must expose the browser's complete native controls");
assert.doesNotMatch(assetNodeSource, /controlsList|disablePictureInPicture|disableRemotePlayback/, "native video controls must not suppress progress, volume, fullscreen, or other browser controls");
assert.doesNotMatch(assetNodeSource, /videoPlaying|videoRef|toggleVideoPlayback|handleVideoSurfaceClick|asset-video-toolbar|asset-video-playback|asset\.playVideo|asset\.pauseVideo|asset\.videoControls/, "custom playback state, commands, toolbar, and labels must be removed");
assert.match(assetNodeSource, /<video[^>]*controls[^>]*\/>\s*<div className="asset-video-selection-layer" aria-hidden="true"\s*\/>/s, "a transparent sibling layer must own picture clicks without invoking native playback");
assert.match(appSource, /function isKeyboardInteractiveTarget\([\s\S]*?closest\("button, a\[href\], input, textarea, select, summary, video\[controls\], audio\[controls\],[\s\S]*?\[role='button'\][\s\S]*?\);\s*\}/s, "canvas Space-pan shortcuts must recognize native controls, including controlled media");
assert.match(appSource, /function handleKeyDown\(event: KeyboardEvent\): void \{\s*if \(isEditableTarget\(event\.target\) \|\| isKeyboardInteractiveTarget\(event\.target\)\) return;/s, "Space keydown on native media controls must keep browser keyboard behavior");
assert.match(appSource, /function handleKeyUp\(event: KeyboardEvent\): void \{\s*if \(!isSpaceKey\(event\) \|\| isKeyboardInteractiveTarget\(event\.target\)\) return;/s, "Space keyup on native media controls must not be prevented by canvas pan handling");
assert.match(assetNodeSource, /onDoubleClick=\{openFile\}/, "media Assets must retain double-click file opening");
assert.match(assetNodeSource, /className="node-connect-button"[\s\S]*?className="asset-node-menu"[\s\S]*?className="node-connect-button"/s, "video controls must not replace More or the left and right connection controls");
assert.match(appCssSource, /\.asset-video-stage\s*\{[^}]*position:\s*relative;[^}]*width:\s*100%;/s, "the video selection layer must anchor within the media geometry");
assert.match(appCssSource, /\.asset-video-selection-layer\s*\{[^}]*position:\s*absolute;[^}]*top:\s*0;[^}]*right:\s*0;[^}]*bottom:\s*48px;[^}]*left:\s*0;[^}]*z-index:\s*1;[^}]*cursor:\s*pointer;/s, "the transparent selection layer must cover only the picture and leave native bottom controls unobstructed");
assert.match(appCssSource, /\.asset-node-controls\s*\{[^}]*z-index:\s*3;/s, "More must remain above the video selection layer");
assert.doesNotMatch(appCssSource, /\.asset-video-toolbar|\.asset-video-playback/, "custom playback toolbar styles must be removed");
assert.match(assetNodeSource, /className="asset-file-icon"[\s\S]*?className="asset-file-copy"[\s\S]*?className="asset-file-name"[\s\S]*?className="asset-file-meta"/, "file Assets must render a horizontal icon, name, and metadata row");
assert.match(assetNodeSource, /\{fileType\} · \{formatBytes\(data\.asset\.size\)\}/, "file Assets must show lightweight format and size metadata");
assert.match(appCssSource, /\.asset-node\s*\{[^}]*width:\s*360px;/s, "all Asset nodes must retain the specified 360px width");
assert.match(appCssSource, /\.asset-node\.is-file\s*\{[^}]*min-height:\s*112px;[^}]*background:\s*var\(--color-background-surface\);/s, "file Assets must keep the compact 360px single-card surface");
assert.match(appCssSource, /\.asset-file-summary\s*\{[^}]*display:\s*flex;[^}]*min-height:\s*112px;/s, "file Asset content must retain the compact 112px minimum height");
assert.match(appCssSource, /\.asset-file-summary\s*\{[^}]*display:\s*flex;[^}]*gap:\s*16px;[^}]*padding:\s*16px 56px 16px 16px;[^}]*background:\s*transparent;/s, "file Assets must use Task-aligned padding with a safe area for More");
assert.match(appCssSource, /\.asset-file-icon\s*\{[^}]*flex:\s*0 0 48px;/s, "file format icons must use the specified 48px presentation size");
assert.match(appCssSource, /\.asset-file-name\s*\{[^}]*font-size:\s*var\(--text-16\);[^}]*line-height:\s*22px;[^}]*font-weight:\s*500;/s, "file names must use the specified 16/22 medium typography");
assert.doesNotMatch(appCssSource, /\.asset-file-summary\s*\{[^}]*background:\s*var\(--color-background-(?:input|surface)\)/s, "file Assets must not add an inner card surface");
assert.match(appCssSource, /\.react-flow \.react-flow__nodes\s*\{[^}]*z-index:\s*auto;/s, "the nodes container must not flatten Group and content node layers");
assert.match(appCssSource, /\.react-flow \.react-flow__edges > svg\s*\{[^}]*z-index:\s*1 !important;/s, "XYFlow edge SVGs must stay between Groups and content nodes");
assert.match(appCssSource, /\.react-flow__node-group\s*\{[^}]*z-index:\s*0 !important;/s, "Groups must stay below Edges");
assert.match(appCssSource, /\.react-flow__node-task,\s*\.react-flow__node-asset\s*\{\s*z-index:\s*2 !important;/s, "Task and Asset nodes must stay above Edges");
assert.match(
  appCssSource,
  /\.react-flow__handle\.node-handle\s*\{[^}]*z-index:\s*4;/s,
  "connection Handles must paint above Asset media, selection overlays, and node controls"
);
assert.match(scatterEdgeSource, /function nodeEdgeX\([^)]*\)[^{]*\{\s*return capSide\(position\) === "left" \? x \+ 10 : x - 10;\s*\}/s, "persistent Edge endpoints must move inward by half the 20px Handle width");
assert.doesNotMatch(scatterEdgeSource, /return capSide\(position\) === "left" \? x - 10 : x \+ 10;/, "persistent Edge endpoints must not be pushed outside the node");
assert.match(scatterEdgeSource, /getBezierPath\(\{\s*sourceX:\s*sourceEdgeX,[\s\S]*?targetX:\s*targetEdgeX,/s, "persistent Edge paths must use the node-boundary coordinates");
assert.match(scatterEdgeSource, /<EdgeCap[^>]*x=\{sourceEdgeX\}[^>]*\/>[\s\S]*?<EdgeCap[^>]*x=\{targetEdgeX\}[^>]*\/>/s, "persistent Edge caps must use the node-boundary coordinates");
assert.match(scatterEdgeSource, /interactionWidth=\{20\}/, "Edge click targets must retain their interaction width");
assert.match(appSource, /if \(position === Position\.Left\) return x - offset;[\s\S]*?if \(position === Position\.Right\) return x \+ offset;/, "the live connection line must also start outside the connect button");
assert.match(appCssSource, /\.react-flow__edge\.selected \.scatter-edge-path,[\s\S]*?\.scatter-edge-path\.is-selected\s*\{[^}]*stroke:\s*var\(--color-primary\);/s, "selected Edge highlighting must remain intact");
assert.match(appCssSource, /\.canvas-shell\.has-connection-preview \.scatter-connection-path\s*\{[^}]*display:\s*none;/s, "the connection preview handoff must remain intact");

console.log("Asset presentation smoke test passed");
