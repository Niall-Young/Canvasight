---
name: canvasight-run
description: Handle Canvasight Run output in the current Codex thread. Use when a Run arrives through the native widget host bridge, when a browser/dev Run is queued for await_canvasight_run fallback, or when the user asks about Chat, Plan, or Goal mode handling.
---

# Canvasight Run

Use this skill to handle Canvasight Run payloads and their Codex mode.

## Workflow

1. If the Run arrived as a normal Codex follow-up turn from the Canvasight native widget, use that Markdown directly.
2. If the user opened Canvasight through a browser/dev fallback, call `claim_canvasight_thread` before clicking Run in an old tab so queued payloads are filtered to the current thread.
3. If the user already clicked Run but no Codex turn appeared, call `await_canvasight_run`.
4. Prefer `sessionId` when available; use `projectPath` to attach to the next queued Run from any active session in that project.
5. Treat returned Markdown and `structuredContent` as the source of truth for the next Codex action.
6. If `structuredContent.agentTeam.enabled` is true, use `canvasight-agent-team` before executing the task.

Normal Canvasight Run delivery should come from the Codex native widget host bridge. Browser URLs and bare dev pages remain fallback surfaces; they queue payloads for `await_canvasight_run` unless an explicit development native path is enabled. Do not assume a browser click reached the current Codex thread unless a real Codex turn appears.

For native Chat, Plan, and Goal handling, read `references/run-output-contract.md`.
