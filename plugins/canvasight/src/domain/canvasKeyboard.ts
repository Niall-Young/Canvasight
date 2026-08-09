type CanvasDeleteShortcutInput = {
  key: string;
  hasPrimaryModifier: boolean;
  altKey: boolean;
  shiftKey: boolean;
  targetIsEditable: boolean;
  targetIsKeyboardInteractive: boolean;
  targetNodeIsSelected: boolean;
};

export function shouldDeleteCanvasSelection(input: CanvasDeleteShortcutInput): boolean {
  if (input.key !== "Backspace" && input.key !== "Delete") return false;
  if (input.hasPrimaryModifier || input.altKey || input.shiftKey || input.targetIsEditable) return false;
  return !input.targetIsKeyboardInteractive || input.targetNodeIsSelected;
}
