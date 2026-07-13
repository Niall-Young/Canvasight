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
  nodeRect: SkillPickerRect;
  pickerHeight: number;
  pickerWidth: number;
  viewportHeight: number;
  viewportWidth: number;
  gap?: number;
  padding?: number;
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(value, minimum), Math.max(minimum, maximum));
}

export function placeSkillPicker({
  anchorRect,
  nodeRect,
  pickerHeight,
  pickerWidth,
  viewportHeight,
  viewportWidth,
  gap = 10,
  padding = 12
}: SkillPickerPlacementInput): SkillPickerPosition {
  const roomRight = viewportWidth - nodeRect.right - gap - padding;
  const roomLeft = nodeRect.left - gap - padding;
  const maximumTop = viewportHeight - padding - pickerHeight;

  if (roomRight >= pickerWidth || roomRight >= roomLeft && roomRight >= pickerWidth * 0.72) {
    return {
      left: clamp(nodeRect.right + gap, padding, viewportWidth - padding - pickerWidth),
      placement: "right",
      top: clamp(anchorRect.top, padding, maximumTop)
    };
  }

  if (roomLeft >= pickerWidth || roomLeft > roomRight && roomLeft >= pickerWidth * 0.72) {
    return {
      left: clamp(nodeRect.left - gap - pickerWidth, padding, viewportWidth - padding - pickerWidth),
      placement: "left",
      top: clamp(anchorRect.top, padding, maximumTop)
    };
  }

  const roomBelow = viewportHeight - nodeRect.bottom - gap - padding;
  const roomAbove = nodeRect.top - gap - padding;
  const placeBelow = roomBelow >= pickerHeight || roomBelow >= roomAbove;
  return {
    left: clamp(anchorRect.left, padding, viewportWidth - padding - pickerWidth),
    placement: placeBelow ? "below" : "above",
    top: placeBelow
      ? clamp(nodeRect.bottom + gap, padding, maximumTop)
      : clamp(nodeRect.top - gap - pickerHeight, padding, maximumTop)
  };
}
