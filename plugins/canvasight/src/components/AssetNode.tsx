import { memo, useEffect, useState, useSyncExternalStore, type ReactElement } from "react";
import * as RadixDropdownMenu from "@radix-ui/react-dropdown-menu";
import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";
import type { AssetRole, ScatterAssetNodeData } from "../../shared/types";
import { getCanvasightAssetBaseUrl, loadCanvasightImageAsset, subscribeCanvasightRuntimeData } from "../lib/canvasightApi";
import { useI18n } from "../lib/i18n";
import { formatBytes } from "../lib/utils";
import { shortcuts } from "../lib/shortcuts";
import { taskNodeActions } from "./TaskNode";
import { ActionMenuItem } from "./ui/action-menu-item";
import { Icon } from "./ui/icon";
import { IconButton } from "./ui/icon-button";
import { TooltipAnchor } from "./ui/tooltip";

const roles: AssetRole[] = ["input", "reference", "option", "output"];

function AssetNodeComponent({ id, data, selected }: NodeProps<Node<ScatterAssetNodeData, "asset">>): ReactElement {
  const { t } = useI18n();
  const [title, setTitle] = useState(data.title);
  const [description, setDescription] = useState(data.description);
  const [imageSrc, setImageSrc] = useState("");
  const [imageStatus, setImageStatus] = useState<"loading" | "ready" | "error">(data.asset.kind === "image" ? "loading" : "ready");
  const assetBaseUrl = useSyncExternalStore(subscribeCanvasightRuntimeData, getCanvasightAssetBaseUrl, getCanvasightAssetBaseUrl);

  useEffect(() => setTitle(data.title), [data.title]);
  useEffect(() => setDescription(data.description), [data.description]);
  useEffect(() => {
    let current = true;
    if (data.asset.kind !== "image") return () => { current = false; };
    setImageStatus("loading");
    setImageSrc("");
    void loadCanvasightImageAsset(data.asset.fileUrl, data.asset.storedPath, assetBaseUrl)
      .then((src) => {
        if (!current) return;
        setImageSrc(src);
        setImageStatus("ready");
      })
      .catch(() => {
        if (!current) return;
        setImageStatus("error");
      });
    return () => { current = false; };
  }, [assetBaseUrl, data.asset.fileUrl, data.asset.kind, data.asset.storedPath]);

  const commitTitle = (): void => {
    const next = title.trim() || data.asset.originalName;
    setTitle(next);
    if (next !== data.title) taskNodeActions?.updateNodeData(id, { title: next });
  };
  const commitDescription = (): void => {
    if (description !== data.description) taskNodeActions?.updateNodeData(id, { description });
  };

  return (
    <article
      className={`asset-node ${selected ? "is-selected" : ""}`}
      aria-label={`${title || data.asset.originalName}, ${t(`asset.role.${data.role}`)}`}
      onMouseEnter={() => taskNodeActions?.setNodeHover(id, true)}
      onMouseLeave={() => taskNodeActions?.setNodeHover(id, false)}
    >
      <Handle type="target" position={Position.Left} className="node-handle">
        <button className="node-connect-button" type="button" aria-label={t("task.connectLeft")} onClick={() => taskNodeActions?.createConnectedNode(id, "left")}>
          <Icon name="plus-lg" size={16} />
        </button>
      </Handle>
      <header className="asset-node-header">
        <input
          className="asset-node-title nodrag"
          value={title}
          aria-label={t("asset.title")}
          onChange={(event) => setTitle(event.currentTarget.value)}
          onBlur={commitTitle}
          onKeyDown={(event) => {
            if (event.key === "Enter") event.currentTarget.blur();
            if (event.key === "Escape") { setTitle(data.title); event.currentTarget.blur(); }
          }}
        />
        <span className="asset-role-badge">{t(`asset.role.${data.role}`)}</span>
        <TooltipAnchor className="nodrag" label={t("task.run")} shortcut={shortcuts.runCurrentTask}>
          <IconButton filled={false} icon="play-1" size="lg" aria-label={t("task.run")} onClick={() => taskNodeActions?.runNode(id, "flow")} />
        </TooltipAnchor>
        <RadixDropdownMenu.Root>
          <RadixDropdownMenu.Trigger asChild>
            <IconButton className="nodrag" filled={false} icon="dots-horizontal" size="lg" aria-label={t("task.more")} />
          </RadixDropdownMenu.Trigger>
          <RadixDropdownMenu.Portal>
            <RadixDropdownMenu.Content className="dropdown-content node-action-menu" sideOffset={8} align="end">
              {roles.map((role) => (
                <RadixDropdownMenu.Item asChild key={role}>
                  <ActionMenuItem className={role === data.role ? "is-selected" : ""} icon="tag" label={t(`asset.role.${role}`)} onClick={() => taskNodeActions?.updateNodeData(id, { role })} />
                </RadixDropdownMenu.Item>
              ))}
              <RadixDropdownMenu.Item asChild>
                <ActionMenuItem icon="external-link" label={t("asset.openFile")} onClick={() => window.scatter.openFile(data.asset.storedPath)} />
              </RadixDropdownMenu.Item>
              <RadixDropdownMenu.Item asChild>
                <ActionMenuItem icon="folder-open" label={t("asset.showInFolder")} onClick={() => window.scatter.showInFolder(data.asset.storedPath)} />
              </RadixDropdownMenu.Item>
              <RadixDropdownMenu.Item asChild>
                <ActionMenuItem icon="copy" label={t("task.copy")} onClick={() => taskNodeActions?.duplicateNode(id)} />
              </RadixDropdownMenu.Item>
              <RadixDropdownMenu.Item asChild>
                <ActionMenuItem icon="trash" label={t("task.delete")} onClick={() => taskNodeActions?.deleteNode(id)} />
              </RadixDropdownMenu.Item>
            </RadixDropdownMenu.Content>
          </RadixDropdownMenu.Portal>
        </RadixDropdownMenu.Root>
      </header>
      <section className="asset-node-card" onDoubleClick={() => window.scatter.openFile(data.asset.storedPath)}>
        {data.asset.kind === "image" ? (
          <div className="asset-preview">
            {imageStatus === "loading" ? <div className="asset-preview-status" role="status" aria-live="polite">{t("asset.loading")}</div> : null}
            {imageStatus === "ready" && imageSrc ? <img src={imageSrc} alt={title || data.asset.originalName} /> : null}
            {imageStatus === "error" ? <div className="asset-preview-status is-error" role="status"><Icon name="warning" size={20} />{t("asset.loadFailed")}</div> : null}
          </div>
        ) : (
          <div className="asset-file-summary">
            <Icon name="analyze-data" size={32} />
            <strong>{data.asset.originalName}</strong>
            <span>{data.asset.mime || t("asset.file")}</span>
            <span>{formatBytes(data.asset.size)}</span>
          </div>
        )}
        <textarea
          className="asset-description nodrag nowheel"
          value={description}
          rows={3}
          placeholder={t("asset.descriptionPlaceholder")}
          aria-label={t("asset.description")}
          onChange={(event) => setDescription(event.currentTarget.value)}
          onBlur={commitDescription}
          onKeyDown={(event) => {
            if (event.key === "Escape") { setDescription(data.description); event.currentTarget.blur(); }
          }}
        />
      </section>
      <Handle type="source" position={Position.Right} className="node-handle">
        <button className="node-connect-button" type="button" aria-label={t("task.connectRight")} onClick={() => taskNodeActions?.createConnectedNode(id, "right")}>
          <Icon name="plus-lg" size={16} />
        </button>
      </Handle>
    </article>
  );
}

export const AssetNode = memo(AssetNodeComponent);
