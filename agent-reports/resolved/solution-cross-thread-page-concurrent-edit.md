---
schema_version: 1
report_id: solution-cross-thread-page-concurrent-edit
report_type: solution
status: resolved
owner: Development Agent
created_by: Development Agent
priority: high
version: 2
agent_id: /root/development_agent
thread_id: null
created_at: 2026-07-13T14:44:33Z
updated_at: 2026-07-13T14:59:51Z
depends_on:
  - issue-cross-thread-page-concurrent-edit
related_files:
  - plugins/canvasight/mcp/server.source.mjs
  - plugins/canvasight/shared/types.ts
  - plugins/canvasight/src/App.tsx
  - plugins/canvasight/skills/canvasight-graph-writer/SKILL.md
  - plugins/canvasight/tests/concurrent-document-smoke.mjs
verification_status: passed
verification_evidence:
  - npm run typecheck
  - npm run test:concurrency
  - npm run test:widget-runtime
  - npm run test:mcp
  - npm run test:skills
  - npm run build
  - npm run check:mcp-bundle
  - npm run test:plugin-distribution
  - npm run test:update
  - npm run release:verify -- 0.4.14
  - plugin validator passed
---

# Canvasight 人机并发写入自动重基方案

## Root Cause

AI 在 `get_canvasight_graph_context` 后生成内容期间，Widget 的拖动、编辑或 Page 切换会推进 document revision。旧 `write_canvasight_graph` 只比较 `expectedRevision`，因此合法 AI 写入直接返回 `stale_document`；旧 Widget 保存同样会在 stale 后重载磁盘内容，存在丢失未保存输入的风险。

## 推荐方案

- `get_canvasight_graph_context` 返回 daemon 内的 `contextId`、revision 和 document version，绑定基础 Page 快照一小时；每项目最多保留 64 份。
- 现代 `merge-active-page` 提交 context、expected revision 和稳定 mutation ID。daemon 先在基础 Page 上应用并验证 AI candidate，再在项目写锁内对最新目标 Page 自动重基。
- 不同对象自动合并；人工语义内容和人工坐标在同对象冲突时保留在原 Page，完整 AI candidate 写入唯一 ID 的 AI 冲突副本。目标 Page 被删除时仅创建 AI 恢复副本。
- 旧/no-context AI 调用继续严格 revision 校验。过期 context 返回 `context_expired`，Skill 在总计三次预算内重新读取并重建一次。
- UI 保存使用 base/local/current 三方合并和 durable receipt；请求期间的新输入重放到保存响应之上。AI 冲突提示使用去重 FIFO、“查看 AI 版本”且不自动跳 Page；人工—人工冲突保留原有“查看原页面”语义。

## 处理结果

- Page 切换不再重定向 AI；拖动现有节点不会阻断 AI 内容写入，人工最新坐标始终保留。
- AI 先写或人工先写的同对象竞态都让人工版本留在原 Page，并完整保存 AI 版本。
- mutation replay、响应丢失和 daemon 重启不会重复推进 revision 或重复创建冲突/恢复副本。
- 版本已同步为 0.4.14，MCP bundle 与 web distribution 已重新生成。

## 验证方式

- 并发 smoke 覆盖 Page 切换、拖动、同对象双顺序、双 AI、context 丢失、daemon 重启 replay、legacy stale、唯一 ID 和无悬空连线。
- 类型、MCP、Widget、Skill、构建、bundle、无 node_modules 分发、更新矩阵、release gate 和 plugin validator 全部通过。

## 后续风险

- 真实 native-host 验收必须安装精确 0.4.14 并重启 Codex Desktop；当前自动验证不能替代 fullscreen ready、控件、同任务 Run、真实并发操作和 late metadata 证据。
- Widget smoke 尚未提供可控延迟 `/document` 响应，保存请求期间继续输入的浏览器级竞态仍需在原生验收或后续 focused smoke 中补证。
