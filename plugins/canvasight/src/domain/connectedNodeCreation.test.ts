import { describe, expect, it } from "vitest";
import type { Attachment, ScatterEdge, ScatterTaskNode } from "../../shared/types";
import { assetNodeHeight, assetNodeWidth } from "./canvasGraph";
import { buildConnectedNodeCandidate } from "./connectedNodeCreation";

const task = (id: string, x = 600): ScatterTaskNode => ({
  id,
  type: "task",
  position: { x, y: 0 },
  data: { title: id, body: "", attachments: [], effort: "xhigh", runMode: "flow" }
});

const attachment: Attachment = {
  id: "asset-file",
  kind: "file",
  source: "upload",
  originalName: "brief.pdf",
  storedPath: "/project/.scatter/assets/brief.pdf",
  relativePath: ".scatter/assets/brief.pdf",
  fileUrl: "/assets/brief.pdf",
  mime: "application/pdf",
  size: 10,
  createdAt: "2026-08-08T00:00:00.000Z"
};

describe("connected node creation", () => {
  it("creates a right-side Task and Edge as one candidate", () => {
    const source = task("source", 0);
    const candidate = buildConnectedNodeCandidate({ nodeId: source.id, side: "right" }, "task", undefined, [source], []);
    expect(candidate?.node.type).toBe("task");
    expect(candidate?.edge).toMatchObject({ source: source.id, target: candidate?.node.id });
  });

  it("uses Asset dimensions for a left-side file candidate", () => {
    const source = task("source");
    const candidate = buildConnectedNodeCandidate({ nodeId: source.id, side: "left" }, "file", attachment, [source], []);
    expect(candidate?.node.type).toBe("asset");
    expect((candidate?.node.position.x ?? 0) + assetNodeWidth).toBeLessThan(source.position.x);
  });

  it("centers an Asset candidate on a blank-canvas drop", () => {
    const source = task("source");
    const candidate = buildConnectedNodeCandidate(
      { nodeId: source.id, side: "left", dropPosition: { x: 500, y: assetNodeHeight / 2 } },
      "media",
      attachment,
      [source],
      []
    );
    expect(candidate?.node.position.y).toBe(0);
  });

  it("rejects a left candidate when the source already has a parent", () => {
    const parent = task("parent", 0);
    const source = task("source");
    const edges: ScatterEdge[] = [{ id: "existing", source: parent.id, target: source.id }];
    expect(buildConnectedNodeCandidate({ nodeId: source.id, side: "left" }, "task", undefined, [parent, source], edges)).toBeNull();
  });
});
