# Canvasight 原生 Plan/Goal 集成汇总

## 本轮目标
去掉“只靠协议语义”的降级，实现 Canvasight Run 时无需虚拟点击即可开启 Codex 自己的 Goal 和 Plan。

## Agent 输入
- 产品 Agent：触发点必须仍是 `await_canvasight_run` 的结构化结果，不接受虚拟点击、剪贴板或深链发送。
- 测试监督 Agent：必须有可审计证据证明 native request 被调用，不能只断言 `codexMode` 字段。
- 开发调研 Agent：桌面 Codex app-server v2 支持 `thread/goal/set`；`thread/settings/update` 在 initialize `experimentalApi: true` 后可设置 `collaborationMode.mode`。

## 已实现
- Canvasight MCP session 读取 `CODEX_THREAD_ID`，也允许 `open_canvasight({ threadId })` 显式覆盖。
- Run payload 入队前根据 `codexMode` 调 Codex app-server：
  - `goal` 调 `thread/goal/set`，随后把 collaboration mode 设为 `default`。
  - `plan` 调 `thread/settings/update`，设置 `collaborationMode.mode: "plan"`。
  - `chat` 调 `thread/settings/update`，设置 `collaborationMode.mode: "default"`。
- `await_canvasight_run.structuredContent.codexNative` 返回 native request 的 `status/action/threadId/mode`。
- Skill 文档改为要求检查 `codexNative.status === "applied"`，不再让 Agent 静默降级或重复创建 goal。
- MCP smoke 增加 fake Codex app-server，断言真实发出 `thread/goal/set` 和 `thread/settings/update`。

## 验证结果
- `npm run typecheck -- --pretty false` 通过。
- `npm run test:mcp` 通过。
- `npm run build` 通过。
- 插件校验通过。

## 未解决
- 没有新增浏览器 smoke 脚本；本轮验证 native request 在 MCP smoke 层完成。

## 下一轮分派
- 测试监督 Agent：后续补浏览器 smoke，覆盖真实点击 `Chat / Plan / Goal` 后 native request 全链路。
