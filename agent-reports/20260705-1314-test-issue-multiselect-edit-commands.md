# 框选后的编辑命令失效
## 发现者
测试监督 Agent
## 现象
画布节点可以通过左键拖拽框选进入多选状态，但框选完成后，按 Backspace 或 Delete 不能删除已选节点，使用复制和粘贴快捷键也不能复制所选节点。
## 影响范围
影响 Canvasight 网页画布的核心节点编辑流程。用户无法对多选节点做批量删除、复制、粘贴，框选功能变成不可操作的视觉状态。
## 复现步骤
1. 打开 Canvasight 画布。
2. 用左键拖拽框选多个节点。
3. 按 Backspace 或 Delete。
4. 再次框选多个节点，按 Cmd/Ctrl+C，再按 Cmd/Ctrl+V。
## 证据
`plugins/canvasight/src/App.tsx` 当前只保留 `deleteNode(nodeId)` 单节点删除逻辑，`handleKeyDown` 没有处理 Backspace/Delete，也没有针对已选节点集合处理 Cmd/Ctrl+C 和 Cmd/Ctrl+V。

当前 `paste` 监听只处理图片文件粘贴到节点附件，没有 Canvasight 节点 payload 的解析和粘贴逻辑。
## 初步归因
插件化迁移时恢复了 React Flow 的 `selectionOnDrag`，但没有把多选结果接回应用级编辑命令；React Flow 默认删除快捷键也被 `deleteKeyCode={null}` 禁用。
## 交付给哪个 Agent
开发 Agent
## 需要回答的问题
- 如何在不破坏图片粘贴到节点附件的前提下支持节点复制粘贴？
- 批量删除是否应同时删除与被删节点相连的边？
- 粘贴后是否应保留内部连线、选中粘贴出来的新节点，并避免覆盖现有选择状态？
