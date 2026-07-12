# Domain: codebase

Use for repository inspection, reverse engineering, architecture mapping, change-impact analysis, or identifying implementation entry points.

## Required coverage

| Coverage key | Required content |
| --- | --- |
| `codebase.purposeEntry` | Repository purpose plus verified runtime and user-facing entry points. |
| `codebase.directories` | Relevant top-level directories and their observed responsibilities. |
| `codebase.modulesEvidence` | Core modules linked to real inspected files or symbols. |
| `codebase.executionFlow` | Main execution path from entry to result. |
| `codebase.dataState` | Data movement, state ownership, persistence, and mutation points. |
| `codebase.dependenciesInterfaces` | Internal dependencies, external services, APIs, and boundaries. |
| `codebase.tooling` | Verified configuration, build, test, development, and deployment entry points. |
| `codebase.extensionPoints` | Supported seams for extension or the safest change locations. |
| `codebase.risksDebt` | High-risk areas, hidden constraints, coupling, and technical debt with evidence. |
| `codebase.epistemicStatus` | Confirmed facts, inferences, and unresolved inspection questions separated explicitly. |
| `codebase.relevantFiles` | Files or symbols most relevant to the user's actual goal and why. |

## Evidence rules

Every factual node names inspected evidence in its body or connects to a source/file node. Do not infer module responsibility from a filename alone when the file is available to inspect. Never invent unobserved modules, commands, or flows.
