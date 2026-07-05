# Canvasight AI 写入画布协议集成总结

## 时间
2026-07-05 18:37

## 需求
允许 Codex/AI 写入项目下的 `.scatter/scatter.json` 来创建 Canvasight 节点和连线，用于代码架构分析、产品需求梳理、任务拆解等场景。

## Agent Team 结论
- Product Agent：应把 `.scatter/scatter.json` 明确为 AI 可写入的本地画布协议；默认追加新 Page，避免覆盖用户现有画布；该能力不是执行协议，Run 仍通过 MCP payload。
- Design Agent：不新增重 UI；AI 写入内容应渲染为普通可编辑节点和连线；已打开页面需要刷新或重新打开来加载外部写入。
- Development Agent：现有服务端已有 v1 normalize 基础，但不能只依赖 AI 手写完整 JSON；需要明确写入协议和校验。主线程选择直接提供 MCP tool，而不是只做脚本，因为这更符合 Codex 插件工作流。
- Test Supervisor Agent：必须覆盖工具列表、合法图写入、非法 edge 拒绝、旧 v1 兼容、构建和浏览器渲染。
- Customer Support Agent：README 必须更新，因为这是新的用户可见工作流。
- Design Standards Expert：`design.md` 需要补充 AI 生成画布和 Canvas 文件协议规则。
- Development Standards Lead / Project Management Agent：受当前子智能体数量限制未单独分配；主线程代做版本同步、文档范围、git staging 和提交检查。

## 已实现
- 新增 MCP tool：`write_canvasight_graph`。
- MCP 版本从 `0.1.1` bump 到 `0.1.2`，同步更新：
  - `plugins/canvasight/mcp/server.mjs`
  - `plugins/canvasight/package.json`
  - `plugins/canvasight/package-lock.json`
  - `plugins/canvasight/.codex-plugin/plugin.json`
- `write_canvasight_graph` 支持：
  - `projectPath`
  - `projectName`
  - `mode`: `append-page`、`replace-active-page`、`replace-document`
  - `layout`: `horizontal`、`vertical`、`grid`
  - 单页 `nodes` / `edges`
  - 多页 `pages`
- 默认使用 `append-page`，AI 输出会进入新 Page。
- 自动为缺坐标节点生成默认布局。
- 写回合法 `.scatter/scatter.json` v1，并保持 active page 顶层 `nodes` / `edges` / `viewport` 镜像。
- 校验规则：
  - 节点 id 必须唯一。
  - edge source / target 必须引用同一 Page 内存在的节点。
  - 不允许自连。
  - 不允许重复 `source -> target`。
  - 一个节点不能有多个父边，保持和前端手动连线规则一致。
- 更新 `SKILL.md`，指示 Codex 在分析架构、需求或计划并生成画布时优先调用 `write_canvasight_graph`。
- 更新 `README.md` 中英文说明，补充 AI 直接创建画布的用途、示例、边界和新 MCP tool。
- 更新 `design.md`，补充 AI-generated canvas 和 canvas file protocol 设计规则。
- 扩展 MCP smoke test，覆盖新 tool、合法图写入、非法 edge 拒绝、版本和 daemon 兼容。

## 验证
- `node --check plugins/canvasight/mcp/server.mjs`：通过。
- `node --check plugins/canvasight/tests/mcp-smoke.mjs`：通过。
- `npm run typecheck`：通过。
- `npm run build`：通过。
- `npm run test:mcp`：通过。
- `npm run test:dev-server`：通过。
- 插件校验：
  `python3 /Users/niallyoung/.codex/skills/.system/plugin-creator/scripts/validate_plugin.py /Users/niallyoung/Desktop/Canvasight/plugins/canvasight`：通过。
- 浏览器验证：
  - 通过 `write_canvasight_graph` 在临时项目生成 `Browser Architecture Check` Page。
  - 插件 daemon 打开临时项目。
  - 页面渲染 3 个 React Flow 节点和 2 条边。
  - 当前 Page 显示为 `Browser Architecture Check`。
  - 控制台 error/warn：无。
  - 临时 daemon 和临时项目已清理。

## 风险与后续
- v1 不做运行中网页的自动文件监听；如果网页已经打开，外部写入后需要刷新或重新打开项目。
- 未来可以在前端增加外部文件变更检测和轻量 toast，同步 AI 写入。
- 如果后续需要更复杂架构图，可继续扩展 layout 算法，但当前默认布局已满足最小可用。

## Git 状态
本轮变更范围仅包含 AI 写入画布功能、版本同步、文档和测试。
