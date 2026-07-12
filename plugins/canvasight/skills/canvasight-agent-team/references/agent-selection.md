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
- Project Management Agent: git scope, release hygiene, versioning, and delivery closure. Record the baseline HEAD and worktree state at task start. After the Main Thread freezes a verified commit-ready scope, inspect the task-owned diff, selectively stage only approved paths or hunks, recheck the staged scope, and create the project's conventional commit. Never use broad staging such as `git add -A` when unrelated or pre-existing changes may exist. If safe closure is impossible, leave ambiguous changes unstaged and record the exact exception.
- Skill Expert Agent: `SKILL.md`, trigger wording, reference design, and skill validation.

## Git Delivery Closure

When the Project Management Agent is selected, use this order:

1. At task start, record the branch, baseline HEAD, and worktree status so pre-existing changes remain identifiable.
2. Receive the commit-ready file or hunk manifest from the Main Thread only after required verification passes and relevant issues are resolved or explicitly recorded as residual risks.
3. Review the scoped diff and reject secrets, conflicts, unrelated files, generated noise, or changes whose ownership cannot be separated safely.
4. Stage with explicit pathspecs or proven task-owned hunks. Do not use `git add -A`, `git add .`, or equivalent broad staging in a dirty shared worktree.
5. Inspect `git diff --cached --name-only`, `git diff --cached --stat`, and `git diff --cached --check`. The staged paths must exactly match the approved manifest. Any edit after staging invalidates approval and requires a fresh review.
6. If the staged diff is non-empty, create a small commit using the project's commit convention, then re-read `git status --short` and report the commit subject and hash to the Main Thread.

Skipping the commit is allowed only when the user explicitly requests no commit, no task-owned diff exists, required verification failed or remains incomplete, a relevant issue is unresolved without an accepted risk, the task-owned scope cannot be separated from pre-existing or concurrent work, the repository is conflicted, or staging/commit hooks fail. Record the exact reason and remaining paths in the integration summary; do not use `commit: pending` as a substitute for Git closure.

## Avoid Over-Routing

Only call roles whose owned surface is affected. Do not duplicate an active roster seat, assign a second owner to an issue, or turn `QUEUE.md` into a source of state. Record an unavailable specialist as a main-thread checklist item in the integration summary instead of creating an unrelated temporary role.
