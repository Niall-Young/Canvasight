import fsp from "node:fs/promises";
import path from "node:path";

const DEFAULT_VIEW = {
  schemaVersion: 1,
  revision: 0,
  viewport: { x: 0, y: 0, zoom: 1 },
  positions: {},
  collapsedGroupIds: [],
  filters: { query: "", status: "all", source: "all" }
};

export class ProjectHistoryViewStore {
  constructor(storageDirectory) {
    this.filePath = path.join(storageDirectory, "view.json");
    this.lockPath = path.join(storageDirectory, ".view-write-lock");
  }

  async read() {
    try {
      const value = JSON.parse(await fsp.readFile(this.filePath, "utf8"));
      return {
        ...structuredClone(DEFAULT_VIEW),
        ...value,
        viewport: { ...DEFAULT_VIEW.viewport, ...(value.viewport ?? {}) },
        positions: value.positions && typeof value.positions === "object" ? value.positions : {},
        collapsedGroupIds: Array.isArray(value.collapsedGroupIds) ? value.collapsedGroupIds.filter((item) => typeof item === "string") : [],
        filters: { ...DEFAULT_VIEW.filters, ...(value.filters ?? {}) }
      };
    } catch (error) {
      if (error?.code === "ENOENT") return structuredClone(DEFAULT_VIEW);
      throw error;
    }
  }

  async save(input, expectedRevision) {
    await fsp.mkdir(path.dirname(this.filePath), { recursive: true });
    try {
      await fsp.mkdir(this.lockPath);
    } catch (error) {
      if (error?.code === "EEXIST") throw new Error("Project History view changed concurrently");
      throw error;
    }
    try {
      const current = await this.read();
      if (current.revision !== expectedRevision) throw new Error("Project History view changed concurrently");
      const next = {
      schemaVersion: 1,
      revision: current.revision + 1,
      viewport: {
        x: Number.isFinite(input?.viewport?.x) ? input.viewport.x : current.viewport.x,
        y: Number.isFinite(input?.viewport?.y) ? input.viewport.y : current.viewport.y,
        zoom: Number.isFinite(input?.viewport?.zoom) ? Math.max(0.2, Math.min(2, input.viewport.zoom)) : current.viewport.zoom
      },
      positions: input?.positions && typeof input.positions === "object" ? structuredClone(input.positions) : current.positions,
      collapsedGroupIds: Array.isArray(input?.collapsedGroupIds) ? [...new Set(input.collapsedGroupIds.filter((item) => typeof item === "string"))] : current.collapsedGroupIds,
      filters: {
        query: typeof input?.filters?.query === "string" ? input.filters.query.slice(0, 200) : current.filters.query,
        status: typeof input?.filters?.status === "string" ? input.filters.status : current.filters.status,
        source: typeof input?.filters?.source === "string" ? input.filters.source : current.filters.source
      }
    };
      const temporaryPath = `${this.filePath}.${process.pid}.${expectedRevision}.tmp`;
      await fsp.writeFile(temporaryPath, `${JSON.stringify(next, null, 2)}\n`, { encoding: "utf8", mode: 0o600 });
      await fsp.rename(temporaryPath, this.filePath);
      return next;
    } finally {
      await fsp.rmdir(this.lockPath);
    }
  }
}
