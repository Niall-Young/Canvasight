---
schema_version: 1
report_id: issue-node-rich-text-editor
report_type: issue
status: resolved
owner: Development Agent
created_by: Main Thread
priority: high
version: 5
agent_id: /root/development_agent
thread_id: null
created_at: 2026-07-26T03:10:31Z
updated_at: 2026-07-26T05:48:26Z
depends_on: []
related_files:
  - plugins/canvasight/src/components/TaskNode.tsx
  - plugins/canvasight/src/lib/richTextExtensions.ts
  - plugins/canvasight/src/styles/app.css
  - plugins/canvasight/tests/rich-text-smoke.mjs
  - design.md
verification_status: passed
verification_evidence:
  - Headless Tiptap regression reproduced that the upstream Code extension keeps the mark after splitBlock because keepOnSplit defaults to true.
  - The shared InlineCode extension with keepOnSplit false passes npm run test:rich-text and serializes the next paragraph without Markdown backticks.
  - Browser-visible typing confirmed that Enter after inline code creates an ordinary paragraph.
  - Browser geometry confirmed fenced code blocks have a 10px gap before and after adjacent top-level body content.
  - A deterministic red regression proved that Space at the end of inline code inherited the code mark before the follow-up fix.
  - The shared Space handler now inserts an unmarked space only at the end of inline code, clears the stored code mark for following text, and leaves internal code spaces untouched.
  - Browser typing confirmed Markdown backticks create inline code while straight or curly single quotation marks remain ordinary text; Space at the code boundary makes following text ordinary with a clean console.
  - npm run test:rich-text, npm run typecheck, npm run build, and git diff --check pass.
  - The latest npm run test:widget-runtime is blocked by the pre-existing viewport-recovery fixture count 5 versus 4, outside the rich-text path; an earlier composed production-widget smoke passed.
  - A clean latest 0.4.36 candidate was installed and enabled; repository and installed-cache dist hashes match, with no node_modules or numbered duplicate files.
  - The user reloaded the exact latest 0.4.36 candidate, completed native acceptance, and confirmed no problems.
solution_report: agent-reports/resolved/solution-node-rich-text-editor.md
---

# 节点正文缺少富文本编辑能力

## TL;DR

节点正文目前是纯文本 `textarea`；用户要求以现有 `design.md` 为唯一视觉基线，提供无工具栏、Markdown 即时触发的所见即所得编辑，同时保持 Markdown 字符串合同不变。

## 发现者

User

## 提交 Agent

Main Thread

## 建议交接 Agent

Development Agent

## 问题描述

节点正文无法直接呈现标题、强调、列表、引用、代码和链接。实现必须兼容模板、Skill、Run、并发保存、IME 与 XYFlow 节点交互。

## 现象

富文本首版已进入 0.4.36 候选，但用户验收发现两项编辑体验回归：

- 行内代码末尾按 Enter 后，新段仍继承 `code` mark，必须手动退出格式。
- 围栏代码块与相邻正文之间过挤。

## 复现方式

1. 打开任意 Canvasight Page 并创建节点。
2. 在正文输入 `## 标题`、`- 列表` 或 `**粗体**`。
3. 内容仍由普通 `textarea` 显示。

## 影响范围

节点编辑、Markdown 持久化、模板、Skill Picker、Run 输出、节点高度与原生 Widget 视觉验收。

## 证据

- `TaskNode.tsx` 使用受控 `textarea`。
- `ScatterNodeData.body`、模板和 Run 链路均以 Markdown `string` 为合同。
- 用户明确要求样式只能来自当前 `design.md`。

## 初步归因

Tiptap `Code` 扩展默认 `keepOnSplit: true`，导致普通 Enter 拆段时保留 mark。代码块虽然继承了通用块间距，但后续 `pre { margin: 0 }` 规则覆盖了顶部间距。

## 交付给哪个 Agent

Development Agent

## 需要回答的问题

- 如何在不改变 `body: string` 和文档 schema 的前提下实现富文本编辑？
- 如何保持 `$Skill`、IME、撤销事务、节点拖拽和自动高度行为？
- 如何完全覆盖 `design.md`，而不泄漏编辑器默认样式？

## 相关文件

- `plugins/canvasight/src/components/TaskNode.tsx`
- `plugins/canvasight/src/styles/app.css`
- `plugins/canvasight/src/lib/markdown.ts`

## 期望结果

节点正文支持计划内常用格式的 Markdown 即时转换；无工具栏、无独立编辑框；读写态视觉稳定；底层仍保存 Markdown；现有 Run、模板、Skill 与并发合同通过回归。

## Closure Criteria

- [x] 富文本编辑与只读渲染完成
- [x] Markdown 字符串合同和未知内容保护完成
- [x] `$Skill`、IME、XYFlow 交互和节点尺寸自动化验证完成
- [x] Enter 后退出 inline code 的回归与真实浏览器输入验证完成
- [x] inline code 末端 Space 退出、内部 Space 保留及后续普通输入的回归与真实浏览器验证完成
- [x] Markdown 反引号触发、直/弯单引号保持普通标点的语义验证完成
- [x] 代码块前后间距的浏览器几何验证完成
- [x] `design.md` 已同步；Customer Support Agent 判定双语 README 无需更新
- [x] 更新后 exact 0.4.36 原生 Widget 验收证据已记录

## 当前状态

resolved / passed。实现、自动化、浏览器验收及用户重载后的 exact 0.4.36 原生 Widget 验收均已通过。

## 处理结果

新增生产与测试共用的 `InlineCode` 扩展并设置 `keepOnSplit: false`；代码末端 Space 通过共享 handler 插入无 mark 空格并清除 stored code mark；代码块与相邻顶层正文统一使用 `space-10` 间距。Customer Support Agent 判定这些是既有编辑语义与视觉可读性修正，无需改 README。

## 修改文件

- `plugins/canvasight/src/components/TaskNode.tsx`
- `plugins/canvasight/src/lib/richTextExtensions.ts`
- `plugins/canvasight/src/styles/app.css`
- `plugins/canvasight/tests/rich-text-smoke.mjs`
- `design.md`
- 本 issue report

## 验证方式

- RED：真实 Tiptap `splitBlock()` 后新段仍有 `code` mark。
- GREEN：`npm run test:rich-text`
- GREEN：`npm run typecheck`
- GREEN：`npm run build`
- GREEN：`npm run test:widget-runtime`
- GREEN：Playwright 实际输入后新段为普通 paragraph；代码块上下几何间距均为 `10px`；控制台 0 error / 0 warning。
- GREEN：Playwright 输入 Markdown 反引号后生成 inline code；在 code 末端 Space 后输入的“退出格式”为普通 sibling text，控制台无新增错误。
- GREEN：`git diff --check`
- GREEN：latest local candidate installed as `canvasight@canvasight-local 0.4.36`; built index, CSS, and JS hashes match the installed cache; no `node_modules` or numbered duplicates.
- KNOWN FAILURE：最新 `npm run test:widget-runtime` 在既有 viewport recovery fixture 断言 `5 !== 4` 失败，与富文本输入路径无关。
- GREEN：用户重载更新后的 exact 0.4.36，完成原生 Widget 验收并确认无问题。

## 后续风险

当前回归覆盖本次用户场景；行内代码中间拆段、inline atom、hard break、列表项组合与移动端旧键盘事件尚无专项浏览器用例。既有 viewport save-count fixture 风险由最终集成总结单独记录。
