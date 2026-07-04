# Canvas 交互回归解决方案

## 负责 Agent
集成负责人

## Root Cause
插件化时重写了 `App.tsx` 的主渲染入口，只保留了基础 `ReactFlow`、节点和右侧 drawer，误删了原 Scatter 的 App 级画布控制层。节点加号拖拽建点本来依赖 React Flow 的 `onConnectStart` / `onConnectEnd`，不是 `TaskNode` 自己完成；因此当前 `TaskNode` 检测到拖拽后直接返回时，缺少 App 层接管逻辑就造成了拖拽无效。

## 调研过程
- 对比当前 `plugins/canvasight/src/App.tsx` 与上游 Scatter renderer 的 `App.tsx`。
- 确认 `.canvas-toolbar`、`.canvas-actions`、连接预览样式仍在 `app.css` 中，但当前 App 没有挂载。
- 确认 `TaskNode` 的左右加号点击逻辑仍可创建相邻节点，拖拽逻辑需要由 React Flow 连接事件补齐。
- 复现用户截图中的顶部路径输入条来自内联 `canvasight-topbar`，不符合保留原组件语言的要求。

## 可选方案
- 继续维护自造顶部路径条，只局部补拖拽建点。
- 直接把 Scatter 原 App 整体搬回，再删除 Electron 壳。
- 在当前插件 App 中恢复原画布控制层和原 `Topbar` 组件语言，只隔离 Sidebar/recent project/启动页/玻璃态/虚拟点击。

## 推荐方案
采用第三种。它能保留插件化所需的 MCP/Web API，又恢复 Scatter 的核心画布操作，不重新引入客户端壳。

## 实施步骤
- 扩展 `Topbar`，支持 Canvasight Web 模式：左侧品牌和项目名、文件夹入口、右侧 Run/任务/Markdown 控件；不显示 Sidebar toggle 和更新器。
- 移除常驻顶部项目路径输入条，路径输入只保留在无项目空状态，文件夹入口使用轻量 prompt。
- 恢复 React Flow 连接拖拽状态：`onConnectStart`、`onConnectEnd`、连接预览、空白处松手生成新节点并自动连线。
- 恢复画布浮动控件：左下 `.canvas-actions` 的 Fit/Undo/Redo，底部 `.canvas-toolbar` 的新增节点、选择/拖动画布、缩放菜单。
- 保留已完成的 Web 化边界：无左侧项目列表、无启动页、无背景模糊/玻璃态、无虚拟点击发送链路。

## 风险与回滚
风险：恢复更多原画布逻辑会增加 `App.tsx` 复杂度，后续如果继续清理 Scatter 命名，需要避免误删画布行为。  
回滚：可回退本次 `App.tsx` / `Topbar.tsx` / `app.css` 改动，但会重新暴露用户指出的 P1 回归，不建议回滚。

## 验证方式
- `npm run typecheck -- --pretty false` 通过。
- `npm run build` 通过。
- `npm run test:mcp` 通过。
- Browser 验证：
  - 顶部不再出现 `.canvasight-project-form/.canvasight-project-input/.canvasight-project-open`。
  - `.canvas-toolbar` 和 `.canvas-actions` 均渲染。
  - 点击底部 `New node` 后节点数从 0 变 1。
  - 从节点右侧 `Connect right node` 加号拖拽到空白画布后，节点数从 1 变 2，边数从 0 变 1。
  - 390px 移动视口无横向溢出，toolbar/actions 仍可见。
