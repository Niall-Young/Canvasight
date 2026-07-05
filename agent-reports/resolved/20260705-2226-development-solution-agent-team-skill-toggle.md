---
status: resolved
report_type: solution
owner: development-agent
created_by: main-thread
priority: high
created_at: 2026-07-05 22:26
updated_at: 2026-07-05 22:26
related_issue: agent-reports/resolved/20260705-2211-product-issue-agent-team-skill-toggle.md
related_files:
  - plugins/canvasight/shared/types.ts
  - plugins/canvasight/src/lib/markdown.ts
  - plugins/canvasight/src/lib/canvasightApi.ts
  - plugins/canvasight/src/App.tsx
  - plugins/canvasight/src/components/SettingsDialog.tsx
  - plugins/canvasight/src/lib/translations.ts
  - plugins/canvasight/mcp/server.mjs
  - plugins/canvasight/skills/canvasight-agent-team/SKILL.md
  - plugins/canvasight/skills/canvasight-agent-team/references/agent-selection.md
  - plugins/canvasight/skills/canvasight-agent-team/references/report-protocol.md
  - plugins/canvasight/skills/canvasight-run/SKILL.md
  - plugins/canvasight/skills/canvasight-run/references/run-output-contract.md
  - plugins/canvasight/skills/canvasight/SKILL.md
  - plugins/canvasight/tests/mcp-smoke.mjs
  - README.md
  - design.md
---

# Agent Team skill 与设置开关解决方案

## 负责 Agent

Development Agent checklist，由主线程集成执行；Skill Expert、Product Agent、Test Supervisor Agent、Customer Support Agent 和 Project Management Agent 提供审查结论。

## 对应问题

`agent-reports/resolved/20260705-2211-product-issue-agent-team-skill-toggle.md`

## Root Cause

Canvasight 之前只有画布 Run 的 Markdown / structuredContent 输出，没有把 Agent Team 和 `agent-reports/` 文件系统协作协议作为可配置的 Run 输出能力，也没有独立 skill 指导 Codex 按需选择角色和写报告。

## 调研过程

- 读取用户提供的 wolai 文章，确认核心思想是通过 `AGENTS.md` 定义角色、用 `agent-reports/` 作为交接层，并通过状态、frontmatter、issue / solution / integration summary 模板形成闭环。
- 让 Product Agent 收束产品边界：默认开启，但按任务复杂度创建必要角色，不全量启动。
- 让 Skill Expert 审查触发边界：保留用户语义中的 Agent Team 命名，同时收窄 description，避免接管普通 Canvasight open/run/graph/troubleshooting。
- 让 Test Supervisor 给出验证矩阵：设置默认值、Run payload、MCP smoke、skill 校验和浏览器可见检查。
- 让 Customer Support Agent 确认 README 必须同步中英文说明。

## 可选方案

- 方案 A：只在 README / AGENTS.md 里记录 Agent Team 协议，不改变 Run 输出。缺点是用户在 Canvasight Run 时无法明确控制是否启用。
- 方案 B：新增可配置 setting、Run Markdown section、structuredContent.agentTeam 和专用 skill。优点是 UI 可控、Codex 可结构化识别、后续可演进。
- 方案 C：每次 Run 都强制启动全部角色。缺点是过度角色化，和用户“按需创建”要求冲突。

## 推荐方案

采用方案 B。设置默认开启，关闭时 Markdown 不注入 Agent Team 协议；structuredContent 保留 `agentTeam.enabled: false`，让 MCP 消费端稳定区分关闭状态和旧 payload。

## 实施步骤

1. 在共享类型中加入 `agentTeamEnabled` 设置、Agent Team role id、role recommendation 和 Run config 类型。
2. Settings Dialog 新增“开启 Agent Team”开关，默认开启并随 app settings 持久化。
3. Run Markdown 根据设置生成 Agent Team section，使用节点内容关键词推荐必要角色。
4. Browser run payload 和 MCP `await_canvasight_run` 返回 `agentTeam` 结构化字段。
5. 新增 `canvasight-agent-team` skill，并拆出 `agent-selection.md` 与 `report-protocol.md`。
6. 更新 `canvasight-run` 输出契约、README、design.md 和 MCP smoke test。
7. 构建并提交 dist，确保 daemon 托管的网页与源码同步。

## 风险与回滚

- 角色推荐是启发式，可能漏选边缘角色；回滚方式是关闭设置或移除 Markdown section。
- 如果新 skill 误触发，优先收窄 `SKILL.md` frontmatter description。
- 如果 structured payload 影响外部消费端，可回滚到只返回 `enabled` 和空角色列表。

## 处理结果

已修复。

## 修改文件

- `plugins/canvasight/shared/types.ts`
- `plugins/canvasight/src/lib/markdown.ts`
- `plugins/canvasight/src/lib/canvasightApi.ts`
- `plugins/canvasight/src/App.tsx`
- `plugins/canvasight/src/components/SettingsDialog.tsx`
- `plugins/canvasight/src/lib/translations.ts`
- `plugins/canvasight/mcp/server.mjs`
- `plugins/canvasight/skills/canvasight-agent-team/SKILL.md`
- `plugins/canvasight/skills/canvasight-agent-team/references/agent-selection.md`
- `plugins/canvasight/skills/canvasight-agent-team/references/report-protocol.md`
- `plugins/canvasight/skills/canvasight-run/SKILL.md`
- `plugins/canvasight/skills/canvasight-run/references/run-output-contract.md`
- `plugins/canvasight/skills/canvasight/SKILL.md`
- `plugins/canvasight/tests/mcp-smoke.mjs`
- `README.md`
- `design.md`
- `plugins/canvasight/dist/`

## 验证方式

- `npm run typecheck`
- `npm run test:mcp`
- `npm run build`
- `npm run test:dev-server`
- `python3 /Users/niallyoung/.codex/skills/.system/plugin-creator/scripts/validate_plugin.py /Users/niallyoung/Desktop/Canvasight/plugins/canvasight`
- 内置浏览器打开 `http://127.0.0.1:5173/`，验证设置弹窗存在“开启 Agent Team”，默认开启；关闭保存后重开保持关闭；恢复开启后重开保持开启。

## 后续风险

- 需要后续根据真实需求样本继续打磨角色关键词分类。
- 当前上下文只可复用 5 个子智能体；缺位的 Design / Development / Standards 职责由主线程按清单处理并在 integration summary 记录。
