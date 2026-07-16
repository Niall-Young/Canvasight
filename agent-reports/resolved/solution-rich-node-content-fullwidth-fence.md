---
schema_version: 1
report_id: solution-rich-node-content-fullwidth-fence
report_type: solution
status: resolved
owner: Development Agent
created_by: Development Agent
priority: high
version: 1
agent_id: /root/development_agent
thread_id: null
created_at: 2026-07-16T07:44:27Z
updated_at: 2026-07-16T07:44:27Z
depends_on:
  - issue-rich-node-content-editor
related_files:
  - plugins/canvasight/src/lib/richNodeContent.ts
  - plugins/canvasight/tests/rich-node-content-smoke.mjs
  - plugins/canvasight/README.md
  - design.md
verification_status: passed
verification_evidence:
  - Product Agent confirmed that ASCII and full-width backtick fences are the same explicit code-block intent while the original body and Run text remain unchanged.
  - test:rich-content, typecheck, markdown, markdown-export, skills, concurrency, widget-runtime, MCP bundle, release verify 0.4.23, and clean plugin distribution passed.
  - Browser-visible Playwright input proved that the third full-width closing character immediately creates one rich-node-code block; cross-style opening and closing also rendered, and temporary nodes were removed.
  - canvasight@canvasight-local 0.4.23 installed successfully, but exact-version native-host acceptance still requires a Codex Desktop restart.
---

# 全角反引号围栏兼容

## 负责 Agent

Development Agent

## 对应问题

`agent-reports/assigned/issue-rich-node-content-editor.md`

## Root Cause

首版解析器只识别 ASCII `U+0060` 三反引号围栏。中文输入法可能产生全角 `U+FF40`，视觉上仍是三反引号，但解析器会将其保留为正文，因此用户看不到代码块触发。

## 推荐方案

把三个 ASCII 反引号和三个全角反引号视为同一种显式围栏意图。每条围栏行内部必须使用三个同形字符；开启行与关闭行可以跨样式，以允许编辑过程中切换输入法。解析只改变呈现，不能归一化或改写原始正文。

## 处理结果

解析器现已识别 ` ``` ` 与 `｀｀｀`，并允许两种样式跨开启/关闭行配对。内部混排、未闭合或非法围栏继续回退为可编辑纯文本。`raw`、保存、Run、导出和复制仍逐字保留用户输入。

## 修改文件

- `plugins/canvasight/src/lib/richNodeContent.ts`
- `plugins/canvasight/tests/rich-node-content-smoke.mjs`
- `plugins/canvasight/README.md`
- `design.md`
- `plugins/canvasight/.codex-plugin/plugin.json`
- `plugins/canvasight/package.json`
- `plugins/canvasight/package-lock.json`
- `plugins/canvasight/mcp/server.source.mjs`
- `plugins/canvasight/mcp/server.mjs`
- `plugins/canvasight/dist/`

## 验证方式

- `npm run test:rich-content`
- `npm run typecheck`
- `npm run test:markdown`
- `npm run test:markdown-export`
- `npm run test:skills`
- `npm run test:concurrency`
- `npm run test:widget-runtime`
- `npm run check:mcp-bundle`
- `npm run release:verify -- 0.4.23`
- `npm run test:plugin-distribution`
- Playwright 真实 contenteditable 输入与即时渲染验证
- `git diff --check`

## 后续风险

已安装 `0.4.23`，但运行中的 Codex Desktop 不会热刷新插件注册表。完整重启后仍需取得绑定精确 `0.4.23` 的 fullscreen accepted-instance、富内容交互和同任务 Run 证据；在此之前权威 issue 保持 assigned / failed。
