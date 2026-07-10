---
status: assigned
report_type: issue
owner: Development Agent
created_by: main-thread
priority: critical
created_at: 2026-07-10 13:59
updated_at: 2026-07-10 14:33
related_files:
  - plugins/canvasight/mcp/server.mjs
  - plugins/canvasight/src/main.tsx
  - plugins/canvasight/tests/mcp-smoke.mjs
  - AGENTS.md
solution_report: agent-reports/resolved/20260710-1420-development-solution-native-widget-bootstrap-architecture-reset.md
agent_id: development
---

# 原生 Widget bootstrap 架构复位

## 提交 Agent

main-thread

## 建议交接 Agent

Development Agent

## 问题描述

Canvasight 0.1.51 在真实 Codex 原生 widget 中持续停留在 `Opening Canvasight...`。MCP 工具、资源读取、daemon 和版本均正常，失败收敛到 widget 获取初始 tool result、挂载 React 和报告 ready 的 bootstrap 链路。此前围绕 module 类型、Node 可执行文件和 metadata shape 的补丁均通过合成 smoke，但没有通过真实 Codex native widget 验收。

## 复现方式

1. 在新 Codex task 中通过 `@canvasight 打开画布` 调用 `open_canvasight`。
2. 工具约 494ms 完成，Codex 读取 `ui://widget/canvasight/canvas.html`，daemon 0.1.51 正常。
3. 原生 widget 永久显示 `Opening Canvasight...`，React 画布没有挂载。

## 影响范围

- Canvasight 正常打开路径不可用。
- 工具成功被错误表述为 UI 已打开。
- 合成测试持续产生假阳性，导致多次版本补丁和重装仍未解决真实宿主问题。

## 相关文件

- `plugins/canvasight/mcp/server.mjs`
- `plugins/canvasight/src/main.tsx`
- `plugins/canvasight/tests/mcp-smoke.mjs`
- `AGENTS.md`

## 期望结果

- React shell 在 widget 资源加载后立即挂载，不以隐藏 session URL 为首屏前置条件。
- 初始数据严格接收标准 `ui/notifications/tool-result`，OpenAI 兼容事件读取 `event.detail.globals`。
- bootstrap 具有阶段超时和可见错误，不得无限 `Opening`。
- widget 只有在 React 挂载且 session/API 就绪后报告 ready；工具完成不能冒充 UI ready。
- 自动测试覆盖真实 postMessage 生命周期与真实 bundle 执行；合成解析测试不能作为 native-host 验收。

## 当前状态

assigned；Development Agent 已于 2026-07-10 14:13 接受实施。当前先收敛原生 widget bootstrap：保留 daemon 与持久化业务，只修改运行时启动链路；真实 Codex 验收和 issue 关闭由主线程负责。

## Test Supervisor 接受与验收说明

Test Supervisor Agent 已接受 bootstrap 回归门禁。自动测试必须同时证明：

- 使用真实 `window.postMessage` JSON-RPC 生命周期完成 `ui/initialize` / `ui/notifications/initialized`，再以 `ui/notifications/tool-result` 向 View 交付 widget data；不得只直接调用合成 `FakeApp` listener。
- OpenAI 兼容链路必须从 `openai:set_globals` 的 `event.detail.globals` 读取数据，不得假设 `window.openai` 已提前同步。
- 缺失 session metadata 时必须在可控时间内进入可见错误，不得永久保留 `Opening Canvasight...`。
- 模块脚本的 `load` 事件不能代表 React ready；没有 React 挂载后的显式 ready 回执，测试必须保持未就绪或失败。
- React shell 先挂载、widget data 后到达时，`canvasightApi` 的后续请求必须动态使用真实 `sessionId` / `token`，不得在模块初始化时固化为 `local` / 空值。

本轮自动测试通过仍只代表回归门禁通过。真实 Codex 新 task 原生 widget 的可见、可点击和 Run 回传必须由主线程完成，在此之前不得标记该 issue 已验收或已关闭。

## 真实宿主验收记录

2026-07-10 14:30，主线程在 Codex Desktop 内创建独立验收任务 `019f4ab8-bd04-7d51-9df4-b2e5ffdcd8de`，要求严格执行 `open_canvasight` 后接 `await_canvasight_widget_ready`。该任务没有加载 `open_canvasight` 或 `await_canvasight_widget_ready`，因此真实 widget 尚未启动，不能验收 UI。

同一时点的交叉证据：

- `codex plugin list` 已解析源码 checkout，版本为 `0.2.0+codex.20260710062412`。
- 安装缓存存在同版本 package，四处版本合同一致。
- `mcp-lifecycle.log` 只出现桌面宿主启动的旧 `0.1.51` MCP 进程，没有 `0.2.0` 的 `stdio_start`。
- 由此确认当前 Codex Desktop 仍持有升级前的 app-level 插件注册快照；只创建新任务不足以刷新新工具。
- Computer Use 明确拒绝自动控制 `com.openai.codex`，主线程未绕过宿主安全限制。

下一步必须由用户重新加载窗口或重启 Codex Desktop，再新建任务、重新 `@Canvasight`，然后执行 ready、可见/可点击和同任务 Run 验收。此阻塞属于当前宿主状态，不证明 0.2.0 widget 已通过或失败。

## Closure Criteria

- [x] 标准 MCP Apps bootstrap 成为主路径
- [x] React 首屏挂载不依赖隐藏 metadata
- [x] OpenAI 兼容事件使用事件 payload
- [x] 启动失败可见且有超时
- [x] ready 合同与测试更新
- [ ] 升级后的 Codex Desktop 已重新加载并在新任务重新 `@Canvasight`
- [ ] 真实 Codex 新 task 原生 widget 可见、可点击、Run 可回传
- [x] 方案报告、修改文件、验证和残余风险已回写
