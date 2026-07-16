---
schema_version: 1
report_id: issue-publish-stable-release-0-4-24
report_type: issue
status: assigned
owner: Project Management Agent
created_by: Main Thread
priority: high
version: 1
agent_id: /root/project_management_agent
thread_id: null
created_at: 2026-07-16T08:27:13Z
updated_at: 2026-07-16T08:27:13Z
depends_on: []
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

# 发布回退后的 Canvasight 0.4.24

## TL;DR

撤销 `bfc95f3` 之后的三次富内容版本代码，保留后续 Agent Team 规则同步，以新的 `0.4.24` 完整快照发布并推进 `stable`。

## 问题描述

用户明确不要 Logo 版本之后的三次富内容代码，但已发布版本号不能降级或复用。需要通过普通 Git 历史反向提交恢复产品代码，再发布递增版本。

## 影响范围

远端 `main`、`v0.4.24` tag、GitHub Release、`stable`、完整插件快照与自更新发现路径。

## Closure Criteria

- [ ] 三次后续代码提交已通过正常 revert 撤销，不 force push
- [ ] 0.4.24 版本字段与生成产物一致
- [ ] 本地 release matrix 与插件校验通过
- [ ] 候选提交推送到 `main`
- [ ] `v0.4.24` 三平台 workflow、Release 和 `stable` 通过
- [ ] 官方资产、checksum、版本、工具注册和 refs 验证通过

## 当前状态

assigned；等待反向提交、版本准备和正式发布。

## 后续风险

- 发布 workflow 要求 tag commit 等于远端 `main` HEAD，推送顺序必须严格执行。
- `stable` 只能普通快进；失败时由 workflow 删除本轮 Release，不改写受保护分支。
