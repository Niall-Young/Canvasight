---
schema_version: 1
report_id: issue-project-management-git-closure
report_type: issue
status: resolved
owner: Project Management Agent
created_by: Main Thread
priority: high
version: 3
agent_id: /root/project_management_agent
thread_id: 019f547d-edb6-73e3-b69a-27a2e1498e61
created_at: 2026-07-12T04:07:10Z
updated_at: 2026-07-12T04:07:10Z
depends_on: []
related_files:
  - plugins/canvasight/skills/canvasight-agent-team/SKILL.md
  - plugins/canvasight/skills/canvasight-agent-team/references/agent-selection.md
  - plugins/canvasight/skills/canvasight-agent-team/references/report-protocol.md
  - AGENTS.md
verification_status: passed
verification_evidence:
  - Skill Expert and Project Management reviews confirmed the missing commit obligation
  - protocol diff defines selective staging commit and explicit exceptions
---

# Project Management 缺少 Git 提交闭环

## 问题

Agent Team 只要求 Project Management Agent 检查 Git 范围、版本和交付卫生，没有要求它在验证通过后定向暂存并提交本轮改动。多个历史集成总结因此停在 `commit: pending` 或未提交状态。

## 处理结果

已明确 Main Thread 冻结并批准 commit-ready scope，Project Management Agent 执行定向 staging、cached diff 复核、中文 conventional commit 和提交后状态检查。仅在用户明确不提交、没有本轮 diff、验证失败、相关问题未收口、归属无法分离、冲突或 hook 失败时允许跳过，并必须记录精确原因。

## 修改文件

- `plugins/canvasight/skills/canvasight-agent-team/SKILL.md`
- `plugins/canvasight/skills/canvasight-agent-team/references/agent-selection.md`
- `plugins/canvasight/skills/canvasight-agent-team/references/report-protocol.md`
- `AGENTS.md`

## 验证方式

- Skill 快速校验
- Agent Team 协议校验
- Plugin 校验
- 定向 staged diff 审核

## 后续风险

共享工作树仍可能包含任务开始前的修改；新规则会把归属不明作为明确阻断，不允许全量暂存。
