# Canvasight AI 画布分类与 Skill 拆分集成总结

## 本轮目标

- 将 AI 写入画布的“分类”定义为任务生成策略，而不是 Page 概念。
- 增加 `write_canvasight_graph.graphType`，让 Codex 能按不同任务结构组织节点和连线。
- 拆分过长的 `SKILL.md`，把详细协议沉淀到 references。
- 更新 README、design.md 和 MCP smoke test。

## Agent 协作

- 产品 Agent：确认分类只影响节点结构、标题、边界和连线方式，不决定 Page 创建、切换或覆盖。
- 设计 Agent：确认 Page 仍是用户工作区边界，分类不应变成导航或 Page 类型。
- 开发 Agent：建议 `graphType` 作为 MCP 写入元数据，`mode` 仍是唯一 Page 写入控制。
- 测试监督 Agent：要求验证 `graphType` 不改变 `mode` 行为，并覆盖文章、代码库、产品开发和 fan-out。
- 客服 Agent：要求 README 说明分类不绑定 Page，Skill 拆分不作为普通用户流程展示。
- 设计规范专家：建议在 design.md 中沉淀 AI 生成结构分类与 Page Model 的边界。

本轮尝试新增“开发规范组长”智能体时命中子线程数量上限，因此由主线程按 AGENTS.md 执行规范检查；未继续创建额外智能体。

## 已完成改动

- MCP server 版本升级到 `0.1.3`。
- `write_canvasight_graph` 新增 `graphType`：
  - `software-product`
  - `article-outline`
  - `codebase-structure`
  - `task-plan`
  - `general`
- `graphType` 只影响默认布局和返回结构，不影响 `append-page`、`replace-active-page`、`replace-document` 的 Page 写入语义。
- `SKILL.md` 精简为入口、工具路由和硬规则。
- 新增 Skill references：
  - `references/workflow.md`
  - `references/ai-graph-writing.md`
  - `references/graph-type-classification.md`
  - `references/codex-native-modes.md`
- README 中英文同步补充 AI 分类策略。
- design.md 增加 AI-generated task structure 和 Page Model 边界。
- MCP smoke 新增：
  - `graphType` schema 断言
  - `codebase-structure` 写入
  - `article-outline + replace-active-page` 不新增 Page
  - `task-plan` fan-out
  - `software-product` 产品开发结构

## 未解决 / 风险

- 当前仍保留手动画布的连线规则：一个节点可以连接多个下游节点，但一个目标节点不能有多个父节点。后续如果要支持多父 DAG，需要同步修改前端连接校验、MCP 校验、布局和文档。

## 验证

- `node --check plugins/canvasight/mcp/server.mjs`
- `node --check plugins/canvasight/tests/mcp-smoke.mjs`
- `npm run typecheck`
- `npm run build`
- `npm run test:mcp`
- `python3 /Users/niallyoung/.codex/skills/.system/plugin-creator/scripts/validate_plugin.py /Users/niallyoung/Desktop/Canvasight/plugins/canvasight`

全部通过。
