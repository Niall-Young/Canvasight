import type { ButtonHTMLAttributes, MouseEvent, ReactElement } from "react";
import { useI18n } from "../../lib/i18n";
import { cn } from "../../lib/utils";
import { Icon } from "./icon";
import { TooltipAnchor } from "./tooltip";

interface TaskItemProps extends ButtonHTMLAttributes<HTMLButtonElement> {
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
  type = "button",
  ...props
}: TaskItemProps): ReactElement {
  const { t } = useI18n();

  function handleAction(event: MouseEvent<HTMLSpanElement>, action?: () => void, disabled = false): void {
    event.stopPropagation();
    if (disabled) return;
    action?.();
  }

  return (
    <button className={cn("kit-task-item", className)} type={type} {...props}>
      <span className="kit-task-item-leading">
        <Icon name={flow ? "add-sources" : "connect-apps"} size={16} />
      </span>
      <span className="kit-task-item-content">
        <span className="kit-task-item-name">{taskName}</span>
        <span className="kit-task-item-meta">{meta || (flow ? t("drawer.nodeCount", { count: nodeCount }) : t("drawer.canSend"))}</span>
      </span>
      <span className="kit-task-item-actions">
        <TooltipAnchor label={t("topbar.runCurrentTask")}>
          <span
            className={cn("kit-task-item-action", !canRun && "is-disabled")}
            role="button"
            tabIndex={-1}
            aria-disabled={!canRun}
            aria-label={t("topbar.runCurrentTask")}
            onClick={(event) => handleAction(event, onPlay, !canRun)}
          >
            <Icon name="play" size={16} />
          </span>
        </TooltipAnchor>
        <TooltipAnchor label={t("canvas.fit")} align="end">
          <span className="kit-task-item-action" role="button" tabIndex={-1} aria-label={t("canvas.fit")} onClick={(event) => handleAction(event, onLocate)}>
            <Icon name="map-pin" size={16} />
          </span>
        </TooltipAnchor>
      </span>
    </button>
  );
}
