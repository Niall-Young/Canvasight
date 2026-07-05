import { useEffect, useId, useRef, type ReactElement } from "react";
import * as RadixDialog from "@radix-ui/react-dialog";
import { IconButton } from "./ui/icon-button";
import { KitButton } from "./ui/kit-button";

interface ConfirmDialogProps {
  cancelLabel: string;
  closeLabel: string;
  confirmLabel: string;
  description: string;
  onConfirm: () => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  title: string;
}

export function ConfirmDialog({
  cancelLabel,
  closeLabel,
  confirmLabel,
  description,
  onConfirm,
  onOpenChange,
  open,
  title
}: ConfirmDialogProps): ReactElement {
  const descriptionId = useId();
  const cancelButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const animationFrame = window.requestAnimationFrame(() => cancelButtonRef.current?.focus());
    const timeout = window.setTimeout(() => cancelButtonRef.current?.focus(), 80);
    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.clearTimeout(timeout);
    };
  }, [open]);

  return (
    <RadixDialog.Root modal open={open} onOpenChange={onOpenChange}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="confirm-dialog-overlay" />
        <RadixDialog.Content
          className="confirm-dialog-content"
          aria-describedby={descriptionId}
          onInteractOutside={(event) => event.preventDefault()}
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            cancelButtonRef.current?.focus();
          }}
        >
          <header className="confirm-dialog-header">
            <RadixDialog.Title className="confirm-dialog-title">{title}</RadixDialog.Title>
            <RadixDialog.Close asChild>
              <IconButton className="confirm-dialog-close" filled={false} icon="x" size="sm" aria-label={closeLabel} />
            </RadixDialog.Close>
          </header>
          <RadixDialog.Description id={descriptionId} className="confirm-dialog-description">
            {description}
          </RadixDialog.Description>
          <footer className="confirm-dialog-footer">
            <RadixDialog.Close asChild>
              <KitButton ref={cancelButtonRef} className="confirm-dialog-cancel" filled={false} size="md">
                {cancelLabel}
              </KitButton>
            </RadixDialog.Close>
            <KitButton alert filled size="md" onClick={onConfirm}>
              {confirmLabel}
            </KitButton>
          </footer>
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}
