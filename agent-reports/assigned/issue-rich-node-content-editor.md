---
schema_version: 1
report_id: issue-rich-node-content-editor
report_type: issue
status: assigned
owner: Development Agent
created_by: Main Thread
priority: high
version: 8
agent_id: /root/development_agent
thread_id: null
created_at: 2026-07-16T05:52:02Z
updated_at: 2026-07-16T08:01:47Z
depends_on: []
related_files:
  - plugins/canvasight/shared/types.ts
  - plugins/canvasight/src/App.tsx
  - plugins/canvasight/src/components/RichNodeBody.tsx
  - plugins/canvasight/src/components/TaskNode.tsx
  - plugins/canvasight/src/lib/richNodeContent.ts
  - plugins/canvasight/src/store/scatterStore.ts
  - plugins/canvasight/src/styles/app.css
  - plugins/canvasight/tests/rich-node-content-smoke.mjs
  - plugins/canvasight/.codex-plugin/plugin.json
  - plugins/canvasight/package.json
  - plugins/canvasight/package-lock.json
  - plugins/canvasight/mcp/server.source.mjs
  - plugins/canvasight/mcp/server.mjs
  - plugins/canvasight/README.md
  - design.md
verification_status: failed
verification_evidence:
  - Canvasight Run supplied the confirmed scope, content grammar, editor model, acceptance paths, and rollback boundary.
  - Baseline is main at bfc95f3019f1847be94f850acca0bbfd81e4d670 with a pre-existing unstaged AGENTS.md change that is outside this issue.
  - Current-thread fixed seats were rebuilt as /root/design_agent, /root/development_agent, and /root/test_supervisor_agent; runtime thread ids are unavailable and remain null.
  - Implementation, product, design, design-baseline, test, documentation, and development-standards solution reports are resolved and linked through issue-rich-node-content-editor.
  - test:rich-content, typecheck, build, test:markdown, test:markdown-export, test:skills, test:concurrency, test:widget-runtime, check:mcp-bundle, and git diff --check passed on the frozen implementation.
  - Final browser-visible verification passed for the rich-content reading and editing workflow after the browser-driven contract fixes.
  - Native accepted-instance verification did not pass; session session-mrn512s3-3321625f and attempt open-mrn512s3-78d91ca80744 timed out with verified=false and stage=starting.
  - The user screenshot at 15:00:33 proves a native fullscreen instance became ready, but lifecycle evidence binds that instance to pluginRoot /Users/niallyoung/.codex/plugins/cache/canvasight-local/canvasight/0.4.21 rather than the repository candidate.
  - The active installed 0.4.21 cache references dist/assets/index-D6XIKfJR.js and contains neither rich-node-mention nor bodyImageAnchors, while the repository candidate references index-BjZxRkgc.js and contains the rich-content implementation; the stale installed snapshot is the direct cause of the feature not appearing.
  - Main Thread successfully installed canvasight@canvasight-local 0.4.22; codex plugin list resolves 0.4.22, repo/cache JS SHA-256 is 90abd9c6f8108b34a07c64d78bf5c22e45baceef287fc85ca2d68a423cc1762e, and the cache bundle contains the required rich-content markers.
  - User confirmation expanded the explicit fence contract to accept three ASCII or three full-width backticks without normalizing the original body; solution-rich-node-content-fullwidth-fence records the implementation and review.
  - Full-width, cross-style, internally mixed, unclosed, ASCII regression, and byte-preserving round-trip tests passed; Playwright proved the third full-width closing character immediately renders a code block.
  - The complete 0.4.23 snapshot passed build, release, distribution, Run/export/state regressions and installed successfully; exact-version native-host acceptance still requires a Codex Desktop restart.
  - The stale installed snapshot root cause is resolved, but lifecycle contains zero 0.4.22 ready records; a full Codex Desktop restart followed by exact-version native accepted-instance verification is the only remaining blocker.
  - The user explicitly authorized a three-commit split after the earlier no-commit exception; Project Management selectively committed the rich editor, 0.4.22 snapshot, and 0.4.23 full-width compatibility without staging unrelated artifacts.
solution_report: agent-reports/resolved/solution-rich-node-content-editor.md
---

# 节点富内容所见即所得

## TL;DR

Canvasight 节点正文仍由纯 `textarea` 承载，代码、链接和能力引用与正文混排，图片只能作为附件 chip 阅读；需要在不改变 Run 文本语义的前提下交付轻量所见即所得编辑体验。

## 发现者

User

## 提交 Agent

Main Thread

## 建议交接 Agent

Development Agent

## 问题描述

按用户已确认的产品边界实现节点富内容编辑：图片作为附件资产并在光标位置内嵌；代码通过显式围栏识别；`@plugin` 与 `$skill` 通过显式前缀识别；`http/https` 链接自动识别；编辑过程使用所见即所得 surface，而不是只读渲染加纯文本编辑切换。

## 现象

- `TaskNode.tsx` 使用 `textarea` 同时承担编辑与阅读，所有正文内容使用同一种视觉层级。
- 图片附件在独立 `attachment-grid` 中显示为 chip，无法保留正文插入位置。
- 代码围栏、`@plugin`、`$skill` 和 URL 没有节点内语义样式。

## 复现方式

1. 在节点正文输入普通说明、围栏代码、`@plugin`、`$skill` 和 URL。
2. 粘贴或上传图片附件。
3. 观察代码与正文混排、能力引用和链接无语义样式、图片仅出现在附件 chip 区域。

## 影响范围

节点内容模型与序列化、TaskNode 编辑交互、图片附件锚点、Skill picker、IME、XYFlow 拖拽与自动高度、Run/Markdown/导出兼容、设计基线、双语用户文档和浏览器/原生 Widget 验收。

## 证据

- 当前 `TaskNode.tsx` 渲染 `textarea.task-body`，附件通过 `TaskAttachmentChip` 和 `.attachment-grid` 单独展示。
- 既有 `buildMarkdown`、附件代理和 `$skill` picker 合同必须保留。
- 画布上下文已明确验收：图片位置稳定、代码与正文可区分、标签可扫描、链接可安全激活、编辑与重载不丢内容。

## 初步归因

现有节点模型以单一 `body: string` 加附件列表为真源，缺少可逆的结构化内容解析/序列化层，也没有能同时满足富内容显示、光标编辑、IME 与画布拖拽隔离的编辑 surface。

## 交付给哪个 Agent

Development Agent 为唯一 issue owner；Design Agent 审查交互和视觉，Test Supervisor Agent 独立定义并执行验证，Main Thread 负责集成与冲突处理。

## 需要回答的问题

- 怎样以最小、可逆的数据合同记录图片光标锚点，同时保持旧 `body` 与附件无损可读？
- 怎样实现轻量所见即所得 surface，并保留 IME、粘贴、撤销/重做、Skill picker、拖拽和自动保存？
- 怎样确保视觉组件不会改变 Run、Markdown/ZIP 导出和并发保存的下游语义？

## 相关文件

- `plugins/canvasight/src/components/TaskNode.tsx`
- `plugins/canvasight/src/styles/app.css`
- `plugins/canvasight/src/lib/markdown.ts`
- `plugins/canvasight/src/store/scatterStore.ts`
- `plugins/canvasight/shared/types.ts`
- `plugins/canvasight/tests/`
- `design.md`
- `plugins/canvasight/README.md`

## 期望结果

用户能在节点正文中直接看到并编辑内嵌图片、围栏代码块、`@plugin`、`$skill` 标签和安全链接；历史节点可无损读取，解析失败回退纯文本，Run/导出/持久化语义保持不变。

## Closure Criteria

- [x] 富内容解析与序列化是独立、可测试、可逆的逻辑
- [x] 图片附件可在光标位置内嵌，保存与重载后位置稳定
- [x] 围栏代码、`@plugin`、`$skill` 和自动 URL 具有明确且安全的语义样式
- [x] 编辑 surface 保留 IME、Skill picker、粘贴、撤销/重做、节点拖拽和自动保存
- [x] 历史 `body`、Run、Markdown/ZIP 导出与并发保存无回归
- [x] `design.md`、README 决策和 Agent Team 报告已完成；PM 已按用户授权完成三个定向提交
- [ ] `0.4.23` 已安装；尚需完整重启 Codex Desktop，并在精确 `0.4.23` accepted instance 内完成富内容、图片、同 task Run 与 late-metadata 验收

## 当前状态

assigned。实现、自动化、构建、产品/设计/文档审查和最终浏览器可见验证已通过；中文输入法产生的全角三反引号现已作为正式围栏输入支持，且不会改写原始正文。完整 `0.4.23` 已成功安装，但运行中的 Codex Desktop 不会热刷新插件注册表，因此完整重启并在精确 `0.4.23` accepted instance 内完成原生验收仍是唯一 blocker；此前 issue 不得转为 resolved。

## 处理结果

已实现轻量所见即所得节点正文。`body` 继续是 Run、Markdown 和导出的文本真源；图片使用可选 `bodyImageAnchors` 记录附件在正文中的稳定位置；完整围栏代码、显式 `@plugin` / `$skill` 和安全 `http` / `https` URL 由可逆解析层提供语义呈现。Legacy 或未锚定图片继续保留附件 chip，图片加载失败保留锚点并提供原位重试，Skill picker 插入会同步移动后续图片锚点。

自动化、构建、浏览器可见流程以及产品、设计、设计基线、测试、双语 README 和工程规范审查均已完成。真实 native Widget accepted-instance 验收在 session `session-mrn512s3-3321625f`、attempt `open-mrn512s3-78d91ca80744` 上超时，结果为 `verified=false`、`stage=starting`；这不能由 browser/dev 或 composed widget smoke 替代。

用户随后提供的 15:00:33 截图显示一个 native fullscreen 实例已进入 ready，但 lifecycle 的 `pluginRoot` 明确是 `/Users/niallyoung/.codex/plugins/cache/canvasight-local/canvasight/0.4.21`。该缓存的 `dist/index.html` 仍引用旧 `index-D6XIKfJR.js`，且 bundle 中没有 `rich-node-mention` / `bodyImageAnchors`；仓库候选则引用 `index-BjZxRkgc.js` 并包含富内容实现。因此当前“没有触发”的直接根因是 Codex Desktop 仍在运行旧安装快照，而不是富内容语法没有命中。

Main Thread 随后执行 `codex plugin add canvasight@canvasight-local --json` 并成功安装完整 `0.4.22` snapshot。`codex plugin list` 已解析为 `0.4.22`；repo 与 cache 的主 JS SHA-256 均为 `90abd9c6f8108b34a07c64d78bf5c22e45baceef287fc85ca2d68a423cc1762e`，且 cache bundle 包含 `data-rich-body-read`、`data-rich-body-editor`、`rich-node-mention` 与 `bodyImageAnchors`。安装快照问题已经解决，但运行中的 Desktop 尚未刷新 app-level registry，lifecycle 中 `0.4.22` ready 记录数仍为 0。

用户进一步确认中文输入法也应直接触发代码围栏。解析器已扩展为识别三个 ASCII 反引号或三个全角反引号；每条围栏行内部必须同形，但开启与关闭行允许跨样式。内部混排和未闭合输入仍无损回退纯文本，`raw`、保存、Run 与导出均不做字符归一化。聚焦测试与真实 contenteditable 输入验证通过，完整插件快照升级并安装为 `0.4.23`。

Project Management Agent 在用户明确授权后重新冻结范围，完成三个定向提交：节点富内容主体、0.4.22 真实版本快照、以及 0.4.23 中英文围栏兼容。每次提交前均检查 cached name/stat/check；`output/`、`.playwright-cli/` 和 `AGENTS.md` 无关用户 hunk 保持未暂存。

## 修改文件

- `plugins/canvasight/shared/types.ts`
- `plugins/canvasight/src/App.tsx`
- `plugins/canvasight/src/components/RichNodeBody.tsx`
- `plugins/canvasight/src/components/TaskNode.tsx`
- `plugins/canvasight/src/lib/richNodeContent.ts`
- `plugins/canvasight/src/store/scatterStore.ts`
- `plugins/canvasight/src/styles/app.css`
- `plugins/canvasight/tests/rich-node-content-smoke.mjs`
- `plugins/canvasight/tests/skills-smoke.mjs`
- `plugins/canvasight/package.json`
- `plugins/canvasight/.codex-plugin/plugin.json`
- `plugins/canvasight/package-lock.json`
- `plugins/canvasight/mcp/server.source.mjs` 与生成的 `plugins/canvasight/mcp/server.mjs`
- `plugins/canvasight/dist/index.html` 与对应新构建 CSS/JS assets
- `plugins/canvasight/README.md`
- `design.md`
- 本 issue 对应的 product、design、design-baseline、development、test、docs 与 development-standards solution reports

## 验证方式

- `npm run test:rich-content`：通过。
- `npm run typecheck`：通过。
- `npm run build`：通过。
- `npm run test:markdown`、`npm run test:markdown-export`、`npm run test:skills`、`npm run test:concurrency`：通过。
- `npm run test:widget-runtime`、`npm run check:mcp-bundle`：通过；仅为 supporting checks。
- 最终浏览器可见验收：通过，覆盖修复后的 selection-first、围栏代码、安全链接、legacy 图片和编辑/阅读 DOM 隔离合同。
- `git diff --check`：通过。
- Native Widget：失败/未验证。`sessionId=session-mrn512s3-3321625f`，`openAttemptId=open-mrn512s3-78d91ca80744`，`verified=false`，`stage=starting`，accepted-instance 等待超时。
- 新 native 截图：实例可见，但 lifecycle 绑定旧缓存 `canvasight/0.4.21`；不能作为仓库富内容候选的 accepted-instance 证据。
- `0.4.22` post-install：`codex plugin list`、cache manifest/资产、repo/cache SHA 与富内容 marker 全部通过；详见 `solution-rich-node-content-0-4-22-verification-plan` v2。
- `0.4.22` Native Widget：尚未运行。当前 lifecycle ready count 为 0，必须在 Desktop 完整重启后补齐。
- `0.4.23` 全角围栏：解析、序列化、浏览器即时渲染、构建、Run/导出/并发/widget supporting smoke、release verify 与 clean distribution 均通过；详见 `solution-rich-node-content-fullwidth-fence`。
- `0.4.23` 已安装；Native Widget 尚未由重启后的 Desktop 加载，精确版本 accepted-instance 仍未验证。
- Git：PM 已完成用户授权的三提交拆分；前两个提交为 `c383384ace5f741a27e8d513006f4202d51412e9` 与 `74826dc38f147aed973c3ae0d488aae116bbe3df`，第三个提交的最终 hash 由交付消息记录。

## 后续风险

- `0.4.22` 安装/cache 一致性已不再是 blocker；唯一 blocker 是运行中的 Codex Desktop 尚未完整重启，因而没有任何绑定精确 `0.4.22` 的 ready record。
- 重启后仍需在新建并标记的 task 中取得 instance-bound fullscreen ready、可见非零画布、富内容交互、内嵌图片代理、同 task Run 与 late metadata 稳定证据；在此之前不得宣称 native 已验证或关闭本 issue。
- 本轮 Git 已按用户明确授权完成三提交闭环。若后续原生验收产生新改动，Main Thread 仍需重新冻结范围，再由 Project Management Agent 执行定向暂存与提交。
- 全仓 Agent Team validator 仍被既有 legacy report/template schema 债务和 QUEUE 漂移阻断；Main Thread 需在 integration summary 中如实记录，不能归因于本实现，也不能借此重写历史报告。
- `AGENTS.md` Current Commands 暂未登记 `test:rich-content`，且已存在 `test:markdown-export` 索引遗漏；Development Standards Lead 判定 durable 规则无需变化，该命令索引差异为非阻断残余项。
- 当前 `TaskNode.tsx` 仍被多个历史 assigned issue 引用；本 issue 不接管它们的 owner/status，也不得用本轮结论替代其原生验收合同。
