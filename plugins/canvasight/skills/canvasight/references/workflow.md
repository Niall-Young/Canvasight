# Canvasight Workflow Reference

Use this reference when opening, recovering, or reading from a Canvasight browser canvas.

## Open Canvasight

Call `open_canvasight` with the current workspace path when available. The tool starts or reuses Canvasight's project-level local daemon and returns a full `browserUrl` / `url` after verifying the session page is reachable.

When using Codex's in-app Browser, navigate to the full returned URL. Do not navigate only to the `origin`, because the session id and token are part of the usable browser URL.

## Recover A Project

Use `list_canvasight_recent_projects` followed by `open_canvasight_recent_project` when the user wants to reopen Canvasight from a new Codex thread or recover the last canvas.

The plugin serves the built web app through a local daemon that outlives thread-local MCP processes. Normal plugin use should not ask the user to run `npm run dev`.

## Receive A Run

Call `await_canvasight_run` from the Codex thread that should receive the next Run payload.

Prefer the returned `sessionId` when you have it. When attaching from a new Codex thread to a browser tab that was opened earlier, call `await_canvasight_run` with the project path so the current thread waits on that project's run queue.

The Run payload belongs to the Codex thread that calls `await_canvasight_run`, not necessarily the thread that originally opened the browser canvas. This allows a user to archive the opening thread and keep using the same Canvasight page from the current thread.

## Close A Session

Call `close_canvasight` only when the specific session is no longer needed. It does not stop the project-level daemon.
