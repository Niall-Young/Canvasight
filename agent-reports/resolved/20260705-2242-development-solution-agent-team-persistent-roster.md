---
status: resolved
report_type: solution
owner: skill-expert-agent
created_by: main-thread
priority: high
created_at: 2026-07-05 22:42
updated_at: 2026-07-05 22:42
related_issue: agent-reports/resolved/20260705-2239-product-issue-agent-team-persistent-roster.md
related_files:
  - plugins/canvasight/skills/canvasight-agent-team/SKILL.md
  - plugins/canvasight/skills/canvasight-agent-team/references/agent-selection.md
  - plugins/canvasight/skills/canvasight-agent-team/references/report-protocol.md
  - plugins/canvasight/skills/canvasight-run/references/run-output-contract.md
  - plugins/canvasight/src/lib/markdown.ts
  - README.md
---

# Agent Team 持久 roster 规则解决方案

## 负责 Agent

Skill Expert Agent，主线程集成；Product Agent、Test Supervisor Agent、Customer Support Agent、Project Management Agent 提供审查结论。

## 对应问题

`agent-reports/resolved/20260705-2239-product-issue-agent-team-persistent-roster.md`

## Root Cause

上一轮 Agent Team skill 已经定义了角色分类和 report 协议，但 wording 中仍包含 `create or reuse` / `spawn` 语义，容易让 Codex 把“按需调用”理解为“每次创建临时 agent”。Report 协议也没有把 agent 工作中的状态回写责任写成硬规则。

## 调研过程

- 复用现有 Product、Skill Expert、Test Supervisor、Customer Support、Project Management Agent，而不是新建临时 agent。
- 对照 `AGENTS.md` 的 Agent Team Lifecycle，确认项目已有固定 roster、不关闭、不重复创建和 integration summary 记录 agent id 的规则。
- 根据用户补充要求，将 agent report 定义为跨 agent 通讯和状态回写层。

## 可选方案

- 方案 A：只在最终回复解释“应该复用”。缺点是 skill 不会持久影响之后的 Canvasight Run。
- 方案 B：更新 skill / references / Run Markdown / README，把固定 roster 和状态回写写成协议。优点是后续 Run 输出和 skill 都能执行同一规则。

## 推荐方案

采用方案 B。

## 实施步骤

1. 在 `SKILL.md` workflow 和 boundaries 中增加读取 `AGENTS.md`、复用/恢复已有角色、缺失才创建、不关闭固定角色、记录 integration summary。
2. 在 `agent-selection.md` 增加 Persistent Roster Rule，明确角色是长期 seat，不是一次性 agent。
3. 在 `report-protocol.md` 增加 Communication Rule 和 Status Write-Back Rule，要求接活、阻塞、解决、转交都要更新 report 和 queue。
4. 更新 `canvasight-run` 输出契约，明确 recommendedRoles 是固定 roster 调用建议，不是新建命令。
5. 更新 Run Markdown 文案和 README FAQ / Skill Split。
6. 插件版本提升到 `0.1.8`，避免 Codex cache 继续使用旧 skill。

## 风险与回滚

- 实际 subagent 能否跨线程复用取决于 Codex 运行环境；协议层要求已记录，无法恢复时必须在 integration summary 说明。
- 如新 wording 过宽导致误触发，可回滚或继续收窄 `canvasight-agent-team` frontmatter description。

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
- `plugins/canvasight/dist/`

## 验证方式

- `npm run typecheck`
- `npm run test:mcp`
- `npm run build`
- `python3 /Users/niallyoung/.codex/skills/.system/plugin-creator/scripts/validate_plugin.py /Users/niallyoung/Desktop/Canvasight/plugins/canvasight`
- `rg -n "persistent roster|fixed role|复用|恢复|状态|回写" ...`

## 后续风险

- 需要在未来真实 Canvasight Run 中观察 Codex 是否严格复用已有 role agent；如果工具层缺少恢复能力，应继续把缺口写入 integration summary。
