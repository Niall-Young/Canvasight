---
name: canvasight-troubleshooting
description: Diagnose and fix Canvasight plugin, MCP, native widget host bridge, daemon, browser URL, Run delivery, installation, cache, or connection problems. Use when Canvasight tools are missing, codex plugin list shows an old version, widget rendering or Run bridge delivery fails, the browser URL returns connection refused, an archived thread stopped the old page, the daemon state is stale, Run does not appear in the current Codex thread, a bare 5173 dev page reports unbound_dev_session, claim_canvasight_thread is needed, or the user asks why Canvasight plugin behavior is not updating.
---

# Canvasight Troubleshooting

Use this skill for Canvasight runtime, install, and recovery problems.

## Checklist

1. Classify the delivery path first: browser fallback, direct widget app, legacy widget iframe, bridge connected, or queued fallback.
2. Check whether the issue is plugin install/cache, native widget host bridge, daemon state, browser URL, or project `.scatter` data.
3. When `open_canvasight` is missing from the active tool list, call `tool_search` for `canvasight open_canvasight render_canvasight_canvas_widget` before using browser fallback or declaring tools unavailable.
4. When a visible Canvasight MCP tool fails with `Transport closed`, report `canvasight_mcp_transport_closed`; treat it as stale/dead current-thread MCP transport, not a daemon, install, or browser fallback success-path problem. On 0.1.44 or newer, inspect `mcp-lifecycle.log` in the Canvasight state directory before guessing.
5. When native open or mode preflight reports `current_thread_id_required` / `missing CODEX_THREAD_ID`, read `CODEX_THREAD_ID` from the active task shell and reopen with that exact `threadId`; the MCP child process may not inherit it.
6. If MCP App initialization succeeded but `hostCapabilities.message` is absent, do not declare the bridge unavailable before trying `sendMessage`; its Promise is the authoritative result.
7. If mode preflight reports a rollout read race, verify `0.1.46` or newer is installed; Canvasight retries only this transient `thread/resume` failure. Other errors or exhausted retries must still block bridge sending.
8. If native open reports `Canvasight daemon did not start in time`, inspect for multiple daemon processes and a rapidly growing lifecycle log. Version `0.1.47` serializes daemon startup, exits on stdout EPIPE, and caps the log; version `0.1.48` also cleans source-checkout/cache daemons sharing default state. Do not classify this symptom as a bridge failure.
9. Verify the resolved plugin version with `codex plugin list` when tool availability or stale behavior is the issue.
10. Prefer `open_canvasight` or recent-project recovery over asking the user to run `npm run dev` for normal plugin recovery.
11. Use `npm run dev` / `npm run dev:stop` only for local development preview, not normal plugin usage.
12. Run the narrowest relevant validation before claiming a fix.

For detailed symptoms and fixes, read `references/troubleshooting.md`.
