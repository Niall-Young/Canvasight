# 拆分 Markdown 预览目标与当前画布选择

## 负责 Agent
开发 Agent

## Root Cause
`selectedNodeId` 同时承担了画布选择状态和 Markdown 预览目标。画布取消选择会把 `selectedNodeId` 置空，随后 `markdownResult` 清空，并且按钮因为 `disabled={!selectedNode}` 无法再触发关闭。

## 调研过程
1. 检查 `App.tsx` 中 `markdownResult`、`toggleMarkdownDrawer` 和右上 toolbar 按钮。
2. 确认 `markdownResult` 由 `selectedNode` 生成。
3. 确认 `toggleMarkdownDrawer` 在没有 `selectedNode` 时直接 return。
4. 确认按钮在没有 `selectedNode` 时 disabled，因此即使 `drawer === "markdown"` 也无法收起。

## 可选方案
1. 取消选择时自动关闭 Markdown 面板。
2. 面板打开时禁止取消选择。
3. 新增独立 `markdownNodeId`，让 Markdown 面板记住最后一次预览目标，取消选择只影响画布选择，不影响预览和关闭。

## 推荐方案
采用方案 3。它符合用户“取消了选择”这个操作预期，同时保留面板内容和收起能力，不引入新的选择限制。

## 实施步骤
1. 在 `CanvasightWorkspace` 中新增 `markdownNodeId`。
2. 选中节点时同步更新 `markdownNodeId`，删除节点时清理无效预览目标。
3. `markdownResult` 改为使用 `markdownNode` 生成。
4. `toggleMarkdownDrawer` 在面板已打开时允许无条件关闭。
5. 按钮禁用条件改为只有“面板关闭且没有可预览节点”时禁用。
6. `RightDrawer` 接收 `markdownNodeId`，下载 Markdown 时优先用预览节点标题命名。

## 风险与回滚
风险集中在 Markdown 预览目标更新时机。回滚可移除 `markdownNodeId` 并恢复 `markdownResult` 使用 `selectedNode`。

## 验证方式
1. `npm run typecheck -- --pretty false`
2. `npm run build`
3. `npm run test:mcp`
4. 浏览器验证：选中节点打开 Markdown，点击空白取消选择，确认 Markdown 内容保留且按钮可收起。
