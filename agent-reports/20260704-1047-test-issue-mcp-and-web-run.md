# Canvasight 测试监督问题报告

## 发现者
测试监督 Agent

## 现象
初始插件骨架中 `.mcp.json` 为空，Web Run 到 MCP 结果的链路尚未实现。

## 影响范围
阻断 `open_canvasight`、`await_canvasight_run`、`close_canvasight` 暴露，无法验证网页 Run 后返回 Markdown 和 `structuredContent`。

## 复现步骤
1. 查看 `plugins/canvasight/.mcp.json`。
2. 查看是否存在 `plugins/canvasight/mcp/server.mjs` 和 MCP smoke test。

## 证据
测试监督 Agent 只读审查时，`.mcp.json` 为 `{ "mcpServers": {} }`，且没有可执行 server。

## 初步归因
插件脚手架只创建了空 MCP 配置，核心本地 server 还未实现。

## 交付给哪个 Agent
开发 Agent

## 需要回答的问题
- 如何用 Node 内置模块实现本地 HTTP UI 服务和 stdio MCP server？
- `await_canvasight_run` 如何等待 browser-side Run payload 并返回稳定结构？
- smoke test 如何覆盖 tool discovery、open、run payload、await 和 close？
