---
name: canvasight
description: "Canvasight plugin index. Use when the user explicitly mentions Canvasight or Scatter and the request spans multiple Canvasight workflows, or when a Canvasight canvas is already open/attached and a later request is ambiguous or large enough to decide whether it should route through graph writing before direct execution."
---

# Canvasight

Use this skill as the narrow index for Canvasight-specific work that does not clearly fit one specialized Canvasight skill.

## Prefer Specialized Skills

- Use `canvasight-open` for opening, recovering, or claiming an existing browser canvas for the current Codex thread.
- Use `canvasight-run` for direct Run delivery, `claim_canvasight_thread`, `await_canvasight_run` fallback, and Chat, Plan, or Goal mode handling.
- Use `canvasight-agent-team` when a Canvasight Run payload enables Agent Team or the user asks for agent-report coordination.
- Use `canvasight-graph-writer` for creating or updating Canvasight nodes and edges from AI analysis, including active-canvas medium or complex requests that should be decomposed before direct execution.
- Use `canvasight-troubleshooting` for install, daemon, MCP cache, browser URL, or connection failures.

## Shared Boundaries

- Canvasight output must return through MCP and Codex app-server, not UI automation.
- Do not use macOS Accessibility automation, virtual clicks, clipboard paste, DOM clicks, or `codex://threads/new`.
- Page write behavior is controlled by `mode`; task structure is controlled by `graphType`.
- Normal plugin use should not ask the user to run `npm run dev`.
- An open Canvasight session creates active canvas context. If the user says "用画布", "放到画布", "写到画布", or equivalent while Canvasight is active, treat "canvas" as Canvasight graph writing unless they explicitly mean a web `<canvas>` element.
- Prefer graph writing for later medium or complex structured requests, but keep small direct commands and Run payloads on their normal path.
