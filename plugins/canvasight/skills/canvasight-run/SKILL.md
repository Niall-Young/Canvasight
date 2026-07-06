---
name: canvasight-run
description: Handle Canvasight Run output in the current Codex thread. Use when the user clicked Run in Canvasight, a Canvasight Run arrived through direct delivery, a queued Run needs await_canvasight_run fallback, or the user asks whether a Canvasight node should run in Chat, Plan, or Goal mode.
---

# Canvasight Run

Use this skill to handle Canvasight Run payloads and their Codex mode.

## Workflow

1. If the Run arrived as a normal Codex turn from Canvasight, use that Markdown directly.
2. If the user clicked Run but no turn appeared, or when attaching from a new Codex thread to a browser tab opened earlier, call `await_canvasight_run`.
3. Prefer `sessionId` when available; use `projectPath` to attach to the next Run from any active session in that project.
4. Treat the returned Markdown and `structuredContent` as the source of truth for the next Codex action.
5. If `structuredContent.agentTeam.enabled` is true, use `canvasight-agent-team` before executing the task.

When the browser session is bound to a Codex thread, the web Run path can start that thread directly through Codex app-server `turn/start`. `await_canvasight_run` remains the fallback and cross-thread attachment path.

For native Chat, Plan, and Goal handling, read `references/run-output-contract.md`.
