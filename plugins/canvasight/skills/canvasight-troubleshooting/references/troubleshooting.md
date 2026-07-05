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

## Archived Opening Thread

The browser page should not depend on the Codex thread that originally opened it. If a page was opened before persistent daemon support or the URL is stale, reopen the recent project. The current thread should receive the next Run payload by calling `await_canvasight_run` with `projectPath`.

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
