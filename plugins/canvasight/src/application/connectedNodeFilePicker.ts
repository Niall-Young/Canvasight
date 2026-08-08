import type { Attachment } from "../../shared/types";
import type { ConnectedNodeKind } from "../domain/connectedNodeCreation";
import { filesToInputs } from "../infrastructure/fileInputs";
import { isMediaAssetFile } from "../lib/assetPresentation";
import { canvasightApi } from "../lib/canvasightApi";
import { useScatterStore } from "../store/scatterStore";
import type { ConnectedNodeMenuRequest } from "./CanvasActionsContext";

const mediaAssetAccept = "image/*,video/*,.apng,.avif,.gif,.jpeg,.jpg,.png,.svg,.webp,.avi,.m4v,.mkv,.mov,.mp4,.ogv,.webm";

interface ConnectedNodeFilePickerMessages {
  addAssetFailed: string;
  connectedNodeUnavailable: string;
  documentFileRequired: string;
  mediaFileRequired: string;
}

interface ConnectedNodeFilePickerOptions {
  request: ConnectedNodeMenuRequest;
  kind: Extract<ConnectedNodeKind, "file" | "media">;
  messages: ConnectedNodeFilePickerMessages;
  onAttachment: (attachment: Attachment) => void;
  onStatus: (message: string) => void;
}

export function openConnectedNodeFilePicker({ request, kind, messages, onAttachment, onStatus }: ConnectedNodeFilePickerOptions): void {
  const input = document.createElement("input");
  input.type = "file";
  input.multiple = false;
  if (kind === "media") input.accept = mediaAssetAccept;
  input.onchange = () => {
    const file = input.files?.[0];
    if (!file) return;
    const media = isMediaAssetFile(file.name, file.type);
    if ((kind === "media") !== media) {
      onStatus(kind === "media" ? messages.mediaFileRequired : messages.documentFileRequired);
      return;
    }

    const current = useScatterStore.getState();
    const source = current.nodes.find((node) => node.id === request.nodeId && node.type !== "group");
    const stillCurrent = current.project?.path === request.projectPath;
    const sideStillAvailable = request.side === "right" || !current.edges.some((edge) => edge.target === request.nodeId);
    if (!source || !stillCurrent || !sideStillAvailable) {
      onStatus(messages.connectedNodeUnavailable);
      return;
    }

    void (async () => {
      try {
        const [attachment] = await canvasightApi.saveAttachments(request.projectPath, await filesToInputs([file], "upload"));
        if (!attachment) throw new Error(messages.addAssetFailed);
        const savedAsMedia = isMediaAssetFile(attachment.originalName, attachment.mime);
        if ((kind === "media") !== savedAsMedia) {
          onStatus(kind === "media" ? messages.mediaFileRequired : messages.documentFileRequired);
          return;
        }
        onAttachment(attachment);
      } catch (error) {
        onStatus(error instanceof Error ? error.message : messages.addAssetFailed);
      }
    })();
  };
  input.click();
}
