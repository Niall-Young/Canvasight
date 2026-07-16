import assert from "node:assert/strict";
import { build } from "esbuild";
import { pathToFileURL } from "node:url";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const projectRoot = path.resolve(import.meta.dirname, "..");
const tempDirectory = await mkdtemp(path.join(os.tmpdir(), "canvasight-rich-node-"));
const outputFile = path.join(tempDirectory, "rich-node-content.mjs");

try {
  await build({
    entryPoints: [path.join(projectRoot, "src/lib/richNodeContent.ts")],
    bundle: true,
    format: "esm",
    platform: "node",
    outfile: outputFile,
    logLevel: "silent"
  });

  const {
    appendImageAnchors,
    parseRichNodeContent,
    removeImageAnchor,
    resolveBodyImageAnchors,
    serializeRichNodeParts,
    shiftImageAnchorsForReplacement
  } = await import(`${pathToFileURL(outputFile).href}?v=${Date.now()}`);

  const body = [
    "说明 @canvasight 和 $canvasight-agent-team，见 https://example.com/a_(b)。",
    "```ts",
    "const answer = 42;",
    "```",
    "未闭合围栏仍是文本：```js"
  ].join("\n");
  const parts = parseRichNodeContent(body, undefined, []);
  assert.equal(serializeRichNodeParts(parts), body, "semantic parsing must preserve the body byte-for-byte");
  assert.equal(parts.filter((part) => part.type === "code").length, 1, "only closed fences become code blocks");
  const fullWidthFenceBody = ["｀｀｀ts", "const 全角 = true;", "｀｀｀"].join("\n");
  const fullWidthFenceParts = parseRichNodeContent(fullWidthFenceBody, undefined, []);
  assert.equal(
    fullWidthFenceParts.filter((part) => part.type === "code").length,
    1,
    "full-width backticks form a fenced code block"
  );
  assert.equal(
    serializeRichNodeParts(fullWidthFenceParts),
    fullWidthFenceBody,
    "full-width fences preserve the original body text"
  );
  for (const mixedFenceBody of [
    ["```js", "const mixed = true;", "｀｀｀"].join("\n"),
    ["｀｀｀js", "const reversed = true;", "```"].join("\n")
  ]) {
    const mixedFenceParts = parseRichNodeContent(mixedFenceBody, undefined, []);
    assert.equal(
      mixedFenceParts.filter((part) => part.type === "code").length,
      1,
      "ASCII and full-width opening/closing fences form one code block in either direction"
    );
    assert.equal(
      serializeRichNodeParts(mixedFenceParts),
      mixedFenceBody,
      "mixed fences preserve the original body text"
    );
  }
  for (const internallyMixedFence of [
    ["｀`｀js", "const invalidOpening = true;", "```"].join("\n"),
    ["```js", "const invalidClosing = true;", "``｀"].join("\n")
  ]) {
    const internallyMixedParts = parseRichNodeContent(internallyMixedFence, undefined, []);
    assert.equal(
      internallyMixedParts.every((part) => part.type === "text"),
      true,
      "a fence line with internally mixed backticks remains plain text"
    );
    assert.equal(
      serializeRichNodeParts(internallyMixedParts),
      internallyMixedFence,
      "an internally mixed fence preserves the original body text"
    );
  }
  const unclosedFullWidthFence = "｀｀｀swift\nlet value = 1";
  const unclosedFullWidthParts = parseRichNodeContent(unclosedFullWidthFence, undefined, []);
  assert.equal(
    unclosedFullWidthParts.every((part) => part.type === "text"),
    true,
    "an unclosed full-width fence remains plain text"
  );
  assert.equal(
    serializeRichNodeParts(unclosedFullWidthParts),
    unclosedFullWidthFence,
    "an unclosed full-width fence preserves the original body text"
  );
  assert.deepEqual(
    parts.filter((part) => part.type === "mention").map((part) => [part.raw, part.mentionKind]),
    [["@canvasight", "plugin"], ["$canvasight-agent-team", "skill"]]
  );
  assert.equal(parts.find((part) => part.type === "link")?.raw, "https://example.com/a_(b)", "balanced parentheses stay in URLs while punctuation does not");
  assert.equal(
    parseRichNodeContent("价格 $100，能力 $skill_2", undefined, []).filter((part) => part.type === "mention").map((part) => part.raw).join(","),
    "$skill_2",
    "ordinary prices do not become skill mentions"
  );
  const chinesePunctuationLink = parseRichNodeContent("链接 https://example.com/path，后续正文", undefined, []);
  assert.equal(
    chinesePunctuationLink.find((part) => part.type === "link")?.raw,
    "https://example.com/path",
    "Chinese sentence punctuation terminates an automatic URL"
  );

  const images = [
    { id: "image-a", kind: "image", originalName: "a.png" },
    { id: "file-a", kind: "file", originalName: "a.txt" },
    { id: "image-b", kind: "image", originalName: "b.png" }
  ];
  assert.deepEqual(
    resolveBodyImageAnchors("abcd", [{ attachmentId: "image-a", offset: 2 }], images).map(({ attachmentId, offset }) => ({ attachmentId, offset })),
    [{ attachmentId: "image-a", offset: 2 }],
    "only explicitly anchored images enter rich body content"
  );
  assert.equal(
    parseRichNodeContent("abcd", undefined, images).some((part) => part.type === "image"),
    false,
    "legacy unanchored images stay in the attachment surface"
  );
  const nextAnchors = appendImageAnchors([{ attachmentId: "image-a", offset: 1 }], [images[2]], 3, 4);
  assert.deepEqual(nextAnchors, [{ attachmentId: "image-a", offset: 1 }, { attachmentId: "image-b", offset: 3 }]);
  assert.equal(removeImageAnchor(nextAnchors, "image-a")?.[0].attachmentId, "image-b");
  assert.deepEqual(
    shiftImageAnchorsForReplacement(
      [{ attachmentId: "before", offset: 2 }, { attachmentId: "after", offset: 12 }],
      4,
      8,
      10
    ),
    [{ attachmentId: "before", offset: 2 }, { attachmentId: "after", offset: 18 }],
    "picker replacement shifts only anchors after the replaced query"
  );

  const unsafe = parseRichNodeContent("javascript:alert(1) ftp://example.com", undefined, []);
  assert.equal(unsafe.every((part) => part.type === "text"), true, "unsafe and unsupported protocols stay plain text");
  console.log("rich node content smoke passed");
} finally {
  await rm(tempDirectory, { recursive: true, force: true });
}
