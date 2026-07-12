---
name: canvasight-graph-writer
description: "Create, refine, or replace Canvasight graphs through write_canvasight_graph using an intent, domain, maturity, and output framework; inspect the active Page before follow-up edits; reuse saved node templates; and repair validation failures before delivery. Use when the user asks Codex to generate or update Canvasight nodes, write to the canvas/用画布/放到画布/写到画布, visualize product or UX intent, map an article or research topic, analyze a codebase into a graph, turn work into an execution map, reuse Canvasight node templates, or create/update .scatter/scatter.json. Also use when a Canvasight canvas is already open or attached and a medium or large follow-up request should modify or decompose the current graph."
---

# Canvasight Graph Writer

Translate user intent into a structured Canvasight graph. Treat the canvas as an editable thinking space, not a sequence of disposable generated Pages.

## Required workflow

1. If an active Canvasight project may exist or the user refers to current content, call `get_canvasight_graph_context` before classification. Use its node IDs, relationships, positions, and `documentRevision` to identify the affected branch and existing topology.
2. Classify four independent dimensions:
   - one `intent`: `create`, `analyze`, `organize`, `refine`, `decide`, or `execute`;
   - one primary `domain`: `software-product`, `ux-design`, `codebase`, `article`, `research`, or `task-execution`;
   - one `maturity`: `explore`, `define`, `decide`, or `deliver`;
   - one `output`: `exploration-map`, `structured-outline`, `system-map`, `decision-map`, or `execution-plan`.
   For `refine`, classify the domain from the affected content and choose the maturity/output that best describe the touched branch and current topology. Do not pretend the Page has persisted framework metadata.
3. Read exactly the selected files under `references/intents/`, `references/domains/`, `references/maturity/`, and `references/outputs/`, plus [quality/validation-repair.md](references/quality/validation-repair.md) and [quality/graph-writing.md](references/quality/graph-writing.md). Add at most one secondary domain when the request materially spans it.
4. Choose write behavior from the user's edit intent, independently of the four framework dimensions:
   - explicit new graph, new Page, or alternative version -> `append-page`;
   - continue, add, revise, expand, split, or remove current content -> `merge-active-page`;
   - explicitly redo the current Page -> `replace-active-page`;
   - explicitly reset the entire document -> `replace-document`.
   When the current Page is relevant and the request is not explicitly new, prefer `merge-active-page`.
5. Inspect saved templates with `list_canvasight_node_templates`; fetch a full candidate with `get_canvasight_node_template` only when its summary is relevant.
6. Build `frameworkManifest` and `coverage`. For `create`, `analyze`, `organize`, `decide`, and `execute`, include every canonical key from the primary-domain and maturity references. For `refine`, include at least one primary-domain key and one maturity key that describe the touched content; validate the complete Page structure, but do not add or rewrite unrelated content merely to manufacture full-contract coverage. A secondary domain adds only relevant keys from that domain, at least one; it never creates a duplicate parallel framework.
7. Call `write_canvasight_graph`. For `merge-active-page`, send `expectedRevision` from the latest context and only the minimum required operations.
8. If validation rejects the candidate, treat violations as internal repair instructions. Preserve passing content, fix only failed requirements, and resubmit. Stop after three total validation attempts. Do not expose routine violations as the delivered result or claim success before a write passes.
9. Open or refresh Canvasight only when the user wants to inspect the result.

## Routing index

- Intents: [create](references/intents/create.md), [analyze](references/intents/analyze.md), [organize](references/intents/organize.md), [refine](references/intents/refine.md), [decide](references/intents/decide.md), [execute](references/intents/execute.md)
- Domains: [software-product](references/domains/software-product.md), [ux-design](references/domains/ux-design.md), [codebase](references/domains/codebase.md), [article](references/domains/article.md), [research](references/domains/research.md), [task-execution](references/domains/task-execution.md)
- Maturity: [explore](references/maturity/explore.md), [define](references/maturity/define.md), [decide](references/maturity/decide.md), [deliver](references/maturity/deliver.md)
- Outputs: [exploration-map](references/outputs/exploration-map.md), [structured-outline](references/outputs/structured-outline.md), [system-map](references/outputs/system-map.md), [decision-map](references/outputs/decision-map.md), [execution-plan](references/outputs/execution-plan.md)

## Framework manifest

```json
{
  "intent": "create",
  "primaryDomain": "software-product",
  "secondaryDomains": ["ux-design"],
  "maturity": "define",
  "output": "exploration-map",
  "coverage": {
    "product.goal": ["product-goal"],
    "product.users": ["target-users"],
    "maturity.define.boundaries": ["scope-and-boundaries"]
  }
}
```

`frameworkManifest` is call-time validation metadata. Do not persist it as a node, add it to `.scatter/scatter.json`, or display it to the user. A node may satisfy multiple keys only when its body contains each requirement explicitly; do not game coverage by pointing every key at a generic node.

## Boundaries

- `graphType` remains a compatibility and layout hint. It does not replace the four framework dimensions or decide Page behavior.
- Do not hand-edit `.scatter/scatter.json` to bypass the daemon, revisions, or validation.
- Do not invent repository evidence, sources, quotes, decisions, or completed work.
- Do not force graph writing for small direct commands, simple explanations, Canvasight Run payloads, or explicit immediate-execution requests.
- Do not silently accept a validation failure. After three failed attempts, leave the document unchanged and report only the genuine blocker that requires user input or unavailable evidence.
