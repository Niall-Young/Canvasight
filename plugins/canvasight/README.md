# Canvasight

Language / 语言: [中文](#中文) | [English](#english)

---

## 中文

Canvasight 是一个在 Codex 中运行的可编辑画布插件，用 Page、任务节点、附件和连线整理工作，再把当前节点及其下游内容发送回当前 Codex 任务执行。画布保存在当前项目的 `.scatter/` 目录中；正常使用时，Canvasight 直接显示在 Codex 原生 widget 内。

### 主要功能

- 创建、编辑、拖拽、复制、删除和连接任务节点。
- 使用多个 Page 拆分同一项目中的不同工作流。
- 把当前节点及其下游节点作为 Chat 消息发送到当前 Codex 任务。
- 让 Codex 通过 Graph Writer 创建、补充或重排可编辑画布。
- 给节点添加图片和文件附件，并在 Markdown/ZIP 导出中保留附件引用。
- 在多个 Codex 任务之间安全合并同一项目的并发编辑；冲突内容保留为独立副本。
- 在节点中搜索并插入当前项目启用的 `$skill-name`。
- 使用轻量富内容正文，在同一编辑区域中区分图片、代码、能力引用和链接。

### 基础用法

1. 安装插件并重新加载或重启 Codex Desktop。
2. 打开要使用的项目，新建 Codex 任务并输入 `@Canvasight`。
3. 让 Codex 打开当前项目的 Canvasight 画布，并等待原生画布确认就绪。
4. 创建节点，填写标题和正文，按真实依赖关系连接节点。
5. 需要执行时，点击目标节点的 Run。Canvasight 会发送该节点及其下游节点；不会把浏览器 fallback 的排队结果冒充原生发送成功。

安装或升级后，只新建任务可能仍会沿用桌面进程中的旧插件注册信息，因此应先重新加载窗口或重启 Codex Desktop，再新建任务并重新 `@Canvasight`。

### 节点富内容

节点正文是同一个轻量所见即所得区域：第一次点击选中节点，再次点击正文进入编辑。它不会创建一份独立预览，也不会把正文改成任意 HTML。

#### 图片

把光标放到正文中的目标位置，再通过节点的附件按钮选择图片。图片仍作为附件保存，但会在该光标位置以内嵌插图显示；保存和重新加载后保持顺序。非图片附件继续显示为附件 chip；历史节点中没有正文锚点的图片也会保留原有 chip，不会被静默移动到正文末尾。

图片加载失败时会保留可识别的错误位置，而不会静默删除正文锚点。移除内嵌图片会同时移除对应附件引用。

#### 代码块

使用完整的三个反引号围栏，可选填写语言名：

````text
```ts
const ready = true;
```
````

完整围栏会显示为独立等宽代码块，并保留空格和换行。未闭合围栏会安全回退为普通可编辑文本。Canvasight 首版不提供完整 Markdown 渲染或语法高亮。

#### `@plugin` 与 `$skill`

显式输入 `@plugin-name` 或 `$skill-name` 后，正文会用紧凑的 Codex 风格标签区分它们。标签仍是可编辑文本，不表示对应能力已经安装、启用或通过验证；Run 和导出仍保留原始文本。

在编辑正文时输入 `$`，可以继续搜索当前项目启用的 Skill。选择结果会插入可见的 `$skill-name`；列表不可用时仍可手动输入。

#### 链接

正文会自动识别合法的 `http://` 和 `https://` 地址。阅读状态下可以打开链接；编辑状态下点击用于修改地址。尾随中英文标点不会被吞入链接，其他协议保持普通文本。

#### 内容边界

富内容只改变节点内的阅读和编辑表现。原始正文、附件、Run Markdown、下游节点顺序和导出合同保持不变。首版不会：

- 渲染完整 Markdown；
- 自动猜测普通文字是否为代码；
- 执行正文中的 HTML；
- 把未知 `@` / `$` 名称伪装成已验证能力；
- 自动打开非 `http` / `https` 地址。

### 插件安装

推荐把下面这句话发送给 Codex：

```text
帮我从 stable 分支安装这个 Codex plugin：https://github.com/Niall-Young/Canvasight.git
```

也可以手动安装：

```bash
codex plugin marketplace add https://github.com/Niall-Young/Canvasight.git --ref stable
codex plugin add canvasight@canvasight-local
codex plugin list
```

`codex plugin list` 应显示 `canvasight@canvasight-local`。安装、重装或升级后，请重新加载或重启 Codex Desktop，再新建任务并重新 `@Canvasight`。

### MCP Tools 与 Skills

常用 MCP tools：

- `open_canvasight`：创建一次原生画布打开尝试；返回结果仍是 provisional。
- `await_canvasight_widget_ready`：使用同一组任务、session 和 attempt 身份确认全屏画布真实就绪。
- `get_canvasight_graph_context`：读取当前 Page、revision 和增量写入上下文。
- `write_canvasight_graph`：创建、替换或增量更新 Page、节点和连线。
- `ask_canvasight_framework_questions`：在关键框架选择会改变结果时显示确认卡。
- `list_canvasight_node_templates` / `get_canvasight_node_template`：读取节点模板摘要与选中模板详情。
- `list_canvasight_skills`：按当前项目查询启用 Skill 的摘要。
- `open_canvasight_browser_fallback` / `await_canvasight_run`：仅用于显式诊断或 browser/dev fallback。

Canvasight Skills 分工：

- `canvasight-open`：原生打开、最近项目和明确的浏览器 fallback。
- `canvasight-run`：处理原生 Chat Run 与 fallback 队列。
- `canvasight-graph-writer`：创建或更新画布内容。
- `canvasight-agent-team`：管理可选的角色注册表与 agent-report 协作协议。
- `canvasight-update`：检查或安装官方稳定版本。
- `canvasight-troubleshooting`：诊断插件、MCP、daemon、widget 和 Run 故障。

### 数据存储

- 项目画布：`.scatter/scatter.json`
- 项目附件：`.scatter/assets/`
- 并发 revision 状态：`.scatter/revision-state.json`
- 最近项目、全局模板和 Canvasight 用户状态：本机 Canvasight 用户状态目录

通用插件更新不会删除或重建项目画布、附件、项目源码、其他插件或 Skills。

### 开发命令

以下命令仅用于本地开发，不是正常用户流程。请从 `plugins/canvasight` 运行：

```bash
npm install
npm run dev
npm run dev:status
npm run dev:stop
npm run typecheck
npm run test:rich-content
npm run test:markdown
npm run test:markdown-export
npm run test:skills
npm run test:concurrency
npm run test:widget-runtime
npm run test:mcp
npm run check:mcp-bundle
npm run test:plugin-distribution
npm run build
```

`npm run dev` 和 `npm run dev:foreground` 只用于开发预览。正常插件使用由 MCP 自动启动或复用项目级 daemon，不要求用户先运行开发服务器。

### 常见问题

#### 为什么代码仍然显示为普通文字？

只有完整的三个反引号围栏会成为代码块。未闭合围栏会保留为普通文本，避免内容丢失。

#### 标签为什么没有显示“已安装”？

`@plugin` 和 `$skill` 标签只帮助扫描内容，不验证能力状态。未知名称与已知名称使用相同的中性样式。

#### 为什么某个地址不能点击？

Canvasight 只自动链接合法的 `http` 和 `https` 地址。其他协议为安全起见保持普通文本。

#### 富内容会改变发送给 Codex 的内容吗？

不会。Run 和导出继续使用原始正文和附件合同，视觉组件不会写入发送文本。

#### 为什么安装后看不到新功能或 tools？

节点富内容编辑器从 Canvasight `v0.4.22` 起提供。如果 `codex plugin list` 仍显示 `v0.4.21`，当前 widget 使用的是旧构建快照；输入围栏代码、URL、`@plugin` 或 `$skill` 不会触发新样式。安装或升级完整的 `v0.4.22` 插件快照后，重新加载或重启 Codex Desktop，再新建任务并重新 `@Canvasight`。只新建任务可能无法刷新桌面进程级插件注册信息。

在 `v0.4.22` 中不需要打开额外开关：完整的三个半角反引号围栏、显式 `@plugin` / `$skill` 和合法 `http` / `https` URL 会在节点正文中自动获得语义样式；输入 `$` 还会继续打开 Skill 选择器。

#### 为什么 `open_canvasight` 返回成功但画布还没就绪？

`open_canvasight` 只创建 provisional attempt。只有 `await_canvasight_widget_ready` 对同一个 attempt、session 和当前任务返回 verified fullscreen ready，并确认 React、项目与画布可见，才算真实打开成功。

---

## English

Canvasight is an editable canvas plugin for Codex. It organizes work with Pages, task nodes, attachments, and edges, then sends the selected node and its downstream flow back to the current Codex task. The canvas is stored in the current project's `.scatter/` directory and normally renders inside a native Codex widget.

### Main Features

- Create, edit, move, duplicate, delete, and connect task nodes.
- Use multiple Pages to separate workflows within one project.
- Send the current node and downstream nodes to the current Codex task as a Chat message.
- Let Codex create, extend, or rearrange editable canvases through the Graph Writer.
- Attach images and files while preserving references in Markdown/ZIP exports.
- Merge concurrent edits from multiple Codex tasks safely and preserve conflicting content as a separate copy.
- Search for and insert project-enabled `$skill-name` references inside a node.
- Read and edit images, code, capability references, and links through a lightweight rich-content body.

### Basic Usage

1. Install the plugin, then reload or restart Codex Desktop.
2. Open the project you want to use, create a Codex task, and enter `@Canvasight`.
3. Ask Codex to open Canvasight for the current project and wait for native readiness verification.
4. Create nodes, edit their titles and bodies, and connect only real relationships or dependencies.
5. Click Run on the node you want to execute. Canvasight sends that node and its downstream flow; a queued browser fallback result is never presented as a successful native send.

After an install or upgrade, creating a task alone may retain the desktop process's old plugin registry. Reload or restart Codex Desktop first, then create a new task and tag `@Canvasight` again.

### Rich Node Content

The node body is one lightweight WYSIWYG surface for reading and editing. The first click selects a node; another click in the body begins editing. Canvasight does not create a separate preview or turn the body into executable HTML.

#### Images

Place the caret at the intended body position, then choose an image with the node's attachment button. The image remains an attachment asset but appears as an inline figure at that caret position, and its order survives save and reload. Non-image attachments continue to appear as attachment chips. Legacy images without body anchors also remain in their existing chip form instead of being silently moved to the end of the body.

An image load failure keeps a recognizable error position instead of silently removing the body anchor. Removing an inline image also removes its corresponding attachment reference.

#### Code Blocks

Use a complete triple-backtick fence, optionally with a language name:

````text
```ts
const ready = true;
```
````

A complete fence becomes a separate monospace code block and preserves whitespace and line breaks. An unclosed fence safely falls back to editable plain text. The first version is not a full Markdown renderer and does not add syntax highlighting.

#### `@plugin` and `$skill`

Explicit `@plugin-name` and `$skill-name` text receives a compact Codex-style token treatment. Tokens remain editable text and do not claim that a capability is installed, enabled, or verified. Run and export preserve the original text.

Typing `$` while editing still searches the Skills enabled for the current project. Choosing a result inserts a visible `$skill-name`; manual entry remains available when the list cannot load.

#### Links

The body automatically recognizes valid `http://` and `https://` addresses. A link can open in reading state, while a click in editing state keeps the address editable. Trailing Latin or Chinese punctuation is excluded, and other protocols remain plain text.

#### Content Boundaries

Rich content changes only the reading and editing presentation inside a node. The original body, attachments, Run Markdown, downstream order, and export contracts stay unchanged. The first version does not:

- render full Markdown;
- guess whether ordinary text is code;
- execute HTML from node content;
- present unknown `@` / `$` names as verified capabilities;
- auto-open non-`http` / `https` addresses.

### Plugin Installation

The recommended path is to send this sentence to Codex:

```text
Install this Codex plugin from its stable branch: https://github.com/Niall-Young/Canvasight.git
```

You can also install it manually:

```bash
codex plugin marketplace add https://github.com/Niall-Young/Canvasight.git --ref stable
codex plugin add canvasight@canvasight-local
codex plugin list
```

`codex plugin list` should show `canvasight@canvasight-local`. After installing, reinstalling, or upgrading, reload or restart Codex Desktop, create a new task, and tag `@Canvasight` again.

### MCP Tools and Skills

Common MCP tools:

- `open_canvasight`: creates a native canvas open attempt; its result is still provisional.
- `await_canvasight_widget_ready`: verifies that the same task/session/attempt reached a real fullscreen-ready canvas.
- `get_canvasight_graph_context`: reads the active Page, revision, and incremental-write context.
- `write_canvasight_graph`: creates, replaces, or incrementally updates Pages, nodes, and edges.
- `ask_canvasight_framework_questions`: shows an inline confirmation card when a consequential framework choice would change the result.
- `list_canvasight_node_templates` / `get_canvasight_node_template`: read template summaries and a selected template's full details.
- `list_canvasight_skills`: queries summaries of Skills enabled for the current project.
- `open_canvasight_browser_fallback` / `await_canvasight_run`: explicit diagnostic or browser/dev fallback only.

Canvasight Skills:

- `canvasight-open`: native opening, recent projects, and explicit browser fallback.
- `canvasight-run`: native Chat Run and fallback queue handling.
- `canvasight-graph-writer`: canvas creation and updates.
- `canvasight-agent-team`: optional role-registry and agent-report collaboration.
- `canvasight-update`: official stable-version checks and installation.
- `canvasight-troubleshooting`: plugin, MCP, daemon, widget, and Run diagnostics.

### Data Storage

- Project canvas: `.scatter/scatter.json`
- Project attachments: `.scatter/assets/`
- Concurrent revision state: `.scatter/revision-state.json`
- Recent projects, global templates, and Canvasight user state: the local Canvasight user-state directory

A generic plugin update does not delete or recreate project canvases, attachments, source files, other plugins, or Skills.

### Development Commands

These commands are for local development and are not part of normal user setup. Run them from `plugins/canvasight`:

```bash
npm install
npm run dev
npm run dev:status
npm run dev:stop
npm run typecheck
npm run test:rich-content
npm run test:markdown
npm run test:markdown-export
npm run test:skills
npm run test:concurrency
npm run test:widget-runtime
npm run test:mcp
npm run check:mcp-bundle
npm run test:plugin-distribution
npm run build
```

`npm run dev` and `npm run dev:foreground` are development previews only. Normal plugin use starts or reuses the project daemon through MCP and does not require users to start a development server.

### FAQ

#### Why is my code still plain text?

Only a complete triple-backtick fence becomes a code block. An unclosed fence remains plain text to prevent content loss.

#### Why does a token not say "installed"?

`@plugin` and `$skill` tokens improve scanning; they do not verify capability state. Known and unknown names share the same neutral presentation.

#### Why is an address not clickable?

Canvasight auto-links only valid `http` and `https` addresses. Other protocols remain plain text for safety.

#### Does rich content change what Codex receives?

No. Run and export continue to use the original body and attachment contracts; visual components are not written into the outgoing text.

#### Why are the new feature or tools missing after installation?

The rich node editor is available starting with Canvasight `v0.4.22`. If `codex plugin list` still shows `v0.4.21`, the current widget is using the old built snapshot; entering a fenced block, URL, `@plugin`, or `$skill` will not activate the new presentation. Install or upgrade the complete `v0.4.22` plugin snapshot, reload or restart Codex Desktop, then create a new task and tag `@Canvasight` again. Creating a task alone may not refresh the desktop-level plugin registry.

No extra toggle is required in `v0.4.22`: complete three-character ASCII backtick fences, explicit `@plugin` / `$skill` text, and valid `http` / `https` URLs receive their semantic presentation automatically. Typing `$` also continues to open the Skill picker.

#### Why did `open_canvasight` succeed while the canvas is not ready?

`open_canvasight` creates only a provisional attempt. The canvas is truly open only when `await_canvasight_widget_ready` verifies the same attempt, session, and task as fullscreen ready with React, project hydration, and a visible canvas.
