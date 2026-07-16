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
const skillsPath = path.join(pluginRoot, "src", "lib", "skills.ts");
const placementPath = path.join(pluginRoot, "src", "lib", "skillPickerPlacement.ts");
const graphWriterSkillPath = path.join(pluginRoot, "skills", "canvasight-graph-writer", "SKILL.md");
const updateSkillPath = path.join(pluginRoot, "skills", "canvasight-update", "SKILL.md");

function loadTypescriptModule(sourcePath) {
  const source = fs.readFileSync(sourcePath, "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    fileName: sourcePath
  }).outputText;
  const module = { exports: {} };
  vm.runInNewContext(compiled, { exports: module.exports, module, require() {} }, { filename: path.basename(sourcePath) });
  return module.exports;
}

const { filterSkills, findSkillQuery, insertSkillToken } = loadTypescriptModule(skillsPath);
const { placeSkillPicker, toViewportCaretRect } = loadTypescriptModule(placementPath);
const graphWriterSkill = fs.readFileSync(graphWriterSkillPath, "utf8");
const updateSkill = fs.readFileSync(updateSkillPath, "utf8");

assert.match(updateSkill, /Run exactly that one bundled-updater command and no other shell command/);
assert.match(updateSkill, /Do not run `npm install`, `npm ci`, another package manager, builds, tests, release preparation or verification/);
assert.match(updateSkill, /direct `codex plugin` or marketplace commands, Git commands, cleanup, or duplicate-file repair/);
assert.match(updateSkill, /The updater owns every permitted check, install, verification, and rollback step/);

assert.match(graphWriterSkill, /ask_canvasight_framework_questions/);
assert.match(graphWriterSkill, /repository, captured Page, user context, and applicable professional Skills/);
assert.match(graphWriterSkill, /Before any `write_canvasight_graph` call, classify every planned unresolved item as either `blocking-framework` or `non-blocking-backlog`/);
assert.match(graphWriterSkill, /`blocking-framework`.*identity or authority.*primary audience.*included content or media types.*language coverage/s);
assert.match(graphWriterSkill, /planned visible output.*(?:待确认|“待确认”).*call `ask_canvasight_framework_questions` first/s);
assert.match(graphWriterSkill, /call `ask_canvasight_framework_questions` first and stop the graph-write turn/);
assert.match(graphWriterSkill, /Never write or claim completion first, and never place an unanswered blocking item in a pending\/open-question node/);
assert.match(graphWriterSkill, /`non-blocking-backlog`.*Keep it only when the user requested an exploratory\/open-question backlog/s);
assert.match(graphWriterSkill, /highest-priority one to three blocking confirmations into one card/);
assert.match(graphWriterSkill, /merge semantically overlapping pending items into one question/);
assert.match(graphWriterSkill, /three-question cap never permits writing while another independent blocker remains/);
assert.match(graphWriterSkill, /facts that the repository, Page, context, or Skills can establish/);
assert.match(graphWriterSkill, /Do not ask about node count, routine wording, decoration/);
assert.match(graphWriterSkill, /After calling the tool, wait for its visible user-message response/);
assert.match(graphWriterSkill, /Do not ask an answered question again/);
assert.match(graphWriterSkill, /Re-run step 1 before writing/);
assert.match(graphWriterSkill, /tool is unavailable.*ordinary text/s);
assert.match(graphWriterSkill, /never open Canvasight, invoke another visualization surface, guess a consequential answer, or proceed with a write/);
assert.match(graphWriterSkill, /Never write pending choices or `confirmationId` into `\.scatter`/);

const catalog = [
  { name: "write-product-promo-article", displayName: "产品推广文章", description: "撰写中文产品发布和教程文章", scope: "user" },
  { name: "figma", displayName: "Figma", description: "Translate designs", scope: "plugin" },
  { name: "imagegen", displayName: "Image generation", description: "生成图片和视觉素材", scope: "system" }
];

const query = findSkillQuery("先分析，再用 $产品", 11, 11);
assert.deepEqual({ ...query }, { start: 7, end: 11, query: "产品" });
assert.equal(findSkillQuery("价格$100", 6, 6), null, "a dollar sign inside ordinary text must not open the picker");
assert.equal(findSkillQuery("$figma", 2, 4), null, "range selections must not be rewritten implicitly");
assert.equal(filterSkills(catalog, "产品")[0].name, "write-product-promo-article");
assert.equal(filterSkills(catalog, "fig")[0].name, "figma");

const completeCatalog = Array.from({ length: 18 }, (_, index) => ({
  name: `skill-${index + 1}`,
  displayName: `Skill ${index + 1}`,
  description: "",
  scope: "user"
}));
assert.equal(filterSkills(completeCatalog, "").length, completeCatalog.length, "an empty query must expose the complete catalog");
assert.equal(filterSkills(completeCatalog, "", 8).length, 8, "explicit result limits must remain available to non-picker callers");

const belowPlacement = placeSkillPicker({
  anchorRect: { top: 120, right: 122, bottom: 138, left: 120 },
  pickerHeight: 228,
  pickerWidth: 288,
  viewportHeight: 800,
  viewportWidth: 1200
});
assert.equal(belowPlacement.placement, "below");
assert.equal(belowPlacement.top, 144, "below placement must leave the caret line visible");

const abovePlacement = placeSkillPicker({
  anchorRect: { top: 680, right: 782, bottom: 698, left: 780 },
  pickerHeight: 228,
  pickerWidth: 288,
  viewportHeight: 800,
  viewportWidth: 1200
});
assert.equal(abovePlacement.placement, "above");
assert.equal(abovePlacement.top, 446);

const rightPlacement = placeSkillPicker({
  anchorRect: { top: 146, right: 322, bottom: 164, left: 320 },
  pickerHeight: 228,
  pickerWidth: 288,
  viewportHeight: 280,
  viewportWidth: 900
});
assert.equal(rightPlacement.placement, "right");
assert.equal(rightPlacement.left, 328);
assert.equal(rightPlacement.top, 44, "side placement must remain clamped inside the viewport");

const leftPlacement = placeSkillPicker({
  anchorRect: { top: 146, right: 842, bottom: 164, left: 840 },
  pickerHeight: 228,
  pickerWidth: 288,
  viewportHeight: 280,
  viewportWidth: 900
});
assert.equal(leftPlacement.placement, "left");
assert.equal(leftPlacement.left, 546);

const clampedPlacement = placeSkillPicker({
  anchorRect: { top: 90, right: 4, bottom: 108, left: 2 },
  pickerHeight: 228,
  pickerWidth: 288,
  viewportHeight: 280,
  viewportWidth: 330
});
assert.equal(clampedPlacement.left, 10);
assert.equal(clampedPlacement.top, 44);

assert.deepEqual(
  { ...toViewportCaretRect({
    caretHeight: 20,
    localLeft: 140,
    localTop: 72,
    scaleX: 0.8,
    scaleY: 0.8,
    scrollLeft: 10,
    scrollTop: 32,
    textareaLeft: 200,
    textareaTop: 100
  }) },
  { bottom: 148, left: 304, right: 305, top: 132 },
  "caret coordinates must include textarea scroll and XYFlow scale"
);

const replaced = insertSkillToken("先分析，再用 $产品 完成", query, "write-product-promo-article");
assert.equal(replaced.value, "先分析，再用 $write-product-promo-article 完成");
assert.equal(replaced.caret, "先分析，再用 $write-product-promo-article ".length);
assert.equal(findSkillQuery("价格 $100", "价格 $100".length, "价格 $100".length), null, "ordinary prices must not open the Skill picker");

const secondDraft = `${replaced.value} $fig`;
const second = findSkillQuery(secondDraft, secondDraft.length, secondDraft.length);
const withSecondSkill = insertSkillToken(secondDraft, second, "figma");
assert.match(withSecondSkill.value, /\$write-product-promo-article .*\$figma /);

console.log("Skill picker smoke test passed");
