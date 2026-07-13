---
schema_version: 1
report_id: integration-summary-readme-codex-install-prompt
report_type: integration-summary
status: resolved
owner: Main Thread
created_by: Main Thread
priority: medium
version: 1
agent_id: /root
thread_id: null
created_at: 2026-07-13T05:18:36Z
updated_at: 2026-07-13T05:18:36Z
depends_on:
  - issue-readme-codex-install-prompt
  - solution-readme-codex-install-prompt
related_files:
  - README.md
  - ROSTER.md
verification_status: passed
verification_evidence:
  - Customer Support Agent synchronized both languages
  - Main Thread verified prompt and manual CLI coverage
  - Plugin validation passed
---

# README Codex 安装提示词集成总结

## 已完成

- 中文基础用法第一步改为可直接发送给 Codex 的安装提示词。
- 英文基础用法提供等价自然语言提示词。
- 完整 Git HTTPS CLI 与本地 checkout CLI 继续保留在插件安装章节。
- 重启、新建任务、打开画布、创建内容、增量修改和 Run 步骤保持不变。

## Agent 输入

- Customer Support Agent `/root/customer_support_agent`：完成 README 双语结构调整。
- Project Management Agent `/root/project_management_agent`：记录 clean baseline，负责冻结范围后的选择性提交。
- Main Thread：代行 Test Supervisor；本轮无代码、UI、skill、设计或持久流程变化，其他角色无需启用。

## 验证

- `git diff --check`：通过。
- 双语静态检查：中文和英文自然语言安装提示词各一处，手动 Git HTTPS CLI 各一处。
- Plugin validator：通过。
- 本轮仅修改文档，无需 build 或 native-widget 验收。
- Agent Team 全仓 validator 仍会被本轮开始前的 legacy 报告、模板和 QUEUE 格式阻断；本轮新报告遵循当前 schema。

## Git 状态

- branch: `main`
- baseline HEAD: `e4745687d911797f593fe2beff08125d2f2a8e47`
- approved task-owned paths: `README.md`、`ROSTER.md` 与本轮三个 resolved reports；`agent-reports/QUEUE.md` 最终无 diff。
- planned commit: `docs: 使用 Codex 安装提示词`
- implementation commit hash: 由提交后的最终交付证据记录。

## 未解决风险

- Agent Team 全仓 validator 的既有历史迁移债务仍存在，不影响本轮 README 修正。
