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

const { buildMarkdown, extractSkillNames } = module.exports;

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

const defaultAgentTeamResult = buildMarkdown(nodes, edges, "a", "flow", "Smoke Project", "/tmp/canvasight-smoke", "en");
assert.equal(defaultAgentTeamResult.agentTeam.enabled, false, "Agent Team must be opt-in when no setting is provided");
assert.doesNotMatch(defaultAgentTeamResult.markdown, /## Agent Team/);

const enabledAgentTeamResult = buildMarkdown(nodes, edges, "a", "flow", "Smoke Project", "/tmp/canvasight-smoke", "en", true);
assert.equal(enabledAgentTeamResult.agentTeam.enabled, true, "an explicit user opt-in must remain supported");
assert.match(enabledAgentTeamResult.markdown, /## Agent Team/);

const groupAsset = {
  id: "visual-reference",
  type: "asset",
  parentId: "visual-group",
  position: { x: 24, y: 88 },
  data: {
    title: "Homepage reference",
    description: "Use the restrained spacing and strong type hierarchy.",
    role: "reference",
    asset: {
      id: "homepage-reference-file",
      kind: "image",
      source: "upload",
      originalName: "homepage-reference.png",
      storedPath: "/tmp/canvasight-smoke/.scatter/assets/homepage-reference.png",
      relativePath: ".scatter/assets/homepage-reference.png",
      fileUrl: "/api/asset?path=homepage-reference",
      mime: "image/png",
      size: 1024,
      createdAt: "2026-08-04T00:00:00.000Z"
    }
  }
};
const groupedTask = {
  ...taskNode("visual-brief", "Visual brief", "Translate the reference into an original homepage direction.", { x: 420, y: 88 }),
  parentId: "visual-group"
};
const outsideTask = taskNode("outside-task", "Outside task", "Must not be included by Group Run.", { x: 900, y: 0 });
const groupNode = {
  id: "visual-group",
  type: "group",
  position: { x: 0, y: 0 },
  width: 820,
  height: 420,
  data: {
    title: "Visual direction",
    description: "Reference material and the brief it informs."
  }
};
const multimodalNodes = [groupNode, groupAsset, groupedTask, outsideTask];
const multimodalEdges = [
  { id: "reference-brief", source: "visual-reference", target: "visual-brief", label: "informs" },
  { id: "brief-outside", source: "visual-brief", target: "outside-task", label: "then" }
];

const groupRun = buildMarkdown(multimodalNodes, multimodalEdges, "visual-group", "flow", "Multimodal Project", "/tmp/canvasight-smoke", "en", false);
assert.equal(groupRun.nodes.map((node) => node.id).join(","), "visual-reference,visual-brief", "Group Run includes direct members only");
assert.equal(groupRun.attachments.map((attachment) => attachment.id).join(","), "homepage-reference-file");
assert.equal(groupRun.imagePaths.join(","), "/tmp/canvasight-smoke/.scatter/assets/homepage-reference.png");
assert.match(groupRun.markdown, /Visual direction/);
assert.match(groupRun.markdown, /Reference material and the brief it informs/);
assert.match(groupRun.markdown, /Homepage reference/);
assert.match(groupRun.markdown, /Use the restrained spacing and strong type hierarchy/);
assert.match(groupRun.markdown, /Homepage reference -> Visual brief/);
assert.doesNotMatch(groupRun.markdown, /Asset role:/, "persisted Asset roles must not leak into Run Markdown");
assert.equal(groupRun.nodes.find((node) => node.id === "visual-reference")?.data.role, "reference", "legacy Asset roles remain readable in the v2 data model");
assert.doesNotMatch(groupRun.markdown, /Outside task/);

const connectedReference = {
  ...groupAsset,
  id: "connected-reference",
  parentId: undefined,
  data: {
    ...groupAsset.data,
    title: "Connected UI reference",
    asset: {
      ...groupAsset.data.asset,
      id: "connected-reference-file",
      originalName: "connected-reference.png",
      storedPath: "/tmp/canvasight-smoke/.scatter/assets/connected-reference.png",
      relativePath: ".scatter/assets/connected-reference.png"
    }
  }
};
const unconnectedReference = {
  ...connectedReference,
  id: "unconnected-reference",
  data: {
    ...connectedReference.data,
    title: "Unconnected UI reference",
    asset: {
      ...connectedReference.data.asset,
      id: "unconnected-reference-file",
      originalName: "unconnected-reference.png",
      storedPath: "/tmp/canvasight-smoke/.scatter/assets/unconnected-reference.png",
      relativePath: ".scatter/assets/unconnected-reference.png"
    }
  }
};
const implementationTask = taskNode("implement-ui", "Implement UI", "Build the frontend from the connected references.", { x: 0, y: 0 });
const taskRunWithNodeAttachment = buildMarkdown(
  [implementationTask, connectedReference, unconnectedReference],
  [{ id: "task-connected-reference", source: "implement-ui", target: "connected-reference", label: "Attachment" }],
  "implement-ui",
  "flow",
  "Product Design Project",
  "/tmp/canvasight-smoke",
  "en",
  false
);
assert.equal(taskRunWithNodeAttachment.nodes.map((node) => node.id).join(","), "implement-ui,connected-reference", "Task Run includes the connected Asset node like an attachment");
assert.equal(taskRunWithNodeAttachment.imagePaths.join(","), "/tmp/canvasight-smoke/.scatter/assets/connected-reference.png");
assert.doesNotMatch(taskRunWithNodeAttachment.markdown, /Unconnected UI reference/);
assert.doesNotMatch(taskRunWithNodeAttachment.markdown, /unconnected-reference\.png/);

const svgAsset = {
  ...groupAsset,
  id: "vector-reference",
  position: { x: 24, y: 168 },
  data: {
    ...groupAsset.data,
    title: "Vector reference",
    asset: {
      ...groupAsset.data.asset,
      id: "vector-reference-file",
      originalName: "vector-reference.svg",
      storedPath: "/tmp/canvasight-smoke/.scatter/assets/vector-reference.svg",
      relativePath: ".scatter/assets/vector-reference.svg",
      mime: "image/svg+xml"
    }
  }
};
const videoAsset = {
  ...groupAsset,
  id: "motion-reference",
  position: { x: 24, y: 248 },
  data: {
    ...groupAsset.data,
    title: "Motion reference",
    asset: {
      ...groupAsset.data.asset,
      id: "motion-reference-file",
      kind: "video",
      originalName: "motion-reference.mp4",
      storedPath: "/tmp/canvasight-smoke/.scatter/assets/motion-reference.mp4",
      relativePath: ".scatter/assets/motion-reference.mp4",
      mime: "video/mp4"
    }
  }
};
const ordinaryFileAsset = {
  ...groupAsset,
  id: "brief-file",
  position: { x: 24, y: 328 },
  data: {
    ...groupAsset.data,
    title: "Brief file",
    asset: {
      ...groupAsset.data.asset,
      id: "brief-file-id",
      kind: "file",
      originalName: "brief.pdf",
      storedPath: "/tmp/canvasight-smoke/.scatter/assets/brief.pdf",
      relativePath: ".scatter/assets/brief.pdf",
      mime: "application/pdf"
    }
  }
};
const taskCarriesAsset = buildMarkdown(
  [groupNode, groupAsset, svgAsset, videoAsset, ordinaryFileAsset, groupedTask],
  [
    { id: "brief-image", source: "visual-brief", target: "visual-reference", label: "Attachment" },
    { id: "brief-svg", source: "visual-brief", target: "vector-reference", label: "Attachment" },
    { id: "brief-video", source: "visual-brief", target: "motion-reference", label: "Attachment" },
    { id: "brief-file-edge", source: "visual-brief", target: "brief-file", label: "Attachment" }
  ],
  "visual-brief",
  "flow",
  "Multimodal Project",
  "/tmp/canvasight-smoke",
  "en",
  false
);
assert.equal(taskCarriesAsset.nodes.map((node) => node.id).join(","), "visual-brief,visual-reference,vector-reference,motion-reference,brief-file", "Task Run follows every Task-to-Asset edge");
assert.equal(taskCarriesAsset.attachments.map((attachment) => attachment.id).join(","), "homepage-reference-file,vector-reference-file,motion-reference-file,brief-file-id");
assert.equal(taskCarriesAsset.imagePaths.join(","), "/tmp/canvasight-smoke/.scatter/assets/homepage-reference.png,/tmp/canvasight-smoke/.scatter/assets/vector-reference.svg", "Task Run carries raster and SVG image paths while retaining video and ordinary files as attachments");

const assetOnlyGroupRun = buildMarkdown([groupNode, groupAsset], [], "visual-group", "flow", "Multimodal Project", "/tmp/canvasight-smoke", "en", false);
assert.equal(assetOnlyGroupRun.nodes.map((node) => node.id).join(","), "visual-reference", "a Group containing only assets is runnable");
assert.match(assetOnlyGroupRun.markdown, /Homepage reference/);

const fullCanvasReview = buildMarkdown(multimodalNodes, multimodalEdges, null, "flow", "Multimodal Project", "/tmp/canvasight-smoke", "en", false);
assert.equal(fullCanvasReview.nodes.map((node) => node.id).join(","), "visual-reference,visual-brief,outside-task", "full-canvas review orders Group members before ungrouped nodes");
assert.match(fullCanvasReview.markdown, /## Group: Visual direction/);
assert.match(fullCanvasReview.markdown, /## Ungrouped Nodes/);
assert.ok(fullCanvasReview.markdown.indexOf("## Group: Visual direction") < fullCanvasReview.markdown.indexOf("## Ungrouped Nodes"), "Group chapters precede the independent ungrouped chapter");

const skillNodes = [
  taskNode("skill-root", "Root", "Coordinate the flow", { x: 0, y: 0 }),
  taskNode("skill-copy", "Copy", "$write-product-promo-article draft the launch copy", { x: 240, y: 0 }),
  taskNode("skill-design", "Design", "$figma create the visual and keep $figma editable", { x: 240, y: 140 })
];
const skillResult = buildMarkdown(
  skillNodes,
  [
    { id: "root-copy", source: "skill-root", target: "skill-copy" },
    { id: "root-design", source: "skill-root", target: "skill-design" }
  ],
  "skill-root",
  "flow",
  "Skill Project",
  "/tmp/canvasight-skill-smoke",
  "en",
  false
);
assert.deepEqual(Array.from(extractSkillNames("$figma and $figma plus ($imagegen)")), ["figma", "imagegen"]);
assert.match(skillResult.markdown, /## Node–Skill Map/);
assert.match(skillResult.markdown, /Copy \(`skill-copy`\): write-product-promo-article/);
assert.match(skillResult.markdown, /Design \(`skill-design`\): figma/);
assert.match(skillResult.markdown, /Apply each Skill only to the mapped node responsibility/);
assert.equal((skillResult.markdown.match(/\$figma/g) || []).length, 2, "mapping must not duplicate raw Skill trigger tokens");

console.log("Markdown flow smoke test passed");
