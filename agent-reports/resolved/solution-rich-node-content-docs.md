---
schema_version: 1
report_id: solution-rich-node-content-docs
report_type: solution
status: resolved
owner: Customer Support Agent
created_by: Customer Support Agent
priority: high
version: 2
agent_id: /root/customer_support_agent
thread_id: null
created_at: 2026-07-16T06:06:21Z
updated_at: 2026-07-16T06:07:41Z
depends_on:
  - issue-rich-node-content-editor
related_files:
  - plugins/canvasight/README.md
  - agent-reports/resolved/solution-rich-node-content-docs.md
verification_status: passed
verification_evidence:
  - Re-read the parent issue immediately before this report at owner Development Agent, status assigned, version 2; this documentation solution does not change its owner, state, or version.
  - Checked AGENTS.md, ROSTER.md, the Agent Team schema and report protocol, design.md, the rich-content design review, package.json, generated MCP tool registrations, and every plugins/canvasight/skills/*/SKILL.md before documenting behavior.
  - Confirmed every npm command documented in the plugin README exists in package.json and kept development commands out of the normal user workflow.
  - Confirmed the README contains Chinese and English sections for purpose, features, basic usage, rich content, installation, tools and Skills, data storage, development commands, and FAQ; git diff --check passed for the README.
  - Ran the required full Agent Team validator; it is globally blocked by pre-existing legacy top-level reports, old templates, and QUEUE/report drift outside this documentation scope. The validator did not identify this solution report as invalid.
---

# 节点富内容双语用户文档

## 负责 Agent

Customer Support Agent

## 对应问题

`agent-reports/assigned/issue-rich-node-content-editor.md`（写报告前重读为 `Development Agent / assigned / version 2`；本报告不改变该 issue 的 owner、status 或 version。）

## Root Cause

节点正文从纯文本视觉升级为轻量所见即所得后，用户需要知道怎样触发内嵌图片、围栏代码、`@plugin` / `$skill` 标签和安全链接，以及哪些 Markdown/HTML 能力不在首版范围内。插件目录此前没有随插件快照分发的 `README.md`，无法在该交付路径中解释新行为、兼容边界和排障方式。

## 调研过程

- 按 Customer Support Agent 的前置检查要求核对 `AGENTS.md`、`design.md`、`plugins/canvasight/package.json`、生成后的 `plugins/canvasight/mcp/server.mjs` tool 注册与全部 `plugins/canvasight/skills/*/SKILL.md`。
- 对照 `solution-rich-node-content-design-review` 和当前实现，确认 selection-first 编辑、光标锚定图片、完整围栏代码、显式 capability token、仅 `http` / `https` 自动链接，以及 Run/导出保持原正文合同。
- 确认现有仓库根 `README.md` 已有中英文切换结构，但本次授权路径仅为 `plugins/canvasight/README.md`；因此没有修改根 README，也没有建立与实现不符的发布说明。
- 从 `package.json` 逐项核对 README 中出现的 `npm run` 命令，并把这些命令集中在明确标注为“仅本地开发”的章节。

## 可选方案

- 方案 A：不更新文档。会让用户无法从插件随包文档判断富内容的输入语法、回退规则和 Run 兼容边界，不符合用户可见功能的同轮文档要求。
- 方案 B：只更新仓库根 README。该路径不在本次 Customer Support Agent 的授权范围内，也不会补齐 issue 已声明的插件内文档交付物。
- 方案 C：新增插件目录双语 README，集中说明正常用户流程、富内容语法、边界、安装、开发命令和 FAQ。

## 推荐方案

采用方案 C。富内容编辑是直接影响节点阅读、编辑和附件使用方式的用户可见能力，需要在同一交付中提供双语用法与非目标说明。插件目录 README 也能随完整插件快照一起交付，而不要求用户阅读开发 checkout 根文档。

## 实施步骤

1. 新增 `plugins/canvasight/README.md`，保留 `中文 / English` 双语跳转结构。
2. 在两种语言中同步说明 Canvasight 用途、主要功能、基础使用、插件安装、MCP tools、Skills、数据位置、开发命令和常见问题。
3. 增加“节点富内容 / Rich Node Content”章节，分别说明图片、围栏代码、`@plugin` / `$skill`、安全链接和首版非目标。
4. 明确富内容只改变视觉与编辑表现，Run、导出、附件和下游节点合同继续使用原始语义数据。
5. 静态核对标题结构、开发命令与 Markdown whitespace。

## 风险与回滚

- 当前实现和浏览器验收尚由 Development Agent 与 Test Supervisor Agent 负责；若实现范围在集成前收缩，Main Thread 必须同步收缩 README 对应描述，不能保留超出实际行为的用户承诺。
- 仓库根 README 与插件目录 README 现在是两份文档入口，未来需要由 Customer Support Agent 在用户可见功能变更时同步审查，避免长期漂移。
- 若项目最终决定只保留一个权威 README，可在单独文档迁移中合并内容并调整插件打包路径；本轮回滚只需移除新增插件 README，不影响实现和数据。

## 处理结果

已完成：确认该用户可见功能需要双语 README，并新增插件随包文档，覆盖富内容使用方式、安全与兼容边界、正常工作流和排障。没有修改实现、`design.md`、父 issue、`ROSTER.md`、`QUEUE.md`、根 README 或 Git 状态。

## 修改文件

- `plugins/canvasight/README.md`
- `agent-reports/resolved/solution-rich-node-content-docs.md`

## 验证方式

- `rg` 检查中文与 English 的主要功能、基础用法、富内容、插件安装、开发命令和 FAQ 标题均存在。
- `rg -o "npm run ..."` 与 `plugins/canvasight/package.json` scripts 静态核对，文档中的命令均有对应 script。
- `git diff --check -- plugins/canvasight/README.md`：通过。
- `node plugins/canvasight/skills/canvasight-agent-team/scripts/validate-agent-team.mjs --root /Users/niallyoung/Desktop/Canvasight`：已运行；全仓校验被既有 legacy 顶层报告、旧模板和 QUEUE/report 漂移阻断，输出未将本 solution report 列为无效。本报告未改变 issue、ROSTER 或派生 QUEUE 状态。

## 后续风险

- 文档不构成富内容浏览器交互、无障碍、Run/导出回归或 native Widget 验收证据；这些仍由父 issue 的 Development Agent 和 Test Supervisor Agent 完成。
- 当前 design.md 的 Skill picker 段落仍有 `textarea caret` 旧表述，Design Standards Expert 需在本轮设计基线交付中完成一致性校准；本报告没有改写设计权威文件。
- 全仓 Agent Team validator 的既有 legacy 报告、模板与 QUEUE 漂移需要单独治理；本轮 Customer Support Agent 未获授权重写这些历史记录。
