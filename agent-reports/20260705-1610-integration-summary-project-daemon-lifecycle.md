# 集成摘要

## 本轮目标
修复 Canvasight 网页服务绑定启动 thread 的问题，让网页服务项目级常驻，并让当前 Codex thread 接收 Run payload。

## 已完成
- MCP server 增加项目级 daemon 模式和 daemon stop 模式。
- MCP tools 改为 shim：启动/复用 daemon、创建 session、等待 run queue。
- `await_canvasight_run` 支持按 `projectPath` attach 到项目级 Run 队列。
- Plan / Goal 原生模式改为在当前调用 `await_canvasight_run` 的 thread 上应用。
- 前端 API 请求携带 daemon token。
- MCP smoke test 增加跨进程验证：MCP A 退出后 daemon 存活，MCP B 收到旧网页 Run payload。
- README、AGENTS、Canvasight skill 和插件展示描述同步项目级 daemon 语义。

## 未解决
- daemon 手动停止或机器重启后，旧浏览器 URL 仍需重新打开最近项目。

## 下一轮分派
- 测试监督 Agent 继续关注真实浏览器中的旧 tab attach 流程。
- 客服 Agent 后续维护 README 中 daemon、thread attach、Run payload 归属相关 FAQ。
