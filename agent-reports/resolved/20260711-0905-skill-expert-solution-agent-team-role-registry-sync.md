---
status: resolved
report_type: solution
owner: Skill Expert Agent
created_by: Skill Expert Agent
priority: high
created_at: 2026-07-11 09:05
updated_at: 2026-07-11 09:05
related_issue: agent-reports/resolved/20260711-0854-skill-expert-issue-upstream-agent-team-role-registry.md
related_files:
  - plugins/canvasight/skills/canvasight-agent-team/SKILL.md
  - plugins/canvasight/skills/canvasight-agent-team/references/agent-team-schema.json
  - plugins/canvasight/skills/canvasight-agent-team/references/agent-selection.md
  - plugins/canvasight/skills/canvasight-agent-team/references/report-protocol.md
  - plugins/canvasight/skills/canvasight-agent-team/scripts/validate-agent-team.mjs
  - plugins/canvasight/skills/canvasight-run/SKILL.md
  - plugins/canvasight/skills/canvasight-run/references/run-output-contract.md
  - plugins/canvasight/skills/canvasight/SKILL.md
---

# Agent Team role-registry Skill 同步审查

## 负责 Agent

Skill Expert Agent

## 对应问题

`agent-reports/resolved/20260711-0854-skill-expert-issue-upstream-agent-team-role-registry.md`

## Root Cause

Canvasight 内置的 Agent Team skill 落后于上游 `186f59ccaf80ae377ef03e3a0d812d870aaf80a8` role-registry 协议，且 Canvasight Runtime 仍需要稳定的旧 skill 名称来匹配 Run payload。

## 调研过程

- 对比上游 `SKILL.md`、schema、selection、report protocol 与 validator。
- 检查 Canvasight compatibility name、前端/MCP payload、Run skill 交叉引用及触发边界。
- 执行 `node --check plugins/canvasight/skills/canvasight-agent-team/scripts/validate-agent-team.mjs`。
- 执行上游 reference fixture 测试：`node --test /tmp/Codex-agent-team-skill/tests/validate-agent-team.test.mjs`，4/4 通过。

## 推荐方案

保留 `canvasight-agent-team` 作为 Canvasight 公开兼容名，承载上游 role-registry 协议；不要把 Runtime payload 改为无法被已安装 Canvasight skill 发现的 `codex-agent-team-skill`。

## 实施结果

- `canvasight-agent-team` frontmatter 保留原名，description 扩展了 `ROSTER.md`、role-registry 和 report protocol 的显式触发词，同时继续排除普通打开、Run、图写入、排障和常规代码改动。
- Skill 及 Run/index skills 统一要求先读 schema 与 `ROSTER.md`，并清晰规定 report -> roster -> queue 的写入顺序和单 owner 约束。
- 打包新增 `references/agent-team-schema.json` 与本地 validator；schema/引用路径在 skills、Run output contract、types、MCP payload、App fallback 和 smoke assertions 中一致为 `references/agent-team-schema.json` 与 `ROSTER.md`。

## 验证方式

- `node --check plugins/canvasight/skills/canvasight-agent-team/scripts/validate-agent-team.mjs` 通过。
- 上游 reference fixture test 4/4 通过，证明上游 `186f59c` 参考协议的测试期望已被复核。
- 静态引用扫描确认 Canvasight Runtime 保持 `canvasight-agent-team`，并把 `ROSTER.md`/schema 位置传递给 Run 消费方。

## 后续风险

- 本地 validator 是为 Canvasight 打包的较窄实现，不是上游 `scripts/validate-agent-team.mjs` 的逐字或全语义副本；它未随包复制上游 `tests/validate-agent-team.test.mjs`。因此不得声称 byte-for-byte upstream parity 或把上游全部 validator 覆盖作为已验证事实。
- 后续若把本地 validator 作为严格发布门禁，应恢复上游完整校验与 fixture tests，或新增覆盖其省略项（未知字段、完整类型/目录/引用/依赖环、queue 全列一致性、active seat identity 等）。
