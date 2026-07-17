---
schema_version: 1
report_id: issue-plugin-install-depends-on-project-directory
report_type: issue
status: resolved
owner: Development Agent
created_by: Main Thread
priority: high
version: 2
agent_id: /root/development_agent
thread_id: 019f7012-d49e-73b2-9e4c-d65be95feeb1
created_at: 2026-07-17T12:40:16Z
updated_at: 2026-07-17T12:45:51Z
depends_on: []
related_files:
  - /Users/niallyoung/.codex/config.toml
  - .agents/plugins/marketplace.json
verification_status: passed
verification_evidence:
  - codex plugin marketplace list resolves canvasight-local to /Users/niallyoung/Desktop/Canvasight.
  - codex plugin list resolves canvasight 0.4.28 to /Users/niallyoung/Desktop/Canvasight/plugins/canvasight.
  - After conversion both Codex CLI 0.139.0 and 0.137.0 resolve the marketplace under ~/.codex/.tmp/marketplaces/canvasight-local from an external cwd.
  - Canvasight remains installed and enabled at 0.4.28 from the official stable snapshot at 73ecda757031b534705c3b214f3d63ffa00bfc65.
  - Project canvas and user-state SHA-256 values are unchanged.
---

# 插件安装依赖项目目录

## TL;DR

当前 Canvasight 以 repo-local marketplace 注册；删除、移动或重命名项目目录会让 Codex 失去插件来源。

## 问题描述

用户希望 Canvasight 独立安装，不再依赖开发仓库目录。转换必须保留插件版本、启用状态、项目 `.scatter` 数据及 `~/.canvasight` 用户状态，并提供可执行回滚路径。

## 影响范围

- Codex marketplace 注册与插件安装缓存。
- Canvasight 在项目目录移除后的可发现性。
- 不包含项目源码、`.scatter` 或 `~/.canvasight` 数据迁移。

## Root Cause

`canvasight-local` 的 marketplace root 是开发仓库，marketplace 内的插件 source 又是相对路径 `./plugins/canvasight`，因此注册链整体依赖该目录存在。

## 期望结果

- marketplace 改为官方 Git 仓库 `stable` 快照。
- Canvasight 仍为 enabled、版本 `0.4.28`。
- 插件解析路径不再包含 `/Users/niallyoung/Desktop/Canvasight`。
- `.scatter` 与 `~/.canvasight` 数据哈希保持不变。
- 记录重启 Codex Desktop 后才能完成的原生宿主验收边界。

## 当前状态

已完成官方 Git `stable` 独立安装转换；Development Agent 与 Test Supervisor Agent 的只读复核均通过。

## 处理结果

`canvasight-local` 已从桌面仓库的 local source 改为 Codex 管理的官方 Git 快照，Canvasight 0.4.28 保持 installed/enabled。README 已同步澄清正式安装与本地开发安装的差异和迁移方法。

## 修改文件

- `/Users/niallyoung/.codex/config.toml`（由 Codex CLI 更新 marketplace source）
- `README.md`
- `ROSTER.md`
- `agent-reports/QUEUE.md`
- 本 issue、solution 与 integration summary

## 验证方式

- 从项目目录外分别使用 Codex CLI 0.139.0 与 0.137.0 运行 marketplace/plugin list。
- 核对 Git snapshot `stable`、origin、HEAD 与 clean worktree。
- 比较 snapshot 与 immutable cache 的 plugin manifest、MCP bundle 和 web build 哈希。
- 比较 `.scatter/scatter.json`、`~/.canvasight/preferences.json` 和 `~/.canvasight/state.json` 前后 SHA-256。

## 后续风险

当前 Codex Desktop 进程仍持有启动时的插件注册快照；CLI 安装转换完成后仍需完整重启，并在新任务重新添加 `@Canvasight` 才能完成原生宿主验收。本轮未修改 native widget，因此该重启后验收是安装刷新边界，不阻止关闭目录依赖问题。
