# Graph writing contract

## Context and write mode

Read `get_canvasight_graph_context` before any active-Page follow-up. Use `append-page` only for an explicitly new graph or alternative; use `merge-active-page` for additions, edits, splits, and removals; use replacement modes only on explicit redo/reset language.

For a merge, pass the latest `expectedRevision` and minimal operations. Preserve unaffected IDs, bodies, positions, and edges. If the revision is stale, re-read context and regenerate against the new Page; never replay a stale patch blindly.

## Nodes and edges

- Use stable, descriptive IDs and substantive title/body content.
- Reuse a node ID when updating it; do not change node or edge IDs through update operations.
- Give each node one clearly named primary responsibility, question, decision, stage, or result. A parent summarizes and organizes its branch; it does not repeat all child detail.
- Split content when a part can be independently understood, chosen, executed, verified, extended, or delivered. Keep related statements together when they jointly explain one conclusion and separation would damage that meaning.
- Express meaningful dependency, sequence, containment, evidence, or decision relationships as edges instead of hiding submodules in body prose. Allow shallow and uneven branches when the material warrants them; do not manufacture uniform depth.
- No self-edge, duplicate `source -> target`, missing endpoint, or multiple parent edges into one target.
- Removing a node may remove its incident edges; account for that in the final topology and coverage.

## Semantic decomposition check

Before writing, inspect every node that combines more than one idea:

- Name its primary responsibility in `frameworkManifest.semanticStructure`.
- Ask whether each included idea could be acted on, decided, verified, or delivered independently. If so, create a child or peer node and connect the relationship.
- When ideas must remain together, record a concrete `inseparableReason`; shared topic labels or brevity are not sufficient reasons.
- Ensure coverage keys mapped to one node describe the same responsibility. Coverage completeness never justifies an overloaded node.

This check is semantic. Do not infer quality from node counts, branch counts, body length, coverage count, or fixed hierarchy depth.

## Layout

- Use `layoutPolicy: "auto"` for normal AI writes so the service computes positions from the final topology. Use `preserve-explicit` only when the user-authored placement itself must remain stable.
- Product, codebase, research, and execution graphs use horizontal dependency flow. Article outlines and other source-order reading structures use vertical flow.
- After a split, relationship change, or broad merge invalidates placement, request whole-Page relayout rather than hand-placing only the new nodes.
- Treat overlap and backward dependency direction as repair failures. Explicit coordinates are not evidence that a layout is valid.

## Templates

Query `list_canvasight_node_templates` with a specific purpose. Fetch a full template only after a summary is relevant. Templates may supply title, body, and attachments, but never decide framework, mode, Page behavior, or Codex mode.

## Compatibility

`graphType` is a layout hint for older callers. Recommended mappings are: product and UX -> `software-product`; article -> `article-outline`; codebase/research system maps -> `codebase-structure`; task execution -> `task-plan`; otherwise -> `general`. The selected output controls final topology; `layoutPolicy` controls whether Canvasight computes placement or preserves explicit coordinates.
