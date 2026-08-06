#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const pluginRoot = path.resolve(import.meta.dirname, "..");
const read = (...segments) => fs.readFileSync(path.join(pluginRoot, ...segments), "utf8");

const appSource = read("src", "App.tsx");
const taskNodeSource = read("src", "components", "TaskNode.tsx");
const canvasNodeSource = read("src", "components", "ui", "canvas-node.tsx");
const storeSource = read("src", "store", "scatterStore.ts");
const translationsSource = read("src", "lib", "translations.ts");
const appCssSource = read("src", "styles", "app.css");

assert.doesNotMatch(taskNodeSource, /task-node-footer|task\.addAttachment|chooseFilesForNode|addFilesToNode/, "Task nodes must not expose an inline attachment creation entry");
assert.doesNotMatch(appSource, /const addFilesToNode|const chooseFilesForNode|appendAttachments/, "the workspace must not retain inline attachment creation actions");
assert.doesNotMatch(storeSource, /appendAttachments/, "the store must not retain an action used only to create inline Task attachments");
assert.doesNotMatch(canvasNodeSource, /fileInputRef|handleUploadChange|onAddInput|onUploadFiles|uploadAccept|uploadMultiple|task\.uploadAttachment|kit-canvas-node-file-input/, "the legacy CanvasNode kit must not retain its attachment picker entry");

assert.match(taskNodeSource, /paste:\s*\(_view, event\) => \{\s*if \(event\.clipboardData && \[\.\.\.event\.clipboardData\.files\]\.length > 0\) \{\s*event\.preventDefault\(\);\s*return true;/s, "file paste must still be blocked from becoming rich-text content");
assert.match(taskNodeSource, /drop:\s*\(_view, event\) => \{\s*if \(event\.dataTransfer && \[\.\.\.event\.dataTransfer\.files\]\.length > 0\) \{\s*event\.preventDefault\(\);\s*return true;/s, "file drop must be blocked from becoming rich-text content");
assert.match(appSource, /function assetPositionNextToTask\(task: ScatterTaskNode, nodes: ScatterNode\[\]\): FlowPosition \{[\s\S]*?const group = task\.parentId[\s\S]*?const candidates = \[[\s\S]*?taskPosition\.x - assetNodeWidth - gap[\s\S]*?taskPosition\.x \+ nodeBounds\(task\)\.width \+ gap[\s\S]*?const occupiedNodes = nodes\.filter\(\(node\) => node\.type !== "group"\)[\s\S]*?Math\.max\(group\.position\.x \+ groupPadding, rawPosition\.x\)[\s\S]*?if \(isOpen\(position\)\) return position;[\s\S]*?return candidates\[1\];\s*\}/s, "Task-targeted files must choose a collision-free position beside the Task, respect Group padding, and fall back to its right");
assert.match(appSource, /const handleCanvasDrop[\s\S]*?targetNode\?\.type === "asset"[\s\S]*?const assetPosition = targetNode\?\.type === "task"\s*\? assetPositionNextToTask\(targetNode, nodes\)[\s\S]*?createAssetNodes\(\s*event\.dataTransfer\.files,\s*"drop",\s*assetPosition,[\s\S]*?targetNode\?\.type === "task" \? targetNode\.parentId/s, "dropping files on a Task must create adjacent Asset nodes and preserve its Group scope");
assert.match(appSource, /const files = clipboardImageFiles\(event\.clipboardData\);[\s\S]*?const assetPosition = targetNode\?\.type === "task"\s*\? assetPositionNextToTask\(targetNode, nodes\)[\s\S]*?createAssetNodes\(\s*files,\s*"paste",\s*assetPosition,[\s\S]*?targetNode\?\.type === "task" \? targetNode\.parentId/s, "pasting files on a Task must create adjacent Asset nodes and preserve its Group scope");

assert.match(taskNodeSource, /data\.attachments\.length[\s\S]*?data\.attachments\.map\(\(attachment\) =>[\s\S]*?<TaskAttachmentChip/s, "historical Task attachments must remain visible");
assert.match(taskNodeSource, /const hasRunnableInput = hasBody \|\| data\.attachments\.length > 0;[\s\S]*?label=\{hasRunnableInput \? t\("task\.run"\) : t\("task\.runEmpty"\)\}[\s\S]*?disabled=\{!hasRunnableInput\}/s, "a historical attachment must keep an otherwise empty Task runnable");
assert.match(taskNodeSource, /onPromote=\{\(\) => taskNodeActions\?\.promoteAttachment\(nodeId, attachment\.id\)\}/, "historical attachments must remain promotable");
assert.match(taskNodeSource, /taskNodeActions\?\.removeAttachment\(nodeId, attachment\.id\)/, "historical attachments must remain removable");
assert.match(appSource, /item\.type === "task" && \(item\.data\.body\.trim\(\)\.length > 0 \|\| item\.data\.attachments\.length > 0\)/, "historical attachments must remain runnable");
assert.match(storeSource, /attachments:\s*attachments\.map\(\(attachment\) => \(\{ \.\.\.attachment \}\)\)/, "history cloning must preserve persisted Task attachments");
assert.match(storeSource, /removeAttachment:[\s\S]*?node\.data\.attachments\.filter\(\(attachment\) => attachment\.id !== attachmentId\)/, "explicit historical attachment removal must remain supported");

assert.doesNotMatch(translationsSource, /"task\.(?:addAttachment|uploadAttachment)"|"status\.(?:attachmentsAdded|addAttachmentFailed)"/, "translations used by inline attachment creation must be removed");
assert.match(translationsSource, /"status\.addAssetFailed":\s*"添加资产失败"[\s\S]*?"status\.addAssetFailed":\s*"Failed to add asset"/s, "Asset creation failures must use Asset-specific bilingual wording");
assert.doesNotMatch(appCssSource, /\.task-node-footer|\.kit-canvas-node-file-input/, "styles used only by attachment picker entries must be removed");

console.log("Task attachment entry smoke test passed");
