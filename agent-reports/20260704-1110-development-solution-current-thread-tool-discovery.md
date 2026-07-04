# 当前线程工具发现解决方案

## 负责 Agent
开发 Agent / Codex 插件运行时负责人

## Root Cause
当前已打开 Codex 线程的可调用工具表没有热刷新新安装的 repo-local plugin MCP tools。Canvasight 的插件安装、MCP 注册和 server tools/list 均已进入 Codex 配置/cache 层；当前线程仍发现不到 `open_canvasight`、`await_canvasight_run`、`close_canvasight`，属于 Codex 线程工具注册刷新边界，不是 Canvasight MCP server 或 manifest 的代码配置错误。

## 调研过程
1. 复现产品 Agent 报告：当前线程内 `tool_search` 查询 `open_canvasight await_canvasight_run canvasight` 返回 `Found 0 tools.`。
2. 检查 repo-local marketplace：`/Users/niallyoung/Desktop/Canvasight/.agents/plugins/marketplace.json` 定义 `canvasight-local`，source 指向 `./plugins/canvasight`。
3. 检查用户 Codex 配置：`~/.codex/config.toml` 已存在 `[plugins."canvasight@canvasight-local"] enabled = true`，并注册 `[marketplaces.canvasight-local] source = "/Users/niallyoung/Desktop/Canvasight"`。
4. 执行 `codex plugin list`：`canvasight@canvasight-local` 显示为 `installed, enabled`，路径解析到 `/Users/niallyoung/Desktop/Canvasight/plugins/canvasight`。
5. 执行 `codex mcp list` / `codex mcp get canvasight`：`canvasight` MCP server 已 enabled，stdio command 为 `node ./mcp/server.mjs`，cwd 为 `/Users/niallyoung/.codex/plugins/cache/canvasight-local/canvasight/0.1.0/.`。
6. 对比 repo 与 cache：`.mcp.json`、`.codex-plugin/plugin.json`、`mcp/server.mjs` 在 repo 与 `~/.codex/plugins/cache/canvasight-local/canvasight/0.1.0` 中一致。
7. 直接从 cache cwd 启动 MCP server 并发送 JSON-RPC `initialize` + `tools/list`：server 返回 `open_canvasight`、`await_canvasight_run`、`close_canvasight` 三个 tools。
8. 执行 `npm run test:mcp`：MCP smoke test 通过，覆盖 open/session HTTP API/document/attachments/asset/run/await/close。
9. 当前线程的开发上下文和 `tool_search` 可见 sources 没有 Canvasight；在配置和 cache 已确认有效后仍返回 0，说明本线程工具表是在会话创建/加载时固定的，不会因后续 repo-local plugin install 自动注入新 MCP tools。

## 可选方案
- 要求当前已打开线程继续等待或重复 `tool_search` 查询。
- 在当前线程中手动改 Canvasight MCP/manifest，希望触发工具表刷新。
- 新开 Codex 线程或重载当前线程，让 Codex 重新读取 plugin marketplace、cache 和 MCP tools metadata 后再验收。

## 推荐方案
采用新线程或重载作为验收入口。当前线程只作为分析和报告线程，不再要求它直接调用 `open_canvasight`。Canvasight 端到端验收口径应改为：

1. 确认 `codex plugin list` 中 `canvasight@canvasight-local` 为 `installed, enabled`。
2. 新开 Codex 线程或重载 Codex 会话。
3. 在新/重载线程中用工具发现确认 `open_canvasight`、`await_canvasight_run`、`close_canvasight` 可见。
4. 调用 `open_canvasight`，网页画布 Run 后在同一新/重载线程调用 `await_canvasight_run`，确认返回 Markdown `content` 和完整 `structuredContent`。

## 实施步骤
1. 不修改 Canvasight MCP server、manifest、`.mcp.json` 或 smoke test；现有配置链路已验证有效。
2. 由验收线程新开或重载后执行工具发现与端到端 Run 验收。
3. 在产品验收说明中明确：repo-local plugin 安装/启用后，已打开线程不能作为即时工具发现验收线程；必须使用新线程或重载后的线程。
4. 如果后续要把该口径固化到仓库文档，再更新 README/AGENTS 的验收步骤；本报告不要求代码改动。

## 风险与回滚
风险：如果验收人员继续使用安装前已打开的线程，会误判为 Canvasight MCP tools 缺失。  
回滚：无需代码回滚；使用新线程/重载重新进入即可。如果新线程仍发现不到 tools，再回到插件安装层排查 `codex plugin list`、`codex mcp list`、cache 快照和 MCP `tools/list`。

## 验证方式
已完成的本线程验证：

- `tool_search` 查询 `open_canvasight await_canvasight_run canvasight`：当前线程返回 0，确认未热刷新。
- `codex plugin list`：`canvasight@canvasight-local installed, enabled`。
- `codex mcp get canvasight`：stdio MCP server enabled，cwd 指向 cache 快照。
- `cmp -s`：repo 与 cache 的 `.mcp.json`、`.codex-plugin/plugin.json`、`mcp/server.mjs` 一致。
- 手动 JSON-RPC `tools/list`：server 返回三个目标 tools。
- `npm run test:mcp`：通过。

待新/重载线程执行的最终验收：

- 工具发现能看到 `open_canvasight`、`await_canvasight_run`、`close_canvasight`。
- `open_canvasight` 能打开 Canvasight session。
- 网页 Run 后 `await_canvasight_run` 返回 Markdown `content` 与 `structuredContent.status = "received"`。
