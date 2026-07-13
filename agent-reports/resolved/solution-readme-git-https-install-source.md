---
schema_version: 1
report_id: solution-readme-git-https-install-source
report_type: solution
status: resolved
owner: Customer Support Agent
created_by: Customer Support Agent
priority: medium
version: 1
agent_id: /root/customer_support_agent
thread_id: null
created_at: 2026-07-13T05:15:02Z
updated_at: 2026-07-13T05:15:02Z
depends_on:
  - issue-readme-git-https-install-source
related_files:
  - README.md
verification_status: passed
verification_evidence:
  - Public source is explicit in Chinese and English
  - Local path alternative remains intact
---

# README Git HTTPS 安装源解决方案

## Root Cause

`owner/repo` 是 Codex CLI 支持的 Git marketplace 简写，但视觉上容易与官方 marketplace 标识混淆。

## 实施方案

只把两个基础用法中的简写替换为仓库完整 HTTPS Git URL，保留其他安装、提示词和技术说明不变。

## 处理结果

已完成。

## 修改文件

- `README.md`

## 验证方式

- Codex CLI help
- Git remote HEAD lookup
- Markdown diff check

## 后续风险

无。
