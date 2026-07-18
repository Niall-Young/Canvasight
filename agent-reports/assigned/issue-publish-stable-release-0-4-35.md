---
schema_version: 1
report_id: issue-publish-stable-release-0-4-35
report_type: issue
status: assigned
owner: Project Management Agent
created_by: Main Thread
priority: high
version: 2
agent_id: /root/project_management_agent
thread_id: 019f744d-c7f1-7383-8195-7478c2cd835e
created_at: 2026-07-18T12:01:22Z
updated_at: 2026-07-18T12:11:52Z
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
verification_status: not_started
verification_evidence:
  - Commit 0ab416acf52918b59d5798ff00fae10d9c6495cb synchronizes 0.4.35 and passes the complete local matrix.
  - Exact 0.4.35 cache installation contains all 582 tracked plugin files with zero missing and zero mismatches.
  - Restarted Desktop strict ready passed for widget-f3184265-74af-439c-b6f6-884e5294baa3; initial canvas, task return, 50% Refresh, same-task Run and post-Run stability all passed.
  - Test Supervisor independently released the native gate for a new v0.4.35 three-platform workflow.
  - No v0.4.35 tag, GitHub Release, workflow or stable mutation has occurred.
---

# 发布 Canvasight 0.4.35 并推进 stable 更新通道

## TL;DR

0.4.35 修复 Windows CLI 停止 daemon 后的状态残留。只有 Desktop 重启后的 exact native acceptance 与全新三平台 workflow 都通过，才允许创建 Release 并最终 fast-forward stable。

## Closure Criteria

- [x] 0.4.35 版本、bundle、dist、完整本地矩阵与 plugin validator 一致
- [x] scoped commit 与 exact 0.4.35 immutable cache 安装完成
- [x] Desktop 重启后的 strict native ready/control/Run/late-state 验收通过
- [ ] 全新 v0.4.35 Windows/macOS/Ubuntu Node 20.19 matrix 通过
- [ ] GitHub Release 资产与 checksum 验证通过
- [ ] stable 以普通 fast-forward 到 exact tag commit

## 当前状态

assigned。exact install 与 native gate 已通过；等待 report-only commit、main push、全新 v0.4.35 三平台 workflow、Release 资产和 stable closure。

## 处理结果

本地候选、精确安装与 exact native acceptance 完成，Release/stable 保持未变。

## 修改文件

- 本报告及 0.4.35 候选范围。

## 验证方式

- strict `open_canvasight` + `await_canvasight_widget_ready`
- meaningful control、same-task Run 与 late metadata
- v0.4.35 GitHub Release workflow、资产、updater 与 stable identity

## 后续风险

0.4.35 runtime/version 已变化，旧 Desktop registry 或旧任务不能作为 native 证据。Windows CI 失败时不得创建 Release、不得推进 stable，也不得复用 tag。
