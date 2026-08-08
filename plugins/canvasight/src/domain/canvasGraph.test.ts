import { describe, expect, it } from "vitest";
import type { ScatterEdge, ScatterGroupNode, ScatterTaskNode } from "../../shared/types";
import { assetPositionNextToTask, connectionFromStart, findConnectionDropPosition, isConnectionAllowed } from "./canvasGraph";

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
});
