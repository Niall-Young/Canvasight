# Canvasight Graph Types

`graphType` is a task generation strategy. It tells Codex how to organize node titles, prompt bodies, edges, and default layout.

`graphType` is not a Page concept. It does not decide whether a Page is created, selected, appended, or replaced. `mode` remains the only Page write behavior control.

Template reuse can fill node titles, bodies, and attachments, but it must not change the selected `graphType`.

## Supported Types

- `software-product`
- `article-outline`
- `codebase-structure`
- `task-plan`
- `general`

## `software-product`

Use when the user wants to build a product, app, tool, feature, or plugin.

Before generating content, check only whether root-level project guidance files such as `AGENTS.md` and `design.md` exist when the workspace is available. If either file is missing, create a node to draft that missing file. If a file already exists, do not judge its content completeness or create a documentation-completion node for it.

Recommended nodes:

- product goal and target user,
- user workflow and key screens,
- feature scope and non-goals,
- product boundary and edge cases,
- design style and interaction requirements,
- technical architecture and data model,
- implementation phases,
- verification and release checklist,
- draft nodes for missing root `AGENTS.md` / `design.md` files when relevant.

Recommended shape: one goal node can fan out into product, design, technical, and verification branches.

## `article-outline`

Use when the user wants to read, summarize, or understand an article, report, paper, or long document.

Follow the article's own structure instead of forcing a product or task template.

Recommended nodes:

- source metadata when known,
- thesis or central claim,
- section-by-section outline,
- key concepts,
- arguments and evidence,
- examples or citations,
- conclusion,
- open questions and interpretation.

Keep source facts separate from interpretation. Do not invent quotes, authors, dates, or links.

## `codebase-structure`

Use when the user wants to inspect a repository, architecture, module layout, dependency structure, or impact area.

Follow the actual project structure and files that were inspected.

Recommended nodes:

- repository overview,
- entry commands and runtime paths,
- top-level directories,
- core modules,
- data flow or state ownership,
- external interfaces,
- build, test, and configuration surfaces,
- risk areas,
- suggested next inspection or change points.

Do not invent modules that were not observed. Label uncertain areas as questions or follow-up inspection nodes.

## `task-plan`

Use for execution planning, bug fixing, migration steps, test plans, or multi-step project work that is not primarily product discovery, article reading, or codebase mapping.

Recommended nodes:

- task objective,
- current evidence,
- constraints,
- implementation steps,
- parallel branches,
- blockers,
- verification,
- delivery checklist.

Do not mark plan nodes as completed work unless the work has actually been done.

## `general`

Use when the request is mixed, ambiguous, or too small for a specialized strategy.

Recommended nodes:

- topic,
- context,
- key points,
- questions,
- next step.

When information is missing, generate question nodes instead of overfitting the request into a specialized category.
