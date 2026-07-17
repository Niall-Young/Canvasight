---
schema_version: 1
report_id: solution-plugin-independent-stable-install
report_type: solution
status: resolved
owner: Development Agent
created_by: Development Agent
priority: high
version: 1
agent_id: /root/development_agent
thread_id: 019f7012-d49e-73b2-9e4c-d65be95feeb1
created_at: 2026-07-17T12:45:51Z
updated_at: 2026-07-17T12:45:51Z
depends_on:
  - issue-plugin-install-depends-on-project-directory
related_files:
  - README.md
  - /Users/niallyoung/.codex/config.toml
verification_status: passed
verification_evidence:
  - Official Git stable marketplace resolves from ~/.codex/.tmp/marketplaces/canvasight-local at 73ecda757031b534705c3b214f3d63ffa00bfc65.
  - canvasight@canvasight-local remains installed and enabled at 0.4.28.
  - Snapshot, cache, and user-data integrity checks passed.
---

# Canvasight 独立稳定安装方案

## Root Cause

原 marketplace 使用 `source_type=local` 指向桌面仓库，插件 source 又相对指向 `plugins/canvasight`，所以删除仓库等于删除注册源。

## 实施

1. 记录当前 marketplace、插件版本、工作区状态和用户数据哈希。
2. 移除同名 local marketplace。
3. 从官方 `https://github.com/Niall-Young/Canvasight.git` 的 `stable` ref 添加 Git marketplace。
4. 重新添加 `canvasight@canvasight-local` 并核对版本、启用状态和解析路径。
5. 从项目外 cwd 使用两套已安装 Codex CLI 复核独立解析。
6. 更新中英文 README，明确正式安装与 local checkout 的生命周期差异和迁移命令。

## 处理结果

已完成。Codex 现在从自身管理的 Git snapshot 解析 Canvasight，不再依赖 `/Users/niallyoung/Desktop/Canvasight`。

## 修改文件

- 用户环境：`/Users/niallyoung/.codex/config.toml` 及 Codex 管理的 marketplace snapshot/cache。
- 仓库：`README.md` 与 Agent Team 闭环报告。

## 验证方式

- Marketplace root：`/Users/niallyoung/.codex/.tmp/marketplaces/canvasight-local`。
- Snapshot：官方 origin、`stable`、HEAD `73ecda757031b534705c3b214f3d63ffa00bfc65`、clean。
- Plugin：installed/enabled `0.4.28`，source path 不含桌面仓库。
- Manifest/MCP/web snapshot-cache 哈希一致。
- 三项用户数据 SHA-256 与转换前一致。

## 后续风险

需要用户完整重启 Codex Desktop，并在新任务重新添加 `@Canvasight`，宿主才会加载新的进程级插件注册快照。不能在当前旧宿主任务中宣称 native-host acceptance 已完成。
