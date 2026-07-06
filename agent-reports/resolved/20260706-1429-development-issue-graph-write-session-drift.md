---
status: resolved
report_type: issue
owner: Development Agent
created_by: Product Agent
priority: high
created_at: 2026-07-06 14:29
updated_at: 2026-07-06 14:46
related_files:
  - /Users/niallyoung/.codex/attachments/ed711a7c-a9d6-407b-b1b2-d634eef8ce16/pasted-text.txt
  - plugins/canvasight/mcp/server.mjs
  - plugins/canvasight/src/App.tsx
  - plugins/canvasight/src/lib/canvasightApi.ts
  - plugins/canvasight/shared/types.ts
  - plugins/canvasight/skills/canvasight-graph-writer/SKILL.md
solution_report: agent-reports/resolved/20260706-1446-development-solution-graph-write-session-drift.md
---

# AI 写图后当前 Canvasight session 与 .scatter 文件漂移

## TL;DR

实际测试中，`write_canvasight_graph` 写入的新页面没有稳定出现在当前浏览器 session，且旧 session 的自动保存可能把外部写入覆盖回旧状态。

## 发现者

User

## 提交 Agent

Product Agent

## 建议交接 Agent

Development Agent

## 问题描述

用户在测试“用 Canvasight 来做 React/Vite 个人网站规划”时，AI 通过 Canvasight 写图后，浏览器里看不到新页面；后续检查显示 `.scatter/scatter.json` 被旧 session 状态覆盖，导致写入结果丢失。附件还暴露出“用画布”被误解为普通 HTML canvas 的路由问题。

## 现象

- AI 调用 `write_canvasight_graph` append 新 Page 后，用户当前 Canvasight UI 未看到新页。
- 后续 `.scatter/scatter.json` 恢复成旧状态，新增 v2 页面消失。
- 需要手动使用当前 session 的 `/document` 接口覆盖文档，才让用户看到结果。
- “用画布”在用户意图是 Canvasight 时被解释成普通前端 canvas。

## 复现方式

1. 打开 Canvasight 项目并保持浏览器 session 活跃。
2. 通过 MCP `write_canvasight_graph` 对同一项目 append 一个新 Page。
3. 不刷新浏览器，让旧 session 触发自动保存。
4. 观察 `.scatter/scatter.json` 是否仍包含新 Page，以及当前 session 是否能看到它。

## 影响范围

- AI 写 Canvasight 节点/连线的可信度。
- 当前项目当前 session 的一致性。
- 用户对 “用 Canvasight / 用画布” 工作流的信任。

## 证据

- 附件记录中出现 “`.scatter` 被旧 session 状态覆盖回去了”。
- 当前前端只在初始加载时读取 session/openProject，之后自动保存本地 Zustand 状态。
- 当前 MCP `writeScatterGraph` 写文件后没有通知或保护已有浏览器 session。

## 初步归因

Canvasight 缺少文档版本/修订号机制。外部写图和浏览器自动保存都是直接写 `.scatter/scatter.json`，没有 stale-write 保护，也没有让前端发现外部文档已更新并 reload。

## 交付给哪个 Agent

Development Agent

## 需要回答的问题

- 如何在不引入云同步或复杂实时协作的情况下，避免 stale browser session 覆盖外部写图？
- 如何让当前打开的 Canvasight session 检测到外部写图后自动 reload？
- Skill/README 是否需要说明 “Canvasight active context + 用画布” 应优先走 graph writer？

## 相关文件

- `plugins/canvasight/mcp/server.mjs`
- `plugins/canvasight/src/App.tsx`
- `plugins/canvasight/src/lib/canvasightApi.ts`
- `plugins/canvasight/shared/types.ts`
- `plugins/canvasight/tests/mcp-smoke.mjs`
- `plugins/canvasight/skills/canvasight-graph-writer/SKILL.md`

## 期望结果

- `write_canvasight_graph` append/replace 后，新文档成为项目最新版本。
- 当前打开的 session 能检测到项目文档更新并 reload 到最新页面。
- 旧 session 的自动保存不能覆盖更新后的 `.scatter`。
- “用 Canvasight / 用画布” 类请求在 Canvasight active context 下优先 graph writer，不跑偏成普通 HTML canvas。

## Closure Criteria

- [ ] 问题原因明确
- [ ] 方案报告已回写
- [ ] 修改文件已记录
- [ ] 验证方式已记录
- [ ] 后续风险已记录

## 当前状态

resolved

## 处理结果

已修复。`write_canvasight_graph` 改为经项目级 daemon 写入；daemon 为项目文档维护 revision 和写锁；网页保存必须携带 expected revision，旧保存会被拒绝并触发重新加载。Skill/README/design/troubleshooting 也补充了 active Canvasight context 下“用画布”的路由边界。

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

未跑独立浏览器自动重载视觉测试；本轮用 MCP smoke 覆盖 daemon revision、stale save 拒绝和缺失 expectedRevision 拒绝，用 TypeScript 覆盖前端 API 合约。
