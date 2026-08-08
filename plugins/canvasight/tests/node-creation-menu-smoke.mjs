#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const pluginRoot = path.resolve(import.meta.dirname, "..");
const read = (...segments) => fs.readFileSync(path.join(pluginRoot, ...segments), "utf8");

const appSource = read("src", "App.tsx");
const actionsSource = read("src", "application", "CanvasActionsContext.tsx");
const pickerSource = read("src", "application", "connectedNodeFilePicker.ts");
const connectButtonSource = read("src", "components", "ConnectButton.tsx");
const menuSource = read("src", "components", "ConnectedNodeMenu.tsx");
const creationSource = read("src", "domain", "connectedNodeCreation.ts");
const taskNodeSource = read("src", "components", "TaskNode.tsx");
const assetNodeSource = read("src", "components", "AssetNode.tsx");
const translationsSource = read("src", "lib", "translations.ts");

assert.match(creationSource, /ConnectedNodeKind = "task" \| "file" \| "media"/, "the internal action contract must expose exactly the three creation choices");
assert.match(actionsSource, /requestConnectedNodeMenu:/, "node components must request the menu instead of creating a Task directly");
assert.doesNotMatch(actionsSource, /createConnectedNode:/, "the old direct-create action must be removed");

assert.match(connectButtonSource, /deltaX \* deltaX \+ deltaY \* deltaY > 16/, "click versus drag must retain the four-pixel threshold");
assert.match(connectButtonSource, /if \(dragged\) return;[\s\S]*?requestMenu\(button, upEvent\.clientX, upEvent\.clientY\)/, "a drag must not open the click-anchored menu");
assert.match(connectButtonSource, /aria-haspopup="menu"[\s\S]*?aria-expanded=\{menuOpen\}/, "the visible plus button must expose menu accessibility state");
assert.match(taskNodeSource, /<ConnectButton nodeId=\{id\} side="left" \/>[\s\S]*?<ConnectButton nodeId=\{id\} side="right" \/>/s, "Task nodes must use the shared menu button on both sides");
assert.match(assetNodeSource, /<ConnectButton nodeId=\{id\} side="left" \/>[\s\S]*?<ConnectButton nodeId=\{id\} side="right" \/>/s, "Asset nodes must use the shared menu button on both sides");

for (const kind of ["task", "file", "media"]) {
  assert.match(menuSource, new RegExp(`onSelect\\("${kind}"\\)`), `the menu must expose ${kind}`);
}
assert.match(appSource, /dropPosition:\s*flowPosition/, "dropping a connection on blank canvas must defer creation through the same menu");
assert.doesNotMatch(appSource, /const newNode = emptyNode\(nodePosition, nodes\.length\)/, "blank-canvas connection drops must not create a Task before menu selection");
assert.match(pickerSource, /input\.multiple = false;/, "file and media menu choices must import exactly one file");
assert.match(pickerSource, /if \(kind === "media"\) input\.accept = mediaAssetAccept;/, "the media picker must advertise the image/video filter");
assert.match(pickerSource, /isMediaAssetFile\(file\.name, file\.type\)/, "picker choices must be validated before upload");
assert.match(appSource, /useScatterStore\.getState\(\)[\s\S]*?buildConnectedNodeCandidate\(request, kind, attachment, current\.nodes, current\.edges\)[\s\S]*?commitCanvasChange\(/s, "asset completion must re-read current graph state, validate the edge, then atomically commit node and edge");
assert.match(menuSource, /onCloseAutoFocus=\{\(event\) => \{[\s\S]*?focusTarget\?\.focus\(\)/s, "closing the menu must restore focus to the originating plus button when present");

assert.match(translationsSource, /"nodeCreation\.task": "任务节点"[\s\S]*?"nodeCreation\.task": "Task node"/s, "node menu labels must remain bilingual");
assert.match(translationsSource, /"status\.mediaFileRequired"[\s\S]*?"status\.documentFileRequired"/s, "file-category validation must have localized feedback");

console.log("Node creation menu smoke test passed");
