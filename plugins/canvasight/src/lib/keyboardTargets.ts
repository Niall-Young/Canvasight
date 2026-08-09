export function isEditableTarget(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    (target instanceof HTMLElement && target.isContentEditable)
  );
}

export function isKeyboardInteractiveTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  return Boolean(
    target.closest("button, a[href], input, textarea, select, summary, video[controls], audio[controls], [contenteditable='true'], [role='button'], [role='checkbox'], [role='radio'], [role='switch'], [role='slider'], [role='menuitem'], [role='option'], [role='tab']")
  );
}
