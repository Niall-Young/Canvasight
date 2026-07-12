---
schema_version: 1
report_id: issue-graph-merge-validation-tests
report_type: issue
status: resolved
owner: Test Supervisor Agent
created_by: Main Thread
priority: high
version: 2
agent_id: /root/test_supervisor_agent
thread_id: 019f5424-366d-72b3-9ada-094f3d1eec7e
created_at: 2026-07-12T03:11:16Z
updated_at: 2026-07-12T03:25:19Z
depends_on:
  - issue-graph-merge-validation-runtime
related_files:
  - plugins/canvasight/tests/mcp-smoke.mjs
verification_status: passed
verification_evidence:
  - npm run test:mcp passed
  - node --check tests/mcp-smoke.mjs
  - git diff --check passed
---

# 增量写图与闭环校验回归门禁

## 问题

现有 MCP smoke 只覆盖新建、整页替换、布局与模板复用，没有当前 Page patch、revision 和校验失败不写盘的回归证据。

## 期望结果

覆盖读取上下文、增删改、稳定位置、级联连接清理、stale revision、coverage 拒绝、修正后通过和旧版 append 兼容。

## 验收

- 新测试可独立证明写入原子性和兼容边界。
- 失败断言包含机器可读错误码或 violations。

## 处理结果

已覆盖上下文读取、增删改、位置保持、级联删边、stale revision、不完整 coverage 拒绝、严格修正后写入、局部 refine 和旧 append 兼容。

## 修改文件

- `plugins/canvasight/tests/mcp-smoke.mjs`

## 后续风险

无本功能已知自动化风险。
