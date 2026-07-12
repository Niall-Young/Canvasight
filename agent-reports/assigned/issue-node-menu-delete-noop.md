---
schema_version: 1
report_id: issue-node-menu-delete-noop
report_type: issue
status: assigned
owner: Main Thread
created_by: Main Thread
priority: high
version: 4
agent_id: null
thread_id: 019f5691-8d32-7c93-b74a-d5dc86c1c474
created_at: 2026-07-12T13:26:30Z
updated_at: 2026-07-12T13:51:06Z
depends_on: []
related_files:
  - plugins/canvasight/src/components/TaskNode.tsx
  - plugins/canvasight/src/App.tsx
verification_status: failed
verification_evidence:
  - version 0.4.2 reproduced the failure as edges 3 to 0 while nodes remained 4
  - version 0.4.3 isolated browser menu delete remained at nodes 3 and edges 0 after one second
  - one Undo restored nodes and edges to 4 and 3; one Redo removed them again to 3 and 0
  - reload preserved nodes 3 and edges 0
  - real Codex native widget acceptance requires a restarted Codex Desktop host and a newly tagged task
---

# 节点菜单删除点击无响应

## TL;DR

节点可通过 Backspace/Delete 删除，但三点菜单中的“删除”点击后节点不消失。

## 问题描述

删除动作与 React Flow 的选择回调都捕获渲染期 `nodes`。菜单关闭和焦点恢复触发迟到的选择事件后，旧节点快照会覆盖删除结果，表现为关联边已删除但节点被写回。上一轮增加 `requestAnimationFrame` 只改变时序，并未消除旧快照竞态。

## 复现方式

1. 打开含节点的 Canvasight Page。
2. 点击节点右上角三点菜单。
3. 点击“删除”，观察节点未被删除但关联边消失。
4. 选中同一节点后按 Backspace/Delete，节点可正常删除。

## 初步归因

菜单删除、节点选择和 `onNodesChange` 没有在提交时读取 Zustand 最新节点状态；此外同版本插件缓存会让已打开的 Codex host 继续使用旧 bundle。

## 期望结果

鼠标点击或键盘激活菜单“删除”均恰好删除菜单所属节点一次，同时移除关联边并保留现有撤销、持久化与键盘多选删除行为。

## Closure Criteria

- [x] 菜单删除绑定到可靠的 pointer 与 keyboard 激活事件
- [x] 节点与关联边同步删除
- [x] 一次 Undo / Redo 对应一次删除历史
- [x] typecheck、build、延迟与 reload 浏览器验证通过
- [x] 方案、修改文件、验证和残余风险已记录
- [ ] 重启 Codex Desktop 后完成真实 fullscreen native Widget 删除验收

## 当前状态

assigned

## 处理结果

删除、选择和 XYFlow change 回调改为在提交时读取 Zustand 最新节点；菜单 pointer 与 keyboard 激活均调用幂等删除动作。已升级并安装 `0.4.3+codex.20260712134902`，浏览器持久化回归通过。因未重启当前 Codex Desktop 完成真实原生 Widget host acceptance，问题保持 assigned。

## 修改文件

- `plugins/canvasight/src/components/TaskNode.tsx`
- `plugins/canvasight/src/App.tsx`
- 插件版本与 `dist/` 构建产物

## 验证方式

- `npm run typecheck`
- `npm run build`
- 隔离项目浏览器可见菜单删除、1 秒稳定性、Undo、Redo 与 reload 回归

## 后续风险

浏览器 session 已验证交互、撤销与持久化，但不能替代 native widget host acceptance。Codex Desktop 必须重启后在新建且重新标记的任务中验证精确 `0.4.3` 版本。
