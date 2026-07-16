---
schema_version: 1
report_id: solution-framework-form-stale-installed-snapshot-test
report_type: solution
status: resolved
owner: Test Supervisor Agent
created_by: Test Supervisor Agent
priority: high
version: 2
agent_id: /root/test_supervisor_agent
thread_id: 019f6b11-e89a-7ee3-a880-3716dcf1f79c
created_at: 2026-07-16T13:19:50Z
updated_at: 2026-07-16T13:20:56Z
depends_on:
  - issue-framework-form-stale-installed-snapshot
  - solution-framework-form-stale-installed-snapshot
related_files:
  - plugins/canvasight/.codex-plugin/plugin.json
  - plugins/canvasight/package.json
  - plugins/canvasight/package-lock.json
  - plugins/canvasight/mcp/server.source.mjs
  - plugins/canvasight/src/components/FrameworkQuestionsCard.tsx
  - plugins/canvasight/src/styles/app.css
  - plugins/canvasight/dist
verification_status: passed
verification_evidence:
  - Independent release verification synchronized manifest, package, lock, lock root, and MCP server at 0.4.25.
  - Composed production widget runtime, clean 16-tool plugin distribution, and plugin validator passed.
  - A non-installed candidate snapshot matched repository FrameworkQuestionsCard, app.css, index.html, JavaScript, and CSS asset hashes and differed from the 0.4.24 cache source files.
  - Agent Team validator was invoked from the packaged Skill path; it failed on pre-existing legacy report, template, and QUEUE debt and did not name this test report.
---

# 0.4.25 新版框架表单候选快照独立测试

## 负责 Agent

Test Supervisor Agent

## 对应问题

`agent-reports/resolved/issue-framework-form-stale-installed-snapshot.md`

## Root Cause

旧 `0.4.24` 缓存与仓库中后续提交的 framework question 视觉资源共享同一版本身份。不可变插件缓存不会用同版本仓库内容热替换，因此必须用新的完整补丁快照携带新版表单。

## 调研过程

- 在 Development Agent 冻结构建后，独立读取 issue version 3，保持其 `Development Agent` owner 不变。
- 独立检查五处版本身份和 release snapshot 元数据。
- 运行 production widget、clean distribution 与 plugin validator。
- 将工作区插件复制为不安装的候选快照，逐字节比较新版组件、样式与 `dist` 资产，并对比旧 `0.4.24` 缓存。

## 可选方案

- 仅相信 Development Agent 的验证记录：缺少独立复核，不采用。
- 独立重跑门禁并做候选快照哈希比对：能证明待安装内容包含新版资源，采用。

## 推荐方案

允许 Main Thread 安装当前 `0.4.25` 完整候选快照。安装后仍需通过 `codex plugin list` 核对解析版本，并重启 Codex Desktop、创建新任务完成真实 inline 表单与 native widget 验收。

## 实施步骤

1. 运行 `npm run release:verify -- 0.4.25`。
2. 运行 `npm run test:widget-runtime` 与 `npm run test:plugin-distribution`。
3. 运行 plugin validator。
4. 复制不含 `node_modules` 的候选快照，比较源码与构建资产哈希。

## 风险与回滚

本测试未安装、未 stage、未 commit。若后续安装或宿主验收失败，保留旧 `0.4.24` 安装并停止完成声明；不得用同版本覆盖缓存。自动化与候选快照哈希不能替代重启后的真实 Codex host 视觉验收。

## 处理结果

通过。`0.4.25` 候选快照满足安装前版本、运行时、分发、结构与资源一致性门禁。

## 修改文件

- `agent-reports/resolved/solution-framework-form-stale-installed-snapshot-test.md`
- `ROSTER.md`（仅 Test Supervisor Agent 席位）

## 验证方式

- `npm run release:verify -- 0.4.25`：passed；manifest/package/lock/lock root/server 全部为 `0.4.25`，7 个 Skills 纳入快照。
- `npm run test:widget-runtime`：passed；composed production widget smoke passed。
- `npm run test:plugin-distribution`：passed；16 tools，候选分发无 `node_modules` 或 caches。
- `python3 /Users/niallyoung/.codex/skills/.system/plugin-creator/scripts/validate_plugin.py /Users/niallyoung/Desktop/Canvasight/plugins/canvasight`：passed。
- `FrameworkQuestionsCard.tsx` 仓库与候选快照 SHA-256：`59bf81d4161c95af2f7ff2766c7e54c7740d214f13a1837db07127f2e4447c57`。
- `src/styles/app.css` 仓库与候选快照 SHA-256：`25fbfab92ba6cbb9ff923a95dd4148e50367c1aaf3553a76a193b2334264014d`。
- `dist/index.html`、`dist/assets/index-B5Uw7hTO.js`、`dist/assets/index-CjQSIJG_.css` 仓库与候选快照哈希分别一致为 `655d1972...`、`b8f24f20...`、`d64a1de3...`。
- 候选 `FrameworkQuestionsCard.tsx` 包含 `assistant-provider-card` 与 `kit-checkbox`，`app.css` 包含 framework choice override 和 `background-input`；两份源码均与旧 `0.4.24` 缓存不相同。
- `node plugins/canvasight/skills/canvasight-agent-team/scripts/validate-agent-team.mjs --root /Users/niallyoung/Desktop/Canvasight`：已执行；因既有 legacy 根报告、旧模板与 `QUEUE.md` 债务失败，过滤结果未指向本测试报告。

## 后续风险

- 本轮按职责不安装，因此尚无 `codex plugin list` 的 `0.4.25` 解析证据。
- 当前宿主和当前任务不会热刷新插件注册快照。
- 必须重启 Codex Desktop 并在新任务中目视确认新版 inline 表单；native widget 仍需完整 ready acknowledgement、可见画布、有效控件和同任务 Run 证据。
- Agent Team 全仓 validator 仍被本轮范围外的历史 schema 与 queue 债务阻断。
