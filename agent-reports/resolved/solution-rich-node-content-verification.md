---
schema_version: 1
report_id: solution-rich-node-content-verification
report_type: solution
status: resolved
owner: Test Supervisor Agent
created_by: Test Supervisor Agent
priority: high
version: 1
agent_id: /root/test_supervisor_agent
thread_id: null
created_at: 2026-07-16T06:31:18Z
updated_at: 2026-07-16T06:31:18Z
depends_on:
  - issue-rich-node-content-editor
  - solution-rich-node-content-editor
  - solution-rich-node-content-test-plan
related_files:
  - plugins/canvasight/src/lib/richNodeContent.ts
  - plugins/canvasight/src/components/RichNodeBody.tsx
  - plugins/canvasight/src/components/TaskNode.tsx
  - plugins/canvasight/src/store/scatterStore.ts
  - plugins/canvasight/src/App.tsx
  - plugins/canvasight/tests/rich-node-content-smoke.mjs
  - plugins/canvasight/tests/markdown-flow-smoke.mjs
  - plugins/canvasight/tests/markdown-export-smoke.mjs
  - plugins/canvasight/tests/skills-smoke.mjs
  - plugins/canvasight/tests/concurrent-document-smoke.mjs
verification_status: passed
verification_evidence:
  - Re-read issue-rich-node-content-editor immediately before this report at owner Development Agent, status assigned, version 2; this report does not change the issue, roster, or queue.
  - Latest test:rich-content, typecheck, build, test:markdown, test:markdown-export, test:skills, and test:concurrency commands all exited 0 after the four browser-driven fixes.
  - Latest test:widget-runtime exited 0 and check:mcp-bundle reported the 977610-byte MCP bundle current; these are supporting checks, not native-host proof.
  - Independent browser review found the Chinese punctuation URL bug and verified its fix; final full browser evidence and shared-page interaction closure are owned by Main Thread.
---

# 节点富内容编辑器独立验证

## 负责 Agent

Test Supervisor Agent

## 对应问题

`agent-reports/assigned/issue-rich-node-content-editor.md`（最终写入前重读为 `Development Agent / assigned / version 2`）。

## 验证结论

最新冻结源码的自动化、类型检查、生产构建和下游合同回归全部通过。独立浏览器审查暴露的中文 URL 边界问题已修复并复验；其余由浏览器过程发现的 selection-first、legacy 图片展示和原生 undo/read DOM 复用风险均已由 Main Thread 修入源码并加入聚焦回归或结构性防护。

本报告只证明自动化门禁和已列出的独立浏览器证据。Main Thread 负责最终完整浏览器验收；真实 native Widget gate 已触发且尚不能由 smoke 替代，因此父 issue 在取得最终证据前应保持 assigned。

## 自动化命令与结果

在 `/Users/niallyoung/Desktop/Canvasight/plugins/canvasight` 运行：

| 命令 | 结果 | 关键证据 |
| --- | --- | --- |
| `npm run test:rich-content` | PASS | byte-for-byte body roundtrip、闭合/未闭合围栏、mention、安全 URL、中文句读、显式图片锚点、legacy 图片不自动内嵌、anchor append/remove |
| `npm run typecheck` | PASS | `tsc --noEmit` 无错误 |
| `npm run test:markdown` | PASS | 当前节点加下游顺序、原始正文、Skill map 与 Run Markdown 合同保持 |
| `npm run test:markdown-export` | PASS | Markdown/ZIP、绝对路径移除、同名附件去重与失败传播保持 |
| `npm run test:skills` | PASS | `$` query、完整目录、插入、caret placement 和键盘合同保持 |
| `npm run test:concurrency` | PASS | 三方 merge、conflict copy、replay/daemon restart 与 legacy stale 合同保持 |
| `npm run build` | PASS | MCP bundle 重建、TypeScript、Vite production build 均通过；仅有既有大 chunk 提示 |
| `npm run test:widget-runtime` | PASS | `Canvasight composed production widget smoke passed.` |
| `npm run check:mcp-bundle` | PASS | `MCP bundle is current (977610 bytes)` |
| `git diff --check` | PASS | 当前 worktree 无 whitespace error |

npm 仅报告 `shamefully-hoist`、`auto-install-peers`、`strict-peer-dependencies` 将在未来 npm 版本停止支持的配置警告；不影响本轮退出码。Vite 报告主 chunk 大于 500 kB，属于既有性能提示，不是本功能失败。

## 四项修复复核

### Legacy 图片保留附件 chip

- `resolveBodyImageAnchors` 现在只返回显式 `bodyImageAnchors`；无锚点历史图片不再被隐式放到正文末尾。
- `TaskNode` 的附件列表只过滤真正进入正文的图片 ID，因此 legacy 图片继续显示在 `attachment-grid`。
- `test:rich-content` 明确断言“only explicitly anchored images enter rich body content”和“legacy unanchored images stay in the attachment surface”。

### 中文链接边界

- 独立浏览器首次复现 `https://example.com/a_(b)，不安全` 被整体编码进 href，判定为阻断。
- 修复后 `linkPattern` 在 `，。！？；：、` 处终止；聚焦 smoke 增加 `https://example.com/path，后续正文`。
- 新 daemon-backed dev session 的可访问性快照显示链接文本/href 精确为 `https://example.com/a_(b)`，`，不安全 javascript:alert(1)` 留在普通文本中。

### Selection-first 正文编辑

- 初次浏览器检查发现只读分支未转发 `onPointerDown`，节点选中后正文仍无法进入编辑。
- 最新源码在 `data-rich-body-read` 分支传回 `onPointerDown`。
- 修复后独立检查确认首次点击使节点进入 `is-selected` 且正文仍为 read mode，后续正文点击得到 active `textbox`/contenteditable surface。

### 编辑/阅读 DOM 隔离

- 浏览器过程发现原生 undo/redo 后退出编辑可能恢复旧子树并产生重复视觉内容。
- 最新源码为编辑和阅读分支分别使用 `key="rich-node-editor"` 与 `key="rich-node-read"`，强制切换 DOM 身份。
- 独立过程在被要求停止共享页面写操作前，确认 fenced body 的 `data-rich-body-value` 保留原始围栏、连续 Meta+Z 后正文只出现一次；最新 key 修复后的“输入 → undo/redo → 退出编辑无重复”最终浏览器证据由 Main Thread 完成，本报告不重复写该 Page。

## 浏览器证据边界

Test Supervisor 使用 daemon session 加载当前 Vite 源码，仅取得以下独立证据：

- 围栏代码以 `<pre><code>` 语义出现，安全链接是带 `noopener noreferrer` 的真实 `<a>`，非法协议保持普通文本。
- 中文链接边界的失败复现和修复后精确 href 复验。
- selection-first 的 read → selected → active contenteditable 转换。
- 普通输入后 `data-rich-body-value` 保留围栏与原始正文；有限原生 undo 未产生重复根内容。

为避免与 Main Thread 在同一测试 Page 上产生并发编辑，Test Supervisor 已按指令关闭 Playwright session。以下最终浏览器证据由 Main Thread 提供并写入集成总结：

- 实际 IME composition 候选不落中间态、纯文本 paste 和连续 undo/redo 后退出编辑无重复；
- `$skill` picker 键盘/定位、代码块内光标、节点拖拽/缩放、链接鼠标与键盘激活；
- 图片首/中/尾、多图同偏移、粘贴/拖入/选择、加载失败、删除/撤销、保存刷新；
- 浅色/深色、窄窗口、长代码、焦点环、屏幕阅读语义与控制台错误检查。

## 原生 Widget Gate

**已触发，尚缺真实宿主证据。** 虽然本轮没有修改 MCP、widget bootstrap、`canvasight_widget_api` 或 Run bridge，但新增了 native Widget 内的可点击外部链接，并把图片阅读从附件 chip 扩展到正文内嵌，实际行为依赖 sandboxed widget 的宿主导航与既有附件代理。因此 browser/dev 与 composed widget smoke 不能完成最终验收。

关闭父 issue 或发布前，Main Thread 仍需在精确交付快照上完成：

1. 安装/加载精确插件快照；若 Desktop 已缓存旧 snapshot，reload/restart 后新建并标记 task。
2. `open_canvasight` 后以同一 `threadId`、`sessionId`、`openAttemptId` 等待 instance-bound fullscreen ready。
3. 在 accepted instance 内完成至少一次富内容编辑，确认内嵌图片通过 native attachment proxy 加载，并验证安全链接的宿主行为不破坏画布。
4. 点击节点 Run，确认原始 `body`、`@plugin`/`$skill` 与附件引用到达同一 Codex task。
5. 确认 late metadata 不会把界面退回 Connecting。

若真实 native gate 无法执行，集成总结必须标为 `unverified`，不得声称 native Widget 已验证或本 issue 已完整关闭。

## 处理结果

自动化与独立审查范围通过；四项修复已在最新源码中复核。完整浏览器证据由 Main Thread 收口，真实 native Widget gate 仍是交付阻断项。

## 修改文件

- `agent-reports/resolved/solution-rich-node-content-verification.md`

## 验证方式

- 见“自动化命令与结果”“四项修复复核”“浏览器证据边界”和“原生 Widget Gate”。

## 后续风险

- `contenteditable` 的 IME、selection、native undo 栈和 `execCommand("insertText")` 仍有宿主差异，必须以 Main Thread 的最终浏览器证据为准。
- native Widget 外部链接和图片代理尚未取得真实 accepted-instance 证据。
- 本轮没有修改 authority issue、ROSTER 或 QUEUE；它们应由 Main Thread 按 report → roster → queue 顺序完成收口。
