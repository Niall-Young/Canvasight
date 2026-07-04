# Canvas 交互回归

## 发现者
用户、集成负责人

## 现象
Canvasight 插件化后，原 Scatter 的画布能力被过度削减：
- 节点两侧加号拖拽到空白处松手后不再创建并连接新节点。
- 原画布工具栏缺失，包括新增节点、选择/拖动画布、缩放、fit、undo/redo 等操作。
- 顶部被替换成自造的项目路径输入条，视觉和交互质量不符合原组件语言。

## 影响范围
影响 Canvasight Web 主界面核心画布操作，属于 P1 产品回归。虽然 MCP Run 链路可用，但画布编辑体验没有保持 Scatter 原能力。

## 复现步骤
1. 打开 Canvasight Web 页面。
2. 观察顶部区域，只看到路径输入和 Open 按钮。
3. 在节点右侧或左侧加号按住拖拽，松手到空白画布。
4. 观察没有按原 Scatter 行为生成连接节点。

## 证据
- `plugins/canvasight/src/App.tsx` 使用 `canvasight-topbar` 自定义路径表单，没有使用原 `Topbar` 组件。
- `plugins/canvasight/src/App.tsx` 没有接入原 `onConnectStart` / `onConnectEnd` 空白处创建节点逻辑。
- `plugins/canvasight/src/App.tsx` 没有渲染 `.canvas-actions` 和 `.canvas-toolbar`。
- `plugins/canvasight/src/components/TaskNode.tsx` 的拖拽判断本身不会创建节点，原行为依赖 React Flow 连接事件。

## 初步归因
插件化时主线程为了移除客户端左侧项目列表和 Electron 壳，把 `App.tsx` 过度重写，错误地移除了与客户端壳无关的画布控制层。

## 交付给哪个 Agent
集成负责人、开发 Agent、设计/产品验收 Agent

## 需要回答的问题
- 如何恢复原 Scatter 画布控制层，同时不恢复左侧项目列表、启动页、玻璃态和虚拟点击链路？
- 顶部项目路径入口应如何降级为非侵入式控件，而不是替代原 toolbar？
- 哪些交互必须通过浏览器验证后才能提交？
