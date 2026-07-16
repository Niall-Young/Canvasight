---
schema_version: 1
report_id: solution-rich-node-content-design-review
report_type: solution
status: resolved
owner: Design Agent
created_by: Design Agent
priority: high
version: 1
agent_id: /root/design_agent
thread_id: null
created_at: 2026-07-16T05:56:26Z
updated_at: 2026-07-16T05:56:26Z
depends_on:
  - issue-rich-node-content-editor
related_files:
  - design.md
  - plugins/canvasight/src/components/TaskNode.tsx
  - plugins/canvasight/src/components/ui/upload-chip.tsx
  - plugins/canvasight/src/styles/app.css
verification_status: passed
verification_evidence:
  - Reviewed the assigned issue at owner Development Agent, status assigned, version 2 without changing its ownership or state.
  - Reviewed the current TaskNode selection-first editing, IME deferral, textarea autosizing, Skill picker Portal, attachment chip, XYFlow drag, and node state CSS behavior.
  - Compared the confirmed rich-content behavior against design.md Task Node Design, Interaction Patterns, Accessibility, Responsive Behavior, and Skill Composition contracts.
---

# 节点富内容所见即所得设计审查

## 负责 Agent

Design Agent

## 对应问题

`agent-reports/assigned/issue-rich-node-content-editor.md`

## 设计结论

方案可以沿用 Canvasight 现有 400px 紧凑任务节点、头部动作、选中边框、主题 token 和 `$` 选择器语言，不需要把节点改成文档卡片或完整 Markdown 编辑器。正文应成为一个统一的轻量所见即所得 surface：同一位置同时承担阅读和编辑，普通文本仍是主层级，只有图片、显式围栏代码、显式 `@`/`$` token 与安全 URL 获得语义组件。

现有基线有两处局部冲突，Design Standards Expert 应在实现同步到 `design.md` 时明确修正：

1. `Task Node Design` 目前规定附件均以 compact chip 呈现。新契约应改为：非图片附件和没有正文锚点的历史图片仍使用 chip；已有锚点的图片只在正文内嵌呈现，不在附件网格重复展示。
2. `Skill Composition` 目前把 `$` picker 明确写成“anchored to the active textarea caret”和“不替换 ordinary textarea editing”。新契约应把宿主改为 active rich-content caret，并保留 Portal、约 288px 宽、四至五行、完整搜索、IME、键盘和 viewport clamp 等其余合同。

除上述两处外，方案与现有“节点是紧凑工作对象”“状态可辨”“不让输入与拖拽冲突”“使用统一 token”“小屏保留核心编辑”的基线无冲突。

## 节点层级与布局契约

- 保持 `.task-node` 400px 固定画布尺寸、现有 header/card/footer 层级和标题、Run、更多、连接、附件入口位置；富内容不能扩宽节点或挤动头部动作。
- 正文 surface 取代 `textarea.task-body` 的视觉职责，但不增加第二块“预览区”。阅读和编辑使用同一 DOM 区域，切换状态时内容、图片位置和节点宽度不跳变。
- 正文内部层级固定为：普通段落为基线；代码块和图片为块级内容；`@plugin`、`$skill` 和链接为行内内容。解析失败、未闭合围栏、未知 token、非安全 URL 都按普通可编辑文本显示。
- surface、段落、代码、图片都必须 `min-width: 0; max-width: 100%`。普通文本自然换行；代码长行仅在代码块内部横向滚动，不能撑宽节点；图片不能超过正文宽度。
- 保留现有节点自动高度和 XYFlow internals 更新，不因 hover、加载、错误或操作按钮出现改变占位。图片优先使用已知尺寸比；未知尺寸用稳定的 16:9 加载槽，完成后限制 `max-height: 240px`、`object-fit: contain`，避免大图把节点变成海报。

## 编辑、选择与拖拽契约

- 保留现有 selection-first 规则：第一次点击选中节点；已选中节点再次点击正文进入编辑。选中不等于编辑，多选中的节点不得显示文本光标。
- 标题栏空白、节点外框和非交互 chrome 继续是拖拽入口；整个富内容 surface 以及代码、图片、链接、token 和其操作按钮使用 `nodrag`。代码横向滚动区与需要内部滚动的浮层使用 `nowheel`，滚动不能触发画布缩放。
- 阅读态正文允许文本选择和复制，不再把正文作为主要拖拽手柄。这样代码复制、链接激活和图片操作不会与节点移动竞争；节点仍可通过头部和外框稳定拖动。
- 编辑态使用原生文本输入语义，保留 `role="textbox"`、`aria-multiline="true"` 和节点正文 accessible name。输入、粘贴、撤销/重做、光标移动、选区和删除必须直接作用于同一 surface。
- IME composition 期间不得重新解析、替换 DOM、提交 store 或移动光标；composition end 后再同步一次解析和高度。自动识别不能让浏览器原生 undo 栈失效。
- 失焦提交沿用当前行为，但焦点进入 Skill picker、图片按钮、链接或正文内其他受控元素时不能被误判为离开节点。`Escape` 退出编辑时保留已输入内容并执行现有提交合同。

## 内容组件语言

### 内嵌图片

- 使用文章插图式 `<figure>`，图片本体占正文宽度，背景使用 `--color-background-sunken`，边框使用 `--color-border-divider`，圆角使用现有 `--radius-md`；不要复用小型 `UploadChip` 缩略图作为正文插图。
- 使用原文件名作为可读 caption 和默认 alt；caption 为 12px/subtlest 层级并允许省略，完整文件名通过 hover/focus 提示可达。
- 加载态保留固定槽位，使用中性 skeleton 与 polite status；错误态在同一槽位显示 warning、文件名、重试和移除，不显示破图图标，也不伪装成真实缩略图。
- 移除按钮在编辑态持续可见，在 hover/focus-within 时增强；按钮以 overlay 放置，不占用新行，不引发布局变化。移除必须同时处理锚点与对应资产，并提供现有 undo 或等价安全恢复路径。
- 已锚定图片不得再出现在 `.attachment-grid`；历史图片或未锚定图片保留 chip，避免旧数据静默消失。

### 显式围栏代码块

- 完整围栏解析为独立 `<pre><code>` 块；背景使用 `--color-background-sunken`，一圈 divider border、`--radius-md`、12px 左右内边距，字体使用系统等宽栈，正文建议 13px/20px。
- 可选语言标识放在代码块顶部的 12px/subtlest 标签中，不增加复制按钮或语法高亮；MVP 的目标是分层可读，不是 IDE。
- 编辑时仍在同一代码块内直接修改原始代码。围栏装饰不进入选择与复制结果；未闭合围栏保持普通文本，不能半转换成不可编辑组件。
- 保留空格和换行；长行 `overflow-x: auto; white-space: pre`，滚动条只属于代码块，不能扩宽节点或缩小邻近内容。

### `@plugin` 与 `$skill`

- 两者使用同一种 Codex 风格紧凑 inline token：保留可见前缀，1px divider border、`--radius-sm`、primary-subtle 或中性 raised 背景，文本与正文基线对齐，行间允许自然换行。
- token 是可编辑文本，不是按钮、验证徽章或导航。不要添加 check、品牌图标、成功色或“已安装”暗示；未知名称与已知名称保持同一基础视觉，避免伪装成已验证能力。
- 光标以可预测的文本边界进入、选择和删除 token；键盘删除不得留下不可见字符。`$` picker 仍由 `$` 查询触发并锚定当前 rich-content caret，列表视觉与现有 picker 不变。

### 安全链接

- 仅 `http`/`https` 自动成为 `<a>`；使用 `--color-text-link`、持续可见下划线和明确的 hover/focus 状态，不能只靠颜色表达链接。
- 阅读态在 pointer movement 未超过 4px 时才允许 click 激活，使用新窗口并设置 `noopener noreferrer`；拖动节点或选择文本后不得打开。
- 编辑态单击用于放置光标和修改完整地址，不立即导航；Tab 可聚焦链接，Enter 或显式的无布局位移“打开链接”动作可激活，保证键盘可达。
- 尾随中英文标点和不匹配括号不进入 URL。无效协议保留原文，不能生成可点击元素或执行 HTML。

## 状态矩阵

| 状态 | 节点/正文表现 | 交互与无障碍 |
| --- | --- | --- |
| 默认阅读 | 语义内容可直接扫描；footer 仍收起 | 正文可选择复制；header/外框可拖拽；链接可聚焦 |
| Hover | 沿用 node hover shadow；仅增强当前媒体/链接动作 | 不改变边框厚度、尺寸或内容位置 |
| Selected | 沿用 `.task-node.is-selected .task-node-card` focus border | 只表明对象选中，不自动出现 caret |
| Editing | 正文 surface 使用轻微 input/surface 对比和内侧 focus ring；footer 可用 | 显示 caret，`aria-multiline`，IME/undo/paste 保持原生行为 |
| Focus | 当前链接、图片按钮、重试和正文 surface 有 `:focus-visible` ring | 不以 hover 作为唯一入口；focus 顺序跟正文顺序一致 |
| Image loading | 固定比例中性占位，不闪动节点高度 | polite status，不抢焦点 |
| Image error | 原槽位显示 warning、文件名、重试/移除 | persistent、可键盘操作，不清空锚点或正文 |
| Parse fallback | 原始文本原样显示 | 可继续编辑，不出现错误组件或丢字符 |
| Save failure | 内容保持当前状态，使用已有持久错误反馈与重试 | 不清空、不回滚到旧 body；没有真实保存状态时不得伪造状态 |

所有状态必须同时适配 light/dark tokens，颜色之外至少保留边框、下划线、图标、文本或结构差异。

## 窄视口、长内容与键盘合同

- 画布节点保持 400px 坐标宽度，不随 host 宽度缩成不可编辑卡片。窄 host 通过画布平移/缩放保持节点可达；节点内部的 header 图标和连接 affordance 不换行、不被正文挤出。
- 图片 `width: 100%`，代码块独立横向滚动，token/链接可换行；任何内容都不能产生整页横向 overflow。
- 长正文继续使用现有自动高度并更新 node internals；本轮不加入会吞掉键盘焦点的嵌套纵向滚动容器。若未来需要最大高度，应单独设计带 `tabIndex`、焦点和 `nowheel` 的可访问滚动区域。
- Tab 顺序为正文中的链接/媒体动作，再到 footer 控件；连接 handle 与隐藏 footer 控件在不可见状态不得进入 Tab 顺序。Enter/Space 激活按钮，Enter 激活已聚焦链接，Escape 只退出当前编辑/浮层，不删除内容。
- 在 200% 浏览器缩放、长中英文 token、超长 URL、多代码块和多图情况下，节点宽度、头部动作、focus ring 和连接 handle 均不得重叠或漂移。

## 可直接落实的 CSS 边界

- 建议使用单一命名域：`.task-rich-content`、`.task-rich-paragraph`、`.task-rich-code`、`.task-rich-token`、`.task-rich-link`、`.task-rich-image`、`.task-rich-image-state`；不要把新样式放进 Markdown preview 命名域。
- 只使用 `app.css` 的现有 surface/text/border/focus/link/negative/radius/shadow token，不添加只适配浅色的硬编码色。
- `.task-rich-content`：`min-width: 0; width: 100%`，保持 14px 正文与现有 line-height；编辑态用 inset outline/box-shadow，不改 border box 尺寸。
- `.task-rich-code`：`max-width: 100%; overflow-x: auto; white-space: pre`；`.task-rich-image`：`max-width: 100%; overflow: hidden`；`.task-rich-token`：`display: inline; box-decoration-break: clone`，避免 inline-flex 在长 token 时撑宽节点。
- hover、selected、editing、loading、error 与 action 显隐只改变颜色、阴影和 opacity；操作位预留或 overlay，不改变内容高度。

## 实施与验收重点

1. 先保持 header、Run、连接与 footer DOM 不动，只替换正文 surface 与图片展示路径。
2. 用 selection-first、header drag、content nodrag 的实际 pointer flow 验证拖拽，不接受只给链接加 `stopPropagation` 的局部修补。
3. 浏览器样例必须在同一节点混合普通段落、两个代码块、多图、连续 `@`/`$` token、中文标点 URL 和超长 URL，并覆盖重新加载后的锚点顺序。
4. 截图至少覆盖 light/dark、默认/selected/editing、图片 loading/error、代码横向滚动和窄 host；交互证据覆盖 IME、键盘 focus、链接安全打开、图片移除恢复、节点拖拽与内容复制。
5. 视觉组件不得改变 Run/Markdown/导出文本。代码复制结果不含围栏装饰之外的 UI 文案，token 的 accessible/text output 保留原始 `@name`/`$name`。

## 风险与回滚

- 最大设计风险是 contenteditable 重渲染导致 caret、IME 或 undo 退化，以及将整个正文标记 `nodrag` 后拖拽入口变窄。前者必须以 composition/selection 浏览器证据阻断，后者通过 header 与外框真实拖拽验收。
- 内嵌图片失败不能退回假缩略图；回滚时保留附件和锚点真源，退回纯文本/legacy chip 阅读路径。
- 如果首版无法可靠满足同 surface 编辑，宁可保留可逆纯文本 fallback，也不能交付一个只读富预览叠加隐藏 textarea 的双重内容模型。

## 处理结果

设计审查通过，附带两项必须同步到 `design.md` 的局部基线修正；未修改实现、`design.md`、README、ROSTER、QUEUE 或 issue。

## 修改文件

- `agent-reports/resolved/solution-rich-node-content-design-review.md`

## 验证方式

- 静态审查 `TaskNode.tsx` 的 selection-first、IME、autosize、picker Portal、attachment chip 与 XYFlow 事件边界。
- 静态审查 `app.css` 的 node/card/body/picker/attachment 与 light/dark token 体系。
- 对照 `design.md` 的 Task Node、Interaction、Accessibility、Responsive 和 Skill Composition 规则完成冲突检查。

## 后续风险

- 本报告定义设计合同，不构成浏览器可见或原生 Widget 验收证据。
- `design.md` 的附件与 textarea picker 两处表述在 Design Standards Expert 更新前仍与新方案冲突。
