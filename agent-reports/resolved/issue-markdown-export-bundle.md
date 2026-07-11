---
schema_version: 1
report_id: issue-markdown-export-bundle
report_type: issue
status: resolved
owner: Main Thread
created_by: Main Thread
priority: high
version: 2
agent_id: /root
thread_id: null
created_at: 2026-07-11T10:45:00Z
updated_at: 2026-07-11T11:08:45Z
depends_on: []
related_files:
  - plugins/canvasight/src/App.tsx
  - plugins/canvasight/src/components/RightDrawer.tsx
  - plugins/canvasight/src/lib/markdownExport.ts
  - plugins/canvasight/src/lib/canvasightApi.ts
  - plugins/canvasight/src/lib/translations.ts
  - plugins/canvasight/package.json
verification_status: passed
verification_evidence:
  - npm run test:markdown-export
  - npm run test:markdown
  - npm run typecheck
  - npm run build
  - plugin validation
solution_report: solution-markdown-export-bundle
---

# Markdown 导出需要附件包且复制在 native widget 报错

## 处理结果

Main Thread 在 Development Agent 交接中断后接管并完成实现。Markdown 抽屉不再调用 Clipboard API；导出会按当前 Markdown 作用域输出 `.md` 或包含 `assets/` 的 ZIP。

## 修改文件

- `plugins/canvasight/src/components/RightDrawer.tsx`
- `plugins/canvasight/src/lib/markdownExport.ts`
- `plugins/canvasight/src/App.tsx`
- `plugins/canvasight/src/lib/canvasightApi.ts`
- `plugins/canvasight/src/lib/translations.ts`
- `plugins/canvasight/src/styles/app.css`

## 验证方式

- 新增 ZIP 导出 smoke 覆盖纯 Markdown、重复文件名、相对路径、绝对路径移除与读取失败。
- 类型检查、既有 Markdown smoke、生产构建与插件验证通过。

## 后续风险

真实 native widget 中的下载浏览器交互尚未获得可绑定任务，保留为 unverified UI 手工验收项。
