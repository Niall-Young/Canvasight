---
schema_version: 1
report_id: issue-software-product-guidance-merge-autofill
report_type: issue
status: resolved
owner: Development Agent
created_by: Main Thread
priority: high
version: 2
agent_id: /root/development_agent
thread_id: null
created_at: 2026-07-12T13:51:59Z
updated_at: 2026-07-12T13:58:53Z
depends_on:
  - solution-software-product-guidance-merge-autofill
related_files:
  - plugins/canvasight/mcp/server.mjs
  - plugins/canvasight/tests/mcp-smoke.mjs
verification_status: passed
verification_evidence:
  - npm run test:mcp passed, including manifest-first guidance trigger and merge autofill regression cases
  - npm run typecheck passed
  - npm run build passed
  - plugin validation passed
---

# software-product merge 缺失指导节点导致重复校验失败

## 处理结果

所有写入模式现在共享 manifest-first 的 software-product 判定。`merge-active-page` 会在候选校验前确定性补充缺失的 `AGENTS.md`、`design.md` 独立交付节点和关系，并将系统新增项写入成功响应。

## 修改文件

- `plugins/canvasight/mcp/server.mjs`
- `plugins/canvasight/tests/mcp-smoke.mjs`
- `README.md`

## 验证方式

- manifest-only、partial、去重、refine、legacy graphType、stale、失败原子性、布局、summary 和 revision 回归
- `npm run typecheck`
- `npm run build`
- 插件验证脚本

## 后续风险

- Codex Desktop 尚未重启，因此新安装版本的真实宿主验证仍未完成。
