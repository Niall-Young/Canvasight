---
schema_version: 1
report_id: issue-native-refresh-save-stalls-across-mcp-shim-restart
report_type: issue
status: resolved
owner: Development Agent
created_by: Main Thread
priority: high
version: 4
agent_id: /root/development_agent
thread_id: 019f7415-32a4-7980-831d-146e54c7d842
created_at: 2026-07-18T07:23:36Z
updated_at: 2026-07-18T07:46:30Z
depends_on:
  - issue-publish-stable-release-0-4-30
  - solution-manual-canvas-latest-revision-refresh
related_files:
  - plugins/canvasight/src/App.tsx
  - plugins/canvasight/src/lib/translations.ts
  - plugins/canvasight/src/store/scatterStore.ts
  - plugins/canvasight/src/lib/canvasightApi.ts
  - plugins/canvasight/src/lib/widgetBridge.ts
  - plugins/canvasight/tests/widget-runtime-smoke.mjs
  - plugins/canvasight/mcp/server.source.mjs
solution_report: agent-reports/resolved/solution-native-refresh-save-recovery.md
verification_status: passed
verification_evidence:
  - Exact installed 0.4.30 reached verified fullscreen ready, but the real Refresh control timed out with 当前更改尚未保存，刷新已取消.
  - The refresh callback waits 12 seconds while local mutation/save refs remain pending; the native server-tool bridge permits a longer 30-second call timeout.
  - Lifecycle evidence shows the widget-facing MCP shim ending and new shims initializing while the accepted native widget remained visible.
  - Exact 0.4.31 composed widget smoke passes clean immediate Refresh with zero synthetic saves, save failure/retry, stable mutation id, in-flight edit preservation, and duplicate single-flight.
  - Release prepare/verify, MCP bundle freshness, build/typecheck, and concurrency pass for 0.4.31.
---

# 原生 Refresh 在 MCP shim 重建时被未完成保存永久阻断

## TL;DR

0.4.30 原生候选通过 fullscreen ready 后，真实 Refresh 因保存请求未完成而被脏数据保护取消；候选不得发布。

## 问题描述

用户在重启 Codex Desktop、安装 exact 0.4.30 并通过 instance-bound ready 后点击右上 Refresh，12 秒后出现“当前更改尚未保存，刷新已取消”。当前实现让 Refresh 等待本地 mutation、请求计数和 in-flight 保存全部归零；原生 server-tool 调用本身允许等待 30 秒，且保存失败后未自动重试或重新对齐 mutation acknowledgement。

## 现象

- fullscreen ready、React mount、项目水合、画布可见性均通过。
- 第一个有意义控件 Refresh 失败。
- 截图明确显示未保存保护 Toast，不是普通 open-project 请求失败。

## 复现方式

1. 安装 exact 0.4.30，重启 Codex Desktop，在新任务以 `@Canvasight` 打开仓库。
2. 等待 instance-bound fullscreen ready。
3. 在原生 widget 保持可见、任务回合结束或 MCP shim 重建后点击 Refresh。
4. 观察 Refresh 等待后以未保存超时取消。

## 影响范围

原生 widget 的保存、手动 Refresh、发布验收与可能跨任务回合存续的编辑安全；直接阻断 0.4.30 Release 和 `stable` 推进。

## 证据

- ready identity: `session-mrq1b3d2-3a5c67a4` / `open-mrq1b3d2-7e455ce2b826` / task `019f7415-32a4-7980-831d-146e54c7d842`。
- accepted widget: `widget-8cfbea1f-5f13-48f4-8161-a135c8b4add1`，fullscreen，736×240；后续同一 attempt 还报告新的 fullscreen widget instance。
- `refreshLatestDocument` 的 save deadline 为 12 秒，`widgetBridge.callServerTool` 默认 timeout 为 30 秒。
- 生命周期日志显示原生 widget 存续期间 shim 结束并由新 shim 初始化。

## 初步归因

Refresh 的本地保存等待与 MCP Apps server-tool transport 生命周期没有恢复闭环：pending save 可以比 Refresh deadline 更久；若 transport 重建或请求失败，local mutation acknowledgement 不会被安全重试/清除，Refresh 之后持续把画布视为未保存。

## 交付给哪个 Agent

Development Agent

## 需要回答的问题

- pending save 在真实宿主中为何跨 shim 重建没有及时 resolve/reject？
- 保存失败后如何在不丢本地更改的前提下重试，并让 Refresh 等待真正可完成的 flush？
- 如何扩展 composed widget 测试覆盖 server-tool 延迟、拒绝、transport 重建和 Refresh 恢复？

## 相关文件

- `plugins/canvasight/src/App.tsx`
- `plugins/canvasight/src/lib/canvasightApi.ts`
- `plugins/canvasight/src/lib/widgetBridge.ts`
- `plugins/canvasight/tests/widget-runtime-smoke.mjs`

## 期望结果

原生 widget 在正常 shim/turn 生命周期下能完成或明确失败并重试保存；Refresh 不丢本地更改，也不会因已结束的请求永久阻断。

## Closure Criteria

- [x] 根因在真实宿主证据与测试中闭环
- [x] 保存失败/transport 重建后的安全重试通过
- [x] Refresh 自动化、脏数据保护和重复点击门禁通过
- [x] 新版本候选已生成，exact 安装、重启与完整原生验收转交 0.4.31 发布门禁
- [x] 0.4.30 保持未发布

## 当前状态

resolved；实现与自动化已修复并生成 0.4.31 候选。exact 0.4.31 安装、宿主重启和完整原生验收由 0.4.31 发布门禁继续持有；0.4.30 Release 继续冻结。

## 处理结果

已用 canonical persistent dirty、可等待 save flush、失败可重试和稳定 mutation id 修复。非持久 React Flow 通知不再进入 dirty/history，semantic no-op 不再更新 Page 时间戳。实现 solution 见 `agent-reports/resolved/solution-native-refresh-save-recovery.md`。

## 修改文件

- `plugins/canvasight/src/App.tsx`
- `plugins/canvasight/src/lib/translations.ts`
- `plugins/canvasight/src/store/scatterStore.ts`
- `plugins/canvasight/tests/widget-runtime-smoke.mjs`
- 0.4.31 manifest/package/lock/MCP bundle/web dist
- `agent-reports/resolved/solution-native-refresh-save-recovery.md`
- 本报告

## 验证方式

- `npm run release:prepare -- 0.4.31`
- `npm run release:verify -- 0.4.31`
- `npm run check:mcp-bundle`
- 显式临时 `CANVASIGHT_HOME` 下 `npm run test:widget-runtime`
- 显式临时 `CANVASIGHT_HOME` 下 `npm run test:concurrency`
- exact 新版本 native ready、Refresh、Run、A→B→A、late metadata 验收

## 后续风险

- 不得通过重复点击、浏览器 fallback 或手工清 dirty 来降格放行 0.4.30。
- 0.4.31 真实原生验收未完成，不得因为本实现 issue resolved 而声称发布门禁通过。
- 本轮五个 test-owned temp daemon 已精准清理；测试 finally 已等待 Chrome/MCP child 退出并断言 daemon 退出，未触碰历史或默认 daemon。
