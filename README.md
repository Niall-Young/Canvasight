# Canvasight

Language / 语言: [中文](#中文) | [English](#english)

---

## 中文

Canvasight 是一个 repo-local Codex 插件。它会打开一个项目级常驻的本地网页画布，让你把任务拆成节点、连接流程、添加附件，然后把当前节点或整条流程生成 Markdown 和结构化数据返回正在调用 `await_canvasight_run` 的 Codex 线程。

### 主要用途

- 把复杂需求拆成可视化任务节点。
- 在同一个项目里用多个 Page 隔离不同画布工作区。
- 给节点附加图片、文件和上下文资料。
- 选择 Chat、Plan 或 Goal 模式，把画布内容交给 Codex 执行。
- 让 Codex 根据代码架构、产品需求或任务计划直接生成 Canvasight 节点和连线。
- 保存常用节点的标题、提示词和附件为全局模板，并在任意项目里拖回画布复用。
- 在新 Codex 线程里恢复最近使用的 Canvasight 项目。
- 让网页画布独立于单个 Codex thread 存活，当前在哪个 thread，就由哪个 thread 获取 Run payload。

### 核心功能

- **画布节点**：创建、拖拽、复制、删除和框选任务节点。
- **节点连接**：用连接线表达任务依赖或执行顺序。
- **项目 Page**：一个项目下可以有多个相互隔离的画布工作区。
- **附件**：支持上传、拖拽和粘贴图片到节点。
- **Markdown 预览**：把当前节点或下游流程转换成可发送给 Codex 的 Markdown。
- **AI 生成画布**：Codex 可以通过 `write_canvasight_graph` 写入 `.scatter/scatter.json`，按不同任务类型组织节点和连线，并优先复用已有全局节点模板。
- **全局节点模板**：从节点菜单把非空提示词和附件保存为本机全局模板，打开模板抽屉后可搜索并拖拽到当前画布。
- **Codex 原生模式**：节点可选择 Chat、Plan 或 Goal。
- **项目级 daemon**：本地网页服务独立于打开它的 Codex thread，归档旧 thread 不会直接关闭画布服务。
- **任务抽屉与设置**：查看任务清单、预览 Markdown，并调整语言和主题。
- **最近项目恢复**：跨 Codex 线程记住最近打开的项目。

### 基础用法

1. 在 Codex 中调用 `open_canvasight` 打开 Canvasight；它会启动或复用项目级本地 daemon。
2. 在浏览器画布里创建任务节点，填写提示词，按需要添加附件。
3. 用连接线组织节点关系，或者在左上角创建多个 Page 管理不同工作区。
4. 选择节点的 Codex 模式：Chat、Plan 或 Goal。
5. 需要复用提示词时，从节点菜单选择“存为模板”；再从右上角模板按钮打开模板抽屉，搜索模板并拖到画布。
6. 点击节点或流程的 Run。
7. 当前 Codex 线程调用 `await_canvasight_run` 读取生成的 Markdown 和结构化数据，然后继续执行任务。新线程可以用 `projectPath` attach 到同一项目队列。

### AI 直接创建画布

当你希望 Codex 把代码架构、产品需求、文章脉络或执行计划变成 Canvasight 画布时，可以直接提出类似请求：

- “分析这个代码项目的架构，并生成一个 Canvasight 架构图页面。”
- “把这份产品需求拆成 Canvasight 节点，按用户流程连接起来。”
- “按这篇文章的脉络生成阅读梳理节点。”
- “新增一个 Canvasight Page，包含调研、设计、开发、测试四个节点。”

Codex 应优先调用 `write_canvasight_graph`，而不是手写完整 JSON。该工具会写入项目下的 `.scatter/scatter.json`，默认写入模式是 `append-page`，用于避免覆盖现有画布；这只是安全默认值，不是任务分类规则。它会校验节点 id 唯一性，并要求每条连线的 `source` / `target` 都引用同一 Page 内存在的节点；连线也会遵守手动画布规则：支持一个节点连接多个下游节点，但不能自连、不能重复、一个节点不能有多个父节点。

AI 生成前应先调用 `list_canvasight_node_templates` 扫描本机全局节点模板。若模板符合当前节点用途，写入节点时使用 `templateId` 复用模板标题、提示词正文和附件；如果没有合适模板，再生成普通节点。

AI 生成时可以使用 `graphType` 选择节点组织策略，但分类只影响节点标题、提示词、连线结构和默认布局，不决定是否创建、切换或替换 Page：

- `software-product`：适合开发产品、功能或插件。应检查项目里是否已有 `AGENTS.md` 和 `design.md`，没有或缺内容时要生成补齐这些文档的节点，同时梳理产品目标、功能边界、设计样式、技术方案、验证方式。
- `article-outline`：适合阅读文章、报告或论文。节点应跟随原文脉络，包括核心观点、章节结构、论据、案例、结论和疑问，不套用产品开发模板。
- `codebase-structure`：适合梳理代码库。节点应跟随实际目录、入口命令、核心模块、数据流、外部接口、风险区域和验证方式，不编造没有读到的模块。
- `task-plan`：适合 bug 修复、迁移、执行计划或测试计划。
- `general`：适合混合或信息不足的请求。

如果网页已经打开，外部写入后刷新页面或重新打开项目即可看到 AI 生成的 Page。AI 写入画布只是创建可编辑节点和连线，不会自动运行节点，也不会直接发送消息给 Codex；真正发送仍然通过点击 Run 后由 `await_canvasight_run` 接收。

### 插件安装

插件源码位于 `plugins/canvasight`，repo-local marketplace 位于 `.agents/plugins/marketplace.json`。

```bash
codex plugin marketplace add /Users/niallyoung/Desktop/Canvasight
codex plugin add canvasight@canvasight-local
```

安装或重装后，请新开 Codex 线程或 reload 当前 Codex session。已经打开的线程不会热刷新新安装的 MCP tools。

升级后可用 `codex plugin list` 确认 `canvasight@canvasight-local` 显示为 `0.1.5` 或更高版本。如果仍是 `0.1.0`、`0.1.1`、`0.1.2`、`0.1.3` 或 `0.1.4`，旧的 MCP cache 可能还在运行旧版 server，请重新执行 `codex plugin add canvasight@canvasight-local` 并新开线程。

### Skills 分工

Canvasight 插件现在按任务拆成多个 Codex Skill，避免一个总入口误触发所有场景：

- `canvasight`：薄索引，只在明确提到 Canvasight/Scatter 且任务跨多个能力或不清楚该用哪个细分 skill 时使用。
- `canvasight-open`：打开网页画布、恢复最近项目、从新 Codex 线程重新 attach 到 Canvasight。
- `canvasight-run`：接收 Run payload，处理 Markdown、结构化数据和 Chat / Plan / Goal 模式。
- `canvasight-graph-writer`：用 `write_canvasight_graph` 让 AI 创建或更新 Canvasight 节点和连线。
- `canvasight-troubleshooting`：处理插件安装、MCP cache、daemon、URL 失效、连接拒绝等问题。

这些 Skill 只是 Codex 的触发与工作流分工，不改变 Canvasight 的用户界面，也不改变 Page、节点或 Run 的数据协议。

### MCP Tools

- `open_canvasight`
- `list_canvasight_recent_projects`
- `open_canvasight_recent_project`
- `list_canvasight_node_templates`
- `write_canvasight_graph`
- `await_canvasight_run`
- `close_canvasight`

`open_canvasight` 会记住已打开项目并启动或复用项目级 daemon。新 Codex 线程里可以先调用 `list_canvasight_recent_projects`，再调用 `open_canvasight_recent_project` 恢复最近画布。`await_canvasight_run` 可以按 `sessionId` 等待，也可以按 `projectPath` attach 到同一项目的 Run 队列；payload 由当前调用它的 Codex thread 接收。正常插件使用不需要手动运行 `npm run dev`。

`list_canvasight_node_templates` 返回本机全局节点模板，供 AI 写图前扫描和复用。`write_canvasight_graph` 让 Codex/AI 直接创建或替换 `.scatter/scatter.json` 里的 Page、节点和连线。`mode` 决定 Page 写入行为，`graphType` 决定任务节点结构。默认模式是 `append-page`，适合在未明确要求覆盖时保护现有画布；只有在明确要覆盖内容时才使用 `replace-active-page` 或 `replace-document`。节点可传 `templateId` 或 `templateQuery` 复用模板标题、正文和附件。

### 数据存储

- 项目内容保存在项目目录下的 `.scatter/scatter.json`。
- 附件保存在 `.scatter/assets/`。
- 最近项目状态保存在本机 Canvasight 用户状态中。
- daemon 连接状态保存在本机 Canvasight 用户状态中，用于跨 Codex thread 复用本地服务。
- 全局节点模板保存在本机 Canvasight 用户状态中，不写入项目 `.scatter/scatter.json`，因此会跨项目可用。
- 模板附件会复制到本机 Canvasight 全局模板资源目录，不引用原项目附件路径。
- AI 写入画布时可读取这些全局模板；生成的项目节点只保存复用后的节点数据和附件引用，不把模板库复制进项目。
- `.scatter/scatter.json` 保持 v1 兼容，并通过 `pages` / `activePageId` 支持项目内多个 Page。
- AI 写入画布也使用同一个 `.scatter/scatter.json` v1 协议；推荐通过 `write_canvasight_graph` 生成合法结构，而不是手动拼完整文件。

### 开发命令

```bash
cd plugins/canvasight
npm install
npm run dev
npm run dev:stop
npm run daemon
npm run daemon:stop
npm run typecheck
npm run build
npm run test:dev-server
npm run test:mcp
```

`npm run dev` 会启动或复用项目级持久 dev server，默认地址是 `http://127.0.0.1:5173/`。它用于本地“运行项目”和开发预览，启动命令退出或启动它的 Codex thread 被归档后，服务仍应继续存活。需要手动停止时运行 `npm run dev:stop`。

`npm run daemon` 和 `npm run daemon:stop` 只用于开发或排障时手动启动/停止插件 daemon。正常 Codex 插件使用由 MCP tool 自动启动 daemon，并由 daemon 托管已构建的 `dist/`。

### 插件校验

```bash
python3 /Users/niallyoung/.codex/skills/.system/plugin-creator/scripts/validate_plugin.py /Users/niallyoung/Desktop/Canvasight/plugins/canvasight
```

### 常见问题

**新线程还要重新 `npm run dev` 吗？**

不需要重复启动。如果 `http://127.0.0.1:5173/` 上已经有持久 dev server，新线程会复用它。只有手动 `npm run dev:stop`、机器重启、端口失效或需要重启 dev server 时，才需要再次运行 `npm run dev`。

**安装后看不到 Canvasight 工具怎么办？**

新开 Codex 线程或 reload 当前 Codex session。已经打开的线程通常不会热刷新新安装或更新后的 MCP tools。

**Page 和项目有什么区别？**

项目对应一个本地目录和 `.scatter` 数据。Page 是同一个项目下相互隔离的画布工作区。

**AI 生成画布和 Run 有什么区别？**

AI 生成画布只是写入 `.scatter/scatter.json`，创建可编辑的 Page、节点和连线。Run 是用户在网页里点击节点或流程后，把 Markdown payload 交给当前调用 `await_canvasight_run` 的 Codex thread。

**节点模板属于项目吗？**

不属于。节点模板是本机全局模板，可以跨项目复用。v1 模板保存节点标题、提示词正文和附件；不会保存 Chat、Plan、Goal、effort 或运行模式。

**最近项目怎么恢复？**

在新线程里先调用 `list_canvasight_recent_projects`，再调用 `open_canvasight_recent_project`。

**归档启动 Canvasight 的 thread 后，网页还会活着吗？**

会。网页服务由项目级 daemon 托管，不再绑定打开它的 thread-local MCP 进程。归档旧 thread 后，旧浏览器 tab 仍可继续使用；如果手动停止 daemon 或机器重启导致旧 URL 失效，再从当前 thread 重新打开最近项目即可。

**内置浏览器打不开 Canvasight 怎么办？**

`open_canvasight` 返回前会先验证完整会话 URL 可访问。用内置浏览器打开时，请导航到 tool result 里的完整 `browserUrl` / `url`，不要只复制 `origin`。如果仍显示无法访问，重新调用 `open_canvasight` 或 `open_canvasight_recent_project` 获取新的 URL；如果 tool 本身报不可达，说明本机 daemon 没有成功启动或本机 `127.0.0.1` 访问被阻断。

**当前 thread 怎么接收旧网页里的 Run？**

在当前 Codex thread 里调用 `await_canvasight_run`。如果知道旧 URL 的 `sessionId` 可以传 `sessionId`；否则传 `projectPath`，Canvasight 会等待该项目下任意活跃网页 session 投递的 Run payload。

**`close_canvasight` 会停止项目级 daemon 吗？**

不会。它只关闭指定 session。开发或排障时才需要手动运行 `npm run daemon:stop` 停止 daemon。

**为什么空节点不能运行？**

Canvasight 会阻止发送没有提示词正文的节点，避免把空请求提交给 Codex。

**Plan 或 Goal 没有进入 Codex 原生模式怎么办？**

检查 `await_canvasight_run` 返回的 `structuredContent.codexNative.status`。如果不是 `applied`，先按返回原因处理，不要把它当成普通 Chat 静默降级。

**什么时候需要 `npm run build`？**

修改插件网页源码后需要重新 build，让 daemon 托管的 `dist/` 与源码同步。只使用插件时不需要手动 build。

**Run 会直接点击 Codex 输入框吗？**

不会。Canvasight 不使用虚拟点击、辅助功能权限或剪贴板发送。Run payload 通过 MCP 返回给 Codex。

---

## English

Canvasight is a repo-local Codex plugin. It opens a project-level persistent local browser canvas where you can break work into task nodes, connect flows, attach files, and return generated Markdown plus structured data to the Codex thread that calls `await_canvasight_run`.

### Purpose

- Break complex requests into visual task nodes.
- Use multiple Pages inside one project to isolate canvas workspaces.
- Attach images, files, and context to task nodes.
- Send canvas output to Codex in Chat, Plan, or Goal mode.
- Let Codex generate Canvasight nodes and edges directly from code architecture, product requirements, or task plans.
- Save reusable node titles, prompts, and attachments as global templates and drag them back into any project canvas.
- Reopen recent Canvasight projects from a new Codex thread.
- Keep the browser canvas alive outside a single Codex thread, so whichever thread is current can receive the next Run payload.

### Core Features

- **Canvas nodes**: create, drag, copy, delete, and multi-select task nodes.
- **Connections**: represent dependencies or execution order with edges.
- **Project Pages**: keep multiple isolated canvas workspaces inside one project.
- **Attachments**: upload, drag, or paste images and files into nodes.
- **Markdown preview**: convert the current node or downstream flow into Markdown for Codex.
- **AI-generated canvas**: Codex can call `write_canvasight_graph` to write `.scatter/scatter.json`, organize nodes and edges for different task types, and reuse saved global node templates first.
- **Global node templates**: save non-empty node prompts and attachments from the node menu, search them in the template drawer, and drag them into the current canvas.
- **Native Codex modes**: choose Chat, Plan, or Goal per node.
- **Project-level daemon**: the local web service is independent from the Codex thread that opened it, so archiving that thread does not directly stop the canvas service.
- **Task drawer and settings**: inspect the task list, preview Markdown, and adjust language or theme.
- **Recent project recovery**: remember recent projects across Codex threads.

### Basic Workflow

1. Call `open_canvasight` from Codex; it starts or reuses the project-level local daemon.
2. Create task nodes in the browser canvas, write prompts, and add attachments when needed.
3. Connect nodes into flows, or create multiple Pages from the top-left Page switcher.
4. Choose the node's Codex mode: Chat, Plan, or Goal.
5. To reuse a prompt, choose “Save as template” from a node menu. Open the template drawer from the top-right template button, search templates, then drag one onto the canvas.
6. Click Run on a node or flow.
7. The current Codex thread calls `await_canvasight_run` to receive Markdown and structured data, then continues the task. A new thread can attach to the same project queue with `projectPath`.

### AI-Generated Canvas Data

When you want Codex to turn code architecture, product requirements, an article outline, or an execution plan into a Canvasight canvas, ask for it directly:

- “Analyze this codebase architecture and generate a Canvasight architecture page.”
- “Break this product requirement into Canvasight nodes and connect them by user flow.”
- “Generate reading-outline nodes that follow this article's structure.”
- “Add a Canvasight Page with research, design, development, and testing nodes.”

Codex should prefer `write_canvasight_graph` instead of hand-writing the full JSON file. The tool writes `.scatter/scatter.json` in the target project and defaults to `mode: "append-page"` to avoid overwriting existing canvas content; this is a safe write default, not a task classification rule. It validates unique node ids plus edge `source` / `target` references within the same Page. Edges follow the same rules as manual canvas connections: one node can connect to multiple downstream nodes, but there are no self-connections, no duplicates, and no more than one parent edge into the same target node.

Before generating a graph, Codex should call `list_canvasight_node_templates` to scan local global node templates. When a template fits the current node purpose, pass its `templateId` to reuse the saved title, prompt body, and attachments; generate a normal node when no template fits.

AI generation can use `graphType` to choose a node organization strategy, but classification only affects node titles, prompt bodies, edge structure, and default layout. It does not decide whether a Page is created, switched, or replaced:

- `software-product`: for building products, features, tools, or plugins. It should check whether `AGENTS.md` and `design.md` already exist in the project and create nodes to draft or complete them when they are missing or incomplete, then cover product goals, scope boundaries, design style, technical approach, and verification.
- `article-outline`: for reading articles, reports, or papers. Nodes should follow the source structure: thesis, sections, arguments, evidence, examples, conclusion, and questions instead of forcing a product-development template.
- `codebase-structure`: for inspecting repositories. Nodes should follow the actual directory structure, entry commands, core modules, data flow, external interfaces, risk areas, and verification paths without inventing uninspected modules.
- `task-plan`: for bug fixes, migrations, execution plans, or test plans.
- `general`: for mixed or underspecified requests.

If the web app is already open, refresh the page or reopen the project to see the externally generated Page. AI-generated canvas data only creates editable nodes and edges; it does not run nodes or send a message to Codex. Sending still happens through Run plus `await_canvasight_run`.

### Plugin Installation

The plugin source lives in `plugins/canvasight`. The repo-local marketplace lives at `.agents/plugins/marketplace.json`.

```bash
codex plugin marketplace add /Users/niallyoung/Desktop/Canvasight
codex plugin add canvasight@canvasight-local
```

After installing or reinstalling the plugin, open a new Codex thread or reload the current Codex session. Already-open threads do not hot-refresh newly installed MCP tools.

After upgrading, run `codex plugin list` and confirm `canvasight@canvasight-local` shows `0.1.5` or newer. If it still shows `0.1.0`, `0.1.1`, `0.1.2`, `0.1.3`, or `0.1.4`, the old MCP cache may still be running an older server; run `codex plugin add canvasight@canvasight-local` again and open a new thread.

### Skill Split

The Canvasight plugin now uses multiple Codex Skills so one broad entrypoint does not trigger for every Canvasight-related task:

- `canvasight`: a thin index for explicit Canvasight/Scatter requests that span multiple capabilities or do not clearly match a narrower skill.
- `canvasight-open`: opens the browser canvas, recovers recent projects, and attaches a new Codex thread to Canvasight.
- `canvasight-run`: receives Run payloads and handles Markdown, structured data, and Chat / Plan / Goal mode.
- `canvasight-graph-writer`: uses `write_canvasight_graph` so AI can create or update Canvasight nodes and edges.
- `canvasight-troubleshooting`: handles plugin installation, MCP cache, daemon, stale URL, and connection-refused issues.

These Skills only affect Codex routing and workflow instructions. They do not change the Canvasight UI, Page model, node data, or Run protocol.

### MCP Tools

- `open_canvasight`
- `list_canvasight_recent_projects`
- `open_canvasight_recent_project`
- `list_canvasight_node_templates`
- `write_canvasight_graph`
- `await_canvasight_run`
- `close_canvasight`

`open_canvasight` remembers opened projects and starts or reuses the project-level daemon. In a new Codex thread, call `list_canvasight_recent_projects` and then `open_canvasight_recent_project` to reopen the last canvas. `await_canvasight_run` can wait by `sessionId`, or attach to the same project run queue by `projectPath`; the payload is received by the current Codex thread that calls it. Normal plugin use does not require running `npm run dev`.

`list_canvasight_node_templates` returns local global node templates so AI can scan and reuse them before writing a graph. `write_canvasight_graph` lets Codex/AI create or replace Pages, nodes, and edges in `.scatter/scatter.json`. `mode` controls Page write behavior, while `graphType` controls the task node structure. Its default mode is `append-page`, which protects existing canvas content when replacement was not explicitly requested. Use `replace-active-page` or `replace-document` only when replacing existing content is explicit. Nodes can pass `templateId` or `templateQuery` to reuse a template title, body, and attachments.

### Data Storage

- Project content is stored in `.scatter/scatter.json`.
- Attachments are stored in `.scatter/assets/`.
- Recent project state is stored in local Canvasight user state.
- Daemon connection state is stored in local Canvasight user state so the local service can be reused across Codex threads.
- Global node templates are stored in local Canvasight user state, not in project `.scatter/scatter.json`, so they are reusable across projects.
- Template attachments are copied into the local Canvasight global template asset directory instead of referencing the original project attachment path.
- AI-generated graphs can read these global templates; generated project nodes store the reused node data and attachment references without copying the template library into the project.
- `.scatter/scatter.json` remains v1-compatible and supports multiple project Pages through `pages` / `activePageId`.
- AI-generated canvas data uses the same `.scatter/scatter.json` v1 protocol. Prefer `write_canvasight_graph` to produce a valid structure instead of manually assembling the whole file.

### Development Commands

```bash
cd plugins/canvasight
npm install
npm run dev
npm run dev:stop
npm run daemon
npm run daemon:stop
npm run typecheck
npm run build
npm run test:dev-server
npm run test:mcp
```

`npm run dev` starts or reuses the project-level persistent dev server, served by default at `http://127.0.0.1:5173/`. It is for local “run project” usage and development preview. The service should keep running after the launch command exits or the Codex thread that launched it is archived. Use `npm run dev:stop` when you explicitly need to stop it.

`npm run daemon` and `npm run daemon:stop` are only for manual plugin-daemon development or troubleshooting. Normal Codex plugin use starts the daemon automatically through the MCP tool, and the daemon serves the built `dist/` app.

### Plugin Validation

```bash
python3 /Users/niallyoung/.codex/skills/.system/plugin-creator/scripts/validate_plugin.py /Users/niallyoung/Desktop/Canvasight/plugins/canvasight
```

### FAQ

**Do I need to run `npm run dev` again in a new thread?**

No, not if the persistent dev server is already alive at `http://127.0.0.1:5173/`. Run it again only after `npm run dev:stop`, a machine restart, port loss, or when you explicitly need to restart the dev server.

**What if Canvasight tools do not appear after installation?**

Open a new Codex thread or reload the current Codex session. Already-open threads usually do not hot-refresh newly installed or updated MCP tools.

**What is the difference between a Page and a project?**

A project maps to a local directory and `.scatter` data. A Page is an isolated canvas workspace inside that project.

**What is the difference between AI-generated canvas data and Run?**

AI-generated canvas data writes `.scatter/scatter.json` to create editable Pages, nodes, and edges. Run happens after the user clicks a node or flow in the web app, then the Markdown payload is received by the Codex thread calling `await_canvasight_run`.

**Are node templates project-specific?**

No. Node templates are local global templates and can be reused across projects. v1 templates save the node title, prompt body, and attachments; they do not save Chat, Plan, Goal, effort, or run mode.

**How do I recover a recent project?**

In a new thread, call `list_canvasight_recent_projects`, then call `open_canvasight_recent_project`.

**Will the page stay alive after I archive the thread that opened Canvasight?**

Yes. The web service is hosted by the project-level daemon, not the thread-local MCP process that opened it. The old browser tab can continue working after that thread is archived. If the daemon is manually stopped or the machine restarts and the old URL becomes invalid, reopen the recent project from the current thread.

**What if the in-app browser cannot open Canvasight?**

`open_canvasight` verifies that the full session URL is reachable before returning. When opening it in the in-app browser, navigate to the full `browserUrl` / `url` from the tool result, not only the `origin`. If it still cannot load, call `open_canvasight` or `open_canvasight_recent_project` again to get a fresh URL. If the tool itself reports that the URL is unreachable, the local daemon did not start successfully or local `127.0.0.1` access is blocked.

**How does the current thread receive a Run from an old browser tab?**

Call `await_canvasight_run` in the current Codex thread. Pass `sessionId` if you know it from the old URL; otherwise pass `projectPath`, and Canvasight will wait for any active browser session in that project to submit a Run payload.

**Does `close_canvasight` stop the project-level daemon?**

No. It only closes the specified session. Use `npm run daemon:stop` only during development or troubleshooting when you explicitly need to stop the daemon.

**Why can an empty node not run?**

Canvasight blocks nodes without prompt body text to avoid submitting empty requests to Codex.

**What if Plan or Goal does not enter native Codex mode?**

Check `structuredContent.codexNative.status` from `await_canvasight_run`. If it is not `applied`, handle the returned reason first instead of silently downgrading to normal Chat.

**When do I need `npm run build`?**

Run it after changing the plugin web source so the daemon's served `dist/` matches the source. Normal plugin use does not require manual builds.

**Does Run click or paste into the Codex input box?**

No. Canvasight does not use virtual clicks, Accessibility automation, or clipboard sending. Run payloads return to Codex through MCP.
