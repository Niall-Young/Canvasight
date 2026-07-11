---
status: resolved
report_type: solution
owner: Design Standards Expert
created_by: Design Standards Expert
priority: medium
created_at: 2026-07-11 08:30
updated_at: 2026-07-11 08:30
related_issue: null
related_files:
  - design.md
  - agent-reports/QUEUE.md
---

# 移除已退役的模型设置与手动诊断入口的设计基线

## 负责 Agent

Design Standards Expert

## 对应问题

用户确认“Codex 当前模型”设置只为已退役的 Plan / Goal 路径服务，现已不需要保留；随后确认手动工作区 Diagnostics 工具栏按钮和面板同样不再需要。

## Root Cause

`design.md` 仍把 Plan / Goal 视为节点核心模式，且没有明确禁止设置页暴露旧的模型选择控件或工作区手动诊断入口；这与现有 Chat-only Run 产品契约及简洁工作区方向不一致。

## 调研过程

- 核对设计基线的 Codex Run、图标语义、Topbar 与 Settings 章节。
- 核对队列近期已完成的 Chat-only node Run 集成记录，确认 Plan / Goal 已从运行契约移除。
- 确认原生启动失败面板的 Copy diagnostics 与恢复操作是必要的失败恢复路径，而非日常工作区 Diagnostics 面板。

## 推荐方案

将设计基线收敛为单一 Chat Run，明确 Settings 不展示或编辑 Codex 当前模型，并移除手动工作区 Diagnostics 入口；保留原生启动失败面板内的 Copy diagnostics 与恢复操作。

## 实施步骤

1. 将 `Codex Run Modes` 改为 Chat-only 的 `Codex Run`。
2. 删除 Goal 图标语义要求。
3. 新增 Settings 范围约束，明确移除当前模型行。
4. 在 Topbar、Run 与 Settings 约束中明确移除手动 Diagnostics 工具栏按钮或面板，同时保留启动失败恢复诊断。

## 风险与回滚

仅更新设计契约，不影响源码。若将来重新引入可验证的模型选择流程或常驻诊断工作台，应重新定义用户价值、任务范围和运行时契约后再恢复对应控件。

## 处理结果

已更新设计基线，支持移除设置页中的“Codex 当前模型”行及手动工作区 Diagnostics 入口；原生启动失败恢复诊断保持不变。

## 修改文件

- `design.md`
- `agent-reports/resolved/20260711-0830-design-standards-solution-remove-codex-model-setting.md`
- `agent-reports/QUEUE.md`

## 验证方式

- 文本核对：`design.md` 已不再将 Plan / Goal 作为节点模式，明确禁止当前模型设置行与手动工作区 Diagnostics 入口，并保留启动失败面板的 Copy diagnostics 约定。
- 近期 Chat-only Run 集成记录与此设计方向一致。

## 后续风险

源码和用户文档的对应移除由负责角色完成后，应进行设置页和工具栏可见性检查，并确认启动失败面板仍提供 Copy diagnostics。
