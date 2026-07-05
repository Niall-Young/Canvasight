# Codex 执行模式 Segmented 方案
## 负责 Agent
开发 Agent
## Root Cause
当前数据模型只包含 `planMode: boolean`，UI 也只提供 Switch，无法表达 Chat、Plan、Goal 三种 Codex 执行策略。
## 调研过程
检查插件和本地 Codex 可调用能力后，没有发现 Canvasight MCP 能直接切换 Codex App 当前线程 UI Plan Mode 的宿主 API。Codex Desktop 当前可通过结构化工具和技能说明约束后续 agent 行为，因此需要把执行模式作为 MCP structuredContent 的显式字段返回，并在 skill 中定义 Plan/Goal 协议。
## 可选方案
1. 继续保留 planMode 开关，只增加 goalMode。会造成两个开关互斥问题，不符合用户要求。
2. 替换为三态 Segmented，并新增 `codexMode` 字段，同时保留 `planMode` 兼容旧数据。
3. 回退虚拟点击 Codex UI。会重新引入辅助功能权限、点击脆弱性和此前已移除的客户端发送链路。
## 推荐方案
采用方案 2。节点 UI 用现有 `Segmented`/`SegmentedItem` 组件实现 icon-only 三段控件：Chat、Plan、Goal。新增 `CodexMode = "chat" | "plan" | "goal"`，旧 `planMode: true` 自动映射为 `codexMode: "plan"`。
## 实施步骤
1. 在共享类型中增加 `CodexMode`，并给 `ScatterNodeData`、Run payload 增加 `codexMode`。
2. 更新文档 normalize、empty node、copy/paste clone，使旧数据和新字段兼容。
3. 用 Segmented 替换节点底部 Switch，三段 icon 使用 `chat`、`upgrade-plan`、`flag`。
4. 更新 Markdown 文案，输出 Codex 模式和 Plan/Goal 请求。
5. 更新 MCP server normalizeRunPayload、timeout/closed fallback 和 smoke test。
6. 更新 Canvasight skill：Plan 模式要求先给计划并等待确认；Goal 模式要求在可用时创建 goal，再按 goal 生命周期执行。
## 风险与回滚
风险是 Codex App 没有公开 UI 模式切换 API，Plan/Goal 不能等同于点击宿主 UI 开关。通过 skill 协议和 structuredContent 明确约束 agent 行为，并在最终说明里标注边界。

回滚时可恢复 `Switch` UI 和 `planMode` 布尔字段，但会失去 Goal 模式。
## 验证方式
- `npm run typecheck -- --pretty false`
- `npm run build`
- `npm run test:mcp`
- 插件 validate
- 浏览器验证 Segmented 三态切换、Markdown 输出、保存数据字段。
