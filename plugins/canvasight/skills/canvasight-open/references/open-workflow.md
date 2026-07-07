# Canvasight Open Workflow

## Open A Session

Call `open_canvasight` to open Canvasight for the current Codex project. When `projectPath` is omitted, Canvasight resolves the current thread through Codex app-server `thread/resume` and uses that thread's `cwd` as the project path, creating `.scatter` there if needed. Pass `projectPath` only as an explicit override when the workspace path is already known. The tool starts or reuses Canvasight's project-level local daemon and renders a Codex native widget that directly hosts the built Canvasight web app and talks to the daemon for project APIs. `render_canvasight_canvas_widget` remains a compatibility alias for explicit widget rendering.

The native widget is the normal path because it can receive the Codex host bridge. Clicking Run inside the widget sends a follow-up message to the current Codex thread without needing a thread id, virtual clicks, clipboard paste, or Accessibility automation.

`openai/outputTemplate` and widget metadata are necessary but not sufficient proof that Codex Desktop actually rendered the widget. Use Canvasight Diagnostics to classify the live page: `canvasightHost=widget`, `window.canvasightMcp`, bridge availability, and recent Run `status/via/reason`. A direct widget app may have `window.parent === window`; iframe status alone is not the widget test. A `threadId` scopes browser fallback queues; it is not direct-send permission.

Use `open_canvasight_browser_fallback` when widget rendering is unavailable or a browser URL fallback is explicitly needed. A browser fallback page does not have the widget host bridge; after `claim_canvasight_thread` the project daemon scopes future Run payloads to the current thread queue for `await_canvasight_run`. If app-server delivery is enabled, treat it as sent only after a matching confirmation notification; accepted `turn/start` alone remains queued. If `open_canvasight` lacks widget metadata in the current thread after a plugin update, tell the user that the thread has stale MCP tools and must be reloaded or replaced before widget-bridge delivery can work.

In fallback cases, open the full returned `browserUrl` / `url` in Codex's in-app Browser/sidebar. Do not navigate only to the origin because the session id and token are part of the usable URL. Canvasight does not launch the system browser by default; set `CANVASIGHT_OPEN_EXTERNAL_BROWSER=1` only for local development debugging.

If the current thread does not expose Canvasight MCP tools and the only practical fallback is the generic dev server at `http://127.0.0.1:5173/`, read the current shell `CODEX_THREAD_ID` first. Open `http://127.0.0.1:5173/?threadId=<current-thread-id>`. The dev page will ask the daemon to resolve that thread's Codex project `cwd` and open/create `.scatter` there. Include URL-encoded `projectPath=<absolute-project-path>` only as an explicit override when already known. The dev server must not show a manual project path gate during normal plugin opening.

The returned `canvasRouting` marks the project as active Canvasight context. For later medium or complex requests that benefit from decomposition, prefer `write_canvasight_graph` with `append-page` before direct execution. Do not route small direct commands, simple questions, or Canvasight Run payloads back into graph writing.

## Recover A Recent Project

If a browser fallback page is still open and the user moved to a new Codex thread, call `claim_canvasight_thread` with the known `projectPath`, `sessionId`, or most recent project. This scopes future queued Run payloads to the current thread without opening another page. Native widget Run delivery does not require this manual claim when the host bridge is available.

Use `list_canvasight_recent_projects` followed by `open_canvasight_recent_project` when the user wants to reopen a recent project from a new Codex thread. That path defaults to the native widget; use `open_canvasight_browser_fallback` only for explicit fallback debugging.

The web service is project-level and should survive the Codex thread that opened it. If an older URL was created before persistent daemon support, reopen with `open_canvasight_recent_project`.

## Attach From A New Thread

Opening the native widget and receiving Run output should be one flow: the widget host bridge sends a follow-up message to the current thread. Browser fallback pages are different: a browser Run should queue for `await_canvasight_run` under the latest thread that explicitly claimed the project/session. A new Codex thread should call `claim_canvasight_thread` before the user clicks Run in an old browser tab; an unclaimed bare dev page must report `unbound_dev_session` instead of sending to an old launch thread. Use `canvasight-run` to recover queued payloads when needed.

## Close A Session

`close_canvasight` closes the specific Canvasight session. It does not stop the project-level daemon.
