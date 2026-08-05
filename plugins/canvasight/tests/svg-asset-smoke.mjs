#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const pluginRoot = path.resolve(import.meta.dirname, "..");
const serverPath = path.join(pluginRoot, "mcp", "server.source.mjs");
const serverSource = fs.readFileSync(serverPath, "utf8");

function extractFunction(name) {
  const start = serverSource.indexOf(`function ${name}(`);
  assert.ok(start >= 0, `Missing ${name}`);
  const bodyStart = serverSource.indexOf("{", start);
  let depth = 0;
  for (let index = bodyStart; index < serverSource.length; index += 1) {
    if (serverSource[index] === "{") depth += 1;
    if (serverSource[index] === "}") depth -= 1;
    if (depth === 0) return serverSource.slice(start, index + 1);
  }
  throw new Error(`Unterminated ${name}`);
}

const source = ["extensionFromName", "mimeFromPath", "attachmentKind", "normalizedAttachmentMime", "normalizeAttachment"].map(extractFunction).join("\n");
const module = { exports: {} };
vm.runInNewContext(`${source}\nmodule.exports = { attachmentKind, normalizedAttachmentMime, normalizeAttachment };`, {
  module,
  exports: module.exports,
  path,
  IMAGE_EXTENSIONS: new Set([".apng", ".avif", ".gif", ".jpg", ".jpeg", ".png", ".svg", ".webp"]),
  crypto: { randomUUID: () => "fixture-id" },
  nowIso: () => "2026-08-05T00:00:00.000Z",
  toNumber: (value, fallback) => Number.isFinite(Number(value)) ? Number(value) : fallback,
  assetUrlForPath: (storedPath) => `/api/asset?path=${encodeURIComponent(storedPath)}`
});

const { attachmentKind, normalizedAttachmentMime, normalizeAttachment } = module.exports;
assert.equal(attachmentKind("diagram.svg", "application/octet-stream"), "image", "new SVG uploads must be image assets even with a generic MIME");
assert.equal(attachmentKind("diagram.bin", "image/svg+xml"), "file", "a spoofed SVG MIME must not promote a non-SVG managed file");
assert.equal(attachmentKind("diagram.bin", "image/svg+xml; charset=utf-8"), "file", "SVG MIME parameters must not bypass managed extension validation");
assert.equal(attachmentKind("pasted-image", "image/png"), "image", "trusted raster MIME classification must remain backward compatible");
assert.equal(normalizedAttachmentMime("diagram.svg", "application/octet-stream"), "image/svg+xml", "managed SVG MIME must be canonicalized by extension");
assert.equal(normalizedAttachmentMime("unsafe.html", "image/svg+xml"), "text/html", "a spoofed SVG MIME must not override a known non-image extension");
assert.equal(normalizedAttachmentMime("unsafe.bin", "image/svg+xml"), "application/octet-stream", "a spoofed SVG MIME on an unknown extension must fail closed");
assert.equal(normalizedAttachmentMime("unsafe.bin", "image/svg+xml; charset=utf-8"), "application/octet-stream", "parameterized SVG MIME on an unknown extension must fail closed");
assert.equal(normalizedAttachmentMime("pasted-image", "image/webp"), "image/webp", "trusted raster MIME must survive extensionless temporary names");
assert.equal(
  normalizeAttachment({
    id: "legacy-svg",
    kind: "file",
    source: "upload",
    originalName: "diagram.svg",
    storedPath: "/project/.scatter/assets/diagram.svg",
    relativePath: ".scatter/assets/diagram.svg",
    mime: "image/svg+xml",
    size: 128,
    createdAt: "2026-08-05T00:00:00.000Z"
  }).kind,
  "image",
  "legacy or AI-authored managed SVG assets must normalize to first-class images"
);
const spoofedManagedSvg = normalizeAttachment({
  kind: "image",
  originalName: "diagram.svg",
  storedPath: "/project/.scatter/assets/actual-file.bin",
  relativePath: ".scatter/assets/actual-file.bin",
  mime: "image/svg+xml"
});
assert.equal(spoofedManagedSvg.kind, "file", "managed storage extension must outrank a spoofed display name");
assert.equal(spoofedManagedSvg.mime, "application/octet-stream", "managed storage extension must outrank a spoofed SVG MIME");

assert.match(serverSource, /"\.svg":\s*"image\/svg\+xml"/u, "managed SVG responses must use image/svg+xml");
assert.match(serverSource, /resourceDomains:\s*\[\.\.\.connectDomains,\s*"data:",\s*"blob:"\]/u, "native widget CSP must allow proxied image data/blob resources");

const apiSource = fs.readFileSync(path.join(pluginRoot, "src", "lib", "canvasightApi.ts"), "utf8");
assert.match(apiSource, /blockedSvgElements = new Set\(\["script", "foreignobject"/u, "SVG previews must remove active embedded document elements");
assert.match(apiSource, /"animate", "animatecolor", "animatemotion", "animatetransform", "set"/u, "SVG previews must remove SMIL elements that can mutate sanitized references");
assert.match(apiSource, /name\.startsWith\("on"\)/u, "SVG previews must remove event-handler attributes");
assert.match(apiSource, /containsUnsafeSvgUrl\(value\)/u, "SVG previews must remove external CSS URL references");
assert.match(apiSource, /return isSvg \? safeSvgDataUrl\(await loadSvgText\(fileUrl\)\) : fileUrl/u, "managed SVG data/blob URLs must not bypass sanitization");

const assetNodeSource = fs.readFileSync(path.join(pluginRoot, "src", "components", "AssetNode.tsx"), "utf8");
assert.match(assetNodeSource, /<img src=\{imageSrc\} alt=\{displayName\}/u, "SVG Asset previews must remain in an inert img context");
assert.doesNotMatch(assetNodeSource, /<(?:object|embed|iframe)\b|dangerouslySetInnerHTML/u, "AssetNode must not render managed SVG as an active document or inline markup");

console.log("SVG Asset smoke test passed");
