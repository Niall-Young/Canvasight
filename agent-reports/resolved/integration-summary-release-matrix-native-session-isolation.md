---
schema_version: 1
report_id: integration-summary-release-matrix-native-session-isolation
report_type: integration-summary
status: resolved
owner: Main Thread
created_by: Main Thread
priority: high
version: 1
agent_id: /root
thread_id: 019f730b-0404-75f0-a460-3a080f0addd6
created_at: 2026-07-18T02:52:40Z
updated_at: 2026-07-18T02:52:40Z
depends_on:
  - issue-publish-stable-release-0-4-29
  - issue-release-matrix-invalidates-native-session
  - solution-release-matrix-native-session-isolation
  - issue-publish-stable-release-0-4-30
related_files:
  - ROSTER.md
  - agent-reports/QUEUE.md
  - plugins/canvasight/.codex-plugin/plugin.json
  - plugins/canvasight/package.json
  - plugins/canvasight/package-lock.json
  - plugins/canvasight/mcp/server.source.mjs
  - plugins/canvasight/mcp/server.mjs
  - plugins/canvasight/tests/mcp-smoke.mjs
  - plugins/canvasight/tests/widget-runtime-smoke.mjs
verification_status: passed
verification_evidence:
  - Root cause reproduced: widget-runtime stopper ignored its CLI home and stopped the default native daemon.
  - Complete 0.4.30 isolated release matrix passed without creating default daemon state or appending default lifecycle events (11384 to 11384).
  - Test Supervisor independently reran MCP and widget runtime tests with default lifecycle unchanged (11391 to 11391).
  - Release verify, bundle freshness, typecheck/build, updater, distribution, MCP registration/runtime, concurrency, Markdown, Skills, diff check and plugin validation passed.
---

# 发布矩阵原生 Session 隔离修复集成总结

## 本轮目标

- 解释用户看到的 `stage=session / Session not found`，禁止发布有缺陷的 0.4.29。
- 修复测试 cleanup 跨 home 误停真实 Canvasight daemon 的根因。
- 形成可提交、可安装但尚未正式发布的 exact 0.4.30 候选。

## Agent 状态与输入

- Product Agent：Main Thread 代行；自动化矩阵绝不能破坏真实画布 session，0.4.29 失败后不得降格验收。
- Design Agent / Design Standards Expert：无 UI、布局、交互语义变化，`design.md` 无需修改。
- Development Agent：定位 CLI/env home 语义分裂，修 runtime、测试 cleanup、双 daemon 回归并同步 0.4.30。
- Test Supervisor Agent：独立复跑隔离测试，确认 default state absent、lifecycle 零变化，放行 commit/install，不放行正式发布。
- Customer Support Agent：Main Thread 代行；内部 daemon 目标解析与测试隔离不改变用户安装或使用方式，README 无需修改。
- Development Standards Lead：现有 AGENTS 已覆盖 runtime 版本同步与原生验收边界，无需修改。
- Project Management Agent：审查 baseline、scope、0.4.29/0.4.30 发布 issue 分离与远端未发布状态，等待选择性提交。
- Skill Expert Agent：Skill 触发边界与内容未变，无 Skill 文件修改。

## 报告状态变更

- `issue-release-matrix-invalidates-native-session`：open v1 → assigned v2 → resolved v3，并链接 solution。
- `solution-release-matrix-native-session-isolation`：resolved v1。
- `issue-publish-stable-release-0-4-29`：assigned v1 → blocked v2，明确禁止发布。
- `issue-publish-stable-release-0-4-30`：open v1 → assigned v2，由 Project Management Agent 持有。

## 已解决

- `--canvasight-home` 正式参与 runtime 路径解析，优先级为 CLI > env > 默认 `~/.canvasight`。
- widget runtime stopper 同时传 env 与 CLI，防止任一解析路径退化后落到默认 home。
- MCP smoke 用 control/target 双 daemon 证明 CLI target cleanup 不影响 env control。
- 0.4.29 已禁止发布；runtime 与生成 bundle 版本同步为 0.4.30。

## 验证

- `release:prepare 0.4.30`、`release:verify 0.4.30`、`check:mcp-bundle`、typecheck/build 通过。
- updater、clean distribution、MCP registration/runtime、composed widget、concurrency、Markdown/export、Skills、plugin validator 通过。
- 主线程隔离矩阵期间，真实 default daemon state 前后均不存在，default lifecycle `11384 → 11384`。
- Test Supervisor 独立复跑期间 default lifecycle `11391 → 11391`。
- `git diff --check` 通过。
- Agent Team 全量 validator 仍被历史 legacy 报告、旧 frontmatter 与 QUEUE debt 阻断；本轮新增 schema 报告无专项错误。

## 未解决 / 后续风险

- exact 0.4.30 尚未安装；安装后必须重启 Codex Desktop，新建并重新 @Canvasight 的任务完成 instance-bound ready、Refresh、same-task Run、A→B→A 与 late-metadata 验收。
- 任何安装后代码变化都使候选失效；原生验收后不得再运行本地 lifecycle 测试。
- 0.4.30 未通过真实宿主验收前不得推 tag、创建 Release 或推进 stable。

## Git 状态

- branch: `main`
- baseline: `a23d768df695acba389b38722324c46b3c926425`
- approved scope: roster/queue、0.4.29 blocked issue、0.4.30 publish issue、本轮 isolation issue/solution/integration summary、四处 0.4.30 版本字段、MCP source/generated bundle、两份 smoke tests。
- planned subject: `fix: 隔离发布测试的 Canvasight daemon`
- staged scope: 由 Project Management Agent 仅按 approved scope 选择性暂存并复核。
- commit: 同提交 hash 将作为安装候选与后续发布证据回报；不在提交自身回填。
