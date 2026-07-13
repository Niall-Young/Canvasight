---
schema_version: 1
report_id: issue-readme-copyable-quickstart
report_type: issue
status: resolved
owner: Customer Support Agent
created_by: Main Thread
priority: medium
version: 2
agent_id: /root/customer_support_agent
thread_id: null
created_at: 2026-07-13T05:03:30Z
updated_at: 2026-07-13T05:06:58Z
depends_on: []
related_files:
  - README.md
verification_status: passed
verification_evidence:
  - Bilingual quickstart follows install open create update and Run order
  - Copyable prompt blocks exist in both languages
  - Codex CLI help confirms owner/repo marketplace and plugin@marketplace syntax
  - git diff --check passed
solution_report: solution-readme-copyable-quickstart
---

# README 基础用法缺少可复制的新手路径

## TL;DR

基础用法已改为普通用户可以从头复制执行的新手路径，不再要求用户理解内部 MCP 参数。

## 处理结果

- 安装插件成为第一步，并使用跨平台的 Git marketplace 命令。
- 中文和英文均提供独立的打开画布提示词代码块。
- 中文和英文均提供代码项目、产品需求、文章资料三类创建提示词和一个增量更新提示词。
- 内部 widget ready 合同仍保留在原生合同、MCP Tools 与原生验收章节。
- 普通使用流程不要求运行开发服务器。

## 修改文件

- `README.md`

## 验证方式

- `git diff --check`
- Codex CLI marketplace/plugin help syntax check
- 双语标题、安装命令和 `@Canvasight` 提示词数量检查
- Plugin validator

## 后续风险

- 无本轮已知风险；未来若公开安装入口或 marketplace 名称改变，需要同步更新两种语言的第一步。

## 当前状态

resolved
