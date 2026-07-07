import { nodeTemplateLimit } from "../../shared/types";
import type {
  AgentTeamRunConfig,
  Attachment,
  AttachmentInput,
  CodexMode,
  LanguagePreference,
  NodeTemplate,
  NodeTemplateInput,
  OpenProjectResult,
  RunMode,
  SaveDocumentResult,
  ScatterDocument
} from "../../shared/types";

export interface SessionInfo {
  codexThreadId?: string | null;
  documentRevision: number;
  language: LanguagePreference;
  projectPath: string | null;
  sessionId: string;
  threadClaimedAt?: string | null;
}

export interface RunPayload {
  attachments: Attachment[];
  agentTeam: AgentTeamRunConfig;
  codexMode: CodexMode;
  effort: string;
  imagePaths: string[];
  markdown: string;
  nodeIds: string[];
  planMode: boolean;
  projectPath: string;
  runMode: RunMode;
  sessionId: string;
  threadName: string;
}

export interface RunResponse {
  status: "prepared" | "queued" | "sent";
  delivery?: {
    status: "awaited" | "prepared" | "queued" | "sent";
    reason?: string;
    threadId?: string | null;
    via?: string;
    codexNative?: RunResponse["codexNative"];
    codexTurn?: RunResponse["codexTurn"];
  };
  codexNative?: {
    status: "applied" | "applied_chat" | "applied_goal" | "applied_plan" | "disabled" | "failed" | "not_applicable" | "pending" | "skipped";
    action?: string;
    collaborationMode?: string;
    error?: string;
    mode?: CodexMode;
    reason?: string;
    threadId?: string | null;
  };
  codexTurn?: {
    status: "failed" | "skipped" | "started";
    action?: string;
    appServerArgs?: string;
    clientUserMessageId?: string;
    confirmation?: {
      clientUserMessageId?: string | null;
      method?: string;
      threadId?: string | null;
      turnId?: string | null;
    } | null;
    confirmed?: boolean;
    error?: string;
    mode?: CodexMode;
    reason?: string;
    stderr?: string;
    threadId?: string | null;
    turnId?: string | null;
  };
  agentTeam?: AgentTeamRunConfig;
}

export interface CanvasightBridgeDiagnostics {
  canSendFollowUpMessage: boolean;
  canvasightHost: string | null;
  hasCanvasightMcp: boolean;
  hasCanvasightMcpSendFollowUp: boolean;
  hasWindowOpenAI: boolean;
  href: string;
  inIframe: boolean;
  sessionId: string;
  threadId: string;
  tokenPresent: boolean;
}

export interface ThreadClaimResponse {
  claimedAt: string;
  claimedSessionIds: string[];
  codexThreadId: string;
  projectPath: string;
  session: SessionInfo;
  sessionId: string;
  status: "claimed";
}

interface WidgetFollowUpMessage {
  content: Array<Record<string, unknown>>;
  prompt: string;
}

interface CanvasightWidgetRuntimeData {
  apiBaseUrl?: string;
  browserUrl?: string;
  canvasightHost?: string;
  codexThreadId?: string | null;
  origin?: string;
  projectPath?: string | null;
  sessionId?: string;
  threadId?: string | null;
  token?: string;
  url?: string;
}

type CanvasightWindow = Window &
  typeof globalThis & {
    __CANVASIGHT_WIDGET_DATA__?: CanvasightWidgetRuntimeData;
    canvasightMcp?: {
      runCanvasightNode?: (payload: RunPayload) => Promise<RunResponse>;
      sendFollowUpMessage?: (message: WidgetFollowUpMessage) => Promise<unknown>;
    };
    openai?: unknown;
  };

function widgetRuntimeData(): CanvasightWidgetRuntimeData {
  return ((window as CanvasightWindow).__CANVASIGHT_WIDGET_DATA__ ?? {}) as CanvasightWidgetRuntimeData;
}

function tokenFromRuntimeUrl(): string {
  const runtime = widgetRuntimeData();
  const url = runtime.url || runtime.browserUrl || "";
  if (!url) return "";
  try {
    return new URL(url).searchParams.get("token") || "";
  } catch {
    return "";
  }
}

function apiBaseUrl(): string {
  const runtime = widgetRuntimeData();
  const explicitBase = runtime.apiBaseUrl || runtime.origin || "";
  if (explicitBase) return explicitBase;
  const url = runtime.url || runtime.browserUrl || "";
  if (!url) return "";
  try {
    return new URL(url).origin;
  } catch {
    return "";
  }
}

function apiUrl(path: string): string {
  const baseUrl = apiBaseUrl();
  if (!baseUrl) return path;
  return new URL(path, baseUrl).toString();
}

function sessionIdFromUrl(): string {
  return new URLSearchParams(window.location.search).get("sessionId") || widgetRuntimeData().sessionId || "local";
}

function sessionTokenFromUrl(): string {
  return new URLSearchParams(window.location.search).get("token") || widgetRuntimeData().token || tokenFromRuntimeUrl();
}

export function threadIdFromUrl(): string {
  return new URLSearchParams(window.location.search).get("threadId") || widgetRuntimeData().threadId || widgetRuntimeData().codexThreadId || "";
}

export function projectPathFromUrl(): string {
  return (new URLSearchParams(window.location.search).get("projectPath") || widgetRuntimeData().projectPath || "").trim();
}

export function isThreadOnlyFallbackUrl(): boolean {
  const params = new URLSearchParams(window.location.search);
  const runtime = widgetRuntimeData();
  const threadId = params.get("threadId") || runtime.threadId || runtime.codexThreadId || "";
  if (!threadId.trim()) return false;
  return !projectPathFromUrl() && !(params.get("sessionId") || runtime.sessionId);
}

const templateStorageKey = "canvasight.nodeTemplates";

class CanvasightApiError extends Error {
  code?: string;
  payload: unknown;
  status: number;

  constructor(message: string, status: number, payload: unknown) {
    super(message);
    this.name = "CanvasightApiError";
    this.status = status;
    this.payload = payload;
    if (payload && typeof payload === "object" && "code" in payload && typeof payload.code === "string") {
      this.code = payload.code;
    }
  }
}

export function isCanvasightApiErrorCode(error: unknown, code: string): boolean {
  return error instanceof CanvasightApiError && error.code === code;
}

export class TemplateLimitError extends Error {
  currentCount: number;
  maxTemplates: number;

  constructor(maxTemplates = nodeTemplateLimit, currentCount = nodeTemplateLimit) {
    super(`Template limit reached (${maxTemplates})`);
    this.name = "TemplateLimitError";
    this.maxTemplates = maxTemplates;
    this.currentCount = currentCount;
  }
}

export function isTemplateLimitError(error: unknown): error is TemplateLimitError {
  return error instanceof TemplateLimitError || (error instanceof CanvasightApiError && error.status === 409 && error.code === "template_limit_reached");
}

function networkErrorPayload(path: string, targetUrl: string, error: unknown): Record<string, unknown> {
  const runtime = widgetRuntimeData();
  return {
    code: "network_error",
    path,
    url: targetUrl,
    apiBaseUrl: apiBaseUrl() || null,
    sessionId: sessionIdFromUrl(),
    tokenPresent: Boolean(sessionTokenFromUrl()),
    canvasightHost: runtime.canvasightHost || null,
    message: error instanceof Error ? error.message : String(error)
  };
}

function createTemplateId(): string {
  return typeof crypto?.randomUUID === "function" ? crypto.randomUUID() : `template-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function normalizeLocalAttachment(value: unknown): Attachment | null {
  if (!value || typeof value !== "object") return null;
  const attachment = value as Partial<Attachment>;
  return {
    id: typeof attachment.id === "string" && attachment.id ? attachment.id : createTemplateId(),
    kind: attachment.kind === "image" ? "image" : "file",
    source: attachment.source === "drop" || attachment.source === "paste" || attachment.source === "clipboard" ? attachment.source : "upload",
    originalName: typeof attachment.originalName === "string" && attachment.originalName ? attachment.originalName : "attachment",
    storedPath: typeof attachment.storedPath === "string" ? attachment.storedPath : "",
    relativePath: typeof attachment.relativePath === "string" ? attachment.relativePath : "",
    fileUrl: typeof attachment.fileUrl === "string" ? attachment.fileUrl : "",
    mime: typeof attachment.mime === "string" && attachment.mime ? attachment.mime : "application/octet-stream",
    size: typeof attachment.size === "number" && Number.isFinite(attachment.size) ? attachment.size : 0,
    createdAt: typeof attachment.createdAt === "string" && attachment.createdAt ? attachment.createdAt : new Date().toISOString()
  };
}

function normalizeLocalTemplate(value: unknown): NodeTemplate | null {
  if (!value || typeof value !== "object") return null;
  const template = value as Partial<NodeTemplate>;
  if (typeof template.body !== "string" || !template.body.trim()) return null;
  const now = new Date().toISOString();

  return {
    id: typeof template.id === "string" && template.id ? template.id : createTemplateId(),
    title: typeof template.title === "string" && template.title.trim() ? template.title.trim() : template.body.trim().slice(0, 40),
    body: template.body,
    attachments: Array.isArray(template.attachments)
      ? template.attachments.map(normalizeLocalAttachment).filter((attachment): attachment is Attachment => Boolean(attachment))
      : [],
    createdAt: typeof template.createdAt === "string" && template.createdAt ? template.createdAt : now,
    updatedAt: typeof template.updatedAt === "string" && template.updatedAt ? template.updatedAt : now
  };
}

function loadLocalTemplates(): NodeTemplate[] {
  try {
    const raw = window.localStorage.getItem(templateStorageKey);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalizeLocalTemplate).filter((template): template is NodeTemplate => Boolean(template));
  } catch {
    return [];
  }
}

function saveLocalTemplates(templates: NodeTemplate[]): void {
  window.localStorage.setItem(templateStorageKey, JSON.stringify(templates));
}

function saveLocalTemplate(input: NodeTemplateInput, options: { replaceOldest?: boolean } = {}): NodeTemplate {
  const now = new Date().toISOString();
  const body = input.body.trim();
  if (!body) throw new Error("Template body is required");
  const existingTemplates = loadLocalTemplates();
  if (existingTemplates.length >= nodeTemplateLimit && !options.replaceOldest) {
    throw new TemplateLimitError(nodeTemplateLimit, existingTemplates.length);
  }
  const template: NodeTemplate = {
    id: createTemplateId(),
    title: input.title.trim() || body.slice(0, 40),
    body,
    attachments: (input.attachments ?? []).map((attachment) => ({ ...attachment })),
    createdAt: now,
    updatedAt: now
  };
  const templates = options.replaceOldest ? [template, ...existingTemplates.slice(0, Math.max(0, existingTemplates.length - 1))] : [template, ...existingTemplates];
  saveLocalTemplates(templates);
  return template;
}

function deleteLocalTemplate(templateId: string): void {
  saveLocalTemplates(loadLocalTemplates().filter((template) => template.id !== templateId));
}

export function isStaleDocumentError(error: unknown): boolean {
  return error instanceof CanvasightApiError && error.status === 409 && error.code === "stale_document";
}

function shouldUseLocalTemplateStore(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return (
    message.includes("Failed to fetch") ||
    message.includes("API route not found") ||
    message.includes("Unexpected token") ||
    message.includes("404")
  );
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const token = sessionTokenFromUrl();
  const targetUrl = apiUrl(path);
  let response: Response;
  try {
    response = await fetch(targetUrl, {
      ...init,
      headers: {
        "content-type": "application/json",
        ...(token ? { "x-canvasight-token": token } : {}),
        ...(init?.headers ?? {})
      }
    });
  } catch (error) {
    throw new CanvasightApiError(`Canvasight API request failed: ${targetUrl}`, 0, networkErrorPayload(path, targetUrl, error));
  }
  if (!response.ok) {
    const detail = await response.text();
    let payload: unknown = null;
    let message = detail || `Request failed: ${response.status}`;
    try {
      payload = detail ? JSON.parse(detail) : null;
      if (payload && typeof payload === "object" && "error" in payload && typeof payload.error === "string") {
        message = payload.error;
      }
    } catch {
      payload = null;
    }
    throw new CanvasightApiError(message, response.status, payload);
  }
  return response.json() as Promise<T>;
}

function canAttemptWidgetFollowUp(): boolean {
  const bridgeWindow = window as CanvasightWindow;
  return typeof bridgeWindow.canvasightMcp?.sendFollowUpMessage === "function";
}

export function getCanvasightBridgeDiagnostics(): CanvasightBridgeDiagnostics {
  const query = new URLSearchParams(window.location.search);
  const bridgeWindow = window as CanvasightWindow;
  return {
    canSendFollowUpMessage: canAttemptWidgetFollowUp(),
    canvasightHost: query.get("canvasightHost") || widgetRuntimeData().canvasightHost || null,
    hasCanvasightMcp: Boolean(bridgeWindow.canvasightMcp),
    hasCanvasightMcpSendFollowUp: typeof bridgeWindow.canvasightMcp?.sendFollowUpMessage === "function",
    hasWindowOpenAI: Boolean(bridgeWindow.openai),
    href: window.location.href,
    inIframe: window.parent !== window,
    sessionId: sessionIdFromUrl(),
    threadId: threadIdFromUrl(),
    tokenPresent: Boolean(sessionTokenFromUrl())
  };
}

function sendWidgetFollowUpMessage(message: WidgetFollowUpMessage, timeoutMs = 9000): Promise<void> {
  void timeoutMs;
  if (!canAttemptWidgetFollowUp()) return Promise.reject(new Error("Canvasight native widget host bridge is not ready."));
  const directBridge = (window as CanvasightWindow).canvasightMcp?.sendFollowUpMessage;
  if (typeof directBridge === "function") {
    return directBridge(message).then(() => undefined);
  }
  return Promise.reject(new Error("Canvasight native widget host bridge is not ready."));
}

const expectedWidgetCodexStatus: Record<CodexMode, NonNullable<RunResponse["codexNative"]>["status"]> = {
  chat: "applied_chat",
  goal: "applied_goal",
  plan: "applied_plan"
};

function assertPreparedWidgetRun(payload: RunPayload, preparedRun: RunResponse): void {
  const expectedStatus = expectedWidgetCodexStatus[payload.codexMode];
  const actualStatus = preparedRun.codexNative?.status || preparedRun.delivery?.codexNative?.status;
  if (actualStatus !== expectedStatus) {
    const reason = preparedRun.codexNative?.error || preparedRun.delivery?.codexNative?.error || preparedRun.codexNative?.reason || preparedRun.delivery?.codexNative?.reason || actualStatus || "unknown";
    throw new Error(`Canvasight Run blocked before sendMessage: expected ${expectedStatus}, got ${reason}.`);
  }
}

async function runCanvasightNodeThroughWidget(payload: RunPayload): Promise<RunResponse> {
  const directRun = (window as CanvasightWindow).canvasightMcp?.runCanvasightNode;
  if (typeof directRun === "function") return directRun(payload);
  if (!canAttemptWidgetFollowUp()) throw new Error("Canvasight native widget host bridge is not ready.");
  const preparedRun = await canvasightApi.prepareWidgetRun(payload);
  assertPreparedWidgetRun(payload, preparedRun);
  await sendWidgetFollowUpMessage({
    prompt: payload.markdown,
    content: [{ type: "text", text: payload.markdown }]
  });
  return {
    ...preparedRun,
    status: "sent",
    delivery: {
      ...(preparedRun.delivery ?? {}),
      status: "sent",
      reason: "widget_bridge_sendMessage",
      via: "widget_bridge",
      codexNative: preparedRun.codexNative,
      codexTurn: preparedRun.codexTurn
    }
  };
}

async function fileInputToPayload(input: AttachmentInput): Promise<{
  dataBase64?: string;
  mime?: string;
  name: string;
  path?: string;
  source: AttachmentInput["source"];
}> {
  if (input.bytes) {
    const bytes = new Uint8Array(input.bytes);
    let binary = "";
    for (const byte of bytes) binary += String.fromCharCode(byte);
    return {
      dataBase64: btoa(binary),
      mime: input.mime,
      name: input.name,
      source: input.source
    };
  }

  return {
    mime: input.mime,
    name: input.name,
    path: input.path,
    source: input.source
  };
}

export const canvasightApi = {
  sessionId: sessionIdFromUrl(),
  token: sessionTokenFromUrl(),

  getSession(): Promise<SessionInfo> {
    return requestJson<SessionInfo>(`/api/sessions/${this.sessionId}`);
  },

  openProject(projectPath: string): Promise<OpenProjectResult> {
    return requestJson<OpenProjectResult>(`/api/sessions/${this.sessionId}/open-project`, {
      method: "POST",
      body: JSON.stringify({ projectPath })
    });
  },

  resolveThreadProject(threadId: string, language?: LanguagePreference): Promise<OpenProjectResult> {
    return requestJson<OpenProjectResult>(`/api/sessions/${this.sessionId}/resolve-thread-project`, {
      method: "POST",
      body: JSON.stringify({ language, threadId })
    });
  },

  claimThread(projectPath: string, threadId: string, language?: LanguagePreference): Promise<ThreadClaimResponse> {
    const path = this.sessionId === "local" ? "/api/sessions/local/claim" : "/api/sessions/claim";
    return requestJson<ThreadClaimResponse>(path, {
      method: "POST",
      body: JSON.stringify({
        language,
        projectPath,
        sessionId: this.sessionId,
        threadId
      })
    });
  },

  saveDocument(projectPath: string, document: ScatterDocument, expectedRevision: number | null): Promise<SaveDocumentResult> {
    return requestJson<SaveDocumentResult>(`/api/sessions/${this.sessionId}/document`, {
      method: "POST",
      body: JSON.stringify({ document, expectedRevision, projectPath })
    });
  },

  async saveAttachments(projectPath: string, inputs: AttachmentInput[]): Promise<Attachment[]> {
    const files = await Promise.all(inputs.map(fileInputToPayload));
    return requestJson<Attachment[]>(`/api/sessions/${this.sessionId}/attachments`, {
      method: "POST",
      body: JSON.stringify({ files, projectPath })
    });
  },

  run(payload: RunPayload): Promise<RunResponse> {
    return requestJson<RunResponse>(`/api/sessions/${this.sessionId}/run`, {
      method: "POST",
      body: JSON.stringify(payload)
    });
  },

  prepareWidgetRun(payload: RunPayload): Promise<RunResponse> {
    return requestJson<RunResponse>(`/api/sessions/${this.sessionId}/run`, {
      method: "POST",
      body: JSON.stringify({
        ...payload,
        deliveryMode: "widget_bridge_prepare"
      })
    });
  },

  runCanvasightNode(payload: RunPayload): Promise<RunResponse> {
    return runCanvasightNodeThroughWidget(payload);
  },

  canSendFollowUpMessage(): boolean {
    return canAttemptWidgetFollowUp();
  },

  diagnostics(): CanvasightBridgeDiagnostics {
    return getCanvasightBridgeDiagnostics();
  },

  sendFollowUpMessage(message: WidgetFollowUpMessage): Promise<void> {
    return sendWidgetFollowUpMessage(message);
  },

  showInFolder(targetPath: string): Promise<void> {
    return requestJson<void>(`/api/reveal`, {
      method: "POST",
      body: JSON.stringify({ targetPath })
    });
  },

  async listTemplates(): Promise<NodeTemplate[]> {
    try {
      return await requestJson<NodeTemplate[]>(`/api/templates`);
    } catch (error) {
      if (shouldUseLocalTemplateStore(error)) return loadLocalTemplates();
      throw error;
    }
  },

  async saveTemplate(template: NodeTemplateInput, options: { replaceOldest?: boolean } = {}): Promise<NodeTemplate> {
    try {
      return await requestJson<NodeTemplate>(`/api/templates`, {
        method: "POST",
        body: JSON.stringify({ template, replaceOldest: Boolean(options.replaceOldest) })
      });
    } catch (error) {
      if (shouldUseLocalTemplateStore(error)) return saveLocalTemplate(template, options);
      throw error;
    }
  },

  async deleteTemplate(templateId: string): Promise<void> {
    try {
      await requestJson<{ status: "deleted"; templateId: string }>(`/api/templates/${encodeURIComponent(templateId)}`, {
        method: "DELETE"
      });
    } catch (error) {
      if (shouldUseLocalTemplateStore(error)) {
        deleteLocalTemplate(templateId);
        return;
      }
      throw error;
    }
  }
};
