---
name: canvasight
description: Use when the user wants to open Canvasight, arrange task nodes on a local canvas, convert a node or flow into Markdown, or return Canvasight output to the current Codex thread.
---

# Canvasight

Use the Canvasight MCP tools when a task benefits from visual planning, connected prompt nodes, attachments, or a reusable local `.scatter` project.

## Workflow

1. Call `open_canvasight` with the current workspace path when available.
2. Ask the user to operate the browser canvas and click Run on the target node or flow.
3. Call `await_canvasight_run` with the returned `sessionId`.
4. Treat the returned Markdown and `structuredContent` as the source of truth for the next Codex action.
5. Call `close_canvasight` when the session is no longer needed.

Do not use macOS Accessibility automation, virtual clicks, clipboard paste, or `codex://threads/new` to send Canvasight output. The plugin returns output through MCP.
