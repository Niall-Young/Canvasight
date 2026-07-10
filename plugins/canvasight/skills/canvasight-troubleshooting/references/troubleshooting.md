# Canvasight Troubleshooting

## Establish The Native Ready Result First

For every native opening failure, use the active task id and run the complete contract:

1. Call `open_canvasight({ threadId })`.
2. Capture the returned `sessionId`.
3. Call `await_canvasight_widget_ready({ sessionId, threadId })`.
4. Preserve the full ready result before restarting, reinstalling, or opening another surface.

Only `status=ready` with `reactMounted=true` confirms widget readiness. A completed open tool, readable widget resource, healthy daemon, visible loading shell, successful bundle load, browser fallback, or passing automated test does not.

## Ready Timeout Or Failure

Use `stage` and `error` to choose the next check:

- `stage=session`: the session does not exist or closed before readiness. Create a new native session and verify installed/live MCP state.
- `stage=thread`: the ready wait targeted a different Codex task. Reopen with the active task's exact `CODEX_THREAD_ID`.
- `stage=widget-ready` with `status=timeout`: the runtime never acknowledged readiness. Inspect the visible widget error and bootstrap logs; do not keep waiting or claim success.
- bootstrap, resource, or React-mount stage: diagnose widget script execution and mounting before daemon APIs or Run delivery.
- session/API stage: React may be present, but the widget could not initialize its daemon session through the app-only MCP API proxy. Check the returned error, MCP Apps connection, proxy tool result, and daemon lifecycle. Direct localhost fetch is not the native JSON API path.
- host-bridge or Run stage: readiness and Run delivery are separate. First confirm ready, then inspect the bridge Promise result and diagnostics.

If `status=ready` is ever returned without `reactMounted=true`, treat it as an invalid acknowledgement and keep the opening failed/unverified.

Report failures with the actual fields, for example: `status=timeout`, `stage=widget-ready`, and the returned `error`. Do not collapse them into “打不开” or guess a historical cause.

## Missing Or Stale Tools

If `open_canvasight` or `await_canvasight_widget_ready` is missing, call `tool_search` with `canvasight open_canvasight await_canvasight_widget_ready render_canvasight_canvas_widget`. If the required tool still does not appear, report the exact missing capability. After an install or upgrade, reload/restart Codex Desktop before creating a new task and tagging `@Canvasight` again; creating a task alone can retain the app-level plugin registry snapshot.

Use `codex plugin list` to verify the resolved source and installed version. If it is stale, reinstall the repo-local plugin and confirm the resolved version. Then reload/restart the Codex host before creating and tagging a new task; existing tasks and new tasks created by the same unreloaded desktop process may keep old MCP descriptors or omit the updated plugin entirely.

If a visible tool returns `Transport closed`, report `canvasight_mcp_transport_closed`. The live task transport is closed even when local smoke tests and daemon health pass. Inspect `mcp-lifecycle.log` when available. If the plugin version changed, reload/restart the Codex host before creating and tagging a new task. Do not debug localhost or use fallback as a replacement for the dead native transport.

## Native Widget Bootstrap

The normal open result should reference `ui://widget/canvasight/canvas.html`; public output must not expose daemon URLs or tokens. Session connection data belongs only in widget metadata.

When the widget stays on `Opening Canvasight...`, `Starting Canvasight...`, or `Connecting Canvasight session...`:

1. Obtain the ready timeout/failure result instead of relying on the loading UI.
2. Treat `Connecting` as proof only that session metadata reached the bridge. It does not prove the initial API proxy or ready acknowledgement succeeded, and a default `reactMounted:false` timeout is not standalone proof that React never ran.
3. Confirm the exact installed plugin version and, after any version change, that the Codex host was reloaded/restarted before the task was created and tagged.
4. Inspect the actual widget-visible error and host/bootstrap diagnostics.
5. Confirm React readiness is reported only after the initial session API health check.
6. Confirm startup failures enter a visible failed state instead of remaining in an indefinite loader.

Do not use a synthetic metadata shape or bundle `load` event as proof that React mounted. A test must observe the explicit ready acknowledgement to prove the tested runtime reached the contract; real native-host acceptance is still required for delivery.

## Daemon And Initial API

If the ready error points to the session API, inspect the `canvasight_widget_api` app-only tool result, MCP Apps connection, daemon state, and lifecycle logs. The widget resource CSP still needs the daemon's exact origin for attachment assets, but native JSON API startup must not depend on direct localhost fetches. Multiple daemon processes, stale state ownership, a missing executable, or a blocked proxy are daemon/bootstrap evidence, not widget-ready success.

Normal plugin usage starts or reuses the daemon. `npm run dev` and `npm run dev:stop` are development commands, not user recovery steps.

## Run Does Not Reach Codex

First confirm the native widget passed the ready gate. Then distinguish:

- Native widget: Run is sent only when the MCP Apps `ui/message` or Codex/OpenAI compatibility bridge Promise resolves. Missing advisory capability metadata alone is not a send failure.
- Browser/dev fallback: Run requires an explicit current-task claim and queues for `await_canvasight_run`. It must not report native sent status.
- `unbound_dev_session`: no task claim exists; claim from the intended task or reopen natively.
- `browser_fallback_no_bridge`: the page is not a native widget. Stop bridge diagnosis on that page.

Do not use app-server `turn/start`, virtual clicks, clipboard paste, Accessibility scripting, or DOM automation as a successful Run path.

## Browser And Connection Problems

A connection-refused fallback URL is stale or points at a stopped server. Request a fresh URL with `open_canvasight_browser_fallback` only when fallback is explicitly needed, and open the complete returned URL in Codex's in-app Browser.

A working fallback can isolate canvas and daemon behavior but cannot satisfy native readiness, native interaction, or native Run acceptance.

## Native-Host Acceptance

After automated checks and exact-version installation, reload/restart Codex Desktop if the version changed, then create a new task, tag `@Canvasight`, and verify all of the following:

1. `open_canvasight` returns a session and `await_canvasight_widget_ready` returns `status=ready`, `reactMounted=true`.
2. The full canvas is visible in the native widget.
3. At least one meaningful canvas control works.
4. A node Run reaches the same Codex task through the native host bridge.

If any item is missing, keep the issue open and mark the delivery `unverified`. Browser fallback and automated harnesses cannot fill the gap.

## Graph Written But View Did Not Refresh

Confirm `write_canvasight_graph` targeted the same `projectPath` as the active session and that the document revision advanced. If a save reports `stale_document`, reload instead of retrying stale state. Reopen the project natively and apply the ready gate again before claiming the refreshed canvas is available.

## Validation Commands

Use the relevant subset from the repo:

```bash
python3 /Users/niallyoung/.codex/skills/.system/plugin-creator/scripts/validate_plugin.py /Users/niallyoung/Desktop/Canvasight/plugins/canvasight
cd /Users/niallyoung/Desktop/Canvasight/plugins/canvasight
npm run typecheck
npm run build
npm run test:markdown
npm run dev:status
npm run test:dev-server
npm run test:mcp
```

These commands support diagnosis; they never replace native-host acceptance.
