export function widgetApiRoute(pathValue) {
  if (typeof pathValue !== "string" || !pathValue.startsWith("/api/")) {
    throw new Error("Canvasight widget API path must start with /api/.");
  }
  const parsed = new URL(pathValue, "http://canvasight.local");
  if (parsed.origin !== "http://canvasight.local" || parsed.hash || parsed.pathname.includes("..")) {
    throw new Error("Canvasight widget API path is invalid.");
  }
  const allowed =
    /^\/api\/sessions(?:\/|$)/.test(parsed.pathname) ||
    /^\/api\/templates(?:\/|$)/.test(parsed.pathname) ||
    parsed.pathname === "/api/skills" ||
    parsed.pathname === "/api/preferences" ||
    parsed.pathname === "/api/reveal" ||
    parsed.pathname === "/api/open-file";
  if (!allowed) throw new Error("Canvasight widget API path is not allowed.");
  if (parsed.search) {
    if (parsed.pathname !== "/api/skills") throw new Error("Canvasight widget API query parameters are not allowed for this path.");
    const allowedSkillQueryKeys = new Set(["projectPath", "threadId", "query", "forceReload", "limit"]);
    for (const key of parsed.searchParams.keys()) {
      if (!allowedSkillQueryKeys.has(key) || parsed.searchParams.getAll(key).length !== 1) {
        throw new Error("Canvasight widget Skill API query parameters are invalid.");
      }
    }
  }
  return `${parsed.pathname}${parsed.search}`;
}

export function recoverableWidgetSessionRoute(route, method) {
  if (method === "DELETE") return null;
  const parsed = new URL(route, "http://canvasight.local");
  const match = parsed.pathname.match(/^\/api\/sessions\/([^/]+)(\/.*)?$/u);
  if (!match) return null;
  const sessionId = decodeURIComponent(match[1]);
  const suffix = match[2] || "";
  if (sessionId === "claim" || sessionId === "local" || suffix === "/close") return null;
  return { sessionId, suffix, search: parsed.search };
}

function widgetApiHeaders(daemon, identity, body) {
  return {
    ...(daemon?.token ? { "x-canvasight-token": daemon.token } : {}),
    ...(body === null || body === undefined ? {} : { "content-type": "application/json" }),
    "x-canvasight-open-attempt-id": identity.openAttemptId,
    "x-canvasight-widget-instance-id": identity.widgetInstanceId,
    "x-canvasight-startup-stage": identity.startupStage,
    "x-canvasight-display-mode": identity.displayMode,
    "x-canvasight-thread-id": identity.threadId,
    "x-canvasight-react-mounted": identity.reactMounted ? "true" : "false"
  };
}

export async function proxyWidgetApiRequest(daemon, route, method, body, identity) {
  const response = await fetch(new URL(route, daemon.origin), {
    method,
    headers: widgetApiHeaders(daemon, identity, body),
    ...(body === null || body === undefined ? {} : { body: JSON.stringify(body) })
  });
  const text = await response.text();
  let payload = null;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = text || null;
  }
  return { response, text, payload };
}

export function widgetApiError(result) {
  if (result.response.ok) return { code: null, error: null };
  const error = result.payload && typeof result.payload === "object" && typeof result.payload.error === "string"
    ? result.payload.error
    : result.text || `Canvasight daemon request failed: ${result.response.status}`;
  const code = result.payload && typeof result.payload === "object" && typeof result.payload.code === "string"
    ? result.payload.code
    : null;
  return { code, error };
}
