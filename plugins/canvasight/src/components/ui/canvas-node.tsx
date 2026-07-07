import { useEffect, useRef, useState, type ChangeEvent, type HTMLAttributes, type ReactElement } from "react";
import type { EffortLevel } from "../../../shared/types";
import { useI18n } from "../../lib/i18n";
import { shortcuts } from "../../lib/shortcuts";
import { effortLabelKey } from "../../lib/translations";
import { cn } from "../../lib/utils";
import { DropdownMenu, DropdownMenuItem } from "./dropdown-menu";
import { DropdownTrigger } from "./dropdown-trigger";
import { IconButton } from "./icon-button";
import { Icon } from "./icon";
import { TooltipAnchor } from "./tooltip";
import { Toggle } from "./toggle";
import { UploadChip } from "./upload-chip";

export interface CanvasNodeUpload {
  fileName: string;
  id: string;
  imageAlt?: string;
  imageSrc?: string;
  kind?: "file" | "image";
  onOpen?: () => void;
  onRemove?: () => void;
}

export type CanvasNodeEffort = EffortLevel;

interface CanvasNodeProps extends HTMLAttributes<HTMLDivElement> {
  effortLabel?: CanvasNodeEffort;
  filled?: boolean;
  heading?: string;
  hover?: boolean;
  onCopy?: () => void;
  onDelete?: () => void;
  onAddInput?: () => void;
  onAddLeft?: () => void;
  onAddRight?: () => void;
  onMenu?: () => void;
  onEffortChange?: (effort: CanvasNodeEffort) => void;
  onPlanModeChange?: (checked: boolean) => void;
  onRun?: () => void;
  onUploadFiles?: (files: FileList) => void;
  planMode?: boolean;
  prompt?: string;
  selected?: boolean;
  unconnected?: boolean;
  uploadAccept?: string;
  uploadMultiple?: boolean;
  uploads?: CanvasNodeUpload[];
}

export function CanvasNode({
  className,
  effortLabel,
  filled = false,
  heading,
  hover = false,
  onCopy,
  onDelete,
  onAddInput,
  onAddLeft,
  onAddRight,
  onEffortChange,
  onMenu,
  onPlanModeChange,
  onRun,
  onUploadFiles,
  planMode = true,
  prompt,
  selected = false,
  unconnected = false,
  uploadAccept,
  uploadMultiple = true,
  uploads = [],
  ...props
}: CanvasNodeProps): ReactElement {
  const { t } = useI18n();
  const hasUploads = uploads.length > 0;
  const rootRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [effortMenuOpen, setEffortMenuOpen] = useState(false);
  const [nodeMenuOpen, setNodeMenuOpen] = useState(false);
  const [localEffort, setLocalEffort] = useState<CanvasNodeEffort>(effortLabel ?? "xhigh");
  const currentEffort = effortLabel ?? localEffort;
  const effortOptions: CanvasNodeEffort[] = ["low", "medium", "high", "xhigh"];

  useEffect(() => {
    if (!effortMenuOpen && !nodeMenuOpen) return;

    function handlePointerDown(event: PointerEvent): void {
      if (event.target instanceof Node && rootRef.current?.contains(event.target)) return;
      setEffortMenuOpen(false);
      setNodeMenuOpen(false);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [effortMenuOpen, nodeMenuOpen]);

  function handleUploadChange(event: ChangeEvent<HTMLInputElement>): void {
    const files = event.currentTarget.files;
    if (files && files.length > 0) {
      onUploadFiles?.(files);
    }
    event.currentTarget.value = "";
  }

  return (
    <div ref={rootRef} className={cn("kit-canvas-node", filled && "is-filled", hover && "is-hover", selected && "is-selected", unconnected && "is-unconnected", className)} {...props}>
      <div className="kit-canvas-node-heading">
        <div className="kit-canvas-node-title">{heading ?? t("task.titlePlaceholder")}</div>
        <div className="kit-canvas-node-heading-actions">
          <TooltipAnchor label={filled ? t("task.run") : t("task.runEmpty")} shortcut={shortcuts.runCurrentTask}>
            <IconButton filled={false} icon="play-1" size="lg" aria-label={filled ? t("task.run") : t("task.runEmpty")} disabled={!filled || !onRun} onClick={onRun} />
          </TooltipAnchor>
          <div className="kit-canvas-node-menu-picker">
            <TooltipAnchor label={t("task.more")}>
              <IconButton
                filled={false}
                icon="dots-horizontal"
                size="lg"
                aria-label={t("task.more")}
                aria-haspopup="menu"
                aria-expanded={nodeMenuOpen}
                onClick={() => {
                  onMenu?.();
                  setNodeMenuOpen((open) => !open);
                }}
              />
            </TooltipAnchor>
            {nodeMenuOpen ? (
              <DropdownMenu className="kit-canvas-node-actions-menu" role="menu">
                <DropdownMenuItem
                  icon="copy"
                  label={t("task.copy")}
                  role="menuitem"
                  onClick={() => {
                    onCopy?.();
                    setNodeMenuOpen(false);
                  }}
                />
                <DropdownMenuItem
                  icon="trash"
                  label={t("task.delete")}
                  role="menuitem"
                  onClick={() => {
                    onDelete?.();
                    setNodeMenuOpen(false);
                  }}
                />
              </DropdownMenu>
            ) : null}
          </div>
        </div>
      </div>

      <div className="kit-canvas-node-body">
        <div className="kit-canvas-node-prompt">{prompt ?? t("task.bodyPlaceholder")}</div>
        {hasUploads ? (
          <div className="kit-canvas-node-uploads">
            {uploads.map((upload) => (
              <UploadChip key={upload.id} {...upload} />
            ))}
          </div>
        ) : null}
        <div className="kit-canvas-node-footer">
          <div className="kit-canvas-node-divider" />
          <div className="kit-canvas-node-footer-row">
            <input ref={fileInputRef} className="kit-canvas-node-file-input" type="file" accept={uploadAccept} multiple={uploadMultiple} tabIndex={-1} onChange={handleUploadChange} />
            <TooltipAnchor label={t("task.uploadAttachment")}>
              <IconButton
                filled={false}
                icon="plus-lg"
                size="lg"
                aria-label={t("task.uploadAttachment")}
                onClick={() => {
                  onAddInput?.();
                  fileInputRef.current?.click();
                }}
              />
            </TooltipAnchor>
            <div className="kit-canvas-node-settings">
              <div className="kit-canvas-node-effort-picker">
                <DropdownTrigger label={t(effortLabelKey(currentEffort))} size="lg" aria-haspopup="menu" aria-expanded={effortMenuOpen} onClick={() => setEffortMenuOpen((open) => !open)} />
                {effortMenuOpen ? (
                  <DropdownMenu className="kit-canvas-node-effort-menu" role="menu">
                    {effortOptions.map((option) => (
                      <DropdownMenuItem
                        key={option}
                        label={t(effortLabelKey(option))}
                        selected={option === currentEffort}
                        role="menuitemradio"
                        aria-checked={option === currentEffort}
                        onClick={() => {
                          setLocalEffort(option);
                          onEffortChange?.(option);
                          setEffortMenuOpen(false);
                        }}
                      />
                    ))}
                  </DropdownMenu>
                ) : null}
              </div>
              <span className="kit-canvas-node-plan-label">{t("task.planMode")}</span>
              <Toggle checked={planMode} onCheckedChange={onPlanModeChange} aria-label={t("task.togglePlanMode")} />
            </div>
          </div>
        </div>
      </div>

      {unconnected ? (
        <button className="kit-canvas-node-side kit-canvas-node-side-left" type="button" aria-label={t("task.connectLeft")} onClick={onAddLeft}>
          <Icon name="plus-lg" size={16} />
        </button>
      ) : null}
      <button className="kit-canvas-node-side kit-canvas-node-side-right" type="button" aria-label={t("task.connectRight")} onClick={onAddRight}>
        <Icon name="plus-lg" size={16} />
      </button>
    </div>
  );
}
