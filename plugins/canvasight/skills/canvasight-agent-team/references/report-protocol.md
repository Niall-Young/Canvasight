# Report Protocol

Use a file-system queue when Agent Team is enabled and the project has or needs `agent-reports/`.

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
---
```

Use local project role names when they differ from the example.

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
