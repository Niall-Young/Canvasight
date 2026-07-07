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

Use `open_canvasight_browser_fallback` to get a fresh full `browserUrl` when browser fallback is explicitly needed. For normal use, call `open_canvasight` or `open_canvasight_recent_project` to render the native widget.

## Native Widget Does Not Render

Normal Canvasight use should call `open_canvasight`. The tool result must include `openai/outputTemplate: ui://widget/canvasight/canvas.html`, and the resource must be readable through `resources/read`.

If the widget does not render:

1. Confirm `codex plugin list` shows the current Canvasight version and reinstall `canvasight@canvasight-local` if an old cache is active.
2. Open a new Codex thread or reload the session so the new MCP tool descriptor and widget resource metadata are loaded.
3. Run `npm run test:mcp` from `plugins/canvasight` to confirm `resources/list`, `resources/read`, `open_canvasight`, and `render_canvasight_canvas_widget` all pass.
4. Use `open_canvasight_browser_fallback` while investigating widget host support. Tell the user this fallback lacks the widget bridge; after `claim_canvasight_thread` it can scope Run payloads to the current thread queue, then `await_canvasight_run` receives them.

## Diagnostics Panel

Use the Canvasight Diagnostics panel to classify Run delivery before guessing. It shows the current URL, whether the page is in an iframe, `canvasightHost`, `window.openai`, `window.canvasightMcp`, `canSendFollowUpMessage()`, and the latest Run `status/via/reason/error`.

Interpretation:

- `parent === window`: browser fallback or dev page, not a widget.
- `parent !== window` plus `canvasightHost=widget`: widget iframe candidate.
- `canSendFollowUpMessage() === true`: frontend can ask the widget shell to send a follow-up.
- `delivery.status === "sent"` and `delivery.via === "codex_app_server"`: only valid when `codexTurn.confirmed === true`.
- `delivery.reason === "turn_start_unverified"`: payload is queued; use `await_canvasight_run`.

## Opens In System Browser

`open_canvasight_browser_fallback` should target Codex's in-app browser sidebar and should not launch the system default browser unless `CANVASIGHT_OPEN_EXTERNAL_BROWSER=1` is explicitly set for development debugging. Normal `open_canvasight` should render the native widget. If an old plugin cache still opens Safari or Chrome directly, reinstall `canvasight@canvasight-local` and start a new Codex thread.

## Archived Opening Thread

The native widget sends Run output to the thread that owns the widget, so it does not need the old thread id. Browser fallback pages should not depend on the Codex thread that originally opened them. If an old browser page is still usable, call `claim_canvasight_thread` from the current thread before clicking Run so future direct and queued Run payloads are scoped to the current thread. If a page was opened before persistent daemon support or the URL is stale, reopen the recent project. Use `await_canvasight_run` only to receive queued browser fallback payloads.

## Run Does Not Appear In Codex

Canvasight Run should arrive as a normal follow-up turn when the canvas was opened with `open_canvasight` native widget output. The widget uses the Codex host bridge, not a thread id, virtual click, clipboard paste, or localhost browser trick. If clicking Run only changes the UI and no Codex turn appears, check these in order:

1. Confirm the canvas was opened through `open_canvasight` native widget output, not a bare `http://127.0.0.1:5173/` dev page or browser fallback URL.
2. Confirm `codex plugin list` shows the current Canvasight version and reinstall `canvasight@canvasight-local` if an old cache is active. Open a new thread or reload after reinstalling.
3. If the UI shows a widget bridge error, inspect `resources/read` and the widget HTML for `canvasightMcpHostBridge`, `canvasight-frame`, and `canvasight:send-follow-up`.
4. If using a browser fallback page, call `claim_canvasight_thread` from the intended current thread before clicking Run. If the Run still does not appear, call `await_canvasight_run` with `sessionId` or `projectPath`.
5. If a bare dev page returns `code: "unbound_dev_session"`, it has no claimed Codex thread. Claim the project from the intended thread or reopen Canvasight through the plugin.

Do not use virtual clicks, clipboard paste, Accessibility scripts, or DOM automation to push text into Codex. If the current thread lacks the widget tool or its MCP transport is closed, the correct recovery is plugin reload/new thread with current tools, not browser UI automation.

## AI Graph Written But Browser Did Not Change

`write_canvasight_graph` should write through the daemon and advance the project document revision. If the browser does not show the generated Page:

1. Confirm the tool wrote to the same `projectPath` that the browser session has open.
2. Confirm `codex plugin list` shows the current Canvasight version and reinstall if an old cache is active.
3. Wait briefly for the browser revision poll, then reopen the same project with `open_canvasight` or `open_canvasight_recent_project`.
4. If a browser save reports `stale_document`, reload the project instead of retrying the old save payload.

## Development Server Confusion

Normal plugin use should not require `npm run dev`. That command is for local development preview. The plugin MCP server starts or reuses the daemon for normal usage.

The bare `http://127.0.0.1:5173/` dev URL is not a native widget and does not have the host bridge. It queues Run payloads against the daemon session resolved from the latest `claim_canvasight_thread` project binding; if no claim exists, Run returns `unbound_dev_session` so the payload is not mistaken for a successful Codex send. It must not fall back to the Vite process `CODEX_THREAD_ID`. Native app-server `turn/start` may be enabled only for diagnostics; accepted requests stay queued unless a matching `turn/started`, `item/started`, or `turn/completed` notification confirms delivery.

## Validation Commands

Use these commands from the repo when troubleshooting implementation changes:

```bash
python3 /Users/niallyoung/.codex/skills/.system/plugin-creator/scripts/validate_plugin.py /Users/niallyoung/Desktop/Canvasight/plugins/canvasight
cd /Users/niallyoung/Desktop/Canvasight/plugins/canvasight
npm run typecheck
npm run build
npm run test:mcp
```
