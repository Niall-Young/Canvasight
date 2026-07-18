---
schema_version: 1
report_id: issue-publish-stable-release-0-4-33
report_type: issue
status: assigned
owner: Project Management Agent
created_by: Main Thread
priority: high
version: 1
agent_id: /root/project_management_agent
thread_id: 019f744d-c7f1-7383-8195-7478c2cd835e
created_at: 2026-07-18T09:57:09Z
updated_at: 2026-07-18T09:57:09Z
depends_on:
  - issue-native-widget-task-switch-remount-blank-0-4-32
  - solution-native-widget-task-switch-remount-presentation-retry-0-4-33
  - issue-publish-stable-release-0-4-32
related_files:
  - .github/workflows/canvasight-release.yml
  - plugins/canvasight/.codex-plugin/plugin.json
  - plugins/canvasight/package.json
  - plugins/canvasight/package-lock.json
  - plugins/canvasight/mcp/server.source.mjs
  - plugins/canvasight/mcp/server.mjs
  - plugins/canvasight/dist
verification_status: in_progress
verification_evidence:
  - Version 0.4.33 synchronizes manifest, package, lock, SERVER_VERSION, generated MCP bundle and web dist.
  - Complete local matrix, release verify and plugin validation pass.
  - No v0.4.33 tag, push, GitHub Release, workflow or stable mutation has occurred.
---

# 发布 Canvasight 0.4.33 并推进 stable 更新通道

## TL;DR

0.4.33 为 task-switch fresh Widget 增加有界 fullscreen re-presentation，并保留 0.4.32 已通过的 Refresh/Run 合同。完成 scoped commit、exact install、宿主重启和真实 native acceptance 后，才允许按 Release→stable 顺序发布。

## Closure Criteria

- [x] 0.4.33 版本字段、MCP bundle、web dist、完整本地矩阵和 plugin validator 一致
- [ ] scoped commit 与 exact 0.4.33 安装完成，重启 Codex Desktop 并新建/标记任务
- [ ] instance-bound fullscreen ready、clean Refresh、session-local zoom Refresh、控件与 same-task Run 通过
- [ ] 不折叠侧边栏完成至少两轮 A→B→A，画布自动恢复且 late metadata 不回退
- [ ] v0.4.33 三平台 workflow、Release zip/SHA 和 ref 一致性通过
- [ ] GitHub Release 完整验证后才 fast-forward `stable` 到 exact tag commit
- [ ] updater live check 和 equal-version zero-mutation 通过

## 当前状态

assigned。允许本地 Git closure 与 exact install；禁止 push、tag、Release 或 `stable` 变更，直到真实 native acceptance 通过。

## 处理结果

本地候选通过，远端发布未开始。

## 修改文件

- 本报告。

## 验证方式

- 完整本地矩阵与 exact native-host acceptance。
- GitHub 三平台 Release、资产和 updater live verification。

## 后续风险

重复 fullscreen request 是有界 best-effort；真实宿主若仍不布局，必须停止发布并保留 stable，不得降低 ready 门槛或把侧边栏折叠作为用户步骤。
