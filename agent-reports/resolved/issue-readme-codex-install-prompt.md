---
schema_version: 1
report_id: issue-readme-codex-install-prompt
report_type: issue
status: resolved
owner: Customer Support Agent
created_by: Main Thread
priority: medium
version: 2
agent_id: /root/customer_support_agent
thread_id: null
created_at: 2026-07-13T05:17:23Z
updated_at: 2026-07-13T05:18:36Z
depends_on:
  - issue-readme-git-https-install-source
related_files:
  - README.md
verification_status: passed
verification_evidence:
  - Chinese and English Basic Usage use standalone natural-language install prompts
  - Manual HTTPS and local checkout CLI paths remain documented
  - git diff --check passed
  - Plugin validation passed
solution_report: solution-readme-codex-install-prompt
---

# README 基础安装应优先提供可复制的 Codex 提示词

## 处理结果

中文基础用法第一步现可直接复制：

```text
帮我安装这个 Codex plugin：https://github.com/Niall-Young/Canvasight.git
```

英文提供等价提示词。CLI 安装命令移至后续插件安装章节，作为手动安装和排障备用方案。

## 修改文件

- `README.md`

## 验证方式

- 双语提示词与手动 CLI 数量检查
- `git diff --check`
- Plugin validator

## 后续风险

无。
