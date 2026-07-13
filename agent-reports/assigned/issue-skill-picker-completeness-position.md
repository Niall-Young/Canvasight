---
schema_version: 1
report_id: issue-skill-picker-completeness-position
report_type: issue
status: assigned
owner: Development Agent
created_by: Main Thread
priority: high
version: 2
agent_id: /root/development_agent
thread_id: 019f5bfd-a6a5-7b13-a1a9-d6924fa2100a
created_at: 2026-07-13T15:00:26Z
updated_at: 2026-07-13T15:14:35Z
depends_on:
  - issue-skill-composition-node-assignment
related_files:
  - plugins/canvasight/mcp/server.source.mjs
  - plugins/canvasight/src/components/TaskNode.tsx
  - plugins/canvasight/src/styles/app.css
  - plugins/canvasight/tests
  - design.md
verification_status: failed
verification_evidence:
  - 0.4.15 automated MCP, Skill, typecheck, build, distribution, release and plugin validation passed.
  - Browser fallback loaded 171 Skills, kept the 336px picker outside the editing node, scrolled keyboard selection into view, refreshed successfully, inserted $figma with Enter, and reported no console warnings or errors.
  - Real Codex fullscreen native Widget acceptance is still unavailable until the upgraded plugin is installed and Codex Desktop is restarted.
solution_report: agent-reports/resolved/solution-skill-picker-completeness-position.md
---

# Skill 选择器列表不完整且弹层遮挡画布

## TL;DR

节点 Skill 选择器只显示了部分可用 Skill，且弹层以过大的节点内浮层覆盖正文和画布，影响选择与继续编辑。

## 发现者

User

## 提交 Agent

Main Thread

## 建议交接 Agent

Development Agent

## 问题描述

核对 `skills/list` 的分页与聚合链路，确保 Canvasight 获取当前项目全部启用 Skill；同时重新约束选择器的锚点、方向、最大尺寸与视口避让，使其靠近触发位置但不压住主要编辑区域。

## 现象

- 列表中显然缺少当前环境已启用的部分 Skill。
- 弹层尺寸过大、位置居中压住节点正文与画布。
- 长列表只能在狭窄内部滚动区浏览，缺少有效的视口避让。

## 复现方式

1. 在节点正文输入 `$` 打开 Skill 选择器。
2. 对照 Codex 当前可用 Skill 列表检查条目完整性。
3. 在截图所示节点位置观察弹层覆盖范围与滚动体验。

## 影响范围

Skill 发现 MCP 链路、节点 Skill 选择器交互、样式、设计基线与回归验证。

## 证据

- 用户截图显示选择器覆盖节点主体，并仅露出少量 Skill 条目。
- `mcp/server.source.mjs` 当前直接调用 `skills/list`，需确认是否消费分页游标。

## 初步归因

`skills/list` 本身不分页。缺失来自两层实现：前端默认将匹配结果硬截为 8 条；Skill discovery 与 native Run 共用 Desktop-first runtime，在没有 Codex.app 时误用 ChatGPT 内置 Codex，只解析约 65 条，而 PATH Codex 对同一项目可解析约 171 条。选择器同时作为节点内 absolute 元素继承 XYFlow zoom，`width: 100%` 后被放大并覆盖节点。

## 交付给哪个 Agent

Development Agent；Design Agent 审查交互位置，Test Supervisor Agent 独立验证完整性与可见效果。

## 需要回答的问题

- `skills/list` 的分页字段和作用域语义是什么，如何无泄露地聚合全部摘要？
- 选择器应锚定输入光标、textarea、还是节点边缘，怎样在上下空间不足时翻转？
- 如何用自动化和真实浏览器同时证明列表完整且弹层不再遮挡主要内容？

## 相关文件

- `plugins/canvasight/mcp/server.source.mjs`
- `plugins/canvasight/src/components/TaskNode.tsx`
- `plugins/canvasight/src/styles/app.css`
- `plugins/canvasight/tests/`
- `design.md`

## 期望结果

选择器能列出当前项目全部启用 Skill，并以紧凑、就近、视口安全的方式展开；键盘选择、刷新和手工输入兼容行为保持不变。

## Closure Criteria

- [x] 完整 Skill 目录已加载、去重并受回归覆盖
- [x] 弹层 Portal、翻转与最大尺寸完成浏览器可见验证
- [x] 键盘、刷新、Enter 选择、Escape 与手工输入行为无回归
- [x] `design.md` 与 README 决策已记录
- [x] 自动化、构建、分发与浏览器验证完成
- [ ] 重启 Codex Desktop 后完成真实 fullscreen native Widget 验收

## 当前状态

assigned

## 处理结果

0.4.15 实现与自动化、浏览器 fallback 验证已完成；真实 fullscreen native Widget 需要安装升级并重启 Codex Desktop 后验收，因此保持 assigned/unverified。

## 修改文件

- 见 `agent-reports/resolved/solution-skill-picker-completeness-position.md`。

## 验证方式

- `npm run test:skills`
- `npm run typecheck`
- `npm run test:mcp`
- `npm run test:plugin-distribution`
- `npm run release:verify -- 0.4.15`
- 插件 validator
- Playwright 真实浏览器 fallback：171 options、无节点重叠、刷新、键盘滚动、Enter 与 Escape

## 后续风险

真实 Codex fullscreen native Widget 尚未在重启后的宿主完成控制与同任务 Run 验收；不得据此声称 native Widget 已验证。
