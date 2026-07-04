import type { ButtonHTMLAttributes, DragEventHandler, MouseEvent, ReactElement } from "react";
import { useI18n } from "../../lib/i18n";
import { cn } from "../../lib/utils";
import { Icon } from "./icon";
import { IconButton } from "./icon-button";
import { TooltipAnchor } from "./tooltip";

interface ProjectItemProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  disabled?: boolean;
  dragOver?: boolean;
  draggableItem?: boolean;
  dragging?: boolean;
  onArchive?: () => void;
  onItemDragEnd?: DragEventHandler<HTMLDivElement>;
  onItemDragEnter?: DragEventHandler<HTMLDivElement>;
  onItemDragOver?: DragEventHandler<HTMLDivElement>;
  onItemDragStart?: DragEventHandler<HTMLDivElement>;
  onItemDrop?: DragEventHandler<HTMLDivElement>;
  path: string;
  projectName: string;
  selected?: boolean;
}

export function ProjectItem({
  className,
  disabled = false,
  dragOver = false,
  draggableItem = false,
  dragging = false,
  onArchive,
  onItemDragEnd,
  onItemDragEnter,
  onItemDragOver,
  onItemDragStart,
  onItemDrop,
  path,
  projectName,
  selected = false,
  type = "button",
  ...props
}: ProjectItemProps): ReactElement {
  const { t } = useI18n();

  function handleArchive(event: MouseEvent<HTMLButtonElement>): void {
    event.stopPropagation();
    onArchive?.();
  }

  return (
    <div
      className={cn(
        "kit-project-item",
        selected && "is-selected",
        disabled && "is-disabled",
        draggableItem && !disabled && "is-draggable",
        dragging && "is-dragging",
        dragOver && "is-drag-over",
        className
      )}
      draggable={draggableItem && !disabled}
      onDragEnd={onItemDragEnd}
      onDragEnter={onItemDragEnter}
      onDragOver={onItemDragOver}
      onDragStart={onItemDragStart}
      onDrop={onItemDrop}
    >
      <button className="kit-project-item-main" type={type} disabled={disabled} aria-disabled={disabled} {...props}>
        <span className="kit-project-item-leading">
          <Icon name={selected ? "folder-open" : "folder"} size={16} />
        </span>
        <span className="kit-project-item-content">
          <span className="kit-project-item-name">{projectName}</span>
          <span className="kit-project-item-path">{path}</span>
        </span>
      </button>
      {onArchive ? (
        <TooltipAnchor label={t("projectItem.remove")} side="left">
          <IconButton
            className="kit-project-item-archive"
            filled={false}
            icon="archive"
            size="sm"
            aria-label={t("projectItem.remove")}
            draggable={false}
            onClick={handleArchive}
            onPointerDown={(event) => event.stopPropagation()}
          />
        </TooltipAnchor>
      ) : null}
    </div>
  );
}
