# 原生 Plan/Goal 入口方案
## 负责 Agent
开发 Agent
## Root Cause
Canvasight 浏览器只负责生成并返回任务上下文，不能操作 Codex UI。原生 Plan/Goal 必须由 Canvasight MCP server 在收到 Run payload 后调用 Codex app-server 原生 request，并把结果写入 `await_canvasight_run.structuredContent.codexNative`。
## 调研过程
检查桌面 App 自带 `/Applications/Codex.app/Contents/Resources/codex` 后确认：
- app-server v2 支持 `thread/goal/set`。
- app-server v2 支持带 `experimentalApi: true` 初始化后的 `thread/settings/update`，可设置 `collaborationMode.mode` 为 `plan` 或 `default`。
- 当前 Codex 运行环境有 `CODEX_THREAD_ID`，可指向当前线程。
- `codex app-server proxy` 默认 socket 不存在，因此采用每次 Run 短暂启动 `codex app-server --stdio` 的方式发 JSON-RPC request。
## 可选方案
1. 继续只返回 `codexMode`，由普通文本协议解释。
2. 在 Canvasight skill 中规定 `await_canvasight_run` 后调用当前 Codex native tools。
3. 在 Canvasight MCP server 中读取 `CODEX_THREAD_ID` 并直接调用 app-server native requests。
## 推荐方案
采用方案 3。它不使用虚拟点击，也不依赖 agent 再解释文本；Run payload 入队前即调用 Codex app-server 原生 request，`await_canvasight_run` 返回可审计的 `codexNative` 结果。
## 实施步骤
1. `open_canvasight` session 保存 `codexThreadId`，默认读取 `CODEX_THREAD_ID`，也允许显式 `threadId` 覆盖。
2. Run 时 `goal` 调 `thread/goal/set`，随后把 collaboration mode 设置为 `default`。
3. Run 时 `plan` 调 `thread/settings/update`，设置 `collaborationMode.mode: "plan"`。
4. Run 时 `chat` 调 `thread/settings/update`，设置 `collaborationMode.mode: "default"`。
5. `await_canvasight_run` 返回 `codexNative.status/action/threadId/mode` 作为审计结果。
## 风险与回滚
风险是不同 Codex host 的 app-server request 版本不一致。回滚方式是设置 `CANVASIGHT_CODEX_NATIVE=0` 禁用 native request，但这不满足用户要求，只能作为诊断开关。
## 验证方式
- MCP smoke 使用 fake Codex app-server 断言 `goal` 发出 `thread/goal/set`，`plan` 发出 `thread/settings/update`。
- 插件校验、typecheck、build 通过。
