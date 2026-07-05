# Canvasight AI 写入画布 Fan-out 测试补充集成总结

## 时间
2026-07-05 18:46

## 触发问题
用户追问 AI 输出画布的玩法，并指出上一轮验证只覆盖了单线条任务流，需要确认一个节点后面可以连接多个节点。

## Agent Team 结论
- Product Agent：AI 生成画布必须支持一对多连接，默认应追加新 Page，不能只按线性 checklist 设计。
- Test Supervisor Agent：需要补 fan-out smoke test：一个 source 连多个 target 应通过；一个 target 多父应失败。
- Customer Support Agent：README 需要补充 fan-out 支持说明。
- Development Agent：本轮超时未回；主线程基于现有前端手动画布规则确认当前实现已经允许一出多，只禁止一入多。

## 规则确认
- 默认玩法：`write_canvasight_graph` 默认 `append-page`，也就是为 AI 生成内容新开 Page。
- 支持 fan-out：一个节点可以连接多个下游节点。
- 保持现有手动画布规则：一个目标节点不能有多个父节点。
- 不允许自连和重复连线。

## 已实施
- 在 `plugins/canvasight/tests/mcp-smoke.mjs` 新增 fan-out 成功用例：
  - `root -> research`
  - `root -> design`
  - `root -> build`
- 断言写入后 active page 有 4 个节点、3 条边，且三条边 source 都是 `root`。
- 保留并继续覆盖一入多失败用例。
- 在 `README.md` 中英文说明中明确：支持一个节点连接多个下游节点。
- 在 `SKILL.md` 中明确 AI 生成 edge 规则：一出多允许，一入多不允许。

## 验证
- `node --check tests/mcp-smoke.mjs`：通过。
- `npm run test:mcp`：通过。
- `npm run typecheck`：通过。

## Git 状态
本轮只包含 fan-out 测试和文档说明补充。
