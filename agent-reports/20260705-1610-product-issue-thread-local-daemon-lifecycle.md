# Canvasight 网页服务绑定 thread-local MCP 进程

## 发现者
用户 / 产品 Agent

## 现象
从一个 Codex thread 打开 Canvasight 网页后，归档该 thread 会导致 `127.0.0.1` 页面连接被拒绝。

## 影响范围
- 已打开的 Canvasight 网页 tab 会失效。
- 旧网页里的 Run payload 无法被新的当前 Codex thread 接收。
- 用户被迫长期保留启动网页的那个 thread。

## 复现步骤
1. 在 Codex thread A 调用 `open_canvasight` 打开网页。
2. 归档 thread A。
3. 回到浏览器刷新旧 Canvasight URL。
4. 页面显示 `ERR_CONNECTION_REFUSED`。

## 证据
- 原实现中 HTTP server、`sessions`、`runQueue` 都保存在 `mcp/server.mjs` 的 MCP 进程内存中。
- 原实现会在 MCP stdin end / SIGTERM 时关闭 HTTP server。
- 用户截图显示旧 `127.0.0.1` URL 被拒绝连接。

## 初步归因
Canvasight 网页服务被 thread-local MCP stdio 进程托管，而不是项目级常驻服务。

## 交付给哪个 Agent
开发 Agent、测试监督 Agent、客服 Agent

## 需要回答的问题
- 如何让网页服务独立于打开它的 Codex thread 存活？
- 如何保证当前 Codex thread 能接收旧网页投递的 Run payload？
- 如何验证 MCP 进程 A 退出后 MCP 进程 B 能继续 await 同一项目队列？
