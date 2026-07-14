---
schema_version: 1
report_id: issue-inline-framework-questions
report_type: issue
status: blocked
owner: Test Supervisor Agent
created_by: Main Thread
priority: high
version: 3
agent_id: /root/test_supervisor_agent
thread_id: null
created_at: 2026-07-14T05:38:01Z
updated_at: 2026-07-14T05:56:32Z
depends_on: []
related_files:
  - plugins/canvasight/mcp/server.source.mjs
  - plugins/canvasight/src/App.tsx
  - plugins/canvasight/src/lib/widgetBridge.ts
  - plugins/canvasight/skills/canvasight-graph-writer/SKILL.md
verification_status: failed
verification_evidence:
  - Automated build, MCP, Chrome widget, distribution, Skill, and concurrency verification passed.
  - Native Codex Desktop restart plus new-task inline and fullscreen acceptance is still missing, so the mandatory host gate is not satisfied.
solution_report: agent-reports/resolved/solution-inline-framework-questions.md
---

# 消息内框架确认组件

## TL;DR

Canvasight Graph Writer 缺少一个直接嵌入 Codex 消息流的结构化确认组件，关键歧义目前只能依赖普通文字询问或被模型猜测。

## 发现者

Main Thread

## 提交 Agent

Main Thread

## 建议交接 Agent

Development Agent

## 问题描述

Graph Writer 在目标、范围、框架维度或关键关系存在会改变最终图结构的歧义时，需要暂停写图，并用 Canvasight 自有 inline MCP UI 一次收集一至三个问题。每题提供二至三个预设选项和自定义输入，AI 可选择单选或多选；提交后通过同一 Codex 任务的原生消息 bridge 自动继续。

## 现象

- 当前插件只注册主 Canvasight fullscreen Widget resource。
- Graph Writer Skill 仅要求在冲突或缺失证据时“ask the user”，没有稳定的结构化提问工具。
- 现有 bridge 已支持 `ui/message` 和 `window.openai.sendFollowUpMessage`，但只服务主画布 Run。

## 复现方式

1. 请求 Canvasight 梳理一个存在两个以上关键产品方向的框架。
2. Graph Writer 无法在消息中渲染 Canvasight 风格的选择卡片。
3. 用户必须阅读普通文字并手动组织回复，或模型自行选择方向。

## 影响范围

MCP tool/resource 注册、Widget bridge、React 根入口、Graph Writer Skill、设计基线、双语 README、版本产物与宿主验收。

## 证据

- 当前资源列表只有 `ui://widget/canvasight/canvas.html`。
- `write_canvasight_graph` 前没有结构化关键歧义确认步骤。
- 现有 bridge 已具备同任务消息回传能力，可复用但必须保持 inline/fullscreen 路径隔离。

## 初步归因

插件早期仅实现了全屏画布 App，没有为 Graph Writer 的对话内决策收集建立独立 MCP UI surface 和工具契约。

## 交付给哪个 Agent

Development Agent

## 需要回答的问题

- 如何让第二 resource 复用真实 `app.css` 与 React bundle，但绝不启动 daemon 或请求 fullscreen？
- 如何让单选、多选、自定义输入和消息回传保持类型化、可访问且可测试？
- 如何确保确认后的新回合重新读取 graph context，而不是复用过期 revision？

## 相关文件

- `plugins/canvasight/mcp/server.source.mjs`
- `plugins/canvasight/src/App.tsx`
- `plugins/canvasight/src/lib/widgetBridge.ts`
- `plugins/canvasight/skills/canvasight-graph-writer/SKILL.md`

## 期望结果

关键歧义会在当前 Codex 消息中显示 Canvasight 风格 inline 卡片；提交后同一任务收到可审计答案并自动继续，主 fullscreen Canvasight 行为保持不变。

## Closure Criteria

- [ ] 新 tool/resource 和 schema 已实现
- [ ] inline 组件不启动 daemon、不请求 fullscreen
- [ ] 单选、多选、自定义输入与 bridge 回传已验证
- [ ] Graph Writer 触发、去重和降级规则已验证
- [ ] 文档、版本、生成产物与 Agent Team 报告已同步
- [ ] 原生宿主缺失证据已如实记录

## 当前状态

blocked：等待用户重启 Codex Desktop 后在加载 0.4.17 的新任务执行真实宿主验收。

## 处理结果

实现、发行构建和自动化回归已完成；真实 Codex native-host 验收尚未完成。

## 修改文件

- 见 `agent-reports/resolved/solution-inline-framework-questions.md`。

## 验证方式

- 自动化矩阵全部通过。
- 重启 Codex Desktop 后在新任务调用 `ask_canvasight_framework_questions`，确认消息内渲染、同任务续跑及 fullscreen open/Run 回归。

## 后续风险

当前任务仍持有旧插件工具快照，无法提供真实 0.4.17 inline resource 的宿主证据。不得据自动化结果宣称 native 消息组件已验收。
