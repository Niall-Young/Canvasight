---
schema_version: 1
report_id: solution-software-product-guidance-merge-autofill
report_type: solution
status: resolved
owner: Development Agent
created_by: Development Agent
priority: high
version: 1
agent_id: /root/development_agent
thread_id: null
created_at: 2026-07-12T13:58:53Z
updated_at: 2026-07-12T13:58:53Z
depends_on:
  - issue-software-product-guidance-merge-autofill
related_files:
  - plugins/canvasight/mcp/server.mjs
  - plugins/canvasight/tests/mcp-smoke.mjs
verification_status: passed
verification_evidence:
  - node syntax checks and TypeScript typecheck passed
  - npm run test:mcp passed with graph merge guidance cases
  - build and plugin validation passed
---

# 确定性补齐 software-product 指导节点

## Root Cause

非 merge 写入只按 `graphType` 自动补节点，merge 不执行补全，而 framework 校验按 `frameworkManifest` 强制要求节点，造成路径和触发来源不一致。

## 实施结果

- manifest 存在时由 manifest 独占决定 software-product 与 refine 语义；完全缺省时才回退 legacy graphType。
- merge 在 operations 成功后、framework 校验前补齐缺失指导节点。
- 自动节点挂到最终 Page 首个业务节点，默认使用增量定位；显式 relayout 才重排整页。
- 自动新增节点和边进入 `projectGuidanceNodes` 与 `mutationSummary`。
- stale、其他校验失败、revision 和原子写入规则保持不变。

## 文档与标准决定

- Customer Support Agent 已同步 README 中英文说明。
- 无 UI 或设计系统变化，`design.md` 不需修改。
- 无持久工程流程变化，`AGENTS.md` 不需修改。
- Graph Writer 三次尝试规则保持不变。

## 后续风险

真实 Codex 原生宿主尚未在重启后验证。
