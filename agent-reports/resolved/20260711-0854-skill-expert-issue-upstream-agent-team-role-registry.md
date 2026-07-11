---
status: resolved
report_type: issue
owner: Skill Expert Agent
created_by: Skill Expert Agent
priority: high
created_at: 2026-07-11 08:54
updated_at: 2026-07-11 09:05
related_files:
  - plugins/canvasight/skills/canvasight-agent-team/SKILL.md
  - plugins/canvasight/skills/canvasight-agent-team/references/agent-selection.md
  - plugins/canvasight/skills/canvasight-agent-team/references/report-protocol.md
  - plugins/canvasight/src/App.tsx
  - plugins/canvasight/src/lib/markdown.ts
  - plugins/canvasight/shared/types.ts
  - plugins/canvasight/mcp/server.mjs
  - plugins/canvasight/tests/mcp-smoke.mjs
solution_report: agent-reports/resolved/20260711-0905-skill-expert-solution-agent-team-role-registry-sync.md
---

# 对齐上游 Agent Team role-registry 协议

## TL;DR

上游 `Codex-agent-team-skill` 已升级为 `codex-agent-team-skill`，并以 `ROSTER.md`、严格 schema、单 owner 和版本化报告写回为核心；本插件仍实现旧的 `canvasight-agent-team` 与自由格式队列协议，必须作为一次兼容迁移完成。

## 发现者

Skill Expert Agent

## 提交 Agent

Skill Expert Agent

## 建议交接 Agent

Skill Expert Agent（skill 内容与触发）、Development Agent（Run 合同和生成逻辑）、Development Standards Lead（AGENTS.md 与 report 模板）、Test Supervisor Agent（迁移验证）。

## 问题描述

已比对上游 `Niall-Young/Codex-agent-team-skill` 的 `186f59ccaf80ae377ef03e3a0d812d870aaf80a8`。上游把 skill 名称改为 `codex-agent-team-skill`，新增 authoritative schema、`ROSTER.md` 角色席位登记、报告版本号及乐观并发、派生队列表与独立校验器。本插件目前没有这些资源，且运行时把旧 skill 名、旧 bootstrap 片段与旧队列约定硬编码在前端、共享类型、MCP server 和 smoke tests 中。

## 现象

- 直接替换 `SKILL.md` 后，Canvasight Run 仍会输出 `canvasight-agent-team`，无法触发新名称。
- 新 skill 要求 `ROSTER.md` 和 schema 格式；仓库没有 `ROSTER.md`，现存 `agent-reports/` 报告和 `QUEUE.md` 均不符合 schema。
- 直接运行上游 validator 会在缺失 `ROSTER.md` 时失败；即使补齐 roster，历史报告的 frontmatter、文件名和队列格式仍需显式迁移或兼容策略。

## 复现方式

1. 克隆 `https://github.com/Niall-Young/Codex-agent-team-skill` 于提交 `186f59ccaf80ae377ef03e3a0d812d870aaf80a8`。
2. 比较其 `SKILL.md` 与 `plugins/canvasight/skills/canvasight-agent-team/SKILL.md`。
3. 搜索插件源：`rg -n -S 'canvasight-agent-team|agent-reports/QUEUE|Agent Team' plugins/canvasight`。
4. 以本仓库为根运行上游 `node scripts/validate-agent-team.mjs --root /Users/niallyoung/Desktop/Canvasight`，会因缺失 `ROSTER.md` 失败。

## 影响范围

- 任何启用 Agent Team 的 Canvasight Run。
- 持久角色恢复、报告归属、跨线程重建及队列一致性。
- 现有 `AGENTS.md`、模板和大量历史 reports 的兼容/迁移策略。

## 证据

- 上游提交：`186f59ccaf80ae377ef03e3a0d812d870aaf80a8`（2026-07-10 10:57:37 +08:00）。
- 上游新增：`references/agent-team-schema.json`、`scripts/validate-agent-team.mjs`、`tests/validate-agent-team.test.mjs`、`references/examples/ROSTER.md`、schema 化队列示例。
- 本地运行时代码仍在 `src/App.tsx`、`src/lib/markdown.ts`、`shared/types.ts`、`mcp/server.mjs`、`tests/mcp-smoke.mjs` 使用 `canvasight-agent-team`。

## 初步归因

上游 skill 从 Canvasight 内嵌的宽松报告协议独立为可复用的 Codex Agent Team skill，协议表面和运行时合同均发生破坏性升级；本插件尚未消费这套新合同。

## 交付给哪个 Agent

Skill Expert Agent 先定义安装/兼容命名策略；Development Agent 与 Development Standards Lead 完成运行时、AGENTS.md、ROSTER 和报告迁移；Test Supervisor Agent 验证。

## 需要回答的问题

- 是否将现有 `canvasight-agent-team` 原地升级为新协议，保留旧 skill 名作为 Canvasight 运行时兼容名，还是同时把运行时改名为 `codex-agent-team-skill`？推荐后者，并在同一交付同步所有引用。
- 历史 reports 是全量迁移到 schema，还是在 validator 中只校验新协议创建后的文件？推荐新增兼容边界：迁移 active reports、把旧历史视为 legacy/archive，不在新 validator 的扫描范围内。

## 相关文件

- 需要替换：`plugins/canvasight/skills/canvasight-agent-team/SKILL.md`、`references/agent-selection.md`、`references/report-protocol.md`。
- 需要新增：`references/agent-team-schema.json`、`scripts/validate-agent-team.mjs`、`tests/validate-agent-team.test.mjs`、项目 `ROSTER.md`。
- 需要同步：`plugins/canvasight/src/App.tsx`、`src/lib/markdown.ts`、`shared/types.ts`、`mcp/server.mjs`、`tests/mcp-smoke.mjs`、`skills/canvasight-run/*`、`skills/canvasight/SKILL.md`、`AGENTS.md`、`agent-reports/_templates/*`、`agent-reports/QUEUE.md`。

## 期望结果

Canvasight Agent Team 的触发、Run payload、默认 project bootstrap、角色恢复、报告写回和验证工具都使用同一份上游 schema；现存活跃问题在迁移后保持单一 owner 与可追溯状态。

## Closure Criteria

- [x] 上游 skill 文件和新增 schema/validator 已纳入插件，并保留 Canvasight 专有兼容边界。
- [x] `canvasight-agent-team` 的旧引用已明确保留为 Canvasight compatibility name。
- [x] MCP Run/AGENTS.md bootstrap 与 skill 合同一致。
- [x] 解决方案报告和队列均已回写。
- [ ] 上游完整 validator/test suite 未逐字复制；已作为后续风险记录。

## 当前状态

resolved；Skill、Run contract、schema paths 和 Canvasight compatibility name 已同步审查通过。

## 处理结果

本轮已完成上游 role-registry 协议的 Canvasight 集成审查；完整上游 validator/test parity 不在已交付范围内。

## 修改文件

- `agent-reports/resolved/20260711-0854-skill-expert-issue-upstream-agent-team-role-registry.md`
- `agent-reports/resolved/20260711-0905-skill-expert-solution-agent-team-role-registry-sync.md`
- `agent-reports/QUEUE.md`

## 验证方式

- `node --check plugins/canvasight/skills/canvasight-agent-team/scripts/validate-agent-team.mjs`。
- 上游 reference fixture 测试 4/4 通过。
- 对插件源执行 compatibility name、schema 与 ROSTER 引用扫描。

## 后续风险

- 本地 validator 未逐字复制上游实现，也未携带 upstream fixture tests；不得将本轮验证描述为完整上游 parity。
- 若未来将 validator 作为严格发布门禁，需补齐上游完整实现/tests 或补充等价覆盖。
