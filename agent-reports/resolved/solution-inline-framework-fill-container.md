---
schema_version: 1
report_id: solution-inline-framework-fill-container
report_type: solution
status: resolved
owner: Development Agent
created_by: Main Thread
priority: high
version: 1
agent_id: /root/development_agent
thread_id: null
created_at: 2026-07-16T14:13:27Z
updated_at: 2026-07-16T14:13:27Z
depends_on:
  - issue-inline-framework-questions
related_files:
  - design.md
  - plugins/canvasight/src/styles/app.css
  - plugins/canvasight/tests/widget-runtime-smoke.mjs
  - plugins/canvasight/.codex-plugin/plugin.json
  - plugins/canvasight/package.json
  - plugins/canvasight/package-lock.json
  - plugins/canvasight/mcp/server.source.mjs
  - plugins/canvasight/mcp/server.mjs
  - plugins/canvasight/dist/index.html
verification_status: passed
verification_evidence:
  - The framed form fills wide and 360px hosts with document and body scroll widths equal to the viewport.
  - The runtime asserts 24px padding, 16px radius, border-box sizing, themed divider border, and complete auto-resize height.
  - Full light and dark captures show all four border edges, bottom radius, final textarea, and footer action.
---

# 消息内框架表单恢复自适应外框

## 负责 Agent

Development Agent

## 对应问题

`agent-reports/assigned/issue-inline-framework-questions.md`

## Root Cause

上一轮为消除宿主中的双层卡片，把 inline shell 完全扁平化，并把“无外框”固化进 `design.md` 与运行时断言。真实 Codex 截图证明该假设不符合用户目标：表单失去完整边界与内距，测试宿主又没有应用 `size-changed`，导致截图无法证明底部完整展示。

## 调研过程

- 对照用户亮暗宿主截图、`design.md`、shell/card CSS 和 widget runtime 断言。
- 区分 iframe 内宽度溢出与 fake host 固定尺寸导致的父页面滚动。
- 保持选项、推荐 badge、输入框和选择态视觉合同不变，仅修复最外层边界与响应式尺寸链。

## 推荐方案

让 `.framework-questions-shell` 成为唯一透明外框：`width/max-width: 100%`、`min-width: 0`、`box-sizing: border-box`、24px padding、16px radius、1px `--color-border-divider`。为可收缩后代补齐 `min-width: 0`，并让测试宿主实际应用自动高度通知。

## 实施步骤

1. 更新设计基线与外层 CSS。
2. 强化宽/窄、亮/暗、border-box 和无横向 overflow 断言。
3. 让 fake host 应用 `size-changed` 高度并截取完整页面。
4. 生成并安装 0.4.28 完整插件快照。

## 风险与回滚

真实 Codex Desktop 仍需重启后用新任务加载 0.4.28 资源；若宿主不采纳自动高度，应保留本实现并单独诊断 host resize bridge，不回退为横向滚动或裁切。

## 处理结果

已修复代码、设计合同、自动化和完整视觉证据；真实原生宿主验收仍由 Test Supervisor Agent 持有。

## 修改文件

- `design.md`
- `plugins/canvasight/src/styles/app.css`
- `plugins/canvasight/tests/widget-runtime-smoke.mjs`
- 0.4.28 version、MCP bundle 与 `dist` snapshot 文件

## 验证方式

- `npm run build`
- `npm run test:widget-runtime`
- `npm run release:verify -- 0.4.28`
- `npm run test:plugin-distribution`
- `npm run check:mcp-bundle`
- plugin validator
- installed-cache byte comparisons

## 后续风险

当前 Codex Desktop 进程仍可能保留 0.4.27 app-level registry/resource snapshot；重启后新任务的真实 inline submit 与 fullscreen 回归尚未完成。
