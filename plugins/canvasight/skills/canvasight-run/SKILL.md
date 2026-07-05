---
name: canvasight-run
description: Receive and apply Canvasight Run output in the current Codex thread. Use when the user clicked Run in Canvasight, wants Canvasight Markdown sent to the current thread, needs await_canvasight_run, or asks whether a Canvasight node should run in Chat, Plan, or Goal mode.
---

# Canvasight Run

Use this skill to wait for Canvasight Run payloads and handle their Codex mode.

## Workflow

1. Call `await_canvasight_run` from the Codex thread that should receive the next Run payload.
2. Prefer the returned `sessionId` when available.
3. When attaching from a new Codex thread to a browser tab opened earlier, call `await_canvasight_run` with `projectPath`.
4. Treat the returned Markdown and `structuredContent` as the source of truth for the next Codex action.
5. If `structuredContent.agentTeam.enabled` is true, use `canvasight-agent-team` before executing the task.

The Run payload belongs to the Codex thread that calls `await_canvasight_run`, not necessarily the thread that originally opened the browser canvas.

For native Chat, Plan, and Goal handling, read `references/run-output-contract.md`.
