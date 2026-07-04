import { useLayoutEffect, useRef, useState, type CSSProperties, type HTMLAttributes, type KeyboardEvent, type ReactElement } from "react";
import { useI18n } from "../../lib/i18n";
import { cn } from "../../lib/utils";
import { Icon } from "./icon";

interface UploadChipProps extends HTMLAttributes<HTMLDivElement> {
  fileName: string;
  imageAlt?: string;
  imageSrc?: string;
  kind?: "file" | "image";
  onOpen?: () => void;
  onRemove?: () => void;
}

export function UploadChip({ className, fileName, imageAlt = "", imageSrc, kind = "file", onOpen, onRemove, ...props }: UploadChipProps): ReactElement {
  const { t } = useI18n();
  const rootRef = useRef<HTMLDivElement>(null);
  const [lockedWidth, setLockedWidth] = useState<number | null>(null);

  useLayoutEffect(() => {
    setLockedWidth(null);
    const frame = window.requestAnimationFrame(() => {
      const width = rootRef.current?.offsetWidth;
      if (width) setLockedWidth(width);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [fileName, imageSrc, kind, Boolean(onRemove)]);

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>): void {
    props.onKeyDown?.(event);
    if (event.defaultPrevented || !onOpen) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onOpen();
    }
  }

  const style = {
    ...props.style,
    "--chip-width": lockedWidth ? `${lockedWidth}px` : undefined
  } as CSSProperties;

  return (
    <div
      {...props}
      ref={rootRef}
      className={cn("kit-upload-chip", onOpen && "is-clickable", onRemove && "has-remove", className)}
      role={onOpen ? "button" : props.role}
      style={style}
      tabIndex={onOpen ? 0 : props.tabIndex}
      onClick={(event) => {
        props.onClick?.(event);
        if (!event.defaultPrevented) onOpen?.();
      }}
      onKeyDown={handleKeyDown}
    >
      {kind === "image" ? (
        <span className="kit-upload-chip-thumbnail" aria-hidden="true">
          {imageSrc ? <img alt={imageAlt} src={imageSrc} /> : <span className="kit-upload-chip-thumbnail-empty" />}
        </span>
      ) : (
        <span className="kit-upload-chip-file-icon" aria-hidden="true">
          <Icon name="analyze-data" size={16} />
        </span>
      )}
      <span className="kit-upload-chip-label">{fileName}</span>
      {onRemove ? (
        <button
          className="kit-upload-chip-remove"
          type="button"
          aria-label={t("task.removeAttachment")}
          onClick={(event) => {
            event.stopPropagation();
            onRemove();
          }}
        >
          <Icon name="x-xs" size={16} />
        </button>
      ) : null}
    </div>
  );
}
