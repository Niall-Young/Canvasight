# Codex 原生 Plan/Goal 入口不完整
## 发现者
开发 Agent
## 现象
Canvasight 已经能在 `await_canvasight_run.structuredContent.codexMode` 中返回 `chat`、`plan`、`goal`，但当前实现只用 skill 协议解释模式，没有强制调用 Codex 原生 goal/plan 能力。
## 影响范围
用户选择 Goal 时可能没有真正创建当前 Codex 线程的原生 goal；用户选择 Plan 时可能只变成普通文字约束，而不是 Codex 自己的 Plan mode。
## 复现步骤
1. 在 Canvasight 节点选择 `Goal` 或 `Plan`。
2. 点击 Run。
3. Codex 调用 `await_canvasight_run`。
4. 检查当前线程是否出现原生 goal 或 Plan mode。
## 证据
- 本机环境存在 `CODEX_THREAD_ID`。
- 桌面 Codex app-server 支持 `thread/goal/set`。
- 桌面 Codex app-server 支持 `thread/settings/update`，在 initialize 声明 `experimentalApi: true` 后可设置 `collaborationMode.mode` 为 `plan` 或 `default`。
- app-server control socket 当前不存在：`~/.codex/app-server-control/app-server-control.sock` 不存在，因此实现采用短暂启动 `codex app-server --stdio` 的方式发送 JSON-RPC request。
## 初步归因
Goal 是线程级状态，可用 `thread/goal/set`。Plan 是线程 collaboration mode，可用 `thread/settings/update` 设置为 `plan`。Canvasight 需要在 Run payload 入队前调用这些 app-server request，而不是依赖后续 Agent 文本解释。
## 交付给哪个 Agent
开发 Agent、测试监督 Agent
## 需要回答的问题
1. Run 时 native request 失败时应如何在 UI 中提示用户？
2. 是否需要在 Chat 模式下清除已有 goal，还是只切回 default collaboration mode？
