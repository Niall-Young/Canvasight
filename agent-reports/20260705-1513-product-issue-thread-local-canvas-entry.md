# 新线程缺少 Canvasight 全局恢复入口

## 发现者
产品 Agent、开发 Agent

## 现象
Canvasight 当前通过 `open_canvasight` 创建内存 session 并打开浏览器页面。Codex 线程关闭、MCP 进程退出或新线程启动后，旧 `sessionId` 与等待队列会丢失；用户需要再次知道项目路径或误以为要重新运行 `npm run dev`。

## 影响范围
- 新 Codex 线程中恢复最近画布的体验。
- 插件化后“网页画布 + 输出给 Codex”的入口连续性。
- 用户对 dev server 与插件运行态的理解。

## 复现步骤
1. 在当前线程调用 `open_canvasight` 打开 Canvasight。
2. 关闭或切换到新的 Codex 线程。
3. 尝试继续打开同一个 Canvasight 画布。
4. 只能重新调用 `open_canvasight` 或手动输入项目路径，没有最近项目恢复工具。

## 证据
- `plugins/canvasight/mcp/server.mjs` 中 `sessions` 是进程内 `Map`。
- `.scatter/scatter.json` 能保存项目内容，但没有用户级最近项目索引。
- `README.md` 只列出 `open_canvasight`、`await_canvasight_run`、`close_canvasight`。

## 初步归因
插件从客户端迁到网页后保留了项目文件持久化，但没有把“最近项目 / 新线程恢复”从客户端 shell 转移到 MCP 层。

## 交付给哪个 Agent
开发 Agent

## 需要回答的问题
- 最近项目状态应存放在哪里，避免污染项目 `.scatter`？
- MCP 需要暴露哪些最小工具来支持新线程恢复？
- 如何验证新线程不依赖 Vite dev server？
