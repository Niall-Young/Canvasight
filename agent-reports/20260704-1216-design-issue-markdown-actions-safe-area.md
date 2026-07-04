# Markdown 右上操作按钮缺少安全边距
## 发现者
设计 Agent
## 现象
Markdown 右侧栏打开后，下载和复制两个操作按钮贴近窗口右上边缘，缺少安全边距。
## 影响范围
影响 Markdown 预览/源码面板的视觉稳定性和操作舒适度。按钮靠边会显得像浏览器或窗口控件，也降低了命中区域的感知安全感。
## 复现步骤
1. 打开 Canvasight 画布。
2. 选中节点并打开 Markdown 右侧栏。
3. 观察右上角下载、复制按钮与窗口边缘的距离。
## 证据
`plugins/canvasight/src/styles/app.css` 中 `.markdown-pane` 只有 `gap: 12px`，没有 padding；`.markdown-sidebar-heading` 直接贴在 pane 内容边界上。
## 初步归因
全屏网页化后右侧 drawer 不再有桌面壳或外层留白，Markdown pane 没有独立安全区，导致 header actions 贴边。
## 交付给哪个 Agent
开发 Agent
## 需要回答的问题
1. 安全边距应加在按钮组上还是 Markdown pane 容器上？
2. 增加 padding 后是否会破坏 Markdown 内容滚动区高度？
3. 视觉验证里按钮到右边和顶部的距离是否稳定？
