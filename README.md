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
- 在新 Codex 线程里恢复最近使用的 Canvasight 项目。
- 让网页画布独立于单个 Codex thread 存活，当前在哪个 thread，就由哪个 thread 获取 Run payload。

### 核心功能

- **画布节点**：创建、拖拽、复制、删除和框选任务节点。
- **节点连接**：用连接线表达任务依赖或执行顺序。
- **项目 Page**：一个项目下可以有多个相互隔离的画布工作区。
- **附件**：支持上传、拖拽和粘贴图片到节点。
- **Markdown 预览**：把当前节点或下游流程转换成可发送给 Codex 的 Markdown。
- **Codex 原生模式**：节点可选择 Chat、Plan 或 Goal。
- **项目级 daemon**：本地网页服务独立于打开它的 Codex thread，归档旧 thread 不会直接关闭画布服务。
- **任务抽屉与设置**：查看任务清单、预览 Markdown，并调整语言和主题。
- **最近项目恢复**：跨 Codex 线程记住最近打开的项目。

### 基础用法

1. 在 Codex 中调用 `open_canvasight` 打开 Canvasight；它会启动或复用项目级本地 daemon。
2. 在浏览器画布里创建任务节点，填写提示词，按需要添加附件。
3. 用连接线组织节点关系，或者在左上角创建多个 Page 管理不同工作区。
4. 选择节点的 Codex 模式：Chat、Plan 或 Goal。
5. 点击节点或流程的 Run。
6. 当前 Codex 线程调用 `await_canvasight_run` 读取生成的 Markdown 和结构化数据，然后继续执行任务。新线程可以用 `projectPath` attach 到同一项目队列。

### 插件安装

插件源码位于 `plugins/canvasight`，repo-local marketplace 位于 `.agents/plugins/marketplace.json`。

```bash
codex plugin marketplace add /Users/niallyoung/Desktop/Canvasight
codex plugin add canvasight@canvasight-local
```

安装或重装后，请新开 Codex 线程或 reload 当前 Codex session。已经打开的线程不会热刷新新安装的 MCP tools。

### MCP Tools

- `open_canvasight`
- `list_canvasight_recent_projects`
- `open_canvasight_recent_project`
- `await_canvasight_run`
- `close_canvasight`

`open_canvasight` 会记住已打开项目并启动或复用项目级 daemon。新 Codex 线程里可以先调用 `list_canvasight_recent_projects`，再调用 `open_canvasight_recent_project` 恢复最近画布。`await_canvasight_run` 可以按 `sessionId` 等待，也可以按 `projectPath` attach 到同一项目的 Run 队列；payload 由当前调用它的 Codex thread 接收。正常插件使用不需要手动运行 `npm run dev`。

### 数据存储

- 项目内容保存在项目目录下的 `.scatter/scatter.json`。
- 附件保存在 `.scatter/assets/`。
- 最近项目状态保存在本机 Canvasight 用户状态中。
- daemon 连接状态保存在本机 Canvasight 用户状态中，用于跨 Codex thread 复用本地服务。
- `.scatter/scatter.json` 保持 v1 兼容，并通过 `pages` / `activePageId` 支持项目内多个 Page。

### 开发命令

```bash
cd plugins/canvasight
npm install
npm run daemon
npm run daemon:stop
npm run typecheck
npm run build
npm run test:mcp
```

`npm run daemon` 和 `npm run daemon:stop` 只用于开发或排障时手动启动/停止常驻服务。`npm run dev` 只用于开发网页应用。正常 Codex 插件使用由 MCP tool 自动启动 daemon，并由 daemon 托管已构建的 `dist/`。

### 插件校验

```bash
python3 /Users/niallyoung/.codex/skills/.system/plugin-creator/scripts/validate_plugin.py /Users/niallyoung/Desktop/Canvasight/plugins/canvasight
```

### 常见问题

**新线程还要重新 `npm run dev` 吗？**

不需要。正常插件使用会通过项目级 daemon 打开已构建网页。只有开发调试前端时才需要 `npm run dev`。

**安装后看不到 Canvasight 工具怎么办？**

新开 Codex 线程或 reload 当前 Codex session。已经打开的线程通常不会热刷新新安装或更新后的 MCP tools。

**Page 和项目有什么区别？**

项目对应一个本地目录和 `.scatter` 数据。Page 是同一个项目下相互隔离的画布工作区。

**最近项目怎么恢复？**

在新线程里先调用 `list_canvasight_recent_projects`，再调用 `open_canvasight_recent_project`。

**归档启动 Canvasight 的 thread 后，网页还会活着吗？**

会。网页服务由项目级 daemon 托管，不再绑定打开它的 thread-local MCP 进程。归档旧 thread 后，旧浏览器 tab 仍可继续使用；如果手动停止 daemon 或机器重启导致旧 URL 失效，再从当前 thread 重新打开最近项目即可。

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
- Reopen recent Canvasight projects from a new Codex thread.
- Keep the browser canvas alive outside a single Codex thread, so whichever thread is current can receive the next Run payload.

### Core Features

- **Canvas nodes**: create, drag, copy, delete, and multi-select task nodes.
- **Connections**: represent dependencies or execution order with edges.
- **Project Pages**: keep multiple isolated canvas workspaces inside one project.
- **Attachments**: upload, drag, or paste images and files into nodes.
- **Markdown preview**: convert the current node or downstream flow into Markdown for Codex.
- **Native Codex modes**: choose Chat, Plan, or Goal per node.
- **Project-level daemon**: the local web service is independent from the Codex thread that opened it, so archiving that thread does not directly stop the canvas service.
- **Task drawer and settings**: inspect the task list, preview Markdown, and adjust language or theme.
- **Recent project recovery**: remember recent projects across Codex threads.

### Basic Workflow

1. Call `open_canvasight` from Codex; it starts or reuses the project-level local daemon.
2. Create task nodes in the browser canvas, write prompts, and add attachments when needed.
3. Connect nodes into flows, or create multiple Pages from the top-left Page switcher.
4. Choose the node's Codex mode: Chat, Plan, or Goal.
5. Click Run on a node or flow.
6. The current Codex thread calls `await_canvasight_run` to receive Markdown and structured data, then continues the task. A new thread can attach to the same project queue with `projectPath`.

### Plugin Installation

The plugin source lives in `plugins/canvasight`. The repo-local marketplace lives at `.agents/plugins/marketplace.json`.

```bash
codex plugin marketplace add /Users/niallyoung/Desktop/Canvasight
codex plugin add canvasight@canvasight-local
```

After installing or reinstalling the plugin, open a new Codex thread or reload the current Codex session. Already-open threads do not hot-refresh newly installed MCP tools.

### MCP Tools

- `open_canvasight`
- `list_canvasight_recent_projects`
- `open_canvasight_recent_project`
- `await_canvasight_run`
- `close_canvasight`

`open_canvasight` remembers opened projects and starts or reuses the project-level daemon. In a new Codex thread, call `list_canvasight_recent_projects` and then `open_canvasight_recent_project` to reopen the last canvas. `await_canvasight_run` can wait by `sessionId`, or attach to the same project run queue by `projectPath`; the payload is received by the current Codex thread that calls it. Normal plugin use does not require running `npm run dev`.

### Data Storage

- Project content is stored in `.scatter/scatter.json`.
- Attachments are stored in `.scatter/assets/`.
- Recent project state is stored in local Canvasight user state.
- Daemon connection state is stored in local Canvasight user state so the local service can be reused across Codex threads.
- `.scatter/scatter.json` remains v1-compatible and supports multiple project Pages through `pages` / `activePageId`.

### Development Commands

```bash
cd plugins/canvasight
npm install
npm run daemon
npm run daemon:stop
npm run typecheck
npm run build
npm run test:mcp
```

`npm run daemon` and `npm run daemon:stop` are only for manual development or troubleshooting. `npm run dev` is only for web app development. Normal Codex plugin use starts the daemon automatically through the MCP tool, and the daemon serves the built `dist/` app.

### Plugin Validation

```bash
python3 /Users/niallyoung/.codex/skills/.system/plugin-creator/scripts/validate_plugin.py /Users/niallyoung/Desktop/Canvasight/plugins/canvasight
```

### FAQ

**Do I need to run `npm run dev` again in a new thread?**

No. Normal plugin use opens the built web app through the project-level daemon. Use `npm run dev` only for frontend development.

**What if Canvasight tools do not appear after installation?**

Open a new Codex thread or reload the current Codex session. Already-open threads usually do not hot-refresh newly installed or updated MCP tools.

**What is the difference between a Page and a project?**

A project maps to a local directory and `.scatter` data. A Page is an isolated canvas workspace inside that project.

**How do I recover a recent project?**

In a new thread, call `list_canvasight_recent_projects`, then call `open_canvasight_recent_project`.

**Will the page stay alive after I archive the thread that opened Canvasight?**

Yes. The web service is hosted by the project-level daemon, not the thread-local MCP process that opened it. The old browser tab can continue working after that thread is archived. If the daemon is manually stopped or the machine restarts and the old URL becomes invalid, reopen the recent project from the current thread.

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
