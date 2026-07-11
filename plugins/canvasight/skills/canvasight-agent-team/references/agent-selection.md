# Agent Selection

Read `references/agent-team-schema.json` before assigning roles. It fixes the valid role names and the role-seat statuses used by this document.

## Recovery And Assignment Order

1. Read the project's `AGENTS.md` and `ROSTER.md`.
2. Read the latest integration summary and linked reports for the needed role.
3. If work belongs to an issue, read its latest `owner`, `status`, and `version` before assigning anyone.
4. Reuse the live role agent in the current thread when the roster mapping still matches.
5. On a new thread, mark a needed seat `rebuilding`, rebuild only that seat, and write its `agent_id`, `thread_id`, `last_seen`, and report links back to `ROSTER.md`.
6. Create a role only when no reusable or rebuildable seat exists.

`ROSTER.md` stores the role-seat mapping. The issue report remains authoritative for issue ownership; update the report first, then synchronize roster state and `QUEUE.md`.

## Role Lifecycle

- `active`: a current runtime agent and thread are available for the seat.
- `inactive`: the seat is intentionally dormant.
- `blocked`: the seat cannot continue until its recorded blocker is cleared.
- `rebuilding`: a replacement is required on the current thread.
- `replaced`: the prior seat was superseded and `replaced_by` identifies its successor.
- `missing`: the role is expected but has not been created.

Do not add aliases such as `current_agent_id` or ad hoc role names. Use the schema's core roles; `Main Thread` is reserved for coordination and is not a roster seat.

## Issue Ownership And Concurrency

- A report's scalar `owner` is the only active owner of that issue.
- Accept an issue only when unassigned by project policy, explicitly handed off, blocker-reassigned, or reassigned by the main thread.
- Record the expected report version, re-read it just before editing, and write `version + 1` with a fresh RFC 3339 UTC `updated_at`.
- If either owner, status, or version changed, do not overwrite. Re-read, then hand work to the recorded owner, append a fresh update, formally reassign, or split independent work into a new issue.
- Update the report first, the affected roster seat second, and the queue last.

## Core Roles

- Product Agent: requirements, scope, acceptance criteria, and product tradeoffs.
- Design Agent: UI, interaction, visual polish, and UX review.
- Design Standards Expert: `design.md` and design-system standards.
- Development Agent: implementation, refactors, APIs, persistence, and runtime behavior.
- Development Standards Lead: `AGENTS.md`, commands, repo rules, and collaboration standards.
- Test Supervisor Agent: reproducibility, smoke tests, browser checks, and residual-risk review.
- Customer Support Agent: README, workflow guidance, troubleshooting, and release-facing explanations.
- Project Management Agent: git scope, release hygiene, versioning, and delivery checks.
- Skill Expert Agent: `SKILL.md`, trigger wording, reference design, and skill validation.

## Avoid Over-Routing

Only call roles whose owned surface is affected. Do not duplicate an active roster seat, assign a second owner to an issue, or turn `QUEUE.md` into a source of state. Record an unavailable specialist as a main-thread checklist item in the integration summary instead of creating an unrelated temporary role.
