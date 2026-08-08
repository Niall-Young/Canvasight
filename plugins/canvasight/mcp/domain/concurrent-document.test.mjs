import { describe, expect, it } from "vitest";
import { documentObjectWriters, mergeAtomicItems, pageEdgeConstraintViolations } from "./concurrent-document.mjs";

describe("concurrent document rules", () => {
  it("merges edits to different objects without a conflict", () => {
    const base = [{ id: "a", value: 1 }, { id: "b", value: 1 }];
    const current = [{ id: "a", value: 2 }, { id: "b", value: 1 }];
    const local = [{ id: "a", value: 1 }, { id: "b", value: 2 }];
    const reasons = [];
    expect(mergeAtomicItems(base, current, local, (item) => item, "node", reasons)).toEqual([
      { id: "a", value: 2 },
      { id: "b", value: 2 }
    ]);
    expect(reasons).toEqual([]);
  });

  it("reports a second incoming parent without deleting the existing edge", () => {
    const nodes = ["a", "b", "c"].map((id) => ({ id, type: "task" }));
    const base = { id: "page", nodes, edges: [{ id: "one", source: "a", target: "c" }] };
    const candidate = { ...base, edges: [...base.edges, { id: "two", source: "b", target: "c" }] };
    expect(pageEdgeConstraintViolations(base, candidate)).toEqual(["edge-target:page:c"]);
    expect(candidate.edges).toHaveLength(2);
  });

  it("tracks the writer of changed node semantics but ignores positions", () => {
    const before = { pages: [{ id: "p", name: "Page", nodes: [{ id: "n", position: { x: 0, y: 0 }, data: { title: "A" } }], edges: [] }] };
    const moved = { pages: [{ ...before.pages[0], nodes: [{ id: "n", position: { x: 1, y: 0 }, data: { title: "A" } }] }] };
    const edited = { pages: [{ ...before.pages[0], nodes: [{ id: "n", position: { x: 0, y: 0 }, data: { title: "B" } }] }] };
    expect(documentObjectWriters({}, before, moved, "manual")).toEqual({});
    expect(documentObjectWriters({}, before, edited, "manual")).toEqual({ "node:p:n": "manual" });
  });
});
