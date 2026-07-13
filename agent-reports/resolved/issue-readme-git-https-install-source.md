---
schema_version: 1
report_id: issue-readme-git-https-install-source
report_type: issue
status: resolved
owner: Customer Support Agent
created_by: Main Thread
priority: medium
version: 2
agent_id: /root/customer_support_agent
thread_id: null
created_at: 2026-07-13T05:13:49Z
updated_at: 2026-07-13T05:15:02Z
depends_on:
  - issue-readme-copyable-quickstart
related_files:
  - README.md
verification_status: passed
verification_evidence:
  - Both Basic Usage sections use the full Git HTTPS source
  - Codex CLI help accepts HTTPS Git URL marketplace sources
  - git ls-remote resolved the documented repository HEAD
  - git diff --check passed
solution_report: solution-readme-git-https-install-source
---

# README 公开安装源应显示完整 Git HTTPS 地址

## 处理结果

中文和英文基础安装命令均已改为：

```text
codex plugin marketplace add https://github.com/Niall-Young/Canvasight.git
```

本地 checkout 的绝对路径安装方式继续保留在插件安装章节，README 不声称 Canvasight 已上架官方 curated marketplace。

## 修改文件

- `README.md`

## 验证方式

- Codex CLI help HTTPS source check
- `git ls-remote --exit-code https://github.com/Niall-Young/Canvasight.git HEAD`
- `git diff --check`

## 后续风险

无。
