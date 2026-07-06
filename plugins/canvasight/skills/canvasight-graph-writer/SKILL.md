---
name: canvasight-graph-writer
description: "Create or update Canvasight task nodes and edges with AI through write_canvasight_graph, including scanning and reusing saved global node templates. Use when the user asks Codex to generate Canvasight nodes, write a Canvasight graph, use the canvas/用画布/放到画布/写到画布, turn product requirements into Canvasight structure, map an article into Canvasight nodes, analyze a codebase into a Canvasight graph, reuse Canvasight node templates, or create/update .scatter/scatter.json. Also use when a Canvasight canvas is already open or attached and the user gives a medium or large multi-step request that should be decomposed into task nodes before direct execution, even if they do not explicitly ask for graph or nodes."
---

# Canvasight Graph Writer

Use this skill when Codex should create or update Canvasight nodes and connections from analysis.

## Workflow

1. Classify the task structure and choose `graphType`.
2. Choose `mode` from the user's write intent.
3. Call `list_canvasight_node_templates` with a targeted query when possible; it returns lightweight summaries only.
4. Call `get_canvasight_node_template` only for a selected candidate when the full prompt body or attachments are needed before reuse.
5. Call `write_canvasight_graph` instead of hand-editing `.scatter/scatter.json`.
6. Open or refresh Canvasight when the user wants to inspect the generated graph.

## Core Rules

- `graphType` controls node organization and default layout.
- `mode` controls Page write behavior.
- Do not let `graphType` decide whether a Page is created, selected, or replaced.
- Saved node templates are global local user assets. Reuse them when they match the user's requested graph instead of recreating equivalent prompt nodes.
- Template listing is summary-first to avoid wasting context. Do not request full templates unless a listed candidate is likely relevant.
- Template reuse does not control `graphType`, `mode`, Page behavior, or node Codex mode.
- When Canvasight is active, user phrases like "用画布", "放到画布", "写到画布", or "use canvas" mean Canvasight graph writing. Do not reinterpret them as an HTML canvas/frontend drawing task unless the user explicitly says web canvas, HTML canvas, `<canvas>`, or drawing API.
- `write_canvasight_graph` writes through the Canvasight daemon. Do not manually POST documents or edit `.scatter/scatter.json` to work around session sync; the daemon keeps active sessions and document revisions aligned.
- One node may connect to multiple downstream nodes.
- Self-connections, duplicate `source -> target` edges, and multiple parent edges into the same target are invalid.
- For nontrivial graphs, prefer dependency or stage-based positions over a simple grid; explicit user positions always win.
- Do not force graph writing for small direct commands, simple explanations, Run payloads, or requests that explicitly ask for immediate direct execution.

Read `references/graph-writing.md` for input rules and `references/graph-types.md` for task classification.
