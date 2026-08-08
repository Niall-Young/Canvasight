import { beforeEach, describe, expect, it } from "vitest";
import type { ScatterDocument, ScatterProjectInfo, ScatterTaskNode } from "../../shared/types";
import { useScatterStore } from "./scatterStore";

const task = (position = { x: 10, y: 20 }): ScatterTaskNode => ({
  id: "task-1",
  type: "task",
  position,
  data: { title: "Task", body: "", attachments: [], effort: "xhigh", runMode: "flow" }
});

const project: ScatterProjectInfo = {
  name: "Project",
  path: "/tmp/project",
  updatedAt: "2026-01-01T00:00:00.000Z"
};

const document = (): ScatterDocument => ({
  version: 1,
  projectName: project.name,
  updatedAt: project.updatedAt,
  activePageId: "page-1",
  pages: [{
    id: "page-1",
    name: "Page 1",
    createdAt: project.updatedAt,
    updatedAt: project.updatedAt,
    viewport: { x: 0, y: 0, zoom: 1 },
    viewState: { collapsedGroupIds: [] },
    nodes: [task()],
    edges: []
  }],
  viewport: { x: 0, y: 0, zoom: 1 },
  nodes: [task()],
  edges: []
});

describe("canvas history transactions", () => {
  beforeEach(() => {
    useScatterStore.getState().setProjectDocument(project, document());
  });

  it("records a multi-frame node drag as one undoable action", () => {
    const store = useScatterStore.getState();
    store.beginHistoryTransaction();

    [{ x: 30, y: 40 }, { x: 50, y: 60 }, { x: 70, y: 80 }].forEach((position) => {
      const current = useScatterStore.getState();
      current.commitCanvasChange({ nodes: current.nodes.map((node) => node.id === "task-1" ? { ...node, position } : node) });
    });
    useScatterStore.getState().commitHistoryTransaction();

    expect(useScatterStore.getState().history.past).toHaveLength(1);
    expect(useScatterStore.getState().nodes[0].position).toEqual({ x: 70, y: 80 });

    useScatterStore.getState().undo();
    expect(useScatterStore.getState().nodes[0].position).toEqual({ x: 10, y: 20 });
    expect(useScatterStore.getState().canUndo).toBe(false);

    useScatterStore.getState().redo();
    expect(useScatterStore.getState().nodes[0].position).toEqual({ x: 70, y: 80 });
  });
});
