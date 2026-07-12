---
schema_version: 1
report_id: solution-graph-merge-validation-tests
report_type: solution
status: resolved
owner: Test Supervisor Agent
created_by: Test Supervisor Agent
priority: high
version: 1
agent_id: /root/test_supervisor_agent
thread_id: 019f5424-366d-72b3-9ada-094f3d1eec7e
created_at: 2026-07-12T03:25:19Z
updated_at: 2026-07-12T03:25:19Z
depends_on:
  - issue-graph-merge-validation-tests
related_files:
  - plugins/canvasight/tests/mcp-smoke.mjs
verification_status: passed
verification_evidence:
  - npm run test:mcp passed
  - node --check and diff check passed
---

# 增量写图回归解决方案

MCP smoke 现覆盖上下文读取、六类 operation、原位置保持、级联删边、stale revision、候选拒绝不写盘、严格合同修正、局部 refine 与旧 append 兼容；并清理三处阻止全套测试到达新断言的既有合同漂移。
