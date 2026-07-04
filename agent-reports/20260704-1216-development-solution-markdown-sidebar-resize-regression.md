# 恢复 Markdown 侧边栏拖拽调整宽度
## 负责 Agent
开发 Agent
## Root Cause
插件化迁移和后续全屏画布调整中，保留了 `.workspace-resize-handle` 及比例 CSS 变量样式，但 `App.tsx` 中没有保留拖拽事件和比例状态更新逻辑，导致分隔线无法调整 Markdown 侧栏宽度。
## 调研过程
1. 搜索 resize 相关代码，确认 CSS 中仍有 `.workspace-content.is-resizing-markdown`、`.workspace-resize-handle`、`--canvas-panel-ratio`、`--markdown-panel-ratio`。
2. 检查 `App.tsx`，确认 handle 只是无事件 button。
3. 浏览器真实拖拽首轮验证发现 pointer down 生效，但自动化 drag 主要产生 mouse move/up，因此需要 pointer 与 mouse 兜底同时支持。
## 可选方案
1. 固定像素宽度：实现简单，但 viewport 变化时体验较差。
2. 继续使用现有 flex grow 比例变量：符合现有 CSS 设计，拖拽后可以随窗口变化保持比例。
3. 改造 RightDrawer 内部管理宽度：改动范围更大，容易影响任务列表和 Markdown 组件。
## 推荐方案
使用现有 `--canvas-panel-ratio` 和 `--markdown-panel-ratio`。在 workspace 上维护比例状态，拖拽 handle 时根据鼠标 X 坐标计算画布与 Markdown 面板比例。只在 `drawer === "markdown"` 时启用拖拽。
## 实施步骤
1. 为 workspace 增加 `ref` 和 `style`，传入 canvas/markdown 比例变量。
2. 为 resize handle 增加 pointer down/move/up/cancel 处理。
3. 增加 window 级 `mousemove`、`mouseup` 和 `blur` 兜底，保证真实鼠标拖拽和浏览器自动化 drag 都能结束 resizing 状态。
4. 设置最小画布宽度和最小 Markdown 宽度，避免拖拽后任一区域被压到不可用。
## 风险与回滚
风险是小屏下最小宽度约束影响可拖范围。当前实现按可用宽度动态计算最小值，避免总最小宽度超过容器。回滚可删除比例状态、workspace style 和 handle 事件，恢复为固定 1:1。
## 验证方式
1. `npm run typecheck -- --pretty false`
2. `npm run build`
3. `npm run test:mcp`
4. `validate_plugin.py`
5. 浏览器真实验证：打开临时 Canvasight 项目，选中节点打开 Markdown 侧栏，拖拽分隔线 220px，画布从 634px 变 420px，侧栏从 634px 变 848px，控制台无报错。
