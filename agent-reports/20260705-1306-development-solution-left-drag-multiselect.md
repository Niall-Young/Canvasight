# 恢复选择工具下左键拖拽框选

## 负责 Agent
开发 Agent

## Root Cause
React Flow 的框选需要 `selectionOnDrag` 或选择键触发；当前代码把 `selectionKeyCode` 设为 `null`，又未设置 `selectionOnDrag`，所以左键拖拽不会进入框选模式。CSS 还依赖已经不存在的 `.is-shift-selecting` 类隐藏了 `.react-flow__selection`。

## 调研过程
1. 查阅本地 `@xyflow/react` 类型定义，确认 `selectionOnDrag` 用于无需按选择键的框选。
2. 对比原 Scatter 客户端实现，确认原迁移逻辑存在 `is-shift-selecting` 状态类和 `selectionOnDrag`。
3. 当前 Canvasight 网页版本没有这些状态类，因此 CSS 隐藏规则变成永久隐藏框选矩形。

## 可选方案
1. 完整恢复原客户端的 Shift 框选状态机。
2. 在选择工具下直接开启左键拖拽框选，手形工具下仍拖动画布。
3. 手写一个覆盖在 React Flow 上的框选层。

## 推荐方案
采用方案 2。它满足用户提出的“按住左键多选”，复用 React Flow 原生选择逻辑，并与现有 `select/pan` 工具模型一致。

## 实施步骤
1. 在 `ReactFlow` 上设置 `selectionOnDrag={!panModeActive}`。
2. 保持 `panOnDrag={panModeActive}`，手形工具仍用于平移画布。
3. 移除依赖 `.is-shift-selecting` 的框选矩形隐藏规则。
4. 保留 `.react-flow__nodesselection { display: none; }`，框选完成后不显示持续存在的群组选框。

## 风险与回滚
风险是选择工具下拖动画布不再平移，但当前设计中画布平移已经由手形工具和空格临时平移承担。回滚时删除 `selectionOnDrag` 并恢复 CSS 隐藏规则。

## 验证方式
1. `npm run typecheck -- --pretty false`
2. `npm run build`
3. `npm run test:mcp`
4. 浏览器验证选择工具下左键拖拽可多选多个节点，手形工具仍可拖动画布。
