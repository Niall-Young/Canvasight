---
schema_version: 1
report_id: issue-publish-stable-release-0-4-35
report_type: issue
status: resolved
owner: Project Management Agent
created_by: Main Thread
priority: high
version: 3
agent_id: /root/project_management_agent
thread_id: 019f744d-c7f1-7383-8195-7478c2cd835e
created_at: 2026-07-18T12:01:22Z
updated_at: 2026-07-18T12:19:00Z
depends_on:
  - issue-windows-cli-daemon-state-cleanup-0-4-34
  - issue-publish-stable-release-0-4-34
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
  - Exact 0.4.35 local matrix, immutable cache and native acceptance passed.
  - Workflow 29643956675 passed Ubuntu, macOS and Windows Node 20.19 plus publish/stable job.
  - Release v0.4.35 is non-draft and non-prerelease with verified zip checksum; package has version 0.4.35, seven Skills, sixteen tools and no node_modules.
  - origin/stable and v0.4.35 both dereference to 7f2451b488c65ec6b9ab57e972af07d70998cccf.
---

# 发布 Canvasight 0.4.35 并推进 stable 更新通道

## TL;DR

Canvasight 0.4.35 已通过本地、exact native 与三平台 release matrix，GitHub Release 已发布，stable 已普通 fast-forward 到 exact tag commit。

## Closure Criteria

- [x] 版本、bundle、dist、本地矩阵与 plugin validator 一致
- [x] exact install 与 native ready/control/Run/late-state 通过
- [x] Windows/macOS/Ubuntu Node 20.19 matrix 通过
- [x] GitHub Release 资产与 checksum 验证通过
- [x] stable 普通 fast-forward 到 exact tag commit

## 当前状态

resolved。

## 处理结果

Release `v0.4.35` 已发布，stable 指向 `7f2451b488c65ec6b9ab57e972af07d70998cccf`。失败的 v0.4.34 tag 保持不变。

## 修改文件

- 0.4.35 release candidate 与本轮 Agent Team 记录。

## 验证方式

- Workflow `29643956675`
- Release asset SHA-256 校验
- 解压资产 plugin validator 与 MCP registration probe
- remote main/stable/tag dereference audit

## 后续风险

内置 updater 的一次 `--check` 遭 GitHub HTTP 403，未取得 updater 自身的 up-to-date 结果，也未发生更新操作；Release、stable 与资产身份验证不受影响。
