import type { HTMLAttributes, ReactElement, ReactPortal } from "react";
import { createPortal } from "react-dom";
import { useI18n } from "../../lib/i18n";
import { cn } from "../../lib/utils";
import { Icon } from "./icon";

export type ToastTone = "information" | "loading" | "negative" | "positive";

interface ToastProps extends HTMLAttributes<HTMLDivElement> {
  actionLabel?: string;
  message: string;
  onAction?: () => void;
  tone?: ToastTone;
  onClose?: () => void;
}

function toastIcon(tone: ToastTone): ReactElement {
  if (tone === "loading") return <span className="kit-spinner" aria-hidden="true" />;
  const icon = tone === "negative" ? "exclamation-mark-circle" : tone === "positive" ? "check-circle" : "info-circle";
  return <Icon name={icon} size={20} className="kit-toast-icon" />;
}

export function Toast({ actionLabel, className, message, onAction, onClose, tone = "information", ...props }: ToastProps): ReactElement {
  const { t } = useI18n();

  return (
    <div className={cn("kit-toast", `kit-toast-${tone}`, className)} role="status" {...props}>
      {toastIcon(tone)}
      <span className="kit-toast-message">{message}</span>
      {actionLabel && onAction ? (
        <button className="kit-toast-action" type="button" onClick={onAction}>
          {actionLabel}
        </button>
      ) : null}
      <button className="kit-toast-close" type="button" aria-label={t("toast.close")} onClick={onClose}>
        <Icon name="x" size={16} />
      </button>
    </div>
  );
}

export function ToastViewport({ className, ...props }: HTMLAttributes<HTMLDivElement>): ReactPortal {
  return createPortal(<div className={cn("kit-toast-viewport", className)} {...props} />, document.body);
}
