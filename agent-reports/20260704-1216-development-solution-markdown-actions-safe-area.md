# 恢复 Markdown 操作按钮安全边距
## 负责 Agent
开发 Agent
## Root Cause
Canvasight 网页全屏化后，右侧 Markdown drawer 不再从桌面壳或外层容器获得留白，而 `.markdown-pane` 本身只有 `gap` 没有 padding，导致 header actions 贴近右上边缘。
## 调研过程
1. 检查 `RightDrawer.tsx`，确认下载和复制按钮位于 `.markdown-actions`，由 `.markdown-sidebar-heading` 承载。
2. 检查 CSS，确认 `.markdown-pane` 只有 `gap: 12px`，没有安全区。
3. 对比当前视觉截图，问题集中在 Markdown pane 的边缘留白，而非按钮组件本身。
## 可选方案
1. 给 `.markdown-actions` 单独加 `margin-right`：只修右侧按钮，左侧模式切换和正文仍贴边。
2. 给 `.markdown-sidebar-heading` 加 padding：只修 header，Markdown 内容仍贴边。
3. 给 `.markdown-pane` 加统一 padding：header 和内容共享安全边距，结构最稳定。
## 推荐方案
给 `.markdown-pane` 添加 `padding: 16px` 和 `box-sizing: border-box`。这样右上按钮、左侧模式切换、Markdown 源码/预览内容都在同一安全区内，且不会改变 drawer 外部宽度和拖拽比例逻辑。
## 实施步骤
1. 在 `plugins/canvasight/src/styles/app.css` 的 `.markdown-pane` 增加 16px padding。
2. 保持 `.markdown-source` 和 `.markdown-preview` 为 flex scroll 区，不额外增加重复 padding。
3. 构建并在浏览器中量测按钮安全距离。
## 风险与回滚
风险是内容区可用宽度减少 32px，但这是安全边距的预期结果。回滚只需移除 `.markdown-pane` 的 padding 和 box-sizing。
## 验证方式
1. `npm run typecheck -- --pretty false`
2. `npm run build`
3. `npm run test:mcp`
4. `validate_plugin.py`
5. 浏览器测量：`.markdown-actions` 到 drawer/pane/viewport 右侧均为 16px，heading 到 pane 顶部为 16px，无横向溢出，控制台无报错。
