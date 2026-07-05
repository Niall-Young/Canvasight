# 移除真实任务节点内的思考深度下拉

## 负责 Agent
开发 Agent

## Root Cause
`TaskNode` footer 直接渲染了 effort picker，并维护 `effortMenuOpen`、`effortOptions`、`effortLabel` 等状态和菜单逻辑。

## 调研过程
1. 搜索 `effort` 相关实现，确认真实画布节点为 `src/components/TaskNode.tsx`。
2. 发现另有 `src/components/ui/canvas-node.tsx` 保留 UI kit 组件，不是当前画布渲染入口。
3. 确认 `.scatter` 类型和运行请求仍需要 `effort` 字段，默认值由 `App.tsx` 继续使用 `xhigh`。

## 可选方案
1. 只通过 CSS 隐藏 `.task-node-effort-picker`。
2. 从 `TaskNode` 中移除控件渲染和相关状态/import，保留数据结构与 UI kit。
3. 连同类型、翻译和 UI kit 中 effort 代码全部删除。

## 推荐方案
采用方案 2。它真正移除真实节点中的控件，避免隐藏式死代码影响交互，同时保留历史数据兼容和组件库代码。

## 实施步骤
1. 删除 `TaskNode` 中 effort picker 的 import、选项、状态和外部点击监听。
2. 删除 footer 中 `.task-node-effort-picker` 的 JSX。
3. 保留 Plan mode 开关和附件按钮。
4. 保留 `App.tsx` 中默认 `effort: "xhigh"` 和运行 payload 兼容。

## 风险与回滚
风险较低。回滚时恢复 `TaskNode` 中 effort picker 的 JSX 和相关状态即可。已有 `.scatter` 文件中的 effort 字段不会被删除。

## 验证方式
1. `npm run typecheck -- --pretty false`
2. `npm run build`
3. `npm run test:mcp`
4. 浏览器检查任务节点内不再出现“极高/Extra high”或 effort 下拉，Plan mode 仍显示。
