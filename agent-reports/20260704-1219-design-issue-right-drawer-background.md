# 右侧栏背景透出画布灰底
## 发现者
设计 Agent
## 现象
Markdown 右侧栏打开后，侧栏区域呈现画布灰色背景，而不是白色侧边栏背景。
## 影响范围
影响 Markdown 源码/预览侧栏，也会影响任务列表侧栏的一致性。侧栏与画布缺少明确层级区分。
## 复现步骤
1. 打开 Canvasight 画布。
2. 选中节点并打开 Markdown 右侧栏。
3. 观察侧栏整体背景颜色。
## 证据
`plugins/canvasight/src/styles/app.css` 中 `.right-drawer` 使用 `background: transparent`，导致侧栏透出 `.workspace-content` 的 `var(--color-background-canvas)`。
## 初步归因
网页全屏化时为了去掉桌面壳的玻璃/模糊效果，把 drawer 保持为透明背景，但没有恢复网页侧边栏应有的白色 surface。
## 交付给哪个 Agent
开发 Agent
## 需要回答的问题
1. 背景应该加在 drawer 本体还是 Markdown pane 内部？
2. 是否会影响拖拽调整宽度和 Markdown pane 安全边距？
3. 浏览器 computed background 是否为白色 surface？
