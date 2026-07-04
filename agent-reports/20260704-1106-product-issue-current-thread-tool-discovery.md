# Canvasight 产品验收问题报告

## 发现者
产品 Agent

## 严重级别
P1 高风险

## 现象
`canvasight@canvasight-local` 已经在 `codex plugin list` 中显示为 `installed, enabled`，并解析到 `/Users/niallyoung/Desktop/Canvasight/plugins/canvasight`，但当前 Codex 线程中通过工具发现查询 `open_canvasight await_canvasight_run canvasight` 返回 0 个工具。

## 影响范围
当前实现的 MCP server、manifest、技能说明、typecheck、build、MCP smoke test 都已通过本地验证，但“网页画布 Run 后返回给当前 Codex 线程”的端到端验收仍依赖当前线程能调用 `open_canvasight` 与 `await_canvasight_run`。如果工具只在新线程或重载后可见，则当前线程无法直接完成产品承诺。

## 复现步骤
1. 在 `/Users/niallyoung/Desktop/Canvasight` 执行 `codex plugin list`。
2. 确认 `canvasight@canvasight-local` 状态为 `installed, enabled`。
3. 在当前 Codex 线程中查询 `open_canvasight await_canvasight_run canvasight`。
4. 观察工具发现结果为 0 个工具。

## 证据
- `codex plugin list` 显示：`canvasight@canvasight-local  installed, enabled  0.1.0  /Users/niallyoung/Desktop/Canvasight/plugins/canvasight`。
- 当前线程 `tool_search` 查询 `open_canvasight await_canvasight_run canvasight` 返回 `Found 0 tools.`。
- `npm run test:mcp` 已通过，说明 MCP server 自身可返回 Markdown `content` 和 `structuredContent`，风险集中在 Codex 当前线程工具注册/刷新层。

## 初步归因
新安装或 repo-local 插件可能没有在当前已经打开的 Codex 线程中刷新可调用工具元数据；也可能需要重新打开线程、重载 Codex、或显式安装/启用后重新进入会话才能让 MCP tools 进入当前线程工具表。

## 交付给哪个 Agent
集成 Agent、Codex 插件运行时负责人

## 需要回答的问题
- repo-local 插件安装后，当前已打开线程是否支持即时发现新 MCP tools？
- 如果不支持，Canvasight 的验收口径是否应明确为“新线程/重载后当前线程”？
- 是否需要补一条人工验收步骤：重启/新开线程后确认 `open_canvasight`、`await_canvasight_run`、`close_canvasight` 可被调用？

## 验收标准
- 在目标 Codex 线程中可发现并调用 `open_canvasight`。
- 用户在网页画布点击 Run 后，`await_canvasight_run` 在同一线程返回 Markdown `content` 与完整 `structuredContent`。
- 若该能力需要新线程或重载，README/AGENTS/验收说明必须明确写出。
