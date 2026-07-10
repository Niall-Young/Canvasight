---
status: resolved
report_type: integration-summary
owner: main-thread
created_by: main-thread
priority: critical
created_at: 2026-07-10 14:33
updated_at: 2026-07-10 14:33
related_files:
  - plugins/canvasight/mcp/server.mjs
  - plugins/canvasight/src/lib/widgetBridge.ts
  - plugins/canvasight/src/lib/canvasightApi.ts
  - plugins/canvasight/tests/mcp-smoke.mjs
  - README.md
  - AGENTS.md
  - design.md
  - agent-reports/assigned/20260710-1359-development-issue-native-widget-bootstrap-architecture-reset.md
---

# 原生 Widget Bootstrap 架构复位集成总结

## 本轮目标

- 终止围绕无限 `Opening Canvasight...` 的局部补丁路线，复位 native widget bootstrap、ready 合同和验收标准。
- 交付并安装精确版本 `0.2.0+codex.20260710062412`。
- 用真实 ext-apps postMessage 生命周期替代会产生假阳性的 FakeApp/load 合成测试。

## Agent 状态

- Product Agent（`/root/product`）：完成产品成功语义检查；tool completion 不等于 UI ready。
- Design Agent（`/root/design`）：完成启动状态与可见错误方向检查。
- Development Agent（`/root/development`）：完成 bootstrap、runtime、ready ACK/await 实现。
- Test Supervisor Agent（`/root/test_supervisor`）：完成回归门禁和测试报告；真实宿主验收仍待完成。
- Customer Support Agent（`/root/customer_support`）：确认 README 需要中英双语更新并接受本轮压缩重写范围。
- Design Standards Expert（`/root/design_standards`）：更新 `design.md` 的 native startup 基线。
- Development Standards Lead（`/root/development_standards`）：更新 `AGENTS.md` 的真实宿主验收门禁。
- Project Management Agent（`/root/project_management`）：完成版本、dist、git scope 审查；未 stage/commit。
- Skill Expert Agent（`/root/skill_expert`）：更新 open/run/troubleshooting skill 合同并完成验证。

## Agent 输入

- Product / Design：启动过程必须有 Starting、Connecting、Ready、Failed，错误可见，不能无限 loading。
- Development：保留 daemon 和持久化业务，改为 app bundle 内的 typed MCP Apps bridge、动态 session runtime 和 daemon-backed ready acknowledgement。
- Test：以真实 `ui/initialize`、`ui/notifications/tool-result`、OpenAI `event.detail.globals`、metadata timeout 和 ready ACK 为门禁。
- Customer Support / Standards：README、skills、`design.md`、`AGENTS.md` 同步新合同，删除误导性的“工具成功即打开”表述。
- Project Management：四处版本必须一致，dist 必须由当前源码重建，真实 Codex 验收前不提交。

## 报告状态变更

- 新建 `assigned/20260710-1359-development-issue-native-widget-bootstrap-architecture-reset.md`，保持 assigned 等待真实宿主验收。
- 新建 `resolved/20260710-1420-development-solution-native-widget-bootstrap-architecture-reset.md`。
- 新建 `resolved/20260710-1426-test-solution-native-widget-bootstrap-regression-gates.md`。
- 本集成总结记录当前实现、验证和宿主重载阻塞。

## 已解决

- 移除 server-string bootstrap，MCP Apps bridge 进入正常 Vite bundle。
- React shell 立即挂载，session metadata 后到达时动态使用真实 `sessionId` 和 token。
- 标准 MCP Apps 和 OpenAI compatibility event 具有明确的双路径接收合同。
- metadata 缺失、bundle/runtime 错误进入可见 Failed 状态，不再永久 Opening。
- `open_canvasight` 只返回 opening；新增 `await_canvasight_widget_ready`，只有 `ready + reactMounted` 才能宣布画布就绪。
- 单 bundle 构建和真实 postMessage 回归门禁已建立。
- 插件已以精确 0.2.0 cachebuster 版本重装，CLI 解析到源码 checkout。

## 未解决

- 当前 Codex Desktop 在插件升级前已运行，仍持有 `0.1.51` app-level 插件注册快照。
- 独立验收任务 `019f4ab8-bd04-7d51-9df4-b2e5ffdcd8de` 因未加载 0.2.0 MCP tools，无法启动 widget；这不是 widget 运行结果。
- 必须重载/重启 Codex Desktop 后再创建并重新标记任务，完成 ready、可见、控件和同任务 Run 验收。

## 风险

- 在宿主重载和真实交互验收前，0.2.0 不能宣称最终修复。
- 内联单 bundle 约 1.6 MB，构建有 chunk size warning，但保证 widget 资源自包含。
- `npm run test:dev-server` 曾因 Node 25/Undici `setTypeOfService EINVAL` 单次失败，隔离重跑通过；属于环境波动。
- 既有 `agent-reports/assigned/20260710-1003-test-issue-native-widget-shell-only.md` 已标记 resolved 但仍位于 assigned，属于本轮前已有队列卫生问题。

## 下一轮分派

- main-thread：用户重载 Codex 后，在新 `@Canvasight` 任务运行 open + ready，观察完整画布、点击一个有效控件并验证 Run 回到同一任务。
- Test Supervisor Agent：复核真实宿主证据后决定是否关闭 1359 issue。
- Project Management Agent：验收通过后检查最终 scope、stage 并使用 `fix: 复位原生画布启动与就绪确认链路` 提交。

## 已完成改动

- 新增 typed widget bridge、动态 runtime、ready/failure 上报和 daemon wait tool。
- 更新 app 启动、Vite 构建、MCP tool/resource、smoke tests、版本和 dist。
- 更新中英 README、设计/开发标准、Canvasight open/run/troubleshooting skills。
- 补充 agent issue、solution、test 和 integration reports。

## 处理结果

实现与自动验证完成；真实 Codex 宿主验收因桌面进程未刷新插件注册表而明确阻塞。主 issue 保持 assigned，不宣称最终修复。

## 修改文件

- Runtime：`plugins/canvasight/mcp/server.mjs`、`src/App.tsx`、`src/main.tsx`、`src/lib/canvasightApi.ts`、`src/lib/widgetBridge.ts`、`vite.config.ts`
- Tests/build/version：`tests/mcp-smoke.mjs`、`dist/`、`.codex-plugin/plugin.json`、`package.json`、`package-lock.json`
- Contracts/docs：`AGENTS.md`、`design.md`、`README.md`、Canvasight skills/references
- Reports：`agent-reports/QUEUE.md`、1359 issue、1420 development solution、1426 test solution、本 integration summary

## 验证方式

- `npm run test:mcp`
- `npm run build`
- `npm run test:markdown`
- `npm run test:dev-server`
- `python3 /Users/niallyoung/.codex/skills/.system/plugin-creator/scripts/validate_plugin.py /Users/niallyoung/Desktop/Canvasight/plugins/canvasight`
- 六个修改过的 skills 运行 `quick_validate.py`
- `git diff --check`
- `codex plugin list`
- 独立 Codex 真实宿主任务读取与 `mcp-lifecycle.log` 交叉验证

## 验证记录

- MCP smoke、build、markdown、插件 validator、skill validator、diff check 均通过。
- dev-server smoke 首次遇到 Node 25/Undici `EINVAL`，隔离重跑通过。
- `codex plugin list`：`canvasight@canvasight-local` installed/enabled，版本 `0.2.0+codex.20260710062412`，来源为本仓库插件目录。
- 独立任务没有 0.2.0 Canvasight tools；lifecycle 日志只有旧 0.1.51 启动记录，证明宿主未刷新，而非 ready 结果失败。

## 回写状态

- `agent-reports/QUEUE.md` 已更新。
- 1359 issue 已写入真实宿主阻塞证据并保持 assigned。
- Development/Test solution reports 已写入。

## 未解决 / 后续风险

- Codex Desktop reload/restart 后的真实 native widget ready、可见、可点击和 Run 验收仍是唯一关闭门槛。

## Git 状态

- branch: `main`
- commit decision: 用户明确要求在 native-host acceptance 尚未完成时先提交本轮实现。
- verification status: `unverified`；提交不代表真实 Codex 原生宿主验收通过，1359 issue 继续保持 assigned。
- scope: 仅包含本轮实现、文档、构建和报告改动。
