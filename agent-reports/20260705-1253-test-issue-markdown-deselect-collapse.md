# Markdown 面板取消选择后清空且无法收起

## 发现者
测试监督 Agent

## 现象
用户先选中一个节点并打开 Markdown 预览，再点击画布空白处取消节点选择后，右侧 Markdown 面板会失去预览内容，并且顶部 Markdown 按钮变为不可用，无法再次点击收起面板。

## 影响范围
影响 Canvasight 右侧 Markdown 预览面板的基础交互，用户容易停留在一个空白且无法收起的侧栏状态。

## 复现步骤
1. 打开 Canvasight 画布。
2. 选择一个任务节点。
3. 点击右上 Markdown 预览按钮打开右侧面板。
4. 点击画布空白处取消选择。
5. 再点击右上 Markdown 预览按钮尝试收起。

## 证据
`plugins/canvasight/src/App.tsx` 中 `markdownResult` 直接依赖 `selectedNode`，取消选择后会回退为空 Markdown；同时 Markdown 按钮设置了 `disabled={!selectedNode}`，面板打开后取消选择也无法点击关闭。

## 初步归因
Markdown 面板的“预览目标节点”和 React Flow 的“当前选中节点”被绑定成同一个状态，导致取消选择时预览上下文和关闭入口同时丢失。

## 交付给哪个 Agent
开发 Agent

## 需要回答的问题
如何在保留取消选择行为的同时，让已打开的 Markdown 面板继续展示最后一次预览内容，并保持关闭按钮可用。
