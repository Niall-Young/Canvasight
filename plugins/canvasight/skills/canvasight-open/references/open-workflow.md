# Canvasight Open Workflow

## Open A Session

Call `render_canvasight_canvas_widget` with `projectPath` when the workspace path is known. The tool starts or reuses Canvasight's project-level local daemon and renders a Codex native widget backed by the existing Canvasight web app.

The native widget is the normal path because it receives the Codex host bridge. Clicking Run inside the widget sends a follow-up message to the current Codex thread without needing a thread id, virtual clicks, clipboard paste, or Accessibility automation.

Use `open_canvasight` only when widget rendering is unavailable or a browser URL fallback is explicitly needed. In that fallback case, open the full returned `browserUrl` / `url` in Codex's in-app Browser/sidebar. Do not navigate only to the origin because the session id and token are part of the usable URL. Canvasight does not launch the system browser by default; set `CANVASIGHT_OPEN_EXTERNAL_BROWSER=1` only for local development debugging.

The returned `canvasRouting` marks the project as active Canvasight context. For later medium or complex requests that benefit from decomposition, prefer `write_canvasight_graph` with `append-page` before direct execution. Do not route small direct commands, simple questions, or Canvasight Run payloads back into graph writing.

## Recover A Recent Project

If a browser fallback page is still open and the user moved to a new Codex thread, call `claim_canvasight_thread` with the known `projectPath`, `sessionId`, or most recent project. This scopes future queued Run payloads to the current thread without opening another page. Native widget Run delivery does not require this manual claim when the host bridge is available.

Use `list_canvasight_recent_projects` followed by `open_canvasight_recent_project` when the user wants a browser fallback URL for a recent project from a new Codex thread or the existing page is not usable.

The web service is project-level and should survive the Codex thread that opened it. If an older URL was created before persistent daemon support, reopen with `open_canvasight_recent_project`.

## Attach From A New Thread

Opening the native widget and receiving Run output should be one flow: the widget host bridge sends a follow-up message to the current thread. Browser fallback pages are different. A browser Run queues a payload for the latest thread that claimed the project/session. A new Codex thread should call `claim_canvasight_thread` before the user clicks Run in an old browser tab, then call `await_canvasight_run` with `sessionId` or `projectPath`; use `canvasight-run` for that part.

## Close A Session

`close_canvasight` closes the specific Canvasight session. It does not stop the project-level daemon.
