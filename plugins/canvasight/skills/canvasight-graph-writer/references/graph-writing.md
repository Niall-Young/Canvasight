# Canvasight Graph Writing

Use `write_canvasight_graph` when the user asks Codex to create or update a Canvasight canvas from analysis, code architecture, product requirements, task planning, or another structured breakdown.

Prefer the MCP tool over hand-editing `.scatter/scatter.json` unless the user explicitly asks for raw file editing. The tool writes a valid v1 `.scatter/scatter.json`, validates node and edge references, and remembers the project for reopening.

## Write Mode

`mode` controls Page write behavior. It is separate from `graphType`.

- `append-page`: safe default for new generated workspaces because existing pages are not overwritten.
- `replace-active-page`: use only when the user explicitly wants to replace the current Page.
- `replace-document`: use only when the user explicitly wants to replace all Canvasight document content.

Do not infer Page creation or replacement from `graphType`.

## Node Input

For each generated node, provide:

- stable `id` values when edges need to reference them,
- concise `title`,
- actionable `body` prompt content,
- optional `codexMode`: `chat`, `plan`, or `goal`,
- optional `x` / `y` or `position` when a specific layout is needed.

## Edge Input

For each generated edge, `source` and `target` must reference node ids in the same Page. Do not create edges that point to missing nodes.

Generated edges must follow the same rules as manual canvas connections:

- one node can connect to multiple downstream nodes,
- no self-connections,
- no duplicate `source -> target` edges,
- no more than one parent edge into the same target node.

## Layout

Use `layout: "horizontal"` for linear flows, `layout: "vertical"` for staged outlines, and `layout: "grid"` for architecture or requirement maps when exact positions are not important.

If `layout` is omitted, Canvasight may choose a default from `graphType`. This default affects node placement only; it does not affect Page write behavior.

## After Writing

After writing a graph, call `open_canvasight` or `open_canvasight_recent_project` when the user wants to inspect it in the browser.

If the web app was already open, tell the user to refresh or reopen the project to load the external file update.
