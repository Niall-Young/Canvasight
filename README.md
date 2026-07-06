# Canvasight

Language / 语言: [中文](#中文) | [English](#english)

---

## 中文

Canvasight 是一个 repo-local Codex 插件。它会打开一个项目级常驻的本地网页画布，让你把任务拆成节点、连接流程、添加附件，然后把当前节点或整条流程生成 Markdown 和结构化数据交给当前 Codex 线程；默认通过 `await_canvasight_run` 接收队列里的 Run payload。

### 主要用途

- 把复杂需求拆成可视化任务节点。
- 在同一个项目里用多个 Page 隔离不同画布工作区。
- 给节点附加图片、文件和上下文资料。
- 选择 Chat、Plan 或 Goal 模式，把画布内容交给 Codex 执行。
- 默认在 Run 输出中包含 Agent Team 协作协议，让复杂任务按需使用产品、设计、开发、测试、文档、Skill 和项目管理角色。
- 让 Codex 根据代码架构、产品需求或任务计划直接生成 Canvasight 节点和连线。
- 开启画布后，让后续中大型、需要拆解的需求优先考虑写入或更新画布，再决定是否直接执行。
- 保存常用节点的标题、提示词和附件为全局模板，并在任意项目里拖回画布复用。
- 在新 Codex 线程里恢复最近使用的 Canvasight 项目。
- 让网页画布独立于单个 Codex thread 存活，当前在哪个 thread，就由哪个 thread claim 已打开项目并领取后续 Run payload。

### 核心功能

- **画布节点**：创建、拖拽、复制、删除和框选任务节点。
- **节点连接**：用连接线表达任务依赖或执行顺序。
- **项目 Page**：一个项目下可以有多个相互隔离的画布工作区。
- **附件**：支持上传、拖拽和粘贴图片到节点。
- **Markdown 预览**：把当前节点或下游流程转换成可发送给 Codex 的 Markdown。
- **AI 生成画布**：Codex 可以通过 `write_canvasight_graph` 写入 `.scatter/scatter.json`，按不同任务类型组织节点和连线，并优先复用已有全局节点模板。
- **全局节点模板**：从节点菜单把非空提示词和附件保存为本机全局模板，打开模板抽屉后可搜索、删除并拖拽到当前画布。模板库最多保存 200 个；满额后需要先管理模板，或明确替换最旧模板。
- **Codex 原生模式**：节点可选择 Chat、Plan 或 Goal。
- **Agent Team 协作**：默认开启。开启后，Run Markdown 会告诉 Codex 先按任务类型选择必要角色，并在高风险或阻断问题出现时使用 `agent-reports/` 记录 issue、solution 和集成摘要。
- **项目级 daemon**：本地网页服务独立于打开它的 Codex thread，归档旧 thread 不会直接关闭画布服务。
- **任务抽屉与设置**：查看任务清单、预览 Markdown，并调整语言和主题。
- **最近项目恢复**：跨 Codex 线程记住最近打开的项目。

### 基础用法

1. 在 Codex 中调用 `open_canvasight` 打开 Canvasight；它会启动或复用项目级本地 daemon，并把完整 URL 交给 Codex 侧边栏内置浏览器。
2. 在浏览器画布里创建任务节点，填写提示词，按需要添加附件。
3. 用连接线组织节点关系，或者在左上角创建多个 Page 管理不同工作区。
4. 选择节点的 Codex 模式：Chat、Plan 或 Goal。
5. 需要复用提示词时，从节点菜单选择“存为模板”；再从右上角模板按钮打开模板抽屉，搜索模板并拖到画布。
6. Agent Team 默认开启；如果只想让 Codex 按普通单线程上下文处理 Run，可以在设置里关闭“开启 Agent Team”。
7. 点击节点或流程的 Run。
8. 如果换到新的 Codex 线程继续使用同一个常驻网页，先调用 `claim_canvasight_thread` claim 该项目；之后点击 Run 会进入该项目的队列，再用 `await_canvasight_run` 加 `sessionId` 或 `projectPath` 在当前线程接收 Run payload。实验性的 direct delivery 仅在开发时显式设置 `CANVASIGHT_CODEX_NATIVE=1` 后启用。

画布打开后，Canvasight 会把该项目标记为 active canvas context。之后如果用户提出产品规划、代码架构分析、文章脉络梳理、复杂修复或多步骤任务，Codex 应优先判断是否调用 `write_canvasight_graph` 以 `append-page` 写入一个可编辑画布 Page，并先扫描全局节点模板摘要。简单命令、普通问答、Canvasight Run payload，或用户明确要求“直接执行”的任务，不应被强制写入画布。

在 Canvasight 已开启时，“用画布”“放到画布”“写到画布”“用 Canvasight 梳理/规划/拆解”默认表示写入 Canvasight Page、节点和连线，不是普通 HTML `<canvas>` 或前端绘图组件。只有用户明确说 HTML canvas、网页 canvas、React canvas 组件或绘图 API 时，才按普通前端 canvas 任务处理。

### AI 直接创建画布

当你希望 Codex 把代码架构、产品需求、文章脉络或执行计划变成 Canvasight 画布时，可以直接提出类似请求：

- “分析这个代码项目的架构，并生成一个 Canvasight 架构图页面。”
- “用画布梳理这个需求，并把任务拆成节点。”
- “用 Canvasight 规划这个 Figma 插件的产品、设计、开发和测试流程。”
- “把这份产品需求拆成 Canvasight 节点，按用户流程连接起来。”
- “按这篇文章的脉络生成阅读梳理节点。”
- “新增一个 Canvasight Page，包含调研、设计、开发、测试四个节点。”

如果 Canvasight 已经开启，用户不必每次重复说“生成 Canvasight 节点”。只要后续需求适合拆解、依赖关系或阶段规划，Codex 就应先考虑画布；不适合画布的轻量任务仍然直接处理。

Codex 应优先调用 `write_canvasight_graph`，而不是手写完整 JSON。该工具会写入项目下的 `.scatter/scatter.json`，默认写入模式是 `append-page`，用于避免覆盖现有画布；这只是安全默认值，不是任务分类规则。它会校验节点 id 唯一性，并要求每条连线的 `source` / `target` 都引用同一 Page 内存在的节点；连线也会遵守手动画布规则：支持一个节点连接多个下游节点，但不能自连、不能重复、一个节点不能有多个父节点。

默认布局会根据节点连线做分层排列：父节点在左，子节点在右，同层节点纵向错开并保留安全间距；没有连线的节点才使用线性或网格 fallback。AI 或用户显式传入的 `position` / `x` / `y` 会被保留，不会被自动布局覆盖。

AI 生成前应先调用 `list_canvasight_node_templates` 扫描本机全局节点模板摘要。它默认只返回轻量预览，不返回完整提示词正文和附件；若需要查看某个候选模板全文，再调用 `get_canvasight_node_template({ templateId })`。若模板符合当前节点用途，写入节点时使用 `templateId` 复用模板标题、提示词正文和附件；如果没有合适模板，再生成普通节点。

AI 生成时可以使用 `graphType` 选择节点组织策略，但分类只影响节点标题、提示词、连线结构和默认布局，不决定是否创建、切换或替换 Page：

- `software-product`：适合开发产品、功能或插件。AI 写图前会检查项目根目录是否存在 `AGENTS.md` 和 `design.md`；只有对应文件缺失时才生成起草该文档的节点，文件已存在时不判断内容完整度，同时梳理产品目标、功能边界、设计样式、技术方案、验证方式。
- `article-outline`：适合阅读文章、报告或论文。节点应跟随原文脉络，包括核心观点、章节结构、论据、案例、结论和疑问，不套用产品开发模板。
- `codebase-structure`：适合梳理代码库。节点应跟随实际目录、入口命令、核心模块、数据流、外部接口、风险区域和验证方式，不编造没有读到的模块。
- `task-plan`：适合 bug 修复、迁移、执行计划或测试计划。
- `general`：适合混合或信息不足的请求。

如果网页已经打开，`write_canvasight_graph` 会通过项目级 daemon 写入并更新该项目的文档 revision；当前浏览器会话会检测外部更新并自动重新加载，旧会话拿着过期 revision 保存时会被拒绝并重新读取最新 `.scatter/scatter.json`，避免把 AI 刚生成的 Page 覆盖掉。AI 写入画布只是创建可编辑节点和连线，不会自动运行节点；真正执行通过点击 Run 生成 payload，再由当前 Codex thread 使用 `await_canvasight_run` 接收。

### 插件安装

插件源码位于 `plugins/canvasight`，repo-local marketplace 位于 `.agents/plugins/marketplace.json`。

```bash
codex plugin marketplace add /Users/niallyoung/Desktop/Canvasight
codex plugin add canvasight@canvasight-local
```

安装或重装后，请新开 Codex 线程或 reload 当前 Codex session。已经打开的线程不会热刷新新安装的 MCP tools。

升级后可用 `codex plugin list` 确认 `canvasight@canvasight-local` 显示为 `0.1.25` 或更高版本。如果显示低于 `0.1.25`，旧的 MCP cache 可能还在运行旧版 server，请重新执行 `codex plugin add canvasight@canvasight-local` 并新开线程。

### Skills 分工

Canvasight 插件现在按任务拆成多个 Codex Skill，避免一个总入口误触发所有场景：

- `canvasight`：薄索引，用于明确提到 Canvasight/Scatter 的跨能力任务，或画布已开启后需要判断是否先写入画布的中大型请求。
- `canvasight-open`：打开网页画布、恢复最近项目、从新 Codex 线程重新 attach 到 Canvasight。
- `canvasight-run`：接收 Run payload，处理 Markdown、结构化数据和 Chat / Plan / Goal 模式。
- `canvasight-agent-team`：处理 Run 输出中的 Agent Team 协作协议，说明何时按需调用已有固定角色 agent、何时创建缺失角色、如何用带状态的 `agent-reports/` 通讯，以及如何避免把内部协作协议当成普通用户操作。
- `canvasight-graph-writer`：用 `write_canvasight_graph` 让 AI 创建或更新 Canvasight 节点和连线；画布已开启后的“用画布”“放到画布”“用 Canvasight 梳理/规划/拆解”等中大型、多步骤需求也优先由它判断是否先落成 Page。
- `canvasight-troubleshooting`：处理插件安装、MCP cache、daemon、URL 失效、连接拒绝等问题。

这些 Skill 只是 Codex 的触发与工作流分工，不改变 Canvasight 的用户界面，也不改变 Page 或节点的编辑模型。`canvasight-agent-team` 只会在 Run 输出中增加可关闭的协作协议提示。

### MCP Tools

- `open_canvasight`
- `list_canvasight_recent_projects`
- `open_canvasight_recent_project`
- `claim_canvasight_thread`
- `list_canvasight_node_templates`
- `get_canvasight_node_template`
- `write_canvasight_graph`
- `await_canvasight_run`
- `close_canvasight`

`open_canvasight` 会记住已打开项目并启动或复用项目级 daemon。它默认面向 Codex 侧边栏内置浏览器，不会再直接调用系统默认浏览器；开发调试时如需外部浏览器，可显式设置 `CANVASIGHT_OPEN_EXTERNAL_BROWSER=1`。打开后，返回结果会带上 `activeCanvasRouting` / `canvasRouting`，告诉 Codex 后续中大型需求应优先考虑 `write_canvasight_graph`，但小任务、Run payload 和明确要求直接执行的请求不强制进画布。新 Codex 线程里如果网页已经打开，先调用 `claim_canvasight_thread` claim 最近项目或指定 `projectPath`，不需要重新开网页；如果需要新 URL，再调用 `list_canvasight_recent_projects` 和 `open_canvasight_recent_project`。网页点击 Run 默认会进入 daemon 队列；`await_canvasight_run` 可以按 `sessionId` 等待，也可以按 `projectPath` attach 到同一项目的 Run 队列。实验性的 Codex app-server `turn/start` direct delivery 仅在 `CANVASIGHT_CODEX_NATIVE=1` 时启用。正常插件使用不需要手动运行 `npm run dev`。

`list_canvasight_node_templates` 返回本机全局节点模板摘要，供 AI 写图前低上下文扫描和复用；`get_canvasight_node_template` 只在选中某个候选模板后按 ID 读取完整正文和附件 metadata。`write_canvasight_graph` 让 Codex/AI 通过项目级 daemon 创建或替换 `.scatter/scatter.json` 里的 Page、节点和连线，并同步文档 revision 给当前网页会话。`mode` 决定 Page 写入行为，`graphType` 决定任务节点结构。默认模式是 `append-page`，适合在未明确要求覆盖时保护现有画布；只有在明确要覆盖内容时才使用 `replace-active-page` 或 `replace-document`。节点可传 `templateId` 或 `templateQuery` 复用模板标题、正文和附件。

### 数据存储

- 项目内容保存在项目目录下的 `.scatter/scatter.json`。
- 附件保存在 `.scatter/assets/`。
- 最近项目状态保存在本机 Canvasight 用户状态中。
- daemon 连接状态保存在本机 Canvasight 用户状态中，用于跨 Codex thread 复用本地服务。
- 全局节点模板保存在本机 Canvasight 用户状态中，不写入项目 `.scatter/scatter.json`，因此会跨项目可用。
- 模板库最多保存 200 个模板；达到上限后，GUI 会打开模板抽屉并提示管理模板或明确替换最旧模板，不会静默删除旧模板。
- 模板附件会复制到本机 Canvasight 全局模板资源目录，不引用原项目附件路径。
- AI 写入画布时优先读取模板摘要，再按需读取单个模板全文；生成的项目节点只保存复用后的节点数据和附件引用，不把模板库复制进项目。
- `.scatter/scatter.json` 保持 v1 兼容，并通过 `pages` / `activePageId` 支持项目内多个 Page。
- AI 写入画布也使用同一个 `.scatter/scatter.json` v1 协议；推荐通过 `write_canvasight_graph` 生成合法结构，而不是手动拼完整文件。
- AI 外部写入会更新项目文档 revision。网页自动保存会携带 expected revision；如果本地会话落后，保存会被拒绝并重新加载最新项目文件，不会静默覆盖外部写入。

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

`npm run dev` 会启动或复用项目级持久 dev server，默认地址是 `http://127.0.0.1:5173/`。它用于本地“运行项目”和开发预览，启动命令退出或启动它的 Codex thread 被归档后，服务仍应继续存活。裸 `5173` 页面会使用 daemon 里最新的 `claim_canvasight_thread` 项目绑定，或退回启动 dev server 时的 `CODEX_THREAD_ID`，来把 Run payload 归属到对应线程；两者都没有时返回 `unbound_dev_session`。默认不会伪装成直发成功，而是进入队列等待 `await_canvasight_run`。需要手动停止时运行 `npm run dev:stop`。

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

AI 生成画布只是写入 `.scatter/scatter.json`，创建可编辑的 Page、节点和连线。Run 是用户在网页里点击节点或流程后，把 Markdown payload 放入对应项目/thread 的队列；当前调用 `await_canvasight_run` 的 Codex thread 接管后续执行。

**Agent Team 开关是什么？**

它控制 Canvasight 生成的 Run Markdown 是否附带 Agent Team 协作协议。默认开启，适合复杂产品、设计、开发、测试、文档或 Skill 任务。开启后，如果实际启用 Agent Team 且项目缺少 `AGENTS.md`，或 `AGENTS.md` 没有固定 roster / report 协议，Canvasight 会在 Run delivery 前创建文件或追加一个带哨兵注释的最小 Agent Team 段落，让协作规则能跨 Codex thread 保留。它不会覆盖已有项目规则；如果现有规则明确禁止自动编辑或与 Canvasight 默认规则冲突，应先写 issue/risk report 并询问。之后 Codex 应优先复用项目里已有的固定角色 agent，而不是每次创建一批临时 agent；角色之间通过带状态的 `agent-reports/` 进行交接，并在接活、阻塞、解决或转交时主动回写状态和队列。关闭后，Canvasight 仍会正常返回 Markdown 和结构化数据，但不再要求 Codex 按 Agent Team / agent-report 流程执行。

**节点模板属于项目吗？**

不属于。节点模板是本机全局模板，可以跨项目复用。v1 模板保存节点标题、提示词正文和附件；不会保存 Chat、Plan、Goal、effort 或运行模式。

**模板很多时 AI 会不会爆上下文？**

默认不会直接读取全部模板正文。`list_canvasight_node_templates` 只返回模板摘要和正文预览；需要确认某个候选模板时，AI 再用 `get_canvasight_node_template` 按 `templateId` 获取单个完整模板。模板库本身最多保存 200 个模板。

**最近项目怎么恢复？**

如果旧网页还开着，在新线程里先调用 `claim_canvasight_thread`；如果需要重新打开网页，再调用 `list_canvasight_recent_projects` 和 `open_canvasight_recent_project`。

**归档启动 Canvasight 的 thread 后，网页还会活着吗？**

会。网页服务由项目级 daemon 托管，不再绑定打开它的 thread-local MCP 进程。归档旧 thread 后，旧浏览器 tab 仍可继续使用；在新 thread 继续操作前先调用 `claim_canvasight_thread`，后续 Run payload 会归属到新 thread 并等待 `await_canvasight_run` 接收。如果手动停止 daemon 或机器重启导致旧 URL 失效，再从当前 thread 重新打开最近项目即可。

**内置浏览器打不开 Canvasight 怎么办？**

`open_canvasight` 返回前会先验证完整会话 URL 可访问，并把 `openTarget` 标记为 `codex_in_app_browser`。请在 Codex 侧边栏内置浏览器打开 tool result 里的完整 `browserUrl` / `url`，不要只复制 `origin`。如果仍显示无法访问，重新调用 `open_canvasight` 或 `open_canvasight_recent_project` 获取新的 URL；如果 tool 本身报不可达，说明本机 daemon 没有成功启动或本机 `127.0.0.1` 访问被阻断。

**当前 thread 怎么接收旧网页里的 Run？**

在当前 Codex thread 里调用 `claim_canvasight_thread`，传 `projectPath` 或 `sessionId`，让旧网页后续 Run payload 归属到当前线程。点击 Run 后调用 `await_canvasight_run`；知道旧 URL 的 `sessionId` 可以传 `sessionId`，否则传 `projectPath`。

**`close_canvasight` 会停止项目级 daemon 吗？**

不会。它只关闭指定 session。开发或排障时才需要手动运行 `npm run daemon:stop` 停止 daemon。

**为什么空节点不能运行？**

Canvasight 会阻止发送没有提示词正文的节点，避免把空请求提交给 Codex。

**Plan 或 Goal 没有进入 Codex 原生模式怎么办？**

检查 Run 返回或 `await_canvasight_run` 返回的 `codexNative.status`。如果不是 `applied`，先按返回原因处理，不要把它当成普通 Chat 静默降级。

**什么时候需要 `npm run build`？**

修改插件网页源码后需要重新 build，让 daemon 托管的 `dist/` 与源码同步。只使用插件时不需要手动 build。

**Run 会直接点击 Codex 输入框吗？**

不会。Canvasight 不使用虚拟点击、辅助功能权限或剪贴板发送。Run payload 默认进入 MCP daemon 队列，并通过 `await_canvasight_run` 返回给当前 Codex thread。实验性的 Codex app-server `turn/start` direct delivery 需要显式设置 `CANVASIGHT_CODEX_NATIVE=1`。

---

## English

Canvasight is a repo-local Codex plugin. It opens a project-level persistent local browser canvas where you can break work into task nodes, connect flows, attach files, and hand generated Markdown plus structured data to the current Codex thread; by default, the current thread receives queued Run payloads through `await_canvasight_run`.

### Purpose

- Break complex requests into visual task nodes.
- Use multiple Pages inside one project to isolate canvas workspaces.
- Attach images, files, and context to task nodes.
- Send canvas output to Codex in Chat, Plan, or Goal mode.
- Include Agent Team collaboration instructions in Run output by default so complex tasks can use product, design, development, testing, documentation, skill, and project-management roles when needed.
- Let Codex generate Canvasight nodes and edges directly from code architecture, product requirements, or task plans.
- After the canvas is open, let later medium or complex requests prefer creating or updating the canvas before direct execution.
- Save reusable node titles, prompts, and attachments as global templates and drag them back into any project canvas.
- Reopen recent Canvasight projects from a new Codex thread.
- Keep the browser canvas alive outside a single Codex thread, so whichever thread is current can claim the opened project and receive the next queued Run payload.

### Core Features

- **Canvas nodes**: create, drag, copy, delete, and multi-select task nodes.
- **Connections**: represent dependencies or execution order with edges.
- **Project Pages**: keep multiple isolated canvas workspaces inside one project.
- **Attachments**: upload, drag, or paste images and files into nodes.
- **Markdown preview**: convert the current node or downstream flow into Markdown for Codex.
- **AI-generated canvas**: Codex can call `write_canvasight_graph` to write `.scatter/scatter.json`, organize nodes and edges for different task types, and reuse saved global node templates first.
- **Global node templates**: save non-empty node prompts and attachments from the node menu, search or delete them in the template drawer, and drag them into the current canvas. The library stores up to 200 templates; once full, Canvasight asks the user to manage templates or explicitly replace the oldest one.
- **Native Codex modes**: choose Chat, Plan, or Goal per node.
- **Agent Team collaboration**: enabled by default. When enabled, Run Markdown asks Codex to choose only the needed roles for the task and to use `agent-reports/` for issue reports, solution reports, and integration summaries when blockers or high-risk handoffs appear.
- **Project-level daemon**: the local web service is independent from the Codex thread that opened it, so archiving that thread does not directly stop the canvas service.
- **Task drawer and settings**: inspect the task list, preview Markdown, and adjust language or theme.
- **Recent project recovery**: remember recent projects across Codex threads.

### Basic Workflow

1. Call `open_canvasight` from Codex; it starts or reuses the project-level local daemon and hands the full URL to Codex's in-app browser sidebar.
2. Create task nodes in the browser canvas, write prompts, and add attachments when needed.
3. Connect nodes into flows, or create multiple Pages from the top-left Page switcher.
4. Choose the node's Codex mode: Chat, Plan, or Goal.
5. To reuse a prompt, choose “Save as template” from a node menu. Open the template drawer from the top-right template button, search templates, then drag one onto the canvas.
6. Agent Team is enabled by default. Turn it off in Settings if you want Codex to handle Run output as a normal single-thread task.
7. Click Run on a node or flow.
8. If you move to a new Codex thread while keeping the same persistent browser page, call `claim_canvasight_thread` for that project first; later Run clicks enter that project's queue, and the current thread receives the payload with `await_canvasight_run` by `sessionId` or `projectPath`. Experimental direct delivery is only enabled for development when `CANVASIGHT_CODEX_NATIVE=1` is set.

After opening, Canvasight marks the project as active canvas context. For later product planning, codebase architecture analysis, article mapping, complex fixes, or multi-step tasks, Codex should first decide whether to call `write_canvasight_graph` with `append-page` and scan global node template summaries. Small commands, simple Q&A, Canvasight Run payloads, and requests that explicitly ask for direct execution should not be forced into the canvas.

When Canvasight is active, phrases such as "use the canvas", "put this on the canvas", "write this to the canvas", or "use Canvasight to plan/break down this work" mean writing Canvasight Pages, nodes, and edges. Treat them as ordinary HTML `<canvas>` or frontend drawing tasks only when the user explicitly says HTML canvas, web canvas, React canvas component, or drawing API.

### AI-Generated Canvas Data

When you want Codex to turn code architecture, product requirements, an article outline, or an execution plan into a Canvasight canvas, ask for it directly:

- “Analyze this codebase architecture and generate a Canvasight architecture page.”
- “Use the canvas to break this request into task nodes.”
- “Use Canvasight to plan the product, design, development, and testing flow for this Figma plugin.”
- “Break this product requirement into Canvasight nodes and connect them by user flow.”
- “Generate reading-outline nodes that follow this article's structure.”
- “Add a Canvasight Page with research, design, development, and testing nodes.”

When Canvasight is already open, the user does not need to repeat "generate Canvasight nodes" every time. If the follow-up request benefits from decomposition, dependencies, or staged planning, Codex should consider the canvas first; lightweight tasks should still be handled directly.

Codex should prefer `write_canvasight_graph` instead of hand-writing the full JSON file. The tool writes `.scatter/scatter.json` in the target project and defaults to `mode: "append-page"` to avoid overwriting existing canvas content; this is a safe write default, not a task classification rule. It validates unique node ids plus edge `source` / `target` references within the same Page. Edges follow the same rules as manual canvas connections: one node can connect to multiple downstream nodes, but there are no self-connections, no duplicates, and no more than one parent edge into the same target node.

Default layout is edge-aware: parents are placed to the left, children to the right, nodes in the same layer are vertically staggered with safe spacing, and unconnected nodes use the linear or grid fallback. Explicit `position`, `x`, or `y` values from AI or the user are preserved instead of being overwritten by automatic layout.

Before generating a graph, Codex should call `list_canvasight_node_templates` to scan lightweight local global template summaries. It does not return full prompt bodies or attachments by default; call `get_canvasight_node_template({ templateId })` only for a selected candidate. When a template fits the current node purpose, pass its `templateId` to reuse the saved title, prompt body, and attachments; generate a normal node when no template fits.

AI generation can use `graphType` to choose a node organization strategy, but classification only affects node titles, prompt bodies, edge structure, and default layout. It does not decide whether a Page is created, switched, or replaced:

- `software-product`: for building products, features, tools, or plugins. Before writing the graph, AI checks whether root-level `AGENTS.md` and `design.md` files exist. It creates draft-document nodes only for missing files, does not judge content completeness when those files already exist, and then covers product goals, scope boundaries, design style, technical approach, and verification.
- `article-outline`: for reading articles, reports, or papers. Nodes should follow the source structure: thesis, sections, arguments, evidence, examples, conclusion, and questions instead of forcing a product-development template.
- `codebase-structure`: for inspecting repositories. Nodes should follow the actual directory structure, entry commands, core modules, data flow, external interfaces, risk areas, and verification paths without inventing uninspected modules.
- `task-plan`: for bug fixes, migrations, execution plans, or test plans.
- `general`: for mixed or underspecified requests.

If the web app is already open, `write_canvasight_graph` writes through the project-level daemon and advances that project's document revision. The current browser session detects the external update and reloads automatically; if an old session tries to save with a stale revision, Canvasight rejects that save and reloads the latest `.scatter/scatter.json` instead of overwriting the AI-generated Page. AI-generated canvas data only creates editable nodes and edges; it does not run nodes. Execution happens when the user clicks Run, which creates a payload for the current Codex thread to receive with `await_canvasight_run`.

### Plugin Installation

The plugin source lives in `plugins/canvasight`. The repo-local marketplace lives at `.agents/plugins/marketplace.json`.

```bash
codex plugin marketplace add /Users/niallyoung/Desktop/Canvasight
codex plugin add canvasight@canvasight-local
```

After installing or reinstalling the plugin, open a new Codex thread or reload the current Codex session. Already-open threads do not hot-refresh newly installed MCP tools.

After upgrading, run `codex plugin list` and confirm `canvasight@canvasight-local` shows `0.1.25` or newer. If it shows a version below `0.1.25`, the old MCP cache may still be running an older server; run `codex plugin add canvasight@canvasight-local` again and open a new thread.

### Skill Split

The Canvasight plugin now uses multiple Codex Skills so one broad entrypoint does not trigger for every Canvasight-related task:

- `canvasight`: a thin index for explicit Canvasight/Scatter requests that span multiple capabilities, or active-canvas follow-up requests that need a decision about graph-first handling.
- `canvasight-open`: opens the browser canvas, recovers recent projects, and attaches a new Codex thread to Canvasight.
- `canvasight-run`: receives Run payloads and handles Markdown, structured data, and Chat / Plan / Goal mode.
- `canvasight-agent-team`: handles Agent Team collaboration instructions included in Run output, including when Codex should call existing fixed role agents, when it may create a missing role, how status-bearing `agent-reports/` should be used for communication, and how to keep the internal collaboration protocol separate from normal user workflow.
- `canvasight-graph-writer`: uses `write_canvasight_graph` so AI can create or update Canvasight nodes and edges; it also handles medium or complex active-canvas follow-up requests such as "use the canvas", "put this on the canvas", or "use Canvasight to plan/break down this work".
- `canvasight-troubleshooting`: handles plugin installation, MCP cache, daemon, stale URL, and connection-refused issues.

These Skills only affect Codex routing and workflow instructions. They do not change the Canvasight UI, Page model, or node editing model. `canvasight-agent-team` only adds an optional collaboration protocol hint to Run output.

### MCP Tools

- `open_canvasight`
- `list_canvasight_recent_projects`
- `open_canvasight_recent_project`
- `claim_canvasight_thread`
- `list_canvasight_node_templates`
- `get_canvasight_node_template`
- `write_canvasight_graph`
- `await_canvasight_run`
- `close_canvasight`

`open_canvasight` remembers opened projects and starts or reuses the project-level daemon. It targets Codex's in-app browser sidebar by default and no longer launches the system default browser directly; for development debugging, set `CANVASIGHT_OPEN_EXTERNAL_BROWSER=1` explicitly. Its result includes `activeCanvasRouting` / `canvasRouting`, which tells Codex to prefer `write_canvasight_graph` for later medium or complex requests while leaving small tasks, Run payloads, and explicitly direct-execution requests on their normal path. In a new Codex thread, if the browser page is already open, call `claim_canvasight_thread` for the recent or explicit `projectPath` instead of opening another page; call `list_canvasight_recent_projects` and `open_canvasight_recent_project` only when a fresh URL is needed. Clicking Run in the web app queues a payload by default; `await_canvasight_run` can wait by `sessionId` or `projectPath`. Experimental Codex app-server `turn/start` direct delivery is only enabled when `CANVASIGHT_CODEX_NATIVE=1` is set. Normal plugin use does not require running `npm run dev`.

`list_canvasight_node_templates` returns local global node template summaries so AI can scan and reuse them with low context cost. `get_canvasight_node_template` reads the full body and attachment metadata for one selected template id. `write_canvasight_graph` lets Codex/AI create or replace Pages, nodes, and edges in `.scatter/scatter.json` through the project-level daemon, and it synchronizes the document revision with current web sessions. `mode` controls Page write behavior, while `graphType` controls the task node structure. Its default mode is `append-page`, which protects existing canvas content when replacement was not explicitly requested. Use `replace-active-page` or `replace-document` only when replacing existing content is explicit. Nodes can pass `templateId` or `templateQuery` to reuse a template title, body, and attachments.

### Data Storage

- Project content is stored in `.scatter/scatter.json`.
- Attachments are stored in `.scatter/assets/`.
- Recent project state is stored in local Canvasight user state.
- Daemon connection state is stored in local Canvasight user state so the local service can be reused across Codex threads.
- Global node templates are stored in local Canvasight user state, not in project `.scatter/scatter.json`, so they are reusable across projects.
- The template library stores up to 200 templates. When it is full, the GUI opens the template drawer and asks the user to manage templates or explicitly replace the oldest template instead of silently deleting older entries.
- Template attachments are copied into the local Canvasight global template asset directory instead of referencing the original project attachment path.
- AI-generated graphs read template summaries first and fetch a single full template only when needed; generated project nodes store the reused node data and attachment references without copying the template library into the project.
- `.scatter/scatter.json` remains v1-compatible and supports multiple project Pages through `pages` / `activePageId`.
- AI-generated canvas data uses the same `.scatter/scatter.json` v1 protocol. Prefer `write_canvasight_graph` to produce a valid structure instead of manually assembling the whole file.
- External AI graph writes advance the project document revision. Web autosave sends an expected revision; if the browser session is stale, the save is rejected and the latest project file is reloaded instead of silently overwriting the external write.

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

`npm run dev` starts or reuses the project-level persistent dev server, served by default at `http://127.0.0.1:5173/`. It is for local “run project” usage and development preview. The service should keep running after the launch command exits or the Codex thread that launched it is archived. A bare `5173` page uses the daemon's latest `claim_canvasight_thread` binding for the project, or falls back to the dev server process `CODEX_THREAD_ID`, to associate Run payloads with a thread; if neither exists, it returns `unbound_dev_session`. By default it queues payloads for `await_canvasight_run` instead of pretending direct delivery succeeded. Use `npm run dev:stop` when you explicitly need to stop it.

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

AI-generated canvas data writes `.scatter/scatter.json` to create editable Pages, nodes, and edges. Run happens after the user clicks a node or flow in the web app, then the Markdown payload is queued for the current Codex thread to receive with `await_canvasight_run`.

**What does the Agent Team setting do?**

It controls whether Canvasight-generated Run Markdown includes Agent Team collaboration instructions. It is enabled by default for complex product, design, development, testing, documentation, or Skill tasks. When Agent Team work is actually used and the project lacks `AGENTS.md`, or `AGENTS.md` does not include fixed roster / report protocol rules, Canvasight creates the file or appends a sentinel-wrapped minimum Agent Team section before Run delivery so the workflow survives a new Codex thread. It must not overwrite existing project rules; if existing rules explicitly forbid automated edits or conflict with Canvasight defaults, Codex should write an issue/risk report and ask first. Then Codex should reuse the project's fixed role agents instead of creating a fresh temporary team every time; role handoff happens through status-bearing `agent-reports/`, and agents must update report state plus the queue when they accept, block, solve, or hand off work. Turn it off in Settings if you want Codex to handle the Run as a normal single-thread task.

**Are node templates project-specific?**

No. Node templates are local global templates and can be reused across projects. v1 templates save the node title, prompt body, and attachments; they do not save Chat, Plan, Goal, effort, or run mode.

**Can a large template library overflow the AI context?**

By default, no. `list_canvasight_node_templates` returns summaries and body previews, not full prompt bodies. When a candidate is relevant, AI can call `get_canvasight_node_template` with its `templateId` to fetch that one full template. The library is capped at 200 templates.

**How do I recover a recent project?**

If the old browser page is still open, call `claim_canvasight_thread` in the new thread. If you need to reopen the page, call `list_canvasight_recent_projects`, then `open_canvasight_recent_project`.

**Will the page stay alive after I archive the thread that opened Canvasight?**

Yes. The web service is hosted by the project-level daemon, not the thread-local MCP process that opened it. The old browser tab can continue working after that thread is archived. Before continuing from a new thread, call `claim_canvasight_thread`; later Run clicks will be scoped to that new thread and received with `await_canvasight_run`. If the daemon is manually stopped or the machine restarts and the old URL becomes invalid, reopen the recent project from the current thread.

**What if the in-app browser cannot open Canvasight?**

`open_canvasight` verifies that the full session URL is reachable before returning and marks `openTarget` as `codex_in_app_browser`. Open the full `browserUrl` / `url` from the tool result in Codex's in-app browser sidebar, not only the `origin`. If it still cannot load, call `open_canvasight` or `open_canvasight_recent_project` again to get a fresh URL. If the tool itself reports that the URL is unreachable, the local daemon did not start successfully or local `127.0.0.1` access is blocked.

**How does the current thread receive a Run from an old browser tab?**

Call `claim_canvasight_thread` with `projectPath` or `sessionId` from the current Codex thread so an older browser tab scopes future Runs to this thread. Then call `await_canvasight_run`; pass `sessionId` if you know it from the old URL, otherwise pass `projectPath`.

**Does `close_canvasight` stop the project-level daemon?**

No. It only closes the specified session. Use `npm run daemon:stop` only during development or troubleshooting when you explicitly need to stop the daemon.

**Why can an empty node not run?**

Canvasight blocks nodes without prompt body text to avoid submitting empty requests to Codex.

**What if Plan or Goal does not enter native Codex mode?**

Check `codexNative.status` from the Run result or from `await_canvasight_run`. If it is not `applied`, handle the returned reason first instead of silently downgrading to normal Chat.

**When do I need `npm run build`?**

Run it after changing the plugin web source so the daemon's served `dist/` matches the source. Normal plugin use does not require manual builds.

**Does Run click or paste into the Codex input box?**

No. Canvasight does not use virtual clicks, Accessibility automation, or clipboard sending. Run payloads enter the MCP daemon queue by default and return through `await_canvasight_run`. Experimental Codex app-server `turn/start` direct delivery requires `CANVASIGHT_CODEX_NATIVE=1`.
