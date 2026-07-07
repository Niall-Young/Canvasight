---
name: canvasight-open
description: "Open, reopen, or attach to Canvasight's Codex native widget or browser fallback canvas. Use when the user asks to start Canvasight, open the Canvasight workspace, recover a recent project, attach the current Codex thread, or fix open/run routing after thread changes."
---

# Canvasight Open

Use this skill to open or recover Canvasight through MCP.

## Workflow

1. Prefer `open_canvasight` for normal use. It opens Canvasight as a Codex native widget by default, and Run can send a follow-up message to the current thread only when the actual widget host bridge is present.
2. `render_canvasight_canvas_widget` remains a compatibility alias for explicit widget rendering. If neither `open_canvasight` nor the widget alias exposes `openai/outputTemplate`, report that the thread is using stale plugin tools and should be reloaded or replaced before promising direct Run delivery.
3. Use `open_canvasight_browser_fallback` only when widget rendering is unavailable or the user explicitly needs the in-app browser/dev page. This fallback must claim the current thread before Run so the daemon can scope the queued payload for `await_canvasight_run`; app-server delivery counts as sent only after a matching `turn/started`, `item/started`, or `turn/completed` notification.
4. If Canvasight MCP tools are unavailable and you must open the already running dev page with generic browser control, read the current shell `CODEX_THREAD_ID` and open `http://127.0.0.1:5173/?threadId=<current-thread-id>`. Canvasight will try to resolve that thread's Codex project `cwd` and create/open `.scatter` there. If the current workspace path is already known, include `projectPath=<absolute-project-path>` as an explicit override. Never ask the user to type a local project path.
5. If a browser fallback URL is returned, open the full `browserUrl` / `url`, including query parameters, in Codex's in-app Browser/sidebar. Do not navigate only to the origin.
6. If an old browser page is already open and the user moved to a new Codex thread, call `claim_canvasight_thread` before Run. Browser fallback Runs should be received with `await_canvasight_run` when the UI says the payload was queued.
7. Use `list_canvasight_recent_projects` and `open_canvasight_recent_project` when the user wants the last Canvasight project from a new Codex thread; `open_canvasight_recent_project` also defaults to the native widget.
8. Call `close_canvasight` only when the specific session is no longer needed. It does not stop the project-level daemon.

Normal plugin use should not ask the user to run `npm run dev`. The plugin daemon serves the built app and is meant to outlive a thread-local MCP process.

After opening, treat the project as active Canvasight context. Later medium or complex requests should consider `canvasight-graph-writer` before direct execution; small direct commands and Run payloads should stay on their normal path.

For details, read `references/open-workflow.md`.
