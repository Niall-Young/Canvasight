import { describe, expect, it } from "vitest";
import type { ScatterEdge, ScatterGroupNode, ScatterTaskNode } from "../../shared/types";
import { assetPositionNextToTask, connectionFromStart, findConnectionDropPosition, flowEdges, isConnectionAllowed, storeEdges } from "./canvasGraph";

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

  it("places a Task-targeted Asset beside the Task and keeps it inside Group padding", () => {
    const parent = { ...group("group"), position: { x: 100, y: 100 }, width: 1200, height: 700 };
    const groupedTask = { ...task("task", 32), position: { x: 32, y: 72 }, parentId: parent.id };
    const position = assetPositionNextToTask(groupedTask, [parent, groupedTask]);
    expect(position.x).toBeGreaterThanOrEqual(parent.position.x + 32);
    expect(position.y).toBeGreaterThanOrEqual(parent.position.y + 72);
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

    const rendered = flowEdges(edges, [parent, outsideLeft, insideA, insideB, outsideRight], [parent.id], null, null, null);

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
