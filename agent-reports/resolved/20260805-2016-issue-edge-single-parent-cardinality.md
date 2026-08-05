---
status: resolved
report_type: issue
owner: Development Agent
created_by: main-thread
priority: critical
created_at: 2026-08-05 20:16
updated_at: 2026-08-05 20:43
related_files:
  - plugins/canvasight/src/App.tsx
  - plugins/canvasight/src/store/scatterStore.ts
  - plugins/canvasight/mcp/server.source.mjs
  - plugins/canvasight/tests/single-parent-edge-smoke.mjs
solution_report: agent-reports/resolved/20260805-2028-development-edge-single-parent-solution.md
---

# Edge 目标节点允许多个父节点

## TL;DR

Canvasight 当前只拒绝重复的 source-target 对，没有强制目标节点最多一条入边，导致 Task/Asset 可同时连接多个父节点。

## 发现者

用户

## 提交 Agent

Main Thread

## 建议交接 Agent

Development Agent

## 问题描述

Edge 是有向的父子/依赖关系。根节点允许没有入边；Task/Asset 一旦作为子节点连接，就必须只有一个父节点。当前 UI、AI 写图和并发合并需要共享这一硬约束。

## 现象

同一个视频 Asset 左侧出现三条入边，三个上游节点同时成为其父节点。

## 复现方式

1. 创建两个以上 Task/Asset 源节点和一个目标节点。
2. 将第一个源节点连接到目标节点。
3. 再将其他源节点连接到同一目标节点；当前实现仍接受连接。

## 影响范围

手动画布连线、React Flow Edge change、AI Graph Writer、旧文档加载与人工/AI 并发重基。

## 证据

- `node tests/single-parent-edge-smoke.mjs` 连续两次稳定失败：第二个父节点实际返回 `true`。
- `isConnectionAllowed` 只检查自环、重复 source-target 和 Group 端点。
- MCP smoke 仍显式接受名为 `Multiple Evidence Inputs` 的多父图。

## 初步归因

单父约束没有成为跨入口的数据不变量，只存在于从已连接 target handle 开始拖动这一条局部交互保护中。

## 交付给哪个 Agent

Development Agent

## 需要回答的问题

- 所有 Edge 写入口如何统一拒绝第二条入边？
- 并发分支分别给同一 target 加父边时如何进入冲突副本而非合并成脏图？
- 旧脏数据应如何确定性恢复且避免继续扩散？

## 相关文件

- `plugins/canvasight/src/App.tsx`
- `plugins/canvasight/src/store/scatterStore.ts`
- `plugins/canvasight/mcp/server.source.mjs`
- `plugins/canvasight/tests/`

## 期望结果

根节点可有 0 条入边；所有 Task/Asset target 最多 1 条入边。第二父连接被拒且已有边保持不变，AI 写入和并发合并不能持久化多父图。

## Closure Criteria

- [x] 问题原因明确
- [x] 方案报告已回写
- [x] 修改文件已记录
- [x] 验证方式已记录
- [x] 后续风险已记录

## 当前状态

resolved

## 处理结果

已完成 UI、Store、普通保存、AI Graph Writer 与并发合并的单父约束修复。旧脏文档加载保持无损，保存只能保持或降低同 target 入边数；新图严格拒绝多父；被拒绝的拖线不会改变 selection；Task/Asset 已占用 target Handle 不再可连接或显示 add-parent button。

## 修改文件

- `plugins/canvasight/src/App.tsx`
- `plugins/canvasight/src/components/TaskNode.tsx`
- `plugins/canvasight/src/components/AssetNode.tsx`
- `plugins/canvasight/src/store/scatterStore.ts`
- `plugins/canvasight/mcp/server.source.mjs`
- `plugins/canvasight/mcp/server.mjs`
- `plugins/canvasight/tests/single-parent-edge-smoke.mjs`
- `plugins/canvasight/tests/concurrent-document-smoke.mjs`
- `plugins/canvasight/tests/mcp-smoke.mjs`
- `plugins/canvasight/package.json`
- `plugins/canvasight/package-lock.json`
- `plugins/canvasight/.codex-plugin/plugin.json`

## 验证方式

- 红测：修复前 `node tests/single-parent-edge-smoke.mjs` 稳定失败，第二父返回 `true`。
- 绿测：`npm run test:single-parent`
- `npm run test:mcp`
- `npm run test:concurrency`
- `npm run typecheck`
- `npm run check:mcp-bundle`
- `npm run build`
- `npm run release:verify -- 0.5.3`
- 拒绝路径 selection 无副作用已加入 `test:single-parent` 静态契约并通过，最终真实浏览器复测通过。

## 后续风险

历史多父 Edge 不会自动清理，需要用户显式删除。最终真实浏览器已验证 Task/Asset 第二父拒绝、占用态入口、删除后恢复、零 selection/history/revision 副作用和 0 console errors/warnings；native Codex host 不属于本轮 invariant 门禁，保持 unverified。
