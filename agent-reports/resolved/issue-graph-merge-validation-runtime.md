---
schema_version: 1
report_id: issue-graph-merge-validation-runtime
report_type: issue
status: resolved
owner: Development Agent
created_by: Main Thread
priority: high
version: 2
agent_id: /root/development_agent
thread_id: 019f5424-366d-72b3-9ada-094f3d1eec7e
created_at: 2026-07-12T03:11:16Z
updated_at: 2026-07-12T03:25:19Z
depends_on: []
related_files:
  - plugins/canvasight/mcp/server.mjs
verification_status: passed
verification_evidence:
  - npm run test:mcp
  - npm run build
  - node --check mcp/server.mjs
---

# 支持当前 Page 增量编辑与写前校验

## 问题

`write_canvasight_graph` 默认新建 Page，缺少读取当前 Page、显式 patch、revision 保护和 framework coverage 校验，AI 无法安全地继续修改现有画布。

## 期望结果

新增轻量上下文读取工具和 `merge-active-page` operations；在完整候选 Page 通过结构与内容合同校验前不写盘，失败结果以机器可读 violations 返回给 AI 修正。

## 验收

- 旧写入模式与 `.scatter` v1 保持兼容。
- 增量修改保留无关节点、连接与位置。
- revision、引用、coverage 和必需内容失败时无部分写入。

## 处理结果

已新增上下文读取、revision 保护、六类 merge operations、候选 Page 写前校验、机器可读修复指令、mutation summary 与 refine scoped coverage。

## 修改文件

- `plugins/canvasight/mcp/server.mjs`

## 后续风险

原生 Codex host 尚未在重启后验证新增工具发现与打开实例刷新。
