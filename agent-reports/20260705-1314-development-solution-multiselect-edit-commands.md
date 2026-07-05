# 恢复框选后的删除、复制和粘贴
## 负责 Agent
开发 Agent
## Root Cause
React Flow 已能产生多个 `node.selected` 状态，但应用层只维护 `selectedNodeId` 作为单节点焦点，没有实现基于 `node.selected` 集合的删除、复制、粘贴命令。粘贴事件也被图片附件上传逻辑独占。
## 调研过程
检查 `plugins/canvasight/src/App.tsx` 后确认：
- `onNodesChange` 会保留多个节点的 `selected` 状态。
- `deleteNode` 和节点菜单复制只面向单个节点。
- `handleKeyDown` 只处理撤销、运行、新建、缩放、drawer 和工具切换。
- `handlePaste` 只读取剪贴板图片文件，并追加为节点附件。
## 可选方案
1. 重新启用 React Flow 默认删除快捷键。实现最快，但无法覆盖复制粘贴，也不便控制状态和提示。
2. 基于应用状态实现 Canvasight 专用命令。读取 `nodes.filter(node.selected)`，自行删除、序列化、粘贴，并保留图片粘贴逻辑。
3. 只恢复单节点快捷键。改动小，但不能解决用户反馈的框选后批量操作。
## 推荐方案
采用方案 2。保留 React Flow 选择能力，用应用层命令处理多选集合；复制时写入 Canvasight 专用 MIME 与普通文本兜底，粘贴时优先解析 Canvasight payload，解析不到再走图片附件粘贴。
## 实施步骤
1. 增加 Canvasight 节点剪贴板 payload 类型、解析和克隆辅助函数。
2. 增加 `deleteSelectedNodes`、`copySelectedNodes`、`pasteCanvasClipboard`。
3. 在 `keydown` 中接入 Backspace/Delete、Cmd/Ctrl+C、Cmd/Ctrl+V。
4. 在 `copy` 和 `paste` 原生事件中写入/读取 Canvasight payload，并保留图片文件粘贴到节点附件。
5. 粘贴后生成新节点和新边 ID，保留内部连接，偏移位置并选中新粘贴节点。
## 风险与回滚
风险是快捷键可能误拦截输入框编辑，或 Canvasight 文本 payload 与普通文本粘贴冲突。通过 `isEditableTarget` 保护输入框，并仅在 payload 结构匹配时拦截粘贴。

回滚可移除新增批量命令和剪贴板事件监听，恢复到只处理图片粘贴的逻辑。
## 验证方式
- TypeScript typecheck。
- Vite build。
- MCP smoke test。
- 插件 validate。
- 浏览器中框选多个节点，验证 Backspace 删除、Cmd/Ctrl+C 后 Cmd/Ctrl+V 复制粘贴，并检查粘贴后节点保持选中、内部连线保留、无控制台错误。
