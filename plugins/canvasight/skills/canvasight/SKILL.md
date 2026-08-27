---
name: canvasight
description: "Canvasight plugin index. Use when the user explicitly mentions Canvasight or Scatter, says 打开画布 / 打开 Canvasight, asks @Canvasight to generate an image into the canvas, and the request spans multiple Canvasight workflows, or when a Canvasight canvas is already open/attached and a later request is ambiguous or large enough to decide whether it should route through graph writing before direct execution."
---

# Canvasight

Use this skill as the narrow index for Canvasight-specific work that does not clearly fit one specialized Canvasight skill.

## Prefer Specialized Skills

- Use `canvasight-open` for opening the native widget through `open_canvasight`, verifying it through `await_canvasight_widget_ready`, recovering an explicit browser fallback, or claiming an existing browser canvas for the current Codex task.
- Use `canvasight-run` for Chat-only native widget bridge Run delivery, `claim_canvasight_thread`, `await_canvasight_run` fallback, and legacy Plan/Goal-to-Chat normalization.
- Use `canvasight-agent-team` when a Canvasight Run payload enables Agent Team or the user asks for role-registry or agent-report coordination.
- Use `canvasight-graph-writer` for creating or updating Canvasight nodes and edges from AI analysis, including active-canvas medium or complex requests that should be decomposed before direct execution.
- Use `canvasight-imagegen` when `@Canvasight` asks to generate, draw, or render a new bitmap directly into the active Page. It owns the verified-open, `$imagegen`, and atomic Asset import sequence.
- Use `canvasight-update` when the user asks to check for or install an official Canvasight update. Keep check-only requests read-only, and delegate installation and rollback entirely to its bundled updater.
- Use `canvasight-troubleshooting` for install, daemon, MCP cache, browser URL, or connection failures.
- Use `canvasight-history-check` only when a user-started History check prompt supplies an exact protected snapshot and short-lived token. It validates that snapshot and records bounded evidence; it cannot confirm, merge, or push.
- When a user clicks **回到原聊天 / Open original task** or **从这里继续 / Continue from here**, follow the widget-generated prompt exactly: use the named first-party Codex navigation or task-creation tool, then call `record_project_history_host_action` with the supplied short-lived token and the real outcome. If `create_thread` returns only `clientThreadId`, record `queued`, call `list_threads` once, and promote the same receipt to `succeeded` only after one new Worktree task is unambiguously identified and `read_thread` confirms its source task, node id, snapshot commit, and recovery warning. The promotion must carry both the original `clientThreadId` and real `targetTaskId`; otherwise leave it queued. The receipt tool records metadata only and never substitutes for the host action.

Project History is a native widget workspace, not a graph-writing tool. When the user asks to inspect project history, switch to **History** in the verified Canvasight widget. History nodes are derived, read-only recovery records; user-initiated summary edits, feature reclassification, restore-task requests, confirmation, local-main merge, and metadata-only portability sync stay inside the widget/daemon workflow. The only model-visible History mutation tools are the widget-token-bound metadata recorders `record_project_history_agent_check` and `record_project_history_host_action`; neither performs the checked or host action, and there is no model-visible Git write tool.

## Shared Boundaries

- Canvasight output must return through the MCP native widget host bridge or MCP daemon `await_canvasight_run` fallback, not app-server `turn/start`, UI automation, Accessibility, DOM clicks, or clipboard paste. Native widget host bridge includes MCP Apps `ui/message` and Codex/OpenAI compatibility `window.openai.sendFollowUpMessage`.
- Do not use macOS Accessibility automation, virtual clicks, clipboard paste, DOM clicks, or `codex://threads/new`.
- Page write behavior is controlled by `mode`; task structure is controlled by `graphType`.
- Normal plugin use should not ask the user to run `npm run dev`.
- `open_canvasight` completion is provisional. Treat its `sessionId` plus `openAttemptId` and the mandatory instance-bound await as one open action. Only verified fullscreen readiness with true React/project/canvas evidence confirms the native widget; fallback, daemon health, resource reads, and automated tests do not.
- An open Canvasight session creates active canvas context. If the user says "用画布", "放到画布", "写到画布", or equivalent while Canvasight is active, treat "canvas" as Canvasight graph writing unless they explicitly mean a web `<canvas>` element.
- Prefer graph writing for later medium or complex structured requests, but keep small direct commands and Run payloads on their normal path.
- Never represent Project History by creating Workflow Task/Asset/Group nodes. Do not write recovery points, commits, chat markers, confirmations, or merge states into `.scatter/scatter.json`.
