# Agent Reports Protocol

`agent-reports/` is the file-system coordination queue for the Canvasight Agent Team. It is used for cross-Agent handoff, issue tracking, solution writeback, and integration summaries.

## Status Folders

- `open/`: newly discovered issues that are not yet accepted by an owner.
- `assigned/`: issues handed to a responsible Agent and waiting for analysis or implementation.
- `resolved/`: solution reports, completed integration summaries, and issues with a recorded fix.
- `archived/`: closed, no-action, superseded, or legacy reports that should remain auditable but are not active.

Existing Markdown files directly under `agent-reports/` are legacy records. New reports should use the status folders.

## Queue Index

`QUEUE.md` is the active queue index. Update it whenever a new issue is created, assigned, marked with an unresolved-risk note, resolved, archived, or closed in an integration summary.

The queue is intentionally short. It should point to report files instead of duplicating their full content.

## Required Frontmatter

Every new report must start with YAML frontmatter:

```yaml
---
status: open
report_type: issue
owner: development-agent
created_by: test-supervisor-agent
priority: medium
created_at: 2026-07-05 19:20
updated_at: 2026-07-05 19:20
related_files: []
solution_report:
---
```

Allowed values:

- `status`: `open`, `assigned`, `resolved`, `archived`
- `report_type`: `issue`, `solution`, `integration-summary`
- `priority`: `low`, `medium`, `high`, `critical`

## Lifecycle

1. Discovery: create an issue report in `open/` using `_templates/issue.md`.
2. Queue: add the issue to `QUEUE.md`.
3. Assignment: move or create the issue under `assigned/`, set `status: assigned`, and set `owner`.
4. Analysis and implementation: the owning Agent investigates and proposes or performs the fix.
5. Writeback: create a solution report in `resolved/` using `_templates/solution.md`.
6. Closure: update the issue report with `status: resolved`, `solution_report`, `处理结果`, `修改文件`, `验证方式`, and `后续风险`.
7. Integration: write `resolved/YYYYMMDD-HHMM-integration-summary.md` using `_templates/integration-summary.md`.
8. Queue closure: update `QUEUE.md` with the resolved, archived, unresolved-risk, or no-action result.
9. Archive: move no-action, superseded, or historical records to `archived/` only when useful. Do not bulk rewrite legacy reports.

## Naming

Use:

- `YYYYMMDD-HHMM-<role>-issue-<slug>.md`
- `YYYYMMDD-HHMM-<role>-solution-<slug>.md`
- `YYYYMMDD-HHMM-integration-summary.md`

Keep `<role>` stable, for example `product`, `design`, `development`, `test`, `customer-support`, `design-standards`, `development-standards`, `project-management`, `skill-expert`, or `integration`.

## Closure Rule

The main thread cannot claim a scope is fully delivered while a relevant report remains `open` or `assigned`, unless the integration summary explicitly lists it as an unresolved risk and explains why it is not blocking this delivery.
