---
schema_version: 1
report_id: issue-publish-stable-release-0-4-34
report_type: issue
status: assigned
owner: Project Management Agent
created_by: Main Thread
priority: high
version: 2
agent_id: /root/project_management_agent
thread_id: 019f744d-c7f1-7383-8195-7478c2cd835e
created_at: 2026-07-18T11:11:42Z
updated_at: 2026-07-18T11:17:07Z
depends_on:
  - issue-native-widget-task-switch-remount-blank-0-4-32
  - solution-native-widget-task-switch-remount-mode-pulse-0-4-34
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
  - Version 0.4.34 synchronizes manifest, package, lock, SERVER_VERSION, generated MCP bundle and web dist.
  - Complete local matrix, release verify, enhanced widget runtime and plugin validation pass.
  - Scoped commit 5f69aeab6f109b492adcae818af155adf3c823b1 is installed as exact 0.4.34; all 582 tracked plugin files match the immutable cache snapshot with zero missing or mismatched files.
  - No v0.4.34 tag, push, GitHub Release, workflow or stable mutation has occurred.
---

# 发布 Canvasight 0.4.34 并推进 stable 更新通道

## TL;DR

0.4.34 为 task-return 白屏加入一次受控 host-supported inline→fullscreen pulse。只有 scoped commit、exact install、宿主重启和真实 native acceptance 全部通过，才允许按 Release→stable 顺序发布。

## Closure Criteria

- [x] 0.4.34 版本字段、MCP bundle、web dist、完整本地矩阵和 plugin validator 一致
- [x] scoped commit 与 exact 0.4.34 安装完成
- [ ] 重启 Codex Desktop 并取得首次 instance-bound fullscreen ready
- [ ] 至少三轮 A→B→A 无需侧栏手工恢复，且无 inline 闪烁或 Connecting 回退
- [ ] 控件、session-local zoom Refresh、same-task Run 与 late metadata 验收通过
- [ ] GitHub Release 资产验证通过后，stable fast-forward 到 exact tag commit

## 当前状态

assigned。scoped commit 与 exact install 已完成；等待宿主重启与真实 native acceptance。

## 处理结果

本地候选矩阵、commit 与 exact 0.4.34 安装通过；远端发布未开始，stable 保持 v0.4.28。

## 修改文件

- 本报告及 0.4.34 候选范围。

## 验证方式

- 完整本地矩阵与 exact native-host acceptance。
- GitHub 三平台 Release、资产和 updater live verification。

## 后续风险

模式脉冲是标准协议内的最后一个受控实验，不是已证实的 Codex 宿主侧栏重排 API。若 exact native 仍白屏，0.4.34 永久禁发并停止盲目升版。
