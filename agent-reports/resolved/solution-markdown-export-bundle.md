---
schema_version: 1
report_id: solution-markdown-export-bundle
report_type: solution
status: resolved
owner: Main Thread
created_by: Main Thread
priority: high
version: 1
agent_id: /root
thread_id: null
created_at: 2026-07-11T11:08:45Z
updated_at: 2026-07-11T11:08:45Z
depends_on:
  - issue-markdown-export-bundle
related_files:
  - plugins/canvasight/src/lib/markdownExport.ts
  - plugins/canvasight/src/components/RightDrawer.tsx
verification_status: passed
verification_evidence:
  - npm run test:markdown-export
  - npm run typecheck
---

# Markdown 导出附件包解决方案

## Root Cause

Markdown 复制未捕获 native widget 中 Clipboard API 的权限拒绝，导致宿主显示未处理 Promise 错误；现有下载路径只创建 Markdown Blob。

## 实施结果

- 删除 Markdown 复制状态、按钮、Toast 与 Clipboard 调用。
- 使用 `fflate` 生成 ZIP，并在导出副本中将附件相对路径改写到 `assets/`，去除绝对路径。
- 导出错误在抽屉内用可访问错误提示呈现，下载按钮在准备期间禁用。

## 风险与回滚

ZIP 构建需要在浏览器内读取附件；读取失败时不会下载不完整包，并可直接重试。回滚可移除导出 helper 和 `fflate` 依赖，恢复纯 Markdown 下载。
