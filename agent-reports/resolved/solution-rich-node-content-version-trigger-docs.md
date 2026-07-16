---
schema_version: 1
report_id: solution-rich-node-content-version-trigger-docs
report_type: solution
status: resolved
owner: Customer Support Agent
created_by: Customer Support Agent
priority: medium
version: 1
agent_id: /root/customer_support_agent
thread_id: null
created_at: 2026-07-16T07:07:45Z
updated_at: 2026-07-16T07:07:45Z
depends_on:
  - issue-rich-node-content-editor
related_files:
  - plugins/canvasight/README.md
verification_status: passed
verification_evidence:
  - Re-read issue-rich-node-content-editor v5 before writing; it remains assigned to Development Agent and records the synchronized v0.4.22 version surface.
  - Confirmed plugins/canvasight/package.json reports version 0.4.22 while the reported user surface came from an installed 0.4.21 cache snapshot.
  - Added matching Chinese and English FAQ guidance that distinguishes old-snapshot behavior from v0.4.22 automatic rich-content recognition.
  - Kept install/restart guidance in normal user language and did not present development commands as the activation path.
---

# 富内容版本与触发说明

## 负责 Agent

Customer Support Agent

## 对应问题

`agent-reports/assigned/issue-rich-node-content-editor.md` v5。

## Root Cause

用户当前看到的 widget 来自 Canvasight `v0.4.21` 旧构建快照，而节点富内容编辑器正在 `v0.4.22` 交付。原 README 虽然说明安装或升级后需要重启 Codex Desktop，但没有明确最低功能版本，也没有说明在旧快照中输入围栏代码、URL、`@plugin` 或 `$skill` 不会触发新样式，因此用户会把版本未生效误解成语法没有触发。

## 调研过程

- 核对权威 issue v5，确认 issue owner 仍是 Development Agent，当前交付已同步 `v0.4.22` 版本面。
- 核对 `package.json`，当前项目版本为 `0.4.22`。
- 核对 README 现有中英文安装、富内容和 FAQ 结构，已有重启提示，但缺少 `v0.4.21` 与 `v0.4.22` 的行为边界。
- 核对 `AGENTS.md`、`design.md`、MCP 工具说明与全部 Canvasight Skills，确认正常用户不应通过 `npm run dev` 或其他开发命令激活该功能。

## 可选方案

- 只在回复中解释：无法为后续遇到同一旧缓存现象的用户提供持续指引。
- 在 README 中新增独立安装章节：信息重复，扩大改动范围。
- 在现有 FAQ 中补充最低版本、旧快照表现和自动触发规则：范围最小且直达问题。

## 推荐方案

采用第三种方案。在中英文“安装后看不到新功能”FAQ 中明确：富内容从 `v0.4.22` 起提供；若 `codex plugin list` 仍显示 `v0.4.21`，输入对应语法不会触发新样式；安装完整新版本快照并重启后，无需额外开关，完整围栏、显式能力标签与安全 URL 会自动获得语义样式，`$` 仍负责打开 Skill 选择器。

## 实施步骤

1. 最小更新 README 中文 FAQ。
2. 写入等义英文 FAQ。
3. 保留既有安装、重启、新任务与 `@Canvasight` 流程，不添加任何开发命令作为正常用户激活步骤。

## 风险与回滚

该说明依赖 `v0.4.22` 成为本功能的实际交付版本。若主线程改变版本号，应在交付前同步调整两处 FAQ；回滚仅需移除本次新增的版本与触发说明，不影响实现或数据。

## 处理结果

已补充中英文正常用户排障说明，明确截图所示“全部仍是纯文本”属于旧 `v0.4.21` 构建快照未刷新，而不是需要另开一个富内容开关。

## 修改文件

- `plugins/canvasight/README.md`
- `agent-reports/resolved/solution-rich-node-content-version-trigger-docs.md`
- `ROSTER.md`

## 验证方式

- 人工核对中英文 FAQ 语义一致。
- 核对当前项目版本为 `0.4.22`。
- 核对说明只包含正常安装、升级、重启、新任务和 `@Canvasight` 流程，不把开发命令写成触发条件。

## 后续风险

README 只能解释版本与触发行为，不能证明用户机器上的 `v0.4.22` 已成功安装或 native widget 已通过 accepted-instance 门禁；这些运行时证据仍由 Development Agent、Test Supervisor Agent 与 Main Thread 处理。
