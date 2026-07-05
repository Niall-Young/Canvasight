---
status: resolved
report_type: solution
owner: development-agent
created_by: main-thread
priority: medium
created_at: 2026-07-05 19:25
updated_at: 2026-07-05 19:25
related_issue: agent-reports/resolved/20260705-1925-product-issue-figma-color-variables-plugin.md
related_files: []
---

# Figma 颜色变量插件初步方案

## 负责 Agent

development-agent（本轮等待超时，由 main-thread 依据 Figma 官方文档代行）

## 对应问题

`agent-reports/resolved/20260705-1925-product-issue-figma-color-variables-plugin.md`

## Root Cause

该需求的核心不是单个 UI 页面，而是围绕 Figma Variables API 建立一个安全的批量创建流程：解析输入、预览变量结构、检测冲突、创建 collection/modes/variables、写入 mode values，并给出结果摘要。

## 调研过程

主线程查阅 Figma 官方开发者文档：

- Figma 插件可以通过 `figma.variables` 与变量交互，包括读取和创建变量集合与变量。
- 官方示例使用 `figma.variables.createVariableCollection` 创建 collection。
- 官方示例使用 `figma.variables.createVariable` 创建变量。
- 官方示例展示了创建 color variable、重命名默认 mode、添加 dark mode，并用 `setValueForMode` 写入 light/dark 值。
- `VariableCollection` 包含 `modes`、`variableIds`、`defaultModeId` 等属性；变量集合是同一组 mode 下变量的集合。

参考：

- https://developers.figma.com/docs/plugins/working-with-variables/
- https://developers.figma.com/docs/plugins/api/VariableCollection/
- https://developers.figma.com/docs/plugins/api/figma-variables/

## 可选方案

- 方案 A：只做单 collection + Light mode，一次性创建 primitive color variables。实现最简单，但设计系统价值低。
- 方案 B：做 collection + Light/Dark modes + primitive/semantic 命名结构，并在创建前 dry-run 预览。复杂度适中，符合“整套颜色变量”诉求。
- 方案 C：做完整 design token 管理器，支持导入/导出、团队库、远程同步、样式迁移。价值大但超出 v1。

## 推荐方案

采用方案 B。

理由：

- 满足“一整套 Figma 颜色变量”的核心价值。
- 支持 Light / Dark 是 Figma Variables 的主要使用场景。
- dry-run 预览可以避免误写入和静默覆盖。
- 不把 v1 扩大成完整 Design System 平台。

## 实施步骤

1. 设计输入格式：支持主色配置、JSON token 或 CSS variables 粘贴。
2. 解析并规范化颜色：校验 hex/rgb/rgba，转成 Figma `COLOR` value。
3. 生成变量计划：collection、modes、primitive tokens、semantic tokens。
4. dry-run 预览：展示将创建、跳过、冲突、更新的项目。
5. 冲突处理：已有同名 collection/variable 时让用户选择跳过、更新或重命名。
6. 执行写入：创建 collection，重命名默认 mode，按需 add dark mode，创建变量并设置每个 mode 的值。
7. 结果反馈：展示创建数量、跳过数量、失败数量和可复制摘要。

## 风险与回滚

- 风险：批量创建变量后难以自动撤销。缓解：默认 dry-run，真实写入前二次确认。
- 风险：命名冲突导致覆盖已有设计系统。缓解：冲突默认不覆盖，必须用户确认。
- 风险：Figma API 或账号能力差异。缓解：启动时检测 API 能力，失败时给明确错误。
- 回滚：v1 可提供“本次创建清单”，让用户按清单删除；后续可增加自动删除本次创建变量的撤销能力。

## 处理结果

已形成初步推荐方案：v1 聚焦颜色变量 collection + Light/Dark modes + primitive/semantic token + dry-run 预览。

## 修改文件

- `agent-reports/QUEUE.md`
- `agent-reports/resolved/20260705-1925-product-issue-figma-color-variables-plugin.md`
- `agent-reports/resolved/20260705-1925-development-solution-figma-color-variables-plugin.md`
- `agent-reports/resolved/20260705-1925-integration-summary.md`

## 验证方式

- 使用 Figma 官方文档确认 Variables API 支持 collection、variable、mode value 写入。
- 使用 Product / Design / Test Agent 输出交叉检查 v1 边界。
- 本轮不运行代码测试，因为未创建实际插件项目或代码。

## 后续风险

- 需要在真实 Figma 插件项目中验证当前 API、类型定义和权限表现。
- 如果后续进入开发，应创建专门插件 repo 或明确目标目录，避免污染 Canvasight repo。
