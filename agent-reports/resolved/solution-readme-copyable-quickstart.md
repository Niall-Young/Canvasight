---
schema_version: 1
report_id: solution-readme-copyable-quickstart
report_type: solution
status: resolved
owner: Customer Support Agent
created_by: Customer Support Agent
priority: medium
version: 1
agent_id: /root/customer_support_agent
thread_id: null
created_at: 2026-07-13T05:06:58Z
updated_at: 2026-07-13T05:06:58Z
depends_on:
  - issue-readme-copyable-quickstart
related_files:
  - README.md
verification_status: passed
verification_evidence:
  - Chinese and English quickstarts are structurally equivalent
  - All open create and update examples use standalone text fences
  - Local checkout installation remains documented separately
---

# README 可复制新手路径解决方案

## Root Cause

原基础用法以插件运行时实现者为读者，先解释 `CODEX_THREAD_ID`、`open_canvasight` 和 ready 回执，没有回答首次使用者最先遇到的安装、打开和创建内容问题。

## 实施方案

1. 把基础用法重排为安装、重启并新建任务、打开、创建、增量修改和 Run。
2. 使用 `Niall-Young/Canvasight` Git marketplace 作为跨平台的最短公开安装入口。
3. 为打开、代码架构、产品需求、文章资料和增量修改分别提供可复制的提示词代码块。
4. 保留后续技术章节中的原生 ready、MCP tools、本地 checkout 和开发命令说明。
5. 中英文采用相同结构和相同能力边界。

## 处理结果

已完成。

## 修改文件

- `README.md`

## 验证方式

- `git diff --check`
- `codex plugin marketplace add --help`
- `codex plugin add --help`
- Plugin validator

## 后续风险

无。
