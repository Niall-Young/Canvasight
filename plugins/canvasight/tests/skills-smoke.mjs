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

const secondDraft = `${replaced.value} $fig`;
const second = findSkillQuery(secondDraft, secondDraft.length, secondDraft.length);
const withSecondSkill = insertSkillToken(secondDraft, second, "figma");
assert.match(withSecondSkill.value, /\$write-product-promo-article .*\$figma /);

console.log("Skill picker smoke test passed");
