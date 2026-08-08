import { describe, expect, it } from "vitest";
import type { ScatterAssetNode, ScatterGroupNode, ScatterTaskNode } from "../../shared/types";
import { ungroupNodes } from "./canvasGraph";

const task = (id: string): ScatterTaskNode => ({
  id,
  type: "task",
  position: { x: 0, y: 0 },
  data: { title: id, body: "", attachments: [], effort: "xhigh", runMode: "flow" }
});

const group = (id: string): ScatterGroupNode => ({
  id,
  type: "group",
  position: { x: 0, y: 0 },
  data: { title: id, description: "" }
});

const asset = (id: string, parentId: string): ScatterAssetNode => ({
  id,
  type: "asset",
  parentId,
  position: { x: 40, y: 80 },
  data: {
    title: id,
    description: "",
    role: "reference",
    asset: {
      id: `${id}-file`,
      kind: "image",
      source: "upload",
      originalName: `${id}.png`,
      storedPath: `/tmp/${id}.png`,
      relativePath: `.scatter/assets/${id}.png`,
      fileUrl: `/api/assets/${id}.png`,
      mime: "image/png",
      size: 128,
      createdAt: "2026-01-01T00:00:00.000Z"
    }
  }
});

describe("canvas Group dissolution", () => {
  it("dissolves a Group while preserving members at their absolute positions", () => {
    const parent = { ...group("group-a"), position: { x: 100, y: 200 } };
    const childTask = { ...task("task-a"), parentId: parent.id, position: { x: 20, y: 60 } };
    const childAsset = asset("asset-a", parent.id);
    const outside = { ...task("outside"), position: { x: 900, y: 100 } };

    const result = ungroupNodes([parent, childTask, childAsset, outside], [parent.id]);

    expect(result.dissolvedGroupIds).toEqual([parent.id]);
    expect(result.releasedNodeIds).toEqual([childTask.id, childAsset.id]);
    expect(result.nodes.some((node) => node.id === parent.id)).toBe(false);
    expect(result.nodes.find((node) => node.id === childTask.id)).toMatchObject({ parentId: undefined, position: { x: 120, y: 260 } });
    expect(result.nodes.find((node) => node.id === childAsset.id)).toMatchObject({ parentId: undefined, position: { x: 140, y: 280 } });
    expect(result.nodes.find((node) => node.id === outside.id)).toBe(outside);
  });

  it("removes an empty Group when it is dissolved", () => {
    const parent = group("empty-group");
    const result = ungroupNodes([parent, task("outside")], [parent.id]);

    expect(result.nodes.map((node) => node.id)).toEqual(["outside"]);
    expect(result.dissolvedGroupIds).toEqual([parent.id]);
    expect(result.releasedNodeIds).toEqual([]);
  });

  it("releases an individual member without deleting its Group", () => {
    const parent = { ...group("group-a"), position: { x: 100, y: 200 } };
    const released = { ...task("released"), parentId: parent.id, position: { x: 20, y: 60 } };
    const retained = asset("retained", parent.id);
    const result = ungroupNodes([parent, released, retained], [released.id]);

    expect(result.dissolvedGroupIds).toEqual([]);
    expect(result.releasedNodeIds).toEqual([released.id]);
    expect(result.nodes.find((node) => node.id === parent.id)).toBe(parent);
    expect(result.nodes.find((node) => node.id === released.id)).toMatchObject({ parentId: undefined, position: { x: 120, y: 260 } });
    expect(result.nodes.find((node) => node.id === retained.id)).toBe(retained);
  });

  it("handles selected Groups and members from other Groups in one operation", () => {
    const dissolved = { ...group("dissolved"), position: { x: 100, y: 100 } };
    const retained = { ...group("retained"), position: { x: 500, y: 100 } };
    const dissolvedChild = { ...task("dissolved-child"), parentId: dissolved.id, position: { x: 10, y: 50 } };
    const releasedChild = { ...task("released-child"), parentId: retained.id, position: { x: 20, y: 60 } };
    const retainedChild = asset("retained-child", retained.id);

    const result = ungroupNodes(
      [dissolved, retained, dissolvedChild, releasedChild, retainedChild],
      [dissolved.id, releasedChild.id]
    );

    expect(result.dissolvedGroupIds).toEqual([dissolved.id]);
    expect(result.releasedNodeIds).toEqual([dissolvedChild.id, releasedChild.id]);
    expect(result.nodes.some((node) => node.id === dissolved.id)).toBe(false);
    expect(result.nodes.find((node) => node.id === retained.id)).toBe(retained);
    expect(result.nodes.find((node) => node.id === retainedChild.id)).toBe(retainedChild);
  });
});
