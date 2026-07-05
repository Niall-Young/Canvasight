---
name: canvasight-graph-writer
description: Create or update Canvasight task nodes and edges with AI through write_canvasight_graph. Use when the user asks Codex to generate Canvasight nodes, write a Canvasight graph, turn product requirements into Canvasight structure, map an article into Canvasight nodes, analyze a codebase into a Canvasight graph, or create/update .scatter/scatter.json through the Canvasight plugin.
---

# Canvasight Graph Writer

Use this skill when Codex should create or update Canvasight nodes and connections from analysis.

## Workflow

1. Classify the task structure and choose `graphType`.
2. Choose `mode` from the user's write intent.
3. Call `write_canvasight_graph` instead of hand-editing `.scatter/scatter.json`.
4. Open or refresh Canvasight when the user wants to inspect the generated graph.

## Core Rules

- `graphType` controls node organization and default layout.
- `mode` controls Page write behavior.
- Do not let `graphType` decide whether a Page is created, selected, or replaced.
- One node may connect to multiple downstream nodes.
- Self-connections, duplicate `source -> target` edges, and multiple parent edges into the same target are invalid.

Read `references/graph-writing.md` for input rules and `references/graph-types.md` for task classification.
