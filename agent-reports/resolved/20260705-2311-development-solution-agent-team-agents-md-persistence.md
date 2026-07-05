---
status: resolved
report_type: solution
owner: Development Standards Lead
created_by: Main thread
priority: high
created_at: 2026-07-05 23:11
updated_at: 2026-07-05 23:11
related_files:
  - plugins/canvasight/skills/canvasight-agent-team/SKILL.md
  - plugins/canvasight/skills/canvasight-agent-team/references/agent-selection.md
  - plugins/canvasight/skills/canvasight-agent-team/references/report-protocol.md
  - plugins/canvasight/skills/canvasight-run/references/run-output-contract.md
  - plugins/canvasight/mcp/server.mjs
  - plugins/canvasight/src/lib/markdown.ts
  - plugins/canvasight/tests/mcp-smoke.mjs
  - README.md
solution_report:
agent_id: 019f31ba-6cb5-76a1-8626-449964f8c6b4
---

# 默认持久化 Agent Team AGENTS.md 协议

## Linked Issue

`agent-reports/resolved/20260705-2311-product-issue-agent-team-agents-md-persistence.md`

## 负责 Agent

Development Standards Lead

## Root Cause

Subagent 复用和角色映射是 thread-local 运行状态。Canvasight setting 只能表达 Agent Team 意图，不能让新 thread 自动继承上一条 thread 的 subagent 状态。跨 thread 的稳定性必须依赖目标项目 `AGENTS.md` 中的持久协作协议，因此只改 Run Markdown 不够，服务端需要在 Run 入队时写入受控协议块。

## 调研过程

- 复查上一版 `canvasight-agent-team` skill，确认存在“只有用户要求或项目规则允许才写”的限制。
- 复查 Run Markdown 文案和 README，确认同样传达了过强的授权前置条件。
- 根据用户反馈确认产品目标：开启 Agent Team 后，应默认把最小协作协议写入目标项目规则，以便新 thread 能继续使用同一套工作方式。
- 根据 Test Supervisor 要求补充文件态验证：缺失创建、已有追加、重复不追加、关闭 Agent Team 不写入。

## 可选方案

1. 保持上一版，继续只在用户明确要求时写入 `AGENTS.md`。
2. 每次 Run 都覆盖目标项目 `AGENTS.md`。
3. Agent Team 实际启用时默认创建或最小追加 `AGENTS.md` 协议；不覆盖已有规则，冲突时写 report 并询问。

## 推荐方案

采用方案 3。它满足跨 thread 持久性，同时避免破坏用户已有项目规则。

## 实施步骤

- 在 MCP server 中新增 `ensureAgentTeamAgentsMd`，使用 `<!-- canvasight-agent-team:start/end -->` 哨兵块管理 Canvasight 自己的协议段。
- 在 `/api/sessions/:id/run` 入队前执行 bootstrap，并把结果挂到 `structuredContent.agentTeam.agentsMd`。
- 更新 `canvasight-agent-team/SKILL.md`：优先读取 `structuredContent.agentTeam.agentsMd`，缺失时再由 Development Standards Lead 手动补齐。
- 更新 `agent-selection.md`：加入最小追加段落模板，说明按需补角色和 integration summary 记录。
- 更新 `report-protocol.md` 和 `run-output-contract.md`：把 report 协议和 Run 执行前检查改成默认持久化。
- 更新 `src/lib/markdown.ts`：网页 Run payload 明确要求创建文件或追加最小段落。
- 更新 README 中英文 FAQ。
- bump 到 `0.1.10` 并更新 MCP smoke 版本断言。

## 风险与回滚

- 风险：目标项目已有冲突规则时不应直接改。
- 缓解：契约已要求先写 issue/risk report 并询问。
- 回滚：恢复上述文件并把版本退回 `0.1.9`。

## 验证方式

- `npm run typecheck`
- `npm run test:mcp`，覆盖 `created`、`appended`、`unchanged`、`skipped` 四种 `AGENTS.md` bootstrap 状态
- `npm run build`
- plugin validate
- skill `quick_validate.py`
- `git diff --check`
- `rg` 检查旧授权前置文案已移除，新默认持久化文案覆盖 skill、Run、README。

## 处理结果

已修复。

## 修改文件

- `plugins/canvasight/skills/canvasight-agent-team/SKILL.md`
- `plugins/canvasight/skills/canvasight-agent-team/references/agent-selection.md`
- `plugins/canvasight/skills/canvasight-agent-team/references/report-protocol.md`
- `plugins/canvasight/skills/canvasight-run/references/run-output-contract.md`
- `plugins/canvasight/src/lib/markdown.ts`
- `README.md`
- `plugins/canvasight/package.json`
- `plugins/canvasight/package-lock.json`
- `plugins/canvasight/.codex-plugin/plugin.json`
- `plugins/canvasight/mcp/server.mjs`
- `plugins/canvasight/tests/mcp-smoke.mjs`

## 后续风险

真实目标项目中如果 `AGENTS.md` 有强约束或团队已有不同 agent workflow，新 thread 仍需要先记录冲突并询问，不应强行替换。
