---
name: canvasight-run
description: Handle Canvasight Run output in the current Codex thread. Use when a Run arrives through the native widget host bridge, when a browser/dev Run is queued for await_canvasight_run fallback, or when the user asks about Chat, Plan, or Goal mode handling.
---

# Canvasight Run

Use this skill to handle Canvasight Run payloads and their Codex mode.

## Workflow

1. If the Run arrived as a normal Codex follow-up turn from the Canvasight native widget host bridge, use that Markdown directly.
2. If the user opened Canvasight through a browser/dev fallback, call `claim_canvasight_thread` before clicking Run in an old tab so the daemon scopes the queued Run to the current thread. A bare `5173` page without an explicit claim must be treated as unbound, not as a sent Run.
3. If the user already clicked Run but no Codex turn appeared, call `await_canvasight_run`. If the current thread's Canvasight MCP transport is missing or closed, state that the fallback queue cannot be consumed from this stale thread and require a reload/new thread with current Canvasight tools.
4. Prefer `sessionId` when available; use `projectPath` to attach to the next queued Run from any active session in that project.
5. Treat returned Markdown and `structuredContent` as the source of truth for the next Codex action.
6. If `structuredContent.agentTeam.enabled` is true, use `canvasight-agent-team` before executing the task.

Normal Canvasight Run delivery must come from the Codex native widget host bridge, using either MCP Apps `ui/message` or Codex/OpenAI compatibility `window.openai.sendFollowUpMessage`. Browser URLs and bare dev pages must not silently pretend success: if no claim exists, the UI must report `unbound_dev_session`; otherwise it queues the payload for `await_canvasight_run`. Do not treat Codex app-server `turn/start` as a Run delivery path.

For native Chat, Plan, and Goal handling, read `references/run-output-contract.md`.
