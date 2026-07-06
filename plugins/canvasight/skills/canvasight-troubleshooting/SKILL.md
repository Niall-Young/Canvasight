---
name: canvasight-troubleshooting
description: Diagnose and fix Canvasight plugin, MCP, daemon, browser URL, Run delivery, installation, cache, or connection problems. Use when Canvasight tools are missing, codex plugin list shows an old version, the browser URL returns connection refused, an archived thread stopped the old page, the daemon state is stale, Run does not appear in Codex, a bare 5173 dev page reports unbound_dev_session, or the user asks why Canvasight plugin behavior is not updating.
---

# Canvasight Troubleshooting

Use this skill for Canvasight runtime, install, and recovery problems.

## Checklist

1. Check whether the issue is plugin install/cache, daemon state, browser URL, or project `.scatter` data.
2. Verify the resolved plugin version with `codex plugin list` when tool availability or stale behavior is the issue.
3. Prefer `open_canvasight_recent_project` over asking the user to run `npm run dev` for normal plugin recovery.
4. Use `npm run dev` / `npm run dev:stop` only for local development preview, not normal plugin usage.
5. Run the narrowest relevant validation before claiming a fix.

For detailed symptoms and fixes, read `references/troubleshooting.md`.
