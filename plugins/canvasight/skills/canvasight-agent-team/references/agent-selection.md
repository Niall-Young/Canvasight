# Agent Selection

Use this reference after `structuredContent.agentTeam.enabled` is true.

## Selection Rule

Classify the work first. Call only the agents needed for the current request. Do not launch the whole team just because Agent Team is enabled.

## Persistent Roster Rule

Agent Team roles are long-lived project role seats. They should behave like the fixed Canvasight project agents: the same roles keep handling the project across turns, instead of creating a fresh set for every task.

Use this order:

1. Read the project's `AGENTS.md` Agent Team lifecycle when it exists.
2. Check the latest integration summaries or current thread state for the recorded role-to-agent mapping.
3. Reuse or resume the existing role agent for the needed role.
4. Send follow-up work to that same role agent through the current agent tool, and use `agent-reports/` for durable cross-agent handoff.
5. Create a new role agent only when the role is needed and no reusable role agent exists.
6. Record created, reused, missing, or replaced role agents in the next integration summary.
7. Keep fixed role agents open after task completion unless the user explicitly asks to rebuild or stop the team.

"On demand" means call the relevant fixed roles for the current work. It does not mean creating disposable one-task agents.

When tool UIs expose random nicknames, keep the product-facing identity as the role name. Integration summaries may map the role to the actual agent id or nickname, but reports should assign work to the stable role name.

## Core Roles

- Product Agent: use for requirements, goals, scope, user flows, task structure, acceptance criteria, or product tradeoffs.
- Design Agent: use for UI, interaction, visual polish, responsive layout, screenshots, component language, and user experience review.
- Design Standards Expert: use when `design.md` should be created, updated, audited, or used as the design baseline.
- Development Agent: use for implementation, refactors, MCP/API behavior, persistence, data contracts, runtime behavior, and code fixes.
- Development Standards Lead: use when `AGENTS.md`, commands, repo rules, workflow standards, or collaboration boundaries need updates.
- Test Supervisor Agent: use for smoke tests, typecheck/build checks, Playwright/browser-visible verification, reproduction steps, and residual-risk review.
- Customer Support Agent: use for user-facing README, bilingual docs, workflow descriptions, troubleshooting, and release-facing explanations.
- Project Management Agent: use for git status, staging scope, commit-message quality, version bumps, changelog-style summaries, and delivery hygiene.
- Skill Expert Agent: use for `SKILL.md`, frontmatter trigger wording, skill splitting, reference design, and skill validation.

## Common Routing

- Product or feature planning: Product Agent; add Design Agent for UI-heavy work; add Development Agent for implementation planning.
- UI bug or visual fidelity: Design Agent plus Development Agent; add Test Supervisor for browser verification.
- Code implementation: Development Agent; add Test Supervisor for verification; add Project Management Agent before commit.
- Documentation change: Customer Support Agent; add Development Standards Lead for `AGENTS.md`, Design Standards Expert for `design.md`, Skill Expert for skills.
- Plugin, skill, or MCP protocol change: Development Agent, Skill Expert Agent, Test Supervisor Agent, Customer Support Agent, Project Management Agent.
- Complex cross-cutting feature: Product Agent, Design Agent, Development Agent, Test Supervisor Agent, Customer Support Agent, Project Management Agent; add standards/skill roles only when their owned files or rules are touched.

## Avoid Over-Routing

Do not call agents for roles whose owned surface is not affected. Do not create duplicate agents for a role that already has a fixed project agent. If a role is only marginally relevant, document the main-thread checklist instead of creating another worker.
