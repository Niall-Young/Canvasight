# Canvasight Skill 拆分集成总结

## 本轮目标

- 将原本过宽的 `canvasight` 单一 Skill 拆分为多个触发边界更清晰的 Skill。
- 保留一个薄 `canvasight` 索引，减少误触发。
- 新增专门处理打开画布、接收 Run、AI 写图、排障的 Skill。
- 将 Skill 专家 Agent 纳入团队职责说明。

## Agent 协作

- 产品 Agent：支持薄索引 + 四个专项 Skill 的拆分方案，要求 README 中英文说明能力分工。
- 设计 Agent：提醒不要让 Skill 边界泄漏到用户主导航，Page / Run / AI 生成概念必须保持清晰。
- 开发 Agent：提出反对意见，认为“一个 Skill + references”维护成本更低。主线程评估后按用户明确要求采用多 Skill 拆分，并通过验证降低风险。
- 测试监督 Agent：要求对每个 Skill 单独跑 `quick_validate.py`，并跑插件校验、typecheck、build、MCP smoke。
- 客服 Agent：要求 README 解释多 Skill 能力分工，但不要把开发命令写成普通用户流程。
- 设计规范专家：要求 design.md 只补信息架构和能力边界，不写实现细节。
- Skill 专家 Agent：本轮尝试新增专职 Agent 时工具返回 `agent thread limit reached`。已在 `AGENTS.md` 增加该角色定义；本轮由主线程按 `skill-creator` 规范代行。

## 已完成改动

- `canvasight` 改为薄索引 Skill，只负责明确提到 Canvasight/Scatter 且意图跨能力或不明确时的路由。
- 新增 `canvasight-open`：
  - 打开网页画布
  - 恢复最近项目
  - 从新 Codex thread attach 到 Canvasight
- 新增 `canvasight-run`：
  - 接收 `await_canvasight_run`
  - 处理 Markdown、结构化数据、Chat / Plan / Goal
- 新增 `canvasight-graph-writer`：
  - 使用 `write_canvasight_graph`
  - 管理 `graphType` 与 `mode` 分离
  - 保存 AI 生成画布规则
- 新增 `canvasight-troubleshooting`：
  - 处理插件安装、MCP cache、daemon、URL 失效、连接拒绝等问题
- 移除旧 `canvasight/references/*`，将内容迁移到对应专项 Skill 的 references。
- 插件版本升级到 `0.1.4`。
- README 中英文补充 Skill 分工。
- `AGENTS.md` 增加 Skill Expert Agent 职责。
- `design.md` 增加 Capability Boundaries，明确 Skill 边界不应成为用户主 UI。

## 验证

- `python3 /Users/niallyoung/.codex/skills/.system/skill-creator/scripts/quick_validate.py plugins/canvasight/skills/canvasight`
- `python3 /Users/niallyoung/.codex/skills/.system/skill-creator/scripts/quick_validate.py plugins/canvasight/skills/canvasight-open`
- `python3 /Users/niallyoung/.codex/skills/.system/skill-creator/scripts/quick_validate.py plugins/canvasight/skills/canvasight-run`
- `python3 /Users/niallyoung/.codex/skills/.system/skill-creator/scripts/quick_validate.py plugins/canvasight/skills/canvasight-graph-writer`
- `python3 /Users/niallyoung/.codex/skills/.system/skill-creator/scripts/quick_validate.py plugins/canvasight/skills/canvasight-troubleshooting`
- `python3 /Users/niallyoung/.codex/skills/.system/plugin-creator/scripts/validate_plugin.py /Users/niallyoung/Desktop/Canvasight/plugins/canvasight`
- `node --check plugins/canvasight/mcp/server.mjs`
- `node --check plugins/canvasight/tests/mcp-smoke.mjs`
- `npm run typecheck`
- `npm run build`
- `npm run test:mcp`

全部通过。

## 后续注意

- 后续如果工具线程上限解除，应真正创建并复用 Skill 专家 Agent。
- 拆分后的 Skill 是否按预期触发，需要在新 Codex 线程或 reload 后验证，因为当前线程可能保留旧插件 metadata。
