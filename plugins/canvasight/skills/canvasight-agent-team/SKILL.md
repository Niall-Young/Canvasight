---
name: canvasight-agent-team
description: Follow Canvasight's Agent Team and agent-report protocol. Use when a Canvasight Run payload has structuredContent.agentTeam.enabled true, or when the user explicitly asks to enable, disable, configure, audit, or include Canvasight Agent Team, agent reports, issue reports, solution reports, integration summaries, or the AGENTS.md + agent-reports collaboration workflow. Do not use for normal Canvasight opening, Run payload handling, graph writing, troubleshooting, or ordinary code changes unless this protocol is explicitly involved.
---

# Canvasight Agent Team

Use this skill when Canvasight asks Codex to run with Agent Team enabled, or when the user explicitly works on the Canvasight Agent Team / agent-report protocol.

## Workflow

1. Read `structuredContent.agentTeam` from the Canvasight Run payload.
2. Read the target project `AGENTS.md` first when it exists, especially its Agent Team lifecycle and report protocol.
3. Classify the task before assigning agents.
4. Use `references/agent-selection.md` to choose only the roles needed for the current work.
5. Use `references/report-protocol.md` for cross-agent communication, status tracking, issue reports, solution reports, and integration summaries.
6. Keep the main thread responsible for integration, conflict handling, verification, and final delivery.

Do not create every role by default. Small, self-contained tasks may only need the main thread plus one specialist check. Complex, cross-cutting tasks should use the relevant persistent role agents and report queue.

## Required Boundaries

- If the project has `AGENTS.md`, follow it first.
- If the project has an `agent-reports/` protocol, use its folders and templates.
- Treat Agent Team roles as persistent role seats for the project, not disposable one-shot helpers.
- Reuse or resume the existing role agent whenever one exists. Only create a new role agent when the needed role is missing.
- Do not close fixed role agents after one task finishes unless the user explicitly asks to rebuild or stop the team.
- When a role agent is created, reused, unavailable, or replaced, record that in an integration summary.
- This skill does not replace `canvasight-open`, `canvasight-run`, `canvasight-graph-writer`, or `canvasight-troubleshooting`.
- The Canvasight setting controls whether Run Markdown includes this protocol. It does not delete repo rules, existing reports, or `AGENTS.md`.
- If required subagents cannot be created or reused because of tool limits, record that limitation in the integration summary and perform that role's checklist in the main thread.
- Every blocking, high-risk, or cross-role issue must be written as a Markdown report before solution work continues.
- Every role agent that accepts, blocks, solves, or hands off work must update the relevant report status and queue entry before the main thread delivers.
