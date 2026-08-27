import { describe, expect, it } from "vitest";
import type { ScatterEdge, ScatterGroupNode, ScatterTaskNode } from "../../shared/types";
import { assetNodeHeight, assetNodeWidth, assetPositionNextToTask, canGroupCanvasNodes, connectionFromStart, findConnectionDropPosition, findOpenPositionToLeft, findOpenToolbarAssetPositions, flowEdges, groupCanvasNodes, isConnectionAllowed, storeEdges } from "./canvasGraph";

const task = (id: string, x = 0): ScatterTaskNode => ({
  id,
  type: "task",
  position: { x, y: 0 },
  data: { title: id, body: "", attachments: [], effort: "xhigh", runMode: "flow" }
});

const group = (id: string): ScatterGroupNode => ({
  id,
  type: "group",
  position: { x: 0, y: 0 },
  data: { title: id, description: "" }
});

describe("canvas graph rules", () => {
  it("derives connection direction from the handle that started the gesture", () => {
    expect(connectionFromStart({ nodeId: "a", handleType: "source" }, "b")).toEqual({ source: "a", target: "b" });
    expect(connectionFromStart({ nodeId: "a", handleType: "target" }, "b")).toEqual({ source: "b", target: "a" });
    expect(connectionFromStart({ nodeId: "a", handleType: "source" }, "a")).toBeNull();
  });

  it("rejects duplicate, second-parent and Group endpoint connections", () => {
    const existing: ScatterEdge[] = [{ id: "edge-1", source: "a", target: "b" }];
    expect(isConnectionAllowed({ source: "a", target: "b" }, existing, [task("a"), task("b")])).toBe(false);
    expect(isConnectionAllowed({ source: "c", target: "b" }, existing, [task("b"), task("c")])).toBe(false);
    expect(isConnectionAllowed({ source: "group", target: "b" }, [], [group("group"), task("b")])).toBe(false);
    expect(isConnectionAllowed({ source: "a", target: "c" }, existing, [task("a"), task("c")])).toBe(true);
  });

  it("moves a dropped connected node outside its source instead of overlapping it", () => {
    const source = task("source");
    const position = findConnectionDropPosition({ x: 100, y: 110 }, "source", source, [source]);
    expect(position.x).toBeGreaterThanOrEqual(416);
  });

  it("uses Asset dimensions for left and dropped connected-node placement", () => {
    const source = task("source", 600);
    const left = findOpenPositionToLeft(
      { x: source.position.x - assetNodeWidth - 180, y: source.position.y },
      [source],
      { width: assetNodeWidth, height: assetNodeHeight }
    );
    expect(left.x + assetNodeWidth).toBeLessThan(source.position.x);

    const dropped = findConnectionDropPosition(
      { x: 700, y: 180 },
      "target",
      source,
      [source],
      { width: assetNodeWidth, height: assetNodeHeight }
    );
    expect(dropped.x + assetNodeWidth).toBeLessThanOrEqual(source.position.x - 16);
    expect(dropped.y).toBe(0);
  });

  it("places a Task-targeted Asset beside the Task and keeps it inside Group padding", () => {
    const parent = { ...group("group"), position: { x: 100, y: 100 }, width: 1200, height: 700 };
    const groupedTask = { ...task("task", 32), position: { x: 32, y: 72 }, parentId: parent.id };
    const position = assetPositionNextToTask(groupedTask, [parent, groupedTask]);
    expect(position.x).toBeGreaterThanOrEqual(parent.position.x + 32);
    expect(position.y).toBeGreaterThanOrEqual(parent.position.y + 72);
  });

  it("places toolbar Assets on a readable row without covering existing nodes or each other", () => {
    const existing = task("task");
    const positions = findOpenToolbarAssetPositions({ x: 0, y: 0 }, [existing], 2);
    expect(positions).toHaveLength(2);
    expect(positions[0].x).toBeGreaterThanOrEqual(existing.position.x + 400 + 32);
    expect(positions[1].x).toBeGreaterThanOrEqual(positions[0].x + assetNodeWidth + 32);
    expect(positions.map((position) => position.y)).toEqual([0, 0]);
  });

  it("places a toolbar Asset beyond an unusually wide Group instead of falling back onto it", () => {
    const wideGroup = { ...group("wide"), width: 5_000, height: 800 };
    const [position] = findOpenToolbarAssetPositions({ x: 0, y: 0 }, [wideGroup], 1);
    expect(position.x).toBeGreaterThanOrEqual(5_000 + 32);
  });

  it("extends one existing Group instead of creating an empty duplicate", () => {
    const parent = { ...group("group-a"), position: { x: 100, y: 100 }, width: 1000, height: 500 };
    const first = { ...task("first"), parentId: parent.id, position: { x: 32, y: 72 } };
    const second = { ...task("second"), parentId: parent.id, position: { x: 464, y: 72 } };
    const added = task("added", 1300);

    const result = groupCanvasNodes([parent, first, second, added], [first.id, second.id, added.id], { id: "unused", title: "New group" });

    expect(result.status).toBe("extended");
    expect(result.groupId).toBe(parent.id);
    expect(result.nodes.filter((node) => node.type === "group").map((node) => node.id)).toEqual([parent.id]);
    expect(result.nodes.filter((node) => node.type !== "group").map((node) => node.parentId)).toEqual([parent.id, parent.id, parent.id]);
  });

  it("does nothing when the selected nodes already share one Group", () => {
    const parent = group("group-a");
    const first = { ...task("first"), parentId: parent.id };
    const second = { ...task("second"), parentId: parent.id };
    const nodes = [parent, first, second];

    expect(canGroupCanvasNodes(nodes, [first.id, second.id])).toBe(false);
    expect(groupCanvasNodes(nodes, [first.id, second.id], { id: "unused", title: "New group" })).toMatchObject({
      nodes,
      groupId: parent.id,
      status: "unchanged",
      removedEmptyGroupIds: []
    });
  });

  it("removes only source Groups emptied by a real cross-Group regroup", () => {
    const left = group("left");
    const right = { ...group("right"), position: { x: 900, y: 0 } };
    const first = { ...task("first"), parentId: left.id, position: { x: 32, y: 72 } };
    const second = { ...task("second"), parentId: right.id, position: { x: 32, y: 72 } };

    const result = groupCanvasNodes([left, right, first, second], [first.id, second.id], { id: "combined", title: "Combined" });

    expect(result.status).toBe("created");
    expect(result.removedEmptyGroupIds).toEqual([left.id, right.id]);
    expect(result.nodes.filter((node) => node.type === "group").map((node) => node.id)).toEqual(["combined"]);
  });

  it("proxies cross-boundary edges through a collapsed Group and hides internal edges", () => {
    const parent = group("group");
    const outsideLeft = task("outside-left", -500);
    const insideA = { ...task("inside-a", 32), parentId: parent.id };
    const insideB = { ...task("inside-b", 32), position: { x: 32, y: 320 }, parentId: parent.id };
    const outsideRight = task("outside-right", 500);
    const edges: ScatterEdge[] = [
      { id: "incoming", source: outsideLeft.id, target: insideA.id },
      { id: "internal", source: insideA.id, target: insideB.id },
      { id: "outgoing", source: insideB.id, target: outsideRight.id }
    ];

    const rendered = flowEdges(edges, [parent, outsideLeft, insideA, insideB, outsideRight], [parent.id], null, null, null, null);

    expect(rendered).toHaveLength(2);
    expect(rendered).toEqual(expect.arrayContaining([
      expect.objectContaining({ source: outsideLeft.id, target: parent.id, selectable: false, data: expect.objectContaining({ aggregate: true, count: 1 }) }),
      expect.objectContaining({ source: parent.id, target: outsideRight.id, selectable: false, data: expect.objectContaining({ aggregate: true, count: 1 }) })
    ]));
    expect(rendered.some((edge) => edge.source === parent.id && edge.target === parent.id)).toBe(false);
    expect(storeEdges(rendered)).toEqual([]);
  });

  it("bundles same-direction relationships between two collapsed Groups", () => {
    const sourceGroup = group("source-group");
    const targetGroup = { ...group("target-group"), position: { x: 800, y: 0 } };
    const sourceA = { ...task("source-a", 32), parentId: sourceGroup.id };
    const sourceB = { ...task("source-b", 32), position: { x: 32, y: 320 }, parentId: sourceGroup.id };
    const targetA = { ...task("target-a", 32), parentId: targetGroup.id };
    const targetB = { ...task("target-b", 32), position: { x: 32, y: 320 }, parentId: targetGroup.id };
    const edges: ScatterEdge[] = [
      { id: "group-edge-a", source: sourceA.id, target: targetA.id },
      { id: "group-edge-b", source: sourceB.id, target: targetB.id }
    ];

    const rendered = flowEdges(
      edges,
      [sourceGroup, targetGroup, sourceA, sourceB, targetA, targetB],
      [sourceGroup.id, targetGroup.id],
      null,
      null,
      null,
      null
    );

    expect(rendered).toHaveLength(1);
    expect(rendered[0]).toEqual(expect.objectContaining({
      source: sourceGroup.id,
      target: targetGroup.id,
      selectable: false,
      data: expect.objectContaining({ aggregate: true, count: 2 })
    }));
    expect(storeEdges(rendered)).toEqual([]);
  });

});
