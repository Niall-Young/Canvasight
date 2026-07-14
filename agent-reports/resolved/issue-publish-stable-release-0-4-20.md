---
schema_version: 1
report_id: issue-publish-stable-release-0-4-20
report_type: issue
status: resolved
owner: Project Management Agent
created_by: Main Thread
priority: high
version: 6
agent_id: null
thread_id: null
created_at: 2026-07-14T07:46:19Z
updated_at: 2026-07-14T08:38:46Z
depends_on:
  - issue-node20-dev-server-daemon-readiness-flake
solution_report: agent-reports/resolved/solution-release-stable-0-4-20.md
related_files:
  - .github/workflows/canvasight-release.yml
  - plugins/canvasight/.codex-plugin/plugin.json
  - plugins/canvasight/package.json
  - plugins/canvasight/package-lock.json
  - plugins/canvasight/mcp/server.source.mjs
  - plugins/canvasight/mcp/server.mjs
  - plugins/canvasight/dist
verification_status: passed
verification_evidence:
  - Exact repo-local canvasight@canvasight-local 0.4.20 is loaded in the current Codex task.
  - Native fullscreen instance widget-615aff4a-ea44-4211-903b-18e2373566a2 reached verified ready with React mounted, project hydration complete, visible 679x793 canvas, and all instance-bound render evidence true.
  - Node 20.19 release version, MCP bundle, typecheck, updater 15/15, clean 16-tool distribution, registration probe, MCP runtime, concurrency, and plugin validation passed.
  - Existing three-platform HEAD CI run 29315619799 passed Windows, macOS, and Ubuntu.
  - The real inline acceptance card framework-confirmation-8b5f6668-c51a-43c3-8973-1f5423b603f5 rendered, submitted passed, and returned its answer to the same Codex task.
  - A replacement fullscreen session rebound the same widget instance and again reached verified ready after the inline continuation.
  - Final frozen 0.4.20 session session-mrke0gjh-c9f52583 reached verified fullscreen ready on widget-77c25f35-07df-4827-bcdb-7ae8b9f3f618 with a visible 679x793 canvas.
  - A meaningful fullscreen canvas control, same-task node Run, and post-interaction late-metadata ready recheck are still missing.
  - Node 20.19 dev-server daemon double-start was fixed with a shared cross-process lock; Development, Main Thread, and Test Supervisor repeated final 0.4.20 verification passed and the related issue is resolved.
  - Final 0.4.20 release prepare/verify, MCP bundle, typecheck/build, updater 15/15, 16-tool clean distribution/registration, MCP, concurrency, widget, Skills, Markdown, plugin validation, and diff checks passed.
  - The user explicitly authorized publication on 2026-07-14 after being told that meaningful fullscreen control, same-task node Run, and post-interaction late-metadata evidence remain unavailable; this is an accepted residual release risk, not a passed native-host acceptance gate.
  - GitHub Actions run 29318596321 passed macOS, Ubuntu, Windows, packaging, Release publication, and stable fast-forward.
  - Official v0.4.20 Release is non-draft and non-prerelease; its zip checksum, unpacked plugin validation, clean no-node_modules snapshot, and 16-tool MCP registration probe passed.
  - Remote main, stable, and the dereferenced v0.4.20 tag all point to cc7b863c57a07d39ac84e9aec55d8f7f8d00e09d.
---

# 发布 Canvasight 0.4.20 并推进 stable 更新通道

## TL;DR

将当前 `main` 的 Canvasight 0.4.20 完整插件快照通过本地与三平台发布门禁后发布为正式 GitHub Release，并仅在 Release 验证成功后将 `stable` 快进到同一提交。

## 问题描述

仓库当前插件版本为 0.4.20，但官方 latest Release 与 `stable` 仍停在 0.4.16，后续正式更新无法取得 0.4.17 至 0.4.20 的已完成改动。

## 影响范围

GitHub tag、Release 资产、`stable` 分支、完整插件快照、自更新发现路径与 release-facing 文档。

## 期望结果

- `v0.4.20` tag 指向发布时的 `main` HEAD。
- Windows、macOS、Linux 发布矩阵全部通过。
- 正式 GitHub Release 资产、checksum 与解包插件验证通过。
- `stable` 最终快进到与 `v0.4.20` 和 Release 完全一致的提交。
- 仅纳入本轮明确拥有的发布报告与 closure 文件。

## Closure Criteria

- [x] 核心本地 release、runtime、distribution 与 plugin 门禁通过
- [x] `test:dev-server` Node 20.19 波动已修复并取得可信独立重复结果
- [x] 消息内确认卡已提交并回到同一任务
- [ ] fullscreen 控件、同任务节点 Run 与 late-metadata 复核通过（用户明确接受为发布残余风险，未记为验收通过）
- [x] 发布候选提交与 tag 已推送
- [x] GitHub Actions 三平台矩阵通过
- [x] GitHub Release、资产与 checksum 已验证
- [x] `stable`、tag 与 release commit 一致

## 当前状态

resolved；Canvasight 0.4.20 已正式发布，资产与 refs 验证通过。

## 基线证据

- branch: `main`
- baseline HEAD: `de7336eb6c139c1480542d76b358e1aa907a2f24`
- baseline worktree: clean before Agent Team release reports
- latest official Release: `v0.4.16`
- remote `stable`: `ba7ef87910262a510333f5399fbdf44068fec8a7`

## 处理结果

候选提交 `cc7b863c57a07d39ac84e9aec55d8f7f8d00e09d` 已推送并发布为正式 `v0.4.20`。Actions `29318596321` 在 macOS、Ubuntu、Windows 全部通过，Release 资产与 SHA-256 校验通过，`stable` 已普通快进至同一提交。用户接受的 native control/Run/late-metadata 缺口继续作为未通过验收的残余风险保留。

## 修改文件

- 0.4.20 双语 README、Vite daemon single-flight、并发回归、发布与集成报告、ROSTER 与 QUEUE。

## 验证方式

- Node 20.19 本地发布矩阵与正式 tag 三平台 CI。
- `open_canvasight` + `await_canvasight_widget_ready` 精确实例回执。
- `gh release view`、Git remote refs、Release 下载、SHA-256、解包 plugin validator 与 16-tool registration probe。
- inline 卡已提交并回到同一任务；fullscreen 控件、节点 Run 与 late-metadata 仍无验收证据，用户已明确接受这一发布风险。

## 后续风险

- 本次发布经用户明确授权可继续，但 fullscreen 控件、同任务 Run 与交互后的 late-metadata 仍不得记为通过，也不得在交付说明中声称原生宿主已完整验收。
- GitHub Actions 提示 `actions/checkout@v4` 与 `actions/setup-node@v4` 的 Node 20 action runtime 已弃用并由 runner 强制切到 Node 24；本次 job 配置的产品测试 Node 20.19 全部通过，但 action major 版本应在后续维护中升级。
