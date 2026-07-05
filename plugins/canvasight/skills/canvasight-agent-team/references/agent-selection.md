# Agent Selection

Use this reference after `structuredContent.agentTeam.enabled` is true.

## Selection Rule

Classify the work first. Create or reuse only the agents needed for the current request. Do not launch the whole team just because Agent Team is enabled.

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

Do not create agents for roles whose owned surface is not affected. If a role is only marginally relevant, document the main-thread checklist instead of spawning another worker.
