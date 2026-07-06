# Canvasight Troubleshooting

## Missing Or Stale Plugin Tools

If `codex plugin list` shows an old Canvasight version, reinstall the repo-local plugin and open a new Codex thread or reload the session. Existing threads may not hot-refresh newly installed MCP tools.

```bash
codex plugin marketplace add /Users/niallyoung/Desktop/Canvasight
codex plugin add canvasight@canvasight-local
codex plugin list
```

## Browser Shows Connection Refused

Connection refused usually means the URL points at an old thread-local dev server or stale daemon port.

Use `open_canvasight` or `open_canvasight_recent_project` to get a fresh full `browserUrl`. Do not reuse only the old origin.

## Opens In System Browser

`open_canvasight` should target Codex's in-app browser sidebar and should not launch the system default browser unless `CANVASIGHT_OPEN_EXTERNAL_BROWSER=1` is explicitly set for development debugging. If an old plugin cache still opens Safari or Chrome directly, reinstall `canvasight@canvasight-local` and start a new Codex thread.

## Archived Opening Thread

The browser page should not depend on the Codex thread that originally opened it. If a page was opened before persistent daemon support or the URL is stale, reopen the recent project. Normal Run delivery targets the session's bound Codex thread; a different current thread can receive old-tab or queued fallback payloads by calling `await_canvasight_run` with `projectPath`.

## Run Does Not Appear In Codex

Canvasight Run should use Codex app-server direct delivery when the browser session has a bound thread id. If clicking Run only changes the web UI, check these in order:

1. Confirm `codex plugin list` shows the current Canvasight version and reinstall `canvasight@canvasight-local` if an old cache is active.
2. Reopen the canvas from the intended current thread so the session stores the right thread id.
3. Check the Run response or `await_canvasight_run` result for `codexNative.status` and `codexTurn.status`.
4. If direct delivery is unavailable or failed, call `await_canvasight_run` with `sessionId` or `projectPath` to receive the queued fallback payload.

Do not use virtual clicks, clipboard paste, Accessibility scripts, or DOM automation to push text into Codex.

## AI Graph Written But Browser Did Not Change

`write_canvasight_graph` should write through the daemon and advance the project document revision. If the browser does not show the generated Page:

1. Confirm the tool wrote to the same `projectPath` that the browser session has open.
2. Confirm `codex plugin list` shows the current Canvasight version and reinstall if an old cache is active.
3. Wait briefly for the browser revision poll, then reopen the same project with `open_canvasight` or `open_canvasight_recent_project`.
4. If a browser save reports `stale_document`, reload the project instead of retrying the old save payload.

## Development Server Confusion

Normal plugin use should not require `npm run dev`. That command is for local development preview. The plugin MCP server starts or reuses the daemon for normal usage.

## Validation Commands

Use these commands from the repo when troubleshooting implementation changes:

```bash
python3 /Users/niallyoung/.codex/skills/.system/plugin-creator/scripts/validate_plugin.py /Users/niallyoung/Desktop/Canvasight/plugins/canvasight
cd /Users/niallyoung/Desktop/Canvasight/plugins/canvasight
npm run typecheck
npm run build
npm run test:mcp
```
