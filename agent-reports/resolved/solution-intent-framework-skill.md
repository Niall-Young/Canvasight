---
schema_version: 1
report_id: solution-intent-framework-skill
report_type: solution
status: resolved
owner: Skill Expert Agent
created_by: Skill Expert Agent
priority: high
version: 1
agent_id: /root/skill_expert_agent
thread_id: 019f5424-366d-72b3-9ada-094f3d1eec7e
created_at: 2026-07-12T03:25:19Z
updated_at: 2026-07-12T03:25:19Z
depends_on:
  - issue-intent-framework-skill
related_files:
  - plugins/canvasight/skills/canvasight-graph-writer/SKILL.md
  - plugins/canvasight/skills/canvasight-graph-writer/references
verification_status: passed
verification_evidence:
  - skill-creator quick_validate passed
  - Product Agent forward-test passed after scoped refine correction
---

# 组合式思考框架解决方案

以 intent、domain、maturity、output 四维路由替代扁平 graphType 内容模板。六个 Domain 与四个 Maturity 提供 85 个 canonical coverage keys；质量 reference 要求校验失败由 AI 内部修正，最多三轮后才进入真实阻塞。局部 refine 读取 context 后只校验触及 coverage，避免扩写无关内容。
