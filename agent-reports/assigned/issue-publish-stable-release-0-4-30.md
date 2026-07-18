---
schema_version: 1
report_id: issue-publish-stable-release-0-4-30
report_type: issue
status: blocked
owner: Project Management Agent
created_by: Main Thread
priority: high
version: 3
agent_id: /root/project_management_agent
thread_id: 019f7415-32a4-7980-831d-146e54c7d842
created_at: 2026-07-18T02:50:14Z
updated_at: 2026-07-18T07:24:45Z
depends_on:
  - issue-publish-stable-release-0-4-29
  - issue-release-matrix-invalidates-native-session
  - solution-release-matrix-native-session-isolation
  - issue-native-refresh-save-stalls-across-mcp-shim-restart
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
  - Exact installed 0.4.30 reached verified fullscreen ready, but the real native Refresh control failed with 当前更改尚未保存，刷新已取消.
  - No v0.4.30 tag, Release, workflow run, or stable update exists; no remote mutation was performed after the failed acceptance.
---

# 发布 Canvasight 0.4.30 并推进 stable 更新通道

## TL;DR

0.4.30 在 exact 安装、宿主重启和 fullscreen ready 后未通过真实 Refresh 控件验收，现已禁止发布；必须先解决跨 MCP shim 重建的保存阻断并产生新的版本候选。

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

blocked，由 Project Management Agent 持有。真实原生 Refresh 返回“当前更改尚未保存，刷新已取消”，依赖 `issue-native-refresh-save-stalls-across-mcp-shim-restart` 完成根因修复、新版本候选与完整原生重验。0.4.30 禁止发布。

## 处理结果

0.4.30 已冻结且禁止发布。远端仍无 `v0.4.30` tag、Release 或 workflow run，`stable` 未推进；本轮失败后未执行任何远端 mutation。

## 修改文件

- 本报告。

## 验证方式

- 本地隔离矩阵、exact 安装哈希、重启后原生验收、GitHub Actions、Release 资产与远端 refs、updater live check。
- 已完成只读远端审计：`origin/main=ca0015ae3baacebf58a82ac09b2c9e645d2e470f`、`origin/stable=73ecda757031b534705c3b214f3d63ffa00bfc65`，无 `v0.4.30` tag 或 Release。

## 后续风险

- 安装 0.4.30 后必须重启 Codex Desktop；当前任务不能作为新 runtime 的原生验收证据。
- 原生验收后禁止再运行本地 daemon/lifecycle 测试。
- 不得通过重复点击、浏览器 fallback、手工清 dirty、跳过 Refresh 或沿用 0.4.30 身份降格放行。
- 在依赖 issue 解决并产生新版本之前，不得 stage/commit 发布闭环、push main、创建 tag/Release 或推进 `stable`。
