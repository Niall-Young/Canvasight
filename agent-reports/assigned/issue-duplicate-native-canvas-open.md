---
schema_version: 1
report_id: issue-duplicate-native-canvas-open
report_type: issue
status: assigned
owner: Development Agent
created_by: Main Thread
priority: high
version: 2
agent_id: /root/development_agent
thread_id: 019f5bbf-d635-7f83-8d8e-b8476a72c37d
created_at: 2026-07-13T13:56:01Z
updated_at: 2026-07-13T13:57:26Z
depends_on: []
related_files:
  - plugins/canvasight/mcp/server.source.mjs
  - plugins/canvasight/src/App.tsx
  - plugins/canvasight/skills/canvasight-open/SKILL.md
  - plugins/canvasight/skills/canvasight-open/references/open-workflow.md
  - plugins/canvasight/tests/mcp-smoke.mjs
  - README.md
solution_report: null
verification_status: partial
verification_evidence:
  - Native ready was verified for the second OpenAttempt with fullscreen React, project, render, and visibility evidence.
  - The transcript and lifecycle log prove two same-thread OpenAttempts and multiple widget instances for one project.
  - The empty scatter document advanced from revision 0 to 2 while rejected graph writes remained unwritten.
  - Existing widget-runtime, MCP, and bundle checks pass but do not cover duplicate native mounts with unchanged autosave.
---

# 重复原生 Widget 的无内容保存阻断 AI 写图

## TL;DR

同一任务重复调用 `open_canvasight` 后，多个原生 Widget 实例会对同一未编辑文档触发无内容保存并推进 revision，导致合法的 `merge-active-page` 持续遭遇 `stale_document`。

## 发现者

Main Thread

## 提交 Agent

Main Thread

## 建议交接 Agent

Development Agent

## 问题描述

正常打开应是一次 `open_canvasight` 加一次对应的 `await_canvasight_widget_ready`。本次调用链先创建 `open-mrj9ze35-7fb17c835ae6`，随后又创建 `open-mrj9zhl4-182ef841059b`，只等待第二次。两个 Session 后续都保留原生实例；空白 Page 的 UI 保存把 revision 从 0 推到 1、再推到 2，AI 写图的乐观锁因此连续失效。

首次写图还包含一个独立的 Agent 候选错误：`acceptance-criteria` 同时存在两个父边，校验器以 `multiple_parents` 正确拒绝。该边在下一轮已经移除，不是后续 revision 漂移的原因。

## 现象

- 同一 Codex 回复展示两个 `open_canvasight` 调用，MCP lifecycle 记录两个 Session/OpenAttempt 与多个 fullscreen `widgetInstanceId`。
- 第二个 OpenAttempt 的 ready 真实通过：`verified=true`、`displayMode=fullscreen`、React/水合/渲染/可见性均为真。
- 第一次写图以 `multiple_parents` 拒绝且 revision 保持 0；修复拓扑后两次分别在服务端 revision 1 和 2 遭遇 `stale_document`。
- `.scatter/scatter.json` 仍为 0 节点/0 边，但 `updatedAt` 被刷新，证明推进 revision 的是另一条空白文档保存路径，不是成功写图。

## 复现方式

1. 在同一 task/project 调用两次 `open_canvasight`，保留两个原生 Widget 实例。
2. 对空白 Page 静置或触发原生实例重挂载，读取 `get_canvasight_graph_context` 的 revision。
3. 使用刚读取的 revision 提交合法 `merge-active-page`；观察空白 UI 保存先推进 revision，写图返回 `stale_document`。

## 影响范围

原生画布打开、AI graph-first 写入、同项目多实例并发、自动保存与 revision 乐观锁。

## 证据

- 附件中的两个 OpenAttempt：`open-mrj9ze35-7fb17c835ae6` 与 `open-mrj9zhl4-182ef841059b`。
- 生命周期日志同时记录两个 attempt 的多个 fullscreen 实例持续上报 `hydrating_project` 并产生密集 `canvasight_widget_api` 请求。
- `plugins/canvasight/mcp/server.source.mjs` 的 graph validation 在失败时直接返回，只有成功写图或 `/document` 保存才 bump revision。
- `plugins/canvasight/src/App.tsx` 仅通过一次性 `skipNextSaveRef` 跳过水合保存，后续状态依赖变化仍会 debounce `saveDocument`；服务端 `/document` 对未变内容也会 bump revision。
- 当前 repo 与已安装 0.4.12 bundle 一致，`codex plugin list` 指向 repo source，不是 stale install。

## 初步归因

两层问题叠加：调用流程没有把一次 open + exact await 保持为不可分割动作，重复 open 创建了并存 Session；运行时又没有对 superseded instance 或未变文档保存做保护，使多个实例能够推进同一项目 revision。

## 交付给哪个 Agent

Development Agent

## 需要回答的问题

- 如何让同一 thread/project 的新 OpenAttempt 显式 supersede 旧 Session/实例，并阻止旧实例继续调用 mutating `/document`？
- 如何用 dirty tracking 或内容 hash 保证 hydration/remount/reload 不保存未变化文档、不推进 revision？
- 如何在保留真实用户并发编辑保护的同时，让 AI merge 在原生 Widget 打开时稳定成功？

## 相关文件

- `plugins/canvasight/mcp/server.source.mjs`
- `plugins/canvasight/src/App.tsx`
- `plugins/canvasight/skills/canvasight-open/`
- `plugins/canvasight/tests/mcp-smoke.mjs`
- `README.md`

## 期望结果

一次打开只产生一个当前可写的 fullscreen instance；重复打开会安全 supersede 旧实例；无用户编辑的 hydration/remount 不保存、不 bump revision；合法 AI merge 在画布打开时可稳定写入并被当前实例刷新。

## Closure Criteria

- [ ] 同 thread/project 的新 OpenAttempt 会 supersede 或关闭旧 Session/实例
- [ ] superseded instance 无法再执行 mutating document save
- [ ] hydration/remount/reload 的未变文档保存次数为 0，revision 不增长
- [ ] 回归测试覆盖重复 open、多实例、空白文档和并行 AI merge
- [ ] Skill 和参考流程明确一次 open 加对应 exact await
- [ ] 双语 README 同步
- [ ] 版本、bundle、分发和插件验证通过
- [ ] 真实 Codex native-host 完成 ready、控件、同任务 Run、late metadata 验收

## 当前状态

assigned

## 处理结果

根因已确认，待 Development Agent 设计并实现保护。

## 修改文件

- 待实现。

## 验证方式

- 已通过：`npm run test:widget-runtime`、`npm run test:mcp`、`npm run check:mcp-bundle`。
- 未覆盖：真实 native-host 重复 mount 与未变 autosave 回归。
- `npm run typecheck` 受本地 `node_modules/@types/* 3` 异常目录阻断，与本故障无直接因果。

## 后续风险

简单“重新打开画布”可能再创建一个未关闭实例而加重竞争；修复前的恢复动作应只保留一个 open + exact await，并在 revision 稳定后重新读取 context 再写。真实原生宿主仍需完整验收。
