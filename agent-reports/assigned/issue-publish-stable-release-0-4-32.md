---
schema_version: 1
report_id: issue-publish-stable-release-0-4-32
report_type: issue
status: blocked
owner: Project Management Agent
created_by: Main Thread
priority: high
version: 2
agent_id: /root/project_management_agent
thread_id: 019f744e-6e66-7290-be73-bb49037d45c3
created_at: 2026-07-18T09:02:34Z
updated_at: 2026-07-18T09:45:36Z
depends_on:
  - issue-refresh-base-document-fingerprint-order
  - solution-refresh-base-document-fingerprint-order
  - issue-publish-stable-release-0-4-31
  - issue-native-widget-task-switch-remount-blank-0-4-32
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
  - 0.4.31 native Refresh failed with invalid_document_base and is permanently forbidden from release.
  - 0.4.32 preserves the authoritative raw save base and passes the complete local candidate matrix and plugin validation.
  - No v0.4.31 or v0.4.32 tag, GitHub Release, workflow run, push, or stable mutation has occurred.
  - Native clean Refresh and session-local zoom 20 to 50 followed by Refresh passed; the valid unchanged receipt and retained 50 percent UI are expected behavior.
  - Native task switch A to B to A remounted a fresh Widget into a blank panel; only collapsing and reopening the Codex sidebar restored the same instance 17 seconds later.
---

# 发布 Canvasight 0.4.32 并推进 stable 更新通道

## TL;DR

0.4.32 修复了 0.4.31 的 authoritative base fingerprint 错误并通过 Refresh、控件与 Run，但 task switch remount 出现纯白面板，因此候选永久禁止发布。修复必须进入新版本，再重新完成 native acceptance 后才允许进入 Release 流程。

## 问题描述

0.4.31 的显示规范化过程重排了与 `documentVersion` 配对的保存基线，合法 viewport 保存被 daemon 拒绝为 `invalid_document_base`。0.4.32 分离协议基线和显示模型，并增加真实键序、多页扩展字段、重试、重挂载和脱敏诊断回归。

## 影响范围

候选提交与安装、Codex Desktop 原生 widget、GitHub tag/Release、三平台工作流、Release 资产、`stable` 和 updater。

## Closure Criteria

- [x] 0.4.32 版本字段、MCP bundle、web dist 和本地发布矩阵一致
- [x] scoped commit、exact 0.4.32 安装、Codex Desktop 重启和新任务标记已完成
- [x] instance-bound fullscreen ready、clean Refresh、session-local zoom 后 Refresh、控件与 same-task Run 通过
- [x] A→B→A/remount 白屏失败已记录并移交独立 issue
- [x] 0.4.32 远端零 mutation，候选永久禁止发布

## 当前状态

blocked。0.4.32 不再允许 push、tag、Release 或 `stable` 变更；后续修复必须使用新版本身份。

## 处理结果

本地候选与部分 native gate 通过，但 task-switch remount 白屏；发布已取消且远端未变更。

## 修改文件

- 本报告。

## 验证方式

- 本地完整矩阵与 plugin validator。
- exact install 后的 Codex Desktop 原生验收。
- GitHub Release、三平台资产和 updater live verification。

## 后续风险

手工折叠/重开侧边栏不能成为验收或用户恢复步骤。新候选必须在 exact 安装和宿主重启后自动完成至少两轮 task switch 恢复。
