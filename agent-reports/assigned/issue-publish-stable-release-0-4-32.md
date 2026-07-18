---
schema_version: 1
report_id: issue-publish-stable-release-0-4-32
report_type: issue
status: assigned
owner: Project Management Agent
created_by: Main Thread
priority: high
version: 1
agent_id: /root/project_management_agent
thread_id: 019f744e-6e66-7290-be73-bb49037d45c3
created_at: 2026-07-18T09:02:34Z
updated_at: 2026-07-18T09:02:34Z
depends_on:
  - issue-refresh-base-document-fingerprint-order
  - solution-refresh-base-document-fingerprint-order
  - issue-publish-stable-release-0-4-31
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
  - 0.4.31 native Refresh failed with invalid_document_base and is permanently forbidden from release.
  - 0.4.32 preserves the authoritative raw save base and passes the complete local candidate matrix and plugin validation.
  - No v0.4.31 or v0.4.32 tag, GitHub Release, workflow run, push, or stable mutation has occurred.
---

# 发布 Canvasight 0.4.32 并推进 stable 更新通道

## TL;DR

0.4.32 修复 0.4.31 真实原生 Refresh 暴露的 authoritative base fingerprint 错误。本地候选矩阵已通过；等待 scoped commit、exact install、Codex Desktop 重启与真实 native acceptance 后，才允许发布 GitHub Release 并最终 fast-forward `stable`。

## 问题描述

0.4.31 的显示规范化过程重排了与 `documentVersion` 配对的保存基线，合法 viewport 保存被 daemon 拒绝为 `invalid_document_base`。0.4.32 分离协议基线和显示模型，并增加真实键序、多页扩展字段、重试、重挂载和脱敏诊断回归。

## 影响范围

候选提交与安装、Codex Desktop 原生 widget、GitHub tag/Release、三平台工作流、Release 资产、`stable` 和 updater。

## Closure Criteria

- [x] 0.4.32 版本字段、MCP bundle、web dist 和本地发布矩阵一致
- [ ] scoped commit 后 exact 0.4.32 安装，重启 Codex Desktop 并新建/标记任务
- [ ] instance-bound fullscreen ready、clean Refresh、缩放保存后 Refresh、控件、same-task Run、A→B→A/remount 和 late metadata 验收通过
- [ ] v0.4.32 三平台 workflow 与 Release 资产校验通过
- [ ] `stable` 仅在 Release 完整验证后 fast-forward 到 exact tag commit
- [ ] updater live check 和 equal-version zero-mutation 通过

## 当前状态

assigned。允许完成本地 Git closure 与 exact install；禁止 push、tag、Release 或 `stable` 变更，直到真实 native acceptance 通过。

## 处理结果

本地候选通过，发布未开始。

## 修改文件

- 本报告。

## 验证方式

- 本地完整矩阵与 plugin validator。
- exact install 后的 Codex Desktop 原生验收。
- GitHub Release、三平台资产和 updater live verification。

## 后续风险

Codex Desktop 插件注册表需要重启才能加载 0.4.32；重启前的任何当前任务或新任务都不能作为 exact-0.4.32 原生证据。
