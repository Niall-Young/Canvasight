import { memo, useEffect, useState, useSyncExternalStore, type KeyboardEvent, type ReactElement } from "react";
import * as RadixDropdownMenu from "@radix-ui/react-dropdown-menu";
import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";
import type { ScatterAssetNodeData } from "../../shared/types";
import { assetExtension, fileIconName, isVideoAsset } from "../lib/assetPresentation";
import { getCanvasightAssetBaseUrl, loadCanvasightImageAsset, resolveCanvasightAssetUrl, subscribeCanvasightRuntimeData } from "../lib/canvasightApi";
import { useI18n } from "../lib/i18n";
import { formatBytes } from "../lib/utils";
import { taskNodeActions } from "./TaskNode";
import { ActionMenuItem } from "./ui/action-menu-item";
import { Icon } from "./ui/icon";
import { IconButton } from "./ui/icon-button";

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
  const extension = assetExtension(displayName);
  const fileType = extension ? extension.toUpperCase() : t("asset.file");
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
      aria-label={displayName}
      onMouseEnter={() => taskNodeActions?.setNodeHover(id, true)}
      onMouseLeave={() => taskNodeActions?.setNodeHover(id, false)}
    >
      <Handle type="target" position={Position.Left} className="node-handle">
        <button className="node-connect-button" type="button" aria-label={t("task.connectLeft")} onClick={() => taskNodeActions?.createConnectedNode(id, "left")}>
          <Icon name="plus-lg" size={16} />
        </button>
      </Handle>
      <div className="asset-node-controls">
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
            <Icon className="asset-file-icon" name={fileIconName(displayName, data.asset.mime)} size={48} />
            <div className="asset-file-copy">
              <span className="asset-file-name" title={displayName}>{displayName}</span>
              <span className="asset-file-meta">{fileType} · {formatBytes(data.asset.size)}</span>
            </div>
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
