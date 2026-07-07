# Canvasight Open Workflow

## Open A Session

Call `open_canvasight` to open Canvasight for the current Codex project. When `projectPath` is omitted, Canvasight resolves the current thread through Codex app-server `thread/resume` and uses that thread's `cwd` as the project path, creating `.scatter` there if needed. Pass `projectPath` only as an explicit override when the workspace path is already known. The tool starts or reuses Canvasight's project-level local daemon and renders a Codex native widget that directly hosts the built Canvasight web app and talks to the daemon for project APIs. Native open public output must not include the daemon URL; use `_meta.widgetData` only inside the widget shell. `render_canvasight_canvas_widget` remains a compatibility alias for explicit widget rendering.

If `open_canvasight` is missing from the active tool list, call `tool_search` with `canvasight open_canvasight render_canvasight_canvas_widget` before deciding tools are unavailable. Canvasight MCP tools may be lazy-loaded. If `tool_search` exposes `open_canvasight`, call it. If it exposes only `render_canvasight_canvas_widget`, call that compatibility alias. If neither native widget tool is callable after `tool_search`, stop and report `native_canvasight_tool_unavailable`; ask the user to reload or open a new thread. Do not open `127.0.0.1:5173` as the normal recovery path.

If a Canvasight native tool is visible/callable but the call fails with `Transport closed`, stop and report `canvasight_mcp_transport_closed`. This is different from missing tools: the current Codex thread has a stale or dead Canvasight MCP transport. `codex plugin list`, `npm run dev:status`, or direct JSON-RPC smoke tests can still look healthy because the repo-local plugin and daemon are separate from the live thread transport. Since 0.1.44, the stdio shim writes `mcp-lifecycle.log` in the Canvasight state directory and exits cleanly on host stdin close; inspect that log before guessing. If the installed cache is old, reinstall and reload/new-thread, then call `open_canvasight` again. Do not treat browser fallback as a successful native open path in this state.

The native widget is the normal path because it can receive the Codex host bridge. Clicking Run inside the widget sends a follow-up message to the current Codex thread without needing a thread id, virtual clicks, clipboard paste, or Accessibility automation. The widget bridge can use MCP Apps `ui/message` or Codex/OpenAI compatibility `window.openai.sendFollowUpMessage`; both are native widget transports, not browser fallback.

`openai/outputTemplate` and widget metadata are necessary but not sufficient proof that Codex Desktop actually rendered the widget. Use Canvasight Diagnostics to classify the live page: `canvasightHost=widget`, `window.canvasightMcp`, `bridgeTransport`, `bridgeReason`, bridge availability, and recent Run `status/via/reason`. A direct widget app may have `window.parent === window`; iframe status alone is not the widget test. A `threadId` scopes browser fallback queues; it is not direct-send permission.

Use `open_canvasight_browser_fallback` only when a browser URL fallback is explicitly requested for debugging or dev-page inspection. A browser fallback page does not have the widget host bridge; after `claim_canvasight_thread` the project daemon scopes future Run payloads to the current thread and keeps them available for `await_canvasight_run`. It must not report app-server delivery as sent. If `open_canvasight` lacks widget metadata in the current thread after a plugin update, tell the user that the thread has stale MCP tools and must be reloaded or replaced before widget-bridge delivery can work. If the visible Canvasight tools fail with `Transport closed`, inspect the MCP lifecycle log and report `canvasight_mcp_transport_closed` instead of attempting browser fallback as recovery.

In fallback cases, open the full returned `browserUrl` / `url` in Codex's in-app Browser/sidebar. Do not navigate only to the origin because the session id and token are part of the usable URL. Canvasight does not launch the system browser by default; set `CANVASIGHT_OPEN_EXTERNAL_BROWSER=1` only for local development debugging.

Do not use generic browser control to open the dev server for normal "open Canvasight" requests. A `127.0.0.1:5173` page is browser fallback, not a native widget, and Run cannot direct-send from it. Use generic browser control only after the user explicitly asks for a browser fallback/dev page.

The returned `canvasRouting` marks the project as active Canvasight context. For later medium or complex requests that benefit from decomposition, prefer `write_canvasight_graph` with `append-page` before direct execution. Do not route small direct commands, simple questions, or Canvasight Run payloads back into graph writing.

## Recover A Recent Project

If a browser fallback page is still open and the user moved to a new Codex thread, call `claim_canvasight_thread` with the known `projectPath`, `sessionId`, or most recent project. This scopes future fallback Run attempts and queued payloads to the current thread without opening another page. Native widget Run delivery does not require this manual claim when the host bridge is available.

Use `list_canvasight_recent_projects` followed by `open_canvasight_recent_project` when the user wants to reopen a recent project from a new Codex thread. That path defaults to the native widget; if the recent-project tool is not callable, use `tool_search` before declaring it unavailable. Use `open_canvasight_browser_fallback` only for explicit fallback debugging.

The web service is project-level and should survive the Codex thread that opened it. If an older URL was created before persistent daemon support, reopen with `open_canvasight_recent_project`.

## Attach From A New Thread

Opening the native widget and receiving Run output should be one flow: the widget host bridge sends a follow-up message to the current thread. Browser fallback pages are different: a browser Run should target the latest thread that explicitly claimed the project/session and stay recoverable through `await_canvasight_run`; it is not a sent path. A new Codex thread should call `claim_canvasight_thread` before the user clicks Run in an old browser tab; an unclaimed bare dev page must report `unbound_dev_session` instead of sending to an old launch thread. Use `canvasight-run` to recover queued payloads when needed.

## Close A Session

`close_canvasight` closes the specific Canvasight session. It does not stop the project-level daemon.
