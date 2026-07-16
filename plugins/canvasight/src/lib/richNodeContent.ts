import type { Attachment, BodyImageAnchor } from "../../shared/types";

export type RichNodePart =
  | { type: "text"; raw: string }
  | { type: "code"; raw: string; code: string; language: string }
  | { type: "mention"; raw: string; mentionKind: "plugin" | "skill" }
  | { type: "link"; raw: string; href: string }
  | { type: "image"; raw: ""; attachment: Attachment; offset: number };

const mentionPattern = /(?:@|\$)[\p{L}_][\p{L}\p{N}_.:/-]*/gu;
const linkPattern = /https?:\/\/[^\s<>，。！？；：、]+/gu;
const trailingLinkPunctuation = /[.,!?;:，。！？；：、]+$/u;

function isMentionBoundary(value: string | undefined): boolean {
  return value === undefined || /[\s([{'"“‘，。！？；：、]/u.test(value);
}

function trimLinkCandidate(candidate: string): string {
  let result = candidate.replace(trailingLinkPunctuation, "");
  while (result.endsWith(")") && (result.match(/\)/g)?.length ?? 0) > (result.match(/\(/g)?.length ?? 0)) {
    result = result.slice(0, -1);
  }
  while (result.endsWith("]") && (result.match(/\]/g)?.length ?? 0) > (result.match(/\[/g)?.length ?? 0)) {
    result = result.slice(0, -1);
  }
  return result;
}

function parseInline(value: string): RichNodePart[] {
  const matches: Array<{ start: number; end: number; part: RichNodePart }> = [];

  for (const match of value.matchAll(linkPattern)) {
    const start = match.index;
    const raw = trimLinkCandidate(match[0]);
    if (!raw) continue;
    try {
      const url = new URL(raw);
      if (url.protocol !== "http:" && url.protocol !== "https:") continue;
      matches.push({ start, end: start + raw.length, part: { type: "link", raw, href: url.href } });
    } catch {
      // Invalid URLs intentionally remain editable plain text.
    }
  }

  for (const match of value.matchAll(mentionPattern)) {
    const start = match.index;
    const raw = match[0];
    if (!isMentionBoundary(value[start - 1])) continue;
    matches.push({
      start,
      end: start + raw.length,
      part: { type: "mention", raw, mentionKind: raw.startsWith("$") ? "skill" : "plugin" }
    });
  }

  matches.sort((left, right) => left.start - right.start || right.end - left.end);
  const parts: RichNodePart[] = [];
  let offset = 0;
  for (const match of matches) {
    if (match.start < offset) continue;
    if (match.start > offset) parts.push({ type: "text", raw: value.slice(offset, match.start) });
    parts.push(match.part);
    offset = match.end;
  }
  if (offset < value.length) parts.push({ type: "text", raw: value.slice(offset) });
  return parts;
}

function parseTextAndCode(value: string): RichNodePart[] {
  const parts: RichNodePart[] = [];
  const openingFence = /^```([^\n`]*)\r?\n/gmu;
  let offset = 0;

  while (offset < value.length) {
    openingFence.lastIndex = offset;
    const opening = openingFence.exec(value);
    if (!opening) {
      parts.push(...parseInline(value.slice(offset)));
      break;
    }

    if (opening.index > offset) parts.push(...parseInline(value.slice(offset, opening.index)));
    const closingFence = /^```[ \t]*(?:\r?\n|$)/gmu;
    closingFence.lastIndex = openingFence.lastIndex;
    const closing = closingFence.exec(value);
    if (!closing) {
      parts.push(...parseInline(value.slice(opening.index)));
      break;
    }

    const raw = value.slice(opening.index, closingFence.lastIndex);
    let code = value.slice(openingFence.lastIndex, closing.index);
    if (code.endsWith("\r\n")) code = code.slice(0, -2);
    else if (code.endsWith("\n")) code = code.slice(0, -1);
    parts.push({ type: "code", raw, code, language: opening[1].trim() });
    offset = closingFence.lastIndex;
  }

  return parts;
}

export function resolveBodyImageAnchors(
  body: string,
  anchors: BodyImageAnchor[] | undefined,
  attachments: Attachment[]
): Array<BodyImageAnchor & { attachment: Attachment }> {
  const images = attachments.filter((attachment) => attachment.kind === "image");
  const imageById = new Map(images.map((attachment) => [attachment.id, attachment]));
  const seen = new Set<string>();
  const resolved: Array<BodyImageAnchor & { attachment: Attachment; order: number }> = [];

  for (const [order, anchor] of (anchors ?? []).entries()) {
    const attachment = imageById.get(anchor.attachmentId);
    if (!attachment || seen.has(anchor.attachmentId) || !Number.isFinite(anchor.offset)) continue;
    seen.add(anchor.attachmentId);
    resolved.push({
      attachmentId: anchor.attachmentId,
      offset: Math.max(0, Math.min(body.length, Math.trunc(anchor.offset))),
      attachment,
      order
    });
  }

  return resolved
    .sort((left, right) => left.offset - right.offset || left.order - right.order)
    .map(({ order: _order, ...anchor }) => anchor);
}

export function parseRichNodeContent(
  body: string,
  anchors: BodyImageAnchor[] | undefined,
  attachments: Attachment[]
): RichNodePart[] {
  const parts: RichNodePart[] = [];
  const resolvedAnchors = resolveBodyImageAnchors(body, anchors, attachments);
  let offset = 0;
  for (const anchor of resolvedAnchors) {
    if (anchor.offset > offset) parts.push(...parseTextAndCode(body.slice(offset, anchor.offset)));
    parts.push({ type: "image", raw: "", attachment: anchor.attachment, offset: anchor.offset });
    offset = anchor.offset;
  }
  if (offset < body.length) parts.push(...parseTextAndCode(body.slice(offset)));
  if (!body.length && !resolvedAnchors.length) return [];
  return parts;
}

export function serializeRichNodeParts(parts: RichNodePart[]): string {
  return parts.map((part) => part.raw).join("");
}

export function richNodeSemanticSignature(
  body: string,
  anchors: BodyImageAnchor[] | undefined,
  attachments: Attachment[]
): string {
  return parseRichNodeContent(body, anchors, attachments)
    .map((part) => part.type === "image" ? `image:${part.attachment.id}` : part.type)
    .join("|");
}

export function appendImageAnchors(
  current: BodyImageAnchor[] | undefined,
  attachments: Attachment[],
  offset: number | undefined,
  bodyLength: number
): BodyImageAnchor[] | undefined {
  const imageAttachments = attachments.filter((attachment) => attachment.kind === "image");
  if (!imageAttachments.length) return current;
  const insertionOffset = Number.isFinite(offset) ? Math.max(0, Math.min(bodyLength, Math.trunc(offset as number))) : bodyLength;
  return [
    ...(current ?? []).map((anchor) => ({ ...anchor })),
    ...imageAttachments.map((attachment) => ({ attachmentId: attachment.id, offset: insertionOffset }))
  ];
}

export function removeImageAnchor(current: BodyImageAnchor[] | undefined, attachmentId: string): BodyImageAnchor[] | undefined {
  if (!current) return undefined;
  const next = current.filter((anchor) => anchor.attachmentId !== attachmentId);
  return next.length ? next : undefined;
}

export function shiftImageAnchorsForReplacement(
  current: BodyImageAnchor[] | undefined,
  start: number,
  end: number,
  replacementLength: number
): BodyImageAnchor[] | undefined {
  if (!current?.length) return current;
  const safeStart = Math.max(0, Math.trunc(start));
  const safeEnd = Math.max(safeStart, Math.trunc(end));
  const safeReplacementLength = Math.max(0, Math.trunc(replacementLength));
  const delta = safeReplacementLength - (safeEnd - safeStart);
  return current.map((anchor) => {
    if (anchor.offset <= safeStart) return { ...anchor };
    if (anchor.offset >= safeEnd) return { ...anchor, offset: Math.max(0, anchor.offset + delta) };
    return { ...anchor, offset: safeStart + safeReplacementLength };
  });
}
