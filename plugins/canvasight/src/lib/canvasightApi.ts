import { nodeTemplateLimit } from "../../shared/types";
import type {
  AgentTeamRunConfig,
  Attachment,
  AttachmentInput,
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
  openAttempt?: {
    openAttemptId: string;
    status: string;
    stage: CanvasightStartupStage;
    targetDisplayMode: string;
  } | null;
  threadClaimedAt?: string | null;
}

export interface RunPayload {
  attachments: Attachment[];
  agentTeam: AgentTeamRunConfig;
  effort: string;
  imagePaths: string[];
  markdown: string;
  nodeIds: string[];
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
    status: "applied" | "applied_chat" | "disabled" | "failed" | "not_applicable" | "pending" | "preflight_degraded_chat" | "skipped";
    action?: string;
    collaborationMode?: string;
    error?: string;
    errorCode?:
      | "desktop_runtime_unavailable"
      | "thread_archive_incompatible"
      | "codex_native_mode_request_failed";
    reason?: string;
    path?: "direct" | "resume_retry";
    rawError?: string;
    runtimeBin?: string | null;
    runtimeIsDesktop?: boolean;
    runtimeSource?: "explicit_override" | "codex_desktop" | "chatgpt_desktop" | "path_fallback" | null;
    runtimeVersion?: string | null;
    threadId?: string | null;
    transport?: string | null;
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
    reason?: string;
    stderr?: string;
    threadId?: string | null;
    turnId?: string | null;
  };
  agentTeam?: AgentTeamRunConfig;
}

export interface CanvasightBridgeDiagnostics {
  bridgeReason: string | null;
  bridgeTransport: "mcp_ui_message" | "openai_compat_followup" | "none" | null;
  canSendFollowUpMessage: boolean;
  canvasightHost: string | null;
  hasCanvasightMcp: boolean;
  hasCanvasightMcpSendFollowUp: boolean;
  hostCapabilitiesMessage: boolean;
  lastBridgeError: string | null;
  mcpInitialized: boolean;
  openaiFollowUpAvailable: boolean;
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

interface CanvasightBridgeState {
  bridgeTransport?: "mcp_ui_message" | "openai_compat_followup" | "none";
  hostCapabilitiesMessage?: boolean;
  lastBridgeError?: string | null;
  mcpInitialized?: boolean;
  openaiFollowUpAvailable?: boolean;
  reason?: string | null;
  displayMode?: "inline" | "fullscreen" | "pip" | "unknown";
  startupStage?: CanvasightStartupStage;
  widgetInstanceId?: string;
}

export type CanvasightStartupStage =
  | "starting"
  | "connecting_bridge"
  | "connecting_session"
  | "hydrating_project"
  | "ready"
  | "failed";

interface CanvasightWidgetRuntimeData {
  apiBaseUrl?: string;
  browserUrl?: string;
  canvasightHost?: string;
  codexThreadId?: string | null;
  origin?: string;
  openAttemptId?: string;
  projectPath?: string | null;
  sessionId?: string;
  threadId?: string | null;
  token?: string;
  targetDisplayMode?: string;
  url?: string;
  widgetInstanceId?: string;
}

type CanvasightWindow = Window &
  typeof globalThis & {
    __CANVASIGHT_WIDGET_DATA__?: CanvasightWidgetRuntimeData;
    __CANVASIGHT_WIDGET_BOOTSTRAP_TIMEOUT_MS__?: number;
    __CANVASIGHT_WIDGET_SHELL__?: boolean;
    canvasightMcp?: {
      callServerTool?: (request: Record<string, unknown>, options?: Record<string, unknown>) => Promise<unknown>;
      canSendFollowUpMessage?: () => boolean;
      getBridgeState?: () => CanvasightBridgeState;
      setStartupStage?: (stage: CanvasightStartupStage) => void;
      runCanvasightNode?: (payload: RunPayload) => Promise<RunResponse>;
      sendFollowUpMessage?: (message: WidgetFollowUpMessage) => Promise<unknown>;
    };
    openai?: unknown;
  };

function widgetRuntimeData(): CanvasightWidgetRuntimeData {
  return ((window as CanvasightWindow).__CANVASIGHT_WIDGET_DATA__ ?? {}) as CanvasightWidgetRuntimeData;
}

const defaultWidgetRuntimeTimeoutMs = 10_000;
let widgetRuntimeWaitPromise: Promise<CanvasightWidgetRuntimeData> | null = null;

export function isNativeWidgetShell(): boolean {
  const runtime = widgetRuntimeData();
  return Boolean((window as CanvasightWindow).__CANVASIGHT_WIDGET_SHELL__ || runtime.canvasightHost === "widget");
}

function widgetRuntimeReady(): boolean {
  if (!isNativeWidgetShell()) return true;
  const runtime = widgetRuntimeData();
  const sessionId = runtime.sessionId || "";
  const baseUrl = runtime.apiBaseUrl || runtime.origin || runtime.url || runtime.browserUrl || "";
  return Boolean(
    sessionId &&
    sessionId !== "local" &&
    baseUrl &&
    runtime.openAttemptId &&
    runtime.widgetInstanceId
  );
}

export function setCanvasightStartupStage(stage: CanvasightStartupStage): void {
  (window as CanvasightWindow).canvasightMcp?.setStartupStage?.(stage);
  window.dispatchEvent(new CustomEvent("canvasight:startup-stage", { detail: { stage } }));
}

export function getCanvasightStartupIdentity(): {
  openAttemptId: string;
  widgetInstanceId: string;
  displayMode: string;
  threadId: string;
  stage: CanvasightStartupStage;
} {
  const runtime = widgetRuntimeData();
  const bridge = (window as CanvasightWindow).canvasightMcp?.getBridgeState?.();
  return {
    openAttemptId: runtime.openAttemptId || "",
    widgetInstanceId: runtime.widgetInstanceId || bridge?.widgetInstanceId || "",
    displayMode: bridge?.displayMode || "unknown",
    threadId: runtime.threadId || runtime.codexThreadId || "",
    stage: bridge?.startupStage || "starting"
  };
}

function widgetRuntimeTimeoutMs(): number {
  const configured = Number((window as CanvasightWindow).__CANVASIGHT_WIDGET_BOOTSTRAP_TIMEOUT_MS__);
  return Number.isFinite(configured) && configured > 0 ? configured : defaultWidgetRuntimeTimeoutMs;
}

export function waitForCanvasightRuntimeData(): Promise<CanvasightWidgetRuntimeData> {
  if (widgetRuntimeReady()) return Promise.resolve(widgetRuntimeData());
  if (widgetRuntimeWaitPromise) return widgetRuntimeWaitPromise;

  widgetRuntimeWaitPromise = new Promise<CanvasightWidgetRuntimeData>((resolve, reject) => {
    const timeoutMs = widgetRuntimeTimeoutMs();
    const timer = window.setTimeout(() => {
      cleanup();
      reject(new Error(`Canvasight session metadata timed out after ${timeoutMs}ms.`));
    }, timeoutMs);
    const handleWidgetData = () => {
      if (!widgetRuntimeReady()) return;
      cleanup();
      resolve(widgetRuntimeData());
    };
    const cleanup = () => {
      window.clearTimeout(timer);
      window.removeEventListener("canvasight:widget-data", handleWidgetData);
    };
    window.addEventListener("canvasight:widget-data", handleWidgetData);
    handleWidgetData();
  }).finally(() => {
    widgetRuntimeWaitPromise = null;
  });

  return widgetRuntimeWaitPromise;
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

export function canvasightAssetUrl(path: string): string {
  return apiUrl(path);
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
  await waitForCanvasightRuntimeData();
  const bridgeWindow = window as CanvasightWindow;
  const callServerTool = bridgeWindow.canvasightMcp?.callServerTool;
  if (isNativeWidgetShell() && typeof callServerTool === "function") {
    const method = (init?.method || "GET").toUpperCase();
    let body: unknown = null;
    if (typeof init?.body === "string" && init.body) {
      try {
        body = JSON.parse(init.body);
      } catch {
        throw new CanvasightApiError("Canvasight widget API body must be JSON.", 400, { code: "invalid_widget_api_body", path });
      }
    }
    const identity = getCanvasightStartupIdentity();
    const result = (await callServerTool({
      name: "canvasight_widget_api",
      arguments: {
        path,
        method,
        body,
        openAttemptId: identity.openAttemptId,
        widgetInstanceId: identity.widgetInstanceId,
        startupStage: identity.stage,
        displayMode: identity.displayMode,
        threadId: identity.threadId,
        reactMounted: identity.stage !== "starting" && identity.stage !== "connecting_bridge"
      }
    })) as {
      isError?: boolean;
      structuredContent?: {
        code?: string | null;
        data?: unknown;
        error?: string | null;
        ok?: boolean;
        status?: number;
      };
    };
    const envelope = result?.structuredContent;
    if (result?.isError || !envelope || envelope.ok !== true) {
      const status = typeof envelope?.status === "number" ? envelope.status : 502;
      const payload = {
        code: envelope?.code || "widget_api_proxy_failed",
        error: envelope?.error || "Canvasight widget API proxy failed.",
        path
      };
      throw new CanvasightApiError(payload.error, status, payload);
    }
    return envelope.data as T;
  }
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

async function requestSessionJson<T>(suffix = "", init?: RequestInit): Promise<T> {
  await waitForCanvasightRuntimeData();
  return requestJson<T>(`/api/sessions/${sessionIdFromUrl()}${suffix}`, init);
}

function canAttemptWidgetFollowUp(): boolean {
  const bridgeWindow = window as CanvasightWindow;
  const bridgeCanSend = bridgeWindow.canvasightMcp?.canSendFollowUpMessage;
  if (typeof bridgeCanSend === "function") return bridgeCanSend();
  return typeof bridgeWindow.canvasightMcp?.sendFollowUpMessage === "function";
}

function widgetBridgeState(): CanvasightBridgeState {
  const bridgeWindow = window as CanvasightWindow;
  const state = bridgeWindow.canvasightMcp?.getBridgeState?.();
  return state && typeof state === "object" ? state : {};
}

function bridgeNotReadyError(): Error {
  const state = widgetBridgeState();
  const canvasightHost = new URLSearchParams(window.location.search).get("canvasightHost") || widgetRuntimeData().canvasightHost || "";
  const reason = state.reason || (canvasightHost === "widget" ? "openai_followup_missing" : "browser_fallback_no_bridge");
  const headline =
    reason === "browser_fallback_no_bridge"
      ? "Current Canvasight page is browser fallback/dev page, not a native widget. It has no native widget host bridge; reopen Canvasight with open_canvasight after tool_search, or receive queued fallback Runs with await_canvasight_run."
      : "Canvasight native widget host bridge is not ready.";
  return new Error(
    [
      headline,
      `reason=${reason}`,
      `bridgeTransport=${state.bridgeTransport || "none"}`,
      `mcpInitialized=${Boolean(state.mcpInitialized)}`,
      `hostCapabilitiesMessage=${Boolean(state.hostCapabilitiesMessage)}`,
      `openaiFollowUpAvailable=${Boolean(state.openaiFollowUpAvailable)}`,
      state.lastBridgeError ? `lastBridgeError=${state.lastBridgeError}` : ""
    ]
      .filter(Boolean)
      .join(" ")
  );
}

export function getCanvasightBridgeDiagnostics(): CanvasightBridgeDiagnostics {
  const query = new URLSearchParams(window.location.search);
  const bridgeWindow = window as CanvasightWindow;
  const bridgeState = widgetBridgeState();
  return {
    bridgeReason: bridgeState.reason || null,
    bridgeTransport: bridgeState.bridgeTransport || null,
    canSendFollowUpMessage: canAttemptWidgetFollowUp(),
    canvasightHost: query.get("canvasightHost") || widgetRuntimeData().canvasightHost || null,
    hasCanvasightMcp: Boolean(bridgeWindow.canvasightMcp),
    hasCanvasightMcpSendFollowUp: typeof bridgeWindow.canvasightMcp?.sendFollowUpMessage === "function",
    hostCapabilitiesMessage: Boolean(bridgeState.hostCapabilitiesMessage),
    lastBridgeError: bridgeState.lastBridgeError || null,
    mcpInitialized: Boolean(bridgeState.mcpInitialized),
    openaiFollowUpAvailable: Boolean(bridgeState.openaiFollowUpAvailable),
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
  if (!canAttemptWidgetFollowUp()) return Promise.reject(bridgeNotReadyError());
  const directBridge = (window as CanvasightWindow).canvasightMcp?.sendFollowUpMessage;
  if (typeof directBridge === "function") {
    return directBridge(message).then(() => undefined);
  }
  return Promise.reject(bridgeNotReadyError());
}

function assertPreparedWidgetRun(payload: RunPayload, preparedRun: RunResponse): void {
  const expectedStatus = "applied_chat";
  const actualStatus = preparedRun.codexNative?.status || preparedRun.delivery?.codexNative?.status;
  if (actualStatus === "preflight_degraded_chat") return;
  if (actualStatus !== expectedStatus) {
    const reason = preparedRun.codexNative?.error || preparedRun.delivery?.codexNative?.error || preparedRun.codexNative?.reason || preparedRun.delivery?.codexNative?.reason || actualStatus || "unknown";
    throw new Error(`Canvasight Run blocked before sendMessage: expected ${expectedStatus}, got ${reason}.`);
  }
}

function normalizeChatRunPayload(payload: RunPayload): RunPayload {
  // Old widgets and queued payloads can still carry retired mode fields.
  // Never forward them to either the widget proxy or the daemon.
  const { codexMode: _codexMode, planMode: _planMode, ...chatPayload } = payload as RunPayload & {
    codexMode?: unknown;
    planMode?: unknown;
  };
  return chatPayload;
}

async function runCanvasightNodeThroughWidget(payload: RunPayload): Promise<RunResponse> {
  const chatPayload = normalizeChatRunPayload(payload);
  const directRun = (window as CanvasightWindow).canvasightMcp?.runCanvasightNode;
  if (typeof directRun === "function") return directRun(chatPayload);
  if (!canAttemptWidgetFollowUp()) throw bridgeNotReadyError();
  const preparedRun = await canvasightApi.prepareWidgetRun(chatPayload);
  assertPreparedWidgetRun(chatPayload, preparedRun);
  await sendWidgetFollowUpMessage({
    prompt: chatPayload.markdown,
    content: [{ type: "text", text: chatPayload.markdown }]
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
  get sessionId(): string {
    return sessionIdFromUrl();
  },

  get token(): string {
    return sessionTokenFromUrl();
  },

  async getSession(): Promise<SessionInfo> {
    return requestSessionJson<SessionInfo>();
  },

  async reportWidgetReady(evidence: {
    projectHydrated: boolean;
    canvasRendered: boolean;
    canvasVisible: boolean;
    canvasWidth: number;
    canvasHeight: number;
  }): Promise<void> {
    if (!isNativeWidgetShell()) return;
    setCanvasightStartupStage("hydrating_project");
    const identity = getCanvasightStartupIdentity();
    const response = await requestSessionJson<{ status: "ready"; verified?: boolean }>("/widget-ready", {
      method: "POST",
      body: JSON.stringify({
        status: "ready",
        startupStage: "ready",
        stage: "ready",
        openAttemptId: identity.openAttemptId,
        widgetInstanceId: identity.widgetInstanceId,
        displayMode: identity.displayMode,
        threadId: identity.threadId,
        reactMounted: true,
        ...evidence
      })
    });
    if (response.status !== "ready" || response.verified !== true) {
      throw new Error("Canvasight daemon did not verify the fullscreen widget ready acknowledgement.");
    }
    setCanvasightStartupStage("ready");
    window.dispatchEvent(new CustomEvent("canvasight:app-ready", { detail: response }));
  },

  async reportWidgetFailure(error: unknown, stage = "session"): Promise<void> {
    const message = error instanceof Error ? error.message : String(error || "Canvasight failed to start.");
    setCanvasightStartupStage("failed");
    window.dispatchEvent(new CustomEvent("canvasight:app-error", { detail: { error: message, stage } }));
    if (!isNativeWidgetShell() || !widgetRuntimeReady()) return;
    try {
      await requestSessionJson("/widget-ready", {
        method: "POST",
        body: JSON.stringify({
          ...getCanvasightStartupIdentity(),
          status: "failed",
          startupStage: "failed",
          stage,
          error: message
        })
      });
    } catch {
      // The visible app error remains authoritative when the daemon cannot receive failure telemetry.
    }
  },

  openProject(projectPath: string): Promise<OpenProjectResult> {
    return requestSessionJson<OpenProjectResult>("/open-project", {
      method: "POST",
      body: JSON.stringify({ projectPath })
    });
  },

  resolveThreadProject(threadId: string, language?: LanguagePreference): Promise<OpenProjectResult> {
    return requestSessionJson<OpenProjectResult>("/resolve-thread-project", {
      method: "POST",
      body: JSON.stringify({ language, threadId })
    });
  },

  async claimThread(projectPath: string, threadId: string, language?: LanguagePreference): Promise<ThreadClaimResponse> {
    await waitForCanvasightRuntimeData();
    const currentSessionId = sessionIdFromUrl();
    const path = currentSessionId === "local" ? "/api/sessions/local/claim" : "/api/sessions/claim";
    return requestJson<ThreadClaimResponse>(path, {
      method: "POST",
      body: JSON.stringify({
        language,
        projectPath,
        sessionId: currentSessionId,
        threadId
      })
    });
  },

  saveDocument(projectPath: string, document: ScatterDocument, expectedRevision: number | null): Promise<SaveDocumentResult> {
    return requestSessionJson<SaveDocumentResult>("/document", {
      method: "POST",
      body: JSON.stringify({ document, expectedRevision, projectPath })
    });
  },

  async saveAttachments(projectPath: string, inputs: AttachmentInput[]): Promise<Attachment[]> {
    const files = await Promise.all(inputs.map(fileInputToPayload));
    return requestSessionJson<Attachment[]>("/attachments", {
      method: "POST",
      body: JSON.stringify({ files, projectPath })
    });
  },

  run(payload: RunPayload): Promise<RunResponse> {
    return requestSessionJson<RunResponse>("/run", {
      method: "POST",
      body: JSON.stringify(normalizeChatRunPayload(payload))
    });
  },

  prepareWidgetRun(payload: RunPayload): Promise<RunResponse> {
    return requestSessionJson<RunResponse>("/run", {
      method: "POST",
      body: JSON.stringify({
        ...normalizeChatRunPayload(payload),
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
