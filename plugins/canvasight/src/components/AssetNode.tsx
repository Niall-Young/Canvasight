import { memo, useEffect, useState, useSyncExternalStore, type KeyboardEvent, type ReactElement } from "react";
import * as RadixDropdownMenu from "@radix-ui/react-dropdown-menu";
import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";
import type { AssetRole, ScatterAssetNodeData } from "../../shared/types";
import { fileIconName, isVideoAsset } from "../lib/assetPresentation";
import { getCanvasightAssetBaseUrl, loadCanvasightImageAsset, resolveCanvasightAssetUrl, subscribeCanvasightRuntimeData } from "../lib/canvasightApi";
import { useI18n } from "../lib/i18n";
import type { Translate } from "../lib/translations";
import { taskNodeActions } from "./TaskNode";
import { ActionMenuItem } from "./ui/action-menu-item";
import { Icon } from "./ui/icon";
import { IconButton } from "./ui/icon-button";

const roles: AssetRole[] = ["input", "reference", "option", "output"];

function AssetRoleOptions({ id, role, t }: { id: string; role: AssetRole; t: Translate }): ReactElement {
  return (
    <RadixDropdownMenu.RadioGroup
      value={role}
      onValueChange={(nextRole) => taskNodeActions?.updateNodeData(id, { role: nextRole as AssetRole })}
    >
      {roles.map((option) => (
        <RadixDropdownMenu.RadioItem asChild key={option} value={option}>
          <ActionMenuItem
            className={`asset-role-option ${option === role ? "is-selected" : ""}`}
            icon={null}
            label={t(`asset.role.${option}`)}
            trailingIcon={option === role ? "check-md" : null}
          />
        </RadixDropdownMenu.RadioItem>
      ))}
    </RadixDropdownMenu.RadioGroup>
  );
}

function AssetNodeComponent({ id, data, selected }: NodeProps<Node<ScatterAssetNodeData, "asset">>): ReactElement {
  const { t } = useI18n();
  const [imageSrc, setImageSrc] = useState("");
  const [imageStatus, setImageStatus] = useState<"loading" | "ready" | "error">(data.asset.kind === "image" ? "loading" : "ready");
  const assetBaseUrl = useSyncExternalStore(subscribeCanvasightRuntimeData, getCanvasightAssetBaseUrl, getCanvasightAssetBaseUrl);

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

  const displayName = data.asset.originalName || data.title;
  const video = isVideoAsset(displayName, data.asset.mime);
  const presentation = data.asset.kind === "image" ? "image" : video ? "video" : "file";
  const videoSrc = video ? resolveCanvasightAssetUrl(data.asset.fileUrl, assetBaseUrl) : "";
  const openFile = (): void => {
    void window.scatter.openFile(data.asset.storedPath);
  };
  const handleFileKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    if (event.target !== event.currentTarget) return;
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    openFile();
  };

  return (
    <article
      className={`asset-node is-${presentation} ${selected ? "is-selected" : ""}`}
      aria-label={`${displayName}, ${t(`asset.role.${data.role}`)}`}
      onMouseEnter={() => taskNodeActions?.setNodeHover(id, true)}
      onMouseLeave={() => taskNodeActions?.setNodeHover(id, false)}
    >
      <Handle type="target" position={Position.Left} className="node-handle">
        <button className="node-connect-button" type="button" aria-label={t("task.connectLeft")} onClick={() => taskNodeActions?.createConnectedNode(id, "left")}>
          <Icon name="plus-lg" size={16} />
        </button>
      </Handle>
      <div className="asset-node-controls">
        <RadixDropdownMenu.Root>
          <RadixDropdownMenu.Trigger asChild>
            <button
              className="asset-role-trigger nodrag"
              type="button"
              aria-label={`${t("asset.classification")}: ${t(`asset.role.${data.role}`)}`}
            >
              <Icon name="category" size={14} />
              <span>{t(`asset.role.${data.role}`)}</span>
              <Icon name="chevron-down-md" size={14} />
            </button>
          </RadixDropdownMenu.Trigger>
          <RadixDropdownMenu.Portal>
            <RadixDropdownMenu.Content className="dropdown-content node-action-menu" sideOffset={8} align="start">
              <AssetRoleOptions id={id} role={data.role} t={t} />
            </RadixDropdownMenu.Content>
          </RadixDropdownMenu.Portal>
        </RadixDropdownMenu.Root>
        <div className="asset-node-menu">
          <RadixDropdownMenu.Root>
            <RadixDropdownMenu.Trigger asChild>
              <IconButton className="nodrag" filled={false} icon="dots-horizontal" size="lg" aria-label={t("task.more")} />
            </RadixDropdownMenu.Trigger>
            <RadixDropdownMenu.Portal>
              <RadixDropdownMenu.Content className="dropdown-content node-action-menu" sideOffset={8} align="end">
                <RadixDropdownMenu.Item asChild>
                  <ActionMenuItem icon="upload-documents" label={t("asset.replaceFile")} onClick={() => taskNodeActions?.replaceAsset(id)} />
                </RadixDropdownMenu.Item>
                <RadixDropdownMenu.Item asChild>
                  <ActionMenuItem icon="trash" label={t("task.delete")} onClick={() => taskNodeActions?.deleteNode(id)} />
                </RadixDropdownMenu.Item>
              </RadixDropdownMenu.Content>
            </RadixDropdownMenu.Portal>
          </RadixDropdownMenu.Root>
        </div>
      </div>
      <div
        className="asset-node-content"
        role={video ? undefined : "button"}
        tabIndex={video ? undefined : 0}
        aria-label={t("asset.openFileNamed", { name: displayName })}
        onDoubleClick={openFile}
        onKeyDown={handleFileKeyDown}
      >
        {data.asset.kind === "image" ? (
          <div className={`asset-preview is-${imageStatus}`}>
            {imageStatus === "loading" ? <div className="asset-preview-status" role="status" aria-live="polite">{t("asset.loading")}</div> : null}
            {imageStatus === "ready" && imageSrc ? <img src={imageSrc} alt={displayName} /> : null}
            {imageStatus === "error" ? <div className="asset-preview-status is-error" role="status"><Icon name="warning" size={20} />{t("asset.loadFailed")}</div> : null}
          </div>
        ) : video ? (
          <video className="asset-video" src={videoSrc} controls preload="metadata" aria-label={displayName} />
        ) : (
          <div className="asset-file-summary">
            <Icon name={fileIconName(displayName, data.asset.mime)} size={80} />
          </div>
        )}
      </div>
      <Handle type="source" position={Position.Right} className="node-handle">
        <button className="node-connect-button" type="button" aria-label={t("task.connectRight")} onClick={() => taskNodeActions?.createConnectedNode(id, "right")}>
          <Icon name="plus-lg" size={16} />
        </button>
      </Handle>
    </article>
  );
}

export const AssetNode = memo(AssetNodeComponent);
