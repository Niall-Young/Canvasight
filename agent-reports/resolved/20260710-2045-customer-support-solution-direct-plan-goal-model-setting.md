---
status: resolved
report_type: solution
owner: Customer Support Agent
created_by: Customer Support Agent
priority: medium
created_at: 2026-07-10 20:45
updated_at: 2026-07-10 20:45
related_issue:
related_files:
  - README.md
  - plugins/canvasight/src/components/SettingsDialog.tsx
  - plugins/canvasight/shared/types.ts
---

# Direct Plan / Goal 模型设置与用户文档

## 负责 Agent

Customer Support Agent

## 对应问题

本轮 Plan / Goal 改为直接模式设置，不能继续承诺 Desktop proxy 或先恢复 task。

## Root Cause

原有 README 说明仍把 Desktop proxy 与 `thread/resume` 作为 Plan / Goal 的正常前提，和新的直接模式设置合同冲突；前端也没有让用户保存 Plan 所需模型。

## 推荐方案

为应用设置新增持久化的 Codex 模型字段，默认 `gpt-5.6-terra`，每次节点 Run 显式带入 payload；中英文 README 更新为直接设置、仅未加载 task 才 resume 的合同。

## 处理结果

已完成设置 UI、localStorage 兼容默认值、Run payload wiring 与中英文 README 更新。

## 修改文件

- `plugins/canvasight/shared/types.ts`
- `plugins/canvasight/src/App.tsx`
- `plugins/canvasight/src/components/SettingsDialog.tsx`
- `plugins/canvasight/src/lib/canvasightApi.ts`
- `plugins/canvasight/src/lib/translations.ts`
- `plugins/canvasight/src/styles/app.css`
- `README.md`

## 验证方式

- 待主线程合并直接模式后运行 TypeScript typecheck 与 build。

## 后续风险

模型标识符由用户设置；Codex 拒绝无效模型时必须保留严格失败，不得发送节点内容。
