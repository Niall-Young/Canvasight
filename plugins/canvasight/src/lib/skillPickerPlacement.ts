export interface SkillPickerRect {
  bottom: number;
  left: number;
  right: number;
  top: number;
}

export interface SkillPickerPosition {
  left: number;
  placement: "above" | "below" | "left" | "right";
  top: number;
}

interface SkillPickerPlacementInput {
  anchorRect: SkillPickerRect;
  pickerHeight: number;
  pickerWidth: number;
  viewportHeight: number;
  viewportWidth: number;
  gap?: number;
  padding?: number;
}

interface ViewportCaretRectInput {
  caretHeight: number;
  localLeft: number;
  localTop: number;
  scaleX: number;
  scaleY: number;
  scrollLeft: number;
  scrollTop: number;
  textareaLeft: number;
  textareaTop: number;
}

const TEXTAREA_MIRROR_PROPERTIES = [
  "borderBottomWidth",
  "borderLeftWidth",
  "borderRightWidth",
  "borderTopWidth",
  "boxSizing",
  "direction",
  "fontFamily",
  "fontFeatureSettings",
  "fontKerning",
  "fontSize",
  "fontStretch",
  "fontStyle",
  "fontVariant",
  "fontWeight",
  "letterSpacing",
  "lineHeight",
  "paddingBottom",
  "paddingLeft",
  "paddingRight",
  "paddingTop",
  "tabSize",
  "textAlign",
  "textIndent",
  "textTransform",
  "wordSpacing"
] as const;

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(value, minimum), Math.max(minimum, maximum));
}

export function toViewportCaretRect({
  caretHeight,
  localLeft,
  localTop,
  scaleX,
  scaleY,
  scrollLeft,
  scrollTop,
  textareaLeft,
  textareaTop
}: ViewportCaretRectInput): SkillPickerRect {
  const left = textareaLeft + (localLeft - scrollLeft) * scaleX;
  const top = textareaTop + (localTop - scrollTop) * scaleY;
  return {
    bottom: top + caretHeight * scaleY,
    left,
    right: left + Math.max(1, scaleX),
    top
  };
}

/** Measure the collapsed textarea selection in physical viewport coordinates. */
export function measureTextareaCaretRect(textarea: HTMLTextAreaElement): SkillPickerRect | null {
  const selectionStart = textarea.selectionStart;
  const selectionEnd = textarea.selectionEnd;
  if (selectionStart === null || selectionEnd === null || selectionStart !== selectionEnd) return null;

  const textareaRect = textarea.getBoundingClientRect();
  if (!textareaRect.width || !textareaRect.height || !textarea.offsetWidth || !textarea.offsetHeight) return null;

  const computed = window.getComputedStyle(textarea);
  const mirror = document.createElement("div");
  const caret = document.createElement("span");
  mirror.setAttribute("aria-hidden", "true");
  Object.assign(mirror.style, {
    height: `${textarea.offsetHeight}px`,
    left: "0",
    overflow: "hidden",
    position: "fixed",
    top: "0",
    visibility: "hidden",
    whiteSpace: "pre-wrap",
    width: `${textarea.offsetWidth}px`,
    wordBreak: "break-word",
    overflowWrap: "break-word"
  });
  for (const property of TEXTAREA_MIRROR_PROPERTIES) {
    mirror.style[property] = computed[property];
  }

  mirror.textContent = textarea.value.slice(0, selectionStart);
  // A zero-width marker reports the exact insertion point without changing wrapping.
  caret.textContent = "\u200b";
  mirror.append(caret);
  document.body.append(mirror);

  const mirrorRect = mirror.getBoundingClientRect();
  const caretRect = caret.getBoundingClientRect();
  const lineHeight = Number.parseFloat(computed.lineHeight);
  const fontSize = Number.parseFloat(computed.fontSize);
  const result = toViewportCaretRect({
    caretHeight: Number.isFinite(lineHeight) ? lineHeight : Number.isFinite(fontSize) ? fontSize * 1.2 : 16,
    localLeft: caretRect.left - mirrorRect.left,
    localTop: caretRect.top - mirrorRect.top,
    scaleX: textareaRect.width / textarea.offsetWidth,
    scaleY: textareaRect.height / textarea.offsetHeight,
    scrollLeft: textarea.scrollLeft,
    scrollTop: textarea.scrollTop,
    textareaLeft: textareaRect.left,
    textareaTop: textareaRect.top
  });
  mirror.remove();
  return result;
}

export function placeSkillPicker({
  anchorRect,
  pickerHeight,
  pickerWidth,
  viewportHeight,
  viewportWidth,
  gap = 6,
  padding = 8
}: SkillPickerPlacementInput): SkillPickerPosition {
  const room = {
    above: anchorRect.top - gap - padding,
    below: viewportHeight - anchorRect.bottom - gap - padding,
    left: anchorRect.left - gap - padding,
    right: viewportWidth - anchorRect.right - gap - padding
  };
  const fits = {
    above: room.above >= pickerHeight,
    below: room.below >= pickerHeight,
    left: room.left >= pickerWidth,
    right: room.right >= pickerWidth
  };

  let placement: SkillPickerPosition["placement"];
  if (fits.below) placement = "below";
  else if (fits.above) placement = "above";
  else if (fits.right) placement = "right";
  else if (fits.left) placement = "left";
  else {
    placement = (Object.entries(room) as Array<[SkillPickerPosition["placement"], number]>)
      .map(([side, available]) => [side, available / (side === "above" || side === "below" ? pickerHeight : pickerWidth)] as const)
      .sort((left, right) => right[1] - left[1])[0][0];
  }

  const maximumLeft = viewportWidth - padding - pickerWidth;
  const maximumTop = viewportHeight - padding - pickerHeight;
  if (placement === "below") {
    return {
      left: clamp(anchorRect.left, padding, maximumLeft),
      placement,
      top: clamp(anchorRect.bottom + gap, padding, maximumTop)
    };
  }
  if (placement === "above") {
    return {
      left: clamp(anchorRect.left, padding, maximumLeft),
      placement,
      top: clamp(anchorRect.top - gap - pickerHeight, padding, maximumTop)
    };
  }
  if (placement === "right") {
    return {
      left: clamp(anchorRect.right + gap, padding, maximumLeft),
      placement,
      top: clamp(anchorRect.top, padding, maximumTop)
    };
  }
  return {
    left: clamp(anchorRect.left - gap - pickerWidth, padding, maximumLeft),
    placement,
    top: clamp(anchorRect.top, padding, maximumTop)
  };
}
