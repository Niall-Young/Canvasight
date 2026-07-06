# Canvasight Open Workflow

## Open A Session

Call `render_canvasight_canvas_widget` with `projectPath` when the workspace path is known. The tool starts or reuses Canvasight's project-level local daemon and renders a Codex native widget backed by the existing Canvasight web app.

The native widget is the normal path because it receives the Codex host bridge. Clicking Run inside the widget sends a follow-up message to the current Codex thread without needing a thread id, virtual clicks, clipboard paste, or Accessibility automation.

Use `open_canvasight` when widget rendering is unavailable or a browser URL fallback is explicitly needed. A browser fallback page does not have the widget host bridge, but after `claim_canvasight_thread` the project daemon should target the current thread through native app-server `turn/start`. If that native request fails, clicking Run queues a payload for `await_canvasight_run` or reports an unbound session. If `render_canvasight_canvas_widget` is missing in the current thread after a plugin update, tell the user that the thread has stale MCP tools and must be reloaded or replaced before widget-bridge delivery can work.

In fallback cases, open the full returned `browserUrl` / `url` in Codex's in-app Browser/sidebar. Do not navigate only to the origin because the session id and token are part of the usable URL. Canvasight does not launch the system browser by default; set `CANVASIGHT_OPEN_EXTERNAL_BROWSER=1` only for local development debugging.

The returned `canvasRouting` marks the project as active Canvasight context. For later medium or complex requests that benefit from decomposition, prefer `write_canvasight_graph` with `append-page` before direct execution. Do not route small direct commands, simple questions, or Canvasight Run payloads back into graph writing.

## Recover A Recent Project

If a browser fallback page is still open and the user moved to a new Codex thread, call `claim_canvasight_thread` with the known `projectPath`, `sessionId`, or most recent project. This scopes future Run payloads and native app-server delivery to the current thread without opening another page. Native widget Run delivery does not require this manual claim when the host bridge is available.

Use `list_canvasight_recent_projects` followed by `open_canvasight_recent_project` when the user wants a browser fallback URL for a recent project from a new Codex thread or the existing page is not usable.

The web service is project-level and should survive the Codex thread that opened it. If an older URL was created before persistent daemon support, reopen with `open_canvasight_recent_project`.

## Attach From A New Thread

Opening the native widget and receiving Run output should be one flow: the widget host bridge sends a follow-up message to the current thread. Browser fallback pages are different: a browser Run should first try daemon native app-server delivery for the latest thread that claimed the project/session, then queue for `await_canvasight_run` only if direct delivery fails. A new Codex thread should call `claim_canvasight_thread` before the user clicks Run in an old browser tab; use `canvasight-run` to recover queued payloads when needed.

## Close A Session

`close_canvasight` closes the specific Canvasight session. It does not stop the project-level daemon.
