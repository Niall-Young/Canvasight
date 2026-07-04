# Canvasight 设计/产品验收问题报告

## 发现者
设计/产品验收 Agent

## 严重级别
P1 高风险

## 现象
插件化后的 Canvasight 去掉了过多 Scatter 画布能力：当前 `App.tsx` 没有挂载原底部画布工具栏、左下画布操作组、缩放控制、Undo/Redo/Fit/工具切换等入口；`TaskNode` 的节点加号拖拽逻辑只检测是否拖动，拖动后直接返回，不会在松手位置生成新节点；同时 App 内联了一条包含项目路径输入框的低质顶部路径条，替代了原 Scatter 工作区控件语言。

## 影响范围
这会阻断 Canvasight 最核心的可视化工作流：用户无法按 Scatter 预期通过节点加号拖拽扩展任务图，也无法从画布底部稳定访问创建、选择/拖拽、缩放、适配、撤销/重做等常用画布操作。当前 UI 还把本地项目路径输入暴露为主导航，违背 `design.md` 的画布优先、直接操作、稳定工具栏原则。

## 复现步骤
1. 阅读 `plugins/canvasight/src/App.tsx`，确认渲染树只包含内联 topbar、ReactFlow、RightDrawer，没有原 `.canvas-toolbar` 或 `.canvas-actions`。
2. 阅读 `plugins/canvasight/src/components/TaskNode.tsx`，在节点左右加号上按下、移动后松手。
3. 观察 `handleMouseUp` 在 `dragged` 为 true 时直接返回，没有创建节点或连接预览落点。
4. 阅读 `plugins/canvasight/src/styles/app.css`，确认 `.canvas-toolbar`、`.canvas-actions` 样式仍存在但未被当前 App 挂载；新增 `.canvasight-project-form` 路径输入条占据顶部主控区。

## 证据
- `src/App.tsx:441-500` 内联 `canvasight-topbar`，包含 `canvasight-project-form`、项目路径输入、Open 按钮和状态文本。
- `src/App.tsx:512-530` 只挂载 `ReactFlow` 与 `Background`，没有底部 toolbar/action controls。
- `src/App.tsx:520-528` 只配置 `fitView`、节点/边变化和点击选择，没有连接拖拽落点生成新节点的 App 级状态。
- `src/components/TaskNode.tsx:298-324` 检测到拖动后 `if (dragged) return;`，只在未拖动点击时调用 `createConnectedNode`。
- `src/styles/app.css:1682-1779` 保留 `.canvas-actions`、`.canvas-toolbar`、缩放菜单样式，但当前渲染路径未使用。
- `src/styles/app.css:3776-3812` 定义了 `.canvasight-project-form`、`.canvasight-project-input`、`.canvasight-project-open` 顶部路径条样式。

## 初步归因
去除 Electron/客户端壳时把信息架构和核心画布控件混在一起裁剪了：应删除的是 Sidebar、启动页、玻璃态、窗口拖拽和本地 recent project 壳，而不是 Scatter 的画布工具栏、底部操作组、React Flow 直连/拖拽建点能力。

## 交付给哪个 Agent
主线程集成负责人、开发 Agent、设计 Agent

## 需要回答的问题
- 原 Scatter 的节点加号拖拽松手生成新节点，是否应恢复为 P0/P1 必须项？
- 项目路径入口是否应移到插件启动/会话层或轻量命令入口，而不是长期占据工作区 topbar？
- 当前 `Topbar.tsx` 是否应重新接回渲染路径，还是保留为死代码并重建 Canvasight 专用 toolbar？

## 验收标准
- 节点左右加号支持点击快速生成相邻节点，也支持拖拽到目标位置松手生成新节点并自动连线。
- 底部 Scatter 画布工具栏恢复：新增节点、选择/拖拽工具、缩放显示/菜单、Fit、Undo、Redo 等核心入口可见且可用。
- 顶部不再出现裸项目路径输入条；保留的顶栏只承载 Canvasight 工作区必要状态和少量全局操作。
- 去壳边界清晰：继续移除 Sidebar/recent project、启动页、玻璃态/半透明、Electron 窗口拖拽语义，但不移除画布工作流能力。
