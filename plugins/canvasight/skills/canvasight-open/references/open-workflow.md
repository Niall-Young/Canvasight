# Canvasight Open Workflow

## Open A Session

Call `open_canvasight` with `projectPath` when the workspace path is known. The tool starts or reuses Canvasight's project-level local daemon and returns a full browser URL after verifying the page is reachable.

When using Codex's in-app Browser, navigate to the full returned `browserUrl` / `url`. Do not navigate only to the origin because the session id and token are part of the usable URL.

## Recover A Recent Project

Use `list_canvasight_recent_projects` followed by `open_canvasight_recent_project` when the user wants to reopen Canvasight from a new Codex thread or recover the last canvas.

The web service is project-level and should survive the Codex thread that opened it. If an older URL was created before persistent daemon support, reopen with `open_canvasight_recent_project`.

## Attach From A New Thread

Opening the browser and receiving the next Run payload are separate. A new Codex thread can attach to the same project queue by calling `await_canvasight_run` with `projectPath`; use `canvasight-run` for that part.

## Close A Session

`close_canvasight` closes the specific Canvasight session. It does not stop the project-level daemon.
