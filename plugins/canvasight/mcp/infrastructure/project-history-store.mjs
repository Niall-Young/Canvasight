import { createHash, randomUUID } from "node:crypto";
import fsp from "node:fs/promises";
import path from "node:path";
import { buildProjectHistoryIndex, validateProjectHistoryEvent } from "../domain/project-history-domain.mjs";

function digest(value) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

const indexWriteQueues = new Map();

async function serializeIndexWrite(indexPath, operation) {
  const previous = indexWriteQueues.get(indexPath) ?? Promise.resolve();
  const current = previous.catch(() => undefined).then(operation);
  indexWriteQueues.set(indexPath, current);
  try {
    return await current;
  } finally {
    if (indexWriteQueues.get(indexPath) === current) indexWriteQueues.delete(indexPath);
  }
}

async function readJsonLines(filePath) {
  try {
    const content = await fsp.readFile(filePath, "utf8");
    return content.split(/\r?\n/u).filter(Boolean).map((line, index) => {
      try {
        return JSON.parse(line);
      } catch (error) {
        throw new Error(`invalid Project History journal line ${index + 1}`, { cause: error });
      }
    });
  } catch (error) {
    if (error?.code === "ENOENT") return [];
    throw error;
  }
}

export class ProjectHistoryStore {
  constructor(storageDirectory, { beforePersist } = {}) {
    this.storageDirectory = path.resolve(storageDirectory);
    this.journalPath = path.join(this.storageDirectory, "events.jsonl");
    this.indexPath = path.join(this.storageDirectory, "index.json");
    this.lockPath = path.join(this.storageDirectory, ".write-lock");
    this.beforePersist = beforePersist;
  }

  async initialize() {
    await fsp.mkdir(this.storageDirectory, { recursive: true });
    const events = await this.readEvents();
    await this.#writeIndex(events);
    return buildProjectHistoryIndex(events);
  }

  async readRecords() {
    return readJsonLines(this.journalPath);
  }

  async readEvents() {
    return (await this.readRecords()).map((record) => validateProjectHistoryEvent(record.event));
  }

  async hasReceipt(receiptId) {
    return (await this.readRecords()).some((record) => record.receiptId === receiptId);
  }

  async append(eventInput, receiptId) {
    const event = validateProjectHistoryEvent(eventInput);
    if (typeof receiptId !== "string" || !receiptId) throw new Error("history receiptId is required");
    await fsp.mkdir(this.storageDirectory, { recursive: true });
    try {
      await fsp.mkdir(this.lockPath);
    } catch (error) {
      if (error?.code === "EEXIST") throw new Error("Project History journal is locked by another writer");
      throw error;
    }
    try {
      const records = await this.readRecords();
      const prior = records.find((record) => record.receiptId === receiptId);
      if (prior) {
        if (digest(prior.event) !== digest(event)) throw new Error("history receipt was replayed with different content");
        const index = await this.#writeIndex(records.map((record) => record.event));
        return { duplicate: true, event: validateProjectHistoryEvent(prior.event), index };
      }
      if (records.some((record) => record.event.id === event.id)) throw new Error(`duplicate history event id: ${event.id}`);
      if (this.beforePersist) await this.beforePersist({ event, receiptId, recordCount: records.length });
      const record = { receiptId, event };
      const handle = await fsp.open(this.journalPath, "a", 0o600);
      try {
        await handle.write(`${JSON.stringify(record)}\n`, null, "utf8");
        await handle.sync();
      } finally {
        await handle.close();
      }
      const allEvents = [...records.map((item) => item.event), event];
      const index = await this.#writeIndex(allEvents);
      return { duplicate: false, event, index };
    } finally {
      await fsp.rmdir(this.lockPath);
    }
  }

  async readIndex() {
    // The journal is the source of truth. Rebuilding here also repairs the
    // narrow crash window after the journal fsync and before index rename.
    const events = await this.readEvents();
    const rebuilt = buildProjectHistoryIndex(events);
    try {
      const cached = JSON.parse(await fsp.readFile(this.indexPath, "utf8"));
      if (cached?.revision === rebuilt.revision && digest(cached) === digest(rebuilt)) return cached;
    } catch (error) {
      if (error?.code !== "ENOENT" && !(error instanceof SyntaxError)) throw error;
    }
    return this.#writeIndex(events);
  }

  async rebuild() {
    return this.#writeIndex(await this.readEvents());
  }

  async #writeIndex(events) {
    const index = buildProjectHistoryIndex(events);
    return serializeIndexWrite(this.indexPath, async () => {
      try {
        const current = JSON.parse(await fsp.readFile(this.indexPath, "utf8"));
        if (Number.isInteger(current?.revision) && current.revision > index.revision) return current;
        if (current?.revision === index.revision && digest(current) === digest(index)) return current;
      } catch (error) {
        if (error?.code !== "ENOENT" && !(error instanceof SyntaxError)) throw error;
      }

      const temporaryPath = `${this.indexPath}.${process.pid}.${randomUUID()}.tmp`;
      try {
        await fsp.writeFile(temporaryPath, `${JSON.stringify(index, null, 2)}\n`, { encoding: "utf8", mode: 0o600 });
        await fsp.rename(temporaryPath, this.indexPath);
      } finally {
        await fsp.rm(temporaryPath, { force: true });
      }
      return index;
    });
  }
}
