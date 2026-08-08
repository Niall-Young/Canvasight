import { nanoid } from "nanoid";
import type { Attachment, NodeTemplate, ScatterAssetNode, ScatterNode } from "../../shared/types";
import { roundPosition, type FlowPosition } from "./canvasGraph";

export function emptyNode(position: FlowPosition, index: number): ScatterNode {
  return {
    id: nanoid(),
    type: "task",
    position,
    selected: true,
    data: { title: `新建任务 ${index + 1}`, body: "", attachments: [], effort: "xhigh", runMode: "flow" }
  };
}

export function assetNodeFromAttachment(attachment: Attachment, position: FlowPosition, parentId?: string): ScatterAssetNode {
  return {
    id: nanoid(),
    type: "asset",
    position: roundPosition(position),
    selected: true,
    ...(parentId ? { parentId } : {}),
    data: {
      title: attachment.originalName,
      description: "",
      asset: { ...attachment },
      role: "reference"
    }
  };
}

export function nodeFromTemplate(template: NodeTemplate, position: FlowPosition, index: number): ScatterNode {
  const body = template.body.trim();
  return {
    id: nanoid(),
    type: "task",
    position,
    selected: true,
    data: {
      title: template.title.trim() || body.slice(0, 40) || `新建任务 ${index + 1}`,
      body,
      attachments: template.attachments.map((attachment) => ({ ...attachment })),
      effort: "xhigh",
      runMode: "flow"
    }
  };
}
