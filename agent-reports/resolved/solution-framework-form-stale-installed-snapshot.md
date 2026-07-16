---
schema_version: 1
report_id: solution-framework-form-stale-installed-snapshot
report_type: solution
status: resolved
owner: Development Agent
created_by: Development Agent
priority: high
version: 2
agent_id: /root/development_agent
thread_id: 019f6b0a-d214-7933-a56c-05cff971639b
created_at: 2026-07-16T13:17:35Z
updated_at: 2026-07-16T13:22:08Z
depends_on:
  - issue-framework-form-stale-installed-snapshot
related_files:
  - plugins/canvasight/.codex-plugin/plugin.json
  - plugins/canvasight/package.json
  - plugins/canvasight/package-lock.json
  - plugins/canvasight/mcp/server.source.mjs
  - plugins/canvasight/mcp/server.mjs
  - plugins/canvasight/dist
verification_status: passed
verification_evidence:
  - release:prepare synchronized manifest, package, lock root, and MCP SERVER_VERSION to 0.4.25 and rebuilt the immutable MCP and web snapshots.
  - build, MCP bundle check, composed production widget runtime smoke, and clean plugin distribution smoke all passed.
  - release:verify 0.4.25 and plugin validation passed.
  - canvasight@canvasight-local 0.4.25 installed successfully and codex plugin list reports installed and enabled.
  - Repository and installed cache SHA-1 values match for FrameworkQuestionsCard.tsx, app.css, dist index, JavaScript, and CSS; installed cache plugin validation passed.
---

# 将新版框架表单封装为 0.4.25 不可变快照

## 负责 Agent

Development Agent

## 对应问题

`agent-reports/resolved/issue-framework-form-stale-installed-snapshot.md`

## Root Cause

框架表单视觉改动提交后仍沿用已发布的 `0.4.24` 版本号。Codex 插件缓存按版本保存不可变快照，因此同为 `0.4.24` 的仓库内容不会替换已经加载的旧缓存，当前宿主也不会热刷新资源。

## 调研过程

- 复核 issue version 2 的仓库与缓存哈希证据。
- 确认发布脚本会统一更新 manifest、package、lock root 和 MCP `SERVER_VERSION`，并重建自包含 MCP 与 web dist。
- 独立重跑构建、bundle、widget runtime、clean distribution、release 和插件校验，排除只改版本号或构建产物过期。

## 可选方案

- 继续复用 `0.4.24`：无法打破 Codex 的不可变版本缓存，拒绝采用。
- 发布新的补丁快照 `0.4.25`：版本身份与新版表单资源一一对应，采用。

## 推荐方案

使用仓库既有 `release:prepare` 流程生成完整 `0.4.25` 快照；Main Thread 已完成安装和 `codex plugin list` 验证，重启后的 native-host 验收继续留在集成阶段。

## 实施步骤

1. 执行 `npm run release:prepare -- 0.4.25`。
2. 独立执行 build、MCP bundle、widget runtime 和 clean distribution 验证。
3. 执行 `npm run release:verify -- 0.4.25` 与 plugin validator。

## 风险与回滚

`0.4.25` 已安装到独立不可变缓存。若后续 native-host 验收失败，仍可保留 `0.4.24` 用于回滚诊断；不得用同版本覆盖缓存。必须重启 Codex Desktop 并新建任务后才能做 native widget 验收。

## 处理结果

已生成、验证并安装 `0.4.25` 完整快照；`codex plugin list` 显示 installed/enabled，仓库与安装缓存关键源码和 dist SHA-1 逐项一致。Development Agent 未 stage、未 commit。

## 修改文件

- `plugins/canvasight/.codex-plugin/plugin.json`
- `plugins/canvasight/package.json`
- `plugins/canvasight/package-lock.json`
- `plugins/canvasight/mcp/server.source.mjs`
- `plugins/canvasight/mcp/server.mjs`
- `plugins/canvasight/dist/`（重建后内容与已提交新版表单产物一致，无新增 diff）

## 验证方式

- `npm run build`
- `npm run check:mcp-bundle`
- `npm run test:widget-runtime`
- `npm run test:plugin-distribution`
- `npm run release:verify -- 0.4.25`
- `python3 /Users/niallyoung/.codex/skills/.system/plugin-creator/scripts/validate_plugin.py /Users/niallyoung/Desktop/Canvasight/plugins/canvasight`
- `git diff --check`
- `codex plugin add canvasight@canvasight-local --json`
- `codex plugin list`
- 仓库与 `~/.codex/plugins/cache/canvasight-local/canvasight/0.4.25` 的组件、样式和 dist SHA-1 对比
- installed cache plugin validator

## 后续风险

宿主重启、新任务 native widget ready acknowledgement 和新版表单目视验收仍属于安装集成阶段；本 solution 不宣称当前任务已热加载新版资源。
