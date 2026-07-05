---
status: resolved
report_type: issue
owner: product-agent
created_by: user
priority: medium
created_at: 2026-07-05 19:25
updated_at: 2026-07-05 19:25
related_files: []
solution_report: agent-reports/resolved/20260705-1925-development-solution-figma-color-variables-plugin.md
---

# Figma 颜色变量插件需求梳理

## TL;DR

用户提出一个新产品需求：做一个 Figma 插件，自动创建一整套 Figma 颜色变量；本轮作为 Agent Report 协议演练，不进入实际开发。

## 发现者

user

## 提交 Agent

main-thread

## 建议交接 Agent

product-agent、design-agent、development-agent、test-supervisor-agent

## 问题描述

用户希望验证 Agent Report 协作协议，并给出一个实际需求样例：开发一个 Figma 插件，自动生成完整的颜色变量体系。

这不是 Canvasight 自身功能变更，而是一个适合用 Canvasight / Agent Team 进行产品需求拆解的外部产品想法。

## 现象

原始用户输入：

> 我想要做一个 figma 插件，可以自动创建一整套 figma 颜色变量

## 复现方式

1. 用户在当前 Canvasight 项目线程中提出上述产品想法。
2. 主线程按 Agent Team 流程分派产品、设计、开发、测试、客服、设计规范角色。
3. 主线程使用新 `agent-reports/` 协议登记、回写并关闭本轮演练。

## 影响范围

- 影响 Agent Report 协议验证。
- 不影响 Canvasight UI。
- 不影响 Canvasight README。
- 不影响 Canvasight `design.md`。
- 不实现实际 Figma 插件代码。

## 证据

- Product Agent 判断该需求应归类为 `software-product`。
- Design Agent 给出插件 UI/交互关注点。
- Test Supervisor Agent 给出变量创建、冲突、主题模式和 dry-run 验收清单。
- Customer Support Agent 判断不需要更新 Canvasight README。
- Design Standards Expert 判断不需要更新 Canvasight `design.md`。
- Development Agent 未在本轮等待窗口返回，主线程依据 Figma 官方文档代行技术调研。

## 初步归因

这是一个明确的新产品/插件需求，需要按产品、设计、技术、测试边界拆解，而不是直接进入实现。

## 交付给哪个 Agent

- Product Agent：定义目标用户、核心功能、产品边界、验收点。
- Design Agent：定义插件 UI、输入、预览、错误反馈。
- Development Agent：调研 Figma Variables Plugin API 和实现边界。
- Test Supervisor Agent：定义测试验收。

## 需要回答的问题

- v1 是只从用户输入色板生成变量，还是也从当前 Figma 文件提取颜色？
- 变量体系是否包含 primitive + semantic 两层？
- Light / Dark mode 是否必须是 v1 必备？
- 冲突处理默认策略是跳过、更新、重命名，还是用户确认？
- 是否需要 dry-run 预览后确认？

## 相关文件

- 无代码文件，本轮只做流程演练。

## 期望结果

形成一份可交接的产品/技术初步方案，并验证 agent-report 的状态、模板和回写闭环。

## Closure Criteria

- [x] 问题原因明确
- [x] 方案报告已回写
- [x] 修改文件已记录
- [x] 验证方式已记录
- [x] 后续风险已记录

## 当前状态

resolved

## 处理结果

已完成初步需求 triage 和方案回写；未进入实际插件开发。

## 修改文件

- `agent-reports/QUEUE.md`
- `agent-reports/resolved/20260705-1925-product-issue-figma-color-variables-plugin.md`
- `agent-reports/resolved/20260705-1925-development-solution-figma-color-variables-plugin.md`
- `agent-reports/resolved/20260705-1925-integration-summary.md`

## 验证方式

- 检查 issue report 包含 `status / owner / created_by / priority / solution_report`。
- 检查 solution report 回写 root cause、推荐方案、验证方式和后续风险。
- 检查 `QUEUE.md` 记录本轮 resolved 结果。

## 后续风险

- 如果用户接下来要求真的开发 Figma 插件，需要新建或切换到对应插件项目，而不是在 Canvasight repo 里直接实现外部产品。
