# Domain: software-product

Use for a product, app, tool, plugin, service, or user-facing feature. Product definition, user flow, and design form the main graph; technical and test detail support them.

## Required coverage

| Coverage key | Required content |
| --- | --- |
| `product.goal` | Desired outcome, current problem, and why the change matters. |
| `product.users` | Specific users, usage situations, current difficulty, and trigger. |
| `product.value` | User value and product/business value stated separately. |
| `product.capabilities` | For each core capability: purpose, trigger, input, output, and successful result. |
| `product.scope` | MVP, later scope, and explicit non-goals. |
| `product.journey` | Entry, main path, completion, interruption, and recovery. |
| `product.informationArchitecture` | Page/surface responsibilities, navigation relationships, and key states. |
| `product.rules` | Permissions, prerequisites, limits, business rules, and boundaries. |
| `product.design` | Hierarchy, interaction, feedback, empty/loading/error, accessibility, and responsive behavior. |
| `product.success` | Observable user outcome plus acceptance conditions or metrics. |
| `product.risks` | Material risks, assumptions, unresolved questions, and their effect. |
| `product.technicalConstraints` | Only architecture, data, permission, performance, or integration constraints that affect product decisions. |
| `product.testingRelease` | Tests derived from product rules and a release/rollback check; no detached generic QA list. |
| `product.deliverables` | Actual required outputs: guidance, design baseline, README/user docs, implementation, tests, and acceptance evidence as relevant. |

## Project readiness

When a workspace is available, inspect root `AGENTS.md` and `design.md` existence. For a missing file that the project needs, add a deliverable node to create it. If present, record existence only; do not claim content quality without inspection. Decide README, tests, and acceptance materials from the work rather than forcing them into every project.

## Rejection rules

- Do not let technology, implementation steps, tests, and release nodes outnumber the combined product, user-flow, and design nodes.
- Reject generic claims such as “easy to use”, “modern”, or “good experience” unless the node defines an observable behavior or decision.
