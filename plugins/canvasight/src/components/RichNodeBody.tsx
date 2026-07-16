import { forwardRef, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState, type HTMLAttributes, type ReactElement } from "react";
import type { Attachment, BodyImageAnchor } from "../../shared/types";
import { loadCanvasightImageAsset } from "../lib/canvasightApi";
import { parseRichNodeContent, richNodeSemanticSignature, type RichNodePart } from "../lib/richNodeContent";
import { Icon } from "./ui/icon";

export interface RichNodeBodyValue {
  body: string;
  bodyImageAnchors: BodyImageAnchor[] | undefined;
}

interface RichNodeBodyProps extends Omit<HTMLAttributes<HTMLDivElement>, "children" | "onInput"> {
  assetBaseUrl: string;
  attachments: Attachment[];
  body: string;
  bodyImageAnchors?: BodyImageAnchor[];
  editing: boolean;
  onInput?: HTMLAttributes<HTMLDivElement>["onInput"];
  onRemoveAttachment: (attachmentId: string) => void;
  placeholder: string;
}

function partClass(part: RichNodePart): string {
  if (part.type === "mention") return `rich-node-mention is-${part.mentionKind}`;
  if (part.type === "link") return "rich-node-link nodrag";
  return "rich-node-text";
}

function InlineNodeImage({ attachment, assetBaseUrl }: { attachment: Attachment; assetBaseUrl: string }): ReactElement {
  const [src, setSrc] = useState("");
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let current = true;
    setStatus("loading");
    setSrc("");
    void loadCanvasightImageAsset(attachment.fileUrl, attachment.storedPath, assetBaseUrl)
      .then((nextSrc) => {
        if (!current) return;
        setSrc(nextSrc);
        setStatus("ready");
      })
      .catch(() => {
        if (!current) return;
        setStatus("error");
      });
    return () => { current = false; };
  }, [assetBaseUrl, attachment.fileUrl, attachment.storedPath, retryKey]);

  return (
    <figure className={`rich-node-image nodrag ${status === "error" ? "is-error" : ""}`}>
      {status === "ready" ? <img src={src} alt={attachment.originalName} /> : (
        <div
          className={`rich-node-image-placeholder ${status === "loading" ? "is-loading" : ""}`}
          role={status === "error" ? "group" : undefined}
          aria-label={status === "error" ? `Image unavailable: ${attachment.originalName}` : undefined}
        >
          {status === "error" ? (
            <>
              <Icon name="warning" size={18} />
              <button
                type="button"
                className="rich-node-image-retry nodrag"
                aria-label={`Retry ${attachment.originalName}`}
                onPointerDown={(event) => event.stopPropagation()}
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  setRetryKey((current) => current + 1);
                }}
              >
                Retry
              </button>
            </>
          ) : null}
        </div>
      )}
      <figcaption>
        <span>{attachment.originalName}</span>
      </figcaption>
    </figure>
  );
}

function renderReadPart(part: RichNodePart, index: number, assetBaseUrl: string): ReactElement {
  if (part.type === "image") {
    return <InlineNodeImage key={`image-${part.attachment.id}`} attachment={part.attachment} assetBaseUrl={assetBaseUrl} />;
  }
  if (part.type === "code") {
    return (
      <pre className="rich-node-code" key={`code-${index}`}>
        {part.language ? <span className="rich-node-code-language">{part.language}</span> : null}
        <code>{part.code}</code>
      </pre>
    );
  }
  if (part.type === "link") {
    return <a className={partClass(part)} href={part.href} key={`link-${index}`} target="_blank" rel="noreferrer noopener" onPointerDown={(event) => event.stopPropagation()}>{part.raw}</a>;
  }
  return <span className={partClass(part)} key={`${part.type}-${index}`}>{part.raw}</span>;
}

function setPartRange(element: HTMLElement, start: number, end: number): void {
  element.dataset.richStart = String(start);
  element.dataset.richEnd = String(end);
}

function createEditorPart(part: RichNodePart, start: number): HTMLElement | Text {
  if (part.type === "image") {
    const figure = document.createElement("figure");
    figure.className = "rich-node-image nodrag";
    figure.contentEditable = "false";
    figure.dataset.richImageId = part.attachment.id;
    setPartRange(figure, start, start);
    const placeholder = document.createElement("div");
    placeholder.className = "rich-node-image-placeholder is-loading";
    const retry = document.createElement("button");
    retry.type = "button";
    retry.className = "rich-node-image-retry nodrag";
    retry.dataset.richImageRetry = part.attachment.id;
    retry.setAttribute("aria-label", `Retry ${part.attachment.originalName}`);
    retry.textContent = "Retry";
    retry.hidden = true;
    placeholder.append(retry);
    const image = document.createElement("img");
    image.alt = part.attachment.originalName;
    image.hidden = true;
    image.dataset.richImageAsset = part.attachment.id;
    const caption = document.createElement("figcaption");
    const label = document.createElement("span");
    label.textContent = part.attachment.originalName;
    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "rich-node-image-remove nodrag";
    remove.dataset.richImageRemove = part.attachment.id;
    remove.setAttribute("aria-label", `Remove ${part.attachment.originalName}`);
    remove.textContent = "×";
    caption.append(label, remove);
    figure.append(placeholder, image, caption);
    return figure;
  }
  if (part.type === "code") {
    const pre = document.createElement("pre");
    pre.className = "rich-node-code";
    pre.dataset.richCode = "true";
    pre.dataset.richLanguage = part.language;
    pre.dataset.richOriginalRaw = part.raw;
    pre.dataset.richOriginalCode = part.code;
    setPartRange(pre, start, start + part.raw.length);
    const openingLength = part.raw.indexOf("\n") + 1;
    pre.dataset.richCodeStart = String(start + Math.max(0, openingLength));
    if (part.language) {
      const language = document.createElement("span");
      language.className = "rich-node-code-language";
      language.contentEditable = "false";
      language.textContent = part.language;
      pre.append(language);
    }
    const code = document.createElement("code");
    code.textContent = part.code;
    pre.append(code);
    return pre;
  }
  const element = document.createElement(part.type === "link" ? "a" : "span");
  element.className = partClass(part);
  setPartRange(element, start, start + part.raw.length);
  element.textContent = part.raw;
  if (part.type === "link") {
    element.setAttribute("href", part.href);
    element.setAttribute("target", "_blank");
    element.setAttribute("rel", "noreferrer noopener");
  }
  return element;
}

export function renderRichNodeEditor(root: HTMLDivElement, body: string, anchors: BodyImageAnchor[] | undefined, attachments: Attachment[]): void {
  root.replaceChildren();
  let bodyOffset = 0;
  for (const part of parseRichNodeContent(body, anchors, attachments)) {
    root.append(createEditorPart(part, bodyOffset));
    bodyOffset += part.raw.length;
  }
  root.dataset.richBodyValue = body;
  root.dataset.richAnchorsValue = JSON.stringify(anchors ?? []);
  root.dataset.richSemanticSignature = richNodeSemanticSignature(body, anchors, attachments);
  root.dataset.richSelectionOffset = String(body.length);
}

async function hydrateEditorImages(root: HTMLDivElement, attachments: Attachment[], assetBaseUrl: string): Promise<void> {
  const imageById = new Map(attachments.map((attachment) => [attachment.id, attachment]));
  await Promise.all(Array.from(root.querySelectorAll<HTMLImageElement>("img[data-rich-image-asset]")).map(async (image) => {
    const attachment = imageById.get(image.dataset.richImageAsset ?? "");
    if (!attachment) return;
    const figure = image.closest<HTMLElement>(".rich-node-image");
    const placeholder = figure?.querySelector<HTMLElement>(".rich-node-image-placeholder");
    const retry = placeholder?.querySelector<HTMLButtonElement>("[data-rich-image-retry]");
    figure?.classList.remove("is-error");
    placeholder?.classList.add("is-loading");
    placeholder?.removeAttribute("role");
    placeholder?.removeAttribute("aria-label");
    if (retry) retry.hidden = true;
    image.hidden = true;
    try {
      image.src = await loadCanvasightImageAsset(attachment.fileUrl, attachment.storedPath, assetBaseUrl);
      image.hidden = false;
      placeholder?.remove();
    } catch {
      figure?.classList.add("is-error");
      placeholder?.classList.remove("is-loading");
      placeholder?.setAttribute("role", "group");
      placeholder?.setAttribute("aria-label", `Image unavailable: ${attachment.originalName}`);
      if (retry) retry.hidden = false;
    }
  }));
}

function serializeChildren(container: ParentNode, result: { body: string; anchors: BodyImageAnchor[] }): void {
  const children = Array.from(container.childNodes);
  children.forEach((node, index) => {
    if (node.nodeType === Node.TEXT_NODE) {
      result.body += node.textContent ?? "";
      return;
    }
    if (!(node instanceof HTMLElement)) return;
    const imageId = node.dataset.richImageId;
    if (imageId) {
      result.anchors.push({ attachmentId: imageId, offset: result.body.length });
      return;
    }
    if (node.dataset.richCode === "true") {
      const code = node.querySelector("code")?.textContent ?? "";
      const originalCode = node.dataset.richOriginalCode ?? "";
      const originalRaw = node.dataset.richOriginalRaw;
      result.body += originalRaw !== undefined && code === originalCode
        ? originalRaw
        : `\`\`\`${node.dataset.richLanguage ?? ""}\n${code}\n\`\`\``;
      return;
    }
    if (node.tagName === "BR") {
      result.body += "\n";
      return;
    }
    if (node.tagName === "DIV" || node.tagName === "P") {
      if (index > 0 && !result.body.endsWith("\n")) result.body += "\n";
      if (node.childNodes.length === 1 && node.firstChild instanceof HTMLBRElement) {
        if (!result.body.endsWith("\n")) result.body += "\n";
        return;
      }
    }
    serializeChildren(node, result);
  });
}

export function serializeRichNodeEditor(root: ParentNode): RichNodeBodyValue {
  const result: { body: string; anchors: BodyImageAnchor[] } = { body: "", anchors: [] };
  serializeChildren(root, result);
  return { body: result.body, bodyImageAnchors: result.anchors.length ? result.anchors : undefined };
}

export function getRichNodeSelectionOffset(root: HTMLDivElement): number | null {
  const selection = window.getSelection();
  if (!selection?.rangeCount || !selection.focusNode || !root.contains(selection.focusNode)) return null;
  const range = document.createRange();
  range.selectNodeContents(root);
  range.setEnd(selection.focusNode, selection.focusOffset);
  const fragmentRoot = document.createElement("div");
  fragmentRoot.append(range.cloneContents());
  return serializeRichNodeEditor(fragmentRoot).body.length;
}

export function setRichNodeSelectionOffset(root: HTMLDivElement, requestedOffset: number): void {
  const offset = Math.max(0, requestedOffset);
  const elements = Array.from(root.querySelectorAll<HTMLElement>("[data-rich-start]"));
  let fallback: { node: Node; offset: number } | null = null;
  for (const element of elements) {
    const start = Number(element.dataset.richStart ?? 0);
    const end = Number(element.dataset.richEnd ?? start);
    if (element.dataset.richImageId) continue;
    const textContainer = element.dataset.richCode === "true" ? element.querySelector("code") : element;
    const textNode = textContainer?.firstChild;
    if (!textNode) continue;
    const visibleStart = element.dataset.richCode === "true" ? Number(element.dataset.richCodeStart ?? start) : start;
    fallback = { node: textNode, offset: textNode.textContent?.length ?? 0 };
    if (offset < start || offset > end) continue;
    const localOffset = Math.max(0, Math.min(textNode.textContent?.length ?? 0, offset - visibleStart));
    const range = document.createRange();
    range.setStart(textNode, localOffset);
    range.collapse(true);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
    root.dataset.richSelectionOffset = String(offset);
    return;
  }
  if (!fallback) {
    root.focus();
    return;
  }
  const range = document.createRange();
  range.setStart(fallback.node, fallback.offset);
  range.collapse(true);
  const selection = window.getSelection();
  selection?.removeAllRanges();
  selection?.addRange(range);
  root.dataset.richSelectionOffset = String(offset);
}

export function measureRichNodeCaretRect(root: HTMLDivElement): DOMRect | null {
  const selection = window.getSelection();
  if (!selection?.rangeCount || !selection.focusNode || !root.contains(selection.focusNode)) return null;
  const range = selection.getRangeAt(0).cloneRange();
  range.collapse(false);
  const rect = range.getClientRects()[0] ?? range.getBoundingClientRect();
  if (rect.width || rect.height) return rect;
  return root.getBoundingClientRect();
}

export const RichNodeBody = forwardRef<HTMLDivElement, RichNodeBodyProps>(function RichNodeBody(
  { assetBaseUrl, attachments, body, bodyImageAnchors, className, editing, onClick, onPointerDown, onRemoveAttachment, placeholder, ...props },
  forwardedRef
): ReactElement {
  const editorRef = useRef<HTMLDivElement>(null);
  useImperativeHandle(forwardedRef, () => editorRef.current as HTMLDivElement);
  const parts = parseRichNodeContent(body, bodyImageAnchors, attachments);

  useLayoutEffect(() => {
    const root = editorRef.current;
    if (!editing || !root) return;
    const anchorsValue = JSON.stringify(bodyImageAnchors ?? []);
    if (root.dataset.richBodyValue !== body || root.dataset.richAnchorsValue !== anchorsValue) {
      renderRichNodeEditor(root, body, bodyImageAnchors, attachments);
    }
    void hydrateEditorImages(root, attachments, assetBaseUrl);
  }, [assetBaseUrl, attachments, body, bodyImageAnchors, editing]);

  if (editing) {
    return (
      <div
        {...props}
        key="rich-node-editor"
        ref={editorRef}
        className={className}
        contentEditable
        data-rich-body-editor="true"
        onPointerDown={(event) => {
          const target = event.target instanceof Element ? event.target : null;
          if (target?.closest("[data-rich-image-remove], [data-rich-image-retry]")) event.preventDefault();
          onPointerDown?.(event);
        }}
        onClick={(event) => {
          const target = event.target instanceof Element ? event.target : null;
          const retryId = target?.closest<HTMLElement>("[data-rich-image-retry]")?.dataset.richImageRetry;
          if (retryId) {
            event.preventDefault();
            event.stopPropagation();
            if (editorRef.current) void hydrateEditorImages(editorRef.current, attachments, assetBaseUrl);
            return;
          }
          const removeId = target?.closest<HTMLElement>("[data-rich-image-remove]")?.dataset.richImageRemove;
          if (removeId) {
            event.preventDefault();
            onRemoveAttachment(removeId);
            return;
          }
          if (target?.closest("a")) event.preventDefault();
          onClick?.(event);
        }}
        role="textbox"
        aria-multiline="true"
        suppressContentEditableWarning
      />
    );
  }

  return (
    <div
      {...props}
      key="rich-node-read"
      ref={editorRef}
      className={className}
      data-rich-body-read="true"
      data-empty={!parts.length || undefined}
      onPointerDown={onPointerDown}
      onClick={onClick}
    >
      {parts.length ? parts.map((part, index) => renderReadPart(part, index, assetBaseUrl)) : <span className="rich-node-placeholder">{placeholder}</span>}
    </div>
  );
});
