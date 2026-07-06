---
name: canvasight
description: "Canvasight plugin index. Use when the user explicitly mentions Canvasight or Scatter and the request spans multiple Canvasight workflows, or when a Canvasight canvas is already open/attached and a later request is ambiguous or large enough to decide whether it should route through graph writing before direct execution."
---

# Canvasight

Use this skill as the narrow index for Canvasight-specific work that does not clearly fit one specialized Canvasight skill.

## Prefer Specialized Skills

- Use `canvasight-open` for opening, recovering, or attaching to the browser canvas.
- Use `canvasight-run` for receiving Run payloads and handling Chat, Plan, or Goal mode.
- Use `canvasight-agent-team` when a Canvasight Run payload enables Agent Team or the user asks for agent-report coordination.
- Use `canvasight-graph-writer` for creating or updating Canvasight nodes and edges from AI analysis, including active-canvas medium or complex requests that should be decomposed before direct execution.
- Use `canvasight-troubleshooting` for install, daemon, MCP cache, browser URL, or connection failures.

## Shared Boundaries

- Canvasight output must return through MCP, not UI automation.
- Do not use macOS Accessibility automation, virtual clicks, clipboard paste, DOM clicks, or `codex://threads/new`.
- Page write behavior is controlled by `mode`; task structure is controlled by `graphType`.
- Normal plugin use should not ask the user to run `npm run dev`.
- An open Canvasight session creates active canvas context. Prefer graph writing for later medium or complex structured requests, but keep small direct commands and Run payloads on their normal path.
