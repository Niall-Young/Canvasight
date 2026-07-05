# 左键拖拽框选多选缺失

## 发现者
测试监督 Agent

## 现象
Canvasight 画布中按住左键拖拽空白区域时，无法出现框选矩形，也无法一次选中多个任务节点。

## 影响范围
影响画布基础编辑效率，多个节点无法通过框选批量选中，只能逐个点击。

## 复现步骤
1. 打开 Canvasight 画布。
2. 保持选择工具状态。
3. 在画布空白区域按住左键并拖过多个节点。
4. 观察是否出现框选矩形和多个节点选中态。

## 证据
`plugins/canvasight/src/App.tsx` 里 `ReactFlow` 设置了 `selectionKeyCode={null}`，但没有启用 `selectionOnDrag`。同时 `app.css` 中 `.canvas-shell:not(.is-shift-selecting) .react-flow__selection` 会隐藏框选矩形，而当前网页版本没有维护 `is-shift-selecting` 状态类。

## 初步归因
从客户端迁移到网页时，原来的框选状态类和 React Flow 框选开关没有同步迁入，导致框选交互和视觉都被关闭。

## 交付给哪个 Agent
开发 Agent

## 需要回答的问题
如何恢复选择工具下左键拖拽框选多选，同时不破坏手形工具的拖动画布。
