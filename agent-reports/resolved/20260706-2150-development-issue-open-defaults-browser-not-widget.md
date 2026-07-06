---
status: resolved
report_type: issue
owner: Development Agent
created_by: main-thread
priority: critical
created_at: 2026-07-06 21:50
updated_at: 2026-07-06 22:02
related_files:
  - plugins/canvasight/mcp/server.mjs
  - plugins/canvasight/src/App.tsx
  - plugins/canvasight/src/lib/canvasightApi.ts
  - plugins/canvasight/tests/mcp-smoke.mjs
  - plugins/canvasight/skills/canvasight-open/SKILL.md
  - plugins/canvasight/skills/canvasight-run/SKILL.md
  - plugins/canvasight/skills/canvasight-troubleshooting/references/troubleshooting.md
solution_report: agent-reports/resolved/20260706-2202-development-solution-open-defaults-widget.md
---

# Canvasight 默认打开入口仍落到浏览器 fallback 导致 Run 无法直发当前 thread

## TL;DR

用户通过当前“打开画布”流程进入的是普通 `127.0.0.1:5173` 页面，没有 Codex native widget host bridge；点击 Run 只能进入 daemon 队列，不能把 Markdown 作为 follow-up message 直接发送到当前 Codex thread。

## 发现者

main-thread

## 提交 Agent

main-thread

## 建议交接 Agent

Development Agent

## 问题描述

当前代码已经实现 `render_canvasight_canvas_widget`，但 `open_canvasight` 仍是浏览器 fallback。实际用户不会区分内部工具名，只会点击插件默认入口或让 Codex “打开画布”。因此用户看到的页面仍是裸 localhost 浏览器页，`canvasightApi.canSendFollowUpMessage()` 为 false，Run 走 `/api/sessions/:id/run` fallback 分支。

上一轮把 false sent 修成 queued，避免了丢 payload，但没有满足“点击 Run 后当前 Codex thread 里出现消息”的核心验收。

## 现象

- 点击节点 Run 后页面显示 `已进入 Run 队列，等待当前 Codex thread 接收`。
- 左侧当前 Codex thread 没有新增用户消息。
- 页面地址是 `http://127.0.0.1:5173/`，不是 Codex native widget iframe 内带 `canvasightHost=widget` 的页面。

## 复现方式

1. 从 Codex 当前插件入口打开 Canvasight。
2. 在普通 `127.0.0.1:5173` 页面里创建或选择有内容节点。
3. 点击节点 Run。
4. 观察 toast 进入队列，但当前 Codex thread 没有收到 follow-up message。

## 影响范围

影响 Canvasight 最核心的“网页画布输出给当前 Codex thread”流程。用户无法依赖当前默认入口完成 direct Run delivery，只能人工 await fallback，体验与产品目标冲突。

## 证据

- `plugins/canvasight/mcp/server.mjs` 中 `render_canvasight_canvas_widget` 带 `openai/outputTemplate`，但 `open_canvasight` 只返回 browser URL。
- `plugins/canvasight/src/lib/canvasightApi.ts` 中只有 URL 参数 `canvasightHost=widget` 且在 iframe 内时才允许 `sendFollowUpMessage()`。
- 用户截图显示 toast：`已进入 Run 队列，等待当前 Codex thread 接收`。

## 初步归因

默认工具/打开入口和产品目标不一致：native widget 是唯一可靠 direct delivery path，但默认用户路径仍是 browser fallback。此前 app-server `turn/start` accepted 被多次证明不是当前 Codex Desktop thread 可见送达证据，不能作为主路径。

## 交付给哪个 Agent

Development Agent

## 需要回答的问题

- `open_canvasight` 是否应默认返回 native widget `_meta["openai/outputTemplate"]`，并把浏览器 URL 降为显式 fallback 参数？
- `render_canvasight_canvas_widget` 是否保留为兼容别名？
- smoke test 是否能断言 `open_canvasight` 默认 `openTarget === "codex_native_widget"`，且 browser fallback 只能通过显式参数触发？
- 文档和 skill 是否都要改成“open_canvasight 默认 widget”？

## 相关文件

- plugins/canvasight/mcp/server.mjs
- plugins/canvasight/tests/mcp-smoke.mjs
- plugins/canvasight/skills/canvasight-open/SKILL.md
- plugins/canvasight/skills/canvasight-open/references/open-workflow.md
- plugins/canvasight/skills/canvasight-troubleshooting/references/troubleshooting.md
- README.md
- AGENTS.md

## 期望结果

正常插件入口和 `open_canvasight` 默认渲染 Codex native widget，Run 通过 widget host bridge 发送 follow-up message 到当前 Codex thread。浏览器 URL 仅作为显式 fallback 或开发调试路径，UI/文档不得把 fallback 队列描述成 direct sent。

## Closure Criteria

- [x] 问题原因明确
- [x] 方案报告已回写
- [x] 修改文件已记录
- [x] 验证方式已记录
- [x] 后续风险已记录

## 当前状态

resolved

## 处理结果

已修复：`open_canvasight` 默认改为 native widget 输出，浏览器 fallback 改为显式 `open_canvasight_browser_fallback`。

## 修改文件

- plugins/canvasight/mcp/server.mjs
- plugins/canvasight/tests/mcp-smoke.mjs
- plugins/canvasight/package.json
- plugins/canvasight/package-lock.json
- plugins/canvasight/.codex-plugin/plugin.json
- plugins/canvasight/skills/canvasight-open/SKILL.md
- plugins/canvasight/skills/canvasight-open/references/open-workflow.md
- plugins/canvasight/skills/canvasight-troubleshooting/SKILL.md
- plugins/canvasight/skills/canvasight-troubleshooting/references/troubleshooting.md
- plugins/canvasight/skills/canvasight-graph-writer/references/graph-writing.md
- plugins/canvasight/skills/canvasight/SKILL.md
- README.md
- AGENTS.md
- agent-reports/QUEUE.md

## 验证方式

- `npm run typecheck`
- `npm run test:mcp`
- `npm run build`
- `python3 /Users/niallyoung/.codex/skills/.system/plugin-creator/scripts/validate_plugin.py /Users/niallyoung/Desktop/Canvasight/plugins/canvasight`
- `codex plugin add canvasight@canvasight-local`
- `codex plugin list`

## 后续风险

如果当前 Codex thread 仍使用旧插件 cache，新的 tool descriptor 和 widget resource 需要 reload 或新 thread 才能生效。已经打开的 `127.0.0.1:5173` 裸网页仍是 browser/dev fallback，不会因为刷新获得 native widget host bridge。
