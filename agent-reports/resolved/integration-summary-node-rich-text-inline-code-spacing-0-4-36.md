---
schema_version: 1
report_id: integration-summary-node-rich-text-inline-code-spacing-0-4-36
report_type: integration-summary
status: resolved
owner: Main Thread
created_by: Main Thread
priority: high
version: 3
agent_id: /root
thread_id: 019f9ca3-8bf7-7ca3-b483-b839701d85bd
created_at: 2026-07-26T04:51:20Z
updated_at: 2026-07-26T05:29:57Z
depends_on:
  - issue-node-rich-text-editor
related_files:
  - plugins/canvasight/src/components/TaskNode.tsx
  - plugins/canvasight/src/lib/richTextExtensions.ts
  - plugins/canvasight/src/styles/app.css
  - plugins/canvasight/tests/rich-text-smoke.mjs
  - design.md
  - ROSTER.md
  - agent-reports/assigned/issue-node-rich-text-editor.md
  - agent-reports/QUEUE.md
verification_status: not_applicable
verification_evidence:
  - The red Tiptap splitBlock reproduction retained the code mark before the fix.
  - The shared InlineCode extension exits the mark after Enter and passes the rich-text smoke test.
  - Browser typing produced an ordinary next paragraph and measured 10px gaps on both sides of a fenced code block.
  - A follow-up red regression proved terminal Space inherited the code mark; the fixed handler now exits only at the span boundary and preserves internal spaces.
  - Browser typing proved backticks create inline code and terminal Space makes following text ordinary without console errors; single quotation marks remain punctuation.
  - Typecheck, production build, composed production widget smoke, diff check, and browser console checks pass.
  - The latest widget-runtime run hit the pre-existing viewport-recovery fixture count 5 versus 4 outside the rich-text path.
  - A clean latest 0.4.36 candidate is installed and enabled with matching repository/cache dist hashes and no node_modules or numbered duplicate files.
  - Exact updated native Widget verification is still required before issue closure or Git commit.
---

# 0.4.36 富文本行内代码与代码块间距部分集成总结

## 本轮目标

- 修复用户在原生验收中发现的行内代码回车不退出格式。
- 增加围栏代码块与相邻正文的可读间距。
- 完成自动化与浏览器可见验证，并严格保留更新后原生 Widget 复验门槛。

## Agent 状态

- Product Agent：本轮不改变产品范围，由 Main Thread 按既有富文本合同复核。
- Design Agent：通过；认同行内代码 Enter 后退出与增加代码块分隔。
- Development Agent：完成根因诊断；确认 Tiptap `keepOnSplit` 默认值是直接原因。
- Test Supervisor Agent：独立通过实现、自动化和浏览器证据；提示中间拆段与列表组合尚无独立测试。
- Customer Support Agent：完整核对规定文件后判定双语 README 无需更新。
- Design Standards Expert：通过，并要求把 `design.md` 的反引号边界表述限定为源码与序列化语义。
- Development Standards Lead：无命令、流程或持久协作规则变化，`AGENTS.md` 无需更新。
- Project Management Agent：未启动 Git 闭环，因为更新后原生 Widget 验收尚未完成。
- Skill Expert Agent：无 Skill 合同或文件变化，不适用。

## 已完成改动

- 新增生产和测试共用的 `InlineCode` 扩展，设置 `keepOnSplit: false`。
- 添加段末 Enter 后下一段不携带 `code` mark、Markdown 不生成额外反引号的回归测试。
- 添加行内代码末端 Space 插入普通空格并清除后续 stored mark 的共享处理；代码内部 Space 保持原语义。
- 修复 `bodyEditorRef` 的 `onCreate` / `onDestroy` 竞争，改为跟随当前 editor 实例的 identity-guarded effect。
- 明确 Markdown 反引号会触发行内代码，直/弯单引号保留普通标点。
- 对围栏代码块前后相邻的顶层正文应用 `space-10` 间距。
- 更新 `design.md` 的富文本编辑语义与间距基线。

## 验证记录

- RED：真实 Tiptap `splitBlock()` 后第二段仍含 `code` mark。
- GREEN：`npm run test:rich-text`
- GREEN：`npm run typecheck`
- GREEN：`npm run build`
- GREEN：Playwright 实际输入后新段为普通 paragraph。
- GREEN：Playwright 几何测量 `topGap=10`、`bottomGap=10`。
- GREEN：浏览器控制台 0 error / 0 warning。
- GREEN：Playwright 输入 `` `自动代码` `` 生成 inline code；末端 Space 后“退出格式”为普通 sibling text。
- GREEN：`git diff --check`
- GREEN：最新本地 `canvasight@canvasight-local 0.4.36` 候选安装成功；仓库与安装缓存的 built index、CSS、JS hash 一致，且缓存无 `node_modules` 或编号副本。
- KNOWN FAILURE：最新 `npm run test:widget-runtime` 在既有 viewport recovery fixture 断言 `5 !== 4` 失败，与富文本路径无关；本轮之前的 composed production-widget smoke 已通过。
- BLOCKED（既有仓库债务）：Agent Team validator 执行完成，但扫描到大量无需迁移的 legacy 根目录报告、旧模板与历史报告缺少新版 schema frontmatter；本轮新 issue、summary、ROSTER 与 QUEUE 字段已单独核对。

## 报告状态变更

- `issue-node-rich-text-editor`：version `1 → 4`，保持 `assigned`，`verification_status: failed`。
- `ROSTER.md`：同步 Design、Development、Test Supervisor、Customer Support 与 Design Standards 角色复核状态。
- `agent-reports/QUEUE.md`：从 issue report 派生 version 与更新时间。

## 未解决 / 后续风险

- 更新后的 exact 0.4.36 尚未在真实 Codex 原生 Widget 中复验 Enter 行为与代码块视觉，因此不能关闭富文本 issue。
- Codex Desktop 必须重载后新建任务，才会使用刚安装的候选快照；当前任务不能热刷新 app-level plugin registry。
- React #185 的画布控件、Refresh、同任务 Run 与延迟元数据四项原生证据仍未补齐，相关 issue 保持 assigned。
- 当前新增回归集中覆盖行内代码段末 Enter；中间拆段与列表项组合是低风险后续覆盖项。

## Git 状态

- branch: `main`
- baseline HEAD: `5411b872ecf3c97b0bdb8a1807ec8b9fbba6b3a1`
- approved commit-ready scope: none
- planned commit subject: `fix: 修正富文本代码编辑体验`
- commit exception: updated exact 0.4.36 native Widget acceptance is incomplete
- Release: 未发布
- `stable`: 未更新
- worktree: 保留 0.4.36 候选实现、生成物与报告改动，未暂存、未提交
