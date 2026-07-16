---
schema_version: 1
report_id: solution-rich-node-content-editor
report_type: solution
status: resolved
owner: Development Agent
created_by: Development Agent
priority: high
version: 1
agent_id: /root/development_agent
thread_id: null
created_at: 2026-07-16T06:10:21Z
updated_at: 2026-07-16T06:10:21Z
depends_on:
  - issue-rich-node-content-editor
related_files:
  - plugins/canvasight/shared/types.ts
  - plugins/canvasight/src/lib/richNodeContent.ts
  - plugins/canvasight/src/components/RichNodeBody.tsx
  - plugins/canvasight/src/components/TaskNode.tsx
  - plugins/canvasight/src/store/scatterStore.ts
  - plugins/canvasight/src/App.tsx
  - plugins/canvasight/src/styles/app.css
  - plugins/canvasight/tests/rich-node-content-smoke.mjs
  - plugins/canvasight/package.json
  - plugins/canvasight/dist/index.html
  - plugins/canvasight/dist/assets/index-Cchp2sum.js
  - plugins/canvasight/dist/assets/index-jItbYHIA.css
verification_status: passed
verification_evidence:
  - Re-read issue-rich-node-content-editor immediately before this report at owner Development Agent, status assigned, version 2; this solution does not change issue ownership, status, or version.
  - npm run test:rich-content passed with byte-for-byte body roundtrip, closed and unclosed fence, mention boundary, safe URL, image anchor fallback, append, removal, and unsafe protocol coverage.
  - npm run typecheck passed after the editor integration reached a testable state.
  - npm run test:markdown, npm run test:markdown-export, npm run test:skills, and npm run test:concurrency all passed.
  - npm run build passed, including regenerated MCP bundle check path, TypeScript, and Vite production output.
---

# 节点富内容所见即所得开发方案

## 负责 Agent

Development Agent

## 对应问题

`agent-reports/assigned/issue-rich-node-content-editor.md`

## Root Cause

节点正文此前由单一 `textarea` 同时承担阅读与编辑，附件则独立显示为 chip。虽然 `body: string` 对 Run、Markdown、持久化和并发保存很稳定，但缺少一个可逆语义解析层，也没有图片在正文位置的独立锚点，因此代码、能力引用和 URL 只能与正文混排，图片位置无法表达。

## 调研过程

- 核对 `TaskNode.tsx` 的 selection-first 编辑、IME 延迟提交、`$` Skill picker、XYFlow `nodrag/nowheel`、失焦保存和节点高度更新合同。
- 核对 `scatterStore.ts` 的历史快照、附件追加/移除、undo/redo 和页面同步路径。
- 核对 `App.tsx` 的上传、拖放、剪贴板图片、模板、Run 和 Markdown 构建路径。
- 核对 MCP 的节点规范化使用 `...data` 保留未知向后兼容字段，确认可在不改变文档版本和 MCP runtime 的情况下持久化可选图片锚点。
- 对比两种实现：把结构化 HTML/JSON 作为正文真源会扩大迁移和 Run 风险；保留 `body` 并将语义视图派生出来可以维持现有下游合同。

## 可选方案

- 方案 A：引入完整富文本编辑器依赖和结构化文档字段。能力完整，但会引入依赖、迁移、并发合并和 Run 序列化风险，超出 MVP。
- 方案 B：保留 `body` 为真源，以纯函数解析代码/标签/链接，并仅为图片增加附件偏移锚点；编辑 surface 在 DOM 与原文本之间可逆序列化。
- 方案 C：只读富预览叠加隐藏 textarea。实现更简单，但不符合已确认的同一 surface 所见即所得编辑合同。

## 推荐方案

采用方案 B。`body` 继续是 Run、Markdown、导出、历史节点和并发保存的文本真源；新增可选 `bodyImageAnchors: { attachmentId, offset }[]`，只表达图片附件在 UTF-16 正文偏移中的位置。代码围栏、`@plugin`、`$skill` 和 `http/https` URL 都即时从 `body` 派生，任何无法识别的输入保持普通文本，不执行 HTML。

## 实施步骤

1. 新增 `richNodeContent.ts`，纯函数识别闭合围栏、能力 token、安全 URL 和图片锚点，保证解析后正文可逐字节还原。
2. 新增 `RichNodeBody.tsx`，阅读态和编辑态共用同一正文区域；编辑态以原生 `contenteditable` 呈现语义组件，并序列化回原 `body` 与图片锚点。
3. 在 `TaskNode.tsx` 保留 selection-first、IME、Skill picker、失焦提交、Run 和节点高度更新；语义边界变化时才重建编辑 DOM，composition 期间不提交 store 或移动光标。
4. 上传、粘贴或拖入图片时把最后有效正文光标偏移传入附件追加路径；删除图片同步移除附件和锚点。无锚点历史图片以正文末尾作为不写回的兼容位置，非图片附件继续使用 chip。
5. 用现有主题 token 增加代码块、能力 token、安全链接、内嵌图片、加载/错误/焦点状态样式，不引入依赖。
6. 新增聚焦 smoke 并执行 Markdown、导出、Skill、并发和生产 build 回归。

## 风险与回滚

- 主要残余风险是浏览器 `contenteditable` 在复杂选区、连续 undo/redo、IME 与语义边界重建处的宿主差异，需要 Test Supervisor 的真实浏览器证据。
- 编辑 surface 仅在语义部件序列变化时重建 DOM，普通字符输入保留原生 DOM；composition 期间完全禁止语义重建和 store 提交，以降低 caret/IME 风险。
- 回滚可移除 `RichNodeBody` 渲染并恢复纯文本正文；`body` 从未被替换为 HTML/JSON，`bodyImageAnchors` 是可选字段，旧版会忽略它且附件仍保留。
- 无锚点历史图片当前在正文末尾内嵌显示，而不是继续显示 legacy chip；是否需要区分“历史未锚定图片 chip”应由 Main Thread 结合设计基线和浏览器验收决定。

## 处理结果

已完成开发实现和自动化回归。节点正文现在能在同一 surface 中阅读和编辑内嵌图片、显式围栏代码、`@plugin`、`$skill` 和安全链接；Run/Markdown 文本仍使用原始 `body`，非图片附件仍使用原有 chip。真实浏览器可见、键盘、IME、拖拽、链接打开、图片错误恢复和原生 Widget 影响判断仍由 Test Supervisor/Main Thread 完成，不能以本报告的自动化证据替代。

## 修改文件

- `plugins/canvasight/shared/types.ts`
- `plugins/canvasight/src/lib/richNodeContent.ts`
- `plugins/canvasight/src/components/RichNodeBody.tsx`
- `plugins/canvasight/src/components/TaskNode.tsx`
- `plugins/canvasight/src/store/scatterStore.ts`
- `plugins/canvasight/src/App.tsx`
- `plugins/canvasight/src/styles/app.css`
- `plugins/canvasight/tests/rich-node-content-smoke.mjs`
- `plugins/canvasight/package.json`
- `plugins/canvasight/dist/index.html`
- `plugins/canvasight/dist/assets/index-Cchp2sum.js`
- `plugins/canvasight/dist/assets/index-jItbYHIA.css`

## 验证方式

- `npm run test:rich-content`
- `npm run typecheck`
- `npm run test:markdown`
- `npm run test:markdown-export`
- `npm run test:skills`
- `npm run test:concurrency`
- `npm run build`
- `git diff --check`

## 后续风险

- 尚无真实浏览器或原生 Widget 验收证据，不应据此宣称交互全部通过或原生宿主已验证。
- 浏览器验收应重点阻断：IME 候选提交、连续 undo/redo、代码围栏成块时的光标稳定、Skill picker 插入、图片在首尾和多图同偏移时的顺序、链接点击不触发节点拖拽、长代码横向滚动以及保存刷新后的锚点顺序。
- `contenteditable` 的 `document.execCommand("insertText")` 用于把文本粘贴限制为纯文本；若目标宿主不支持，需要以真实浏览器证据补充 Range 插入 fallback。
