---
schema_version: 1
report_id: integration-summary-canvasight-0-4-20-release-preflight
report_type: integration-summary
status: resolved
owner: Main Thread
created_by: Main Thread
priority: high
version: 2
agent_id: /root
thread_id: 019f5f96-4f0f-74a0-aa64-437181711830
created_at: 2026-07-14T08:28:01Z
updated_at: 2026-07-14T08:32:19Z
depends_on:
  - issue-publish-stable-release-0-4-20
  - issue-node20-dev-server-daemon-readiness-flake
  - solution-node20-dev-server-daemon-readiness-flake
related_files:
  - README.md
  - ROSTER.md
  - agent-reports/QUEUE.md
  - plugins/canvasight/vite.config.ts
  - plugins/canvasight/tests/dev-server-smoke.mjs
verification_status: passed
verification_evidence:
  - Final 0.4.20 automated local release matrix, Node 20.19 repeated dev-server regression, plugin validation, and diff checks passed.
  - Real inline framework confirmation rendered, submitted passed, and returned to the same Codex task.
  - Final frozen 0.4.20 fullscreen instance reached instance-bound verified ready with a visible 679x793 canvas.
  - Release remains blocked only because a meaningful control, same-task node Run, and post-interaction late-metadata recheck have not been observed.
  - The user subsequently acknowledged this exact evidence gap and explicitly authorized publication; the gap remains an unresolved native-host acceptance risk.
---

# Canvasight 0.4.20 发布预检集成总结

## 本轮目标

- 把 `main` 上尚未发布的 0.4.20 完整插件快照准备为最新正式 Release。
- 在 tag 前完成本地、三平台历史 CI、inline 与 native fullscreen 预检，严格保留人工宿主门槛。

## Agent 状态与角色决策

- Development Agent：修复 Vite 与 MCP daemon 启动器未共享跨进程锁的竞态，并增加两个独立 Vite 共用一个 home 的回归。
- Test Supervisor Agent：复现五次 Node 20.19 失败，修复后独立完成最终 0.4.20 三次重复验证和 diff 审计。
- Customer Support Agent：审查全部必读文件并同步中英文 README 的框架确认、项目指导、更新器单命令和 0.4.20 release 命令。
- Project Management Agent：记录基线、远端 refs、tag/Release 缺失、候选范围和禁止提前推 tag 的发布顺序。
- Main Thread：完成 inline/fullscreen 调用、独立八次及最终五次 Node 20.19 回归、完整自动矩阵、版本决策与 blocker 管理。
- Product、Design、Design Standards：产品功能和 UI 视觉未再改变；既有 0.4.17 inline 设计由真实卡片回传验证。
- Development Standards Lead：现有 AGENTS.md 已要求 daemon version-match、single-flight 和 release gate，本轮无需增加新命令或 durable rule。
- Skill Expert Agent：Skill 文件未修改；现有七个 Skill frontmatter 与 smoke 通过。

## 已完成

- `ask_canvasight_framework_questions` 真实 inline 卡片在当前任务提交“验收通过”并成功回传。
- 最终冻结的 0.4.20 fullscreen session 达到 `verified=true`、React mounted、project hydrated、canvas rendered/visible，尺寸 679×793。
- 修复 Vite 仅靠模块内 Promise 导致跨实例重复 daemon 的缺口；现与 MCP 共用原子 `daemon-start.lock`。
- 并发回归启动两个独立 Vite 进程、共用一个 `CANVASIGHT_HOME`，验证 daemon PID/token 不被替换。
- 最终候选保持尚未发布的 0.4.20；MCP/native runtime 字节未因 dev-only 修复改变。
- README 中英文说明与当前 0.4.20 行为、命令一致。

## 验证记录

- `npm run release:prepare -- 0.4.20`、`release:verify`、`check:mcp-bundle`、typecheck、build：通过；`dist` 无差异。
- Node 20.19 dev-server：Development 8 次、Main Thread 最终 5 次、Test Supervisor 最终 3 次连续通过。
- updater 15/15、clean distribution 16 tools、Node 20.19 registration、MCP、concurrency、widget-runtime、Skills、Markdown/Markdown export：通过。
- plugin validator、`git diff --check`：通过。
- Agent Team validator 仍因协议生效前 legacy 根报告、旧模板和既有 QUEUE schema 债务全局失败；本轮新报告字段完整，不迁移历史文件。

## 报告状态变更

- `issue-node20-dev-server-daemon-readiness-flake`：assigned -> resolved/passed，并新增对应 solution。
- `issue-publish-stable-release-0-4-20`：保持 blocked，版本更新为 v4，只剩 native control/Run/late-metadata 门槛。
- ROSTER 与 QUEUE 已按报告状态同步。

## 未解决 / 后续风险

- Computer Use 因安全策略拒绝控制 Codex 自身，无法由 Agent 代点 fullscreen 控件或节点 Run。
- 必须由用户在当前最终实例操作一个有意义的画布控件并点击节点 Run；Run 到达同一任务后再复核该实例未回到 Connecting。
- 用户已在知晓该证据缺口后明确授权继续发布；本轮可进入 stage/commit/tag/push/publish，但该缺口仍必须作为未通过的 native acceptance 风险保留。

## Git 状态

- branch: `main`
- baseline HEAD: `de7336eb6c139c1480542d76b358e1aa907a2f24`
- approved eventual candidate scope: README、Vite lock、dev-server regression、release/dev-server reports、ROSTER 与 QUEUE。
- commit decision: user explicitly accepted the remaining native-host evidence gap, so the release candidate scope is now frozen for selective staging and commit.
- remote latest/stable remain `v0.4.16` / `ba7ef87910262a510333f5399fbdf44068fec8a7`; no `v0.4.20` tag or Release exists.
