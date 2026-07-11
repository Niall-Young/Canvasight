import { strToU8, zipSync } from "fflate";
import type { Attachment } from "../../shared/types";

export interface MarkdownExport {
  bytes: Uint8Array;
  fileName: string;
  mime: string;
}

export interface MarkdownExportOptions {
  attachments: Attachment[];
  loadAttachment: (attachment: Attachment) => Promise<Uint8Array>;
  markdown: string;
  title: string;
}

export function sanitizeDownloadName(value: string, fallback = "scatter-prompt"): string {
  const normalized = value
    .trim()
    .replace(/[\\/:*?"<>|\u0000-\u001F]/g, "-")
    .replace(/\s+/g, " ")
    .replace(/^[. ]+|[. ]+$/g, "");
  return normalized || fallback;
}

function assetFileName(originalName: string, usedNames: Set<string>): string {
  const safeName = sanitizeDownloadName(originalName, "attachment");
  const extensionIndex = safeName.lastIndexOf(".");
  const stem = extensionIndex > 0 ? safeName.slice(0, extensionIndex) : safeName;
  const extension = extensionIndex > 0 ? safeName.slice(extensionIndex) : "";
  let candidate = safeName;
  let serial = 2;
  while (usedNames.has(candidate.toLocaleLowerCase())) {
    candidate = `${stem}-${serial}${extension}`;
    serial += 1;
  }
  usedNames.add(candidate.toLocaleLowerCase());
  return candidate;
}

function archiveMarkdown(markdown: string, assetPaths: Map<string, string>, attachments: Attachment[]): string {
  let result = markdown;
  for (const attachment of attachments) {
    const assetPath = assetPaths.get(attachment.id);
    if (!assetPath) continue;
    if (attachment.storedPath) {
      result = result
        .split("\n")
        .filter((line) => !line.includes(attachment.storedPath))
        .join("\n");
    }
    if (attachment.relativePath) result = result.split(attachment.relativePath).join(assetPath);
  }
  return result;
}

export async function buildMarkdownExport({ attachments, loadAttachment, markdown, title }: MarkdownExportOptions): Promise<MarkdownExport> {
  const baseName = sanitizeDownloadName(title);
  if (!attachments.length) {
    return {
      bytes: strToU8(markdown),
      fileName: `${baseName}.md`,
      mime: "text/markdown;charset=utf-8"
    };
  }

  const usedNames = new Set<string>();
  const assetPaths = new Map<string, string>();
  const files: Record<string, Uint8Array> = {};
  for (const attachment of attachments) {
    const assetPath = `assets/${assetFileName(attachment.originalName, usedNames)}`;
    assetPaths.set(attachment.id, assetPath);
    files[assetPath] = await loadAttachment(attachment);
  }
  files[`${baseName}.md`] = strToU8(archiveMarkdown(markdown, assetPaths, attachments));

  return {
    bytes: zipSync(files),
    fileName: `${baseName}.zip`,
    mime: "application/zip"
  };
}
