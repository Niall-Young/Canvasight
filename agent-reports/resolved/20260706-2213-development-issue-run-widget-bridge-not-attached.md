---
status: resolved
report_type: issue
owner: development-agent
created_by: main-thread
priority: critical
created_at: 2026-07-06 22:13
updated_at: 2026-07-07 10:31
related_files:
  - plugins/canvasight/src/lib/canvasightApi.ts
  - plugins/canvasight/src/App.tsx
  - plugins/canvasight/src/lib/translations.ts
  - plugins/canvasight/mcp/server.mjs
solution_report: agent-reports/resolved/20260707-1031-development-solution-run-delivery-confirmation.md
---

# Canvasight Run 无法发送到当前 Codex thread

## TL;DR

Canvasight 当前页面没有进入 Codex native widget bridge 环境，而是在普通 localhost 浏览器页里运行；普通网页没有直接向当前 Codex thread 追加用户消息的 host bridge，因此点击 Run 只能进入 daemon 队列，等待 `await_canvasight_run` 取回。

## 发现者

main-thread

## 提交 Agent

main-thread

## 建议交接 Agent

development-agent

## 问题描述

用户在 Codex 内置浏览器中打开 Canvasight 页面后，点击节点 Run 按钮，页面显示“已进入 Run 队列，等待当前 Codex thread 接收”，但当前 Codex thread 的输入框没有出现内容，也没有开始新的 Codex turn。

用户期望是：点击 Canvasight 节点 Run 后，节点生成的 Markdown 内容应直接发送到用户当前所在的 Codex thread，而不是仅进入 Canvasight 内部队列。

当前实现设计了 direct widget delivery，但实际运行环境没有满足该路径的前置条件。

## 现象

- 页面 toast 显示：`已进入 Run 队列，等待当前 Codex thread 接收`。
- 当前 Codex thread 没有收到节点生成的 Markdown。
- Codex 输入框没有被填入内容。
- 没有自动开始新的 Codex turn。
- 用户多次在新 thread、当前 thread、Codex 内置浏览器中测试，表现一致。

## 复现方式

1. 在 Codex 中调用或打开 Canvasight。
2. 页面显示为普通 URL，例如 `http://127.0.0.1:5173/` 或 `http://127.0.0.1:<port>/?sessionId=...`。
3. 在节点中输入内容，例如 `创建 agents.md 和 design.md 文档`。
4. 点击节点右上角 Run 按钮。
5. 页面显示 `已进入 Run 队列，等待当前 Codex thread 接收`。
6. 查看当前 Codex thread，未出现由 Canvasight 发送的新用户消息。

## 影响范围

- Canvasight Run 到当前 Codex thread 的核心链路不可用。
- Plan / Goal / Chat 模式即使在节点里选择，也无法可靠触发当前 thread 的真实执行。
- 用户无法把画布作为当前 Codex 对话的直接输入器使用。
- 浏览器 fallback 队列路径只能作为手动或工具回收机制，不能满足产品目标。

## 当前实现路径

Canvasight 现在存在三条 Run 投递路径。

### 1. Native widget bridge 路径

这是目标路径。

流程：

1. `open_canvasight` 返回 MCP widget resource。
2. Tool metadata 声明 `openai/outputTemplate: ui://widget/canvasight/canvas.html`。
3. Codex Desktop 理论上应渲染 native widget。
4. Widget shell 内部 iframe 打开本地 Canvasight 页面。
5. Widget shell 给 iframe URL 追加 `canvasightHost=widget`。
6. 前端检测到自己处于 iframe 且 URL 包含 `canvasightHost=widget`。
7. 点击 Run 后，前端先调用 `prepareWidgetRun`。
8. 前端通过 `window.parent.postMessage` 请求 widget shell。
9. Widget shell 调用 `mcpApp.sendMessage({ role: "user", content })`。
10. Codex host 应把内容作为当前 thread 的用户消息发送。

相关证据：

- `plugins/canvasight/mcp/server.mjs:3430` 定义 `widgetToolMeta`，返回 `openai/outputTemplate`。
- `plugins/canvasight/mcp/server.mjs:3470` 中 `toolOpenCanvasight` 直接返回 `toolRenderCanvasightCanvasWidget(args)`。
- `plugins/canvasight/mcp/server.mjs:3742` 中 `open_canvasight` 的 description 声明默认 native widget。
- `plugins/canvasight/mcp/server.mjs:2339` 中 widget shell 给 iframe URL 设置 `canvasightHost=widget`。
- `plugins/canvasight/mcp/server.mjs:2358` 中 `sendFollowUpMessage` 使用 `mcpApp.sendMessage({ role: "user", content })`。

### 2. 浏览器 fallback 队列路径

这是当前实际命中的路径。

流程：

1. 页面作为普通 `http://127.0.0.1:5173/` 或 daemon URL 打开。
2. 页面不在 widget iframe 中。
3. URL 没有 `canvasightHost=widget`。
4. `canvasightApi.canSendFollowUpMessage()` 返回 false。
5. 前端调用 `/api/sessions/:id/run`。
6. daemon 尝试 native/app-server 投递；不可靠或不可用时，把 payload 放入 `runQueue`。
7. UI 显示 `已进入 Run 队列，等待当前 Codex thread 接收`。
8. 需要当前 Codex thread 再调用 `await_canvasight_run` 才能取回。

相关证据：

- `plugins/canvasight/src/lib/canvasightApi.ts:261`：
  - 只有 `window.parent !== window` 且 `canvasightHost=widget` 时才允许 widget follow-up。
- `plugins/canvasight/src/App.tsx:1610`：
  - 如果 `canSendFollowUpMessage()` 为 true，才走 `prepareWidgetRun` 和 `sendFollowUpMessage`。
- `plugins/canvasight/src/App.tsx:1622`：
  - 否则调用 `canvasightApi.run(runPayload)`。
- `plugins/canvasight/src/App.tsx:1628` 和 `plugins/canvasight/src/App.tsx:1635`：
  - fallback 后显示 browser fallback queued 状态。
- `plugins/canvasight/src/lib/translations.ts:197`：
  - `status.browserFallbackQueued` 文案就是截图中的 `已进入 Run 队列，等待当前 Codex thread 接收`。
- `plugins/canvasight/mcp/server.mjs:1858`：
  - `enqueueRun` 会把没有 waiter 或未成功投递的 run 放入 `session.runQueue`。
- `plugins/canvasight/mcp/server.mjs:3648`：
  - `await_canvasight_run` 是队列回收入口。

### 3. Codex app-server 试验路径

这是当前不可靠路径，不能视为成功发送。

流程：

1. daemon 尝试启动 `/Applications/Codex.app/Contents/Resources/codex app-server --stdio`。
2. 对 app-server 调 `thread/resume`。
3. 对 app-server 调 `thread/settings/update`、`thread/goal/set` 或 `turn/start`。
4. 即使 `turn/start` 返回 accepted / started，也无法稳定证明当前可见 Codex Desktop thread 收到了消息。
5. 当前实现把 `turn/start` 结果标记为 `turn_start_unverified`，然后仍然进入 queue fallback。

相关证据：

- `plugins/canvasight/mcp/server.mjs:225`：
  - `nativeCodexEnabled()` 只有设置 `CANVASIGHT_CODEX_NATIVE` 后才启用。
- `plugins/canvasight/mcp/server.mjs:2537`：
  - `appServerRequestSequence` 通过 `codex app-server --stdio` 调用 Codex app-server。
- `plugins/canvasight/mcp/server.mjs:2769`：
  - `turnIdFromResult` 尝试读取 turn id。
- `plugins/canvasight/mcp/server.mjs:2776`：
  - `startCodexTurn` 调用 `thread/resume` 和 `turn/start`。
- `plugins/canvasight/mcp/server.mjs:2888`：
  - `dispatchRunToCodexThread` 即使 `startCodexTurn` 成功，也返回 `status: "queued"` 和 `reason: "turn_start_unverified"`。

## 初步归因

### 主要归因

当前 Canvasight 页面没有被 Codex Desktop 渲染为 MCP native widget，而是作为普通 localhost 页面运行。

普通 Codex 内置浏览器页面和 MCP native widget 不是同一件事。内置浏览器只是浏览器，不自动暴露 `mcpApp.sendMessage` 或等价的 host bridge。

### 关键误判

之前把“页面在 Codex 侧边栏 / 内置浏览器里打开”误判为“页面拥有 Codex widget host bridge”。实际不成立。

只有 MCP App/native widget host 能提供 `mcpApp.sendMessage` 这类 API；普通浏览器页不能直接把内容注入当前 Codex thread。

### 为什么 thread id 不能解决

当前 daemon 或页面可以保存、claim 或传递 `threadId`，但知道 thread id 不等于拥有向该 thread 追加消息的官方能力。

`threadId` 当前只能用于：

- fallback queue 过滤；
- `await_canvasight_run` 匹配；
- Plan / Goal / app-server 试验；
- 项目/session 绑定。

它不能替代 widget bridge。

## 交付给哪个 Agent

development-agent

## 需要回答的问题

- Codex Desktop 当前版本是否真正支持 MCP Apps 的 `openai/outputTemplate: ui://...` native widget 渲染？
- Codex Desktop 对 MCP tool descriptor 和 resource metadata 需要哪些字段，才能把 tool result 渲染成 widget，而不是普通网页/附件卡片？
- `@modelcontextprotocol/ext-apps` 的 `App.sendMessage()` 在 Codex Desktop 中是否被支持？
- 如果支持，`sendMessage` 是否等价于“向当前 Codex thread 发送一条 user message”？
- `sendMessage` 的正确 payload shape 是 `{ role: "user", content: [...] }`，还是需要其他字段？
- 是否需要 tool/resource `_meta` 里声明额外权限，例如 `openai/widgetAccessible`、`ui/resourceUri`、`visibility` 或 CSP？
- Codex 内置浏览器 tab 是否可能获得 widget bridge，还是必须通过 MCP tool output card/widget 才有？
- 有没有官方、稳定、非虚拟点击、非剪贴板、非 DOM 自动化的本地 API，可以让 plugin/daemon 向当前活动 Codex thread 发送消息？
- Cowart 是如何实现画布发送到当前 Codex thread 的：MCP widget bridge、app-server、custom protocol，还是其他方式？
- 如果 iframe 到 localhost 无法获得 host bridge，是否应该把 React app bundle 直接作为 widget resource 输出，而不是 iframe 加载 `127.0.0.1`？

## 相关文件

- `plugins/canvasight/src/lib/canvasightApi.ts`
- `plugins/canvasight/src/App.tsx`
- `plugins/canvasight/src/lib/translations.ts`
- `plugins/canvasight/mcp/server.mjs`
- `plugins/canvasight/mcp/tests/smoke.mjs`
- `plugins/canvasight/skills/canvasight-run/SKILL.md`
- `plugins/canvasight/skills/canvasight-troubleshooting/SKILL.md`

## 期望结果

点击 Canvasight 节点 Run 后，节点生成的 Markdown 应被作为当前 Codex thread 的用户消息发送，并触发当前 thread 的 Codex turn。

期望路径不应依赖：

- 虚拟点击；
- AppleScript；
- 辅助功能权限；
- 剪贴板粘贴；
- DOM 自动化；
- 旧 thread id；
- 手动调用 `await_canvasight_run`。

## 处理结果

已按外部方案实现修复与降级闭环：前端不再把 `sent` 误报为 browser fallback queued；后端 app-server 路径只有收到匹配的 `turn/started`、`item/started` 或 `turn/completed` notification 后才返回 `sent`，否则继续返回 `queued` 并保留 payload 供 `await_canvasight_run` 接收。

## 修改文件

- `plugins/canvasight/mcp/server.mjs`
- `plugins/canvasight/src/App.tsx`
- `plugins/canvasight/src/lib/canvasightApi.ts`
- `plugins/canvasight/src/lib/translations.ts`
- `plugins/canvasight/src/styles/app.css`
- `plugins/canvasight/tests/mcp-smoke.mjs`
- `plugins/canvasight/skills/*`
- `README.md`
- `design.md`
- `AGENTS.md`

## 验证方式

- `npm run typecheck`
- `npm run build`
- `npm run test:mcp`
- plugin validation
- Playwright browser smoke for the diagnostics panel

## 后续风险

真实 Codex Desktop 是否在当前版本对 native widget host bridge 和 app-server confirmation 产生可见当前 thread 消息，需要重装 `canvasight@canvasight-local` 后在新线程/重新加载的会话里实测。未确认时 Canvasight 会明确显示 queued/fallback，而不是伪装成 sent。

## Closure Criteria

- [x] 明确 Codex Desktop 普通 in-app browser 与 native widget 的能力边界。
- [x] 明确 app-server `turn/start` RPC result 不能单独证明当前可见 thread 收到消息。
- [x] 形成可执行的修复方案报告并按方案实现。
- [x] 修改文件已记录。
- [x] 验证方式已记录。
- [x] 后续风险已记录。

## 当前状态

resolved
