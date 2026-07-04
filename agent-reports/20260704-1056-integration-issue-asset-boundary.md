# Asset API 边界问题

## 发现者
主线程集成负责人

## 现象
开发 Agent 实现的 `/api/asset?path=...` 会解码 base64url 后直接读取本地文件路径。

## 影响范围
本地 HTTP server 绑定在 `127.0.0.1`，风险范围有限，但仍不应该让网页 asset endpoint 读取 `.scatter/assets` 之外的任意文件。

## 复现步骤
1. 启动 MCP server 并打开 Canvasight session。
2. 构造 `/api/asset?path=<base64url(/absolute/file)>`。
3. server 会尝试读取该路径。

## 证据
`plugins/canvasight/mcp/server.mjs` 的 `serveAsset` 对解码路径只做了 `stat` 和 `isFile` 检查。

## 初步归因
为了让前端能预览附件，server 复用了附件绝对路径，但缺少和 Scatter 客户端一致的 `.scatter/assets` 限制。

## 交付给哪个 Agent
主线程集成负责人

## 需要回答的问题
- asset endpoint 是否只需要服务 `.scatter/assets`？
- 是否可以沿用 Scatter 原客户端的路径包含 `.scatter/assets` 检查？
