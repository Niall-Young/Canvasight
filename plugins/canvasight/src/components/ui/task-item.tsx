import type { HTMLAttributes, KeyboardEvent, MouseEvent, ReactElement } from "react";
import { useI18n } from "../../lib/i18n";
import { cn } from "../../lib/utils";
import { Icon } from "./icon";
import { TooltipAnchor } from "./tooltip";

interface TaskItemProps extends HTMLAttributes<HTMLDivElement> {
  canRun?: boolean;
  flow?: boolean;
  meta?: string;
  nodeCount?: number;
  onLocate?: () => void;
  onPlay?: () => void;
  taskName: string;
}

export function TaskItem({
  canRun = true,
  className,
  flow = false,
  meta,
  nodeCount = 3,
  onLocate,
  onPlay,
  taskName,
  onClick,
  onKeyDown,
  ...props
}: TaskItemProps): ReactElement {
  const { t } = useI18n();

  function handleAction(event: MouseEvent<HTMLButtonElement>, action?: () => void, disabled = false): void {
    event.stopPropagation();
    if (disabled) return;
    action?.();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>): void {
    onKeyDown?.(event);
    if (event.defaultPrevented) return;
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    event.currentTarget.click();
  }

  return (
    <div className={cn("kit-task-item", className)} role="button" tabIndex={0} onClick={onClick} onKeyDown={handleKeyDown} {...props}>
      <span className="kit-task-item-leading">
        <Icon name={flow ? "add-sources" : "connect-apps"} size={16} />
      </span>
      <span className="kit-task-item-content">
        <span className="kit-task-item-name">{taskName}</span>
        <span className="kit-task-item-meta">{meta || (flow ? t("drawer.nodeCount", { count: nodeCount }) : t("drawer.canSend"))}</span>
      </span>
      <span className="kit-task-item-actions">
        <TooltipAnchor label={t("topbar.runCurrentTask")}>
          <button
            className={cn("kit-task-item-action", !canRun && "is-disabled")}
            aria-disabled={!canRun}
            aria-label={t("topbar.runCurrentTask")}
            type="button"
            onClick={(event) => handleAction(event, onPlay, !canRun)}
          >
            <Icon name="play" size={16} />
          </button>
        </TooltipAnchor>
        <TooltipAnchor label={t("canvas.fit")} align="end">
          <button className="kit-task-item-action" type="button" aria-label={t("canvas.fit")} onClick={(event) => handleAction(event, onLocate)}>
            <Icon name="map-pin" size={16} />
          </button>
        </TooltipAnchor>
      </span>
    </div>
  );
}
