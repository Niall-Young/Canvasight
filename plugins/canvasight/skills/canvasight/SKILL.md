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

Use `list_canvasight_recent_projects` followed by `open_canvasight_recent_project` when the user wants to reopen Canvasight from a new Codex thread or recover the last canvas. The plugin serves the built web app through the MCP server; do not ask the user to run `npm run dev` for normal plugin use.

Do not use macOS Accessibility automation, virtual clicks, clipboard paste, or `codex://threads/new` to send Canvasight output. The plugin returns output through MCP.

## Codex Native Mode Protocol

After `await_canvasight_run`, read `structuredContent.codexMode` first. If it is missing, treat `structuredContent.planMode === true` as `codexMode: "plan"`; otherwise default to `codexMode: "chat"`.

- `chat`: continue as a normal Codex task using the returned Markdown as context.
- `plan`: treat the Canvasight run as an explicit request to use Codex's native Plan mode. `structuredContent.codexNative.status` must be `applied` before editing files, running side-effectful commands, or carrying out the work. If it is missing, failed, disabled, or skipped, stop and report that native Plan mode was not opened instead of silently downgrading to prose-only planning.
- `goal`: treat the Canvasight run as an explicit request to use Codex's native Goal mode. `structuredContent.codexNative.status` must be `applied` before editing files, running side-effectful commands, or carrying out the work. If it is missing, failed, disabled, or skipped, stop and report that native Goal mode was not opened instead of silently downgrading to a normal task.

Canvasight mode selection is a structured MCP contract backed by Codex app-server native requests. It must not reintroduce UI automation, Accessibility scripting, DOM clicks, clipboard paste, or `codex://threads/new` to toggle Codex controls.
