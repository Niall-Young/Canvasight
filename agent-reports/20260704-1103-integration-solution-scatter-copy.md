# Scatter 文案泄漏解决方案

## 负责 Agent
主线程集成负责人

## Root Cause
Markdown 构建器沿用了 Scatter 上游文案。

## 调研过程
`.scatter/scatter.json` 是兼容格式名，应保留；但 UI/Markdown 用户可见产品名称应为 Canvasight。

## 可选方案
- 全量替换所有 Scatter 字符串，包括兼容数据目录。
- 只替换用户可见 UI/Markdown 文案，保留 `.scatter` 存储协议。

## 推荐方案
只替换用户可见 Markdown 文案为 Canvasight，保留 `.scatter` 存储目录和 schema 名称。

## 实施步骤
1. 修改 `src/lib/markdown.ts` 的中英文执行说明和标题。
2. 复跑 typecheck/build/MCP smoke。
3. 复测网页 Run。

## 风险与回滚
无数据迁移风险；如需恢复上游命名，回滚文案即可。

## 验证方式
`await_canvasight_run` 返回 Markdown 第一行应为 `# Canvasight Task: ...`。
