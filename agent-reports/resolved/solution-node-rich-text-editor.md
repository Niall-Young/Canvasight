---
schema_version: 1
report_id: solution-node-rich-text-editor
report_type: solution
status: resolved
owner: Development Agent
created_by: Main Thread
priority: high
version: 1
agent_id: /root/development_agent
thread_id: null
created_at: 2026-07-26T05:48:26Z
updated_at: 2026-07-26T05:48:26Z
depends_on:
  - issue-node-rich-text-editor
related_files:
  - plugins/canvasight/src/components/TaskNode.tsx
  - plugins/canvasight/src/lib/richTextExtensions.ts
  - plugins/canvasight/src/styles/app.css
  - plugins/canvasight/tests/rich-text-smoke.mjs
  - design.md
verification_status: passed
verification_evidence:
  - Headless Tiptap red regressions captured Enter and terminal-Space code-mark inheritance before the fix.
  - npm run test:rich-text, npm run typecheck, npm run build, and git diff --check pass.
  - Browser typing confirmed backtick conversion, Enter and terminal-Space exit, ordinary following text, 10px fenced-code separation, and a clean console.
  - The exact latest local 0.4.36 candidate is installed with repository/cache dist hashes matching and no node_modules or numbered duplicates.
  - The user confirmed the reloaded native acceptance has no problems.
---

# 节点富文本编辑器解决方案

## 负责 Agent

Development Agent

## 对应问题

`issue-node-rich-text-editor`

## Root Cause

- 首版节点正文缺少富文本模型；0.4.36 候选引入 Tiptap 后，Markdown 合同保持为 `body: string`。
- Tiptap `Code` mark 默认 `keepOnSplit: true`，使 Enter 后的新段落继承行内代码。
- 光标位于 code mark 末端时，普通 Space 会继承当前位置 mark 和 stored mark。
- `pre { margin: 0 }` 的后置规则覆盖了通用块间距。
- `bodyEditorRef` 同时由 editor lifecycle callback 与 React lifecycle 管理，旧实例 destroy 可能清空当前实例 ref。

## 推荐方案

- 生产与测试共用 `InlineCode`，设置 `keepOnSplit: false`。
- 共享 `insertUnmarkedSpaceAfterInlineCode` 只在 collapsed selection 位于 code span 真正末端时插入无 mark 空格并移除 stored mark；span 内部 Space 保持 code。
- `bodyEditorRef` 仅跟随当前 `bodyEditor` effect，并用实例 identity guard 清理；keydown 在 ref 暂空时安全返回。
- 使用 `space-10` 明确分隔围栏代码块与前后顶层正文。
- 保留标准 Markdown 语义：反引号触发行内代码，直/弯单引号是普通标点。

## 处理结果

已修复并通过用户原生验收。

## 修改文件

- `plugins/canvasight/src/components/TaskNode.tsx`
- `plugins/canvasight/src/lib/richTextExtensions.ts`
- `plugins/canvasight/src/styles/app.css`
- `plugins/canvasight/tests/rich-text-smoke.mjs`
- `design.md`

## 验证方式

- RED/GREEN：`npm run test:rich-text`
- GREEN：`npm run typecheck`
- GREEN：`npm run build`
- GREEN：Playwright 实际键盘输入与 DOM 结构检查
- GREEN：安装缓存与仓库 built index/CSS/JS hash 对比
- GREEN：用户重载后的原生 Widget 验收确认

## 后续风险

- 中间拆段、inline atom、hard break 与移动端旧键盘事件没有专项浏览器用例；当前单元和真实浏览器覆盖本次用户场景。
- latest Widget runtime 的 viewport save-count fixture `5 !== 4` 是既有独立风险，不经过富文本路径。
