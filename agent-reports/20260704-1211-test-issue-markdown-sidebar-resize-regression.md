# Markdown 侧边栏无法拖拽调整宽度
## 发现者
测试监督 Agent
## 现象
Canvasight 网页画布打开 Markdown 右侧栏后，画布与侧栏之间的分隔区域无法通过拖拽调整宽度。
## 影响范围
影响 Markdown 预览/编辑侧栏的可读性和画布空间分配。用户无法在大屏或复杂流程中按需要调整画布与侧栏比例。
## 复现步骤
1. 打开 Canvasight 画布。
2. 点击右上 Markdown 预览按钮打开右侧栏。
3. 尝试拖拽画布与右侧栏之间的分隔线。
4. 观察侧栏宽度没有变化。
## 证据
`plugins/canvasight/src/styles/app.css` 仍保留 `.workspace-resize-handle`、`.workspace-content.is-resizing-markdown`、`--canvas-panel-ratio` 和 `--markdown-panel-ratio` 样式，但 `plugins/canvasight/src/App.tsx` 中 resize handle 只是一个无事件处理的 button。
## 初步归因
插件化和全屏画布调整期间保留了 resize handle 的 DOM/CSS，但丢失了拖拽事件和比例状态更新逻辑。
## 交付给哪个 Agent
开发 Agent
## 需要回答的问题
1. 应恢复为比例式 flex 布局，还是固定像素宽度？
2. 是否只允许 Markdown 侧栏拖拽，还是任务列表侧栏也拖拽？
3. 如何验证拖拽后画布和侧栏宽度真实变化？
