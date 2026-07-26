---
schema_version: 1
report_id: solution-publish-stable-release-0-4-36
report_type: solution
status: resolved
owner: Project Management Agent
created_by: Main Thread
priority: critical
version: 1
agent_id: /root/project_management_agent
thread_id: null
created_at: 2026-07-26T06:55:43Z
updated_at: 2026-07-26T06:55:43Z
depends_on:
  - issue-publish-stable-release-0-4-36
related_files:
  - .github/workflows/canvasight-release.yml
  - plugins/canvasight
verification_status: passed
verification_evidence:
  - Workflow 30191751214 passed all three operating-system jobs and the guarded publish/stable job.
  - GitHub-hosted zip SHA-256 1edc00205c56be38cdffb31245761c49341fe6f48c3242d2dd931cb0d7bc4d6c matched its checksum asset and GitHub digest.
  - Extracted release passed plugin validation, synchronized 0.4.36 fields, clean snapshot checks and MCP registration with 16 tools.
  - origin/main, origin/stable and v0.4.36 dereference matched 474491162abeb9ec9553d1c790df56485e6d8ef2.
---

# 发布 Canvasight 0.4.36 并闭环 stable

## 负责 Agent

Project Management Agent；Main Thread 负责远端审计与最终集成。

## 对应问题

`agent-reports/resolved/issue-publish-stable-release-0-4-36.md`

## Root Cause

Issue #2 的修复已进入 0.4.36 候选，但原报告者无法安装本地候选；必须通过受保护的正式 Release 与 `stable` 更新通道提供可复验版本。

## 调研过程

- 冻结 exact 0.4.36 插件字节并完成本地、原生和三平台前置门禁。
- 加固 release workflow，使其在推进 `stable` 前回读 GitHub 托管资产、校验 checksum、插件结构和 MCP 注册。
- 推送 annotated tag `v0.4.36`，等待 tag-triggered matrix 和发布阶段完成。
- 由 Main Thread 与 Test Supervisor Agent 分别下载远端资产并独立复核。

## 推荐方案

保留 Release-first、asset-verify-second、stable-fast-forward-last 的发布顺序；Issue #2 继续保持 Open，直到 smartLanny 对原始故障给出明确结果。

## 实施步骤

1. 将 `v0.4.36` tag 指向 frozen candidate `474491162abeb9ec9553d1c790df56485e6d8ef2`。
2. 运行 Ubuntu、macOS、Windows Node 20.19 发布矩阵。
3. 发布并回读 `canvasight-v0.4.36.zip` 与 checksum。
4. 验证解压快照、版本、插件结构、MCP tools 后普通快进 `stable`。
5. 独立复核远端资产与 Git identity，并请求原报告者升级复验。

## 风险与回滚

Workflow 在 Release 或资产验证失败时删除本轮 Release，并保持旧 `stable`；本轮所有门禁均通过，无需回滚。

## 处理结果

已发布 `v0.4.36`，`stable` 已普通快进到 exact tag commit。Issue #2 的报告者验证仍待完成。

## 修改文件

- `.github/workflows/canvasight-release.yml`
- `agent-reports/`
- `ROSTER.md`

## 验证方式

- GitHub Actions run `30191751214`
- Release zip SHA-256 与 checksum 复核
- 解压快照 plugin validator、release version check 与 MCP registration probe
- remote `origin/main` / `origin/stable` / `v0.4.36^{commit}` identity audit
- GitHub Issue #2 comment `5082450875`

## 后续风险

- smartLanny 尚未在原故障任务复验，不能宣称 Issue #2 已关闭。
- GitHub Actions 对部分 action 的 Node 20 runtime 发出弃用提示，后续应单独升级 action 版本。
