---
name: canvasight-agent-team
description: Follow Canvasight's Agent Team, role-registry, and agent-report protocol. Use when a Canvasight Run payload has structuredContent.agentTeam.enabled true, or when the user explicitly asks to enable, disable, configure, audit, or include Canvasight Agent Team, ROSTER.md, agent reports, issue reports, solution reports, integration summaries, or the AGENTS.md + role-registry + agent-reports collaboration workflow. Do not use for normal Canvasight opening, Run payload handling, graph writing, troubleshooting, or ordinary code changes unless this protocol is explicitly involved.
---

# Codex Agent Team Skill

Use this skill when Canvasight asks Codex to run with Agent Team enabled, or when the user explicitly works on the Agent Team report protocol.

## Workflow

1. Read `structuredContent.agentTeam`, then the target project's `AGENTS.md` when it exists.
2. Read `references/agent-team-schema.json`; it is the authoritative contract for role names, field names, statuses, paths, and queue columns.
3. Read `ROSTER.md` for durable role-seat state, then linked reports and the latest integration summary before rebuilding a role on a new thread.
4. Before accepting, blocking, solving, or handing off an issue, read its latest `owner`, `status`, and `version`. Do not write against a stale snapshot.
5. Use `references/agent-selection.md` to select only the roles needed for the current work and `references/report-protocol.md` for write-back rules.
6. Keep the main thread responsible for integration, conflict handling, validation, and final delivery. After it freezes a verified commit-ready scope, have the Project Management Agent perform the scoped Git closure defined in the references; if that seat is unavailable, the main thread must perform the same closure.

`ROSTER.md` preserves role-seat state, not a thread-local subagent process. Do not create every role by default; recreate only the seats required for the current work.

## Required Boundaries

- Keep `canvasight-agent-team` as the Canvasight compatibility name; it packages the upstream Codex Agent Team protocol.
- If Agent Team work uses fixed roles, `ROSTER.md` is required. Create or repair it before relying on a persistent role seat.
- Report files are the source of truth for issue ownership, state, dependencies, and validation evidence. `ROSTER.md` is the source of truth for role-seat runtime mapping. `agent-reports/QUEUE.md` is a derived index only.
- When an issue and roster disagree about issue ownership, keep the report as authoritative and synchronize the roster after the report write succeeds. When a queue row disagrees with a report, regenerate the queue row from the report.
- A single issue has exactly one active `owner`. A role may not take it over without an explicit handoff, blocker-driven reassignment, or main-thread reassignment recorded in the issue.
- Use optimistic concurrency for every report write: re-read the expected `version` immediately before editing, increment it with `updated_at`, and abort/re-read if it changed. `updated_at` is audit metadata, not the write guard.
- Write in this order: report -> affected roster seat -> derived queue. Never update the queue first.
- Use stable schema role names in reports. `Main Thread` is the only reserved coordinator that need not have a roster seat.
- Run `node scripts/validate-agent-team.mjs --root <project-root>` before delivering changes to a project that uses this protocol.
- Do not leave verified task-owned changes at `commit: pending` merely because the main thread owns final delivery. Finish selective staging and commit unless a documented Git-closure exception applies.
- If a project already has a conflicting collaboration protocol, preserve it, record the conflict, and ask for direction before replacing it.
