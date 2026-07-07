---
name: canvasight-troubleshooting
description: Diagnose and fix Canvasight plugin, MCP, native widget host bridge, daemon, browser URL, Run delivery, installation, cache, or connection problems. Use when Canvasight tools are missing, codex plugin list shows an old version, widget rendering or Run bridge delivery fails, the browser URL returns connection refused, an archived thread stopped the old page, the daemon state is stale, Run does not appear in the current Codex thread, a bare 5173 dev page reports unbound_dev_session, claim_canvasight_thread is needed, or the user asks why Canvasight plugin behavior is not updating.
---

# Canvasight Troubleshooting

Use this skill for Canvasight runtime, install, and recovery problems.

## Checklist

1. Classify the delivery path first: browser fallback, direct widget app, legacy widget iframe, bridge connected, or queued fallback.
2. Check whether the issue is plugin install/cache, native widget host bridge, daemon state, browser URL, or project `.scatter` data.
3. Verify the resolved plugin version with `codex plugin list` when tool availability or stale behavior is the issue.
4. Prefer `open_canvasight` or recent-project recovery over asking the user to run `npm run dev` for normal plugin recovery.
5. Use `npm run dev` / `npm run dev:stop` only for local development preview, not normal plugin usage.
6. Run the narrowest relevant validation before claiming a fix.

For detailed symptoms and fixes, read `references/troubleshooting.md`.
