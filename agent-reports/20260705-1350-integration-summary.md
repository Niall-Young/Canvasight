# Canvasight Codex 模式集成汇总

## 本轮目标
把节点底部原 `计划模式` 开关改成 icon 形态 Segmented，支持 `chat`、`plan`、`goal` 三种 Codex 执行模式，并让 Markdown 与 MCP Run payload 返回对应模式。

## Agent 输入
- 产品 Agent：确认主字段应为 `codexMode: "chat" | "plan" | "goal"`，旧 `planMode` 只作为兼容投影。
- 设计 Agent：确认复用现有 `Segmented` 和 icon 体系，不新增自定义垃圾组件，不恢复文字开关。
- 测试监督 Agent：要求覆盖类型检查、构建、MCP smoke、浏览器点击、保存和 Run payload。

## 已解决
- `ScatterNodeData`、Markdown result、Run payload、MCP normalized payload 都增加 `codexMode`。
- 旧 `.scatter/scatter.json` 只有 `planMode: true` 时会自动归一化为 `codexMode: "plan"`。
- 节点底部改为 `Chat / Plan / Goal` 三个 icon segment，移除节点里的思考深度/计划开关 UI。
- Skill 文档增加 Codex Mode Protocol：Plan 按计划优先处理，Goal 在可用时使用 native goal tool。
- 发现并修复 Segmented 在 React Flow 节点内点击只聚焦不切换的问题：`SegmentedItem` 统一阻断 pointer/mouse/click 事件冒泡。

## 验证结果
- `npm run typecheck -- --pretty false` 通过。
- `npm run build` 通过。
- `npm run test:mcp` 通过，覆盖 `goal` payload 和旧 `planMode` 兼容。
- `validate_plugin.py /Users/niallyoung/Desktop/Canvasight/plugins/canvasight` 通过。
- Playwright 浏览器验证通过：
  - 节点底部显示 `Chat / Plan / Goal` 三个 tab。
  - 点击 `Plan` 后 `.scatter/scatter.json` 保存为 `codexMode: "plan"` 和 `planMode: true`。
  - 点击 `Goal` 后 `.scatter/scatter.json` 保存为 `codexMode: "goal"` 和 `planMode: false`。
  - 点击节点 Run 后 MCP `await_canvasight_run` 返回 `structuredContent.codexMode: "goal"`，Markdown 包含 `Codex 模式: Goal` 和 `请求 Goal 模式: 是`。

## 未解决
- Codex 原生 UI 的 Plan/Goal 切换没有公开插件 API；当前实现通过 MCP `structuredContent.codexMode` 加 skill 协议驱动 Codex 行为，不恢复虚拟点击。

## 下一轮分派
- 产品 Agent：继续确认 Goal 模式在用户后续工作流中是否需要更严格的目标文本字段。
- 设计 Agent：继续检查节点 footer 的 icon spacing 和 hover/focus 表现。
- 测试监督 Agent：后续若 Codex 暴露 native mode API，需要新增端到端验证覆盖。
