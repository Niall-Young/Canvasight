---
name: canvasight-open
description: "Open, reopen, or attach to Canvasight's Codex native widget or browser fallback canvas. Use when the user asks to start Canvasight, open the Canvasight workspace, recover a recent project, attach the current Codex thread, or fix open/run routing after thread changes."
---

# Canvasight Open

Use this skill to open or recover Canvasight through MCP.

## Workflow

1. Prefer `open_canvasight` for normal use. It opens Canvasight as a Codex native widget by default, and Run can send a follow-up message to the current thread only when the actual widget host bridge is present. The bridge may be MCP Apps `ui/message` or Codex/OpenAI compatibility `window.openai.sendFollowUpMessage`; both are native widget transports. Native open public output should not include localhost URLs; daemon URL, origin, and token belong only in `_meta.widgetData`.
2. If `open_canvasight` is not already callable in the active tool list, first call `tool_search` with `canvasight open_canvasight render_canvasight_canvas_widget`. Canvasight tools may be lazy-loaded. If `tool_search` exposes the native tools, call `open_canvasight` or `render_canvasight_canvas_widget`; do not open `127.0.0.1:5173` as normal recovery.
3. If `open_canvasight`, `render_canvasight_canvas_widget`, `open_canvasight_recent_project`, or `await_canvasight_run` is callable but fails with `Transport closed`, report `canvasight_mcp_transport_closed`. That means the current Codex thread has stale/dead Canvasight MCP transport even if `codex plugin list` and the daemon look healthy. Stop the normal open or Run-recovery flow, inspect the 0.1.44+ `mcp-lifecycle.log` when available, reinstall/reload the plugin if the cache is stale, and do not open browser fallback as if direct Run delivery can work.
4. `render_canvasight_canvas_widget` remains a compatibility alias for explicit widget rendering. If neither `open_canvasight` nor the widget alias is callable after `tool_search`, or if they lack `openai/outputTemplate`, report `native_canvasight_tool_unavailable` and ask for reload/new thread before promising direct Run delivery.
5. Use `open_canvasight_browser_fallback` only when the user explicitly asks for browser fallback, debugging URL, or dev page. This fallback must claim the current thread before Run so the daemon can scope the queued payload for `await_canvasight_run`; it must not report app-server delivery as sent.
6. Do not use generic browser control to open `http://127.0.0.1:5173/` for normal "open Canvasight" requests. A localhost page is browser fallback and has no native widget host bridge.
7. If a browser fallback URL is returned after an explicit fallback request, open the full `browserUrl` / `url`, including query parameters, in Codex's in-app Browser/sidebar. Do not navigate only to the origin.
8. If an old browser page is already open and the user moved to a new Codex thread, call `claim_canvasight_thread` before Run. Browser fallback Runs should be received with `await_canvasight_run` when the UI says the payload was queued.
9. Use `list_canvasight_recent_projects` and `open_canvasight_recent_project` when the user wants the last Canvasight project from a new Codex thread; `open_canvasight_recent_project` also defaults to the native widget.
10. Call `close_canvasight` only when the specific session is no longer needed. It does not stop the project-level daemon.

Normal plugin use should not ask the user to run `npm run dev`. The plugin daemon serves the built app and is meant to outlive a thread-local MCP process.

After opening, treat the project as active Canvasight context. Later medium or complex requests should consider `canvasight-graph-writer` before direct execution; small direct commands and Run payloads should stay on their normal path.

For details, read `references/open-workflow.md`.
