---
status: resolved
report_type: issue
owner: Product Agent
created_by: Main thread
priority: medium
created_at: 2026-07-05 22:57
updated_at: 2026-07-05 22:57
related_files:
  - plugins/canvasight/skills/canvasight-agent-team/SKILL.md
  - plugins/canvasight/skills/canvasight-agent-team/references/agent-selection.md
  - plugins/canvasight/skills/canvasight-agent-team/references/report-protocol.md
  - plugins/canvasight/skills/canvasight-run/references/run-output-contract.md
  - plugins/canvasight/src/lib/markdown.ts
  - README.md
solution_report: agent-reports/resolved/20260705-2257-development-solution-agents-md-bootstrap.md
agent_id: 019f31ba-5e18-7f33-a7c2-189dd10f0129
---

# Agent Team Skill 缺少 AGENTS.md 落地约束

## 提交 Agent

Main thread

## 建议交接 Agent

Skill Expert Agent, Development Standards Lead, Customer Support Agent

## 问题描述

Canvasight Agent Team skill 已经约束固定角色复用和 agent-report 状态回写，但对目标项目 `AGENTS.md` 的处理不够显式。用户指出我们自己项目已经把角色边界和协作协议写进 `AGENTS.md`，因此 skill 也应该要求 Codex 在目标项目中检查这层持久协作说明。

## 复现方式

1. 查看 `canvasight-agent-team` skill。
2. 触发 Agent Team Run。
3. 观察原规则主要要求读已有 `AGENTS.md`，但没有明确规定缺失或协议不完整时应交给 Development Standards Lead，并在授权时创建或最小更新。

## 影响范围

- Agent Team 可能只依赖一次性的 Run Markdown，而不是项目级长期规则。
- 缺少 `AGENTS.md` 的目标项目可能无法稳定复用固定角色和 report queue。
- 如果规则写得过强，又可能导致普通 Run 静默修改任意项目文件。

## 相关文件

- `plugins/canvasight/skills/canvasight-agent-team/SKILL.md`
- `plugins/canvasight/skills/canvasight-agent-team/references/agent-selection.md`
- `plugins/canvasight/skills/canvasight-agent-team/references/report-protocol.md`
- `plugins/canvasight/skills/canvasight-run/references/run-output-contract.md`
- `plugins/canvasight/src/lib/markdown.ts`
- `README.md`

## 期望结果

Skill 明确要求实际使用 Agent Team 前检查目标项目 `AGENTS.md`。缺失或缺少固定 roster / report protocol 时，先交给 Development Standards Lead；只有用户要求或项目规则允许时才创建或最小更新；不能因为默认开启 Agent Team 就静默修改普通项目。

## 当前状态

resolved

## Closure Criteria

- [x] 问题原因明确
- [x] 方案报告已回写
- [x] 修改文件已记录
- [x] 验证方式已记录
- [x] 后续风险已记录
