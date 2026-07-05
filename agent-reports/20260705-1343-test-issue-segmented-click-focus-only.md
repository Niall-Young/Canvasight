# Codex 模式分段控件点击只聚焦不切换
## 发现者
测试监督 Agent
## 现象
浏览器验证中，点击节点底部 `Plan 模式` 后，控件只获得焦点，`Chat 模式` 仍保持 selected，临时项目的 `.scatter/scatter.json` 仍保存为 `codexMode: "chat"` 和 `planMode: false`。
## 影响范围
节点底部新增的 `Chat / Plan / Goal` 分段控件无法通过真实鼠标点击可靠切换，导致 Plan/Goal 模式不能进入 Markdown 和 MCP Run payload。
## 复现步骤
1. 通过 MCP server 打开 Canvasight session。
2. 在空画布新建一个节点。
3. 点击节点底部 `Plan 模式` 图标。
4. 查看浏览器无障碍快照和 `.scatter/scatter.json`。
## 证据
- Playwright 快照显示 `Plan 模式` 为 active，但 `Chat 模式` 仍为 selected。
- `/tmp/canvasight-codexmode-qa.nLfaEu/.scatter/scatter.json` 中节点数据仍为 `codexMode: "chat"`。
## 初步归因
原 Switch 组件会阻断 `pointerdown/mousedown/click` 事件继续进入 React Flow 画布；新增 Segmented 复用组件没有保留这层节点内控件事件隔离，点击被画布交互层干扰。
## 交付给哪个 Agent
开发 Agent
## 需要回答的问题
如何让 `SegmentedItem` 保持现有 UI kit 行为，同时在 React Flow 节点内可靠触发 `onClick` 并阻断画布拖拽/选择事件？
