---
schema_version: 1
report_id: solution-framework-questions-visual-redesign
report_type: solution
status: resolved
owner: Development Agent
created_by: Development Agent
priority: medium
version: 3
agent_id: /root/development_agent
thread_id: 019f6ac3-8c21-7063-9a57-4a45a3848e79
created_at: 2026-07-16T12:01:20Z
updated_at: 2026-07-16T12:26:06Z
depends_on:
  - issue-framework-questions-visual-redesign
related_files:
  - plugins/canvasight/src/components/FrameworkQuestionsCard.tsx
  - plugins/canvasight/src/styles/app.css
  - plugins/canvasight/tests/widget-runtime-smoke.mjs
verification_status: passed
verification_evidence:
  - TypeScript, production build, composed widget runtime, clean distribution, and plugin validation passed.
  - Runtime smoke asserts direct KitButton, provider-card, settings-input, and kit-checkbox class reuse.
  - Playwright computed styles confirm black KitButton, provider-card selection, and settings-input values in light/dark and desktop/mobile layouts.
  - Runtime geometry asserts the legend has 14px top padding, visible divider separation, and the existing option gap.
---

# 框架提问表单复用 Canvasight / Scatter 原生组件

## 负责 Agent

Development Agent；Design Agent、Test Supervisor Agent 与 Main Thread 完成审查、验证和集成。

## 对应问题

`agent-reports/resolved/issue-framework-questions-visual-redesign.md`

## Root Cause

首轮视觉重构继续使用旧蓝色 `Button` 并新增 framework 专属蓝色选择态，没有识别 `79edfb9` 已迁入的 Scatter `kit-*` primitives。

## 调研过程

- Design Agent 回溯 `79edfb9`，定位 KitButton、provider card、kit checkbox 与 settings input。
- Development Agent 确认保留原生 radio/checkbox 语义，只复用现成 primitive 与样式家族。
- Test Supervisor Agent 要求 DOM class 与 computed style 都能指向既有 Canvasight selector。

## 可选方案

- 方案 A：把 framework 专属蓝色 token 改黑；仍是新造样式，不满足用户要求。
- 方案 B：直接换用 KitButton，并把选项、控件和输入逐项映射到已有 Canvasight 类。

## 推荐方案

采用方案 B。提交直接使用 `<KitButton filled size="md">`；选项容器和文字直接复用 `assistant-provider-card*`；原生 checkbox/radio 的视觉复用 `kit-checkbox`；textarea 直接复用 `settings-dialog-input`。移除首轮蓝点、题数、编号与蓝色 badge。

## 实施步骤

1. 保留 form、fieldset、legend、原生输入、data-testid、bridge 和 sessionStorage 合同。
2. 将旧 Button 替换为 KitButton，并把 provider/input/checkbox 现有类写入 JSX。
3. 仅保留 inline 布局适配；视觉状态交给既有 Canvasight selectors 和 tokens。
4. 在 widget smoke 中断言组件类复用，并用 Playwright 核对 computed style。

## 风险与回滚

风险限定在 inline UI 渲染；回滚组件和 CSS 三处 task-owned diff 即可恢复。MCP tool/resource、bridge、Graph Writer 和 `.scatter` 合同未修改。

## 处理结果

已修复。针对用户继续指出的标题贴近分割线问题，将 `.framework-question` 的顶部 padding 转移到 `legend`，规避原生 fieldset/legend 的特殊盒模型，同时保持选项卡、按钮和输入框视觉不变。

## 修改文件

- `plugins/canvasight/src/components/FrameworkQuestionsCard.tsx`
- `plugins/canvasight/src/styles/app.css`
- `plugins/canvasight/tests/widget-runtime-smoke.mjs`
- `plugins/canvasight/dist/`

## 验证方式

- `npm run typecheck`
- `npm run build`
- `npm run test:widget-runtime`
- `npm run check:mcp-bundle`
- Playwright 实际浏览器截图与 overflow 计算

## 后续风险

本轮未发布新插件版本，因此当前 Codex 任务中的已缓存 inline resource 不会热更新；原生宿主新版验收留到 exact delivered version 安装后执行。
