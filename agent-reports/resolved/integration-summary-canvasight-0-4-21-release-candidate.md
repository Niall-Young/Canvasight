---
schema_version: 1
report_id: integration-summary-canvasight-0-4-21-release-candidate
report_type: integration-summary
status: resolved
owner: Main Thread
created_by: Main Thread
priority: high
version: 1
agent_id: /root
thread_id: 019f64b1-7048-7653-a457-6a130ca9a514
created_at: 2026-07-15T07:46:22Z
updated_at: 2026-07-15T07:46:22Z
depends_on:
  - issue-publish-stable-release-0-4-21
  - issue-historical-widget-polling-storm
  - solution-historical-widget-polling-storm
  - integration-summary-historical-widget-polling-storm
related_files:
  - README.md
  - ROSTER.md
  - agent-reports/QUEUE.md
  - agent-reports/assigned/issue-publish-stable-release-0-4-21.md
verification_status: passed
verification_evidence:
  - Test Supervisor independently passed the complete local Node 20.19 release candidate matrix and plugin validation.
  - GitHub Actions run 29397719502 passed the existing main candidate on macOS, Windows, and Ubuntu Node 20.19.
  - Customer Support reviewed all release-facing contracts and requested only the bilingual README version-example update.
  - Existing 0.4.21 native-host acceptance includes verified fullscreen ready, visible canvas, meaningful control, bounded historical-widget polling, and same-task Run delivery.
---

# Canvasight 0.4.21 发布候选集成总结

## 本轮目标

- 冻结 Canvasight 0.4.21 正式发布候选，并交由 Project Management Agent 选择性提交发布报告与最小 README 同步。
- 先推送候选到 `main`，再创建 `v0.4.21` tag，由正式 workflow 完成三平台验证、Release 资产发布和 `stable` 快进。

## Agent 状态与角色决策

- Test Supervisor Agent：独立完成 Node 20.19 本地门禁、Widget smoke、plugin validator 与候选漂移复核，结论为可发布。
- Customer Support Agent：复核双语 README、MCP 与全部 Canvasight Skills；只需把中英文 release 命令示例更新为 0.4.21。
- Project Management Agent：确认 v0.4.21 tag/Release 不存在、stable 可普通快进，并给出精确候选提交与发布顺序。
- Main Thread：冻结候选范围，负责远端 tag、workflow 监控、Release 资产、checksum 与 refs 验证。
- 其他固定角色：本轮没有新增产品、视觉、设计基线、Skill 或 durable standards 变更，不重复创建。

## 候选范围

- `README.md`
- `ROSTER.md`
- `agent-reports/QUEUE.md`
- `agent-reports/assigned/issue-publish-stable-release-0-4-21.md`
- `agent-reports/resolved/integration-summary-canvasight-0-4-21-release-candidate.md`

## 验证记录

- Node 20.19：release verify、MCP bundle、typecheck/build、updater、distribution、registration、MCP、concurrency、Skills、Markdown、dev-server 和 plugin validator 全部通过。
- Widget runtime smoke：Node 25 直接通过；Node 20.19 加 experimental WebSocket harness flag 后通过。
- `git diff --exit-code -- plugins/canvasight/mcp/server.mjs plugins/canvasight/dist` 通过，候选产物无漂移。
- GitHub Actions `29397719502`：`af7f1e9` 的 macOS、Windows、Ubuntu Node 20.19 matrix 全部成功。
- 既有真实 Codex Desktop 验收：0.4.21 verified fullscreen ready、React/project/canvas 可见证据、三次 reopen、单 owner 有界轮询、有效画布操作和同 task Run 均通过。

## 未解决 / 后续风险

- Agent Team validator 仍被 legacy 根报告、旧模板与 QUEUE schema 债务阻断；本轮新报告遵循当前 schema，该历史迁移不进入发布候选。
- Node 20.19 的独立 Widget harness 需要 experimental WebSocket flag；正式 release workflow 不包含该额外 smoke，产品 runtime 与三平台 release 门禁不受影响。

## Git 状态

- branch: `main`
- baseline: `af7f1e9f6eeaaa8a53f7a573c68737da946660bc`
- planned commit: `chore: 准备 Canvasight 0.4.21 发布`
- staging policy: 只选择性暂存上述五个路径，禁止 broad add。
