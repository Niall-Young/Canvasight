---
schema_version: 1
report_id: solution-rich-node-content-test-plan
report_type: solution
status: resolved
owner: Test Supervisor Agent
created_by: Test Supervisor Agent
priority: high
version: 1
agent_id: /root/test_supervisor_agent
thread_id: null
created_at: 2026-07-16T05:56:06Z
updated_at: 2026-07-16T05:56:06Z
depends_on:
  - issue-rich-node-content-editor
related_files:
  - plugins/canvasight/src/components/TaskNode.tsx
  - plugins/canvasight/src/lib/richNodeContent.ts
  - plugins/canvasight/src/lib/markdown.ts
  - plugins/canvasight/src/lib/markdownExport.ts
  - plugins/canvasight/src/lib/skills.ts
  - plugins/canvasight/src/lib/skillPickerPlacement.ts
  - plugins/canvasight/src/lib/canvasightApi.ts
  - plugins/canvasight/src/store/scatterStore.ts
  - plugins/canvasight/shared/types.ts
  - plugins/canvasight/tests/rich-node-content-smoke.mjs
  - plugins/canvasight/tests/markdown-flow-smoke.mjs
  - plugins/canvasight/tests/markdown-export-smoke.mjs
  - plugins/canvasight/tests/skills-smoke.mjs
  - plugins/canvasight/tests/concurrent-document-smoke.mjs
verification_status: not_applicable
verification_evidence:
  - This report defines the pre-implementation verification plan; no rich editor implementation was available to execute when the plan was written.
  - The matrix was derived from the current textarea editor, attachment proxy, Skill picker, Markdown/export, store history, autosave, and concurrent document contracts.
---

# 节点富内容编辑器验证方案

## 负责 Agent

Test Supervisor Agent

## 对应问题

`agent-reports/assigned/issue-rich-node-content-editor.md`（审查时为 `Development Agent / assigned / version 2`；本报告不改变其 owner、status 或 version。）

## Root Cause

当前没有覆盖“正文字符串与富内容视图可逆”等价性的测试。现有测试分别保护 Markdown/Run 顺序、Skill token、附件导出和三方并发保存，但无法发现代码围栏被改写、图片锚点漂移、链接误识别、IME 中间态落库或富内容 DOM 干扰节点拖拽等新回归。

## 调研过程

- `TaskNode.tsx` 目前以 `body: string` 驱动 `textarea`，IME 期间只维护本地 draft，composition end 后才提交；`$skill` picker 依赖 selection、键盘导航和 viewport Portal。
- 图片上传、拖入和粘贴经 `saveAttachments` 落盘，native Widget 图片通过 `loadCanvasightImageAsset` 与 widget API proxy 读取；其他附件仍应保留独立管理能力。
- `buildMarkdown` 直接读取 `node.data.body` 和 `attachments`；Markdown/ZIP 导出重写附件路径；保存使用 base/local/current 三方合并。因此视觉层不得成为新的、不兼容真源。
- 当前无 React DOM 测试依赖。最窄方案是把识别、锚点编辑和序列化保持为纯函数，用一个 Node smoke 覆盖；浏览器负责 contenteditable/selection、IME、粘贴、撤销和 XYFlow 交互。

## 推荐方案

采用三层门禁：纯函数可逆性、真实浏览器编辑/无障碍、既有 Run/导出/持久化回归。自动化必须断言原始 `body` 和附件 ID，而不是只检查生成的富内容 DOM。任何解析失败都回退为可编辑文本，不能丢字或静默移除附件。

## 自动化验证矩阵

### 1. 富内容解析、锚点与序列化

在 `tests/rich-node-content-smoke.mjs` 中直接加载 `src/lib/richNodeContent.ts` 的纯函数，至少覆盖：

- 旧纯文本、空正文、CR/LF、前后空格和未知标记解析后再序列化逐字节相等。
- 闭合围栏代码：无语言、有语言、空块、多块、缩进、长行、围栏内反引号和相邻中文；保留全部空格与换行。未闭合围栏整体回退为文本。
- `@plugin`、`$skill` 的英文、中文、数字、连字符、连续 token 和标点边界；普通价格中的 `$` 不识别。未知名称只能得到中性 token，不能带“已验证”语义；序列化仍是原始 `@name`/`$name`。
- URL 仅识别 `http`/`https`，正确剔除中文/英文尾随标点并处理括号；拒绝 `javascript:`、`data:`、`file:`、畸形地址。代码块和图片锚点内部不再二次 linkify。
- 图片锚点以附件稳定 ID 关联：首/中/尾插入、多图、同名不同 ID、重复粘贴、删除与撤销。保存/解析往返后顺序不变；缺失资产保留可恢复占位；未锚定的历史附件不被自动改写或丢弃；非图片附件仍可管理。
- 光标/selection 编辑 helper：插入、替换选择区、Backspace/Delete 穿越原子图片、token 边界、纯文本粘贴和锚点移除后的 caret 均可预测，且操作前后的正文与附件集合满足合同。

### 2. 编辑状态与兼容合同

- 在 smoke 或最窄 store harness 中证明富内容编辑仍以一次 history transaction 形成可撤销结果；editor 内撤销/重做不会误触画布级删除或历史，失焦后画布 undo/redo 能恢复完整 `body + attachments/anchors`。
- 扩充 `test:markdown`：带代码围栏、`@plugin`、多个 `$skill`、URL 和图片锚点的节点，`buildMarkdown` 中正文原文、token 数量、当前节点加下游顺序、附件引用和图片路径均不变。
- 扩充 `test:markdown-export`：内嵌图片仍随 ZIP 导出，Markdown 中绝对路径被重写且同名文件不覆盖；缺失资产继续显式失败。
- 保留并运行 `test:skills`，验证 `$` query、选择器插入、完整 catalog、键盘 placement 合同未因编辑 surface 改写。
- 扩充或复用 `test:concurrency`：同一节点 `body + 图片锚点/附件` 冲突时原 Page 保留当前用户语义，完整 incoming 候选进入 conflict copy；disjoint merge、daemon 重启 replay、旧文档读取不丢锚点。

### 3. 命令门禁

从 `plugins/canvasight` 运行：

```sh
node tests/rich-node-content-smoke.mjs
npm run test:skills
npm run test:markdown
npm run test:markdown-export
npm run test:concurrency
npm run typecheck
npm run build
```

从仓库根运行：

```sh
node plugins/canvasight/skills/canvasight-agent-team/scripts/validate-agent-team.mjs --root /Users/niallyoung/Desktop/Canvasight
python3 /Users/niallyoung/.codex/skills/.system/plugin-creator/scripts/validate_plugin.py /Users/niallyoung/Desktop/Canvasight/plugins/canvasight
git diff --check
```

若实现改动 `canvasightApi` widget 路由、MCP、Run bridge、widget bootstrap 或 installed snapshot 合同，再追加：

```sh
npm run test:widget-runtime
npm run test:mcp
npm run check:mcp-bundle
npm run test:plugin-distribution
```

## 浏览器可见与无障碍步骤

使用隔离测试项目启动 browser/dev surface，创建一个按顺序包含“正文 → 图片 A → 正文 → fenced code → `@plugin` → `$skill` → 两个 URL → 图片 B”的节点，并记录截图与控制台：

1. 读态确认代码与正文一眼可分、图片保持正文顺序、token 是中性紧凑标签、URL 明确可识别；代码长行不撑破节点。
2. 选中节点进入编辑，在首/中/尾定位光标，分别键入、粘贴文本、粘贴图片、拖入图片和用附件按钮选择图片；保存刷新、移动节点、切换 Page 后顺序与内容不漂移。
3. 发出 composition start/input/end，确认 raw pinyin 不进入保存请求，composition end 后中文只提交一次；在 composition 邻近代码围栏和 `$` 时 picker 不抢 Enter。
4. 验证 `Cmd/Ctrl+Z`、`Cmd/Ctrl+Shift+Z`、selection 删除、Backspace/Delete、复制代码和纯文本粘贴；复制代码不得带装饰字符，撤销不得留下孤立锚点或附件。
5. `$` picker 继续支持 Arrow/Page/Enter/Tab/Escape、caret 锚定和完整目录；插入后 Run 文本仍是 `$skill`。`@plugin`/未知 token 可编辑，不显示成功或已安装状态。
6. 读态用鼠标和键盘打开 `https` 链接，编辑态可完整修改地址；链接点击不拖动节点、不误选连接线，尾随标点不进入 href，非法协议保持文本。新窗口必须隔离 opener。
7. 模拟图片加载失败和删除：错误占位有文件名、可聚焦恢复/移除入口；删除同步更新锚点与附件，撤销恢复二者；非图片附件仍有原 chip 行为。
8. 在浅色/深色、窄窗口、200% 浏览器缩放、长正文和节点画布缩放下检查焦点环、对比度、滚动、自动高度和无布局跳变。DOM 语义至少包含 `<pre><code>`、有意义图片 alt/错误文本、真实 `<a>`，非交互 token 不伪装成按钮；仅键盘可完成编辑、picker、链接和图片移除。
9. 点击节点 Run，捕获发送/排队前 payload 并与 `buildMarkdown` 自动化快照比对；browser fallback 只按既有合同排队，不把 app-server 或页面 toast 当 native 发送成功。

## 原生 Widget 门槛

当前确认范围若只改 `TaskNode`、CSS、纯解析/序列化逻辑，并继续原样复用 `loadCanvasightImageAsset`、现有 widget API proxy 和 Run bridge，则真实 native Widget **不是本轮新增的必需门槛**；browser/dev 证据可验收此次编辑器行为，报告需明确 native 未复验。

出现以下任一情况时，原生 Widget 升级为阻断门槛：修改 widget/MCP/session/bridge；为链接新增宿主导航；直接调用 Clipboard/文件能力；改变 native 附件代理；或 browser 与 native 的图片/焦点/Run 行为存在分支。此时必须安装精确交付快照，必要时重启 Codex Desktop 并在新 task 中：

- `open_canvasight` 后用同一 `threadId/sessionId/openAttemptId` 等待 instance-bound fullscreen ready；
- 确认完整画布可见，实际完成一次富内容编辑、一次 native 图片加载和一次安全链接/焦点交互；
- 点击 Run 并确认内容通过该 accepted instance 到达同一 Codex task；
- 注入/等待 late metadata，确认界面不会退回 Connecting。

浏览器、DOM harness、build 或 daemon health 都不能替代触发后的真实 native 证据。

## 失败阻断条件

以下任一项阻断 issue 关闭、发布和 Git 交付：

- 解析/序列化改变正文字符、围栏空白、token 文本或图片顺序；旧节点需静默迁移才能读取。
- 图片锚点漂移、孤立、同名覆盖、删除不同步、刷新/并发后丢失，或 native/browser 图片错误被吞掉。
- 闭合代码仍与正文混排；未闭合围栏导致正文丢失；代码复制带入 UI 装饰。
- 非 `http/https` 可点击、href 吞入尾随标点、链接激活造成节点拖拽，或新窗口保留 opener。
- IME 中间态落库、粘贴重复上传、editor undo/redo 破坏画布历史、Skill picker 键盘/selection 回归。
- Run、节点级 Skill 映射、附件路径、Markdown/ZIP 导出或下游节点顺序发生未批准变化。
- 保存刷新、历史文档或三方合并丢失 `body`/附件/锚点；冲突副本不完整。
- typecheck、build、聚焦 smoke、既有 Markdown/Skill/export/concurrency 测试失败。
- 浏览器可见验收出现不可读代码、不可恢复错误、焦点陷阱、缺失键盘路径、严重对比度/布局问题或数据丢失。
- 已触发原生 Widget 门槛却没有真实 instance-bound ready、控件、同 task Run 和 late metadata 证据。

## 处理结果

已完成本轮最窄但足够的验证矩阵；实现尚未复核或执行，父 issue 保持原 owner/status/version。

## 修改文件

- `agent-reports/resolved/solution-rich-node-content-test-plan.md`

## 验证方式

- 只完成静态合同审查与测试计划；待 Development Agent 交付实现后由 Test Supervisor Agent 独立运行上述门禁并补真实证据。

## 后续风险

- 若实现选择浏览器原生 `contenteditable`，不同引擎的 undo、composition 和 selection 行为不能只靠纯函数 smoke 证明，必须保留真实浏览器交互。
- 若结构化字段成为第二真源而不是从 `body + attachments` 可逆派生，需要新增显式 schema/version/迁移/回滚测试；未完成前视为阻断。
