---
schema_version: 1
report_id: issue-intent-framework-skill
report_type: issue
status: resolved
owner: Skill Expert Agent
created_by: Main Thread
priority: high
version: 2
agent_id: /root/skill_expert_agent
thread_id: 019f5424-366d-72b3-9ada-094f3d1eec7e
created_at: 2026-07-12T03:11:16Z
updated_at: 2026-07-12T03:25:19Z
depends_on: []
related_files:
  - plugins/canvasight/skills/canvasight-graph-writer/SKILL.md
  - plugins/canvasight/skills/canvasight-graph-writer/references
verification_status: passed
verification_evidence:
  - skill-creator quick_validate passed
  - 23 reference routing links and 85 canonical coverage keys checked
  - Product Agent forward-test completed
---

# 建立组合式意图思考框架

## 问题

现有 graph writer 只有五种粗粒度 graphType 和简短推荐节点，无法稳定约束产品、设计、代码库、文章、研究与执行任务的内容完整性和信息平衡。

## 期望结果

Skill 按 intent、domain、maturity、output 组合加载 references，使用 frameworkManifest 与 coverage 描述候选画布，并要求在最终写入前完成最多三轮校验修正。

## 验收

- SKILL.md 保持精简并明确 reference 路由。
- 六个 domain 均有明确必需内容合同。
- 新建、增量修改和闭环修正规则与 MCP 接口一致。

## 处理结果

已建立六类 intent、六类 domain、四类 maturity、五类 output 与两份质量 reference；前向测试发现的 refine 全量 coverage 冲突已修正为 touched-scope 校验。

## 修改文件

- `plugins/canvasight/skills/canvasight-graph-writer/`

## 后续风险

framework metadata 按批准方案不持久化；refine 从当前节点与拓扑重新分类，并只校验本次触及 coverage。
