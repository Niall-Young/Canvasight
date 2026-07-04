# 恢复节点悬停相连线条高亮
## 负责 Agent
开发 Agent
## Root Cause
插件化迁移后，边组件和 CSS 仍保留 `data.active` / `.scatter-edge-path.is-active` 的高亮能力，但普通节点 hover 状态没有传入 `flowEdges`。现有 active 计算只覆盖选中节点和连线预览节点，因此鼠标悬停节点时相连边保持默认灰色。
## 调研过程
1. 检查 `ScatterEdge`，确认它会根据 `data.active` 输出 `scatter-edge-path is-active`。
2. 检查 `app.css`，确认 `.scatter-edge-path.is-active` 使用 `var(--color-primary)`。
3. 检查 `flowEdges`，确认 active node 集合缺少普通 hover 节点。
4. 检查 React Flow 节点事件和 `TaskNode` 组件，确认节点内部元素 hover 不应依赖单一 React Flow 事件路径。
5. 用浏览器测试页验证初始边为灰色，悬停后边 class 变为 `react-flow__edge-path scatter-edge-path is-active`，stroke 变为 `rgb(8, 98, 253)`，移出后恢复灰色。
## 可选方案
1. 只在 `onNodeMouseEnter` / `onNodeMouseLeave` 里维护 `hoveredNodeId`。改动小，但如果事件被节点内部交互层拦截，会有回归风险。
2. 在 `TaskNode` 内部显式上报 hover。更贴近组件边界，但对 React Flow wrapper 外层状态不够完整。
3. 同时在 React Flow 节点事件、`TaskNode` 根元素、画布外层 mouse move 中维护 hover。覆盖真实用户 hover 和浏览器自动化路径，仍复用现有 edge active 样式。
## 推荐方案
采用方案 3。复用已有 `data.active` 和 CSS，不新增视觉体系；只补齐 hover 状态传递路径，保证选中节点、连接预览和普通 hover 都能触发同一套边高亮。
## 实施步骤
1. 为 `CanvasightWorkspace` 增加 `hoveredNodeId` 状态。
2. 让 `flowEdges` 接收 `hoveredNodeId`，并纳入 active node 集合。
3. 在 React Flow `onNodeMouseEnter` / `onNodeMouseLeave` 中维护 hover 状态。
4. 在 `TaskNode` runtime actions 中加入 `setNodeHover`，由节点根元素上报 hover。
5. 在 app shell 的 `onMouseMove` 中从 `.react-flow__node[data-id]` 回推当前节点，作为浏览器事件路径兜底；离开 app shell 时清空 hover。
## 风险与回滚
风险：画布移动时频繁触发 `setHoveredNodeId`。实现中只在目标节点变化时更新，避免无意义重渲染。回滚时可移除 `hoveredNodeId` 状态、`setNodeHover` action 和 `flowEdges` 参数扩展，边组件与 CSS 不需要改动。
## 验证方式
1. `npm run typecheck -- --pretty false`
2. `npm run build`
3. `npm run test:mcp`
4. `python3 /Users/niallyoung/.codex/skills/.system/plugin-creator/scripts/validate_plugin.py /Users/niallyoung/Desktop/Canvasight/plugins/canvasight`
5. `codex plugin add canvasight@canvasight-local`
6. `codex plugin list | rg -n "canvasight|Canvasight|canvasight-local"`
7. 浏览器验证：打开测试会话，悬停 `hover-node-a` 后 `.scatter-edge-path.is-active` 数量为 1，stroke 为 `rgb(8, 98, 253)`；鼠标移出后 active 数量为 0，stroke 恢复 `rgb(184, 184, 184)`。
