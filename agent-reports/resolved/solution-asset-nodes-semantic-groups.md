---
schema_version: 1
report_id: solution-asset-nodes-semantic-groups
report_type: solution
status: resolved
owner: Development Agent
created_by: Main Thread
priority: high
version: 1
agent_id: /root/development_agent
thread_id: null
created_at: 2026-08-04T12:56:19Z
updated_at: 2026-08-04T12:56:19Z
depends_on:
  - issue-asset-nodes-semantic-groups
related_files:
  - plugins/canvasight/shared/types.ts
  - plugins/canvasight/mcp/server.source.mjs
  - plugins/canvasight/src
  - plugins/canvasight/tests
verification_status: passed
verification_evidence:
  - Automated 0.5.0 regression matrix passed
  - Playwright visible UI workflow passed
---

# 资产节点与语义 Group 实施方案

## 负责 Agent

Development Agent，Main Thread 负责跨层集成。

## 对应问题

`agent-reports/resolved/issue-asset-nodes-semantic-groups.md`

## Root Cause

Canvasight 的持久化、画布组件、Run、Markdown 和 AI 图写入都把 Node 隐式等同于 Task；附件只是 Task 的内嵌字段，Page 与 Node 之间没有可持久化的语义容器。

## 推荐方案

引入 `.scatter` v2 判别联合，以 `parentId` 表达单层归属，以 Page `viewState` 保存折叠状态；v1 只读打开，首次使用新对象时原子升级并创建一次备份。UI、Run、导出、AI 和并发统一消费同一领域模型。

## 实施步骤

1. 建立 Task、Asset、Group 类型、双读持久化和一次性备份。
2. 实现 Asset 导入、附件提升、预览、角色、搜索、连接和 Run。
3. 实现 Group 创建、拖入拖出、坐标转换、折叠、聚合边和组内 Run。
4. 扩展 Markdown、Graph Context/Writer、两层布局、冲突合并与幂等重试。
5. 同步 0.5.0 版本、MCP bundle、Skills、README、design.md 与 AGENTS.md。

## 风险与回滚

旧 v1 文件未在打开时改写；删除 Asset 不删除托管文件，删除 Group 只解除归属。发生问题时可回退应用版本并使用一次性 v1 备份，现有 v2 数据不会被静默降级。

## 处理结果

已完成。

## 修改文件

- `plugins/canvasight/shared/types.ts`
- `plugins/canvasight/mcp/server.source.mjs` 与生成的 `mcp/server.mjs`
- `plugins/canvasight/src/`、`plugins/canvasight/vite.config.ts`
- `plugins/canvasight/tests/`
- `plugins/canvasight/skills/canvasight-graph-writer/`
- `README.md`、`design.md`、`AGENTS.md`

## 验证方式

- `npm run build`、`check:mcp-bundle`、Markdown/Rich Text/Skill/Dev Server/MCP/Concurrency/Widget/Distribution/Update 测试。
- `release:verify -- 0.5.0`、插件验证、七个 Skill quick validation。
- Playwright 可见验证及文件级 v2/备份复核。

## 后续风险

真实 Codex native-host 验收尚无可重启宿主证据，维持 `unverified`；未执行安装、发布、推送或 stable 推进。
