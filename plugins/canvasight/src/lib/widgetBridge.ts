import {
  App,
  applyDocumentTheme,
  applyHostFonts,
  applyHostStyleVariables
} from "@modelcontextprotocol/ext-apps";

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
    canvasightMcp?: CanvasightMcpApi;
    openai?: OpenAiGlobals;
  }
}

const DEFAULT_BOOTSTRAP_TIMEOUT_MS = 10_000;
const BRIDGE_TIMEOUT_MS = 8_000;
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
    if (typeof payload.url === "string" || typeof payload.browserUrl === "string") return canonicalMetadata;
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

  const updateBridgeState = (patch: Partial<CanvasightBridgeState>): void => {
    const changed = Object.entries(patch).some(
      ([key, value]) => bridgeState[key as keyof CanvasightBridgeState] !== value
    );
    if (!changed) return;
    Object.assign(bridgeState, patch);
    window.__CANVASIGHT_BRIDGE_STATE__ = { ...bridgeState };
    window.dispatchEvent(new CustomEvent("canvasight:bridge-state", { detail: { ...bridgeState } }));
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
      metadataReceived = true;
      const runtimeData = { ...widgetData, widgetInstanceId };
      toolOutput = runtimeData;
      window.__CANVASIGHT_WIDGET_DATA__ = runtimeData;
      if (isRebind) {
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
    if (!prompt && !content.length) throw new Error("Missing Canvasight Run prompt.");

    refreshBridgeState();
    if (!bridgeState.mcpInitialized) await waitForMcpReady();
    if (bridgeState.mcpInitialized && app) {
      const result = await withTimeout(
        app.sendMessage({ role: "user", content } as Parameters<App["sendMessage"]>[0]),
        BRIDGE_TIMEOUT_MS,
        "Host did not accept the Canvasight Run through ui/message."
      );
      if (result?.isError) throw new Error("Host rejected the Canvasight Run.");
      return result;
    }

    const followUp = openAiFollowUp();
    if (followUp) {
      return withTimeout(
        Promise.resolve(followUp({ prompt, scrollToBottom: true })),
        BRIDGE_TIMEOUT_MS,
        "Host did not accept the Canvasight Run through window.openai.sendFollowUpMessage."
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

  window.canvasightMcp = {
    callServerTool,
    canSendFollowUpMessage: () => {
      refreshBridgeState();
      return bridgeState.bridgeTransport !== "none";
    },
    getBridgeState: () => ({ ...bridgeState }),
    getHostCapabilities: () => app?.getHostCapabilities() ?? null,
    setStartupStage,
    sendFollowUpMessage,
    toolOutput: () => toolOutput
  };
  updateBridgeState({});

  window.addEventListener("openai:set_globals", (event) => {
    const detail = (event as CustomEvent<{ globals?: unknown } & OpenAiGlobals>).detail;
    const globals = detail?.globals ?? detail;
    consumeOpenAiGlobals(globals);
  });
  consumeOpenAiGlobals(window.openai);

  window.addEventListener("canvasight:react-mounted", () => {
    reactMounted = true;
    setStartupStage("connecting_bridge");
    setStatus("", "ok");
  });
  window.addEventListener("canvasight:startup-stage", (event) => {
    const stage = (event as CustomEvent<{ stage?: CanvasightStartupStage }>).detail?.stage;
    if (stage && stage in STARTUP_STAGE_RANK) setStartupStage(stage);
  });
  window.addEventListener("canvasight:app-ready", (event) => {
    const detail = (event as CustomEvent<{ bindingKey?: string }>).detail;
    const runtime = window.__CANVASIGHT_WIDGET_DATA__;
    const currentBindingKey = `${runtime?.sessionId || ""}:${runtime?.openAttemptId || ""}:${runtime?.bindingIssuedAt || 0}`;
    if (detail?.bindingKey && detail.bindingKey !== currentBindingKey) return;
    setStartupStage("ready");
    if (bridgeState.startupStage === "ready") setStatus("", "ok");
  });
  window.addEventListener("canvasight:app-error", (event) => {
    const detail = (event as CustomEvent<{ bindingKey?: string; error?: string }>).detail;
    const runtime = window.__CANVASIGHT_WIDGET_DATA__;
    const currentBindingKey = `${runtime?.sessionId || ""}:${runtime?.openAttemptId || ""}:${runtime?.bindingIssuedAt || 0}`;
    if (detail?.bindingKey && detail.bindingKey !== currentBindingKey) return;
    updateBridgeState({ startupStage: "failed" });
    setStatus(detail?.error || "Canvasight failed to start.", "error");
  });

  window.setTimeout(() => {
    if (metadataReceived) return;
    const message = `Canvasight session metadata timed out after ${bootstrapTimeoutMs()}ms. Reopen Canvasight from a new Codex task.`;
    updateBridgeState({ lastBridgeError: message, reason: "widget_metadata_timeout" });
    updateBridgeState({ startupStage: "failed" });
    setStatus(message, "error");
    window.dispatchEvent(new CustomEvent("canvasight:app-error", { detail: { error: message, stage: "metadata" } }));
  }, bootstrapTimeoutMs());

  try {
    app = new App(
      { name: "canvasight", version: window.__CANVASIGHT_WIDGET_SERVER_VERSION__ || "dev" },
      {},
      { autoResize: true, strict: true }
    );
    window.__CANVASIGHT_MCP_APP__ = app;
    app.addEventListener("toolresult", handleToolResult);
    app.addEventListener("hostcontextchanged", (context) => {
      updateDisplayMode(context.displayMode);
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
    const ready = withTimeout(app.connect(), BRIDGE_TIMEOUT_MS, "Canvasight MCP Apps bridge initialization timed out.")
      .then(() => {
        updateBridgeState({ mcpInitialized: true, lastBridgeError: null, startupStage: metadataReceived ? "connecting_session" : "connecting_bridge" });
        refreshBridgeState();
        const context = app?.getHostContext();
        updateDisplayMode(context?.displayMode);
        if (context?.theme) applyDocumentTheme(context.theme);
        if (context?.styles?.variables) applyHostStyleVariables(context.styles.variables);
        if (context?.styles?.css?.fonts) applyHostFonts(context.styles.css.fonts);
        void app?.requestDisplayMode({ mode: "fullscreen" }).then((result) => updateDisplayMode(result?.mode)).catch((error) => {
          updateBridgeState({ lastBridgeError: errorMessage(error, "Canvasight fullscreen request failed."), reason: "fullscreen_request_failed" });
        });
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
