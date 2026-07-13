---
schema_version: 1
report_id: solution-readme-codex-install-prompt
report_type: solution
status: resolved
owner: Customer Support Agent
created_by: Customer Support Agent
priority: medium
version: 1
agent_id: /root/customer_support_agent
thread_id: null
created_at: 2026-07-13T05:18:36Z
updated_at: 2026-07-13T05:18:36Z
depends_on:
  - issue-readme-codex-install-prompt
related_files:
  - README.md
verification_status: passed
verification_evidence:
  - Basic Usage now stays inside the Codex conversation workflow
  - Manual installation remains available in technical sections
---

# README Codex 安装提示词解决方案

## Root Cause

基础用法虽然提供了正确 CLI，但仍要求首次用户离开 Codex 对话并理解终端命令，不符合其余步骤均可复制提示词的使用方式。

## 实施方案

把基础用法第一步改为自然语言安装请求，并将完整 CLI 命令保留在后面的插件安装章节。中英文采用相同结构，其他步骤不变。

## 处理结果

已完成。

## 修改文件

- `README.md`

## 验证方式

- 双语静态检查
- Markdown diff check
- Plugin validator

## 后续风险

无。
