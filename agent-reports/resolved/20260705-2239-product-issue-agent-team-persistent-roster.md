---
status: resolved
report_type: issue
owner: main-thread
created_by: product-agent
priority: high
created_at: 2026-07-05 22:39
updated_at: 2026-07-05 22:42
related_files:
  - plugins/canvasight/skills/canvasight-agent-team/SKILL.md
  - plugins/canvasight/skills/canvasight-agent-team/references/agent-selection.md
  - plugins/canvasight/skills/canvasight-agent-team/references/report-protocol.md
  - plugins/canvasight/skills/canvasight-run/references/run-output-contract.md
  - plugins/canvasight/src/lib/markdown.ts
  - README.md
solution_report: agent-reports/resolved/20260705-2242-development-solution-agent-team-persistent-roster.md
---

# Agent Team 固定角色复用规则不够明确

## TL;DR

Agent Team skill 必须明确固定角色是长期 roster，正常工作应复用或恢复已有角色；缺失角色才创建，并且角色之间通过带状态的 `agent-reports/` 进行通讯和状态回写。

## 发现者

Product Agent

## 提交 Agent

Product Agent

## 建议交接 Agent

Skill Expert Agent、Customer Support Agent、Test Supervisor Agent、Project Management Agent

## 问题描述

用户指出 Canvasight Agent Team skill 里的几个 agent 应该像当前项目里的固定 agent 一样长期复用，不应每次任务创建新的临时 agent。用户进一步要求 agent 之间通过 report 通讯，并且 agent 干活时要知道更新状态。

## 现象

- `canvasight-agent-team` 里已有 `create or reuse` 表述，但仍可能被理解成每轮按需创建。
- Run Markdown 只要求“创建必要角色”，没有强调优先复用已有固定角色。
- Report 协议说明了状态文件夹和 frontmatter，但没有明确“接活、阻塞、解决、转交都要回写状态”。

## 复现方式

1. 打开 `plugins/canvasight/skills/canvasight-agent-team/references/agent-selection.md`。
2. 观察 Selection Rule 使用 `Create or reuse`，缺少固定 roster 细则。
3. 打开 `references/report-protocol.md`。
4. 观察状态流转存在，但 agent 工作过程中的状态回写责任不够明确。

## 影响范围

- Agent Team skill 行为解释。
- Canvasight Run Markdown 中的 Agent Team 指令。
- README 中的用户可见说明。
- 插件版本和 Codex cache 刷新。

## 证据

- `AGENTS.md` 已经定义项目固定 roster：固定角色不关闭、不重复创建，并在 integration summary 记录 agent id。
- 用户要求“就是我们现在这套”，即项目内长期复用同一批 agent。

## 初步归因

Agent Team skill 沉淀了角色分类和 report 协议，但没有完整移植项目当前的固定 roster 生命周期和状态回写规则。

## 交付给哪个 Agent

Skill Expert Agent

## 需要回答的问题

- Skill 中如何区分“按需调用固定角色”和“创建缺失角色”？
- Agent report 中如何明确 agent 状态回写责任？
- README 是否需要说明这是固定角色复用而非一次性 agent？

## 相关文件

- `plugins/canvasight/skills/canvasight-agent-team/SKILL.md`
- `plugins/canvasight/skills/canvasight-agent-team/references/agent-selection.md`
- `plugins/canvasight/skills/canvasight-agent-team/references/report-protocol.md`
- `plugins/canvasight/skills/canvasight-run/references/run-output-contract.md`
- `plugins/canvasight/src/lib/markdown.ts`
- `README.md`

## 期望结果

- Skill 明确 persistent roster。
- Skill 明确复用/恢复已有同角色 agent。
- Skill 明确缺失角色才创建，且要记录角色到 agent id 的映射。
- Report 协议明确 agent 接活、阻塞、解决、转交时必须回写状态和队列。
- README 中英文说明 Agent Team 是固定角色复用。

## Closure Criteria

- [x] 问题原因明确
- [x] 方案报告已回写
- [x] 修改文件已记录
- [x] 验证方式已记录
- [x] 后续风险已记录

## 当前状态

resolved

## 处理结果

已修复。

## 修改文件

- `plugins/canvasight/skills/canvasight-agent-team/SKILL.md`
- `plugins/canvasight/skills/canvasight-agent-team/references/agent-selection.md`
- `plugins/canvasight/skills/canvasight-agent-team/references/report-protocol.md`
- `plugins/canvasight/skills/canvasight-run/references/run-output-contract.md`
- `plugins/canvasight/src/lib/markdown.ts`
- `README.md`
- `plugins/canvasight/package.json`
- `plugins/canvasight/package-lock.json`
- `plugins/canvasight/.codex-plugin/plugin.json`
- `plugins/canvasight/mcp/server.mjs`
- `plugins/canvasight/tests/mcp-smoke.mjs`

## 验证方式

- `npm run typecheck`
- `npm run test:mcp`
- `npm run build`
- `python3 /Users/niallyoung/.codex/skills/.system/plugin-creator/scripts/validate_plugin.py /Users/niallyoung/Desktop/Canvasight/plugins/canvasight`
- `rg` 检查固定 roster、复用/恢复、状态回写等关键词。

## 后续风险

- 当前规则是 skill / Markdown 协议层约束；实际能否恢复已有 subagent 取决于 Codex 当前线程和工具能力。
