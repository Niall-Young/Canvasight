---
status: resolved
report_type: solution
owner: Customer Support Agent
created_by: Customer Support Agent
priority: low
created_at: 2026-07-11 08:30
updated_at: 2026-07-11 08:30
related_issue:
related_files:
  - README.md
  - design.md
  - plugins/canvasight/package.json
  - plugins/canvasight/mcp/server.mjs
  - plugins/canvasight/skills/canvasight/SKILL.md
  - plugins/canvasight/skills/canvasight-agent-team/SKILL.md
  - plugins/canvasight/skills/canvasight-graph-writer/SKILL.md
  - plugins/canvasight/skills/canvasight-open/SKILL.md
  - plugins/canvasight/skills/canvasight-run/SKILL.md
  - plugins/canvasight/skills/canvasight-troubleshooting/SKILL.md
---

# 移除 Codex 当前模型设置的文档核对

## 负责 Agent

Customer Support Agent

## 对应问题

用户说明“Codex 当前模型”设置仅为原先 Plan / Goal 流程而设，现已不再需要。

## Root Cause

该控件属于已退役的 Plan / Goal 运行模式遗留 UI。当前产品和 README 的节点 Run 已统一为 Chat-only。

## 调研过程

- 完整核对 `AGENTS.md`、`design.md`、插件包配置、MCP 服务和全部 Canvasight skills。
- `plugins/canvasight/mcp/server.mjs` 已将旧的持久化或传入 mode 归一化为 `chat`；当前服务端仍从任务恢复结果读取模型，仅用于内部 `thread/settings/update` 请求，并非用户配置。
- `README.md` 的中英文功能、使用方式、MCP Tools、FAQ 均未暴露“Codex 当前模型”设置，且已表述节点 Run 始终通过 Chat 投递。

## 可选方案

- 方案 A：在 README 新增已移除设置的说明。
- 方案 B：不改 README，保持文档只覆盖可用的用户功能。

## 推荐方案

采用方案 B。没有用户可见的 README 条目需要删除或替换；新增历史说明会制造噪音并使文档偏离当前产品。

## 实施步骤

1. 确认 Chat-only 用户契约与运行时归一化行为。
2. 确认双语 README 不含模型设置、Plan 或 Goal 的已废弃使用引导。
3. 不修改 README；记录本次文档无需变更的结论。

## 风险与回滚

无 README 内容变更。若后续重新暴露模型选择器，应在同一交付中补充中英文用户说明。

## 处理结果

不处理文档内容：README 已符合移除后的用户可见行为。

## 修改文件

- `agent-reports/resolved/20260711-0830-customer-support-solution-remove-current-model-setting-docs.md`
- `agent-reports/QUEUE.md`

## 验证方式

- 对中英文 README 运行关键词检索，未发现用户可见的当前模型设置说明。
- 对服务端模式归一化及 Chat 设置路径完成针对性代码检查。

## 后续风险

Design Standards Expert 已在同一交付中更新 `design.md` 为 Chat-only Run 与无当前模型字段的设置契约。若后续重新暴露模型选择器，应在同一交付中补充中英文用户说明。
