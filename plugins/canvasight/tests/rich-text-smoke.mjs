#!/usr/bin/env node
import assert from "node:assert/strict";
import { Editor } from "@tiptap/core";
import Blockquote from "@tiptap/extension-blockquote";
import Bold from "@tiptap/extension-bold";
import BulletList from "@tiptap/extension-bullet-list";
import CodeBlock from "@tiptap/extension-code-block";
import { inputRegexMatch as inlineCodeInputRegexMatch } from "@tiptap/extension-code";
import Document from "@tiptap/extension-document";
import HardBreak from "@tiptap/extension-hard-break";
import Heading from "@tiptap/extension-heading";
import Italic from "@tiptap/extension-italic";
import OrderedList from "@tiptap/extension-ordered-list";
import Paragraph from "@tiptap/extension-paragraph";
import Strike from "@tiptap/extension-strike";
import { Markdown } from "@tiptap/markdown";
import Text from "@tiptap/extension-text";
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import ts from "typescript";

const require = createRequire(import.meta.url);
const pluginRoot = path.resolve(import.meta.dirname, "..");
const rawExtensionPath = path.join(pluginRoot, "src", "lib", "richTextExtensions.ts");
const compiledRawExtensions = ts.transpileModule(fs.readFileSync(rawExtensionPath, "utf8"), {
  compilerOptions: { esModuleInterop: true, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  fileName: rawExtensionPath
}).outputText;
const rawExtensionModule = { exports: {} };
vm.runInNewContext(compiledRawExtensions, { exports: rawExtensionModule.exports, module: rawExtensionModule, require }, { filename: "richTextExtensions.cjs" });
const {
  InlineCode,
  insertUnmarkedSpaceAfterInlineCode,
  LegacyTaskMarker,
  LegacyTaskMarkerListItem,
  rawMarkdownExtensions,
  SafeLink
} = rawExtensionModule.exports;

const extensions = [
  Blockquote,
  Bold,
  BulletList,
  InlineCode,
  CodeBlock,
  Document,
  HardBreak,
  Heading.configure({ levels: [1, 2, 3] }),
  Italic,
  LegacyTaskMarker,
  SafeLink.configure({ autolink: true, openOnClick: false, protocols: ["http", "https", "mailto"] }),
  LegacyTaskMarkerListItem,
  OrderedList,
  Paragraph,
  Strike,
  Text,
  ...rawMarkdownExtensions,
  Markdown
];

function createMarkdownEditor(content) {
  return new Editor({ content, contentType: "markdown", extensions });
}

const supportedSource = [
  "## 中文标题",
  "",
  "**粗体**、*斜体*、~~删除线~~ 与 `code`",
  "",
  "- 项目",
  "  - 嵌套项目",
  "",
  "1. 编号项目",
  "",
  "> 引用",
  "",
  "```ts",
  "const value = 1;",
  "```",
  "",
  "[安全链接](https://example.com)"
].join("\n");

const editor = createMarkdownEditor(supportedSource);

const serialized = editor.getMarkdown();
assert.match(serialized, /^## 中文标题/m);
assert.match(serialized, /\*\*粗体\*\*/);
assert.match(serialized, /~~删除线~~/);
assert.match(serialized, /- 项目/);
assert.match(serialized, /  - 嵌套项目/);
assert.match(serialized, /1\. 编号项目/);
assert.match(serialized, /> 引用/);
assert.match(serialized, /```ts\nconst value = 1;\n```/);
assert.match(serialized, /\[安全链接\]\(https:\/\/example\.com\)/);
editor.destroy();

const legacyTaskMarkerSource = [
  "- [ ] 未完成",
  "  - [x] 嵌套完成",
  "- [x] 已完成",
  "- [X] 大写标记",
  "- 普通项目"
].join("\n");
const legacyTaskMarkerEditor = createMarkdownEditor(legacyTaskMarkerSource);
assert.equal(
  legacyTaskMarkerEditor.getMarkdown(),
  legacyTaskMarkerSource,
  "legacy task markers must round-trip as ordinary list text"
);
assert.doesNotMatch(JSON.stringify(legacyTaskMarkerEditor.getJSON()), /taskList|taskItem/);
legacyTaskMarkerEditor.destroy();

const markerDomSpec = LegacyTaskMarker.config.renderHTML?.({
  HTMLAttributes: {},
  node: { attrs: { marker: "[x]" } }
});
assert.ok(Array.isArray(markerDomSpec));
assert.equal(`${markerDomSpec.at(-1)}已完成`, "[x] 已完成", "legacy marker DOM text must retain its visible separator");
assert.match(`<span data-legacy-task-marker>${markerDomSpec.at(-1)}</span>已完成`, />\[x\] <\/span>已完成/);

const legacyPlainText = "旧节点正文\n第二行仍然可见";
const legacyEditor = createMarkdownEditor(legacyPlainText);
assert.equal(legacyEditor.state.doc.textContent, legacyPlainText);
legacyEditor.destroy();

const opaqueSource = [
  "#### 原样四级标题",
  "",
  "| A | B |",
  "| --- | --- |",
  "| 1 | 2 |",
  "",
  "---",
  "",
  "![附件语法](./asset.png)",
  "",
  "<custom-element data-value=\"safe\">原样 HTML</custom-element>"
].join("\n");
const opaqueEditor = createMarkdownEditor(opaqueSource);
const opaqueSerialized = opaqueEditor.getMarkdown();
assert.match(opaqueSerialized, /#### 原样四级标题/);
assert.match(opaqueSerialized, /\| A \| B \|/);
assert.match(opaqueSerialized, /^---$/m);
assert.match(opaqueSerialized, /!\[附件语法\]\(\.\/asset\.png\)/);
assert.match(opaqueSerialized, /<custom-element data-value="safe">原样 HTML<\/custom-element>/);
opaqueEditor.destroy();

const unsafeLinkEditor = createMarkdownEditor("[危险链接](javascript:alert(1))");
assert.equal(
  JSON.stringify(unsafeLinkEditor.getJSON()).includes('"type":"link"'),
  false,
  "dangerous protocols must not create clickable link marks"
);
unsafeLinkEditor.destroy();

const inlineCodeExitEditor = createMarkdownEditor("`code`");
inlineCodeExitEditor
  .chain()
  .setTextSelection(5)
  .splitBlock()
  .command(({ tr }) => {
    tr.insertText("普通文字");
    return true;
  })
  .run();
const inlineCodeExitJson = inlineCodeExitEditor.getJSON();
assert.deepEqual(
  inlineCodeExitJson.content?.[1]?.content?.[0]?.marks ?? [],
  [],
  "pressing Enter after inline code must exit the code mark for the next paragraph"
);
assert.match(inlineCodeExitEditor.getMarkdown(), /`code`\n\n普通文字/);
inlineCodeExitEditor.destroy();

const inlineCodeSpaceEditor = createMarkdownEditor("`code`");
inlineCodeSpaceEditor.commands.setTextSelection(5);
assert.equal(insertUnmarkedSpaceAfterInlineCode(inlineCodeSpaceEditor), true);
const inlineCodeSpaceContent = inlineCodeSpaceEditor.getJSON().content?.[0]?.content ?? [];
assert.deepEqual(
  inlineCodeSpaceContent.at(-1)?.marks ?? [],
  [],
  "typing Space at the end of inline code must insert an ordinary unmarked space"
);
inlineCodeSpaceEditor.commands.command(({ tr }) => {
  tr.insertText("plain");
  return true;
});
assert.deepEqual(inlineCodeSpaceEditor.getJSON().content?.[0]?.content?.at(-1)?.marks ?? [], []);
inlineCodeSpaceEditor.destroy();

const inlineCodeInnerSpaceEditor = createMarkdownEditor("`code`");
inlineCodeInnerSpaceEditor.commands.setTextSelection(3);
assert.equal(
  insertUnmarkedSpaceAfterInlineCode(inlineCodeInnerSpaceEditor),
  false,
  "Space inside inline code must remain available as code content"
);
inlineCodeInnerSpaceEditor.destroy();

assert.equal(inlineCodeInputRegexMatch("`code`")?.replaceWith, "code");
assert.equal(inlineCodeInputRegexMatch("'code'"), null, "apostrophes are ordinary text, not Markdown code delimiters");
assert.equal(inlineCodeInputRegexMatch("‘code’"), null, "curly single quotation marks are not Markdown code delimiters");

const taskNodeSource = fs.readFileSync(path.join(pluginRoot, "src", "components", "TaskNode.tsx"), "utf8");
assert.doesNotMatch(taskNodeSource, /extension-task-(?:item|list)|\bTaskItem\b|\bTaskList\b/);
assert.match(taskNodeSource, /LegacyTaskMarkerListItem/);
assert.match(fs.readFileSync(rawExtensionPath, "utf8"), /data-legacy-task-marker/);
assert.match(taskNodeSource, /setContent\(data\.body, \{ contentType: "markdown", emitUpdate: false \}\)/);
assert.match(taskNodeSource, /onUpdate: \(\{ editor \}\) =>/);
assert.match(taskNodeSource, /injectCSS: false/);
assert.match(taskNodeSource, /target\.closest\("a"\)/);
assert.match(taskNodeSource, /event\.preventDefault\(\)/);
assert.match(taskNodeSource, /script,style,img,video,audio,iframe,object,embed/);
assert.match(taskNodeSource, /attribute\.name\.startsWith\("on"\).*attribute\.name === "style"/);
assert.match(taskNodeSource, /clipboardData && \[\.\.\.event\.clipboardData\.files\]\.length > 0/);
assert.match(taskNodeSource, /target\.closest\("pre"\).*event\.stopPropagation\(\)/);
assert.match(taskNodeSource, /event\.key === " ".*insertUnmarkedSpaceAfterInlineCode\(editor\)/);
assert.match(taskNodeSource, /bodyEditorRef\.current = bodyEditor/);
assert.match(
  taskNodeSource,
  /Placeholder\.configure\(\{\s*placeholder:\s*t\("task\.bodyPlaceholder"\),\s*showOnlyWhenEditable:\s*false\s*\}\)/s,
  "empty Task placeholders must remain available while the editor is read-only"
);

const appCssSource = fs.readdirSync(path.join(pluginRoot, "src", "styles"))
  .filter((name) => name.endsWith(".css"))
  .sort()
  .map((name) => fs.readFileSync(path.join(pluginRoot, "src", "styles", name), "utf8"))
  .join("\n");
assert.doesNotMatch(appCssSource, /data-type="task(?:Item|List)"/);
assert.match(
  appCssSource,
  /\.task-body-content code\s*\{[^}]*border:\s*var\(--border-weight-sm\) solid transparent;[^}]*background:\s*var\(--color-background-canvas\);/s,
  "inline code must use a transparent base border and the canvas background token"
);
assert.match(
  appCssSource,
  /:root\[data-theme="dark"\] \.task-body-content code\s*\{[^}]*border-color:\s*var\(--color-border-divider\);/s,
  "dark inline code must reveal the neutral divider border"
);
assert.match(
  appCssSource,
  /\.task-body-content\.ProseMirror-focused p\.is-editor-empty:first-child::before\s*\{[^}]*content:\s*none;/s,
  "the empty Task placeholder must disappear while the body editor is focused"
);
assert.match(
  appCssSource,
  /\.task-body-content pre\s*\{[^}]*border:\s*var\(--border-weight-sm\) solid var\(--color-border-divider\);[^}]*background:\s*var\(--color-background-canvas\);/s,
  "fenced code blocks must keep their single divider border and canvas background"
);
assert.match(
  appCssSource,
  /\.task-body-content pre code\s*\{[^}]*border:\s*0;[^}]*background:\s*transparent;/s,
  "code inside fenced blocks must clear the inline border and inherit one transparent background layer"
);
assert.match(
  appCssSource,
  /\.task-body-raw-markdown\.is-inline\s*\{[^}]*background:\s*var\(--color-background-input\);/s,
  "raw Markdown inline placeholders must keep their separate input-surface semantics"
);
assert.match(
  appCssSource,
  /\.task-body-content > \* \+ pre,[\s\S]*\.task-body-content > pre \+ \*[\s\S]*margin-top: var\(--space-10\)/,
  "code blocks must have explicit separation from adjacent rich-text blocks"
);

const frameworkQuestionsSource = fs.readFileSync(path.join(pluginRoot, "src", "components", "FrameworkQuestionsCard.tsx"), "utf8");
assert.match(frameworkQuestionsSource, /selectionMode === "single" \? "radio" : "checkbox"/);
const checkboxPrimitiveSource = fs.readFileSync(path.join(pluginRoot, "src", "components", "ui", "checkbox.tsx"), "utf8");
assert.match(checkboxPrimitiveSource, /export function Checkbox/);
assert.match(checkboxPrimitiveSource, /kit-checkbox/);
const rightDrawerSource = fs.readFileSync(path.join(pluginRoot, "src", "components", "RightDrawer.tsx"), "utf8");
assert.match(rightDrawerSource, /className="task-list"/);

const packageSource = fs.readFileSync(path.join(pluginRoot, "package.json"), "utf8");
const packageLockSource = fs.readFileSync(path.join(pluginRoot, "package-lock.json"), "utf8");
assert.doesNotMatch(packageSource, /@tiptap\/extension-task-(?:item|list)/);
assert.doesNotMatch(packageLockSource, /@tiptap\/extension-task-(?:item|list)/);

console.log("Rich-text Markdown smoke test passed");
