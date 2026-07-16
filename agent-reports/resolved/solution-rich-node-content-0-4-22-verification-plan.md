---
schema_version: 1
report_id: solution-rich-node-content-0-4-22-verification-plan
report_type: solution
status: resolved
owner: Test Supervisor Agent
created_by: Test Supervisor Agent
priority: high
version: 2
agent_id: /root/test_supervisor_agent
thread_id: null
created_at: 2026-07-16T07:07:18Z
updated_at: 2026-07-16T07:12:08Z
depends_on:
  - issue-rich-node-content-editor
  - solution-rich-node-content-verification
related_files:
  - plugins/canvasight/.codex-plugin/plugin.json
  - plugins/canvasight/package.json
  - plugins/canvasight/package-lock.json
  - plugins/canvasight/mcp/server.source.mjs
  - plugins/canvasight/mcp/server.mjs
  - plugins/canvasight/dist/index.html
  - plugins/canvasight/src/components/RichNodeBody.tsx
  - plugins/canvasight/src/lib/richNodeContent.ts
  - plugins/canvasight/tests/rich-node-content-smoke.mjs
verification_status: passed
verification_evidence:
  - Immediately before writing, issue-rich-node-content-editor was re-read as owner Development Agent, status assigned, version 5; this report does not modify that issue or its derived queue row.
  - The user screenshot shows plain-text rendering at local 15:00:33; lifecycle evidence records the corresponding fullscreen accepted instance as ready at 2026-07-16T07:00:26.624Z from pluginRoot /Users/niallyoung/.codex/plugins/cache/canvasight-local/canvasight/0.4.21.
  - The installed 0.4.21 cache index references index-D6XIKfJR.js; that asset has no data-rich-body-read, data-rich-body-editor, rich-node-read, rich-node-editor, or bodyImageAnchors markers.
  - The repository candidate index references index-BjZxRkgc.js; that asset contains data-rich-body-read, data-rich-body-editor, rich-node-read, rich-node-editor, and bodyImageAnchors markers.
  - The stale installed snapshot, not the supplied rich-content text, is sufficient to explain why token, link, and fenced-code styling were all absent in the screenshot.
  - Post-install verification passed release:verify 0.4.22, check:mcp-bundle, and test:plugin-distribution; synchronized manifest, package, lock, lock root, MCP server, and installed cache manifest versions are all 0.4.22.
  - codex plugin list reports canvasight@canvasight-local installed and enabled at 0.4.22; the installed cache and repository both reference index-BjZxRkgc.js and index-UvAyIrHj.css, with identical SHA-256 values and byte comparisons.
  - The 0.4.22 cache JS contains data-rich-body-read, data-rich-body-editor, rich-node-read, rich-node-editor, rich-node-mention, and bodyImageAnchors.
  - Native acceptance remains not run for 0.4.22: lifecycle has zero 0.4.22 canvasight_open_attempt_ready records, and the latest accepted instance remains the stale 0.4.21 snapshot.
---

# 0.4.22 富内容交付验证方案

## 负责 Agent

Test Supervisor Agent

## 对应问题

`agent-reports/assigned/issue-rich-node-content-editor.md`（写入前重读为 `Development Agent / assigned / version 5`）。

## Root Cause

用户截图中的节点由旧的已安装 `0.4.21` 缓存快照渲染，并非仓库里的富内容候选构建。截图对应时间附近的 lifecycle 证据给出了完整的 fullscreen ready acknowledgement，但该实例的 `pluginRoot` 始终是 `/Users/niallyoung/.codex/plugins/cache/canvasight-local/canvasight/0.4.21`。

旧缓存的 `dist/index.html` 引用 `index-D6XIKfJR.js`，该文件不包含富内容 DOM 和数据标记；仓库候选引用 `index-BjZxRkgc.js`，并包含 `data-rich-body-read`、`data-rich-body-editor`、`rich-node-read`、`rich-node-editor` 和 `bodyImageAnchors`。因此本次现象首先是交付快照未进入 Desktop 缓存，不能用截图否定仓库实现，也不能把旧实例的 ready 当作候选版本原生验收。

## 触发语法复核

- `$build-ios-apps:ios-app-intents`：属于显式 `$skill` 形式，0.4.22 候选中应显示为紧凑标签；Run 仍输出原始文本。
- `https://x.com/home`：属于允许的 `https` URL，阅读态应显示为安全链接。
- 截图中的 ````` mdakfa`` 没有形成闭合围栏，因此按已确认合同应安全回退为普通文本。代码块的最小触发样例是独立的开始围栏、正文和结束围栏：

  ````text
  ```text
  mdakfa
  ```
  ````

- 即使代码围栏未闭合，截图中的 `$skill` 和 `https` 也应分别呈现；三者全部为纯文本进一步支持“旧缓存快照”归因。

## 0.4.22 最小验证矩阵

| 门禁 | 操作 | PASS 证据 | 失败处理 |
| --- | --- | --- | --- |
| 版本字段 | 检查 `.codex-plugin/plugin.json`、`package.json`、`package-lock.json` 根版本与 root package 版本、`mcp/server.source.mjs` `SERVER_VERSION` | 五处均精确为 `0.4.22`，无旧 `0.4.21` runtime identity | 阻断构建、安装和发布 |
| Release 一致性 | `npm run release:verify -- 0.4.22` | 版本、plugin identity、构建资产与 Skill frontmatter 全部通过 | 不创建 tag、Release 或移动 `stable` |
| MCP bundle | `npm run check:mcp-bundle` | committed `mcp/server.mjs` 与 source 重建结果一致 | 重新生成 bundle 后重跑全矩阵 |
| 安装分发 | `npm run test:plugin-distribution` | 无 `node_modules` 快照仍注册全部预期工具 | 阻断安装和 native 验收 |
| Cache 快照 | 安装精确 `0.4.22` 后检查 `codex plugin list`、cache manifest、`dist/index.html` 与主 JS | resolved plugin/cache 路径是 `.../0.4.22`；主 JS 至少包含 `data-rich-body-read`、`data-rich-body-editor`、`bodyImageAnchors`，并与交付构建主 JS 的 SHA-256 一致 | 判定为 stale/wrong snapshot；不得打开旧实例补证 |
| Browser 可见 | 在真实 Canvasight browser/dev 页面新建含正文、闭合围栏、`@canvasight`、`$build-ios-apps:ios-app-intents`、多个 `http/https` URL 和光标内嵌图片的节点 | 代码、标签、链接和图片均在阅读/编辑态可辨；保存刷新后不漂移；Run/导出原文不变 | 阻断 native 与 Git closure |
| 重启后 Native | 完整退出并重启 Codex Desktop，在新建并标记的 task 中调用 `open_canvasight`，再用同一 `threadId/sessionId/openAttemptId` 等待 ready | lifecycle 的 ready record 同时满足 `version=0.4.22`、`pluginRoot=.../0.4.22`、具体 fullscreen `widgetInstanceId`、`verified=true`、React/project/canvas 全部 ready 且尺寸非零 | 保持父 issue `assigned/failed`，不得发布或宣称交付 |
| Native 富内容与 Run | 在上述 accepted instance 内创建同一触发样例，编辑并刷新，加载内嵌图片，激活安全链接，再运行节点 | 截图/交互证明富内容实际出现；图片经 native asset proxy 加载；Run 到达同一 task 且文本/附件引用不漂移；late metadata 不回退 Connecting | 阻断父 issue closure 与提交 |

## 0.4.22 Post-install 复验结果

| 门禁 | 结果 | 本轮证据 |
| --- | --- | --- |
| 版本字段 | PASS | manifest、package、lock、lock root、`SERVER_VERSION` 与 cache manifest 均为 `0.4.22` |
| Release 一致性 | PASS | `npm run release:verify -- 0.4.22` 返回 `status: verified`，7 个 Skill frontmatter 有效 |
| MCP bundle | PASS | `npm run check:mcp-bundle` 返回 bundle current，大小 977610 bytes |
| 安装分发 | PASS | `npm run test:plugin-distribution` 在无 `node_modules` / cache 的临时快照注册 16 个工具 |
| 安装解析 | PASS | `codex plugin list` 报告 `canvasight@canvasight-local` 为 `installed, enabled 0.4.22` |
| Cache 主资产名 | PASS | repo 与 cache 的 `dist/index.html` 均引用 `index-BjZxRkgc.js` 和 `index-UvAyIrHj.css` |
| Cache 字节与 SHA | PASS | JS SHA-256 均为 `90abd9c6f8108b34a07c64d78bf5c22e45baceef287fc85ca2d68a423cc1762e`；CSS 均为 `ef377e3745e9d97dde86053cf008774625bd5072514e7b5cc68b8df93b427e67`；index/JS/CSS 均通过 `cmp` |
| Cache 富内容 marker | PASS | cache JS 包含 `data-rich-body-read`、`data-rich-body-editor`、`rich-node-read`、`rich-node-editor`、`rich-node-mention`、`bodyImageAnchors` |
| Browser 可见 | REUSED PASS | 复用冻结候选的既有真实 browser/dev 证据：围栏代码、能力标签、安全链接、内嵌图片、保存刷新和 Run/导出回归均已通过；该证据证明相同 repo Web snapshot，不替代 native 证据 |
| 重启后 Native | NOT RUN / BLOCKING | 当前 Codex Desktop 尚未完整重启；lifecycle 中 `0.4.22` ready 记录数为 0，最后一次 ready 仍是 `0.4.21` |
| Native 富内容与 Run | NOT RUN / BLOCKING | 必须在重启后的新建并标记 task、精确 `0.4.22` accepted instance 内执行 |

## 执行顺序

1. Development Agent 完成 `0.4.22` 版本同步和精确构建，不直接修改既有 `0.4.21` cache。
2. Test Supervisor 在仓库候选上执行 release、bundle、distribution、富内容与 browser 门禁。
3. 安装完整不可变 `0.4.22` 快照，核对 cache marker 和主 JS SHA-256；若路径仍为 `0.4.21`，停止 native 验收。
4. 完整重启 Codex Desktop，新建并标记 task 后重新打开 Canvasight。
5. 只接受绑定 `0.4.22` cache 的 instance-bound fullscreen ready；在同一实例内完成富内容、图片、链接、Run 和 late metadata 验收。
6. 全部门禁通过后才允许 Development Agent 更新父 issue 证据，再由 Main Thread 冻结范围并交 Project Management Agent 做选择性提交。

## 处理结果

已独立确认用户看到的是旧 `0.4.21` 缓存 UI，并冻结、执行了 `0.4.22` 的非重启 post-install 验证。版本、Release 一致性、MCP bundle、clean distribution、安装解析、cache asset 名称、SHA、字节一致性和富内容 marker 全部通过；既有 browser-visible 证据可复用到同一 repo Web snapshot，但不替代原生证据。

真实 `0.4.22` native accepted-instance、富内容交互、图片代理、同 task Run 和 late-metadata 稳定性尚未执行。父 issue 必须继续保持 `assigned / failed`，直到 Desktop 完整重启后取得精确 `0.4.22` instance-bound 证据。

## 修改文件

- `agent-reports/resolved/solution-rich-node-content-0-4-22-verification-plan.md`
- `ROSTER.md`（本报告成功写入后仅同步 Test Supervisor Agent 席位）

## 验证方式

- 对比 cache 与 repo 的 `dist/index.html` 主资产引用。
- 对两个主 JS 执行富内容 marker 搜索和 SHA-256 比对。
- 检查 `2026-07-16T07:00:26.624Z` ready record 与 `15:00:33` 附近 widget API 请求的 `version/pluginRoot`。
- 复核 `package.json` 中 release、MCP bundle、plugin distribution、rich-content 和 build scripts 均存在。
- `npm run release:verify -- 0.4.22`、`npm run check:mcp-bundle`、`npm run test:plugin-distribution`。
- 对 repo/cache 的 `dist/index.html`、主 JS 和 CSS 执行资产名核对、`shasum -a 256` 与 `cmp`。
- `codex plugin list` 与 lifecycle 中 `0.4.22` `canvasight_open_attempt_ready` 计数。

## 后续风险

- 同一版本号下直接修改仓库不会刷新 Codex Desktop 已加载的不可变 cache；必须使用新版本并重启宿主。
- 只有 cache marker 存在仍不足以通过 native gate，必须取得绑定精确 `0.4.22` 快照的 ready、可见交互和同 task Run 证据。
- `codex plugin list` 已解析为 `0.4.22` 并不代表当前运行中的 Desktop 已刷新 app-level plugin registry；本轮未重启，lifecycle 也没有任何 `0.4.22` ready 记录。
- 截图中的未闭合代码围栏按合同保持纯文本，这是预期回退；验收样例必须使用闭合围栏，避免把语法边界误判为实现失败。
- 本报告不修改父 issue 或 QUEUE；后续父 issue 状态和证据只由当前 owner Development Agent 乐观更新。
