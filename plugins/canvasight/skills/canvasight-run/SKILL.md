---
name: canvasight-run
description: Handle Chat-only Canvasight Run output in the current Codex thread. Use when a Run arrives through the native widget host bridge, when a browser/dev Run is queued for await_canvasight_run fallback, or when legacy Plan or Goal node data must be treated as Chat.
---

# Canvasight Run

Use this skill to handle Canvasight Run payloads as Chat follow-ups.

## Workflow

1. If the Run arrived as a normal Codex follow-up turn from the Canvasight native widget host bridge, use that Markdown directly.
2. If the user opened Canvasight through a browser/dev fallback, call `claim_canvasight_thread` before clicking Run in an old tab so the daemon scopes the queued Run to the current thread. A bare `5173` page without an explicit claim must be treated as unbound, not as a sent Run.
3. If the user already clicked Run but no Codex turn appeared, call `await_canvasight_run`. If `await_canvasight_run` is not callable, use `tool_search` for Canvasight tools first. If it is callable but fails with `Transport closed`, report `canvasight_mcp_transport_closed`: the fallback queue cannot be consumed from this stale task. Inspect `mcp-lifecycle.log` when available, then reload or use a new task with current Canvasight tools.
4. Prefer `sessionId` when available; use `projectPath` to attach to the next queued Run from any active session in that project.
5. Treat returned Markdown and `structuredContent` as the source of truth for the next Codex action.
6. If `structuredContent.agentTeam.enabled` is true, use `canvasight-agent-team` before executing the task. Read its schema and `ROSTER.md` before assigning or rebuilding a role.

Normal Canvasight Run delivery must come from the Codex native widget host bridge, using either MCP Apps `ui/message` or Codex/OpenAI compatibility `window.openai.sendFollowUpMessage`. If the UI reports `browser_fallback_no_bridge`, the page was opened through browser fallback/dev URL instead of the native widget; reopen with `open_canvasight` after `tool_search`, or receive the queued fallback with `await_canvasight_run`. If those visible Canvasight MCP tools fail with `Transport closed`, stop, inspect `mcp-lifecycle.log`, and report `canvasight_mcp_transport_closed` instead of promising queued recovery in the same stale thread. Browser URLs and bare dev pages must not silently pretend success: if no claim exists, the UI must report `unbound_dev_session`; otherwise it queues the payload for `await_canvasight_run`. Do not treat Codex app-server `turn/start` as a Run delivery path.

Native open must have received the active task's explicit `CODEX_THREAD_ID` and passed the instance-bound await gate with verified fullscreen React/project/canvas evidence; Run is accepted only from that same instance. Do not use a missing `hostCapabilities.message` declaration alone to disable Run after the MCP App handshake succeeds. Call `sendMessage` and treat only its resolved Promise as sent.

Read `references/run-output-contract.md` for Chat delivery and legacy-node normalization.
