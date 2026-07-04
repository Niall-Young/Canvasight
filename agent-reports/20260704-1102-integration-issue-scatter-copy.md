# Scatter 文案泄漏问题

## 发现者
主线程集成负责人

## 现象
浏览器 Run 后返回的 Markdown 标题仍为 `Scatter Task`，执行说明中仍出现 `Scatter canvas context`。

## 影响范围
插件名称已改为 Canvasight，但输出内容仍暴露上游 Scatter 品牌，影响产品一致性。

## 复现步骤
1. 打开 Canvasight。
2. 创建节点并点击 Run。
3. 调用 `await_canvasight_run`。

## 证据
MCP 返回 Markdown 第一行为 `# Scatter Task: Smoke task`。

## 初步归因
迁入上游 `lib/markdown.ts` 后未替换产品文案。

## 交付给哪个 Agent
主线程集成负责人

## 需要回答的问题
- 是否只替换用户可见输出文案，保留 `.scatter` 文件格式名称？
