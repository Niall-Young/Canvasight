#!/usr/bin/env node
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import { unzipSync } from "fflate";

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pluginRoot = path.resolve(__dirname, "..");
const exportPath = path.join(pluginRoot, "src", "lib", "markdownExport.ts");
const source = fs.readFileSync(exportPath, "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  fileName: exportPath
}).outputText;
const module = { exports: {} };
vm.runInNewContext(compiled, { exports: module.exports, module, require }, { filename: "markdownExport.cjs" });
const { buildMarkdownExport, sanitizeDownloadName } = module.exports;

assert.equal(sanitizeDownloadName(" ../My: prompt? "), "-My- prompt-");
assert.equal(sanitizeDownloadName(""), "scatter-prompt");

const markdown = "# Task\n- Relative: `.scatter/assets/a.txt`\n- Absolute: `/tmp/project/.scatter/assets/a.txt`\n";
const attachment = {
  id: "first",
  originalName: "a.txt",
  relativePath: ".scatter/assets/a.txt",
  storedPath: "/tmp/project/.scatter/assets/a.txt"
};
const plain = await buildMarkdownExport({ attachments: [], markdown, title: "Task", loadAttachment: async () => new Uint8Array() });
assert.equal(plain.fileName, "Task.md");
assert.equal(new TextDecoder().decode(plain.bytes), markdown);

const bundle = await buildMarkdownExport({
  attachments: [attachment, { ...attachment, id: "second" }],
  markdown,
  title: "Task",
  loadAttachment: async (item) => new TextEncoder().encode(item.id)
});
assert.equal(bundle.fileName, "Task.zip");
const files = unzipSync(bundle.bytes);
assert.deepEqual(Object.keys(files).sort(), ["Task.md", "assets/a-2.txt", "assets/a.txt"]);
assert.equal(new TextDecoder().decode(files["assets/a.txt"]), "first");
assert.equal(new TextDecoder().decode(files["assets/a-2.txt"]), "second");
const archiveMarkdown = new TextDecoder().decode(files["Task.md"]);
assert.doesNotMatch(archiveMarkdown, /\/tmp\/project/);
assert.match(archiveMarkdown, /assets\/a/);
await assert.rejects(
  () => buildMarkdownExport({ attachments: [attachment], markdown, title: "Task", loadAttachment: async () => { throw new Error("asset unavailable"); } }),
  /asset unavailable/
);
console.log("Markdown export smoke test passed");
