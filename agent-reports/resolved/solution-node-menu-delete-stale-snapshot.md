---
schema_version: 1
report_id: solution-node-menu-delete-stale-snapshot
report_type: solution
status: resolved
owner: Development Agent
created_by: Development Agent
priority: high
version: 1
agent_id: /root/development_agent
thread_id: null
created_at: 2026-07-12T13:51:06Z
updated_at: 2026-07-12T13:51:06Z
depends_on:
  - issue-node-menu-delete-noop
related_files:
  - plugins/canvasight/src/App.tsx
  - plugins/canvasight/src/components/TaskNode.tsx
verification_status: passed
verification_evidence:
  - reproduced old behavior as nodes 4 and edges 0 after menu delete
  - fixed build remained at nodes 3 and edges 0 after one second and reload
  - one Undo and one Redo restored and removed the node exactly once
---

# 节点删除旧快照竞态解决方案

## Root Cause

菜单关闭后的 XYFlow 选择事件使用渲染期节点闭包，把刚删除的节点写回。上一轮的动画帧延迟无法保证事件顺序；同版本插件缓存又使旧 bundle 可继续运行。

## 推荐方案与实施

- 删除、选择和 `onNodesChange` 在提交时读取 Zustand 最新节点状态。
- pointer `onClick` 与 keyboard `onSelect` 共用幂等删除动作，目标不存在时直接返回，避免双历史记录。
- 升级并安装 `0.4.3+codex.20260712134902`，使 Codex 不再复用 `0.4.2` 缓存。

## 验证方式

- TypeScript typecheck 与 production build。
- 隔离项目 Playwright 菜单点击，等待一秒后检查 DOM 与 `.scatter/scatter.json`。
- 单次 Undo、单次 Redo、reload 持久化检查。

## 后续风险

真实 fullscreen native Widget 仍需重启 Codex Desktop 后在新任务验收，因此 issue 暂不关闭。
