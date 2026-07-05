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

## Codex Mode Protocol

After `await_canvasight_run`, read `structuredContent.codexMode` first. If it is missing, treat `structuredContent.planMode === true` as `codexMode: "plan"`; otherwise default to `codexMode: "chat"`.

- `chat`: continue as a normal Codex task using the returned Markdown as context.
- `plan`: behave as if the user explicitly requested planning first. Provide the execution plan and wait for user confirmation before editing files, running side-effectful commands, or otherwise carrying out the work.
- `goal`: treat the Canvasight run as an explicit request to work under a goal. If a native goal tool is available and the objective is clear from the returned Markdown/thread name, create the goal before implementation and keep the goal status accurate until completion or a real blocker. If no native goal tool is available, state that goal mode was requested and follow the same objective-driven workflow in the current thread.

Canvasight mode selection is a structured MCP contract. It must not reintroduce UI automation or virtual clicks to toggle Codex controls.
