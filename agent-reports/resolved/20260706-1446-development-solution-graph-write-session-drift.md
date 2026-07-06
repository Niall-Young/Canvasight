---
status: resolved
report_type: solution
owner: Development Agent
created_by: Development Agent
priority: high
created_at: 2026-07-06 14:46
updated_at: 2026-07-06 14:46
related_issue: agent-reports/resolved/20260706-1429-development-issue-graph-write-session-drift.md
related_files:
  - plugins/canvasight/mcp/server.mjs
  - plugins/canvasight/src/App.tsx
  - plugins/canvasight/src/lib/canvasightApi.ts
  - plugins/canvasight/shared/types.ts
  - plugins/canvasight/vite.config.ts
  - plugins/canvasight/tests/mcp-smoke.mjs
---

# 解决 AI 写图与浏览器会话漂移

## 负责 Agent

Development Agent

## 对应问题

`agent-reports/resolved/20260706-1429-development-issue-graph-write-session-drift.md`

## Root Cause

`write_canvasight_graph` 原先可在短生命周期 MCP 进程中直接写 `.scatter/scatter.json`，而浏览器 session 仍持有旧的内存文档并继续自动保存。两条写入路径没有共享 revision、写锁或 stale-save 保护，导致 AI 写入的新 Page 可能被旧 session 覆盖；Skill 触发面也没有明确把 active Canvasight context 下的“用画布”解释为 Canvasight graph writing。

## 调研过程

- 复盘用户在新测试项目中的附件记录，确认问题发生在目标项目 `.scatter` 文件和当前网页 session 之间，不是 Canvasight 仓库数据本身。
- 检查 MCP `write_canvasight_graph`、HTTP session `/document` 保存和前端 autosave 路径，确认缺少文档版本判断。
- Development Agent 复核后指出旧客户端缺失 `expectedRevision` 仍可能保存、并发写入存在 race、Vite dev API 仍是旧协议，本轮已补齐。

## 可选方案

- 方案 A：只在前端收到 409 后提示用户刷新。实现简单，但无法阻止旧 bundle 或并发写覆盖。
- 方案 B：为项目文档增加 daemon 内 revision 和 per-project 写锁，浏览器保存必须携带 expected revision，AI 写图统一走 daemon，并让前端轮询 revision 自动重载。
- 方案 C：引入完整实时协作或文件 watcher。能力更强，但超出当前本地插件 v1 范围。

## 推荐方案

采用方案 B。它保持本地文件协议和现有 `.scatter/scatter.json` v1 不变，同时用最小同步契约阻止 stale browser session 覆盖 AI 写图，并让当前页面自动加载最新 Page。

## 实施步骤

1. 在 daemon 中维护 `projectDocumentRevisions` 和 `projectWriteLocks`。
2. 将 `write_canvasight_graph` 改为通过 daemon `/api/graphs/write` 写入，写入后 bump revision。
3. 修改 `/api/sessions/:id/document`：要求 numeric `expectedRevision`，在写锁内 check/write/bump；缺失或过期时返回 `409 stale_document`。
4. 前端保存时发送 expected revision；保存成功更新本地 revision；保存冲突或轮询发现外部 revision 更新时自动重新打开当前项目并跳过下一次 autosave。
5. 同步 Vite dev API 的 revision envelope，避免开发模式绕过保护。
6. 更新 Skill、README、design.md 和 troubleshooting 文档，把“用画布”路由与外部写图同步行为写清楚。
7. 补充 MCP smoke 断言 revision 增长、session revision 同步、旧 revision 保存 409、缺失 expectedRevision 保存 409。

## 风险与回滚

风险：未跑独立浏览器可视化自动重载测试；本轮通过 API 合约和 TypeScript 覆盖核心路径。回滚方式是恢复 0.1.17 相关提交并重新安装插件，但会重新暴露旧会话覆盖 AI 写图的风险。

## 处理结果

已修复。

## 修改文件

- `plugins/canvasight/mcp/server.mjs`
- `plugins/canvasight/src/App.tsx`
- `plugins/canvasight/src/lib/canvasightApi.ts`
- `plugins/canvasight/shared/types.ts`
- `plugins/canvasight/vite.config.ts`
- `plugins/canvasight/tests/mcp-smoke.mjs`
- `plugins/canvasight/skills/canvasight/SKILL.md`
- `plugins/canvasight/skills/canvasight-graph-writer/SKILL.md`
- `plugins/canvasight/skills/canvasight-graph-writer/references/graph-writing.md`
- `plugins/canvasight/skills/canvasight-troubleshooting/references/troubleshooting.md`
- `README.md`
- `design.md`

## 验证方式

- `npm run typecheck`
- `npm run test:mcp`
- `npm run test:dev-server`
- `npm run build`
- `python3 /Users/niallyoung/.codex/skills/.system/plugin-creator/scripts/validate_plugin.py /Users/niallyoung/Desktop/Canvasight/plugins/canvasight`
- `python3 /Users/niallyoung/.codex/skills/.system/skill-creator/scripts/quick_validate.py /Users/niallyoung/Desktop/Canvasight/plugins/canvasight/skills/canvasight`
- `python3 /Users/niallyoung/.codex/skills/.system/skill-creator/scripts/quick_validate.py /Users/niallyoung/Desktop/Canvasight/plugins/canvasight/skills/canvasight-graph-writer`

## 后续风险

- 如果用户或外部进程绕过 daemon 直接修改 `.scatter/scatter.json`，当前 revision map 不会自动发现；后续可考虑 file stat/hash watcher。
- 当前 dirty local edit 遇到外部 AI 写图时会以最新 daemon 文档为准自动重载；后续可做更细的冲突 UI。
