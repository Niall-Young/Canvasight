---
name: canvasight
description: Use when the user wants to open Canvasight, arrange task nodes on a local canvas, convert a node or flow into Markdown, or return Canvasight output to whichever Codex thread is currently waiting for the project run.
---

# Canvasight

Use the Canvasight MCP tools when a task benefits from visual planning, connected prompt nodes, attachments, or a reusable local `.scatter` project.

## Fast Route

- Opening or recovering the browser canvas: read `references/workflow.md`.
- Creating nodes and edges from analysis: read `references/ai-graph-writing.md`.
- Choosing how a generated canvas should be structured: read `references/graph-type-classification.md`.
- Handling Chat, Plan, or Goal runs: read `references/codex-native-modes.md`.

## Default Workflow

1. Call `open_canvasight` with the current workspace path when available.
2. Navigate Codex's in-app Browser to the full returned `browserUrl` / `url`, including query parameters.
3. Let the user operate the canvas and click Run on the target node or flow.
4. Call `await_canvasight_run` from the Codex thread that should receive the next Run payload.
5. Treat the returned Markdown and `structuredContent` as the source of truth for the next Codex action.

Use `list_canvasight_recent_projects` and `open_canvasight_recent_project` to recover a project from a new Codex thread. Normal plugin use should not ask the user to run `npm run dev`.

## AI Graph Writing

Use `write_canvasight_graph` when the user asks Codex to create or update Canvasight nodes and connections from a structured breakdown. Prefer the tool over hand-editing `.scatter/scatter.json`.

Set `mode` from the user's write intent:

- `append-page`: safe default when the user asks for a new generated workspace.
- `replace-active-page`: only when the user explicitly wants to replace the current Page.
- `replace-document`: only when the user explicitly wants to replace the whole Canvasight document.

Set `graphType` from the task structure, not from Page behavior:

- `software-product`
- `article-outline`
- `codebase-structure`
- `task-plan`
- `general`

`graphType` controls how AI organizes node titles, prompts, edges, and default layout. It does not decide whether a Page is created, selected, or replaced.

Generated edges follow manual canvas rules: one node may connect to multiple downstream nodes, but self-connections, duplicate `source -> target` edges, and multiple parent edges into the same target are invalid.

## Hard Rules

- The Run payload belongs to the Codex thread that calls `await_canvasight_run`.
- Do not use macOS Accessibility automation, virtual clicks, clipboard paste, DOM clicks, or `codex://threads/new` to send Canvasight output.
- Do not silently downgrade native Plan or Goal requests into normal prose. Follow `references/codex-native-modes.md`.
