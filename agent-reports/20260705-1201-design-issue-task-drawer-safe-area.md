# 任务清单 Drawer 展开后内容贴边
## 发现者
设计 Agent
## 现象
点击任务清单展开右侧 drawer 后，标题和任务条目贴在面板顶部、左侧和右侧边缘，没有与 Markdown 侧栏一致的安全边距。
## 影响范围
影响任务清单 drawer 的视觉质量和可读性；展开态像被裁切，和已修复的 Markdown drawer 安全边距不一致。
## 复现步骤
1. 打开 Canvasight 画布。
2. 点击右上角任务清单按钮。
3. 观察右侧任务清单 drawer 的标题和第一条任务贴边。
## 证据
浏览器测量修复前：`.right-drawer.is-tasks.is-open` 宽度为 288px，`.right-sidebar-title` 与 `.kit-task-item` 到 drawer 左边距为 0px，任务条目到右边距为 0px，标题到顶部为 0px。
## 初步归因
`.markdown-pane` 有 `padding: 16px`，但任务分支 `.task-sidebar` 没有对应 padding，导致 tasks drawer 展开后内容直接占满整个 panel。
## 交付给哪个 Agent
开发 Agent
## 需要回答的问题
1. 任务清单 drawer 是否应复用 Markdown pane 的 16px 安全边距？
2. 补 padding 后 task item 宽度是否仍能正常响应 drawer 宽度？
3. 是否会影响 markdown drawer 或 canvas resize 行为？
