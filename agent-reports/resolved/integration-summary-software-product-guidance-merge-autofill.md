---
schema_version: 1
report_id: integration-summary-software-product-guidance-merge-autofill
report_type: integration-summary
status: resolved
owner: Main Thread
created_by: Main Thread
priority: high
version: 1
agent_id: /root
thread_id: null
created_at: 2026-07-12T13:58:53Z
updated_at: 2026-07-12T13:58:53Z
depends_on:
  - issue-software-product-guidance-merge-autofill
  - solution-software-product-guidance-merge-autofill
related_files:
  - plugins/canvasight/mcp/server.mjs
  - plugins/canvasight/tests/mcp-smoke.mjs
  - README.md
verification_status: passed
verification_evidence:
  - Product Agent approved manifest-first and refine boundaries
  - Test Supervisor Agent covered trigger matrix, atomicity, layout, summaries, and revisions
  - Customer Support Agent synchronized bilingual README guidance
  - typecheck build MCP smoke and plugin validation passed
---

# software-product 指导节点自动补全集成总结

## 已完成

- 修复 merge 与非 merge 的指导节点触发和补全不一致。
- 不增加重试次数，确定性缺项改由服务端在首次候选中补全。
- 保留 refine、legacy graphType、stale revision、原子写入和增量布局契约。
- MCP runtime 独立升级为 `0.4.5+codex.20260712141103`，避免复用上一版本缓存。

## Agent 决定

- Product Agent：manifest 优先，invalid/非 software-product manifest 不得由 graphType 偷偷补全。
- Development Agent：统一补全 helper，merge summary 包含系统新增项。
- Test Supervisor Agent：默认保留原节点坐标，显式 relayout 才整页重排。
- Customer Support Agent：README 中英文需要更新。
- Main Thread 代行 Design Standards、Development Standards 与 Skill Expert 检查：`design.md`、`AGENTS.md`、Graph Writer skill 均无需修改。

## 验证

- `npm run typecheck`：通过。
- `npm run build`：通过。
- `npm run test:mcp`：通过；首次并发 daemon 压力运行偶发超时，重跑完整套件通过。
- plugin validator：通过。
- Agent Team validator：因大量既有 legacy 报告和模板不符合当前 schema 而失败；本轮未改写历史记录。

## Git 与风险

- task baseline HEAD: `2d44998bdd468fd9a54164925f7b9d1302557c0f`
- commit baseline HEAD: `5c31534`
- approved task-owned paths: runtime、MCP 回归测试、README、ROSTER 与本轮 resolved reports。
- planned commit: `fix: 修复软件产品指导节点重复校验`
- 原生宿主需要重启 Codex Desktop 后再验证；当前交付对此保持 unverified。
