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

The browser page should not depend on the Codex thread that originally opened it. If the old browser page is still usable, call `claim_canvasight_thread` from the current thread before clicking Run so future queued Run payloads are scoped to the current thread. If a page was opened before persistent daemon support or the URL is stale, reopen the recent project. Use `await_canvasight_run` to receive queued payloads.

## Run Does Not Appear In Codex

Canvasight Run defaults to queued fallback delivery. Direct Codex app-server delivery is experimental and must be explicitly enabled with `CANVASIGHT_CODEX_NATIVE=1`; it is not reliable unless it can reach the live Codex Desktop app-server. If clicking Run only changes the web UI, check these in order:

1. Confirm `codex plugin list` shows the current Canvasight version and reinstall `canvasight@canvasight-local` if an old cache is active.
2. From the intended current thread, call `claim_canvasight_thread` for the project or session so queued fallback payloads are scoped to this thread. If the URL is stale or the page is gone, reopen the canvas from that thread.
3. Check the Run response or `await_canvasight_run` result for `codexNative.status` and `codexTurn.status`.
4. If the response has `code: "unbound_dev_session"`, the browser is using a bare dev preview such as `http://127.0.0.1:5173/` without a claimed Codex thread. Call `claim_canvasight_thread` from the intended current thread, or open Canvasight through `open_canvasight` if a fresh URL is needed.
5. Call `await_canvasight_run` with `sessionId` or `projectPath` to receive the queued fallback payload.

Do not use virtual clicks, clipboard paste, Accessibility scripts, or DOM automation to push text into Codex.

## AI Graph Written But Browser Did Not Change

`write_canvasight_graph` should write through the daemon and advance the project document revision. If the browser does not show the generated Page:

1. Confirm the tool wrote to the same `projectPath` that the browser session has open.
2. Confirm `codex plugin list` shows the current Canvasight version and reinstall if an old cache is active.
3. Wait briefly for the browser revision poll, then reopen the same project with `open_canvasight` or `open_canvasight_recent_project`.
4. If a browser save reports `stale_document`, reload the project instead of retrying the old save payload.

## Development Server Confusion

Normal plugin use should not require `npm run dev`. That command is for local development preview. The plugin MCP server starts or reuses the daemon for normal usage.

The bare `http://127.0.0.1:5173/` dev URL is not a cross-thread routing surface by itself. It sends Run payloads to the daemon session resolved from the latest `claim_canvasight_thread` project binding, or falls back to the Vite process `CODEX_THREAD_ID`; if neither exists, Run returns `unbound_dev_session` so the payload is not mistaken for a successful Codex send. By default the resolved daemon session queues the payload for `await_canvasight_run`; direct `turn/start` is only tested when `CANVASIGHT_CODEX_NATIVE=1` is explicitly enabled for development.

## Validation Commands

Use these commands from the repo when troubleshooting implementation changes:

```bash
python3 /Users/niallyoung/.codex/skills/.system/plugin-creator/scripts/validate_plugin.py /Users/niallyoung/Desktop/Canvasight/plugins/canvasight
cd /Users/niallyoung/Desktop/Canvasight/plugins/canvasight
npm run typecheck
npm run build
npm run test:mcp
```
