---
schema_version: 1
report_id: integration-summary-readme-git-https-install-source
report_type: integration-summary
status: resolved
owner: Main Thread
created_by: Main Thread
priority: medium
version: 1
agent_id: /root
thread_id: null
created_at: 2026-07-13T05:15:02Z
updated_at: 2026-07-13T05:15:02Z
depends_on:
  - issue-readme-git-https-install-source
  - solution-readme-git-https-install-source
related_files:
  - README.md
  - ROSTER.md
verification_status: passed
verification_evidence:
  - Customer Support Agent synchronized both languages
  - Main Thread verified CLI HTTPS support and live Git repository resolution
---

# README Git HTTPS 安装源集成总结

## 已完成

- 将中英文基础用法的 `owner/repo` 简写改为完整 GitHub HTTPS 地址。
- 保留插件安装章节中的本地 checkout 绝对路径方案。
- 明确当前是 Git 自定义 marketplace 安装路径，不暗示官方上架。

## Agent 输入

- Customer Support Agent `/root/customer_support_agent`：完成 README 两处定点修改和双语检查。
- Project Management Agent `/root/project_management_agent`：记录 clean baseline，负责冻结范围后的选择性提交。
- Main Thread：代行 Test Supervisor；无代码、UI、skill、设计或流程变化，其他角色无需启用。

## 验证

- `git diff --check`：通过。
- `codex plugin marketplace add --help`：确认支持 HTTPS Git URL。
- `git ls-remote --exit-code https://github.com/Niall-Young/Canvasight.git HEAD`：通过，仓库可解析。
- 本轮仅修改文档，无需 build 或 native-widget 验收。
- Agent Team 全仓 validator 仍会被本轮开始前的 legacy 报告、模板和 QUEUE 格式阻断；本轮新报告遵循当前 schema。

## Git 状态

- branch: `main`
- baseline HEAD: `f3c398148f07abc8bb7d221a38b81f576ad3fd08`
- approved task-owned paths: `README.md`、`ROSTER.md` 与本轮三个 resolved reports；`agent-reports/QUEUE.md` 最终无 diff。
- planned commit: `docs: 明确 Canvasight Git 安装地址`
- implementation commit hash: 由提交后的最终交付证据记录。

## 未解决风险

- Agent Team 全仓 validator 的既有历史迁移债务仍存在，不影响本轮 README 修正。
