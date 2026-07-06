---
name: canvasight-open
description: "Open, reopen, or attach to a Canvasight browser canvas. Use when the user asks to start Canvasight, open the Canvasight web page, recover a recent Canvasight project, attach a new Codex thread to an existing Canvasight project, or fix the normal workflow after archiving the thread that originally opened the canvas."
---

# Canvasight Open

Use this skill to open or recover Canvasight's browser canvas through MCP.

## Workflow

1. Call `open_canvasight` with the current workspace path when available.
2. Navigate Codex's in-app Browser/sidebar to the full returned `browserUrl` / `url`, including query parameters. The MCP server should not open the system browser by default.
3. Use `list_canvasight_recent_projects` and `open_canvasight_recent_project` when the user wants the last Canvasight project from a new Codex thread.
4. Call `close_canvasight` only when the specific session is no longer needed. It does not stop the project-level daemon.

Normal plugin use should not ask the user to run `npm run dev`. The plugin daemon serves the built app and is meant to outlive a thread-local MCP process.

After opening, treat the project as active Canvasight context. Later medium or complex requests should consider `canvasight-graph-writer` before direct execution; small direct commands and Run payloads should stay on their normal path.

For details, read `references/open-workflow.md`.
