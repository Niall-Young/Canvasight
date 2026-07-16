---
schema_version: 1
report_id: solution-rich-node-content-versioned-snapshot
report_type: solution
status: resolved
owner: Development Agent
created_by: Development Agent
priority: high
version: 1
agent_id: /root/development_agent
thread_id: null
created_at: 2026-07-16T07:08:07Z
updated_at: 2026-07-16T07:08:07Z
depends_on:
  - issue-rich-node-content-editor
related_files:
  - plugins/canvasight/.codex-plugin/plugin.json
  - plugins/canvasight/package.json
  - plugins/canvasight/package-lock.json
  - plugins/canvasight/mcp/server.source.mjs
  - plugins/canvasight/mcp/server.mjs
  - plugins/canvasight/dist/index.html
  - plugins/canvasight/dist/assets/index-BjZxRkgc.js
  - plugins/canvasight/dist/assets/index-UvAyIrHj.css
verification_status: passed
verification_evidence:
  - Active native lifecycle evidence points at /Users/niallyoung/.codex/plugins/cache/canvasight-local/canvasight/0.4.21, whose Web snapshot references index-D6XIKfJR.js and lacks rich-node-mention and bodyImageAnchors.
  - npm run release:prepare -- 0.4.22 synchronized manifest, package, lock root, and SERVER_VERSION, regenerated the self-contained MCP bundle, typechecked, and rebuilt the Web snapshot.
  - npm run release:verify -- 0.4.22, test:rich-content, typecheck, check:mcp-bundle, test:plugin-distribution, and plugin validation passed.
  - Repository dist/index.html references index-BjZxRkgc.js and index-UvAyIrHj.css; the JS bundle contains rich-node-mention and bodyImageAnchors.
---

# 节点富内容版本化快照修复

## 负责 Agent

Development Agent

## 对应问题

`agent-reports/assigned/issue-rich-node-content-editor.md` v5

## Root Cause

用户截图中的 native fullscreen Canvasight 确实已经 ready，但 lifecycle 绑定的是 Codex 插件缓存 `/Users/niallyoung/.codex/plugins/cache/canvasight-local/canvasight/0.4.21`。该缓存的 `dist/index.html` 仍引用旧 `index-D6XIKfJR.js`，bundle 中不存在 `rich-node-mention` 或 `bodyImageAnchors`；因此页面继续显示旧 textarea 体验。

仓库工作树中的富内容实现和 `dist/assets/index-BjZxRkgc.js` 已经存在，但此前版本仍为 `0.4.21`，Codex Desktop 没有版本边界可用于刷新已解析的安装快照。实际根因是 active installed snapshot stale，不是用户输入的 `$skill`、URL 或围栏代码没有命中解析规则。

## 调研过程

- 对照 native lifecycle 的 `pluginRoot` 与仓库路径，确认当前实例来自版本缓存而不是 checkout。
- 对照两份 `dist/index.html`：缓存引用 `index-D6XIKfJR.js`，仓库引用 `index-BjZxRkgc.js`。
- 在缓存 bundle 检索 `rich-node-mention` / `bodyImageAnchors` 均无结果；仓库 bundle 同时包含两者。
- 复核发布脚本，确认 `release:prepare` 会同步 manifest、package、lock 与 `SERVER_VERSION`，随后生成 MCP 和 Web snapshot。

## 可选方案

- 方案 A：继续使用 `0.4.21`，只让用户刷新当前画布。Codex Desktop 仍可能复用相同版本缓存，不能建立精确交付边界，拒绝采用。
- 方案 B：把完整插件候选升级为 `0.4.22`，重建一致 MCP/Web snapshot，之后通过安装流程和 Desktop reload 获取精确版本的 native accepted-instance 证据。采用该方案。

## 推荐方案

使用 `0.4.22` 作为最小版本化修复边界。本轮只生成可交付快照，不安装、不发布、不提交，也不修改 `stable`。后续由 Main Thread 按现有安装流程安装完整 snapshot，reload/restart Codex Desktop，再在新建且已标记的 task 中重新打开并验收。

## 实施步骤

1. 运行 `npm run release:prepare -- 0.4.22`，同步 `.codex-plugin/plugin.json`、`package.json`、`package-lock.json` 和 `mcp/server.source.mjs` 的版本。
2. 由脚本重新生成自包含 `mcp/server.mjs`，执行 TypeScript 检查并重建 `dist/`。
3. 执行 release、富内容、MCP bundle、clean distribution 和插件结构验证，确认新 snapshot 自洽。

## 风险与回滚

`0.4.22` 目前只是工作树候选，尚未安装到 `canvasight-local` 缓存，也没有通过新版本的 native fullscreen accepted-instance 门禁。若后续 native 验收失败，应保留 issue 为 `assigned/failed`，不发布、不更新 `stable`，并继续以旧缓存与新 snapshot 的 lifecycle/bundle 差异定位。回滚只需放弃本轮版本化候选；本轮没有改变用户数据或安装状态。

## 处理结果

已生成版本一致的 Canvasight `0.4.22` 完整候选快照。manifest、package、lock、MCP `SERVER_VERSION`、生成 MCP bundle 与 Web `dist/` 保持一致；仓库 bundle 明确包含富内容标签与图片锚点实现。

## 修改文件

- `plugins/canvasight/.codex-plugin/plugin.json`
- `plugins/canvasight/package.json`
- `plugins/canvasight/package-lock.json`
- `plugins/canvasight/mcp/server.source.mjs`
- `plugins/canvasight/mcp/server.mjs`
- `plugins/canvasight/dist/index.html`
- `plugins/canvasight/dist/assets/index-BjZxRkgc.js`
- `plugins/canvasight/dist/assets/index-UvAyIrHj.css`

## 验证方式

- `npm run release:prepare -- 0.4.22`：通过；五处版本字段一致并生成 MCP/Web snapshot。
- `npm run release:verify -- 0.4.22`：通过；版本、插件 identity、built assets 与 7 个 Skill frontmatter 有效。
- `npm run test:rich-content`：通过。
- `npm run typecheck`：通过。
- `npm run check:mcp-bundle`：通过，bundle 当前为 977610 bytes。
- `npm run test:plugin-distribution`：通过，clean snapshot 注册 16 个工具且不依赖 `node_modules` 或缓存。
- plugin validator：通过。
- `git diff --check`：通过。

## 后续风险

- 必须安装完整 `0.4.22` snapshot 并 reload/restart Codex Desktop；仅刷新当前画布或新建 task 不能保证 Desktop 的 app-level plugin registry 已刷新。
- reload 后需要在新建且已标记的 task 中取得精确 `0.4.22` 的 instance-bound fullscreen ready、可见非零画布、富内容可见交互、同 task Run 和 late-metadata 稳定证据。
- 在上述 native 门禁完成前，父 issue 继续保持 `assigned` / `verification_status: failed`，不得宣称富内容已在 native 交付完成。
