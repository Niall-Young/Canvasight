# 项目级 Canvasight daemon 方案

## 负责 Agent
开发 Agent

## Root Cause
原 MCP server 同时承担 stdio tool server 和 HTTP web server。Codex thread 归档时会结束对应 MCP 进程，导致 HTTP server、session、run queue 一起丢失。

## 调研过程
检查 `plugins/canvasight/mcp/server.mjs` 后确认：
- `ensureHttpServer()` 在当前 MCP 进程里监听随机端口。
- `sessions` 和 `runQueue` 是进程内 Map。
- stdin end / SIGTERM 会关闭 HTTP server。

## 可选方案
- 继续 thread-local：实现简单，但无法解决用户问题。
- 固定端口但仍由 MCP 进程托管：只能让 URL 更稳定，thread 归档仍会停止服务。
- 项目级 daemon：MCP 进程变成 shim，daemon 托管网页、session 和 run queue。

## 推荐方案
采用项目级 daemon。

## 实施步骤
1. 在 `mcp/server.mjs` 增加 `--daemon` 和 `--stop-daemon` 模式。
2. 将 HTTP server、session、run queue 放在 daemon 进程中。
3. MCP tool 调用先通过 `~/.canvasight/daemon.json` 发现或启动 daemon。
4. `open_canvasight` 请求 daemon 创建 session 并打开带 token 的 URL。
5. `await_canvasight_run` 从 daemon 长轮询队列取 payload，并在当前 MCP thread 上应用 Plan / Goal。
6. 支持 `projectPath` attach，让新 thread 可以等待旧网页 session 的 Run payload。
7. API 增加本地 token，避免常驻 daemon 裸露写文件和附件读取接口。

## 风险与回滚
- 风险：旧 daemon 版本残留。通过 health 返回 `pluginRoot` 和 `serverVersion`，不匹配则启动新 daemon。
- 风险：旧 URL 在 daemon 手动停止或机器重启后失效。通过最近项目重新打开。
- 回滚：恢复 MCP 进程内 HTTP server，但会重新出现 thread 归档后服务停止的问题。

## 验证方式
- `npm run test:mcp` 覆盖 MCP A 打开网页后退出，daemon 仍可访问，MCP B 按 projectPath 收到旧网页投递的 Run payload。
- `npm run typecheck`
- `npm run build`
- 插件校验脚本
