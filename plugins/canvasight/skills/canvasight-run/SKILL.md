---
name: canvasight-run
description: Handle Canvasight Run output in the current Codex thread. Use when the user clicked Run in Canvasight, a Canvasight Run arrived through direct delivery, a queued Run needs await_canvasight_run fallback, or the user asks whether a Canvasight node should run in Chat, Plan, or Goal mode.
---

# Canvasight Run

Use this skill to handle Canvasight Run payloads and their Codex mode.

## Workflow

1. If the Run arrived as a normal Codex turn from Canvasight, use that Markdown directly.
2. If the user is in a new Codex thread before clicking Run in an already-open browser tab, call `claim_canvasight_thread` first so future Run clicks go directly to the current thread.
3. If the user already clicked Run but no turn appeared, call `await_canvasight_run`.
4. Prefer `sessionId` when available; use `projectPath` to attach to the next queued Run from any active session in that project.
5. Treat the returned Markdown and `structuredContent` as the source of truth for the next Codex action.
6. If `structuredContent.agentTeam.enabled` is true, use `canvasight-agent-team` before executing the task.

When the browser session or project is claimed by a Codex thread, the web Run path can start that thread directly through Codex app-server `turn/start`. `await_canvasight_run` remains the queued fallback path.

For native Chat, Plan, and Goal handling, read `references/run-output-contract.md`.
