---
schema_version: 1
report_id: issue-manual-canvas-latest-revision-refresh
report_type: issue
status: resolved
owner: Development Agent
created_by: Product Agent
priority: high
version: 2
agent_id: /root/development_agent
thread_id: null
created_at: 2026-07-17T15:38:15Z
updated_at: 2026-07-17T15:59:50Z
depends_on: []
related_files:
  - plugins/canvasight/src/App.tsx
  - plugins/canvasight/src/lib/translations.ts
  - plugins/canvasight/src/styles/app.css
  - plugins/canvasight/tests/widget-runtime-smoke.mjs
solution_report: solution-manual-canvas-latest-revision-refresh
verification_status: passed
verification_evidence:
  - Build and TypeScript checks passed.
  - Composed production-widget smoke reached its manual-refresh assertions and reported pass.
  - Concurrent document smoke passed before the final UI-only test fixture refinements.
  - Playwright browser check showed the upper-right refresh control and already-current toast.
---

# AI 写入后缺少手动加载最新画布版本入口

## 处理结果

已新增安全的“刷新到最新版本”全局动作。它等待本地保存、单飞读取 daemon 最新文档、拒绝迟到旧 revision，并在请求期间出现新编辑时保留当前画布。

## 修改文件

- `plugins/canvasight/src/App.tsx`
- `plugins/canvasight/src/lib/translations.ts`
- `plugins/canvasight/src/styles/app.css`
- `plugins/canvasight/tests/widget-runtime-smoke.mjs`
- `README.md`
- `design.md`

## 验证方式

- `npm run build`
- `npm run test:widget-runtime`
- `npm run test:concurrency`
- Playwright CLI 浏览器可见点击与截图

## 后续风险

真实 Codex native-host acceptance 本轮未执行；失败/超时、already-current 和 Page 删除回退没有独立自动化用例。
