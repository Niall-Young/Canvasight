---
schema_version: 1
report_id: issue-native-widget-zero-size-0-4-31
report_type: issue
status: assigned
owner: Development Agent
created_by: Main Thread
priority: high
version: 3
agent_id: /root/development_agent
thread_id: 019f7450-40ec-7df0-81de-862b1f8af621
created_at: 2026-07-18T08:21:54Z
updated_at: 2026-07-18T08:27:24Z
depends_on:
  - issue-publish-stable-release-0-4-31
related_files:
  - plugins/canvasight/src/App.tsx
  - plugins/canvasight/src/lib/canvasightApi.ts
  - plugins/canvasight/src/lib/widgetBridge.ts
  - plugins/canvasight/mcp/server.source.mjs
  - plugins/canvasight/tests/widget-runtime-smoke.mjs
verification_status: not_started
verification_evidence:
  - Native 0.4.31 open attempt reached fullscreen with React mounted, but project hydration and visible non-zero canvas evidence never completed within 30000ms.
  - After navigating the target task to the Codex main window, a fresh exact-0.4.31 attempt reached verified fullscreen ready with a visible 788 by 794 canvas; remaining in-widget acceptance is pending.
solution_report: agent-reports/resolved/solution-native-widget-zero-size-0-4-31.md
---

# 0.4.31 重启后原生 Widget 画布保持零尺寸

## TL;DR

exact 0.4.31 在重启后的新任务中通过 MCP 与 React 启动，但真实 fullscreen 实例未完成项目 hydration 和可见画布门禁，阻断 0.4.31 发布。

## 问题描述

0.4.31 候选已完成隔离测试、exact 安装与宿主重启。本轮正常 `open_canvasight` 路径创建了原生实例，但 `await_canvasight_widget_ready` 在 30 秒后返回失败；不得通过重复打开、浏览器 fallback 或合成测试降格验收。

## 现象

- `displayMode: fullscreen`
- `reactMounted: true`
- `projectHydrated: false`
- `canvasRendered: false`
- `canvasVisible: false`
- `canvasWidth: 0`
- `canvasHeight: 0`

## 复现方式

1. 在 exact 0.4.31 安装并重启 Codex Desktop 后创建新任务并重新启用 Canvasight。
2. 以当前 `CODEX_THREAD_ID` 调用 `open_canvasight`。
3. 使用同一 `sessionId`、`openAttemptId` 与 `threadId` 调用 `await_canvasight_widget_ready`。
4. 观察 30 秒后失败，画布没有非零可见性证据。

## 影响范围

0.4.31 原生宿主验收、Refresh 保存恢复验收、同任务 Run、页面导航、late metadata 门禁，以及后续 GitHub Release 与 `stable` 更新通道。

## 证据

- session: `session-mrq3iskd-172a0ed5`
- open attempt: `open-mrq3iskg-315c191b8e1b`
- widget instance: `widget-3f03522d-93d7-4bc6-8164-52d638083613`
- reported at: `2026-07-18T08:20:02.891Z`
- error: `Canvasight canvas did not become visibly renderable within 30000ms.`
- lifecycle log shows the 0.4.31 session/widget API calls completed and the instance advanced from inline/connecting to fullscreen/hydrating before the visibility timeout.

## 初步归因

MCP、daemon、session binding 与 React mount 已排除为首要失败层；当前聚焦 hydration 后 presentation/layout 可见性、宿主显示模式竞态和启动状态切换。

## 交付给哪个 Agent

Development Agent

## 需要回答的问题

- 为何项目 API 返回后 `hydratedRef` 与画布容器仍未形成可见非零实例？
- 是否存在 fullscreen 元数据与真实 presentation/layout 不一致的竞态？
- 最小修复是否需要新版本与新增原生可见性回归覆盖？

## Closure Criteria

- [ ] 根因明确并写入 solution report
- [ ] 失败路径有针对性自动化覆盖
- [ ] 若修改 runtime/web 工件则升级新版本并重新执行完整候选门禁
- [ ] exact 新候选重启后完成完整原生宿主验收
- [ ] 原发布 issue 明确记录 0.4.31 禁止发布或安全恢复依据

## 当前状态

assigned。Development Agent 已将首次失败定位到 native host presentation geometry，并给出受控前台重验方案；新实例已完成完整 ready，但真实 Refresh、A→B→A、同任务 Run、meaningful control 与 late metadata 验收仍待完成。

## 处理结果

完成只读归因并获得受控前台的新实例 ready 证据；关联验收尚未完成，0.4.31 发布继续停止，远端没有 tag、Release、workflow 或 stable mutation。

## 修改文件

- 本报告。
- `agent-reports/resolved/solution-native-widget-zero-size-0-4-31.md`

## 验证方式

- 原生 instance-bound ready 回执。
- MCP 生命周期日志与 Desktop host 日志。
- 修复后的隔离矩阵和真实原生宿主验收。
- controlled foreground ready: `open-mrq3rbdl-e08223ec591e` / `widget-ba18b1b9-1986-40a8-84ff-c8f541ae2290`, verified 788×794 at `2026-07-18T08:26:07.557Z`.

## 后续风险

首次 0×0 失败必须保留为宿主 presentation 风险；受控前台 ready 不能替代其余真实交互门禁。任何候选工件变化都会使 0.4.31 的既有安装和测试证据失效。
