---
schema_version: 1
report_id: issue-publish-stable-release-0-4-33
report_type: issue
status: blocked
owner: Project Management Agent
created_by: Main Thread
priority: high
version: 3
agent_id: /root/project_management_agent
thread_id: 019f744d-c7f1-7383-8195-7478c2cd835e
created_at: 2026-07-18T09:57:09Z
updated_at: 2026-07-18T10:50:41Z
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
verification_status: failed
verification_evidence:
  - Version 0.4.33 synchronizes manifest, package, lock, SERVER_VERSION, generated MCP bundle and web dist.
  - Complete local matrix, release verify and plugin validation pass.
  - No v0.4.33 tag, push, GitHub Release, workflow or stable mutation has occurred.
  - Scoped commit aca7efce7fb595a22b09a060a34ec37f1ae15490 is clean and exact 0.4.33 is installed; all 582 tracked plugin files match the immutable cache snapshot.
  - After Desktop restart, exact 0.4.33 A to B to A created fresh widget-defac5c1 that remained a pure white panel until the user collapsed and reopened the Codex sidebar.
  - The same instance hydrated at 2026-07-18T10:46:42.025Z and reached 788 by 794 ready only at 10:46:51.854Z after the host sidebar toggle; bounded fullscreen retries did not restore presentation.
---

# 发布 Canvasight 0.4.33 并推进 stable 更新通道

## TL;DR

0.4.33 为 task-switch fresh Widget 增加有界 fullscreen re-presentation，并保留 0.4.32 已通过的 Refresh/Run 合同。完成 scoped commit、exact install、宿主重启和真实 native acceptance 后，才允许按 Release→stable 顺序发布。

## Closure Criteria

- [x] 0.4.33 版本字段、MCP bundle、web dist、完整本地矩阵和 plugin validator 一致
- [x] scoped commit 与 exact 0.4.33 安装完成
- [x] 重启 Codex Desktop 并取得首次 instance-bound fullscreen ready
- [x] A→B→A 真实白屏失败已记录，0.4.33 永久禁止发布
- [x] v0.4.33 tag、workflow、Release、push 和 stable 均未创建或变更

## 当前状态

blocked。exact native task-switch acceptance 失败；0.4.33 永久禁止 push、tag、Release 或 `stable` 变更。

## 处理结果

本地候选通过但真实宿主否决；远端发布未开始，stable 保持 v0.4.28。

## 修改文件

- 本报告。

## 验证方式

- 完整本地矩阵与 exact native-host acceptance。
- GitHub 三平台 Release、资产和 updater live verification。

## 后续风险

重复 fullscreen request 已证明不能驱动 Codex 侧栏重新布局。任何下一候选必须使用新版本身份、受控新 actuator 和完整 native reacceptance；不得把侧边栏折叠作为用户验收步骤。
