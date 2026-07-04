# 恢复右侧栏白色背景
## 负责 Agent
开发 Agent
## Root Cause
`.right-drawer` 使用 `background: transparent`，在网页全屏画布中会透出 `.workspace-content` 的灰色画布背景，导致 Markdown 侧栏看起来不是独立白色侧边栏。
## 调研过程
1. 检查 `app.css` 颜色变量，确认浅色主题 `--color-background-surface` 为 `#FFFFFF`，画布背景 `--color-background-canvas` 为 `#F2F2F2`。
2. 检查 `.right-drawer`，确认背景为 `transparent`。
3. 检查 Canvasight 专属 override，确认仅移除了 backdrop blur，没有提供 drawer 背景。
## 可选方案
1. 给 `.markdown-pane` 加白色背景：只修 Markdown，任务列表侧栏仍透明。
2. 给 `.right-drawer.is-markdown` 加白色背景：只修当前截图，但侧栏组件语言不统一。
3. 给 `.right-drawer` 本体加 surface 背景：任务列表和 Markdown 侧栏都恢复白色侧边栏层级。
## 推荐方案
给 `.right-drawer` 设置 `background: var(--color-background-surface)`。保留 `backdrop-filter: none`，不恢复桌面客户端的玻璃态。
## 实施步骤
1. 修改 `plugins/canvasight/src/styles/app.css` 中 `.right-drawer` 背景。
2. 重新构建插件产物。
3. 在浏览器打开 Markdown 侧栏，验证 computed background。
## 风险与回滚
风险较低。变更只影响右侧栏背景，不影响拖拽比例、Markdown pane padding 或按钮组件。回滚只需恢复 `.right-drawer` 的 `background: transparent`。
## 验证方式
1. `npm run typecheck -- --pretty false`
2. `npm run build`
3. `npm run test:mcp`
4. `validate_plugin.py`
5. 浏览器测量：画布背景为 `rgb(242, 242, 242)`，右侧 drawer 背景为 `rgb(255, 255, 255)`，无 backdrop blur、无横向溢出，控制台无报错。
