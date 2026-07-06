import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import crypto from "node:crypto";
import { spawn } from "node:child_process";
import fs from "node:fs";
import fsp from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const defaultProjectPath = path.resolve(process.env.VITE_CANVASIGHT_DEFAULT_PROJECT_PATH || path.resolve(__dirname, "../.."));
process.env.VITE_CANVASIGHT_DEFAULT_PROJECT_PATH = defaultProjectPath;
const pluginRoot = __dirname;
const serverPath = path.join(pluginRoot, "mcp", "server.mjs");
const packageJson = JSON.parse(fs.readFileSync(path.join(pluginRoot, "package.json"), "utf8")) as { version?: string };
const serverVersion = typeof packageJson.version === "string" ? packageJson.version : "";
const defaultCanvasightHome = path.join(os.homedir(), ".canvasight");
type DaemonState = {
  origin: string;
  pid: number | null;
  pluginRoot: string;
  port: number | null;
  serverVersion: string;
  startedAt: string;
  token: string;
  version: 1;
};
type DevSession = {
  daemonSessionId?: string;
  id: string;
  language: "zh";
  projectPath: string;
  runQueue: unknown[];
};
const devSessions = new Map<string, DevSession>();
const projectDocumentRevisions = new Map<string, number>();
const projectWriteLocks = new Map<string, Promise<unknown>>();

function nowIso(): string {
  return new Date().toISOString();
}

function projectNameFromPath(projectPath: string): string {
  return path.basename(projectPath) || projectPath;
}

function canvasightHome(): string {
  const configured = process.env.CANVASIGHT_HOME;
  return path.resolve(typeof configured === "string" && configured.trim() ? configured : defaultCanvasightHome);
}

function canvasightDaemonStatePath(): string {
  return path.join(canvasightHome(), "daemon.json");
}

function normalizeDaemonState(value: unknown): DaemonState | null {
  if (!value || typeof value !== "object") return null;
  const state = value as Partial<DaemonState>;
  if (typeof state.origin !== "string" || !state.origin.startsWith("http://127.0.0.1:")) return null;
  return {
    version: 1,
    pid: Number.isFinite(Number(state.pid)) ? Number(state.pid) : null,
    origin: state.origin,
    port: Number.isFinite(Number(state.port)) ? Number(state.port) : null,
    token: typeof state.token === "string" ? state.token : "",
    pluginRoot: typeof state.pluginRoot === "string" ? state.pluginRoot : "",
    serverVersion: typeof state.serverVersion === "string" ? state.serverVersion : "",
    startedAt: typeof state.startedAt === "string" ? state.startedAt : ""
  };
}

async function readDaemonState(): Promise<DaemonState | null> {
  try {
    const raw = await fsp.readFile(canvasightDaemonStatePath(), "utf8");
    return normalizeDaemonState(JSON.parse(raw));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT" || error instanceof SyntaxError) return null;
    throw error;
  }
}

function daemonHeaders(state: DaemonState, headers: Record<string, string> = {}): Record<string, string> {
  return {
    ...(state.token ? { "x-canvasight-token": state.token } : {}),
    ...headers
  };
}

async function daemonJson<T = unknown>(state: DaemonState, route: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(new URL(route, state.origin), {
    ...init,
    headers: daemonHeaders(state, {
      ...(init.body ? { "content-type": "application/json" } : {}),
      ...((init.headers as Record<string, string> | undefined) ?? {})
    })
  });
  const text = await response.text();
  if (!response.ok) throw new Error(text || `Canvasight daemon request failed: ${response.status}`);
  return (text ? JSON.parse(text) : null) as T;
}

async function healthyDaemonState(state: DaemonState | null): Promise<DaemonState | null> {
  if (!state) return null;
  try {
    const health = await daemonJson<Partial<DaemonState> & { status?: string }>(
      { ...state, token: "" },
      "/api/health"
    );
    if (health.status !== "ok" || health.pluginRoot !== pluginRoot || health.serverVersion !== serverVersion) return null;
    return {
      ...state,
      origin: health.origin || state.origin,
      port: Number.isFinite(Number(health.port)) ? Number(health.port) : state.port,
      pid: Number.isFinite(Number(health.pid)) ? Number(health.pid) : state.pid
    };
  } catch {
    return null;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForDaemon(token: string): Promise<DaemonState> {
  const deadline = Date.now() + 8000;
  while (Date.now() < deadline) {
    const state = await readDaemonState();
    if (state && state.token === token) {
      const healthy = await healthyDaemonState(state);
      if (healthy) return healthy;
    }
    await sleep(120);
  }
  throw new Error("Canvasight daemon did not start in time");
}

async function ensureDaemonServer(): Promise<DaemonState> {
  const existing = await healthyDaemonState(await readDaemonState());
  if (existing) return existing;

  const token = crypto.randomBytes(24).toString("base64url");
  const child = spawn(process.execPath, [serverPath, "--daemon"], {
    cwd: pluginRoot,
    detached: true,
    stdio: "ignore",
    env: {
      ...process.env,
      CANVASIGHT_DAEMON_TOKEN: token
    }
  });
  child.unref();
  return waitForDaemon(token);
}

function projectRevisionKey(projectPath: string): string {
  return path.resolve(projectPath);
}

function projectDocumentRevision(projectPath: string): number {
  return projectDocumentRevisions.get(projectRevisionKey(projectPath)) || 0;
}

function bumpProjectDocumentRevision(projectPath: string): number {
  const key = projectRevisionKey(projectPath);
  const revision = (projectDocumentRevisions.get(key) || 0) + 1;
  projectDocumentRevisions.set(key, revision);
  return revision;
}

async function withProjectWriteLock<T>(projectPath: string, operation: () => Promise<T>): Promise<T> {
  const key = projectRevisionKey(projectPath);
  const previous = projectWriteLocks.get(key) || Promise.resolve();
  let release = (): void => {};
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  const current = previous.catch(() => undefined).then(() => gate);
  projectWriteLocks.set(key, current);
  await previous.catch(() => undefined);
  try {
    return await operation();
  } finally {
    release();
    if (projectWriteLocks.get(key) === current) projectWriteLocks.delete(key);
  }
}

function assertCurrentDocumentRevision(projectPath: string, expectedRevision: unknown): void {
  if (typeof expectedRevision !== "number" || !Number.isFinite(expectedRevision)) {
    const error = new Error("Canvasight document revision is required. Reload required.") as Error & { statusCode?: number; code?: string };
    error.statusCode = 409;
    error.code = "stale_document";
    throw error;
  }
  if (expectedRevision !== projectDocumentRevision(projectPath)) {
    const error = new Error("Canvasight document changed outside this session. Reload required.") as Error & { statusCode?: number; code?: string };
    error.statusCode = 409;
    error.code = "stale_document";
    throw error;
  }
}

function scatterDir(projectPath: string): string {
  return path.join(projectPath, ".scatter");
}

function scatterPath(projectPath: string): string {
  return path.join(scatterDir(projectPath), "scatter.json");
}

function scatterAssetsDir(projectPath: string): string {
  return path.join(scatterDir(projectPath), "assets");
}

function defaultScatterDocument(projectPath: string): Record<string, unknown> {
  return {
    version: 1,
    projectName: projectNameFromPath(projectPath),
    updatedAt: nowIso(),
    viewport: { x: 0, y: 0, zoom: 1 },
    nodes: [],
    edges: []
  };
}

async function ensureScatterLayout(projectPath: string): Promise<void> {
  await fsp.mkdir(projectPath, { recursive: true });
  await fsp.mkdir(scatterAssetsDir(projectPath), { recursive: true });
}

async function readScatterDocument(projectPath: string): Promise<Record<string, unknown>> {
  await ensureScatterLayout(projectPath);
  try {
    return JSON.parse(await fsp.readFile(scatterPath(projectPath), "utf8")) as Record<string, unknown>;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    const document = defaultScatterDocument(projectPath);
    await writeScatterDocument(projectPath, document);
    return document;
  }
}

async function writeScatterDocument(projectPath: string, document: Record<string, unknown>): Promise<Record<string, unknown>> {
  await ensureScatterLayout(projectPath);
  const normalized = {
    ...defaultScatterDocument(projectPath),
    ...document,
    version: 1,
    projectName: typeof document.projectName === "string" && document.projectName ? document.projectName : projectNameFromPath(projectPath),
    updatedAt: nowIso()
  };
  await fsp.writeFile(scatterPath(projectPath), `${JSON.stringify(normalized, null, 2)}\n`, "utf8");
  return normalized;
}

function devSession(id: string): DevSession {
  const existing = devSessions.get(id);
  if (existing) return existing;
  const session = { id, language: "zh" as const, projectPath: defaultProjectPath, runQueue: [] };
  devSessions.set(id, session);
  return session;
}

function unboundDevSessionError(): Error & { statusCode?: number; code?: string } {
  const error = new Error(
    "Dev preview is not claimed by a Codex thread. Call claim_canvasight_thread or open_canvasight from the current thread before running nodes."
  ) as Error & { statusCode?: number; code?: string };
  error.statusCode = 409;
  error.code = "unbound_dev_session";
  return error;
}

async function ensureDevDaemonSession(session: DevSession): Promise<{ daemon: DaemonState; sessionId: string }> {
  const daemon = await ensureDaemonServer();
  if (session.daemonSessionId) {
    try {
      const info = await daemonJson<{ codexThreadId: string | null; projectPath: string | null }>(
        daemon,
        `/api/sessions/${encodeURIComponent(session.daemonSessionId)}`
      );
      if (info.projectPath && path.resolve(info.projectPath) === path.resolve(session.projectPath) && info.codexThreadId) {
        return {
          daemon,
          sessionId: session.daemonSessionId
        };
      }
    } catch {
      session.daemonSessionId = undefined;
    }
  }

  const resolved = await daemonJson<{
    status: "resolved" | "unbound";
    session: { codexThreadId: string | null; projectPath: string | null; sessionId: string } | null;
  }>(daemon, "/api/sessions/resolve", {
    method: "POST",
    body: JSON.stringify({
      projectPath: session.projectPath
    })
  });
  if (resolved.status === "resolved" && resolved.session?.sessionId && resolved.session.codexThreadId) {
    session.daemonSessionId = resolved.session.sessionId;
    return {
      daemon,
      sessionId: session.daemonSessionId
    };
  }

  throw unboundDevSessionError();
}

function sendJson(res: { statusCode: number; setHeader(name: string, value: string): void; end(body?: string): void }, statusCode: number, payload: unknown): void {
  const body = JSON.stringify(payload);
  res.statusCode = statusCode;
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.end(body);
}

function sendNoContent(res: { statusCode: number; end(): void }): void {
  res.statusCode = 204;
  res.end();
}

function readJsonBody(req: NodeJS.ReadableStream): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
    req.on("end", () => {
      const raw = Buffer.concat(chunks).toString("utf8");
      if (!raw.trim()) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(raw) as Record<string, unknown>);
      } catch (error) {
        reject(error);
      }
    });
    req.on("error", reject);
  });
}

function normalizedProjectPath(value: unknown, fallback: string): string {
  return path.resolve(typeof value === "string" && value.trim() ? value : fallback);
}

function safeFileName(name: unknown): string {
  const base = path.basename(typeof name === "string" && name.trim() ? name : "attachment");
  return base.replace(/[<>:"/\\|?*\x00-\x1f]/g, "-").replace(/\s+/g, " ").trim().slice(0, 140) || "attachment";
}

function mimeFromPath(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".jpeg" || ext === ".jpg") return "image/jpeg";
  if (ext === ".png") return "image/png";
  if (ext === ".gif") return "image/gif";
  if (ext === ".webp") return "image/webp";
  if (ext === ".svg") return "image/svg+xml";
  return "application/octet-stream";
}

function base64UrlEncode(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}

function base64UrlDecode(value: string | null): string {
  return Buffer.from(String(value || ""), "base64url").toString("utf8");
}

function toRelativeProjectPath(projectPath: string, targetPath: string): string {
  return path.relative(projectPath, targetPath).split(path.sep).join("/");
}

async function saveDevAttachments(projectPath: string, files: unknown): Promise<Record<string, unknown>[]> {
  if (!Array.isArray(files)) return [];
  await ensureScatterLayout(projectPath);
  const saved: Record<string, unknown>[] = [];
  for (const item of files) {
    const input = item && typeof item === "object" ? (item as Record<string, unknown>) : {};
    const originalName = safeFileName(input.name);
    const mime = typeof input.mime === "string" && input.mime ? input.mime : mimeFromPath(originalName);
    const storedPath = path.join(scatterAssetsDir(projectPath), `${Date.now()}-${crypto.randomBytes(4).toString("hex")}-${originalName}`);
    const sourcePath = typeof input.path === "string" ? input.path : "";
    const bytes =
      typeof input.dataBase64 === "string"
        ? Buffer.from(input.dataBase64, "base64")
        : sourcePath
          ? await fsp.readFile(path.resolve(sourcePath))
          : Buffer.alloc(0);
    await fsp.writeFile(storedPath, bytes);
    saved.push({
      id: crypto.randomUUID(),
      kind: mime.toLowerCase().startsWith("image/") ? "image" : "file",
      source: typeof input.source === "string" ? input.source : "upload",
      originalName,
      storedPath,
      relativePath: toRelativeProjectPath(projectPath, storedPath),
      fileUrl: `/api/asset?path=${encodeURIComponent(base64UrlEncode(storedPath))}`,
      mime,
      size: bytes.length,
      createdAt: nowIso()
    });
  }
  return saved;
}

function canvasightDevApiPlugin() {
  return {
    name: "canvasight-dev-api",
    configureServer(server: { middlewares: { use(handler: (req: unknown, res: unknown, next: () => void) => void): void } }) {
      server.middlewares.use((request, response, next) => {
        const req = request as NodeJS.ReadableStream & { method?: string; url?: string };
        const res = response as { statusCode: number; setHeader(name: string, value: string): void; end(body?: string | Buffer): void };
        void (async () => {
          const url = new URL(req.url || "/", "http://127.0.0.1");
          if (req.method === "OPTIONS") {
            sendNoContent(res);
            return;
          }
          if (url.pathname === "/api/asset") {
            const assetPath = path.resolve(base64UrlDecode(url.searchParams.get("path")));
            const stat = await fsp.stat(assetPath);
            res.statusCode = 200;
            res.setHeader("content-type", mimeFromPath(assetPath));
            res.setHeader("content-length", String(stat.size));
            fs.createReadStream(assetPath).pipe(res as unknown as NodeJS.WritableStream);
            return;
          }
          if (url.pathname === "/api/reveal") {
            sendJson(res, 200, {});
            return;
          }
          const sessionMatch = url.pathname.match(/^\/api\/sessions\/([^/]+)(?:\/([^/]+))?$/);
          if (!sessionMatch) {
            next();
            return;
          }
          const session = devSession(decodeURIComponent(sessionMatch[1]));
          const action = sessionMatch[2] || "";
          if (!action) {
            sendJson(res, 200, {
              documentRevision: projectDocumentRevision(session.projectPath),
              language: session.language,
              projectPath: session.projectPath,
              sessionId: session.id
            });
            return;
          }
          const body = await readJsonBody(req);
          const projectPath = normalizedProjectPath(body.projectPath, session.projectPath);
          session.projectPath = projectPath;
          if (action === "open-project") {
            const document = await readScatterDocument(projectPath);
            sendJson(res, 200, {
              documentRevision: projectDocumentRevision(projectPath),
              project: {
                name: projectNameFromPath(projectPath),
                path: projectPath,
                updatedAt: typeof document.updatedAt === "string" ? document.updatedAt : nowIso()
              },
              document
            });
            return;
          }
          if (action === "document") {
            const result = await withProjectWriteLock(projectPath, async () => {
              assertCurrentDocumentRevision(projectPath, body.expectedRevision);
              const document = await writeScatterDocument(projectPath, (body.document || {}) as Record<string, unknown>);
              return {
                document,
                documentRevision: bumpProjectDocumentRevision(projectPath)
              };
            });
            sendJson(res, 200, result);
            return;
          }
          if (action === "attachments") {
            sendJson(res, 200, await saveDevAttachments(projectPath, body.files));
            return;
          }
          if (action === "claim") {
            const threadId = typeof body.threadId === "string" ? body.threadId.trim() : "";
            if (!threadId) {
              const error = unboundDevSessionError();
              error.message = "Cannot claim Canvasight without a Codex thread id.";
              error.code = "missing_thread_id";
              error.statusCode = 400;
              throw error;
            }
            const daemon = await ensureDaemonServer();
            const claimed = await daemonJson<{ sessionId: string }>(daemon, "/api/sessions/claim", {
              method: "POST",
              body: JSON.stringify({
                language: body.language || session.language,
                projectPath,
                sessionId: session.daemonSessionId || "",
                threadId
              })
            });
            session.daemonSessionId = claimed.sessionId;
            sendJson(res, 200, claimed);
            return;
          }
          if (action === "run") {
            const { daemon, sessionId } = await ensureDevDaemonSession(session);
            const result = await daemonJson(daemon, `/api/sessions/${encodeURIComponent(sessionId)}/run`, {
              method: "POST",
              body: JSON.stringify({
                ...body,
                projectPath,
                sessionId
              })
            });
            sendJson(res, 200, result);
            return;
          }
          sendJson(res, 404, { error: "API route not found" });
        })().catch((error) => {
          const statusCode =
            typeof (error as { statusCode?: unknown }).statusCode === "number" ? ((error as { statusCode: number }).statusCode) : 500;
          const code = typeof (error as { code?: unknown }).code === "string" ? (error as { code: string }).code : undefined;
          sendJson(res, statusCode, {
            ...(code ? { code } : {}),
            error: error instanceof Error ? error.message : "Internal server error"
          });
        });
      });
    }
  };
}

export default defineConfig({
  plugins: [canvasightDevApiPlugin(), react()],
  server: {
    host: "127.0.0.1"
  },
  preview: {
    host: "127.0.0.1"
  }
});
