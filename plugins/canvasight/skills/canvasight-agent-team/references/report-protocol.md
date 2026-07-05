# Report Protocol

Use a file-system queue when Agent Team is enabled and the project has or needs `agent-reports/`. Reports are the durable communication layer between persistent role agents.

If the target project lacks `AGENTS.md` guidance for reports, route that gap to the Development Standards Lead before establishing a long-lived report workflow. If the project already defines different report folders or templates, preserve them and adapt Canvasight handoff wording to the existing structure instead of replacing it.

## Status Folders

```text
agent-reports/
  open/
  assigned/
  resolved/
  archived/
```

- `open/`: newly discovered issues not yet assigned.
- `assigned/`: accepted issues with a responsible owner.
- `resolved/`: solution reports, completed summaries, and issues with recorded fixes.
- `archived/`: closed history that should remain auditable.

Use `agent-reports/QUEUE.md` as the active queue index when it exists.

## Communication Rule

- Cross-agent handoff happens through Markdown reports, not only transient chat messages.
- Every report must carry frontmatter status, owner, created_by, priority, created_at, and updated_at.
- `owner`, `created_by`, and handoff fields should use stable roster role names such as `Product Agent` or `Test Supervisor Agent`, not random tool nicknames.
- If the runtime exposes a concrete agent id, record it in the integration summary role mapping instead of replacing the role name in reports.
- Every status change must update the report file and `agent-reports/QUEUE.md` when the queue exists.
- Role agents should read the linked issue or solution report before responding to a handoff.
- Role agents must write status back when they accept work, find a blocker, finish analysis, finish implementation, or hand work to another role.
- Do not leave a report stale after doing work. At minimum update `updated_at`, `status`, `owner`, `当前状态`, and either `处理结果`, `验证方式`, or `后续风险`.
- Integration summaries must record which role agents were called, reused, missing, or represented by main-thread checklist.

## Status Write-Back Rule

Agents own the report state for work they touch.

- When accepting work: set `status: assigned`, set `owner`, move or keep the file under `agent-reports/assigned/`, and update `agent-reports/QUEUE.md`.
- While working: keep `status: assigned`, append concise progress or blocker notes in the report body, and update `updated_at`.
- When blocked: keep the report assigned, write the blocker, evidence, needed answer, and next owner. If the blocker needs another role, create or link a new issue report.
- When solved: write a solution report under `agent-reports/resolved/`, update the original issue to `status: resolved`, add `solution_report`, and fill `处理结果`, `修改文件`, `验证方式`, and `后续风险`.
- When archived: move only after the integration summary records the closure. Do not archive active or unverified work.

## Required Frontmatter

```yaml
---
status: open
report_type: issue
owner: frontend-agent
created_by: qa-agent
priority: medium
created_at: YYYY-MM-DD HH:MM
updated_at: YYYY-MM-DD HH:MM
related_files:
  - src/example.tsx
solution_report:
agent_id:
---
```

Use local project role names when they differ from the example. `agent_id` is optional and should only be used when the runtime provides a useful stable id for the owner.

## Issue Report Body

```markdown
# 问题标题

## 提交 Agent

## 建议交接 Agent

## 问题描述

## 复现方式

## 影响范围

## 相关文件

## 期望结果

## 当前状态

open

## Closure Criteria

- [ ] 问题原因明确
- [ ] 方案报告已回写
- [ ] 修改文件已记录
- [ ] 验证方式已记录
- [ ] 后续风险已记录
```

## Solution Report Body

```markdown
# 解决方案标题

## Linked Issue

## 负责 Agent

## Root Cause

## 调研过程

## 可选方案

## 推荐方案

## 实施步骤

## 风险与回滚

## 验证方式
```

## Solution Write-Back

Every resolved report must include:

```markdown
## 处理结果

## 修改文件

## 验证方式

## 后续风险
```

## Integration Summary

After each integration round, write a summary with:

- goal for the round,
- agents involved,
- status changes,
- resolved items,
- unresolved items,
- verification results,
- next assignments or risks,
- archived or resolved report links.

The main thread owns final verification and final delivery even when specialist agents contribute analysis or patches.
