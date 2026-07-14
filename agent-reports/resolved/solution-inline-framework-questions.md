---
schema_version: 1
report_id: solution-inline-framework-questions
report_type: solution
status: resolved
owner: Development Agent
created_by: Development Agent
priority: high
version: 1
agent_id: /root/development_agent
thread_id: null
created_at: 2026-07-14T05:56:32Z
updated_at: 2026-07-14T05:56:32Z
depends_on:
  - issue-inline-framework-questions
related_files:
  - plugins/canvasight/mcp/server.source.mjs
  - plugins/canvasight/src/components/FrameworkQuestionsCard.tsx
  - plugins/canvasight/src/lib/frameworkQuestions.ts
  - plugins/canvasight/src/lib/widgetBridge.ts
  - plugins/canvasight/tests/widget-runtime-smoke.mjs
verification_status: passed
verification_evidence:
  - Build, MCP smoke, 16-tool clean distribution, Skill smoke, and concurrency smoke passed at version 0.4.17.
  - Real Chrome composed-widget smoke passed inline selection, custom input, retry, duplicate protection, answer-summary restoration, theme, autoResize, and no-fullscreen assertions.
  - Existing fullscreen ready, canvas-control, and node Run paths passed the same composed-widget regression.
---

# Canvasight 消息内框架确认组件实现

## 负责 Agent

Development Agent；Design Agent、Test Supervisor Agent 与 Main Thread 完成设计、测试和集成审查。

## 对应问题

`agent-reports/assigned/issue-inline-framework-questions.md`

## Root Cause

插件只有 fullscreen 画布 resource，Graph Writer 没有一条独立、无 daemon、可在当前 Codex 消息中收集关键决策的 MCP UI 路径。

## 推荐方案

注册独立 `ask_canvasight_framework_questions` 工具和 `ui://widget/canvasight/framework-questions.html` resource。复用同一 React 发行 bundle、设计 token 和 `app.css`，但在启动时按 resource mode 分流，使 inline 组件不进入 Canvasight workspace Session、daemon、OpenAttempt 或 fullscreen 流程。

## 处理结果

- 工具输出版本化问题定义并明确暂停写图。
- 卡片支持一至三题、单选、多选、推荐项、自定义答案、必填校验和键盘操作。
- 成功通过 `ui/message` 或兼容 follow-up bridge 发送当前任务中的可见用户消息，随后锁定并显示答案摘要。
- 失败时保留选择并允许重试；`confirmationId` 与 sessionStorage 防止同组件重复发送，不写入 `.scatter`。
- Graph Writer 在关键歧义时才询问，旧任务降级为普通文本，并在答案回合重新读取 graph context。

## 修改文件

- MCP source/bundle、React inline 入口、bridge、组件、共享 CSS 和发行 `dist`。
- Graph Writer Skill、`design.md`、`AGENTS.md`、双语 `README.md`。
- MCP、widget runtime、distribution、Skill 测试。

## 验证方式

- `npm run build`
- `npm run test:mcp`
- `npm run test:widget-runtime`
- `npm run test:plugin-distribution`
- `npm run test:skills`
- `npm run test:concurrency`
- `npm run release:verify -- 0.4.17`
- plugin validator 与 graph-writer Skill quick validator

## 后续风险

真实 Codex Desktop 必须重启后在新任务加载 0.4.17；当前任务仍使用旧工具注册快照，因此真实消息流嵌入、同任务续跑和真实 fullscreen 回归尚不能由本轮自动化替代。
