---
status: resolved
report_type: solution
owner: Development Standards Lead
created_by: Main thread
priority: medium
created_at: 2026-07-05 22:57
updated_at: 2026-07-05 22:57
related_files:
  - plugins/canvasight/skills/canvasight-agent-team/SKILL.md
  - plugins/canvasight/skills/canvasight-agent-team/references/agent-selection.md
  - plugins/canvasight/skills/canvasight-agent-team/references/report-protocol.md
  - plugins/canvasight/skills/canvasight-run/references/run-output-contract.md
  - plugins/canvasight/src/lib/markdown.ts
  - README.md
solution_report:
agent_id: 019f31ba-6cb5-76a1-8626-449964f8c6b4
---

# 补齐 AGENTS.md Bootstrap 解决方案

## Linked Issue

`agent-reports/resolved/20260705-2257-product-issue-agents-md-bootstrap.md`

## 负责 Agent

Development Standards Lead

## Root Cause

Agent Team 的固定角色和 report queue 是项目级长期协作规则，但原 skill 对 `AGENTS.md` 的处理偏向“存在则读取”，没有把“缺失或缺少协议时由 Development Standards Lead 补齐”写成可执行边界。

## 调研过程

- 复核 Canvasight 当前 `AGENTS.md`，确认本项目已经记录角色边界、README 责任、验证命令和协作规则。
- 复核 `canvasight-agent-team` skill 和 references，确认可在主 skill 保持精简，把详细 bootstrap 规则放入 references。
- 参考 Product Agent 风险意见：不能把默认开启 Agent Team 理解为允许静默修改任意目标项目。
- 按 Skill Expert 方向补充触发面、边界和 Run 输出契约。

## 可选方案

1. 每次 Run 都要求创建或更新 `AGENTS.md`。
2. 只在 skill 内口头建议阅读 `AGENTS.md`，不规定缺失处理。
3. 采用受控 bootstrap：实际使用 Agent Team 时检查 `AGENTS.md`，缺失或协议不完整先交给 Development Standards Lead；只有授权或项目规则允许时创建或最小更新。

## 推荐方案

采用方案 3。它保持 Agent Team 的持久协作能力，也避免普通 Run 或默认开关导致未经授权的项目文件修改。

## 实施步骤

- 在 `canvasight-agent-team/SKILL.md` 增加 `AGENTS.md` 检查、Development Standards Lead 路由和静默写入禁令。
- 在 `references/agent-selection.md` 增加 `AGENTS.md Bootstrap Rule`。
- 在 `references/report-protocol.md` 增加目标项目缺少 report 指南时的交接规则。
- 在 `canvasight-run` 输出契约中要求执行 Markdown 前先处理 Agent Team / `AGENTS.md` 缺口。
- 在 Run Markdown 文案和 README FAQ 中同步说明。
- bump 插件版本到 `0.1.9`，确保 reinstall 后 Codex 使用新 skill。

## 风险与回滚

- 风险：外部目标项目已有不同协作协议时，Canvasight 规则可能产生冲突。
- 缓解：skill 已要求保留已有协议、记录冲突并询问，不直接替换。
- 回滚：恢复上述文件到上一个提交，并把版本回退到 `0.1.8`。

## 验证方式

- `npm run typecheck`
- `npm run test:mcp`
- `npm run build`
- `python3 /Users/niallyoung/.codex/skills/.system/plugin-creator/scripts/validate_plugin.py /Users/niallyoung/Desktop/Canvasight/plugins/canvasight`
- `git diff --check`
- `rg` 检查 `AGENTS.md` bootstrap、Development Standards Lead、静默写入禁令是否覆盖 skill、Run 契约和 README。

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

需要在真实 Canvasight Run 中继续观察：当目标项目没有 `AGENTS.md` 且用户没有明确授权写文件时，Codex 是否能正确记录限制或询问，而不是直接写入。
