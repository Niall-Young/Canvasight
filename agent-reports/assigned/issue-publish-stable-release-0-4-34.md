---
schema_version: 1
report_id: issue-publish-stable-release-0-4-34
report_type: issue
status: blocked
owner: Project Management Agent
created_by: Main Thread
priority: high
version: 4
agent_id: /root/project_management_agent
thread_id: 019f744d-c7f1-7383-8195-7478c2cd835e
created_at: 2026-07-18T11:11:42Z
updated_at: 2026-07-18T11:46:32Z
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
verification_status: failed
verification_evidence:
  - Version 0.4.34 synchronizes manifest, package, lock, SERVER_VERSION, generated MCP bundle and web dist.
  - Complete local matrix, release verify, enhanced widget runtime and plugin validation pass.
  - Scoped commit 5f69aeab6f109b492adcae818af155adf3c823b1 is installed as exact 0.4.34; all 582 tracked plugin files match the immutable cache snapshot with zero missing or mismatched files.
  - Restarted Codex Desktop strict ready passed at fullscreen 788 by 794 with all evidence true; three task round-trips, Page/zoom Refresh, same-task Run and post-Run stability passed without sidebar recovery.
  - Annotated v0.4.34 tag dereferences to 638eed6e277a0442b99f749c716430089b6306b2 and workflow run 29642945206 completed with Windows failure.
  - Windows Node 20.19 failed npm run test:mcp because the CLI-selected target daemon exited while its daemon.json state remained; macOS and Ubuntu passed.
  - Publish was skipped, no GitHub Release exists, and origin/stable remains 73ecda757031b534705c3b214f3d63ffa00bfc65 (v0.4.28).
---

# 发布 Canvasight 0.4.34 并推进 stable 更新通道

## TL;DR

0.4.34 为 task-return 白屏加入一次受控 host-supported inline→fullscreen pulse。只有 scoped commit、exact install、宿主重启和真实 native acceptance 全部通过，才允许按 Release→stable 顺序发布。

## Closure Criteria

- [x] 0.4.34 版本字段、MCP bundle、web dist、完整本地矩阵和 plugin validator 一致
- [x] scoped commit 与 exact 0.4.34 安装完成
- [x] 重启 Codex Desktop 并取得首次 instance-bound fullscreen ready
- [x] 至少三轮 A→B→A 无需侧栏手工恢复，且无 inline 闪烁或 Connecting 回退
- [x] 控件、session-local zoom Refresh、same-task Run 与 late metadata 验收通过
- [x] Windows workflow 失败已阻断 publish，v0.4.34 永久禁止 Release/stable

## 当前状态

blocked。远端 Windows Node 20.19 的 `test:mcp` 失败；v0.4.34 tag 保留为失败证据，不得移动、删除、复用或发布。修复只能进入新版本 0.4.35。

## 处理结果

本地候选、exact install 与 native gate 通过，但三平台 Release gate 被 Windows daemon 状态清理失败否决。publish job 未运行，Release 不存在，stable 保持 v0.4.28。

## 修改文件

- 本报告。

## 验证方式

- 完整本地矩阵与 exact native-host acceptance。
- GitHub Actions run 29642945206，Windows job 88076349821。

## 后续风险

v0.4.34 已存在远端 tag，但不是可发布版本。任何恢复都必须从 `main` 前进到 0.4.35，重新执行完整本地、Windows CI、exact install 与 native acceptance；禁止重跑或复用 0.4.34 作为发布恢复。
