---
schema_version: 1
report_id: solution-framework-choice-figma-kit-parity
report_type: solution
status: resolved
owner: Development Agent
created_by: Development Agent
priority: medium
version: 2
agent_id: /root/development_agent
thread_id: 019f6ac3-8c21-7063-9a57-4a45a3848e79
created_at: 2026-07-16T12:42:15Z
updated_at: 2026-07-16T12:47:49Z
depends_on:
  - issue-framework-choice-figma-kit-parity
related_files:
  - plugins/canvasight/src/components/FrameworkQuestionsCard.tsx
  - plugins/canvasight/src/styles/app.css
  - plugins/canvasight/tests/widget-runtime-smoke.mjs
verification_status: passed
verification_evidence:
  - Runtime smoke resolves every color against the active theme token rather than fixed RGB values.
  - Browser evidence confirms 16px controls, 8px radio dot, 6px checkbox radius, selected connecting border, no shadow, and responsive stability.
  - Light and dark runtime checks distinguish persistent selection from native input keyboard focus through focus-visible.
---

# 框架提问选择控件按 Scatter Figma Kit 还原

## 负责 Agent

Development Agent；Main Thread 代行 Design Agent 与 Design Standards Expert，Test Supervisor Agent 定义验收矩阵。

## 对应问题

`agent-reports/resolved/issue-framework-choice-figma-kit-parity.md`

## Root Cause

通用 provider card 的 selected selector 使用 focus border 和 node shadow，且 framework 仅复用了 checkbox 外形，没有实现 Figma radio、tag 和双主题完整合同。

## 调研过程

- 按 Figma Skill 顺序读取 exact-node design context、screenshots 和 variable definitions。
- 对照仓库 `app.css` light/dark token，确认无需新增颜色变量或远程图片。
- Test Supervisor Agent 找出 persistent selected 与 keyboard focus 混用的偏差。

## 可选方案

- 方案 A：继续调整通用 provider card，会影响设置对话框等其他消费者。
- 方案 B：在 framework choice 组合 selector 上精确覆盖 Figma 状态，同时保留底层 kit primitives。

## 推荐方案

采用方案 B。用现有 input、connecting、dark、inverted、primary 与 primary-subtle tokens 组成 Figma 四种状态，保留原生 input 作为语义和交互来源。

## 实施步骤

1. 按 Figma 调整 option、copy、typography、recommended tag 和 control 对齐。
2. 使用同一个 16px kit control 分别呈现 6px checkbox corner 和 full radio，选中时显示 check 或 8px dot。
3. 覆盖 framework selected card 为 connecting border、input background、no shadow。
4. 为 light/dark、selected/unselected、760px/360px 增加 runtime 和浏览器验证。
5. 用原生 input `:focus-visible` 覆盖 selected border，仅在键盘聚焦时使用 focus token，blur 后恢复 connecting border。

## 风险与回滚

改动由 framework-specific selectors 限定，不改变通用 provider card 的其他消费者；回滚组件、CSS、测试和构建产物即可恢复。

## 处理结果

已修复。

## 修改文件

- `plugins/canvasight/src/components/FrameworkQuestionsCard.tsx`
- `plugins/canvasight/src/styles/app.css`
- `plugins/canvasight/tests/widget-runtime-smoke.mjs`
- `plugins/canvasight/dist/`
- `design.md`

## 验证方式

- `npm run build`
- `npm run test:widget-runtime`
- `npm run check:mcp-bundle`
- Playwright 760px light/dark and 360px light visual checks

## 后续风险

未执行 exact delivered plugin 的 Codex native-host 安装验收；该证据仍受既有 native-host blocker 管理。
