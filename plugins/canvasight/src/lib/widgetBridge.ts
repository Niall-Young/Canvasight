import {
  App,
  applyDocumentTheme,
  applyHostFonts,
  applyHostStyleVariables
} from "@modelcontextprotocol/ext-apps";
import { isFrameworkQuestionsPayload, type FrameworkQuestionsPayload } from "./frameworkQuestions";

type ToolResultLike = {
  _meta?: Record<string, unknown>;
  structuredContent?: Record<string, unknown>;
  widgetData?: Record<string, unknown>;
  [key: string]: unknown;
};

type OpenAiGlobals = Record<string, unknown> & {
  sendFollowUpMessage?: (message: { prompt: string; scrollToBottom?: boolean }) => Promise<unknown> | unknown;
  sendFollowupMessage?: (message: { prompt: string; scrollToBottom?: boolean }) => Promise<unknown> | unknown;
  toolOutput?: Record<string, unknown>;
  toolResponseMetadata?: Record<string, unknown>;
};

export type CanvasightBridgeState = {
  bridgeTransport: "mcp_ui_message" | "openai_compat_followup" | "none";
  hostCapabilitiesMessage: boolean;
  lastBridgeError: string | null;
  mcpInitialized: boolean;
  openaiFollowUpAvailable: boolean;
  displayMode: "inline" | "fullscreen" | "pip" | "unknown";
  startupStage: CanvasightStartupStage;
  widgetInstanceId: string;
  reason: string;
};

export type CanvasightStartupStage =
  | "starting"
  | "connecting_bridge"
  | "connecting_session"
  | "hydrating_project"
  | "ready"
  | "failed";

type CanvasightDisplayMode = "inline" | "fullscreen" | "pip";

export type CanvasightPresentationDiagnostic = {
  at: number;
  bindingKey: string;
  event: string;
  displayMode: CanvasightBridgeState["displayMode"];
  hostDisplayMode: CanvasightBridgeState["displayMode"];
  availableDisplayModes: CanvasightDisplayMode[];
  viewport: { width: number; height: number };
  detail?: Record<string, unknown>;
};

type CanvasightPresentationPulseResult =
  | "completed"
  | "unsupported"
  | "already-attempted"
  | "inline-rejected"
  | "inline-context-timeout"
  | "fullscreen-rejected"
  | "binding-changed"
  | "teardown"
  | "failed";

type CanvasightWidgetData = Record<string, unknown> & {
  apiBaseUrl?: string;
  browserUrl?: string;
  canvasightHost?: string;
  origin?: string;
  openAttemptId?: string;
  bindingIssuedAt?: number;
  sessionId?: string;
  targetDisplayMode?: string;
  threadId?: string | null;
  codexThreadId?: string | null;
  widgetInstanceId?: string;
  token?: string;
  url?: string;
};

type CanvasightMcpApi = {
  callServerTool: (request: Record<string, unknown>, options?: Record<string, unknown>) => Promise<unknown>;
  canSendFollowUpMessage: () => boolean;
  getBridgeState: () => CanvasightBridgeState;
  getHostCapabilities: () => unknown;
  getPresentationDiagnostics: () => CanvasightPresentationDiagnostic[];
  recordPresentationDiagnostic: (event: string, detail?: Record<string, unknown>) => void;
  requestFullscreenPresentation: () => Promise<boolean>;
  requestPresentationPulse: (bindingKey: string) => Promise<CanvasightPresentationPulseResult>;
  setStartupStage: (stage: CanvasightStartupStage) => void;
  sendFollowUpMessage: (message: { content?: Array<Record<string, unknown>>; prompt?: string }) => Promise<unknown>;
  toolOutput: () => Record<string, unknown> | null;
};

declare global {
  interface Window {
    __CANVASIGHT_BRIDGE_STATE__?: CanvasightBridgeState;
    __CANVASIGHT_MCP_APP__?: App;
    __CANVASIGHT_MCP_HOST_ERROR__?: unknown;
    __CANVASIGHT_WIDGET_BOOTSTRAP_TIMEOUT_MS__?: number;
    __CANVASIGHT_WIDGET_DATA__?: CanvasightWidgetData;
    __CANVASIGHT_WIDGET_SERVER_VERSION__?: string;
    __CANVASIGHT_WIDGET_SHELL__?: boolean;
    __CANVASIGHT_WIDGET_MODE__?: "workspace" | "framework-questions";
    __CANVASIGHT_PRESENTATION_DIAGNOSTICS__?: CanvasightPresentationDiagnostic[];
    __CANVASIGHT_FRAMEWORK_QUESTIONS__?: FrameworkQuestionsPayload;
    canvasightMcp?: CanvasightMcpApi;
    openai?: OpenAiGlobals;
  }
}

const DEFAULT_BOOTSTRAP_TIMEOUT_MS = 10_000;
const BRIDGE_TIMEOUT_MS = 8_000;
const PRESENTATION_REQUEST_TIMEOUT_MS = 1_250;
const PRESENTATION_CONTEXT_TIMEOUT_MS = 1_250;
const PRESENTATION_DIAGNOSTIC_LIMIT = 40;
const STARTUP_STAGE_RANK: Record<CanvasightStartupStage, number> = {
  starting: 0,
  connecting_bridge: 1,
  connecting_session: 2,
  hydrating_project: 3,
  ready: 4,
  failed: 5
};

function createWidgetInstanceId(): string {
  if (typeof crypto.randomUUID === "function") return `widget-${crypto.randomUUID()}`;
  return `widget-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, message: string): Promise<T> {
  let timer = 0;
  const timeout = new Promise<never>((_, reject) => {
    timer = window.setTimeout(() => reject(new Error(message)), timeoutMs);
  });
  return Promise.race([promise, timeout]).finally(() => window.clearTimeout(timer));
}

function bootstrapTimeoutMs(): number {
  const configured = Number(window.__CANVASIGHT_WIDGET_BOOTSTRAP_TIMEOUT_MS__);
  return Number.isFinite(configured) && configured > 0 ? configured : DEFAULT_BOOTSTRAP_TIMEOUT_MS;
}

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : String(error || fallback);
}

function statusElement(): HTMLElement | null {
  return document.getElementById("canvasight-widget-status");
}

function setStatus(message: string, tone: "error" | "muted" | "ok" = "muted"): void {
  const status = statusElement();
  if (!status) return;
  status.textContent = message;
  status.dataset.tone = tone;
}

function canonicalToolResult(value: unknown): ToolResultLike | null {
  if (!value || typeof value !== "object") return null;
  const current = value as ToolResultLike;
  const nested = current.mcp_tool_result || current.call_tool_result || current.result;
  if (nested && nested !== value && typeof nested === "object") return canonicalToolResult(nested);
  return current;
}

function payloadFromToolResult(result: ToolResultLike): { metadata: Record<string, unknown>; payload: Record<string, unknown> } {
  const directWidgetData = result.widgetData;
  const metadata = result._meta ?? (directWidgetData ? result : {});
  const metadataWidgetData = metadata.widgetData;
  const payload =
    directWidgetData ??
    (metadataWidgetData && typeof metadataWidgetData === "object" ? (metadataWidgetData as Record<string, unknown>) : null) ??
    result.structuredContent ??
    result;
  return { metadata, payload };
}

function toolResultFromOpenAiGlobals(globals: OpenAiGlobals): ToolResultLike | null {
  const canonicalMetadata = canonicalToolResult(globals.toolResponseMetadata);
  if (canonicalMetadata) {
    const { payload } = payloadFromToolResult(canonicalMetadata);
    if (isFrameworkQuestionsPayload(payload) || typeof payload.url === "string" || typeof payload.browserUrl === "string") return canonicalMetadata;
  }
  if (!globals.toolOutput || typeof globals.toolOutput !== "object") return canonicalMetadata;
  return {
    structuredContent: globals.toolOutput,
    _meta: globals.toolResponseMetadata && typeof globals.toolResponseMetadata === "object" ? globals.toolResponseMetadata : {}
  };
}

function normalizedWidgetData(payload: Record<string, unknown>): CanvasightWidgetData {
  const rawUrl = typeof payload.browserUrl === "string" ? payload.browserUrl : typeof payload.url === "string" ? payload.url : "";
  if (!rawUrl) throw new Error("Canvasight tool result did not include widget session metadata.");
  const url = new URL(rawUrl);
  url.searchParams.set("canvasightHost", "widget");
  return {
    ...payload,
    apiBaseUrl: typeof payload.apiBaseUrl === "string" ? payload.apiBaseUrl : typeof payload.origin === "string" ? payload.origin : url.origin,
    canvasightHost: "widget",
    bindingIssuedAt: typeof payload.bindingIssuedAt === "number" ? payload.bindingIssuedAt : 0,
    sessionId: typeof payload.sessionId === "string" ? payload.sessionId : url.searchParams.get("sessionId") || "",
    token: url.searchParams.get("token") || (typeof payload.token === "string" ? payload.token : ""),
    url: url.toString(),
    browserUrl: url.toString()
  };
}

export function startCanvasightWidgetBridge(): void {
  if (!window.__CANVASIGHT_WIDGET_SHELL__ || window.__CANVASIGHT_MCP_APP__) return;

  let app: App | null = null;
  let toolOutput: Record<string, unknown> | null = null;
  const openAiHostObject = window.openai;
  let openAiGlobals: OpenAiGlobals = { ...(window.openai ?? {}) };
  let metadataReceived = false;
  let reactMounted = false;
  let tearingDown = false;
  let metadataTimer: number | null = null;
  let hostContextSequence = 0;
  const lastHostModeSequence: Partial<Record<CanvasightDisplayMode, number>> = {};
  const presentationPulseBindings = new Set<string>();
  let suppressInlineHostContextForBinding = "";
  const removeWindowListeners: Array<() => void> = [];
  const isFrameworkQuestionsWidget = window.__CANVASIGHT_WIDGET_MODE__ === "framework-questions";
  const widgetInstanceId = createWidgetInstanceId();
  const bridgeState: CanvasightBridgeState = {
    bridgeTransport: "none",
    hostCapabilitiesMessage: false,
    lastBridgeError: null,
    mcpInitialized: false,
    openaiFollowUpAvailable: false,
    displayMode: "unknown",
    startupStage: "starting",
    widgetInstanceId,
    reason: "mcp_initialize_pending"
  };

  const currentBindingKey = (): string => {
    const runtime = window.__CANVASIGHT_WIDGET_DATA__;
    return `${runtime?.sessionId || ""}:${runtime?.openAttemptId || ""}:${runtime?.bindingIssuedAt || 0}`;
  };

  const presentationDiagnostics: CanvasightPresentationDiagnostic[] = [];
  window.__CANVASIGHT_PRESENTATION_DIAGNOSTICS__ = presentationDiagnostics;
  const recordPresentationDiagnostic = (event: string, detail?: Record<string, unknown>): void => {
    const context = app?.getHostContext();
    presentationDiagnostics.push({
      at: Date.now(),
      bindingKey: currentBindingKey(),
      event,
      displayMode: bridgeState.displayMode,
      hostDisplayMode: context?.displayMode ?? "unknown",
      availableDisplayModes: [...(context?.availableDisplayModes ?? [])],
      viewport: { width: window.innerWidth, height: window.innerHeight },
      ...(detail ? { detail } : {})
    });
    if (presentationDiagnostics.length > PRESENTATION_DIAGNOSTIC_LIMIT) {
      presentationDiagnostics.splice(0, presentationDiagnostics.length - PRESENTATION_DIAGNOSTIC_LIMIT);
    }
  };

  const updateBridgeState = (patch: Partial<CanvasightBridgeState>): void => {
    if (tearingDown) return;
    const changed = Object.entries(patch).some(
      ([key, value]) => bridgeState[key as keyof CanvasightBridgeState] !== value
    );
    if (!changed) return;
    Object.assign(bridgeState, patch);
    window.__CANVASIGHT_BRIDGE_STATE__ = { ...bridgeState };
    window.dispatchEvent(new CustomEvent("canvasight:bridge-state", { detail: { ...bridgeState } }));
  };

  const listenWindow = (type: string, listener: EventListener): void => {
    window.addEventListener(type, listener);
    removeWindowListeners.push(() => window.removeEventListener(type, listener));
  };

  const releaseWidgetBinding = async (binding: CanvasightWidgetData | null | undefined): Promise<void> => {
    if (!binding?.sessionId || !binding.openAttemptId || !app || !bridgeState.mcpInitialized) return;
    try {
      await withTimeout(
        app.callServerTool({
          name: "canvasight_widget_api",
          arguments: {
            path: `/api/sessions/${binding.sessionId}/revision-poll`,
            method: "DELETE",
            body: null,
            openAttemptId: binding.openAttemptId,
            widgetInstanceId,
            startupStage: bridgeState.startupStage,
            displayMode: bridgeState.displayMode,
            threadId: binding.threadId ?? binding.codexThreadId ?? "",
            reactMounted
          }
        }),
        1_250,
        "Canvasight revision poll lease release timed out."
      );
    } catch {
      // The daemon lease expires automatically when a binding disappears unexpectedly.
    }
  };

  const setStartupStage = (stage: CanvasightStartupStage): void => {
    if (bridgeState.startupStage === "ready" || bridgeState.startupStage === "failed") return;
    if (STARTUP_STAGE_RANK[stage] < STARTUP_STAGE_RANK[bridgeState.startupStage]) return;
    updateBridgeState({ startupStage: stage });
  };

  const updateDisplayMode = (value: unknown): void => {
    if (value === "inline" || value === "fullscreen" || value === "pip") {
      updateBridgeState({ displayMode: value });
    }
  };

  const openAiFollowUp = (): OpenAiGlobals["sendFollowUpMessage"] => {
    const fn = openAiGlobals.sendFollowUpMessage ?? openAiGlobals.sendFollowupMessage;
    return typeof fn === "function" ? fn.bind(openAiHostObject ?? openAiGlobals) : undefined;
  };

  const refreshBridgeState = (): void => {
    const capabilities = app?.getHostCapabilities();
    const hostCapabilitiesMessage = Boolean(capabilities?.message);
    const openaiFollowUpAvailable = Boolean(openAiFollowUp());
    if (bridgeState.mcpInitialized && typeof app?.sendMessage === "function") {
      updateBridgeState({
        bridgeTransport: "mcp_ui_message",
        hostCapabilitiesMessage,
        lastBridgeError: null,
        openaiFollowUpAvailable,
        reason: "native_bridge_ready"
      });
      return;
    }
    updateBridgeState({
      bridgeTransport: openaiFollowUpAvailable ? "openai_compat_followup" : "none",
      hostCapabilitiesMessage,
      openaiFollowUpAvailable,
      reason: openaiFollowUpAvailable ? "native_bridge_ready" : bridgeState.reason
    });
  };

  const handleToolResult = (value: unknown): void => {
    const result = canonicalToolResult(value);
    if (!result) return;
    const { payload } = payloadFromToolResult(result);
    if (isFrameworkQuestionsPayload(payload)) {
      metadataReceived = true;
      toolOutput = payload;
      window.__CANVASIGHT_FRAMEWORK_QUESTIONS__ = payload;
      window.dispatchEvent(new CustomEvent("canvasight:framework-questions", { detail: payload }));
      return;
    }
    if (isFrameworkQuestionsWidget) return;
    try {
      const widgetData = normalizedWidgetData(payload);
      if (!widgetData.openAttemptId) throw new Error("Canvasight tool result did not include openAttemptId.");
      const current = window.__CANVASIGHT_WIDGET_DATA__;
      const sameBinding = current?.sessionId === widgetData.sessionId && current?.openAttemptId === widgetData.openAttemptId;
      const currentIssuedAt = Number(current?.bindingIssuedAt || 0);
      const incomingIssuedAt = Number(widgetData.bindingIssuedAt || 0);
      if (current?.sessionId && !sameBinding && incomingIssuedAt <= currentIssuedAt) return;
      const isRebind = Boolean(current?.sessionId && !sameBinding);
      const previousBinding = current ? { ...current } : null;
      if (isRebind) void releaseWidgetBinding(previousBinding);
      metadataReceived = true;
      const runtimeData = { ...widgetData, widgetInstanceId };
      toolOutput = runtimeData;
      window.__CANVASIGHT_WIDGET_DATA__ = runtimeData;
      if (isRebind) {
        suppressInlineHostContextForBinding = "";
        reactMounted = false;
        updateBridgeState({
          lastBridgeError: null,
          reason: bridgeState.mcpInitialized ? "native_bridge_ready" : "mcp_initialize_pending",
          startupStage: bridgeState.mcpInitialized ? "connecting_session" : "connecting_bridge"
        });
      } else {
        setStartupStage(bridgeState.mcpInitialized ? "connecting_session" : "connecting_bridge");
      }
      if (!reactMounted && bridgeState.startupStage !== "ready" && bridgeState.startupStage !== "failed") {
        setStatus("Connecting Canvasight session...", "muted");
      }
      window.dispatchEvent(new CustomEvent("canvasight:widget-data", { detail: runtimeData }));
      if (isRebind) {
        window.dispatchEvent(new CustomEvent("canvasight:widget-rebind", {
          detail: { previous: previousBinding, current: runtimeData }
        }));
      }
    } catch (error) {
      const message = errorMessage(error, "Canvasight widget metadata is invalid.");
      updateBridgeState({ lastBridgeError: message, reason: "widget_metadata_invalid" });
      setStartupStage("failed");
      setStatus(message, "error");
      window.dispatchEvent(new CustomEvent("canvasight:app-error", { detail: { error: message, stage: "metadata" } }));
    }
  };

  const consumeOpenAiGlobals = (globals: unknown): void => {
    if (!globals || typeof globals !== "object") return;
    openAiGlobals = { ...openAiGlobals, ...(globals as OpenAiGlobals) };
    refreshBridgeState();
    const result = toolResultFromOpenAiGlobals(openAiGlobals);
    if (result) handleToolResult(result);
  };

  const waitForMcpReady = async (): Promise<boolean> => {
    if (bridgeState.mcpInitialized) return true;
    const ready = (app as (App & { ready?: Promise<unknown> }) | null)?.ready;
    if (!ready) return false;
    try {
      await withTimeout(Promise.resolve(ready), 4_000, "Canvasight MCP Apps bridge initialization timed out.");
      return bridgeState.mcpInitialized;
    } catch (error) {
      const message = errorMessage(error, "Canvasight MCP Apps bridge initialization failed.");
      window.__CANVASIGHT_MCP_HOST_ERROR__ = error;
      updateBridgeState({ lastBridgeError: message, mcpInitialized: false, reason: "mcp_initialize_timeout" });
      return false;
    }
  };

  const sendFollowUpMessage: CanvasightMcpApi["sendFollowUpMessage"] = async (message) => {
    const content = Array.isArray(message.content) ? message.content : [{ type: "text", text: message.prompt ?? "" }];
    const prompt =
      typeof message.prompt === "string" && message.prompt.trim()
        ? message.prompt
        : content.map((item) => (typeof item.text === "string" ? item.text : "")).filter(Boolean).join("\n\n");
    if (!prompt && !content.length) throw new Error("Missing Canvasight message content.");

    refreshBridgeState();
    if (!bridgeState.mcpInitialized) await waitForMcpReady();
    if (bridgeState.mcpInitialized && app) {
      const result = await withTimeout(
        app.sendMessage({ role: "user", content } as Parameters<App["sendMessage"]>[0]),
        BRIDGE_TIMEOUT_MS,
        "Host did not accept the Canvasight message through ui/message."
      );
      if (result?.isError) throw new Error("Host rejected the Canvasight message.");
      return result;
    }

    const followUp = openAiFollowUp();
    if (followUp) {
      return withTimeout(
        Promise.resolve(followUp({ prompt, scrollToBottom: true })),
        BRIDGE_TIMEOUT_MS,
        "Host did not accept the Canvasight message through window.openai.sendFollowUpMessage."
      );
    }

    throw new Error(
      `Canvasight native widget host bridge is not ready. reason=${bridgeState.reason} lastBridgeError=${bridgeState.lastBridgeError ?? "none"}`
    );
  };

  const callServerTool: CanvasightMcpApi["callServerTool"] = async (request, options) => {
    if (!bridgeState.mcpInitialized) await waitForMcpReady();
    if (!bridgeState.mcpInitialized || !app) throw new Error("Canvasight MCP Apps server-tool bridge is not ready.");
    const runtime = window.__CANVASIGHT_WIDGET_DATA__;
    const requestName = request.name;
    const enrichedRequest = requestName === "canvasight_widget_api"
      ? {
          ...request,
          arguments: {
            ...((request.arguments && typeof request.arguments === "object" ? request.arguments : {}) as Record<string, unknown>),
            openAttemptId: runtime?.openAttemptId,
            widgetInstanceId,
            startupStage: bridgeState.startupStage,
            displayMode: bridgeState.displayMode,
            threadId: runtime?.threadId ?? runtime?.codexThreadId ?? "",
            reactMounted: STARTUP_STAGE_RANK[bridgeState.startupStage] >= STARTUP_STAGE_RANK.connecting_session
          }
        }
      : request;
    return withTimeout(
      app.callServerTool(
        enrichedRequest as Parameters<App["callServerTool"]>[0],
        options as Parameters<App["callServerTool"]>[1]
      ),
      typeof options?.timeoutMs === "number" ? options.timeoutMs : 30_000,
      "Canvasight server tool call timed out."
    );
  };

  const requestFullscreenPresentation: CanvasightMcpApi["requestFullscreenPresentation"] = async () => {
    if (!bridgeState.mcpInitialized) await waitForMcpReady();
    if (!bridgeState.mcpInitialized || !app) throw new Error("Canvasight MCP Apps presentation bridge is not ready.");
    recordPresentationDiagnostic("fullscreen-request");
    const result = await withTimeout(app.requestDisplayMode({ mode: "fullscreen" }), PRESENTATION_REQUEST_TIMEOUT_MS, "Canvasight fullscreen presentation request timed out.");
    updateDisplayMode(result?.mode);
    recordPresentationDiagnostic("fullscreen-result", { requestedMode: "fullscreen", resultMode: result?.mode ?? "unknown" });
    return result?.mode === "fullscreen";
  };

  const waitForHostDisplayModeAfter = async (
    mode: CanvasightDisplayMode,
    afterSequence: number
  ): Promise<boolean> => {
    if ((lastHostModeSequence[mode] ?? 0) > afterSequence) return true;
    return new Promise<boolean>((resolve) => {
      let settled = false;
      const finish = (matched: boolean) => {
        if (settled) return;
        settled = true;
        window.clearTimeout(timer);
        window.removeEventListener("canvasight:host-context-observed", handleContext);
        resolve(matched);
      };
      const handleContext = (event: Event) => {
        const detail = (event as CustomEvent<{ mode?: CanvasightDisplayMode; sequence?: number }>).detail;
        if (detail?.mode === mode && Number(detail.sequence) > afterSequence) finish(true);
      };
      const timer = window.setTimeout(() => finish(false), PRESENTATION_CONTEXT_TIMEOUT_MS);
      window.addEventListener("canvasight:host-context-observed", handleContext);
    });
  };

  const requestPresentationPulse: CanvasightMcpApi["requestPresentationPulse"] = async (bindingKey) => {
    if (!bridgeState.mcpInitialized) await waitForMcpReady();
    const bindingStatus = (): CanvasightPresentationPulseResult | null => {
      if (tearingDown) return "teardown";
      if (bindingKey !== currentBindingKey()) return "binding-changed";
      return null;
    };
    const initialStatus = bindingStatus();
    if (initialStatus) return initialStatus;
    if (!bridgeState.mcpInitialized || !app) return "failed";
    if (presentationPulseBindings.has(bindingKey)) return "already-attempted";
    const availableModes = app.getHostContext()?.availableDisplayModes ?? [];
    if (!availableModes.includes("inline") || !availableModes.includes("fullscreen")) {
      recordPresentationDiagnostic("pulse-unsupported", { availableDisplayModes: [...availableModes] });
      return "unsupported";
    }
    presentationPulseBindings.add(bindingKey);
    const inlineContextAfterSequence = hostContextSequence;
    try {
      recordPresentationDiagnostic("pulse-inline-request");
      const inlineResult = await withTimeout(
        app.requestDisplayMode({ mode: "inline" }),
        PRESENTATION_REQUEST_TIMEOUT_MS,
        "Canvasight inline presentation request timed out."
      );
      const afterInlineRequest = bindingStatus();
      if (afterInlineRequest) return afterInlineRequest;
      updateDisplayMode(inlineResult?.mode);
      recordPresentationDiagnostic("pulse-inline-result", { requestedMode: "inline", resultMode: inlineResult?.mode ?? "unknown" });
      if (inlineResult?.mode !== "inline") return "inline-rejected";
      const inlineContextMatched = await waitForHostDisplayModeAfter("inline", inlineContextAfterSequence);
      const afterInlineContext = bindingStatus();
      if (afterInlineContext) return afterInlineContext;
      recordPresentationDiagnostic("pulse-inline-context", { matched: inlineContextMatched });
      if (!inlineContextMatched) return "inline-context-timeout";

      recordPresentationDiagnostic("pulse-fullscreen-request");
      const fullscreenResult = await withTimeout(
        app.requestDisplayMode({ mode: "fullscreen" }),
        PRESENTATION_REQUEST_TIMEOUT_MS,
        "Canvasight final fullscreen presentation request timed out."
      );
      const afterFullscreenRequest = bindingStatus();
      if (afterFullscreenRequest) return afterFullscreenRequest;
      updateDisplayMode(fullscreenResult?.mode);
      recordPresentationDiagnostic("pulse-fullscreen-result", { requestedMode: "fullscreen", resultMode: fullscreenResult?.mode ?? "unknown" });
      if (fullscreenResult?.mode !== "fullscreen") return "fullscreen-rejected";
      suppressInlineHostContextForBinding = bindingKey;
      return "completed";
    } catch (error) {
      recordPresentationDiagnostic("pulse-failed", { error: errorMessage(error, "Presentation pulse failed.") });
      return bindingStatus() ?? "failed";
    }
  };

  window.canvasightMcp = {
    callServerTool,
    canSendFollowUpMessage: () => {
      refreshBridgeState();
      return bridgeState.bridgeTransport !== "none";
    },
    getBridgeState: () => ({ ...bridgeState }),
    getHostCapabilities: () => app?.getHostCapabilities() ?? null,
    getPresentationDiagnostics: () => presentationDiagnostics.map((entry) => ({ ...entry, detail: entry.detail ? { ...entry.detail } : undefined })),
    recordPresentationDiagnostic,
    requestFullscreenPresentation,
    requestPresentationPulse,
    setStartupStage,
    sendFollowUpMessage,
    toolOutput: () => toolOutput
  };
  updateBridgeState({});

  listenWindow("openai:set_globals", (event) => {
    const detail = (event as CustomEvent<{ globals?: unknown } & OpenAiGlobals>).detail;
    const globals = detail?.globals ?? detail;
    consumeOpenAiGlobals(globals);
  });
  consumeOpenAiGlobals(window.openai);

  listenWindow("canvasight:react-mounted", () => {
    reactMounted = true;
    setStartupStage("connecting_bridge");
    setStatus("", "ok");
  });
  listenWindow("canvasight:startup-stage", (event) => {
    const stage = (event as CustomEvent<{ stage?: CanvasightStartupStage }>).detail?.stage;
    if (stage && stage in STARTUP_STAGE_RANK) setStartupStage(stage);
  });
  listenWindow("canvasight:app-ready", (event) => {
    const detail = (event as CustomEvent<{ bindingKey?: string }>).detail;
    const runtime = window.__CANVASIGHT_WIDGET_DATA__;
    const currentBindingKey = `${runtime?.sessionId || ""}:${runtime?.openAttemptId || ""}:${runtime?.bindingIssuedAt || 0}`;
    if (detail?.bindingKey && detail.bindingKey !== currentBindingKey) return;
    setStartupStage("ready");
    if (bridgeState.startupStage === "ready") setStatus("", "ok");
  });
  listenWindow("canvasight:app-error", (event) => {
    const detail = (event as CustomEvent<{ bindingKey?: string; error?: string }>).detail;
    const runtime = window.__CANVASIGHT_WIDGET_DATA__;
    const currentBindingKey = `${runtime?.sessionId || ""}:${runtime?.openAttemptId || ""}:${runtime?.bindingIssuedAt || 0}`;
    if (detail?.bindingKey && detail.bindingKey !== currentBindingKey) return;
    updateBridgeState({ startupStage: "failed" });
    setStatus(detail?.error || "Canvasight failed to start.", "error");
  });

  if (!isFrameworkQuestionsWidget) {
    const metadataTimeoutMs = bootstrapTimeoutMs();
    metadataTimer = window.setTimeout(() => {
      if (typeof window === "undefined") return;
      if (metadataReceived) return;
      const message = `Canvasight session metadata timed out after ${metadataTimeoutMs}ms. Reopen Canvasight from a new Codex task.`;
      updateBridgeState({ lastBridgeError: message, reason: "widget_metadata_timeout" });
      updateBridgeState({ startupStage: "failed" });
      setStatus(message, "error");
      window.dispatchEvent(new CustomEvent("canvasight:app-error", { detail: { error: message, stage: "metadata" } }));
    }, metadataTimeoutMs);
  }

  try {
    app = new App(
      { name: "canvasight", version: window.__CANVASIGHT_WIDGET_SERVER_VERSION__ || "dev" },
      {},
      { autoResize: isFrameworkQuestionsWidget, strict: true }
    );
    window.__CANVASIGHT_MCP_APP__ = app;
    app.addEventListener("toolresult", handleToolResult);
    app.addEventListener("hostcontextchanged", (context) => {
      hostContextSequence += 1;
      if (context.displayMode) lastHostModeSequence[context.displayMode] = hostContextSequence;
      const ignoreDelayedInline = context.displayMode === "inline" && suppressInlineHostContextForBinding === currentBindingKey();
      if (!ignoreDelayedInline) updateDisplayMode(context.displayMode);
      recordPresentationDiagnostic(ignoreDelayedInline ? "host-context-inline-ignored" : "host-context", {
        contextDisplayMode: context.displayMode ?? "unknown",
        sequence: hostContextSequence
      });
      window.dispatchEvent(new CustomEvent("canvasight:host-context-observed", {
        detail: { mode: context.displayMode, sequence: hostContextSequence }
      }));
      try {
        if (context.theme) applyDocumentTheme(context.theme);
        if (context.styles?.variables) applyHostStyleVariables(context.styles.variables);
        if (context.styles?.css?.fonts) applyHostFonts(context.styles.css.fonts);
      } catch {
        // Host styling is a progressive enhancement.
      }
      window.dispatchEvent(new CustomEvent("canvasight:host-context-changed", {
        detail: {
          displayMode: context.displayMode ?? bridgeState.displayMode,
          containerDimensions: context.containerDimensions ?? null
        }
      }));
    });
    app.onteardown = async () => {
      if (tearingDown) return {};
      tearingDown = true;
      const pending: Promise<unknown>[] = [];
      window.dispatchEvent(new CustomEvent("canvasight:resource-teardown", {
        detail: {
          waitUntil(value: Promise<unknown>) {
            pending.push(Promise.resolve(value));
          }
        }
      }));
      if (pending.length === 0) pending.push(releaseWidgetBinding(window.__CANVASIGHT_WIDGET_DATA__));
      await withTimeout(Promise.allSettled(pending), 1_500, "Canvasight widget teardown timed out.").catch(() => undefined);
      if (metadataTimer !== null) window.clearTimeout(metadataTimer);
      for (const remove of removeWindowListeners.splice(0)) remove();
      window.setTimeout(() => {
        void app?.close().catch(() => undefined);
        window.__CANVASIGHT_MCP_APP__ = undefined;
        window.canvasightMcp = undefined;
      }, 0);
      return {};
    };
    const ready = withTimeout(app.connect(), BRIDGE_TIMEOUT_MS, "Canvasight MCP Apps bridge initialization timed out.")
      .then(() => {
        updateBridgeState({ mcpInitialized: true, lastBridgeError: null, startupStage: metadataReceived ? "connecting_session" : "connecting_bridge" });
        refreshBridgeState();
        const context = app?.getHostContext();
        updateDisplayMode(context?.displayMode);
        if (context?.theme) applyDocumentTheme(context.theme);
        if (context?.styles?.variables) applyHostStyleVariables(context.styles.variables);
        if (context?.styles?.css?.fonts) applyHostFonts(context.styles.css.fonts);
        if (!isFrameworkQuestionsWidget) {
          void requestFullscreenPresentation().catch((error) => {
            updateBridgeState({ lastBridgeError: errorMessage(error, "Canvasight fullscreen request failed."), reason: "fullscreen_request_failed" });
          });
        }
      })
      .catch((error) => {
        const message = errorMessage(error, "Canvasight MCP Apps bridge initialization failed.");
        window.__CANVASIGHT_MCP_HOST_ERROR__ = error;
        updateBridgeState({ lastBridgeError: message, mcpInitialized: false, reason: "mcp_initialize_timeout" });
        updateBridgeState({ startupStage: "failed" });
        refreshBridgeState();
        setStatus(message, "error");
      });
    (app as App & { ready?: Promise<unknown> }).ready = ready;
  } catch (error) {
    const message = errorMessage(error, "Canvasight MCP Apps bridge could not start.");
    window.__CANVASIGHT_MCP_HOST_ERROR__ = error;
    updateBridgeState({ lastBridgeError: message, mcpInitialized: false, reason: "mcp_initialize_failed" });
    updateBridgeState({ startupStage: "failed" });
    refreshBridgeState();
    setStatus(message, "error");
  }
}
