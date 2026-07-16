---
schema_version: 1
report_id: issue-publish-stable-release-0-4-24
report_type: issue
status: resolved
owner: Project Management Agent
created_by: Main Thread
priority: high
version: 2
agent_id: /root/project_management_agent
thread_id: null
created_at: 2026-07-16T08:27:13Z
updated_at: 2026-07-16T08:55:38Z
depends_on: []
solution_report: agent-reports/resolved/solution-release-stable-0-4-24.md
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
  - Normal-history rollback commit a5840a8 removed the three post-logo rich-content iterations without force-pushing main.
  - Candidate ae9245a passed local Node 20.19 gates, exact 0.4.24 native fullscreen acceptance, and main CI 29484237659.
  - Release workflow 29484808780 passed Windows, macOS, Ubuntu, package publication, and stable fast-forward.
  - Official assets passed SHA-256, no-node_modules, five-version-field, seven-Skill, sixteen-tool, and plugin validation checks.
  - Main, stable, and dereferenced v0.4.24 tag all resolve to ae9245a4d494e09ca3866f06abedaea74db13ebf.
---

# 发布回退后的 Canvasight 0.4.24

## TL;DR

Canvasight v0.4.24 已作为回退版本正式发布，恢复 0.4.21 稳定行为、保留新版 Logo，并移除未发布的富内容编辑迭代。

## 问题描述

用户明确不要 Logo 版本之后的三次富内容代码，但已发布版本号不能降级或复用，因此通过正常 Git 反向提交恢复产品代码并发布递增版本。

## 影响范围

远端 `main`、`v0.4.24` tag、GitHub Release、`stable`、完整插件快照与自更新发现路径。

## Closure Criteria

- [x] 三次后续代码提交已通过正常 revert 撤销，不 force push
- [x] 0.4.24 版本字段与生成产物一致
- [x] 本地 release matrix 与插件校验通过
- [x] 候选提交推送到 `main`
- [x] `v0.4.24` 三平台 workflow、Release 和 `stable` 通过
- [x] 官方资产、checksum、版本、工具注册和 refs 验证通过

## 当前状态

resolved；Canvasight v0.4.24 已正式发布并完成 stable 更新通道闭环。

## 处理结果

正式 Release 发布于 2026-07-16T08:51:17Z，发布说明已改为中英文回退说明；`stable` 已普通快进到 tag commit。

## 修改文件

- 发布版本字段、MCP bundle、README release 示例与 Agent Team 报告。

## 验证方式

- 本地 Node 20.19、原生 fullscreen Widget、GitHub Actions、官方资产下载、checksum、解包注册与 refs 对齐。

## 后续风险

- 未认证 updater live check 受 GitHub 匿名 API 403 限流；已通过认证 GitHub API 独立确认 latest Release 与 stable/tag commit 一致。
- 独立 plugin tag workflow 首次 Windows MCP 并发 rename 出现 EPERM，rerun 后三平台全部通过；正式 release workflow 同一 Windows 门禁首轮即通过。
