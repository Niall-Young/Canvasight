---
schema_version: 1
report_id: integration-summary-canvasight-0-4-36-native-acceptance-closure
report_type: integration-summary
status: resolved
owner: Main Thread
created_by: Main Thread
priority: critical
version: 2
agent_id: /root
thread_id: 019f9ca3-8bf7-7ca3-b483-b839701d85bd
created_at: 2026-07-26T05:51:42Z
updated_at: 2026-07-26T05:55:48Z
depends_on:
  - issue-codex-react-185-sidebar-recovery
  - solution-codex-react-185-sidebar-recovery
  - issue-node-rich-text-editor
  - solution-node-rich-text-editor
  - issue-widget-viewport-recovery-save-count
related_files:
  - ROSTER.md
  - agent-reports/QUEUE.md
  - agent-reports/resolved/issue-codex-react-185-sidebar-recovery.md
  - agent-reports/resolved/solution-codex-react-185-sidebar-recovery.md
  - agent-reports/resolved/issue-node-rich-text-editor.md
  - agent-reports/resolved/solution-node-rich-text-editor.md
  - agent-reports/assigned/issue-widget-viewport-recovery-save-count.md
  - design.md
  - plugins/canvasight/.codex-plugin/plugin.json
  - plugins/canvasight/package.json
  - plugins/canvasight/package-lock.json
  - plugins/canvasight/mcp/server.source.mjs
  - plugins/canvasight/mcp/server.mjs
  - plugins/canvasight/src/components/TaskNode.tsx
  - plugins/canvasight/src/lib/richTextExtensions.ts
  - plugins/canvasight/src/styles/app.css
  - plugins/canvasight/tests/rich-text-smoke.mjs
  - plugins/canvasight/dist/index.html
  - plugins/canvasight/dist/assets/index-Bj6Vhh9f.css
  - plugins/canvasight/dist/assets/index-B3sH-ukW.js
verification_status: passed
verification_evidence:
  - Exact 0.4.36 completed three native A-to-B-to-A rounds and a 60-second historical-task stability window with strict fullscreen ready evidence.
  - The user completed the remaining canvas-control, Refresh, same-task Run, late-metadata and final rich-text native acceptance and confirmed no problems.
  - Rich-text regressions, typecheck, production build, Markdown flow, MCP bundle freshness, plugin validation, browser typing/geometry and installed-cache hashes pass.
  - Test Supervisor independently approved closure of both delivered issues.
  - The baseline-origin widget viewport save-count failure is isolated in issue-widget-viewport-recovery-save-count and is not represented as green.
---

# Canvasight 0.4.36 原生验收闭环

## 本轮目标

- 完成 React #185 历史侧栏恢复的 A→B→A、60 秒稳定、画布控件、Refresh、同任务 Run 与延迟元数据原生验收。
- 修复验收中发现的富文本行内代码退出语义与代码块间距。
- 通过后关闭报告并提交，不发布 Release、不更新 `stable`。

## Agent 状态

- Product Agent：产品范围保持 Canvasight 原生 Widget 与 Markdown 字符串合同。
- Design Agent：通过 Enter/Space 自动退出与代码块分隔交互。
- Development Agent：完成 React recovery coordinator 与富文本修复。
- Test Supervisor Agent：独立判定两个交付 issue 均为 PASS；单独接收 viewport save-count 风险。
- Customer Support Agent：按规定复核双语 README、runtime 与全部 Skills，判定无需 README 更新。
- Design Standards Expert：通过并精炼 `design.md` 的反引号、单引号、Enter 与 Space 语义。
- Development Standards Lead：无持久流程、命令或 AGENTS 规则变化，`AGENTS.md` 无需更新。
- Project Management Agent：在 Main Thread 冻结 scope 后执行选择性 Git 闭环。
- Skill Expert Agent：无 Skill 文件或触发合同变化，不适用。

## 已解决

- 同一 project+thread 的历史 Widget presentation recovery 由唯一最新 owner 协调，避免跨实例脉冲竞争。
- exact 0.4.36 三轮任务往返与 60 秒历史任务稳定通过。
- 用户完成剩余原生画布控件、Refresh、同任务 Run、延迟元数据及最终富文本验收并确认无问题。
- 行内代码 Enter 与末端 Space 自动退出；内部 Space 保留；反引号触发，直/弯单引号不触发。
- 围栏代码块与前后顶层正文使用 `space-10` 间距。
- editor ref 改为当前实例 identity-guarded effect，消除旧实例 destroy 清空当前 ref 的竞争。

## 验证记录

- PASS：0.4.36 exact native A→B→A 三轮、strict fullscreen ready、历史 A 60 秒稳定。
- PASS：用户原生验收确认“没有问题”。
- PASS：`npm run test:rich-text`
- PASS：`npm run typecheck`
- PASS：`npm run build`
- PASS：`npm run test:markdown`
- PASS：`npm run check:mcp-bundle`
- PASS：plugin validator
- PASS：Playwright 反引号转换、Enter/Space 退出、普通后续文本、代码块上下 10px、clean console。
- PASS：仓库与 installed cache built index/CSS/JS hash 一致；安装无 `node_modules` 或编号副本。
- PASS：source、report 与除生成 JS bundle 外的 scoped cached diff check 为 0；full cached check 仅命中 `dist/assets/index-B3sH-ukW.js` 中上游模板字符串缩进及 Markdown hard-break 字面量的语义性尾随空格。该 bundle 保持构建原样，不做会破坏可复现 hash 的提交前格式化。
- KNOWN FAILURE：latest `npm run test:widget-runtime` 在 baseline-origin viewport recovery save-count 断言 `5 !== 4` 失败；本轮未修改 `App.tsx` 或该 fixture，已分派 `issue-widget-viewport-recovery-save-count`。
- KNOWN LEGACY DEBT：Agent Team validator 仍扫描到大量无需迁移的 legacy 根目录报告、旧模板与历史报告缺少新版 schema；本轮 report/roster/queue 文件未出现在 validator 错误中。

## 报告状态变更

- `issue-codex-react-185-sidebar-recovery`：version `4 → 5`，移动到 `resolved`，`verification_status: passed`。
- `issue-node-rich-text-editor`：version `4 → 5`，移动到 `resolved`，`verification_status: passed`。
- 新增两个 resolved solution report。
- 新增 `issue-widget-viewport-recovery-save-count`：assigned / failed / Test Supervisor Agent。
- `ROSTER.md` 与 `agent-reports/QUEUE.md` 已按 report → roster → queue 同步。

## 未解决 / 后续风险

- viewport recovery 多一次 document save 的自动化风险由独立 assigned issue 跟踪；不得宣称 latest Widget runtime 全绿。
- 行内代码中间拆段、inline atom、hard break、列表组合与移动端旧键盘事件没有专项浏览器用例。
- 不发布 Release、不更新 `stable`；发布门槛属于后续独立任务。

## Git 状态

- branch: `main`
- baseline HEAD: `5411b872ecf3c97b0bdb8a1807ec8b9fbba6b3a1`
- approved task-owned scope: 本报告 `related_files`、两份此前部分集成总结，以及旧/新 dist hash 的精确删除/新增
- excluded scope: 编号重复文件、Release、tag、`stable`、其他 active issue
- cached check exception: full check 非零仅来自生成的 `plugins/canvasight/dist/assets/index-B3sH-ukW.js` 内模板字符串与 Markdown hard-break 所需尾随空格；排除该生成 bundle 后 scoped cached check 为 0
- planned commit subject: `fix: 完成 0.4.36 原生验收修复`
- commit hash: 由最终交付消息记录，因为本报告与实现位于同一提交
- Release: 未发布
- `stable`: 未更新
