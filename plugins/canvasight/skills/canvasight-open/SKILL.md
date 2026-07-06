---
name: canvasight-open
description: "Open, reopen, or attach to Canvasight's Codex native widget or browser fallback canvas. Use when the user asks to start Canvasight, open the Canvasight workspace, recover a recent project, attach the current Codex thread, or fix open/run routing after thread changes."
---

# Canvasight Open

Use this skill to open or recover Canvasight through MCP.

## Workflow

1. Prefer `render_canvasight_canvas_widget` for normal use. It opens Canvasight as a Codex native widget, and Run can send a follow-up message to the current thread through the host bridge.
2. Use `open_canvasight` only when widget rendering is unavailable or when a browser fallback URL is explicitly needed for recovery/debugging.
3. If a browser fallback URL is returned, open the full `browserUrl` / `url`, including query parameters, in Codex's in-app Browser/sidebar. Do not navigate only to the origin.
4. If an old browser page is already open and the user moved to a new Codex thread, call `claim_canvasight_thread` before receiving fallback queued Runs.
5. Use `list_canvasight_recent_projects` and `open_canvasight_recent_project` when the user wants the last Canvasight project from a new Codex thread and no widget/browser page is currently usable.
6. Call `close_canvasight` only when the specific session is no longer needed. It does not stop the project-level daemon.

Normal plugin use should not ask the user to run `npm run dev`. The plugin daemon serves the built app and is meant to outlive a thread-local MCP process.

After opening, treat the project as active Canvasight context. Later medium or complex requests should consider `canvasight-graph-writer` before direct execution; small direct commands and Run payloads should stay on their normal path.

For details, read `references/open-workflow.md`.
