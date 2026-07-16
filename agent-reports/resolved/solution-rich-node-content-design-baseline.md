---
schema_version: 1
report_id: solution-rich-node-content-design-baseline
report_type: solution
status: resolved
owner: Design Standards Expert
created_by: Design Standards Expert
priority: high
version: 2
agent_id: /root/design_standards_expert
thread_id: null
created_at: 2026-07-16T06:03:57Z
updated_at: 2026-07-16T06:05:11Z
depends_on:
  - issue-rich-node-content-editor
  - solution-rich-node-content-design-review
related_files:
  - design.md
  - agent-reports/assigned/issue-rich-node-content-editor.md
  - agent-reports/resolved/solution-rich-node-content-design-review.md
verification_status: passed
verification_evidence:
  - Re-read issue-rich-node-content-editor immediately before this report write and confirmed owner Development Agent, status assigned, version 2; issue ownership and state were not changed.
  - Reconciled the approved Design Agent review with design.md Task Node Design, Interaction Patterns, Skill Composition, Accessibility, and Responsive Behavior sections.
  - Confirmed the attachment baseline now distinguishes anchored inline images from legacy or unanchored chips, and the Skill picker baseline now targets the active rich-content caret instead of a textarea caret.
  - Ran git diff --check for design.md with no whitespace errors.
  - Ran the required Agent Team validator; it reported pre-existing legacy report/schema debt and derived QUEUE.md mismatches, including the active issue queue row, but did not report this solution file as invalid. This role did not modify the issue, roster, or derived queue.
---

# 节点富内容设计基线同步

## 负责 Agent

Design Standards Expert

## 对应问题

`agent-reports/assigned/issue-rich-node-content-editor.md`

## Root Cause

现有 `design.md` 仍把全部附件定义为 compact chip，并把 `$` Skill picker 绑定到 active textarea caret；这两条规则与已确认的“图片按正文锚点内嵌”和“同一富内容 surface 所见即所得编辑”合同直接冲突。基线也缺少 selection-first、header drag/content nodrag、富内容状态和无障碍边界，无法约束实现与浏览器验收。

## 调研过程

- 先按 Agent Team 协议阅读 `AGENTS.md`、`ROSTER.md`、schema、assigned issue 和 Design Agent 已解决设计审查。
- 以 report 为权威确认 issue 仍由 Development Agent 唯一负责，状态 `assigned`、版本 `2`；本席位只维护设计基线，不接管 issue。
- 对照 `design.md` 的 Task Node Design、Interaction Patterns、Skill Composition、Accessibility 和 Responsive Behavior，定位附件 chip 与 textarea caret 两处明示冲突，并将 Design Agent 已批准的交互、状态和可访问性合同写入相应章节。

## 可选方案

- 方案 A：只替换两句冲突文本。改动最小，但无法为 selection-first、拖拽隔离、图片/代码/token/link 状态和浏览器验收提供稳定基线。
- 方案 B：修正两句冲突文本，并在现有 Task Node、Interaction、Skill、Accessibility 和 Responsive 章节内补齐已批准合同，不改产品信息架构和实现。采用此方案。

## 推荐方案

保持节点是紧凑工作对象、Run/连接/header/footer 结构和现有 token 体系不变，把正文定义为单一轻量 rich-content 阅读/编辑 surface。只为锚定图片、完整围栏代码、显式 `@plugin`/`$skill` 和安全 `http`/`https` URL 提供语义呈现；无法识别的内容无损回退文本，不扩展为完整 Markdown 或可信 HTML。

## 实施步骤

1. 在 Task Node Design 中修正 selection/editing、附件 chip 和 IME 合同。
2. 新增 Rich Node Content 基线，覆盖统一 surface、header drag/content nodrag、`nowheel`、自动高度与图片/代码/token/link 的状态和安全边界。
3. 将 `$` picker 从 textarea caret 改为 active rich-content caret，同时保留 Portal、尺寸、完整搜索、viewport clamp、IME、键盘与 ARIA 合同。
4. 在 Accessibility 和 Responsive Behavior 中补齐 focus 顺序、textbox 语义、媒体状态、200% zoom、窄 host 与长内容约束。

## 风险与回滚

实现若无法保留 caret、IME、undo 或无损回退，应停止富内容增强并继续以原 body/附件为真源，回退到纯文本与 legacy chip 阅读，而不是交付只读预览叠加隐藏输入的双重模型。`design.md` 只描述已批准的产品合同，不替实现选择具体编辑器框架。

## 处理结果

已完成设计基线同步。附件规则现明确为“有稳定正文锚点的图片只内嵌一次，非图片及 legacy/unanchored 图片保留 chip”；Skill picker 现锚定 active rich-content caret。selection-first、header drag/content nodrag、图片/代码/能力 token/安全链接的状态、主题、响应式和无障碍边界已纳入基线。

## 修改文件

- `design.md`
- `agent-reports/resolved/solution-rich-node-content-design-baseline.md`

## 验证方式

- 静态对照 Design Agent 的 `solution-rich-node-content-design-review`，确认其两项必须修正的冲突均已消除。
- 搜索 `design.md`，确认不再以 textarea caret 作为 Skill picker 合同，且附件 chip 规则明确区分 body anchor。
- 运行 `git diff --check -- design.md`，无空白错误。
- 已运行项目 Agent Team validator；全仓校验因大量 legacy report/schema 债务和派生 `QUEUE.md` 不一致而失败，但输出未把本 solution 报告列为无效。本席位按任务边界未修改 issue、ROSTER 或 QUEUE；实现与浏览器可见验收仍由 Development Agent、Test Supervisor Agent 和 Main Thread 完成。

## 后续风险

- 本报告是设计基线与静态验证证据，不是实现完成、浏览器可见或原生 Widget 验收证据。
- `contenteditable` 或其他编辑 surface 若在实际实现中破坏 caret、IME、undo、文本复制或节点拖拽，应按 issue 停止条件阻断交付。
- 未修改 issue、ROSTER、QUEUE、README、实现文件或发布版本；这些仍由各自 owner 与 Main Thread 按协议闭环。
