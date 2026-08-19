import fsp from "node:fs/promises";
import path from "node:path";

export class ProjectHistoryObserverState {
  constructor(storageDirectory) {
    this.filePath = path.join(storageDirectory, "provider-state.json");
    this.lockPath = path.join(storageDirectory, ".provider-write-lock");
  }

  async read() {
    try {
      const parsed = JSON.parse(await fsp.readFile(this.filePath, "utf8"));
      return {
        schemaVersion: 1,
        coverageStartedAt: typeof parsed.coverageStartedAt === "string" ? parsed.coverageStartedAt : null,
        observations: parsed.observations && typeof parsed.observations === "object" ? parsed.observations : {},
        activeCodexTurns: parsed.activeCodexTurns && typeof parsed.activeCodexTurns === "object" ? parsed.activeCodexTurns : {},
        external: parsed.external && typeof parsed.external === "object" ? parsed.external : null,
        providerCoverage: parsed.providerCoverage && typeof parsed.providerCoverage === "object" ? parsed.providerCoverage : null
      };
    } catch (error) {
      if (error?.code !== "ENOENT") throw error;
      return { schemaVersion: 1, coverageStartedAt: null, observations: {}, activeCodexTurns: {}, external: null, providerCoverage: null };
    }
  }

  async initializeCoverage(observations, coverageStartedAt = new Date().toISOString()) {
    return this.#mutate((current) => {
      if (current.coverageStartedAt) return current;
      const next = { ...current, coverageStartedAt, observations: { ...current.observations } };
      for (const observation of observations) next.observations[observation.id] = { status: observation.status, seenAt: coverageStartedAt };
      return next;
    });
  }

  async unprocessed(observations) {
    const current = await this.read();
    return observations.filter((observation) => !current.observations[observation.id]);
  }

  async markProcessed(observation, seenAt = new Date().toISOString()) {
    return this.#mutate((current) => ({
      ...current,
      observations: { ...current.observations, [observation.id]: { status: observation.status, seenAt } }
    }));
  }

  async markTurnActive({ taskId, turnId, cwd = null, promptSummary = null, startedAt = new Date().toISOString(), expiresAt }) {
    if (typeof taskId !== "string" || !taskId || typeof turnId !== "string" || !turnId) {
      throw new Error("Project History active Codex turn requires taskId and turnId");
    }
    const expiry = typeof expiresAt === "string" && Number.isFinite(Date.parse(expiresAt))
      ? new Date(expiresAt).toISOString()
      : new Date(Date.parse(startedAt) + 12 * 60 * 60 * 1000).toISOString();
    return this.#mutate((current) => ({
      ...current,
      activeCodexTurns: {
        ...current.activeCodexTurns,
        [`${taskId}:${turnId}`]: {
          taskId,
          turnId,
          cwd: typeof cwd === "string" && cwd ? cwd : null,
          promptSummary: typeof promptSummary === "string" && promptSummary ? promptSummary.slice(0, 160) : null,
          startedAt: new Date(startedAt).toISOString(),
          expiresAt: expiry
        }
      }
    }));
  }

  async markTurnStopped(taskId, turnId) {
    if (typeof taskId !== "string" || !taskId || typeof turnId !== "string" || !turnId) return this.read();
    return this.#mutate((current) => {
      const activeCodexTurns = { ...current.activeCodexTurns };
      delete activeCodexTurns[`${taskId}:${turnId}`];
      return { ...current, activeCodexTurns };
    });
  }

  async activeTurns(now = new Date()) {
    const current = await this.read();
    return Object.values(current.activeCodexTurns).filter((turn) =>
      turn && typeof turn.expiresAt === "string" && Number.isFinite(Date.parse(turn.expiresAt)) && Date.parse(turn.expiresAt) > now.getTime()
    );
  }

  async updateExternal(external) {
    return this.#mutate((current) => ({ ...current, external: structuredClone(external) }));
  }

  async updateProviderCoverage(providerCoverage) {
    return this.#mutate((current) => ({ ...current, providerCoverage: structuredClone(providerCoverage) }));
  }

  async #mutate(operation) {
    await fsp.mkdir(path.dirname(this.filePath), { recursive: true });
    let locked = false;
    for (let attempt = 0; attempt < 40 && !locked; attempt += 1) {
      try {
        await fsp.mkdir(this.lockPath);
        locked = true;
      } catch (error) {
        if (error?.code !== "EEXIST") throw error;
        try {
          const lock = await fsp.stat(this.lockPath);
          if (Date.now() - lock.mtimeMs > 10_000) await fsp.rmdir(this.lockPath);
        } catch (lockError) {
          if (lockError?.code !== "ENOENT" && lockError?.code !== "ENOTEMPTY") throw lockError;
        }
        await new Promise((resolve) => setTimeout(resolve, 25));
      }
    }
    if (!locked) throw new Error("Project History provider state is busy");
    try {
      const current = await this.read();
      const next = operation(current);
      await this.#write(next);
      return next;
    } finally {
      await fsp.rmdir(this.lockPath).catch(() => {});
    }
  }

  async #write(state) {
    await fsp.mkdir(path.dirname(this.filePath), { recursive: true });
    const temporaryPath = `${this.filePath}.${process.pid}.tmp`;
    await fsp.writeFile(temporaryPath, `${JSON.stringify(state, null, 2)}\n`, { encoding: "utf8", mode: 0o600 });
    await fsp.rename(temporaryPath, this.filePath);
  }
}
