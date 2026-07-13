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
const { placeSkillPicker } = loadTypescriptModule(placementPath);

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

const sidePlacement = placeSkillPicker({
  anchorRect: { top: 120, right: 420, bottom: 220, left: 120 },
  nodeRect: { top: 80, right: 440, bottom: 300, left: 100 },
  pickerHeight: 300,
  pickerWidth: 336,
  viewportHeight: 800,
  viewportWidth: 1200
});
assert.equal(sidePlacement.placement, "right");
assert.equal(sidePlacement.left, 450);

const leftPlacement = placeSkillPicker({
  anchorRect: { top: 120, right: 1080, bottom: 220, left: 780 },
  nodeRect: { top: 80, right: 1100, bottom: 300, left: 760 },
  pickerHeight: 300,
  pickerWidth: 336,
  viewportHeight: 800,
  viewportWidth: 1200
});
assert.equal(leftPlacement.placement, "left");
assert.equal(leftPlacement.left, 414);

const compactViewportPlacement = placeSkillPicker({
  anchorRect: { top: 120, right: 760, bottom: 220, left: 80 },
  nodeRect: { top: 80, right: 800, bottom: 300, left: 40 },
  pickerHeight: 300,
  pickerWidth: 336,
  viewportHeight: 720,
  viewportWidth: 840
});
assert.equal(compactViewportPlacement.placement, "below");
assert.equal(compactViewportPlacement.top, 310);
assert.ok(compactViewportPlacement.left >= 12 && compactViewportPlacement.left + 336 <= 828);

const abovePlacement = placeSkillPicker({
  anchorRect: { top: 560, right: 760, bottom: 660, left: 80 },
  nodeRect: { top: 520, right: 800, bottom: 700, left: 40 },
  pickerHeight: 300,
  pickerWidth: 336,
  viewportHeight: 720,
  viewportWidth: 840
});
assert.equal(abovePlacement.placement, "above");
assert.equal(abovePlacement.top, 210);

const replaced = insertSkillToken("先分析，再用 $产品 完成", query, "write-product-promo-article");
assert.equal(replaced.value, "先分析，再用 $write-product-promo-article 完成");
assert.equal(replaced.caret, "先分析，再用 $write-product-promo-article ".length);

const secondDraft = `${replaced.value} $fig`;
const second = findSkillQuery(secondDraft, secondDraft.length, secondDraft.length);
const withSecondSkill = insertSkillToken(secondDraft, second, "figma");
assert.match(withSecondSkill.value, /\$write-product-promo-article .*\$figma /);

console.log("Skill picker smoke test passed");
