import { memo, useEffect, useState, type ReactElement } from "react";
import * as RadixDropdownMenu from "@radix-ui/react-dropdown-menu";
import { NodeResizer, type Node, type NodeProps } from "@xyflow/react";
import type { ScatterGroupNodeData } from "../../shared/types";
import { useI18n } from "../lib/i18n";
import { useScatterStore } from "../store/scatterStore";
import { taskNodeActions } from "./TaskNode";
import { ActionMenuItem } from "./ui/action-menu-item";
import { IconButton } from "./ui/icon-button";
import { TooltipAnchor } from "./ui/tooltip";

function GroupNodeComponent({ id, data, selected }: NodeProps<Node<ScatterGroupNodeData, "group">>): ReactElement {
  const { t } = useI18n();
  const [title, setTitle] = useState(data.title);
  const [description, setDescription] = useState(data.description);
  const memberCount = useScatterStore((state) => state.nodes.reduce((count, node) => count + Number(node.type !== "group" && node.parentId === id), 0));
  const assetCount = useScatterStore((state) => state.nodes.reduce((count, node) => count + Number(node.type === "asset" && node.parentId === id), 0));
  const collapsed = useScatterStore((state) => state.collapsedGroupIds.includes(id));

  useEffect(() => setTitle(data.title), [data.title]);
  useEffect(() => setDescription(data.description), [data.description]);

  const commit = (): void => {
    const nextTitle = title.trim() || t("group.untitled");
    setTitle(nextTitle);
    if (nextTitle !== data.title || description !== data.description) {
      taskNodeActions?.updateNodeData(id, { title: nextTitle, description });
    }
  };

  return (
    <section
      className={`group-node ${collapsed ? "is-collapsed" : "is-expanded"} ${selected ? "is-selected" : ""}`}
      aria-label={t("group.ariaLabel", { title: title || t("group.untitled"), count: memberCount, assets: assetCount })}
    >
      <NodeResizer isVisible={selected && !collapsed} minWidth={360} minHeight={160} />
      <header className="group-node-header">
        <div className="group-node-copy">
          <input
            className="group-node-title nodrag"
            value={title}
            aria-label={t("group.title")}
            onChange={(event) => setTitle(event.currentTarget.value)}
            onBlur={commit}
            onKeyDown={(event) => {
              if (event.key === "Enter") event.currentTarget.blur();
              if (event.key === "Escape") { setTitle(data.title); event.currentTarget.blur(); }
            }}
          />
          {!collapsed ? (
            <input
              className="group-node-description nodrag"
              value={description}
              aria-label={t("group.description")}
              placeholder={t("group.descriptionPlaceholder")}
              onChange={(event) => setDescription(event.currentTarget.value)}
              onBlur={commit}
              onKeyDown={(event) => {
                if (event.key === "Enter") event.currentTarget.blur();
                if (event.key === "Escape") { setDescription(data.description); event.currentTarget.blur(); }
              }}
            />
          ) : description ? <span className="group-node-description-summary">{description}</span> : null}
        </div>
        <span className="group-node-count">{t("group.count", { count: memberCount, assets: assetCount })}</span>
        <TooltipAnchor className="nodrag" label={collapsed ? t("group.fitCollapsed") : memberCount ? t("group.fit") : t("group.fitEmpty")}>
          <IconButton
            className="nodrag"
            filled={false}
            icon="aspect-ratio-16-9-1"
            size="lg"
            aria-label={collapsed ? t("group.fitCollapsed") : memberCount ? t("group.fit") : t("group.fitEmpty")}
            disabled={!memberCount || collapsed}
            onClick={() => taskNodeActions?.fitGroup(id)}
          />
        </TooltipAnchor>
        <TooltipAnchor className="nodrag" label={collapsed ? t("group.expand") : t("group.collapse")}>
          <IconButton
            className="nodrag"
            filled={false}
            icon={collapsed ? "expand-lg" : "collapse-lg"}
            size="lg"
            aria-label={collapsed ? t("group.expand") : t("group.collapse")}
            aria-expanded={!collapsed}
            onClick={() => taskNodeActions?.toggleGroup(id)}
          />
        </TooltipAnchor>
        <TooltipAnchor className="nodrag" label={memberCount ? t("group.run") : t("group.runEmpty")}>
          <IconButton filled={false} icon="play-1" size="lg" aria-label={memberCount ? t("group.run") : t("group.runEmpty")} disabled={!memberCount} onClick={() => taskNodeActions?.runNode(id, "flow")} />
        </TooltipAnchor>
        <RadixDropdownMenu.Root>
          <RadixDropdownMenu.Trigger asChild>
            <IconButton className="nodrag" filled={false} icon="dots-horizontal" size="lg" aria-label={t("task.more")} />
          </RadixDropdownMenu.Trigger>
          <RadixDropdownMenu.Portal>
            <RadixDropdownMenu.Content className="dropdown-content node-action-menu" sideOffset={8} align="end">
              <RadixDropdownMenu.Item asChild>
                <ActionMenuItem icon="folder-unshare" label={t("group.ungroupAll")} onClick={() => taskNodeActions?.ungroupNode(id)} />
              </RadixDropdownMenu.Item>
              <RadixDropdownMenu.Item asChild>
                <ActionMenuItem icon="trash" label={t("group.delete")} onClick={() => taskNodeActions?.deleteNode(id)} />
              </RadixDropdownMenu.Item>
            </RadixDropdownMenu.Content>
          </RadixDropdownMenu.Portal>
        </RadixDropdownMenu.Root>
      </header>
      {!collapsed && memberCount === 0 ? <div className="group-node-empty">{t("group.empty")}</div> : null}
    </section>
  );
}

export const GroupNode = memo(GroupNodeComponent);
