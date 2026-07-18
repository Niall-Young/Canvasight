---
schema_version: 1
report_id: issue-publish-stable-release-0-4-30
report_type: issue
status: assigned
owner: Project Management Agent
created_by: Main Thread
priority: high
version: 2
agent_id: /root/project_management_agent
thread_id: 019f730b-0404-75f0-a460-3a080f0addd6
created_at: 2026-07-18T02:50:14Z
updated_at: 2026-07-18T02:50:46Z
depends_on:
  - issue-publish-stable-release-0-4-29
  - issue-release-matrix-invalidates-native-session
  - solution-release-matrix-native-session-isolation
related_files:
  - .github/workflows/canvasight-release.yml
  - plugins/canvasight/.codex-plugin/plugin.json
  - plugins/canvasight/package.json
  - plugins/canvasight/package-lock.json
  - plugins/canvasight/mcp/server.source.mjs
  - plugins/canvasight/mcp/server.mjs
  - plugins/canvasight/dist
verification_status: not_started
verification_evidence: []
---

# 发布 Canvasight 0.4.30 并推进 stable 更新通道

## TL;DR

以修复 daemon home 隔离缺陷的 0.4.30 取代禁止发布的 0.4.29；完成 exact 安装、宿主重启、全新任务原生验收、三平台发布工作流、Release 资产与 stable/updater 闭环。

## 问题描述

0.4.29 在真实验收中暴露 widget runtime cleanup 误停默认 daemon 的缺陷，已明确禁止发布。0.4.30 修复 CLI/env home 解析和测试清理隔离，并需要独立发布身份与完整门禁。

## 影响范围

候选安装、Codex Desktop 原生 widget、GitHub tag/Release、三平台 CI、`stable` 与 updater。

## Closure Criteria

- [ ] 0.4.30 版本字段、MCP bundle 与 web dist 一致
- [ ] 显式隔离的本地发布矩阵通过且不触碰默认 daemon state/lifecycle
- [ ] exact 0.4.30 安装后重启 Codex Desktop，并在新建且重新 @Canvasight 的任务完成 fullscreen ready
- [ ] 刷新控件、同任务 Run、A→B→A 无白屏、无迟到 metadata 回退全部通过
- [ ] `v0.4.30` 三平台 Node 20.19 工作流通过
- [ ] Release zip 与 SHA-256 验证通过
- [ ] `stable`、tag、Release commit 完全一致
- [ ] updater live check 能发现 0.4.30

## 当前状态

assigned 给 Project Management Agent；等待 exact 安装与重启后原生验收。

## 处理结果

尚未发布。

## 修改文件

- 本报告。

## 验证方式

- 本地隔离矩阵、exact 安装哈希、重启后原生验收、GitHub Actions、Release 资产与远端 refs、updater live check。

## 后续风险

- 安装 0.4.30 后必须重启 Codex Desktop；当前任务不能作为新 runtime 的原生验收证据。
- 原生验收后禁止再运行本地 daemon/lifecycle 测试。
