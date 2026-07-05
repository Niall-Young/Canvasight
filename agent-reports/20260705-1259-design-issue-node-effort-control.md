# 节点内思考深度控件需要移除

## 发现者
设计 Agent

## 现象
任务节点底部显示“极高/高/中/低”的思考深度下拉控件，占用节点 footer 空间。

## 影响范围
影响 Canvasight 画布任务节点的视觉密度和操作焦点，用户明确要求取消节点里的思考深度。

## 复现步骤
1. 打开 Canvasight 画布。
2. 选中或悬停任务节点，让 footer 操作区显示。
3. 观察节点底部 Plan mode 左侧的“极高”下拉。

## 证据
`plugins/canvasight/src/components/TaskNode.tsx` 中渲染了 `.task-node-effort-picker`，使用 `DropdownTrigger` 展示 `effortLabel`。

## 初步归因
客户端时代节点保留了每个节点单独设置推理强度的控件，但网页插件当前界面希望更简化，节点内不再暴露该设置。

## 交付给哪个 Agent
开发 Agent

## 需要回答的问题
如何移除真实任务节点里的思考深度控件，同时不破坏 `.scatter` 数据兼容和运行 payload 中的默认 effort。
