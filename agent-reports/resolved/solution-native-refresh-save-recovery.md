---
schema_version: 1
report_id: solution-native-refresh-save-recovery
report_type: solution
status: resolved
owner: Development Agent
created_by: Development Agent
priority: high
version: 1
agent_id: /root/development_agent
thread_id: 019f7415-32a4-7980-831d-146e54c7d842
created_at: 2026-07-18T07:43:51Z
updated_at: 2026-07-18T07:43:51Z
depends_on:
  - issue-native-refresh-save-stalls-across-mcp-shim-restart
related_files:
  - plugins/canvasight/src/App.tsx
  - plugins/canvasight/src/lib/translations.ts
  - plugins/canvasight/src/store/scatterStore.ts
  - plugins/canvasight/tests/widget-runtime-smoke.mjs
  - plugins/canvasight/.codex-plugin/plugin.json
  - plugins/canvasight/package.json
  - plugins/canvasight/package-lock.json
  - plugins/canvasight/mcp/server.source.mjs
  - plugins/canvasight/mcp/server.mjs
  - plugins/canvasight/dist
verification_status: passed
verification_evidence:
  - npm run release:prepare -- 0.4.31 passed with synchronized manifest, package, lock, lock root, and MCP server versions.
  - npm run release:verify -- 0.4.31 and npm run check:mcp-bundle passed.
  - Isolated npm run test:widget-runtime passed clean-open, transient-change, save-failure retry, stable mutation id, in-flight edit, duplicate-click, and existing native-widget regressions.
  - Isolated npm run test:concurrency passed.
  - Test-owned leaked daemon PIDs 62697, 68665, 72473, 86483, and 7610 were precisely terminated; the repaired widget smoke then passed and left no new test daemon.
---

# 原生 Refresh 保存恢复闭环

## 负责 Agent

Development Agent

## 对应问题

`agent-reports/resolved/issue-native-refresh-save-stalls-across-mcp-shim-restart.md`

## Root Cause

画布使用 React Flow 的受控节点数组，但 `onNodesChange` 把 dimensions、selection 和坐标未变化的 position 通知也交给历史/持久化路径。Store 的 semantic no-op 分支仍调用 `mergeCanvasIntoPages`，无内容变化也会推进 Page `updatedAt`。保存 effect 又用任意 React dependency 更新推进本地 mutation generation，而 Refresh 只轮询 generation、request count 和 in-flight 标记 12 秒，没有可等待的真实保存 completion。

因此首屏测量或选择可以制造伪 dirty；若原生 MCP server-tool transport 在保存期间重建、超时或拒绝，失败 generation 保留但没有 Refresh 触发的安全重试，最终只能显示未保存超时。原生 shim 生命周期变化是暴露条件，不是应通过延长 12 秒掩盖的根因。

## 调研过程

- 对照真实 ready、用户 Toast、默认 `.scatter` mtime/revision 和 lifecycle，排除 daemon Session 丢失与 open-project 普通失败。
- 审计 `onNodesChange`、Zustand history/page merge、save generation 和 Refresh 等待逻辑，确认 transient state 与 persistent dirty 混用。
- composed widget 增加首屏零保存断言，首先捕获旧行为的 synthetic save。
- 修复后用真实节点输入制造保存失败、重试和保存期间第二次编辑，证明 Refresh 不覆盖本地内容。
- 审计测试进程发现 finally 未等待 Chrome/MCP child 退出，stopper 后可被迟到请求重新拉起 daemon；只清理本轮五个已核实 temp-home PID，并修正 teardown 顺序与退出断言。

## 可选方案

- 方案 A：把 Refresh deadline 延长到 server-tool timeout 之后；仍会保留伪 dirty、失败后无重试和不确定写入风险。
- 方案 B：以 canonical persistent document 区分真实编辑，抽出可等待 save flush，失败保持 dirty、下一次 Refresh 用同一 mutation id 重试。

## 推荐方案

采用方案 B。它让 dirty 与用户可持久内容一致，并继续复用既有三方 merge、revision 和 mutation receipt 语义，不降低刷新期间的本地内容保护。

## 实施步骤

1. 对节点 canonical value 去除 selection、dimensions、dragging、resizing 和 `lastRunAt`，稳定排序对象键；当前/下一节点 canonical 相同时只更新 live canvas。
2. Store semantic no-op 只更新 live nodes/edges，不更新 Page `updatedAt` 或 history。
3. 保存 effect 只为 canonical persistent change 推进 generation；Refresh 强制并等待 save flush completion。
4. 保存失败拒绝当前 Refresh waiter、保留 dirty；下次 Refresh 重新 flush，同一 generation 复用稳定 `clientMutationId`。
5. 保存期间出现新编辑时排队下一 generation，全部保存完成后才读取最新文档。
6. 将候选升级为 0.4.31 并重建自包含 MCP 与 web snapshot。

## 风险与回滚

canonical dirty 现在忽略 React Flow 测量宽高；当前产品没有用户节点 resize 持久化控件，布局仍使用 live measured bounds。若未来加入节点 resize，需把明确的用户 resize transaction 单独纳入 persistent contract，而不能重新持久化所有 dimensions 通知。

回滚会重新暴露原生 Refresh 永久等待风险，因此只能整体回滚到没有手动 Refresh 的旧行为，不能只移除 save flush。

## 处理结果

实现和自动化回归已修复，候选版本为 0.4.31。实现 issue 已 resolved；真实 Codex native-host 验收尚未执行，由 0.4.31 发布门禁继续持有，不能在本报告中声称正式发布门禁通过。

## 修改文件

- `plugins/canvasight/src/App.tsx`
- `plugins/canvasight/src/lib/translations.ts`
- `plugins/canvasight/src/store/scatterStore.ts`
- `plugins/canvasight/tests/widget-runtime-smoke.mjs`
- `plugins/canvasight/.codex-plugin/plugin.json`
- `plugins/canvasight/package.json`
- `plugins/canvasight/package-lock.json`
- `plugins/canvasight/mcp/server.source.mjs`
- `plugins/canvasight/mcp/server.mjs`
- `plugins/canvasight/dist/*`

## 验证方式

- `npm run release:prepare -- 0.4.31`
- `npm run release:verify -- 0.4.31`
- `npm run check:mcp-bundle`
- 显式临时 `CANVASIGHT_HOME`：`npm run test:widget-runtime`
- 显式临时 `CANVASIGHT_HOME`：`npm run test:concurrency`
- `npm run typecheck`
- `git diff --check`

## 后续风险

- exact 0.4.31 仍需安装并重启 Codex Desktop，在新任务完成 fullscreen ready、clean Refresh、A→B→A、same-task Run 和 late-metadata 原生验收。
- 原生验收前完成其余隔离发布矩阵；验收后不得再运行 lifecycle 测试。
- 默认 lifecycle 在本轮同时有真实 Codex widget 活动，不能以总行数不变证明隔离；本轮测试 cleanup 以显式 temp home、已核实 PID 和 repaired finally 的无残留断言为证据。
