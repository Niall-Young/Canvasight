---
name: canvasight-open
description: "Open, reopen, or attach to Canvasight's Codex native widget or browser fallback canvas. Use when the user asks to start Canvasight, open the Canvasight workspace, recover a recent project, attach the current Codex thread, or fix open/run routing after thread changes."
---

# Canvasight Open

Use this skill to open or recover Canvasight through MCP.

## Workflow

1. Prefer `render_canvasight_canvas_widget` for normal use. It opens Canvasight as a Codex native widget, and Run can send a follow-up message to the current thread through the host bridge.
2. If the current Codex thread does not expose `render_canvasight_canvas_widget`, report that the thread is using stale plugin tools and should be reloaded or replaced before promising direct Run delivery.
3. Use `open_canvasight` when widget rendering is unavailable or the user needs the in-app browser/dev page. This fallback must claim the current thread before Run so the daemon can scope the queued payload for `await_canvasight_run`; native app-server delivery is diagnostic only unless a future verified host bridge proves current-thread visibility.
4. If Canvasight MCP tools are unavailable and you must open the already running dev page with generic browser control, read the current shell `CODEX_THREAD_ID` and open `http://127.0.0.1:5173/?threadId=<current-thread-id>`. Do not open bare `http://127.0.0.1:5173/` for a thread that expects Run delivery.
5. If a browser fallback URL is returned, open the full `browserUrl` / `url`, including query parameters, in Codex's in-app Browser/sidebar. Do not navigate only to the origin.
6. If an old browser page is already open and the user moved to a new Codex thread, call `claim_canvasight_thread` before Run. Browser fallback Runs should be received with `await_canvasight_run` when the UI says the payload was queued.
7. Use `list_canvasight_recent_projects` and `open_canvasight_recent_project` when the user wants the last Canvasight project from a new Codex thread and no widget/browser page is currently usable.
8. Call `close_canvasight` only when the specific session is no longer needed. It does not stop the project-level daemon.

Normal plugin use should not ask the user to run `npm run dev`. The plugin daemon serves the built app and is meant to outlive a thread-local MCP process.

After opening, treat the project as active Canvasight context. Later medium or complex requests should consider `canvasight-graph-writer` before direct execution; small direct commands and Run payloads should stay on their normal path.

For details, read `references/open-workflow.md`.
