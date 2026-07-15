---
schema_version: 1
report_id: issue-publish-stable-release-0-4-21
report_type: issue
status: resolved
owner: Project Management Agent
created_by: Main Thread
priority: high
version: 3
agent_id: /root/project_management_agent
thread_id: 019f64b1-7048-7653-a457-6a130ca9a514
created_at: 2026-07-15T07:36:12Z
updated_at: 2026-07-15T07:53:13Z
depends_on:
  - issue-historical-widget-polling-storm
solution_report: agent-reports/resolved/solution-release-stable-0-4-21.md
related_files:
  - .github/workflows/canvasight-release.yml
  - README.md
  - plugins/canvasight/.codex-plugin/plugin.json
  - plugins/canvasight/package.json
  - plugins/canvasight/package-lock.json
  - plugins/canvasight/mcp/server.source.mjs
  - plugins/canvasight/mcp/server.mjs
  - plugins/canvasight/dist
verification_status: passed
verification_evidence:
  - Independent local Node 20.19 release candidate matrix and plugin validation passed.
  - GitHub Actions release run 29398622203 passed macOS, Windows, Ubuntu, packaging, Release publication, and stable fast-forward.
  - Official v0.4.21 Release is latest, non-draft, and non-prerelease with bilingual notes and two verified assets.
  - Downloaded zip checksum, unpacked release verification, no-node_modules snapshot, 16-tool MCP registration, and plugin validation passed.
  - Remote main, stable, and the dereferenced v0.4.21 tag all point to c420fe3916ca3af0423747a5b27f7ad5ad1043a4.
---

# 发布 Canvasight 0.4.21 并推进 stable 更新通道

## TL;DR

Canvasight v0.4.21 已通过本地与三平台发布门禁，发布为正式 GitHub Release，并在资产验证成功后将 `stable` 普通快进到同一提交。

## 问题描述

仓库插件版本已经是 0.4.21，但官方 latest Release 与 `stable` 仍停在 0.4.20，用户要求发布新的正式版本。

## 影响范围

GitHub tag、Release 资产、`stable` 分支、完整插件快照、自更新发现路径、双语 README 与发布审计报告。

## Closure Criteria

- [x] 本地 release、runtime、distribution 与 plugin 门禁通过
- [x] Test Supervisor Agent 独立复核候选
- [x] Customer Support Agent 完成发布文档与双语 release notes
- [x] 发布候选报告提交并推送到 `main`
- [x] `v0.4.21` tag 推送并触发正式 workflow
- [x] GitHub Actions 三平台矩阵通过
- [x] GitHub Release、资产与 checksum 验证通过
- [x] `stable`、tag 与 release commit 一致

## 当前状态

resolved；Canvasight v0.4.21 已正式发布并完成稳定更新通道闭环。

## 基线证据

- branch: `main`
- baseline HEAD: `af7f1e9f6eeaaa8a53f7a573c68737da946660bc`
- release candidate: `c420fe3916ca3af0423747a5b27f7ad5ad1043a4`
- previous Release/stable: `v0.4.20` / `cc7b863c57a07d39ac84e9aec55d8f7f8d00e09d`

## 处理结果

正式 Release `v0.4.21` 发布于 2026-07-15T07:51:33Z。workflow `29398622203` 的 macOS、Windows、Ubuntu、打包、发布与 stable 快进全部通过；Release 已补充中英文用户说明。

## 修改文件

- 双语 README 发布命令示例、ROSTER/QUEUE、发布 issue 与候选/closure 报告。

## 验证方式

- Node 20.19 本地与 GitHub Actions 三平台门禁。
- 下载 `canvasight-v0.4.21.zip` 与 checksum，执行 SHA-256 校验。
- 解包后验证无 `node_modules`、版本 0.4.21、7 个 Skills、16 个 MCP tools 和 plugin validator。
- 远端 `main`、`stable` 与 `v0.4.21^{}` refs 对齐。

## 后续风险

- GitHub Actions 仍提示 `actions/checkout@v4` 与 `actions/setup-node@v4` 的 Node 20 action runtime 弃用；产品测试 Node 20.19 通过，action major 升级留待后续维护。
- Agent Team validator 仍被既有 legacy 根报告、旧模板与 QUEUE schema 债务阻断，本轮没有扩大该历史债务。
