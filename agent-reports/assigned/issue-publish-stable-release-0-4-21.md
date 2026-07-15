---
schema_version: 1
report_id: issue-publish-stable-release-0-4-21
report_type: issue
status: assigned
owner: Project Management Agent
created_by: Main Thread
priority: high
version: 2
agent_id: null
thread_id: 019f64b1-7048-7653-a457-6a130ca9a514
created_at: 2026-07-15T07:36:12Z
updated_at: 2026-07-15T07:46:22Z
depends_on:
  - issue-historical-widget-polling-storm
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
  - Independent Node 20.19 release, bundle, typecheck, build, updater, distribution, registration, MCP, concurrency, Skills, Markdown, dev-server, plugin validation, and diff gates passed.
  - Widget runtime smoke passed on Node 25 and on Node 20.19 with the experimental WebSocket harness flag.
  - GitHub Actions run 29397719502 passed macOS, Windows, and Ubuntu Node 20.19 gates for af7f1e9f6eeaaa8a53f7a573c68737da946660bc.
  - Existing 0.4.21 native acceptance covers verified fullscreen ready, visible canvas, meaningful control, bounded polling, and same-task Run delivery.
---

# 发布 Canvasight 0.4.21 并推进 stable 更新通道

## TL;DR

将已经完成自动化与真实 Codex 原生宿主验收的 Canvasight 0.4.21 候选发布为正式 GitHub Release，并仅在 Release 资产验证成功后将 `stable` 快进到同一 tag 提交。

## 问题描述

仓库 `main` 与插件版本已经是 0.4.21，但官方 latest Release 与 `stable` 仍停在 0.4.20，用户要求发布新的正式版本。

## 影响范围

GitHub tag、Release 资产、`stable` 分支、完整插件快照、自更新发现路径与发布审计报告。

## 期望结果

- `v0.4.21` tag 指向发布时的 `main` HEAD。
- Windows、macOS、Linux 发布矩阵全部通过。
- 正式 GitHub Release 资产、checksum 与解包插件验证通过。
- `stable` 最终快进到与 `v0.4.21` 和 Release 完全一致的提交。
- 只提交本轮明确拥有的发布报告与 roster/queue 变更。

## Closure Criteria

- [x] 本地 release、runtime、distribution 与 plugin 门禁通过
- [x] Test Supervisor Agent 独立复核候选
- [x] Customer Support Agent 完成发布文档与 release notes 决策
- [ ] 发布候选报告提交并推送到 `main`
- [ ] `v0.4.21` tag 推送并触发正式 workflow
- [ ] GitHub Actions 三平台矩阵通过
- [ ] GitHub Release、资产与 checksum 验证通过
- [ ] `stable`、tag 与 release commit 一致

## 当前状态

assigned；0.4.21 候选已验证并冻结，等待候选报告提交、tag 与正式 workflow。

## 基线证据

- branch: `main`
- baseline HEAD: `af7f1e9f6eeaaa8a53f7a573c68737da946660bc`
- baseline worktree: clean
- candidate version: `0.4.21`
- latest official Release/tag: `v0.4.20`
- remote stable: `cc7b863c57a07d39ac84e9aec55d8f7f8d00e09d`

## 后续风险

- 正式 workflow 要求 tag commit 等于远端 `main` HEAD；报告提交和 push 后才能打 tag。
- `stable` 只能在 Release 创建并验证成功后普通快进，失败时不得强推或回退受保护分支。
- Agent Team validator 仍被既有 legacy 根报告、旧模板与 QUEUE schema 债务阻断；本轮新报告遵循当前 schema，此债务不属于 release workflow。
