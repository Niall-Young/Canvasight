import fsp from "node:fs/promises";
import path from "node:path";

const MAX_BINDINGS = 512;

function normalizedThreadId(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizedProjectPath(value) {
  if (typeof value !== "string" || !value.trim()) return "";
  return path.resolve(value.trim());
}

function normalizedFeatureLineId(value) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function emptyState() {
  return { version: 1, bindings: [] };
}

function normalizeState(value) {
  const bindings = Array.isArray(value?.bindings)
    ? value.bindings.map((binding) => {
      const threadId = normalizedThreadId(binding?.threadId);
      const projectPath = normalizedProjectPath(binding?.projectPath);
      if (!threadId || !projectPath) return null;
      return {
        threadId,
        projectPath,
        featureLineId: normalizedFeatureLineId(binding?.featureLineId),
        source: typeof binding?.source === "string" && binding.source.trim() ? binding.source.trim().slice(0, 80) : "canvasight-session",
        firstBoundAt: typeof binding?.firstBoundAt === "string" && Number.isFinite(Date.parse(binding.firstBoundAt))
          ? new Date(binding.firstBoundAt).toISOString()
          : new Date(0).toISOString(),
        lastBoundAt: typeof binding?.lastBoundAt === "string" && Number.isFinite(Date.parse(binding.lastBoundAt))
          ? new Date(binding.lastBoundAt).toISOString()
          : new Date(0).toISOString()
      };
    }).filter(Boolean)
    : [];
  return { version: 1, bindings: bindings.slice(-MAX_BINDINGS) };
}

export class ProjectHistoryTaskBindingStore {
  constructor(canvasightHome) {
    this.filePath = path.join(path.resolve(canvasightHome), "project-history-task-bindings.json");
  }

  async read() {
    try {
      return normalizeState(JSON.parse(await fsp.readFile(this.filePath, "utf8")));
    } catch (error) {
      if (error?.code === "ENOENT" || error instanceof SyntaxError) return emptyState();
      throw error;
    }
  }

  async bind({ threadId, projectPath, featureLineId = null, source = "canvasight-session" }) {
    const normalizedThread = normalizedThreadId(threadId);
    const normalizedProject = normalizedProjectPath(projectPath);
    if (!normalizedThread || !normalizedProject) return null;
    const current = await this.read();
    const now = new Date().toISOString();
    const existing = current.bindings.find((binding) => binding.threadId === normalizedThread && binding.projectPath === normalizedProject);
    const nextBinding = {
      threadId: normalizedThread,
      projectPath: normalizedProject,
      featureLineId: normalizedFeatureLineId(featureLineId) ?? existing?.featureLineId ?? null,
      source: typeof source === "string" && source.trim() ? source.trim().slice(0, 80) : existing?.source ?? "canvasight-session",
      firstBoundAt: existing?.firstBoundAt ?? now,
      lastBoundAt: now
    };
    const bindings = current.bindings
      .filter((binding) => !(binding.threadId === normalizedThread && binding.projectPath === normalizedProject))
      .concat(nextBinding)
      .slice(-MAX_BINDINGS);
    await this.#write({ version: 1, bindings });
    return nextBinding;
  }

  async bindingsForThread(threadId) {
    const normalizedThread = normalizedThreadId(threadId);
    if (!normalizedThread) return [];
    const state = await this.read();
    return state.bindings
      .filter((binding) => binding.threadId === normalizedThread)
      .sort((left, right) => right.lastBoundAt.localeCompare(left.lastBoundAt));
  }

  async #write(state) {
    await fsp.mkdir(path.dirname(this.filePath), { recursive: true });
    const temporaryPath = `${this.filePath}.${process.pid}.tmp`;
    await fsp.writeFile(temporaryPath, `${JSON.stringify(normalizeState(state), null, 2)}\n`, { encoding: "utf8", mode: 0o600 });
    await fsp.rename(temporaryPath, this.filePath);
  }
}
