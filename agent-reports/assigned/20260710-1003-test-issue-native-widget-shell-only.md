---
status: resolved
report_type: issue
owner: main-thread
created_by: Test Supervisor Agent
priority: high
created_at: 2026-07-10 10:03
updated_at: 2026-07-10 10:13
related_files:
  - plugins/canvasight/mcp/server.mjs
  - plugins/canvasight/tests/mcp-smoke.mjs
  - agent-reports/resolved/20260710-0927-integration-summary-native-run-contract.md
solution_report: agent-reports/resolved/20260710-1013-development-solution-native-widget-module-bootstrap.md
---

# Native Widget 只显示 shell，画布未挂载

## TL;DR

用户在 Codex 中调用 Canvasight 后只看到“Canvasight ready”占位壳，画布没有呈现也不能交互；本地安装、daemon 与 MCP 合同均正常，故问题收敛到原生 widget 宿主中的应用 bootstrap/render。

## 发现者

Test Supervisor Agent

## 提交 Agent

Test Supervisor Agent

## 建议交接 Agent

Development Agent

## 问题描述

用户截图显示对话中的 Canvasight widget 卡片仅渲染灰色容器与 `Canvasight ready`，没有 React 画布、控件或可交互区域。正常产品体验应为 Codex 原生 widget 画布，而不是仅有聊天卡片占位或浏览器 fallback。

## 现象

- 截图中的状态文字为 `Canvasight ready`，但 `#root` 内没有可见应用 UI。
- 当前调用 `open_canvasight(threadId=019f49c0-be2e-7723-917a-2f0ae7502f2b)` 返回 `openTarget=codex_native_widget`、`rendering=native-widget`，并附带 `ui://widget/canvasight/canvas.html` 与完整 widgetData。
- 该状态由 widget shell 的 `setFrameSource()` 在调用 `startCanvasightApp()` 后写入，因此 shell 已收到 tool result；失败点在内联应用脚本执行/挂载或宿主渲染层。

## 复现方式

1. 在已加载 `canvasight@canvasight-local` 0.1.48 的 Codex task 中读取 `CODEX_THREAD_ID`。
2. 调用 `open_canvasight` 并显式传入该 threadId。
3. 观察原生 widget：仅显示 `Canvasight ready`，画布不可用。

## 影响范围

- Canvasight 正常打开流程不可用；用户无法编辑节点、打开抽屉或执行 Run。
- 不应以 `open_canvasight_browser_fallback` 作为正常修复路径，因为它不具备原生 bridge 且会改变 Run 合同。

## 证据

- `codex plugin list`：`canvasight@canvasight-local installed, enabled 0.1.48`，路径为当前 checkout。
- 源码与已安装 cache 的 manifest 均为 0.1.48；daemon health 也报告 0.1.48，端口 `127.0.0.1:56426` 正常监听。
- `npm run dev:status`：`running http://127.0.0.1:5173 ... serverVersion=0.1.48`。
- `npm run test:mcp` 通过，plugin validator 通过；这两项未覆盖真实 Codex widget DOM 挂载。
- widget shell 在 `plugins/canvasight/mcp/server.mjs` 的 `setFrameSource()` 调用 `startCanvasightApp()`，随后无条件显示 `Canvasight ready`，没有 app-script load/error 回调或可见 bootstrap 诊断。
- 同构 widget bootstrap 实验复现：以实际 `resources/read` 返回的 HTML、相同 `window.openai.toolResponseMetadata` 注入和普通 Chromium 运行时加载，控制台在 `startCanvasightApp()` 报 `SyntaxError: Failed to execute 'appendChild' on 'Node': Identifier 'Hg' has already been declared`。将实验 HTML 中动态 app script 标记为 `type="module"` 后，完整画布、任务节点和控制按钮均正常挂载。

## 初步归因

根因已确认：`startCanvasightApp()`（`plugins/canvasight/mcp/server.mjs:2879-2889`）通过未设置 `type` 的动态 `<script>` 注入 Vite app bundle，浏览器按 classic script 执行；该 bundle 作为 ES module 构建后在 classic global scope 触发重复 lexical binding（实测为 `Identifier 'Hg' has already been declared`），所以 React 从未挂载。`setFrameSource()` 随后在 `:2876` 无条件显示 `Canvasight ready`，将失败伪装成成功。不是旧插件缓存、MCP transport、daemon 或 browser fallback。

## 交付给哪个 Agent

Development Agent

## 需要回答的问题

- 将动态 app script 改成 `type="module"` 是否可作为最小修复？已在同构浏览器实验确认可挂载。
- 是否改为静态 `<script type="module">` 并由 `src/main.tsx` 等待 `canvasight:widget-data` 后再挂载，以消除动态执行路径？待实施选择。
- 如何让 native widget 在 shell 成功后可靠展示可交互 React 画布，并保留 host bridge 与当前 Run 合同？
- 如何新增真实 bootstrap 成功/失败的可观察状态与可自动验证的覆盖？

## 相关文件

- `plugins/canvasight/mcp/server.mjs`
- `plugins/canvasight/src/main.tsx`
- `plugins/canvasight/src/lib/canvasightApi.ts`
- `plugins/canvasight/tests/mcp-smoke.mjs`

## 期望结果

原生 `open_canvasight` 在 Codex 中打开可交互的完整 Canvasight 画布；任何 bootstrap 失败必须给出明确错误而非“ready”假阳性。原生 Apps widget 可协商的展示模式为 inline、PiP、fullscreen，不包含 Codex browser sidebar；侧栏只能是明确 browser fallback，不能冒充 native bridge。

## Closure Criteria

- [ ] 真实宿主中的根因明确
- [ ] native widget 画布可见且可交互
- [ ] 修改文件已记录
- [ ] 自动化与宿主可见验证已记录
- [ ] 后续风险已记录

## 当前状态

resolved

## 处理结果

主线程按已验证的最小方案将动态 bundle 设为 ES module，并让状态只在模块加载成功后清除；加载错误会显示明确恢复提示。

## 修改文件

- `plugins/canvasight/mcp/server.mjs`
- `plugins/canvasight/tests/mcp-smoke.mjs`
- `plugins/canvasight/.codex-plugin/plugin.json`
- `plugins/canvasight/package.json`
- `plugins/canvasight/package-lock.json`
- `README.md`
- `design.md`
- `AGENTS.md`

## 验证方式

- 已完成：版本/cache/daemon/MCP smoke/plugin validator 检查。
- 已完成：实际 widget HTML + host metadata 同构浏览器复现；classic script 失败，module script 成功挂载完整 UI。
- 已完成：`npm run test:mcp` 覆盖 module bootstrap 的成功与错误状态。
- 已完成：Codex in-app browser fallback 显示完整画布，并验证设置弹窗可打开和关闭。
- 待完成：升级后在新线程或 reload session 中进行真实 native widget 验收。

## 后续风险

已打开的 Codex thread 不会热刷新 `0.1.49` widget resource，需新开 thread 或 reload session；browser fallback 的可操作验证不替代 native bridge 验收。
