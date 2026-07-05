# Canvasight 最近项目恢复入口方案

## 负责 Agent
开发 Agent

## Root Cause
Canvasight 的项目内容持久化在 `.scatter`，但入口状态只存在于 MCP server 内存 session。Codex 新线程无法复用旧 session，也没有 MCP 工具读取最近项目。

## 调研过程
- 检查 `server.mjs`，确认 `open_canvasight` 每次创建内存 session 并托管 `dist`。
- 检查 `.scatter` 读写逻辑，确认节点、边和附件已在项目内持久化。
- 检查 plugin manifest 与本地校验器，当前没有可确认的 widget manifest contract。
- 与产品/测试监督结论对齐：先在 MCP 层提供稳定恢复能力。

## 可选方案
1. 新增 Codex widget manifest：当前缺少可验证 schema，风险高。
2. 让 `open_canvasight` 默认强行打开最近项目：可能覆盖当前 workspace 语义。
3. 增加最近项目 MCP 工具：不改变现有工具行为，可被未来 widget 复用。

## 推荐方案
采用方案 3。新增用户级 Canvasight state 文件记录最近项目，并暴露 `list_canvasight_recent_projects` 与 `open_canvasight_recent_project`。

## 实施步骤
1. 在 MCP server 中增加 `CANVASIGHT_HOME` / `~/.canvasight/state.json` 用户级状态。
2. 在 `open_canvasight`、`open-project`、`document`、`attachments` 成功后记住项目。
3. 增加 `list_canvasight_recent_projects` 工具返回最近项目与 `.scatter` 可用性。
4. 增加 `open_canvasight_recent_project` 工具按最近项目或指定路径打开新 session。
5. 更新 skill、README 和 MCP smoke test。

## 风险与回滚
- 风险：用户级状态文件写入失败时不能影响画布打开。实现使用 best effort 记忆项目。
- 风险：最近项目路径已删除。列表返回 `exists` 和 `hasScatter` 供调用方判断。
- 回滚：删除新增工具和 state 写入调用，不影响 `.scatter` 项目文件格式。

## 验证方式
- `npm run typecheck`
- `npm run build`
- `npm run test:mcp`
- 插件校验脚本
