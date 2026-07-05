# Codex 执行模式不能只用计划开关表达
## 发现者
产品 Agent
## 现象
节点底部当前只有一个“计划模式”开关，只能表达关闭或开启 Plan。用户明确要求这里不再是开关，而是 icon 形态 Segmented，并且支持 chat、plan 和 goal。
## 影响范围
影响节点运行意图的表达、Markdown 输出、MCP Run payload、`await_canvasight_run` 返回，以及 Canvasight skill 对 Codex 后续行为的约束。
## 复现步骤
1. 打开 Canvasight 画布。
2. 选中或悬停一个节点。
3. 查看节点底部右侧控件。
4. 只能看到“计划模式”开关，无法选择 Chat 或 Goal。
## 证据
`plugins/canvasight/src/components/TaskNode.tsx` 使用 `Switch` 绑定 `data.planMode`。

`plugins/canvasight/shared/types.ts` 只有 `planMode: boolean`，没有三态执行模式。
## 初步归因
早期迁移把 Codex 执行意图简化成布尔计划模式，但现在产品需要明确区分普通对话、计划流程和目标流程。
## 交付给哪个 Agent
开发 Agent
## 需要回答的问题
- 如何兼容已有 `.scatter/scatter.json` v1 的 `planMode: true`？
- 三态模式应如何进入 Markdown 和 MCP payload？
- Goal 模式在没有宿主 UI 开关 API 的情况下如何约束 Codex 后续行为？
