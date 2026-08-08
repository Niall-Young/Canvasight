import { describe, expect, it } from "vitest";
import type { ScatterDocument, ScatterPage, ScatterProjectInfo, ScatterTaskNode } from "../../shared/types";
import { normalizeDocument, persistentDocumentValue, toDocument } from "./canvasDocument";

const task = (id: string, title = id): ScatterTaskNode => ({
  id,
  type: "task",
  position: { x: 10, y: 20 },
  selected: true,
  data: { title, body: "body", attachments: [], effort: "xhigh", runMode: "flow" }
});

const page = (nodes = [task("task-1")]): ScatterPage => ({
  id: "page-1",
  name: "Page 1",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  viewport: { x: 0, y: 0, zoom: 1 },
  viewState: { collapsedGroupIds: [] },
  nodes,
  edges: []
});

describe("canvas document", () => {
  it("normalizes a legacy document into a page without losing content", () => {
    const normalized = normalizeDocument("/tmp/project", {
      version: 1,
      projectName: "Project",
      updatedAt: "2026-01-01T00:00:00.000Z",
      activePageId: "page-1",
      pages: [],
      viewport: { x: 12, y: 24, zoom: 0.75 },
      nodes: [task("legacy")],
      edges: []
    });

    expect(normalized.pages).toHaveLength(1);
    expect(normalized.nodes[0].id).toBe("legacy");
    expect(normalized.pages[0].viewport).toEqual({ x: 12, y: 24, zoom: 0.75 });
    expect(normalized.pages[0].nodes[0].selected).toBe(false);
  });

  it("upgrades serialization to v2 only when v2 objects are present", () => {
    const project = { name: "Project" } as ScatterProjectInfo;
    const v1 = toDocument(project, [page()], "page-1", [task("task-1")], []);
    const groupedTask = { ...task("task-1"), parentId: "group-1" };
    const v2 = toDocument(project, [page()], "page-1", [groupedTask], []);

    expect(v1.version).toBe(1);
    expect(v2.version).toBe(2);
  });

  it("ignores transient selection, measurements and timestamps when comparing persistent content", () => {
    const firstPage = page();
    const first = normalizeDocument("/tmp/project", {
      version: 1,
      projectName: "Project",
      updatedAt: "2026-01-01T00:00:00.000Z",
      activePageId: firstPage.id,
      pages: [firstPage],
      viewport: firstPage.viewport,
      nodes: firstPage.nodes,
      edges: []
    } as ScatterDocument);
    const changed = structuredClone(first);
    changed.updatedAt = "2026-02-01T00:00:00.000Z";
    changed.pages[0].updatedAt = changed.updatedAt;
    changed.nodes[0].selected = false;
    changed.pages[0].nodes[0].selected = false;

    expect(persistentDocumentValue(changed)).toBe(persistentDocumentValue(first));
  });
});
