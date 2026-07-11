# Report Protocol

`references/agent-team-schema.json` is the authoritative contract for schema versions, fields, role names, status enums, report paths, queue columns, and validation states. This document defines the write order and collaboration behavior that use that contract.

## Sources Of Truth

- A report file is authoritative for its issue's `owner`, `status`, dependencies, and verification evidence.
- `ROSTER.md` is authoritative for persistent role-seat state and its current `agent_id` / `thread_id` mapping.
- `agent-reports/QUEUE.md` is a derived index of active issues only.

If a queue row differs from its report, discard the row's values and regenerate it from the report. If a report's issue owner differs from roster state, keep the report's owner and synchronize the affected roster seat after the report succeeds. A new thread reads the roster before rebuilding a role, but it must re-read the current issue before taking ownership.

## Report Layout

```text
agent-reports/
  QUEUE.md
  open/       # open issues
  assigned/   # assigned and blocked issues
  resolved/   # resolved issues, solutions, integration summaries
  archived/   # auditable closed history
```

Use the schema's filename rule: `issue-<kebab-slug>.md`, `solution-<kebab-slug>.md`, or `integration-summary-<kebab-slug>.md`. `report_id` equals the filename without `.md`; references in `depends_on` use that ID, never an informal title or path.

## Required Frontmatter

Every report carries the fields required by the schema. A report needs `schema_version`, `report_id`, `report_type`, `status`, `owner`, `created_by`, `priority`, `version`, `agent_id`, `thread_id`, `created_at`, `updated_at`, `depends_on`, `related_files`, `verification_status`, and `verification_evidence`. `agent_id` and `thread_id` may be `null` only when runtime identity is unavailable. Use RFC 3339 UTC timestamps.

## Single Owner And Optimistic Concurrency

1. Read the latest issue and record its scalar `owner`, `status`, and `version`.
2. Confirm the actor may write: the issue is explicitly handed off, blocker-reassigned, or reassigned by the main thread.
3. Re-read the report immediately before writing. Only continue if the version still equals the expected value.
4. Write the report with `version + 1` and a fresh `updated_at` in the same change.
5. If ownership or runtime mapping changed, update the relevant `ROSTER.md` seat.
6. Derive the matching `QUEUE.md` row from the new report version.

## Status Write-Back

- On acceptance, set `status: assigned` and move the issue to `assigned/`.
- On a blocker, set `status: blocked`, keep the issue in `assigned/`, record the blocker and next owner, and mark the affected roster seat as needed.
- On resolution, create the linked solution report, update the issue to `resolved`, set verification metadata, and move it to `resolved/`.
- After an integration round, write an `integration-summary` report that depends on the relevant issue and solution reports and records roster changes, validation, unresolved work, and risks.
- Archive only verified resolved material after its integration summary records the closure.

## Queue Rules

When `QUEUE.md` exists, it contains exactly one row for each `open`, `assigned`, or `blocked` issue and no row for resolved or archived reports. Its columns and values must match the linked report exactly. The `summary` is the source report's level-one title; `report_version` is the report's `version`, not an independent queue version.

Run the validator after report-protocol changes or before delivering an Agent Team project:

```sh
node scripts/validate-agent-team.mjs --root <project-root>
```
