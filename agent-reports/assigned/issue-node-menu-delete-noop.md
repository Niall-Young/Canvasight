---
schema_version: 1
report_id: issue-node-menu-delete-noop
report_type: issue
status: assigned
owner: Main Thread
created_by: Main Thread
priority: high
version: 3
agent_id: null
thread_id: 019f567f-9be8-73b0-ba98-47bf33f6d956
created_at: 2026-07-12T13:26:30Z
updated_at: 2026-07-12T13:34:30Z
depends_on: []
related_files:
  - plugins/canvasight/src/components/TaskNode.tsx
  - plugins/canvasight/src/App.tsx
verification_status: failed
verification_evidence:
  - typecheck and build passed for source version 0.4.2+codex.20260712132520
  - isolated browser menu delete changed nodes from 4 to 3 and edges from 3 to 0
  - undo restored nodes and edges to 4 and 3; Backspace regression changed them to 3 and 0
  - real Codex native widget acceptance is unavailable while a concurrent task owns the source version upgrade and TaskNode.tsx
---

# 节点菜单删除点击无响应

## TL;DR

节点可通过 Backspace/Delete 删除，但三点菜单中的“删除”点击后节点不消失。

## 问题描述

节点菜单把删除动作绑定在 `RadixDropdownMenu.Item asChild` 内部按钮的 `onClick`，而键盘路径直接调用画布删除逻辑。Radix 菜单选择和关闭生命周期下，子按钮点击事件在当前运行表面不可靠。

## 复现方式

1. 打开含节点的 Canvasight Page。
2. 点击节点右上角三点菜单。
3. 点击“删除”，观察节点未被删除。
4. 选中同一节点后按 Backspace/Delete，节点可正常删除。

## 影响范围

节点操作菜单的删除入口；底层节点、关联边、撤销历史和持久化删除逻辑未发现缺陷。

## 初步归因

菜单删除使用子按钮 `onClick`，没有使用 Radix Dropdown Menu 的菜单项 `onSelect` 动作语义。

## 期望结果

鼠标点击或键盘激活菜单“删除”均恰好删除菜单所属节点一次，同时移除关联边并保留现有撤销、持久化与键盘多选删除行为。

## Closure Criteria

- [x] 菜单删除绑定到可靠的菜单项选择事件
- [x] 节点与关联边同步删除
- [x] Backspace/Delete 路径无回归
- [x] typecheck、build 和浏览器可见验证通过
- [ ] 方案、修改文件、验证和残余风险已记录

## 当前状态

assigned

## 处理结果

已实施菜单项 `onSelect` 绑定，并延迟到菜单关闭/回焦后的下一帧提交删除，避免 React Flow 用旧节点快照覆盖删除结果。因未完成真实原生 Widget host acceptance，问题保持 assigned。

## 修改文件

- `plugins/canvasight/src/components/TaskNode.tsx`

## 验证方式

- `npm run typecheck`
- `npm run build`
- 隔离项目浏览器可见菜单删除、Undo、Backspace 回归

## 后续风险

浏览器 fallback 已验证交互与撤销，但不能替代 native widget host acceptance。并发任务同时修改 `TaskNode.tsx` 和插件版本，当前不安全安装或提交。
