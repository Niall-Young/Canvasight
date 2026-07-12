# Domain: ux-design

Use for user experience, interface structure, interaction behavior, screen planning, or a design-system direction.

## Required coverage

| Coverage key | Required content |
| --- | --- |
| `ux.goal` | Design outcome and the user behavior or difficulty to improve. |
| `ux.context` | Users, scenarios, devices, environment, abilities, and constraints. |
| `ux.taskFlow` | Entry, task steps, decision points, exit, failure, and recovery. |
| `ux.informationArchitecture` | Content model, navigation, and responsibility of each primary surface. |
| `ux.pageHierarchy` | Core pages/regions, content priority, and primary/secondary actions. |
| `ux.components` | Component responsibilities and reusable interaction patterns without prematurely choosing an implementation library. |
| `ux.states` | Relevant default, hover, focus, disabled, loading, empty, success, and error states. |
| `ux.feedbackRecovery` | Feedback, confirmation, undo, recovery, prevention, and tolerance behavior. |
| `ux.visualDirection` | Concrete density, hierarchy, typography, spacing, color, and icon semantics. |
| `ux.accessibilityResponsive` | Responsive rules, keyboard operation, focus, screen reader semantics, contrast, and reduced motion as relevant. |
| `ux.acceptance` | Design boundaries, unresolved questions, and observable experience acceptance criteria. |

## Rejection rules

- “Consistent”, “clean”, “simple”, and “modern” are not decisions without concrete layout, hierarchy, component, or behavioral consequences.
- Do not mix page responsibility, visual styling, implementation technology, and QA into one undifferentiated branch.
