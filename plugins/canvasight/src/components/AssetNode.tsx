import { memo, useEffect, useState, useSyncExternalStore, type KeyboardEvent, type ReactElement } from "react";
import * as RadixDropdownMenu from "@radix-ui/react-dropdown-menu";
import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";
import type { AssetRole, ScatterAssetNodeData } from "../../shared/types";
import { getCanvasightAssetBaseUrl, loadCanvasightImageAsset, subscribeCanvasightRuntimeData } from "../lib/canvasightApi";
import { useI18n } from "../lib/i18n";
import { formatBytes } from "../lib/utils";
import { taskNodeActions } from "./TaskNode";
import { ActionMenuItem } from "./ui/action-menu-item";
import { Icon } from "./ui/icon";
import { IconButton } from "./ui/icon-button";

const roles: AssetRole[] = ["input", "reference", "option", "output"];

function fileTypeLabel(name: string, mime: string): string {
  const extension = name.includes(".") ? name.split(".").pop()?.trim() : "";
  if (extension && extension.length <= 8) return extension.toUpperCase();
  const mimeSubtype = mime.split("/")[1]?.split(/[;+]/)[0]?.trim();
  return mimeSubtype ? mimeSubtype.toUpperCase() : "";
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
  const typeLabel = fileTypeLabel(displayName, data.asset.mime) || t("asset.file");
  const openFile = (): void => {
    void window.scatter.openFile(data.asset.storedPath);
  };
  const handleFileKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    openFile();
  };

  return (
    <article
      className={`asset-node ${selected ? "is-selected" : ""}`}
      aria-label={`${displayName}, ${t(`asset.role.${data.role}`)}`}
      onMouseEnter={() => taskNodeActions?.setNodeHover(id, true)}
      onMouseLeave={() => taskNodeActions?.setNodeHover(id, false)}
    >
      <Handle type="target" position={Position.Left} className="node-handle">
        <button className="node-connect-button" type="button" aria-label={t("task.connectLeft")} onClick={() => taskNodeActions?.createConnectedNode(id, "left")}>
          <Icon name="plus-lg" size={16} />
        </button>
      </Handle>
      <section className="asset-node-card">
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
                <RadixDropdownMenu.Sub>
                  <RadixDropdownMenu.SubTrigger asChild>
                    <ActionMenuItem icon="category" label={t("asset.classification")} />
                  </RadixDropdownMenu.SubTrigger>
                  <RadixDropdownMenu.Portal>
                    <RadixDropdownMenu.SubContent className="dropdown-content node-action-menu" sideOffset={6} alignOffset={-4}>
                      <RadixDropdownMenu.RadioGroup
                        value={data.role}
                        onValueChange={(role) => taskNodeActions?.updateNodeData(id, { role: role as AssetRole })}
                      >
                        {roles.map((role) => (
                          <RadixDropdownMenu.RadioItem asChild key={role} value={role}>
                            <ActionMenuItem
                              className={`asset-role-option ${role === data.role ? "is-selected" : ""}`}
                              icon={role === data.role ? "check-md" : null}
                              label={t(`asset.role.${role}`)}
                            />
                          </RadixDropdownMenu.RadioItem>
                        ))}
                      </RadixDropdownMenu.RadioGroup>
                    </RadixDropdownMenu.SubContent>
                  </RadixDropdownMenu.Portal>
                </RadixDropdownMenu.Sub>
                <RadixDropdownMenu.Item asChild>
                  <ActionMenuItem icon="trash" label={t("task.delete")} onClick={() => taskNodeActions?.deleteNode(id)} />
                </RadixDropdownMenu.Item>
              </RadixDropdownMenu.Content>
            </RadixDropdownMenu.Portal>
          </RadixDropdownMenu.Root>
        </div>
        <div
          className="asset-node-file"
          role="button"
          tabIndex={0}
          aria-label={t("asset.openFileNamed", { name: displayName })}
          onDoubleClick={openFile}
          onKeyDown={handleFileKeyDown}
        >
          {data.asset.kind === "image" ? (
            <div className="asset-image-summary">
              <div className="asset-preview">
                {imageStatus === "loading" ? <div className="asset-preview-status" role="status" aria-live="polite">{t("asset.loading")}</div> : null}
                {imageStatus === "ready" && imageSrc ? <img src={imageSrc} alt={displayName} /> : null}
                {imageStatus === "error" ? <div className="asset-preview-status is-error" role="status"><Icon name="warning" size={20} />{t("asset.loadFailed")}</div> : null}
              </div>
              <span className="asset-file-copy asset-image-copy">
                <strong title={displayName}>{displayName}</strong>
                <span>{typeLabel} · {formatBytes(data.asset.size)}</span>
              </span>
            </div>
          ) : (
            <div className="asset-file-summary">
              <span className="asset-file-icon">
                <Icon name="notepad" size={44} />
                <small className="asset-file-type-mark">{typeLabel}</small>
              </span>
              <span className="asset-file-copy">
                <strong>{displayName}</strong>
                <span>{typeLabel} · {formatBytes(data.asset.size)}</span>
              </span>
            </div>
          )}
        </div>
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
