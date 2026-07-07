---
status: resolved
report_type: solution
owner: Development Agent
created_by: main-thread
priority: critical
created_at: 2026-07-07 12:03
updated_at: 2026-07-07 12:03
related_issue: agent-reports/resolved/20260707-1147-development-issue-native-widget-iframe-blocked.md
related_files:
  - plugins/canvasight/mcp/server.mjs
  - plugins/canvasight/src/lib/canvasightApi.ts
  - plugins/canvasight/tests/mcp-smoke.mjs
  - plugins/canvasight/skills/canvasight-open/references/open-workflow.md
  - plugins/canvasight/skills/canvasight-troubleshooting/SKILL.md
  - plugins/canvasight/skills/canvasight-troubleshooting/references/troubleshooting.md
  - README.md
  - AGENTS.md
  - design.md
---

# 原生组件直接承载 Canvasight app

## 负责 Agent

Development Agent；主线程集成实现。Product Agent、Test Supervisor Agent 参与复核，Customer Support Agent、Development Standards Lead、Design Standards Expert、Skill Expert Agent 由主线程按项目清单执行。

## 对应问题

`agent-reports/resolved/20260707-1147-development-issue-native-widget-iframe-blocked.md`

## Root Cause

`open_canvasight` 已经成功进入 Codex native widget，但旧 widget resource 是 “MCP widget shell + localhost iframe”。Codex 宿主会屏蔽 widget 内再嵌入 `http://127.0.0.1:<daemon>` 的 frame，所以右侧原生组件显示“该内容被屏蔽”。daemon 本身没有返回 `X-Frame-Options` 或阻断 CSP；根因是 widget 架构依赖 nested localhost iframe，而不是用户操作或项目数据错误。

## 调研过程

1. 复现截图中聊天结果显示“打开方式：Codex 原生组件”，说明 `open_canvasight` 的默认 native widget 路径已被调用。
2. 检查当前 widget resource，发现 HTML 中渲染 `<iframe id="canvasight-frame">`，并由 bridge script 把 `src` 设置为 daemon URL。
3. 使用 daemon URL 响应头排除服务端主动禁止 iframe 的常见原因。
4. 对比产品目标：Canvasight 应在当前 Codex thread 的原生组件里显示画布，并通过 host bridge 发送 Run；browser fallback 只能作为排队/调试路径。
5. Development Agent 复核确认：native widget 应直接承载 app，daemon 只作为 API/data 服务；CORS/PNA 是补强，不是根因。
6. Test Supervisor Agent 复核确认：MCP smoke 必须断言 resource 没有实际 `<iframe>`，并保留 browser fallback queued 语义。

## 可选方案

- 方案 A：继续使用 iframe，并尝试调整 `openai/widgetCSP`、iframe sandbox 或 daemon header。该方案不可靠，因为宿主级屏蔽不一定受资源 CSP 或 daemon header 控制。
- 方案 B：把 Canvasight app 作为 widget resource 直接运行，前端用注入 runtime data 调 daemon API。这能避开 nested localhost iframe，并保留 host bridge。
- 方案 C：只退回 browser fallback + `await_canvasight_run`。该方案可临时可用，但不满足“点击 Run 进入当前 Codex thread”的核心目标。

## 推荐方案

采用方案 B。native widget resource 直接输出 `#root`、内联 built CSS/JS bundle 和 host bridge script。`open_canvasight` 的 tool result 继续提供 `url/browserUrl/origin/sessionId/token`，bridge script 把它们整理成 `__CANVASIGHT_WIDGET_DATA__`，前端从该数据读取 `apiBaseUrl`、`sessionId`、`token` 和 `canvasightHost`。

## 实施步骤

1. `plugins/canvasight/mcp/server.mjs` 读取 `dist/index.html`、JS bundle 和 CSS bundle，把 Canvasight app 内联到 widget resource。
2. widget HTML 不再渲染 `<iframe>`，改为渲染 `<div id="root"></div>`。
3. host bridge 在收到 tool result 后注入 `__CANVASIGHT_WIDGET_DATA__`，并启动内联 app module。
4. `plugins/canvasight/src/lib/canvasightApi.ts` 支持从 widget runtime data 读取 session、token、thread、apiBaseUrl，所有 daemon API 使用 absolute daemon URL。
5. daemon 响应增加 CORS/PNA header，支持 widget document 跨 origin 请求本地 daemon。
6. `plugins/canvasight/tests/mcp-smoke.mjs` 增加 resource 断言：有 `#root` 和内联 bundle，且没有实际 `<iframe>` 标签。
7. 同步 README、AGENTS、design.md、open/troubleshooting skills，并 bump Canvasight 到 `0.1.33`。

## 风险与回滚

风险：

- 旧 thread 或旧插件 cache 仍可能加载 `0.1.32` 资源，需要 reinstall 后 reload 或新开 thread 才能看到修复。
- 当前内联 bundle 方案依赖 Vite 输出单 JS bundle；未来如果引入 code splitting，需要改成 widget resource asset 化。
- MCP smoke 不能完全证明真实 Codex host 是否允许 widget document fetch 本地 daemon；需要真实打开确认。

回滚方式：

- 回滚版本 bump 和本轮文件改动即可恢复 `0.1.32` 行为；但会重新出现 native widget 内容被屏蔽风险。
- 如果真实 host 不允许 inline module，可保留本轮 API/runtime data 设计，改为 `ui://widget/canvasight/assets/*` 资源加载。

## 处理结果

已修复。native widget resource 不再包含实际 `<iframe>` 标签，前端在 widget document 内运行，并通过 daemon API + host bridge 工作。

## 修改文件

- `plugins/canvasight/mcp/server.mjs`
- `plugins/canvasight/src/lib/canvasightApi.ts`
- `plugins/canvasight/tests/mcp-smoke.mjs`
- `plugins/canvasight/.codex-plugin/plugin.json`
- `plugins/canvasight/package.json`
- `plugins/canvasight/package-lock.json`
- `plugins/canvasight/dist/index.html`
- `plugins/canvasight/dist/assets/index-CbmG8cAd.js`
- `plugins/canvasight/skills/canvasight-open/references/open-workflow.md`
- `plugins/canvasight/skills/canvasight-troubleshooting/SKILL.md`
- `plugins/canvasight/skills/canvasight-troubleshooting/references/troubleshooting.md`
- `README.md`
- `AGENTS.md`
- `design.md`

## 验证方式

- `node --check plugins/canvasight/mcp/server.mjs`
- `cd plugins/canvasight && npm run typecheck`
- `cd plugins/canvasight && npm run build`
- `cd plugins/canvasight && npm run test:mcp`
- `cd plugins/canvasight && npm run test:dev-server`
- `python3 /Users/niallyoung/.codex/skills/.system/plugin-creator/scripts/validate_plugin.py /Users/niallyoung/Desktop/Canvasight/plugins/canvasight`

## 后续风险

- 需要用户 reload 或新开 thread 后重新调用 `open_canvasight`，避免旧 tool/resource metadata 继续显示 blocked。
- 如果真实 host 仍显示 blocked，下一步应检查 widget resource 是否被 host 拒绝 inline module，或 daemon API fetch 是否被 widget CSP/PNA 拦截。
