# Canvasight

Canvasight is a repo-local Codex plugin that opens a browser canvas for arranging task nodes, attachments, and prompt flows. Running a node or flow returns Markdown and structured run data to the current Codex thread through MCP.

## Development

```bash
cd plugins/canvasight
npm install
npm run typecheck
npm run build
npm run test:mcp
```

## Plugin

The plugin source lives at `plugins/canvasight`. The repo-local marketplace is `.agents/plugins/marketplace.json`.

Install the marketplace in Codex with:

```bash
codex plugin marketplace add /Users/niallyoung/Desktop/Canvasight
codex plugin add canvasight@canvasight-local
```

After installing or reinstalling the plugin, start a new Codex thread or reload the current Codex session before testing MCP tools. Already-open threads do not hot-refresh newly installed plugin tools.

Validate the plugin manifest with:

```bash
python3 /Users/niallyoung/.codex/skills/.system/plugin-creator/scripts/validate_plugin.py /Users/niallyoung/Desktop/Canvasight/plugins/canvasight
```

In the fresh or reloaded thread, the plugin should expose:

- `open_canvasight`
- `await_canvasight_run`
- `close_canvasight`
