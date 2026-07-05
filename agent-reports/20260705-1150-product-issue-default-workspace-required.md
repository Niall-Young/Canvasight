# Canvasight 首屏要求用户手动输入项目路径
## 发现者
产品 Agent
## 现象
直接打开 Canvasight 页面时，首屏显示本地项目路径输入框和 Open 按钮，用户需要自己填写路径才能进入画布。
## 影响范围
影响插件化目标中的“打开网页画布即可操作”。用户从 Codex 或本地开发入口进入后，不应先处理路径选择这种客户端遗留流程。
## 复现步骤
1. 启动 Canvasight dev server。
2. 打开 `http://127.0.0.1:5173/`。
3. 页面停留在路径输入空状态。
## 证据
截图显示文案 `Enter a local project path to open a Canvasight workspace.`，并存在 `/absolute/project/path` 输入框。
## 初步归因
前端只在 session 返回 `projectPath` 时才调用 `openProjectPath`；当 session 没有路径或 dev server 没有 API 时，会落到空状态表单。
## 交付给哪个 Agent
开发 Agent
## 需要回答的问题
1. 不传 `projectPath` 时，MCP server 应默认使用哪个项目路径？
2. 直接 Vite dev 入口是否也要自动打开同一个 workspace？
3. 自动创建是否需要真实落盘 `.scatter/scatter.json`，而不是只在前端创建空文档？
