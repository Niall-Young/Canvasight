---
schema_version: 1
report_id: solution-skill-led-project-guidance-omission
report_type: solution
status: resolved
owner: Development Agent
created_by: Main Thread
priority: high
version: 1
agent_id: /root/development_agent
thread_id: null
created_at: 2026-07-14T07:01:00Z
updated_at: 2026-07-14T07:01:00Z
depends_on:
  - issue-skill-led-project-guidance-omission
related_files:
  - plugins/canvasight/mcp/server.source.mjs
  - plugins/canvasight/tests/mcp-smoke.mjs
verification_status: passed
verification_evidence:
  - Production build and MCP smoke passed.
  - Bundle freshness, release consistency, and plugin validation passed.
---

# 恢复 skill-led 软件产品项目指导节点

## Root Cause

项目指导生成条件把 `skill-led` 错误理解成“跳过 Canvasight 默认项目治理”，并且最终 `project_guidance_missing` 校验也带有同样的旁路。

## 解决方案

- 项目指导只按 `primaryDomain === software-product` 和 `intent !== refine` 判定，与 content mode 解耦。
- append / replace 和 merge 分别记录服务端本次生成的 guidance node id，并仅从 skill-led 必填 coverage 集合中排除这些 id。
- 最终项目指导校验对 canvasight-default 与 skill-led 一致执行。
- 用磁盘预建 `design.md` 的用例隔离验证只补 `AGENTS.md`；另加 skill-led article create 负向用例。

## 验证结果

Build、MCP smoke、bundle freshness、0.4.19 release 一致性与插件校验通过。

## 风险与回滚

影响范围仅限 software-product 非 refine 的项目治理节点。回滚会重新引入 skill-led 旁路，不涉及持久化迁移。
