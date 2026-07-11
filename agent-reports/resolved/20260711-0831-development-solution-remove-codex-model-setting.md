---
status: resolved
report_type: solution
owner: Development Agent
created_by: Development Agent
priority: medium
created_at: 2026-07-11 08:31
updated_at: 2026-07-11 08:31
related_issue: null
related_files:
  - plugins/canvasight/shared/types.ts
  - plugins/canvasight/src/App.tsx
  - plugins/canvasight/src/components/SettingsDialog.tsx
  - plugins/canvasight/src/lib/canvasightApi.ts
  - plugins/canvasight/src/lib/translations.ts
---

# 移除 Codex 当前模型设置实现

## 负责 Agent

Development Agent

## 对应问题

用户确认“Codex 当前模型”字段仅为已经移除的 Plan / Goal 流程服务，不再需要保存、显示或传入节点 Run。

## Root Cause

Chat-only Run 已经不读取前端的 `codexModel`，但该字段仍留在应用设置、设置草稿、localStorage、Run payload 与运行结果同步回写链路中。

## 调研过程

- 追踪 `AppSettings`、`SettingsDialog`、`RunPayload` 和原生 Run 的调用点。
- 确认 MCP 服务仍自行从当前 Codex task 获取模型，以满足内部 Chat 设置更新要求；前端保存值并不参与该行为。

## 推荐方案

删除前端和共享设置模型中的废弃字段，并在读取旧 localStorage 时立即重写规范化后的设置，保留 Chat-only 节点 Run 的 payload 与发送逻辑。

## 实施步骤

1. 从 `AppSettings`、默认值、翻译和设置页移除当前模型字段。
2. 删除 App 的模型同步和 Run payload 传递。
3. 删除 API 类型中的前端模型字段，并迁移旧 localStorage 值。

## 风险与回滚

旧 localStorage 的 `codexModel` 会在下次加载时被移除。若未来重新引入用户可选模型，需要重新设计并验证独立于 Chat-only Run 的契约。

## 处理结果

已移除该设置及前端状态链路；Chat 节点运行仍按原有 Chat-only 流程发送。

## 修改文件

- `plugins/canvasight/shared/types.ts`
- `plugins/canvasight/src/App.tsx`
- `plugins/canvasight/src/components/SettingsDialog.tsx`
- `plugins/canvasight/src/lib/canvasightApi.ts`
- `plugins/canvasight/src/lib/translations.ts`

## 验证方式

- `npm run typecheck`（通过）
- 后续应在原生 Canvasight widget 中确认设置页没有该输入框，并触发一个 Chat Run。

## 后续风险

未改动 MCP 服务内部为了设置当前 task 的 Chat collaboration mode 而读取模型的逻辑；那不是用户可配置的模型偏好。
