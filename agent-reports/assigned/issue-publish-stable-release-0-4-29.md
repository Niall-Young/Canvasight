---
schema_version: 1
report_id: issue-publish-stable-release-0-4-29
report_type: issue
status: blocked
owner: Project Management Agent
created_by: Main Thread
priority: high
version: 2
agent_id: /root/project_management_agent
thread_id: 019f7012-d49e-73b2-9e4c-d65be95feeb1
created_at: 2026-07-18T02:08:02Z
updated_at: 2026-07-18T02:41:35Z
depends_on:
  - issue-manual-canvas-latest-revision-refresh
  - issue-native-widget-thread-return-paint-stall
  - issue-release-matrix-invalidates-native-session
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
  - Exact 0.4.29 reached verified fullscreen ready, but widget-runtime cleanup stopped the default daemon and invalidated the accepted session before control and Run checks.
  - User observed stage=session / Session not found for both required native interactions.
---

# 发布 Canvasight 0.4.29 并推进 stable 更新通道

## TL;DR

将包含“刷新到最新版本”按钮和返回画布白屏修复的 0.4.29 完整插件快照发布为正式 GitHub Release，并在三平台门禁与资产验证通过后推进 `stable`。

## 问题描述

用户当前 marketplace 安装仍为 v0.4.28，因此看不到已经进入 `main` 的手动画布刷新按钮。仓库候选版本为 v0.4.29，但正式 Release、`stable` 与 updater 发现路径尚未更新。

## 影响范围

GitHub tag、Release 资产、`stable` 分支、Canvasight marketplace 完整快照与后续自更新路径。

## Closure Criteria

- [ ] v0.4.29 版本字段、MCP bundle 与 Web dist 一致
- [ ] 本地发布门禁和插件校验通过
- [ ] `v0.4.29` 标签触发的三平台验证通过
- [ ] 正式 Release 资产与 SHA-256 校验通过
- [ ] `stable`、tag 与 Release commit 完全一致
- [ ] updater 能发现 v0.4.29 正式版本

## 当前状态

blocked；0.4.29 原生验收失败且发现 daemon home 隔离缺陷，该版本禁止发布。

## 处理结果

未发布；候选将由包含隔离修复的新版本取代。

## 修改文件

- 本报告、ROSTER 与派生 QUEUE 状态；修复范围见 `issue-release-matrix-invalidates-native-session`。

## 验证方式

- 0.4.29 本地矩阵通过，但真实宿主端到端验收失败；不得进入 GitHub Actions 发布阶段。

## 后续风险

- 任何三平台、打包或 stable 快进失败都必须保持旧 stable，不得强推或回退保护分支。
- 0.4.29 不得复用 tag；修复后必须使用新版本完成重装、宿主重启与全新任务验收。
