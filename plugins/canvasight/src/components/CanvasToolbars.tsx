import { memo, type ReactElement } from "react";
import * as RadixDropdownMenu from "@radix-ui/react-dropdown-menu";
import type { Translate } from "../lib/translations";
import { shortcuts } from "../lib/shortcuts";
import type { DrawerMode } from "../store/scatterStore";
import { DropdownMenu, DropdownMenuItem } from "./ui/dropdown-menu";
import { Icon } from "./ui/icon";
import { IconButton } from "./ui/icon-button";
import { TooltipAnchor } from "./ui/tooltip";

export type CanvasTool = "select" | "pan";

const zoomOptions = [
  { label: "50%", value: 0.5 },
  { label: "75%", value: 0.75 },
  { label: "100%", value: 1 },
  { label: "150%", value: 1.5 },
  { label: "200%", value: 2 }
];

type CanvasRunToolbarProps = {
  canRun: boolean;
  canToggleMarkdown: boolean;
  drawer: DrawerMode | null;
  onRefresh: () => void;
  onRun: () => void;
  onToggleMarkdown: () => void;
  onToggleTasks: () => void;
  onToggleTemplates: () => void;
  refreshingDocument: boolean;
  t: Translate;
};

function CanvasRunToolbarComponent({
  canRun,
  canToggleMarkdown,
  drawer,
  onRefresh,
  onRun,
  onToggleMarkdown,
  onToggleTasks,
  onToggleTemplates,
  refreshingDocument,
  t
}: CanvasRunToolbarProps): ReactElement {
  return (
    <div className="canvas-run-toolbar" aria-label={t("topbar.windowActions")}>
      <TooltipAnchor label={refreshingDocument ? t("canvas.refreshing") : t("canvas.refreshLatest")} side="bottom" align="end">
        <IconButton
          className={`canvas-toolbar-button canvas-refresh-button ${refreshingDocument ? "is-refreshing" : ""}`}
          filled={false}
          icon="arrow-rotate-cw"
          size="lg"
          aria-label={refreshingDocument ? t("canvas.refreshing") : t("canvas.refreshLatest")}
          aria-busy={refreshingDocument}
          disabled={refreshingDocument}
          onClick={onRefresh}
        />
      </TooltipAnchor>
      <span className="canvas-toolbar-divider" aria-hidden />
      <TooltipAnchor label={t("topbar.runCurrentTask")} shortcut={shortcuts.runCurrentTask} side="bottom" align="end">
        <IconButton className="canvas-toolbar-button" filled={false} icon="topbar-play" size="lg" aria-label={t("topbar.runCurrentTask")} disabled={!canRun} onClick={onRun} />
      </TooltipAnchor>
      <TooltipAnchor label={t("topbar.taskList")} shortcut={shortcuts.taskList} side="bottom" align="end">
        <IconButton
          className={`canvas-toolbar-button ${drawer === "tasks" ? "is-selected" : ""}`}
          filled={false}
          icon="topbar-list"
          size="lg"
          aria-label={t("topbar.taskList")}
          aria-pressed={drawer === "tasks"}
          onClick={onToggleTasks}
        />
      </TooltipAnchor>
      <TooltipAnchor label={t("topbar.templates")} shortcut={shortcuts.openTemplates} side="bottom" align="end">
        <IconButton
          className={`canvas-toolbar-button ${drawer === "templates" ? "is-selected" : ""}`}
          filled={false}
          icon="book-bookmark"
          size="lg"
          aria-label={t("topbar.templates")}
          aria-pressed={drawer === "templates"}
          onClick={onToggleTemplates}
        />
      </TooltipAnchor>
      <TooltipAnchor label={t("topbar.openMarkdown")} shortcut={shortcuts.openMarkdown} side="bottom" align="end">
        <IconButton
          className={`canvas-toolbar-button ${drawer === "markdown" ? "is-selected" : ""}`}
          filled={false}
          icon="topbar-sidebar-right-expand"
          size="lg"
          aria-label={t("topbar.openMarkdown")}
          aria-pressed={drawer === "markdown"}
          disabled={!canToggleMarkdown}
          onClick={onToggleMarkdown}
        />
      </TooltipAnchor>
    </div>
  );
}

export const CanvasRunToolbar = memo(CanvasRunToolbarComponent);
CanvasRunToolbar.displayName = "CanvasRunToolbar";

type CanvasActionsToolbarProps = {
  canRedo: boolean;
  canUndo: boolean;
  onFit: () => void;
  onOpenSettings: () => void;
  onRedo: () => void;
  onUndo: () => void;
  t: Translate;
};

function CanvasActionsToolbarComponent({ canRedo, canUndo, onFit, onOpenSettings, onRedo, onUndo, t }: CanvasActionsToolbarProps): ReactElement {
  return (
    <div className="canvas-actions" aria-label={t("canvas.actions")}>
      <TooltipAnchor label={t("canvas.fit")} shortcut={shortcuts.fitCanvas} side="right">
        <IconButton className="canvas-tool-button" filled={false} icon="map-pin" size="lg" aria-label={t("canvas.fit")} onClick={onFit} />
      </TooltipAnchor>
      <TooltipAnchor label={t("canvas.undo")} shortcut={shortcuts.undo} side="right">
        <IconButton className="canvas-tool-button" filled={false} icon="undo" size="lg" aria-label={t("canvas.undo")} disabled={!canUndo} onClick={onUndo} />
      </TooltipAnchor>
      <TooltipAnchor label={t("canvas.redo")} shortcut={shortcuts.redo} side="right">
        <IconButton className="canvas-tool-button" filled={false} icon="redo" size="lg" aria-label={t("canvas.redo")} disabled={!canRedo} onClick={onRedo} />
      </TooltipAnchor>
      <TooltipAnchor label={t("sidebar.settings")} side="right">
        <IconButton className="canvas-tool-button" filled={false} icon="settings-cog" size="lg" aria-label={t("sidebar.settings")} onClick={onOpenSettings} />
      </TooltipAnchor>
    </div>
  );
}

export const CanvasActionsToolbar = memo(CanvasActionsToolbarComponent);
CanvasActionsToolbar.displayName = "CanvasActionsToolbar";

type CanvasCreationToolbarProps = {
  canGroup: boolean;
  canUngroup: boolean;
  canvasTool: CanvasTool;
  onAddAsset: () => void;
  onAddNode: () => void;
  onGroup: () => void;
  onSelectTool: (tool: CanvasTool) => void;
  onSetZoom: (zoom: number) => void;
  onUngroup: () => void;
  panModeActive: boolean;
  t: Translate;
  viewportZoom: number;
};

function CanvasCreationToolbarComponent({
  canGroup,
  canUngroup,
  canvasTool,
  onAddAsset,
  onAddNode,
  onGroup,
  onSelectTool,
  onSetZoom,
  onUngroup,
  panModeActive,
  t,
  viewportZoom
}: CanvasCreationToolbarProps): ReactElement {
  const zoomPercent = Math.round(viewportZoom * 100);
  return (
    <div className="canvas-toolbar" aria-label={t("canvas.tools")}>
      <TooltipAnchor label={t("canvas.addNode")} shortcut={shortcuts.addNode}>
        <IconButton className="canvas-toolbar-button" filled={false} icon="plus-lg" size="lg" aria-label={t("canvas.addNode")} onClick={onAddNode} />
      </TooltipAnchor>
      <TooltipAnchor label={t("canvas.addAsset")}>
        <IconButton className="canvas-toolbar-button" filled={false} icon="image-square" size="lg" aria-label={t("canvas.addAsset")} onClick={onAddAsset} />
      </TooltipAnchor>
      <TooltipAnchor label={t("canvas.group")} shortcut="⌘G">
        <IconButton className="canvas-toolbar-button" filled={false} icon="members" size="lg" aria-label={t("canvas.group")} disabled={!canGroup} onClick={onGroup} />
      </TooltipAnchor>
      <TooltipAnchor label={t("canvas.ungroup")} shortcut="⌘⇧G">
        <IconButton className="canvas-toolbar-button" filled={false} icon="folder-unshare" size="lg" aria-label={t("canvas.ungroup")} disabled={!canUngroup} onClick={onUngroup} />
      </TooltipAnchor>
      <span className="canvas-toolbar-divider" />
      <TooltipAnchor label={t("canvas.selectTool")} shortcut={shortcuts.selectTool}>
        <IconButton
          className={`canvas-toolbar-button ${canvasTool === "select" && !panModeActive ? "is-selected" : ""}`}
          filled={false}
          icon="work-with-apps"
          size="lg"
          aria-label={t("canvas.selectTool")}
          aria-pressed={canvasTool === "select" && !panModeActive}
          onClick={() => onSelectTool("select")}
        />
      </TooltipAnchor>
      <TooltipAnchor label={t("canvas.panTool")} shortcut={shortcuts.panTool}>
        <IconButton
          className={`canvas-toolbar-button ${panModeActive ? "is-selected" : ""}`}
          filled={false}
          icon="hand-raised"
          size="lg"
          aria-label={t("canvas.panTool")}
          aria-pressed={panModeActive}
          onClick={() => onSelectTool("pan")}
        />
      </TooltipAnchor>
      <span className="canvas-toolbar-divider" />
      <TooltipAnchor label={t("canvas.zoom")}>
        <RadixDropdownMenu.Root>
          <RadixDropdownMenu.Trigger asChild>
            <button className="canvas-zoom-trigger" type="button" aria-label={t("canvas.zoom")}>
              <span>{zoomPercent}%</span>
              <Icon name="chevron-down" size={16} />
            </button>
          </RadixDropdownMenu.Trigger>
          <RadixDropdownMenu.Portal>
            <RadixDropdownMenu.Content className="canvas-zoom-popover" side="top" sideOffset={8} align="end">
              <DropdownMenu className="canvas-zoom-menu" role="menu">
                {zoomOptions.map((option) => (
                  <RadixDropdownMenu.Item key={option.value} asChild>
                    <DropdownMenuItem
                      label={option.label}
                      selected={Math.abs(viewportZoom - option.value) < 0.01}
                      role="menuitemradio"
                      aria-checked={Math.abs(viewportZoom - option.value) < 0.01}
                      onClick={() => onSetZoom(option.value)}
                    />
                  </RadixDropdownMenu.Item>
                ))}
              </DropdownMenu>
            </RadixDropdownMenu.Content>
          </RadixDropdownMenu.Portal>
        </RadixDropdownMenu.Root>
      </TooltipAnchor>
    </div>
  );
}

export const CanvasCreationToolbar = memo(CanvasCreationToolbarComponent);
CanvasCreationToolbar.displayName = "CanvasCreationToolbar";
