# Canvasight Graph Writing

Use `write_canvasight_graph` when the user asks Codex to create or update a Canvasight canvas from analysis, code architecture, product requirements, task planning, or another structured breakdown.

When `open_canvasight` or `open_canvasight_recent_project` has made a project active, treat later medium or complex multi-step requests as candidates for graph writing before direct execution, even if the user does not repeat "Canvasight." Do not force graph writing for small direct commands, simple questions, Run payloads, or requests that explicitly ask Codex to execute immediately.

In active Canvasight context, phrases like "用画布", "放到画布", "写到画布", "use the canvas", or "use Canvasight to plan/break down this" mean Canvasight graph writing. Treat them as HTML canvas/frontend drawing requests only when the user explicitly says HTML canvas, web canvas, React canvas component, `<canvas>`, or drawing API.

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
- optional `templateId` from `list_canvasight_node_templates` when a saved global node template should supply title, body, and attachments,
- optional `templateQuery` only when no exact template id is known and a best-effort local template search is acceptable,
- optional `codexMode`: `chat`, `plan`, or `goal`,
- optional `x` / `y` or `position` when a specific layout is needed.

## Template Reuse

Before writing a graph, call `list_canvasight_node_templates` to inspect saved global template summaries. Use specific `query` values based on the intended node purpose instead of loading an unfiltered list whenever possible. The list result includes id, title, body preview, body length, attachment count, and timestamps, not full prompt bodies.

Call `get_canvasight_node_template({ templateId })` only when a summary looks relevant and the full prompt body or attachment metadata is needed to decide reuse. Prefer exact `templateId` reuse when a template fits the node's purpose. A reused template provides default title, body, and attachments; explicit node fields can still override the title or body for the current graph.

Do not force a template into an unrelated node. If no saved template fits, generate a normal node.

## Edge Input

For each generated edge, `source` and `target` must reference node ids in the same Page. Do not create edges that point to missing nodes.

Generated edges must follow the same rules as manual canvas connections:

- one node can connect to multiple downstream nodes,
- no self-connections,
- no duplicate `source -> target` edges,
- no more than one parent edge into the same target node.

## Layout

Use `layout: "horizontal"` for left-to-right flows, `layout: "vertical"` for top-to-bottom staged outlines, and `layout: "grid"` for maps when exact positions are not important.

When edges exist, Canvasight lays out nodes by dependency layers rather than by raw input index: parents are placed before children, same-layer nodes are staggered with safe spacing, and fan-out branches are separated. Explicit `position`, `x`, or `y` values still win for the coordinates they provide.

If `layout` is omitted, Canvasight may choose a default from `graphType`. This default affects node placement only; it does not affect Page write behavior.

## After Writing

After writing a graph, call `open_canvasight` or `open_canvasight_recent_project` when the user wants to inspect it in Canvasight. Use `open_canvasight_browser_fallback` only when an explicit browser fallback is needed.

`write_canvasight_graph` writes through the Canvasight daemon and advances the project document revision. If the web app is already open on that project, it should detect the newer revision and reload; if a stale browser session tries to save, the daemon rejects the save with `stale_document` so old in-memory state cannot overwrite the graph that was just generated.
