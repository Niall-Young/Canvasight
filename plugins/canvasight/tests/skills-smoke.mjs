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
const source = fs.readFileSync(skillsPath, "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  fileName: skillsPath
}).outputText;

const module = { exports: {} };
vm.runInNewContext(compiled, { exports: module.exports, module, require() {} }, { filename: "skills.cjs" });
const { filterSkills, findSkillQuery, insertSkillToken } = module.exports;

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

const replaced = insertSkillToken("先分析，再用 $产品 完成", query, "write-product-promo-article");
assert.equal(replaced.value, "先分析，再用 $write-product-promo-article 完成");
assert.equal(replaced.caret, "先分析，再用 $write-product-promo-article ".length);

const secondDraft = `${replaced.value} $fig`;
const second = findSkillQuery(secondDraft, secondDraft.length, secondDraft.length);
const withSecondSkill = insertSkillToken(secondDraft, second, "figma");
assert.match(withSecondSkill.value, /\$write-product-promo-article .*\$figma /);

console.log("Skill picker smoke test passed");
