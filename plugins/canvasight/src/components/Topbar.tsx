import type { ReactElement } from "react";
import type { AppUpdateState } from "../../shared/types";
import { useI18n } from "../lib/i18n";
import { shortcuts } from "../lib/shortcuts";
import { IconButton } from "./ui/icon-button";
import { TooltipAnchor } from "./ui/tooltip";

interface TopbarProps {
  activeDrawer: "tasks" | "markdown" | null;
  canOpenMarkdown: boolean;
  canRun: boolean;
  sidebarCollapsed: boolean;
  updateState: AppUpdateState;
  disabled?: boolean;
  showSidebarControls?: boolean;
  status?: string;
  onCreateProject: () => void;
  onUpdate: () => void;
  onRunActive: () => void;
  onOpenTasks: () => void;
  onOpenMarkdown: () => void;
  onToggleSidebar: () => void;
}

function isUpdateBusy(updateState: AppUpdateState): boolean {
  return updateState.status === "downloading" || updateState.status === "installing";
}

function shouldShowUpdateButton(updateState: AppUpdateState): boolean {
  return updateState.status === "available" || updateState.status === "downloading" || updateState.status === "downloaded" || updateState.status === "installing" || updateState.canInstall;
}

export function Topbar({
  activeDrawer,
  canOpenMarkdown,
  canRun,
  sidebarCollapsed,
  updateState,
  disabled = false,
  showSidebarControls = true,
  status,
  onCreateProject,
  onUpdate,
  onRunActive,
  onOpenTasks,
  onOpenMarkdown,
  onToggleSidebar
}: TopbarProps): ReactElement {
  const { t } = useI18n();
  const updateReady = updateState.canInstall || updateState.status === "downloaded";
  const updateBusy = isUpdateBusy(updateState);
  const updateVisible = shouldShowUpdateButton(updateState);
  const updateLabel = updateReady || updateState.status === "installing" ? t("topbar.restartUpdate") : t("topbar.update");
  const updateTooltip = updateBusy
    ? updateState.status === "installing"
      ? t("topbar.restartingUpdate")
      : t("topbar.loadingUpdate")
    : updateLabel;

  return (
    <header className="topbar" aria-label={t("topbar.windowActions")}>
      <div className="window-drag-region">
        {showSidebarControls && status ? <div className="topbar-status" aria-live="polite">{status}</div> : null}
      </div>
      {showSidebarControls ? (
        <div className="topbar-leading">
          <TooltipAnchor label={sidebarCollapsed ? t("topbar.expandSidebar") : t("topbar.collapseSidebar")} shortcut={shortcuts.toggleSidebar} side="bottom" align="start">
            <IconButton
              className="topbar-icon-button topbar-leading-button"
              filled={false}
              icon={sidebarCollapsed ? "topbar-sidebar" : "topbar-sidebar-expand"}
              size="md"
              aria-label={sidebarCollapsed ? t("topbar.expandSidebar") : t("topbar.collapseSidebar")}
              aria-pressed={sidebarCollapsed}
              onClick={onToggleSidebar}
            />
          </TooltipAnchor>
          {sidebarCollapsed ? (
            <TooltipAnchor label={t("topbar.addProject")} shortcut={shortcuts.addProject} side="bottom" align="start">
              <IconButton className="topbar-icon-button topbar-leading-button" filled={false} icon="topbar-folder-plus" size="md" aria-label={t("topbar.addProject")} onClick={onCreateProject} />
            </TooltipAnchor>
          ) : null}
          {updateVisible ? (
            <TooltipAnchor className="topbar-update-anchor" label={updateTooltip} side="bottom" align="start">
              <button className={`topbar-update-button ${updateBusy ? "is-loading" : ""}`} type="button" aria-label={updateTooltip} disabled={updateBusy} onClick={onUpdate}>
                {updateBusy ? <span className="topbar-update-spinner" aria-hidden="true" /> : <span>{updateLabel}</span>}
              </button>
            </TooltipAnchor>
          ) : null}
        </div>
      ) : null}
      <div className="topbar-actions">
        <TooltipAnchor label={t("topbar.runCurrentTask")} shortcut={shortcuts.runCurrentTask} side="bottom">
          <IconButton className="topbar-icon-button" filled={false} icon="topbar-play" size="lg" aria-label={t("topbar.runCurrentTask")} disabled={!canRun || disabled} onClick={onRunActive} />
        </TooltipAnchor>
        <TooltipAnchor label={t("topbar.taskList")} shortcut={shortcuts.taskList} side="bottom">
          <IconButton
            className={`topbar-icon-button ${activeDrawer === "tasks" ? "is-selected" : ""}`}
            filled={false}
            icon="topbar-list"
            size="lg"
            aria-label={t("topbar.taskList")}
            aria-pressed={activeDrawer === "tasks"}
            disabled={disabled}
            onClick={onOpenTasks}
          />
        </TooltipAnchor>
        <TooltipAnchor label={t("topbar.openMarkdown")} shortcut={shortcuts.openMarkdown} side="bottom" align="end">
          <IconButton
            className={`topbar-icon-button ${activeDrawer === "markdown" ? "is-selected" : ""}`}
            filled={false}
            icon="topbar-sidebar-right-expand"
            size="lg"
            aria-label={t("topbar.openMarkdown")}
            aria-pressed={activeDrawer === "markdown"}
            disabled={!canOpenMarkdown || disabled}
            onClick={onOpenMarkdown}
          />
        </TooltipAnchor>
      </div>
    </header>
  );
}
