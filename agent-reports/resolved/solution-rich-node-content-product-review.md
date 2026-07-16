---
schema_version: 1
report_id: solution-rich-node-content-product-review
report_type: solution
status: resolved
owner: Product Agent
created_by: Product Agent
priority: high
version: 1
agent_id: /root/product_agent
thread_id: null
created_at: 2026-07-16T06:36:54Z
updated_at: 2026-07-16T06:36:54Z
depends_on:
  - issue-rich-node-content-editor
  - solution-rich-node-content-design-review
  - solution-rich-node-content-design-baseline
  - solution-rich-node-content-editor
  - solution-rich-node-content-test-plan
related_files:
  - plugins/canvasight/shared/types.ts
  - plugins/canvasight/src/App.tsx
  - plugins/canvasight/src/components/TaskNode.tsx
  - plugins/canvasight/src/components/RichNodeBody.tsx
  - plugins/canvasight/src/lib/richNodeContent.ts
  - plugins/canvasight/src/lib/skills.ts
  - plugins/canvasight/src/store/scatterStore.ts
  - plugins/canvasight/src/styles/app.css
  - plugins/canvasight/tests/rich-node-content-smoke.mjs
  - plugins/canvasight/tests/skills-smoke.mjs
  - plugins/canvasight/README.md
  - design.md
verification_status: passed
verification_evidence:
  - Re-read issue-rich-node-content-editor immediately before this report and confirmed owner Development Agent, status assigned, version 2; this product review does not change its owner, status, version, ROSTER.md, or QUEUE.md.
  - Reviewed the final rich-content implementation diff against the confirmed WYSIWYG, explicit image-anchor, fenced-code, capability-token, safe-link, fallback, and Run-compatibility contracts.
  - Confirmed only explicitly anchored images render inline, while legacy or unanchored images remain attachment chips; picker token replacement now shifts later image anchors instead of moving images semantically.
  - Confirmed image load failures retain the same body anchor and attachment and expose an in-place Retry in both read and edit surfaces through the existing asset loader.
  - Confirmed mention recognition requires an explicit at or dollar prefix followed by a Unicode letter or underscore, so ordinary prices such as dollar 100 remain text; unknown names retain neutral editable token semantics.
  - Confirmed complete fenced code blocks and only http or https URLs receive semantic presentation, while incomplete fences, unsafe protocols, arbitrary HTML, and unknown input remain editable text.
  - Confirmed body remains the Run and export text source, attachments remain the asset source, bodyImageAnchors is optional compatibility metadata, and the Markdown, export, MCP, and Run bridge modules are not replaced by the visual layer.
  - Ran npm run test:rich-content, npm run test:skills, and npm run typecheck successfully from plugins/canvasight after the final contract fixes.
---

# 节点富内容所见即所得产品验收

## 负责 Agent

Product Agent

## 对应问题

`agent-reports/assigned/issue-rich-node-content-editor.md`

## Root Cause

原节点正文把说明、代码、能力引用和链接都压在同一个纯文本视觉层级，图片又只能在独立附件区阅读。产品目标不是引入完整 Markdown 或第二份富文档真源，而是在保持现有任务节点、附件、Run 和导出合同的前提下，让用户在画布上直接读懂并编辑混合内容。

## 调研过程

- 按 Agent Team 协议读取当前 issue、设计审查、设计基线、开发方案、测试方案和最终实现 diff；issue 仍由 Development Agent 唯一负责，状态 `assigned`、版本 `2`。
- 逐项对照用户已确认边界：同一 surface 所见即所得、图片只在显式正文锚点内嵌、历史无锚点图片保留 chip、代码只认完整围栏、`@` / `$` 只认显式 token、安全 URL 自动识别、原 `body + attachments` 合同不变。
- 在最终审查中发现并推动补齐三项会影响产品结果的边界：图片错误原位重试、Skill picker 替换文本时同步后续图片锚点、普通价格 `$100` 不伪装成 Skill。
- 静态确认富内容层不执行 HTML，链接只开放 `http` / `https`，图片读取继续复用既有资产 loader，Run 与 Markdown 仍从原始 `body` 和附件记录构建。

## 可选方案

- 方案 A：把 HTML 或完整结构化文档升级为新真源。会扩大数据迁移、并发合并、Run 序列化和回滚风险，超出 MVP。
- 方案 B：保留 `body` 与附件为真源，只增加可选图片锚点，并从正文派生代码、token 和链接的语义呈现。符合已确认边界。
- 方案 C：只读富预览叠加隐藏文本输入。无法满足同一 surface 所见即所得，也会形成阅读与编辑两套状态。

## 推荐方案

采用并保留方案 B。产品层不增加新的内容模式或完整 Markdown 承诺；用户仍在原任务节点中工作，只获得更清晰、可逆的轻量富内容体验。

## 契约验收

| 已确认契约 | 最终产品判断 |
| --- | --- |
| 同一 surface 所见即所得 | 通过：读态和编辑态使用同一轻量富内容正文区域，不增加独立预览。 |
| 图片显式锚定内嵌 | 通过：新图片以附件 ID 和正文偏移记录；只有显式锚点图片内嵌，legacy/unanchored 图片仍是 chip。 |
| 显式围栏代码 | 通过：完整围栏显示独立代码块，未闭合围栏原样回退文本。 |
| 显式 `@plugin` / `$skill` | 通过：中英文名称可扫描、未知名称不带验证语义、Run 保留原 token；`$100` 不误识别。 |
| 自动安全链接 | 通过：仅 `http` / `https` 自动链接，尾随标点剥离，其他协议保持文本。 |
| 数据、附件与 Run 兼容 | 通过：`body`、附件和既有 Markdown/Run 路径仍是真源，可选锚点可被旧数据安全忽略。 |

## 实施边界

本轮应交付节点正文的轻量富内容阅读和编辑、图片锚点、聚焦 parser/Skill 测试、设计基线和双语说明。它不应扩展为完整 Markdown、任意 HTML、语法高亮、能力安装验证、新的 Page/边模型、Run 模式变更或发布流程变更。

## 风险与回滚

- 产品风险主要来自真实浏览器中的 caret、IME、undo/redo、链接与拖拽竞争、图片失败恢复和刷新后锚点顺序；这些必须由 Test Supervisor 的浏览器证据决定最终工程放行，不能用本产品静态审查替代。
- 如果浏览器验收出现正文或锚点丢失，应停止交付并回退到原 `body + attachments` 读取路径；不得通过静默迁移历史数据来修复。
- 本轮未改 widget/MCP/session/Run bridge 合同。是否触发原生 Widget 门槛仍按 Test Supervisor 的影响判断执行；产品报告不冒充原生宿主证据。

## 处理结果

最终产品范围验收通过。实现已经覆盖用户确认的六项核心合同，并补齐图片错误重试、Skill 插入后的图片锚点稳定和普通价格误识别三项边界。没有发现需要扩展产品范围、改变 Run 语义或引入数据迁移的理由。

此结论是产品契约放行，不替代 Test Supervisor 的真实浏览器、无障碍、保存刷新、Run/导出和并发回归证据；父 issue 仍应在这些工程门禁通过后由其唯一 owner 关闭。

## 修改文件

- `agent-reports/resolved/solution-rich-node-content-product-review.md`

## 验证方式

- 最终实现 diff 与 `design.md`、设计审查、开发方案和测试方案逐项静态对照。
- `npm run test:rich-content`：通过，覆盖正文逐字节往返、围栏、token、链接、显式/legacy 图片锚点、picker 替换后锚点偏移和不安全协议回退。
- `npm run test:skills`：通过，覆盖 `$` 查询、价格边界、选择器插入、完整目录与 placement。
- `npm run typecheck`：通过。

## 后续风险

- 浏览器交互、无障碍、截图、保存刷新和最终 Git 闭环不属于本 Product Agent 报告的验证证据，由 Test Supervisor Agent 与 Main Thread 继续闭环。
- 本报告未修改实现、父 issue、`ROSTER.md` 或 `agent-reports/QUEUE.md`。
