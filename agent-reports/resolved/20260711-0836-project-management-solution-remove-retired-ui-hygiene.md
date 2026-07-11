---
status: resolved
report_type: solution
owner: Project Management Agent
created_by: Project Management Agent
priority: medium
created_at: 2026-07-11 08:36
updated_at: 2026-07-11 08:36
related_issue: null
related_files:
  - agent-reports/QUEUE.md
  - design.md
  - plugins/canvasight/shared/types.ts
  - plugins/canvasight/src/App.tsx
  - plugins/canvasight/src/components/SettingsDialog.tsx
  - plugins/canvasight/src/lib/canvasightApi.ts
  - plugins/canvasight/src/lib/translations.ts
  - plugins/canvasight/src/styles/app.css
  - plugins/canvasight/dist/index.html
---

# 移除废弃模型设置与诊断入口的交付卫生检查

## 负责 Agent

Project Management Agent

## 对应问题

用户确认“Codex 当前模型”与工作区手动“诊断”入口均只服务已经废弃的 Plan / Goal 工作流，应从产品表面移除。

## Root Cause

Chat-only Run 已取代 Plan / Goal，但前端仍遗留模型偏好和工作区 bridge Diagnostics 表面。

## 调研过程

- 检查未暂存变更、统计和 `git diff --check`。
- 复核当前模型、工作区 Diagnostics 的源码残留扫描，以及启动失败面板的诊断复制保留情况。
- 确认构建产物的哈希替换与此次前端源码变更一致。

## 推荐方案

保持本次改动为一次聚焦的前端/设计基线/构建产物更新；不暂存、不提交，等待主线程统一集成。

## 实施步骤

1. 审查工作区和暂存区状态。
2. 检查改动范围与无空白错误。
3. 登记交付卫生结论至队列。

## 风险与回滚

工作区不再提供手动 bridge Diagnostics；启动失败时仍可复制诊断。若需恢复任一表面，可回退本次对应源码和构建产物变更。

## 处理结果

范围聚焦且工作树卫生符合未提交交付状态：没有已暂存文件，`git diff --check` 通过。源码中 `codexModel` 仅保留为读取旧 localStorage 时的迁移清理键；手动 Diagnostics 入口、面板和样式已移除，启动失败诊断复制仍保留。

## 修改文件

- 本 Agent 仅新增本报告并更新 `agent-reports/QUEUE.md`。
- 已审查的产品改动见 `related_files`。

## 验证方式

- `git diff --check` — 通过。
- `git diff --cached --name-only` — 无输出，未暂存。
- 源码扫描确认仅 `App.tsx` localStorage 迁移分支保留 `codexModel`。
- 源码扫描确认工作区 Diagnostics 组件、入口、状态、翻译和样式没有残留；`StartupFailurePanel` 的复制诊断能力仍存在。

## 后续风险

原生 widget 的实际点击验收仍受可用 Codex task/session 限制，详见 Test Supervisor 报告。当前 `main` 分支未创建提交；按本轮要求未暂存或提交。
