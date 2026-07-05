---
name: canvasight
description: Canvasight plugin index. Use only when the user explicitly mentions Canvasight or Scatter and the request spans multiple Canvasight plugin workflows, is ambiguous, or does not clearly fit the narrower Canvasight skills for opening the canvas, receiving Run output, writing AI graph nodes, or troubleshooting plugin/runtime issues.
---

# Canvasight

Use this skill as the narrow index for Canvasight-specific work that does not clearly fit one specialized Canvasight skill.

## Prefer Specialized Skills

- Use `canvasight-open` for opening, recovering, or attaching to the browser canvas.
- Use `canvasight-run` for receiving Run payloads and handling Chat, Plan, or Goal mode.
- Use `canvasight-agent-team` when a Canvasight Run payload enables Agent Team or the user asks for agent-report coordination.
- Use `canvasight-graph-writer` for creating or updating Canvasight nodes and edges from AI analysis.
- Use `canvasight-troubleshooting` for install, daemon, MCP cache, browser URL, or connection failures.

## Shared Boundaries

- Canvasight output must return through MCP, not UI automation.
- Do not use macOS Accessibility automation, virtual clicks, clipboard paste, DOM clicks, or `codex://threads/new`.
- Page write behavior is controlled by `mode`; task structure is controlled by `graphType`.
- Normal plugin use should not ask the user to run `npm run dev`.
