---
status: resolved
report_type: solution
owner: Development Agent
created_by: Development Agent
priority: high
created_at: 2026-07-10 20:45
updated_at: 2026-07-10 20:45
related_files:
  - plugins/canvasight/mcp/server.mjs
  - plugins/canvasight/src/App.tsx
  - plugins/canvasight/shared/types.ts
---

# 直接设置当前 task 的 Plan / Goal

## 负责 Agent

Development Agent

## 对应问题

Plan / Goal 在 `thread/resume` 读取损坏 rollout 前被阻断。

## Root Cause

原运行时把 `thread/resume` 作为所有模式设置的前置条件；读取异常会阻断当前 task，即使直接模式 API 可用。

## 推荐方案

直接调用当前 widget 绑定 task 的 `thread/settings/update` 或 `thread/goal/set`；仅收到明确 task 未加载错误时，才在同一 app-server 连接中 `thread/resume` 后重试。

## 实施步骤

1. 移除 Desktop proxy transport 探测和回退承诺。
2. Plan/Chat 直接设置 collaboration mode，Goal 直接设置目标，并保留 sendMessage 前的严格成功门。
3. 增加持久化 Codex 模型偏好和 resume 后模型同步；升级插件版本。

## 处理结果

已实现，待真实 native widget 验收。

## 修改文件

- `plugins/canvasight/mcp/server.mjs`
- `plugins/canvasight/src/App.tsx`
- `plugins/canvasight/shared/types.ts`

## 验证方式

- `npm run typecheck`
- MCP smoke 覆盖由 Test Supervisor 补充。

## 后续风险

必须在重启后的 Codex Desktop 新 task 中验证真实 Plan / Goal；未经真实 host 验收不得称为已修好。
