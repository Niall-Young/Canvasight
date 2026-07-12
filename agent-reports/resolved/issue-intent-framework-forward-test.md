---
schema_version: 1
report_id: issue-intent-framework-forward-test
report_type: issue
status: resolved
owner: Product Agent
created_by: Main Thread
priority: high
version: 2
agent_id: /root/product_agent
thread_id: 019f5424-366d-72b3-9ada-094f3d1eec7e
created_at: 2026-07-12T03:18:00Z
updated_at: 2026-07-12T03:25:19Z
depends_on:
  - issue-intent-framework-skill
related_files:
  - plugins/canvasight/skills/canvasight-graph-writer/SKILL.md
  - plugins/canvasight/skills/canvasight-graph-writer/references
verification_status: passed
verification_evidence:
  - Product Agent evaluated four raw routing scenarios
  - refine full-contract conflict reproduced and corrected
  - minimal refine regression passes in npm run test:mcp
---

# 组合式思考框架前向测试

## 问题

静态文件和 coverage keys 通过校验不能证明真实用户表达会正确路由到 intent、domain、maturity、output 和 Page mode。

## 期望结果

使用产品创建、代码库分析、当前节点细化和三轮修正失败四类原始请求进行独立前向测试，记录实际路由、加载的 references 与交付边界。

## 验收

- 四类请求均能得到明确且不冲突的组合框架。
- 当前 Page 细化选择最小 merge，不新建 Page。
- 校验失败不会把 violation 清单当作用户交付结果。

## 处理结果

产品创建、代码库分析与校验修正路由可用；局部 refine 的 framework 缺少持久上下文冲突已通过 scoped coverage 和 context-first routing 解决。

## 修改文件

- `plugins/canvasight/skills/canvasight-graph-writer/SKILL.md`
- `plugins/canvasight/mcp/server.mjs`
- `plugins/canvasight/tests/mcp-smoke.mjs`

## 后续风险

定向 analyze 仍按用户批准的完整 Domain 合同生成，画布会比仅回答单一代码问题更全面。
