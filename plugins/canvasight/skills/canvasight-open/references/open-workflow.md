# Canvasight Open Workflow

## Native Open Is A Two-Step Contract

Read the active Codex task's `CODEX_THREAD_ID`, then call `open_canvasight` with that exact value as `threadId`. When `projectPath` is omitted, Canvasight resolves the task workspace and creates or opens `.scatter` there. Pass `projectPath` only as an explicit override when it is already known.

The open result prepares a widget session and returns its `sessionId`. It does not prove that Codex loaded the widget resource, mounted React, or reached the session API. Immediately call:

```text
await_canvasight_widget_ready({ sessionId, threadId })
```

The default wait is 15 seconds. `timeoutMs` may be set for a deliberate diagnostic wait, up to 300000 ms; do not use repeated long waits to hide a failed bootstrap.

Interpret the result strictly:

| Result | Meaning | Agent response |
| --- | --- | --- |
| `status=ready`, `reactMounted=true` | React mounted and the initial session/API health check acknowledged ready | The canvas is open and ready |
| `status=timeout` | No positive acknowledgement arrived before the deadline | Report `stage` and `error`; mark native opening `unverified` |
| `status=failed` | The widget or daemon reported a startup failure, a task/session mismatch, or the wait was cancelled | Report `stage` and `error`; mark native opening failed |
| `status=ready`, `reactMounted!=true` | Invalid or incomplete acknowledgement | Do not claim success; treat it as failed contract validation |

Preserve `sessionId`, `threadId`, `projectPath`, `stage`, `reactMounted`, `error`, and `reportedAt` in diagnostic handoff. Do not expose the daemon URL or token in user-facing output.

## Tool Discovery And Task Binding

If `open_canvasight` or `await_canvasight_widget_ready` is missing, call `tool_search` with `canvasight open_canvasight await_canvasight_widget_ready render_canvasight_canvas_widget`. If the required native open and ready tools still cannot be called, report the exact missing capability and request a plugin reload or new Codex task.

An empty task id is `current_thread_id_required`. Stop instead of opening a partially bound widget. If the ready result reports `stage: "thread"`, the session belongs to another task; create a new session with the current task id rather than accepting the old acknowledgement.

If a callable Canvasight tool fails with `Transport closed`, report `canvasight_mcp_transport_closed`. The current task's MCP transport is stale or dead even when local plugin and daemon checks pass. Inspect `mcp-lifecycle.log` when available, then reload or use a new task. Do not switch to browser fallback and describe it as native success.

## What Counts As Evidence

Only the positive ready acknowledgement proves widget initialization. These are supporting diagnostics, never substitutes:

- `open_canvasight` tool completion;
- `openai/outputTemplate` or successful `resources/read`;
- daemon process, port, session, or API health observed outside the widget;
- typecheck, build, MCP smoke, VM, DOM, metadata-shape, or postMessage tests;
- a working browser/dev fallback;
- a loading shell or a bundle `load` event.

Native-host acceptance additionally requires the full canvas to be visible, one meaningful control to work, and a node Run to reach the same Codex task through the native host bridge. Until those checks are observed, describe the implementation delivery as `unverified` even if the ready tool passes in a synthetic environment.

## Recent Projects

Use `list_canvasight_recent_projects`, then `open_canvasight_recent_project` with the current `threadId`. Read the returned `sessionId` and apply the same ready wait. A recent-project tool result alone is provisional.

## Browser Fallback

Use `open_canvasight_browser_fallback` only for an explicit fallback request or browser diagnosis. Open the complete returned URL in Codex's in-app Browser. After `claim_canvasight_thread`, fallback Run payloads are queued for `await_canvasight_run`; they are not sent through the native widget bridge.

Browser visibility, fallback controls, and queued Run delivery do not satisfy native ready or native-host acceptance. Do not open a bare `127.0.0.1:5173` page as the normal response to "open Canvasight".

## Closing

`close_canvasight` closes one session. It does not stop the project-level daemon.
