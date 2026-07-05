---
status: resolved
report_type: issue
owner: Product Agent
created_by: Main thread
priority: high
created_at: 2026-07-05 23:11
updated_at: 2026-07-05 23:11
related_files:
  - plugins/canvasight/skills/canvasight-agent-team/SKILL.md
  - plugins/canvasight/skills/canvasight-agent-team/references/agent-selection.md
  - plugins/canvasight/skills/canvasight-run/references/run-output-contract.md
  - plugins/canvasight/mcp/server.mjs
  - plugins/canvasight/src/lib/markdown.ts
  - plugins/canvasight/tests/mcp-smoke.mjs
  - README.md
solution_report: agent-reports/resolved/20260705-2311-development-solution-agent-team-agents-md-persistence.md
agent_id: 019f31ba-5e18-7f33-a7c2-189dd10f0129
---

# Agent Team 跨 Thread 规则未默认持久化

## 提交 Agent

Main thread

## 建议交接 Agent

Development Standards Lead, Skill Expert Agent, Customer Support Agent

## 问题描述

上一版规则要求只有用户明确要求或项目规则允许时才创建或更新目标项目 `AGENTS.md`。这会导致 Canvasight Agent Team 在新 Codex thread 中无法稳定继承固定角色、按需补角色和 report 状态回写规则。

## 复现方式

1. 在某个项目中开启 Canvasight Agent Team。
2. 第一个 Codex thread 创建部分固定角色并继续工作。
3. 归档或切换到新 Codex thread。
4. 如果目标项目 `AGENTS.md` 没有 Agent Team 协议，新 thread 只能重新临时理解协作方式，无法稳定延续项目级规则。

## 影响范围

- 固定 Agent Team 只能依赖 thread-local 状态。
- 换 thread 后可能重复创建角色或遗漏后续需要补齐的角色。
- `agent-reports/` 有状态记录，但缺少项目级规则来源。

## 相关文件

- `plugins/canvasight/skills/canvasight-agent-team/SKILL.md`
- `plugins/canvasight/skills/canvasight-agent-team/references/agent-selection.md`
- `plugins/canvasight/skills/canvasight-agent-team/references/report-protocol.md`
- `plugins/canvasight/skills/canvasight-run/references/run-output-contract.md`
- `plugins/canvasight/mcp/server.mjs`
- `plugins/canvasight/src/lib/markdown.ts`
- `plugins/canvasight/tests/mcp-smoke.mjs`
- `README.md`

## 期望结果

Canvasight Agent Team 实际启用时，如果目标项目缺少 `AGENTS.md` 或缺少固定 roster / report protocol，应默认由 Development Standards Lead 创建文件或追加最小 Agent Team 段落。不能覆盖已有项目规则；若已有规则明确禁止或冲突，则先写 issue/risk report 并询问。

## 当前状态

resolved

## Closure Criteria

- [x] 问题原因明确
- [x] 方案报告已回写
- [x] 修改文件已记录
- [x] 验证方式已记录
- [x] 后续风险已记录
