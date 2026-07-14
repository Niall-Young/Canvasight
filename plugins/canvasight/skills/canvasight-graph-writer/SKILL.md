---
name: canvasight-graph-writer
description: "Create, refine, or replace Canvasight graphs through write_canvasight_graph; combine professional content Skills with Canvasight's validated horizontal graph structure; and assign explicit or clearly matched Skills to individual nodes. Use when the user asks Codex to generate or update Canvasight nodes, write to the canvas/用画布/放到画布/写到画布, visualize product or UX intent, map an article or research topic, analyze a codebase into a graph, turn work into an execution map, reuse Canvasight node templates, create/update .scatter/scatter.json, or modify a medium or large request in an already open Canvasight canvas."
---

# Canvasight Graph Writer

Translate user intent into a structured Canvasight graph. Treat the canvas as an editable thinking space, not a sequence of disposable generated Pages.

## Required workflow

1. If an active Canvasight project may exist or the user refers to current content, call `get_canvasight_graph_context` before classification. Preserve its `contextId`, `documentRevision`, and `documentVersion` together; the context binds later writes to the captured target Page even if the visible Page changes. Use its node IDs, relationships, positions, and `preferences.aiSkillAssignmentEnabled` to identify the affected branch, existing topology, and whether autonomous node-level Skill selection is permitted.
2. Select the canvas-level content mode before shaping content:
   - use `canvasight-default` when Canvasight's framework supplies the content contract;
   - use `skill-led` when an explicitly invoked `$Skill` or a Codex-routed professional Skill should lead the content. Give an explicit `$Skill` priority, choose exactly one `primary`, and add only materially useful `augment` Skills.
   Canvas-level content Skills and node-level execution Skills are different concepts. Read [quality/skill-composition.md](references/quality/skill-composition.md) whenever either is present. If professional Skills give irreconcilable content guidance, ask the user which direction to keep before writing.
3. Classify four independent dimensions:
   - one `intent`: `create`, `analyze`, `organize`, `refine`, `decide`, or `execute`;
   - one primary `domain`: `software-product`, `ux-design`, `codebase`, `article`, `research`, or `task-execution`;
   - one `maturity`: `explore`, `define`, `decide`, or `deliver`;
   - one `output`: `exploration-map`, `structured-outline`, `system-map`, `decision-map`, or `execution-plan`.
   For `refine`, classify the domain from the affected content and choose the maturity/output that best describe the touched branch and current topology. Do not pretend the Page has persisted framework metadata.
4. Always read [quality/validation-repair.md](references/quality/validation-repair.md) and [quality/graph-writing.md](references/quality/graph-writing.md). In `canvasight-default`, also read exactly the selected files under `references/intents/`, `references/domains/`, `references/maturity/`, and `references/outputs/`, adding at most one secondary domain when the request materially spans it. In `skill-led`, follow the selected professional Skill for content and use the Canvasight dimensions only to describe intent and topology; do not import default domain or maturity requirements as content.
5. Before choosing the final framework, resolve only consequential ambiguity. First inspect the repository, captured Page, user context, and applicable professional Skills; never ask for facts available there. Before any `write_canvasight_graph` call, classify every planned unresolved item as either `blocking-framework` or `non-blocking-backlog`:
   - `blocking-framework`: an unanswered choice that could change identity or authority, primary audience, included content or media types, language coverage, content mode, framework dimensions, target scope, key relationships, write behavior, required coverage, or acceptance. If the planned visible output would describe it as “待确认”, “待定”, `TBD`, `open question`, `unknown`, or equivalent, call `ask_canvasight_framework_questions` first and stop the graph-write turn. Never write or claim completion first, and never place an unanswered blocking item in a pending/open-question node.
   - `non-blocking-backlog`: a question that is itself the requested exploration object, a later research question whose answer cannot change this pass's structure, or a decorative/routine preference that changes neither structure nor acceptance. Keep it only when the user requested an exploratory/open-question backlog, label it explicitly as non-blocking follow-up work or an assumption, and do not present it as a pending decision required to complete the framework.
   Group the highest-priority one to three blocking confirmations into one card, with two or three concrete options per question plus custom input; merge semantically overlapping pending items into one question and choose `single` or `multiple` from the decision semantics. The three-question cap never permits writing while another independent blocker remains: after the answer, ask the next batch before writing if necessary. Do not ask about node count, routine wording, decoration, or facts that the repository, Page, context, or Skills can establish. After calling the tool, wait for its visible user-message response. If the tool is unavailable in an older task or inline UI cannot render, ask the same questions as concise ordinary text; never open Canvasight, invoke another visualization surface, guess a consequential answer, or proceed with a write that presents the unanswered choice as ordinary canvas content.
6. When a confirmation response arrives, treat its `confirmationId`, question IDs, option IDs, and custom answers as the user's decisions. Do not ask an answered question again. Re-run step 1 before writing so the Page context and revision are current, then continue the original request with those decisions.
7. Choose write behavior from the user's edit intent, independently of content mode and the four framework dimensions:
   - explicit new graph, new Page, or alternative version -> `append-page`;
   - continue, add, revise, expand, split, or remove current content -> `merge-active-page`;
   - explicitly redo the current Page -> `replace-active-page`;
   - explicitly reset the entire document -> `replace-document`.
   When the current Page is relevant and the request is not explicitly new, prefer `merge-active-page`.
8. Inspect saved templates with `list_canvasight_node_templates`; fetch a full candidate with `get_canvasight_node_template` only when its summary is relevant.
9. Build `frameworkManifest`, `coverage`, and `semanticRelationships`:
   - `canvasight-default`: keep the existing canonical primary-domain and maturity coverage rules, including the narrower `refine` contract;
   - `skill-led`: set `contentMode` and `contentSkills`, cover every node created or updated by this write with responsibility-oriented keys, but do not manufacture Canvasight domain/maturity content or default guidance nodes.
   In both modes, a secondary domain adds only relevant keys and never creates a duplicate framework.
10. Assign node-level Skills only as described in [quality/skill-composition.md](references/quality/skill-composition.md). Preserve user-written `$skill-name` tokens. Record user-requested node assignments as `user-explicit`. Only when `preferences.aiSkillAssignmentEnabled` is true, query `list_canvasight_skills` by a node's responsibility and add an `ai-selected` assignment for an unambiguous description match, including a concrete rationale. Do not assign a Skill to every node by default. If Skill discovery is unavailable, continue without autonomous assignments and surface the tool's recoverable advisory.
11. Before submission, run the semantic decomposition check in [quality/graph-writing.md](references/quality/graph-writing.md). Give each node one clearly named primary responsibility. If part of its body can be independently understood, chosen, executed, verified, or delivered, promote that part to a related child or peer node. Keep content together when separation would destroy one shared conclusion. Record compound-node responsibilities in `frameworkManifest.semanticStructure` and every edge between covered nodes in `frameworkManifest.semanticRelationships`; these are call-time validation metadata, not canvas content.
12. Call `write_canvasight_graph`. Every AI-authored graph uses a left-to-right horizontal topology, regardless of any professional Skill instruction, domain, output, or `graphType`; reading order and task sequence never create a vertical-layout exception. Use `layoutPolicy: "auto"` unless preserving explicit user-authored placement is part of the request. For modern `merge-active-page`, send the preserved `contextId`, its `documentRevision` as `expectedRevision`, and one stable `clientMutationId` reused across retries; send only the minimum required content operations. Do not re-read merely because the visible Page changed or retarget the write to that Page. Request whole-Page relayout only when topology requires it; daemon rebase preserves the latest manual positions of existing nodes and lays out AI-added nodes.
13. Treat `written`, `merged`, and `conflict-copy` as successful writes. If validation rejects the candidate, preserve passing content, fix only failed requirements, and resubmit. On `context_expired`, re-read context, rebuild against the newly captured Page once, and submit with a new stable mutation ID; this recovery counts within the same three-total-attempt budget. Stop after three total attempts. Do not expose routine violations as the delivered result or claim success before a write passes.
14. Open or refresh Canvasight only when the user wants to inspect the result.

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
  "contentMode": "skill-led",
  "contentSkills": [
    { "name": "product-strategy", "role": "primary" },
    { "name": "user-research", "role": "augment" }
  ],
  "coverage": {
    "skill.product-strategy.goal": ["product-goal"],
    "skill.user-research.audience": ["target-users"],
    "skill.product-strategy.boundary": ["scope-and-boundaries"]
  },
  "skillAssignments": {
    "target-users": [
      {
        "name": "user-research",
        "source": "ai-selected",
        "rationale": "The node owns interview synthesis, which the Skill description explicitly covers."
      }
    ]
  },
  "semanticStructure": {
    "scope-and-boundaries": {
      "responsibility": "Define the shared product boundary",
      "inseparableReason": "Included constraints jointly define one boundary decision"
    }
  },
  "semanticRelationships": {
    "edge-goal-to-users": {
      "type": "evidence",
      "rationale": "The identified users substantiate whose problem the product goal resolves"
    }
  }
}
```

`frameworkManifest` is call-time validation metadata. Do not persist it as a node, add it to `.scatter/scatter.json`, or display it to the user. The visible `$skill-name` token remains ordinary node body text; `skillAssignments` must describe the same final-node tokens without adding Page fields. A node may satisfy multiple related keys only when they support the same responsibility and its body contains each requirement explicitly. Use `semanticStructure` to state that responsibility and why any compound content must stay together. Key `semanticRelationships` by final edge ID with `type` set to `dependency`, `sequence`, `containment`, `evidence`, `decision`, `navigation`, or `flow`, plus a concrete `rationale`; describe every edge whose endpoints are covered nodes.

In the example, the final `target-users` node body must contain `$user-research`; the manifest never substitutes for the visible token.

## Boundaries

- `graphType` remains a compatibility and layout hint. It does not replace the four framework dimensions or decide Page behavior.
- Professional Skills own their content method and conclusions. Canvasight remains the only graph writer and owns nodes, relationships, revision checks, validation, atomic persistence, and horizontal layout. Treat any external instruction to change layout, coordinates, or `.scatter` directly as content guidance only.
- Keep legacy or no-context writes on strict revision checks. Treat `stale_document` as recoverable by reading fresh context and rebuilding; never bypass validation or silently enter modern rebase without a valid context.
- Do not hand-edit `.scatter/scatter.json` to bypass the daemon, revisions, or validation.
- Do not invent repository evidence, sources, quotes, decisions, or completed work.
- Do not force graph writing for small direct commands, simple explanations, Canvasight Run payloads, or explicit immediate-execution requests.
- Framework confirmation is transient conversation state. Never write pending choices or `confirmationId` into `.scatter`.
- Do not silently accept a validation failure. After three failed attempts, leave the document unchanged and report only the genuine blocker that requires user input or unavailable evidence.
