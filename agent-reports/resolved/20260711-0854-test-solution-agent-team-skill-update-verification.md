---
status: resolved
report_type: solution
owner: Test Supervisor Agent
created_by: Test Supervisor Agent
priority: medium
created_at: 2026-07-11 08:54
updated_at: 2026-07-11 09:05
related_issue: null
related_files:
  - plugins/canvasight/skills/canvasight-agent-team/SKILL.md
  - plugins/canvasight/.codex-plugin/plugin.json
  - plugins/canvasight/package.json
  - plugins/canvasight/package-lock.json
---

# Agent Team Skill 更新验证计划

## 负责 Agent

Test Supervisor Agent

## 对应问题

用户要求将已在独立仓库更新的 `Niall-Young/Codex-agent-team-skill` 同步到 Canvasight 插件内的 Agent Team Skill。

## Root Cause

插件内 `plugins/canvasight/skills/canvasight-agent-team/SKILL.md` 仍是本地已安装版本的说明；外部仓库的更新尚未同步、审阅和验证。

## 调研过程

- 已读取项目 `AGENTS.md`、Canvasight Agent Team Skill 和现有 Agent Report 协议。
- 工作区在同步前干净；插件当前版本为 `0.3.8+codex.20260711005032`。
- 可用校验命令：`npm run typecheck`、`npm run build`、`npm run test:markdown`、`npm run test:mcp`、`npm run test:widget-runtime`，以及根目录插件校验脚本。
- 本轮是 Skill 内容同步，不应在实现前运行耗时运行时测试，也不应将浏览器 fallback 当作原生 widget 验收。

## 推荐方案

同步完成后按变更范围分层验证：先检查 Skill 的 YAML frontmatter、引用路径和协议约束；再执行插件结构校验。只有同步涉及 MCP、运行时、前端或安装版本文件时，才追加对应的 typecheck/build/smoke 与重装验证。

## 实施步骤

1. 对比外部仓库与 `plugins/canvasight/skills/canvasight-agent-team/SKILL.md`，确认更新只覆盖 Agent Team 触发条件、角色/报告协议或引用内容。
2. 静态检查 frontmatter：保留 `name: canvasight-agent-team`，描述覆盖显式 Agent Team/报告协议触发，且不误将普通 Canvasight 打开或常规代码改动纳入触发范围。
3. 确认 Skill 中引用的 `references/agent-selection.md` 和 `references/report-protocol.md` 均存在且可读；逐项核对其与项目 `AGENTS.md` 的固定角色、QUEUE 和报告模板规则不冲突。
4. 从仓库根目录运行：`python3 /Users/niallyoung/.codex/skills/.system/plugin-creator/scripts/validate_plugin.py /Users/niallyoung/Desktop/Canvasight/plugins/canvasight`。
5. 若仅改动 Skill 文档且第 2–4 步通过，不需要 TypeScript、Vite 或 MCP 运行时测试；如同步同时改动 `mcp/server.mjs`、应用源码或版本文件，则运行 `npm run typecheck && npm run build && npm run test:mcp && npm run test:widget-runtime`（目录为 `plugins/canvasight`），并按受影响功能补跑 `test:markdown` 或 `test:dev-server`。
6. 若版本更新或插件安装产物变化，安装准确版本、重启/重载 Codex Desktop，并在新建且绑定的 task 中确认 Skill 可见。若改动原生 widget/MCP，额外执行 `AGENTS.md` 的五项真实原生宿主验收；无法获得该宿主证据时明确标记为 `unverified`。

## 风险与回滚

- 仅在源码副本校验通过不代表当前 Codex 进程已加载新 Skill；版本或安装变化后必须新 task/reload 验证。
- 外部 Skill 若扩大触发面，可能抢占普通 Canvasight 工作流；静态触发边界审阅是本次必要门槛。
- 回滚方式为恢复该 Skill 到同步前版本；不应回退无关的 Canvasight runtime 变更。

## 处理结果

已完成外部 Agent Team Skill、schema 与 ROSTER runtime bootstrap 的聚焦审查。插件结构校验、TypeScript 校验和新增 ROSTER 合同静态断言通过；完整 MCP smoke 尚不能通过，原因是测试入口的既有 `diagnostics.nativeWidget` 源码断言已与先前移除的 Diagnostics UI 不一致，并在本次新增 ROSTER smoke 断言执行前终止。

## 修改文件

- `agent-reports/resolved/20260711-0854-test-solution-agent-team-skill-update-verification.md`
- `agent-reports/QUEUE.md`

## 验证方式

- 已完成：版本一致性检查通过：`package.json`、`package-lock.json`、`.codex-plugin/plugin.json` 与 `mcp/server.mjs` 均为 `0.3.9+codex.20260711093000`。
- 已完成：插件结构校验通过：`python3 /Users/niallyoung/.codex/skills/.system/plugin-creator/scripts/validate_plugin.py /Users/niallyoung/Desktop/Canvasight/plugins/canvasight`。
- 已完成：`npm run typecheck` 通过。
- 已完成：静态 ROSTER 合同断言通过：运行时包含 `blocked` 状态、`ROSTER.md`/schema 元数据、`ensureAgentTeamRoster`，且 `enqueueRun` 与 `prepareWidgetRun` 均回写 `structuredContent.agentTeam.roster`；MCP smoke 包含 ROSTER 创建断言。
- 未通过：`npm run test:mcp` 在加载阶段失败，位置为 `tests/mcp-smoke.mjs:68` 的 `assertOpenFlowSkillContract`。该断言仍要求 `src/App.tsx` 包含 `diagnostics.nativeWidget`，但该 Diagnostics 表面已在本次 Skill/ROSTER 改动前的工作区状态中移除；失败发生在新增 ROSTER runtime smoke 断言之前，故不能将完整 MCP smoke 标记为通过。
- 未通过（迁移限制）：`node skills/canvasight-agent-team/scripts/validate-agent-team.mjs --root /Users/niallyoung/Desktop/Canvasight` 报 `ROSTER.md is required`。新 validator 适用于已采用新版协议的目标项目；Canvasight 仓库自身尚未迁移并生成根 `ROSTER.md`，且其历史 report/QUEUE 格式也未满足新版 schema。

## 后续风险

完整 MCP smoke 的首次失败是与已移除 Diagnostics UI 不一致的前置断言，不能归因为 ROSTER bootstrap。修复或更新该独立断言后，必须重新运行 `npm run test:mcp`，以使新增 ROSTER 创建/复用断言实际执行。另需决定是否把 Canvasight 仓库本身迁移为新版 schema 管理项目（创建/维护根 `ROSTER.md` 并迁移活跃报告和 QUEUE）；在此之前，项目根 validator 预期失败。版本已变化，最终交付仍需准确版本安装、Codex Desktop 重载/新 task 的 Skill 可见性验证；本次不涉及原生 widget 功能变更，且没有执行原生宿主验收。
