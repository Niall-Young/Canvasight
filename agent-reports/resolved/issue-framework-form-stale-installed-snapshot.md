---
schema_version: 1
report_id: issue-framework-form-stale-installed-snapshot
report_type: issue
status: resolved
owner: Development Agent
created_by: Main Thread
priority: high
version: 4
agent_id: /root/development_agent
thread_id: 019f6b0a-d214-7933-a56c-05cff971639b
created_at: 2026-07-16T13:14:41Z
updated_at: 2026-07-16T13:22:08Z
depends_on:
  - integration-summary-framework-choice-figma-kit-parity
related_files:
  - plugins/canvasight/.codex-plugin/plugin.json
  - plugins/canvasight/package.json
  - plugins/canvasight/package-lock.json
  - plugins/canvasight/mcp/server.source.mjs
  - plugins/canvasight/mcp/server.mjs
  - plugins/canvasight/dist
verification_status: passed
verification_evidence:
  - Version fields and MCP SERVER_VERSION are synchronized at 0.4.25.
  - Build, MCP bundle check, widget runtime smoke, clean distribution smoke, release verification, and plugin validation passed.
  - canvasight@canvasight-local 0.4.25 installed successfully and codex plugin list reports installed and enabled.
  - Repository and installed cache SHA-1 values match for FrameworkQuestionsCard.tsx, app.css, dist index, JavaScript, and CSS; installed cache plugin validation passed.
solution_report: agent-reports/resolved/solution-framework-form-stale-installed-snapshot.md
---

# 新版框架表单仍命中旧安装快照

## TL;DR

仓库已提交新版 framework question 样式，但插件版本仍为 `0.4.24`，当前 Codex 任务加载的同版本缓存快照与仓库源码和构建产物哈希不一致。

## 发现者

用户

## 提交 Agent

Main Thread

## 建议交接 Agent

Development Agent

## 问题描述

调用 `ask_canvasight_framework_questions` 时显示旧表单，而仓库当前源码已经包含新的 Figma / Scatter 选择控件样式。

## 现象

- 仓库和缓存均报告 `0.4.24`。
- `FrameworkQuestionsCard.tsx`、`app.css` 和构建 CSS 的仓库与缓存哈希不同。
- repo-local 浏览器预览显示新版，当前 Codex 插件工具仍显示旧版。

## 复现方式

1. 在当前任务调用 `ask_canvasight_framework_questions`。
2. 对比 `/Users/niallyoung/Desktop/Canvasight/plugins/canvasight` 与 `~/.codex/plugins/cache/canvasight-local/canvasight/0.4.24`。
3. 观察同版本号下资源内容不同。

## 影响范围

影响当前及未重载宿主中的 Canvasight inline framework confirmation 资源；不影响仓库源码本身。

## 证据

- 仓库组件哈希 `b7cf9345...`，缓存组件哈希 `5bac359f...`。
- 仓库样式哈希 `899989c8...`，缓存样式哈希 `17934a38...`。
- repo-local Playwright 已显示新版表单。

## 初步归因

样式提交发生在 `0.4.24` 发布之后，但未执行新的版本化安装；Codex 继续复用不可变的旧版本缓存。

## 交付给哪个 Agent

Development Agent

## 需要回答的问题

- 将完整插件快照升级到哪个补丁版本？
- 版本、MCP bundle 与 web dist 是否全部同步并通过分发验证？

## 相关文件

- `plugins/canvasight/.codex-plugin/plugin.json`
- `plugins/canvasight/package.json`
- `plugins/canvasight/package-lock.json`
- `plugins/canvasight/mcp/server.source.mjs`
- `plugins/canvasight/mcp/server.mjs`
- `plugins/canvasight/dist/`

## 期望结果

生成并安装新的不可变补丁版本，使插件缓存包含仓库当前新版表单；明确要求宿主重启后再做 native-host 验收。

## Closure Criteria

- [x] 版本字段和构建产物同步
- [x] 构建、widget runtime、分发与插件校验通过
- [x] `codex plugin list` 显示新版本
- [x] 当前宿主不可热刷新的风险被明确记录

## 当前状态

resolved

## 处理结果

仓库完整插件快照已升级到 `0.4.25`，版本字段、自包含 MCP bundle 与 web dist 已同步重建。插件已安装到 `~/.codex/plugins/cache/canvasight-local/canvasight/0.4.25`，`codex plugin list` 显示 installed/enabled，仓库与安装缓存关键文件 SHA-1 逐项一致。

## 修改文件

- `plugins/canvasight/.codex-plugin/plugin.json`
- `plugins/canvasight/package.json`
- `plugins/canvasight/package-lock.json`
- `plugins/canvasight/mcp/server.source.mjs`
- `plugins/canvasight/mcp/server.mjs`
- `plugins/canvasight/dist/`（重建后无新增 diff）
- `agent-reports/resolved/solution-framework-form-stale-installed-snapshot.md`

## 验证方式

- `npm run build`
- `npm run check:mcp-bundle`
- `npm run test:widget-runtime`
- `npm run test:plugin-distribution`
- `npm run release:verify -- 0.4.25`
- plugin validator
- `git diff --check`
- `codex plugin add canvasight@canvasight-local --json`
- `codex plugin list`
- repo 与 installed cache 的 `FrameworkQuestionsCard.tsx`、`app.css`、dist index/js/css SHA-1 逐项对比
- installed cache plugin validator

## 后续风险

安装与快照一致性已经验证，但当前 Codex Desktop 进程和任务仍可能持有旧注册表。必须重启宿主、创建新任务，并验证 inline 表单与 native widget ready acknowledgement；当前任务不能热刷新旧资源，本 issue 不宣称 native-host 验收通过。
