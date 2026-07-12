# Graph writing contract

## Context and write mode

Read `get_canvasight_graph_context` before any active-Page follow-up. Use `append-page` only for an explicitly new graph or alternative; use `merge-active-page` for additions, edits, splits, and removals; use replacement modes only on explicit redo/reset language.

For a merge, pass the latest `expectedRevision` and minimal operations. Preserve unaffected IDs, bodies, positions, and edges. If the revision is stale, re-read context and regenerate against the new Page; never replay a stale patch blindly.

## Nodes and edges

- Use stable, descriptive IDs and substantive title/body content.
- Reuse a node ID when updating it; do not change node or edge IDs through update operations.
- New nodes should use explicit positions when placement carries meaning; otherwise connect them to the relevant existing node so Canvasight can place them locally.
- No self-edge, duplicate `source -> target`, missing endpoint, or multiple parent edges into one target.
- Removing a node may remove its incident edges; account for that in the final topology and coverage.

## Templates

Query `list_canvasight_node_templates` with a specific purpose. Fetch a full template only after a summary is relevant. Templates may supply title, body, and attachments, but never decide framework, mode, Page behavior, or Codex mode.

## Compatibility

`graphType` is a layout hint for older callers. Recommended mappings are: product and UX -> `software-product`; article -> `article-outline`; codebase/research system maps -> `codebase-structure`; task execution -> `task-plan`; otherwise -> `general`. The selected output controls final topology.
