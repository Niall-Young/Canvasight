---
schema_version: 1
report_id: integration-summary-test-supervisor-0-4-35-native-acceptance
report_type: integration-summary
status: resolved
owner: Test Supervisor Agent
created_by: Test Supervisor Agent
priority: high
version: 1
agent_id: /root/test_supervisor_agent
thread_id: 019f744d-c7f1-7383-8195-7478c2cd835e
created_at: 2026-07-18T12:11:52Z
updated_at: 2026-07-18T12:11:52Z
depends_on:
  - issue-publish-stable-release-0-4-35
  - issue-windows-cli-daemon-state-cleanup-0-4-34
related_files:
  - plugins/canvasight/.codex-plugin/plugin.json
  - plugins/canvasight/mcp/server.mjs
  - plugins/canvasight/dist
verification_status: passed
verification_evidence:
  - Exact installed 0.4.35 retained 582 of 582 immutable cache parity.
  - open-mrqboehp-6a69e237ae0d reached verified fullscreen ready for widget-f3184265-74af-439c-b6f6-884e5294baa3 at 736 by 240 with all render evidence true.
  - User confirmed initial canvas visibility, one A to B to A task round-trip, 50 percent zoom Refresh persistence and same-task Run delivery.
  - User confirmed no white panel, Connecting state or error after Run; Test Supervisor released native parity for a new v0.4.35 workflow.
---

# Test Supervisor 0.4.35 原生发布验收总结

## 本轮目标

- 独立判定 exact 0.4.35 是否满足原生 Widget Release gate，并允许进入全新三平台 workflow。

## 处理结果

passed。0.4.35 的 exact native ready、可见交互、任务切回、Refresh、same-task Run 与 Run 后稳定全部通过。允许创建新的 v0.4.35 tag 并运行发布矩阵；Windows Node 20.19 仍是不可替代的最终 gate。

## 验证记录

- session: `session-mrqboehp-b5e61a1a`
- open attempt: `open-mrqboehp-6a69e237ae0d`
- widget: `widget-f3184265-74af-439c-b6f6-884e5294baa3`
- ready time: `2026-07-18T12:07:50.515Z`
- display: fullscreen, 736×240
- evidence: `reactMounted=true`, `projectHydrated=true`, `canvasRendered=true`, `canvasVisible=true`
- initial visible canvas: user confirmed normal
- task return: one A→B→A, user confirmed normal without sidebar recovery
- control: 50% zoom followed by Refresh; screenshot retained 50% and showed “当前画布已是最新版本”
- Run: complete rich-content payload reached thread `019f744d-c7f1-7383-8195-7478c2cd835e`
- late state: user confirmed normal display with no white panel, Connecting or error after Run

## 未解决 / 后续风险

- Windows Node 20.19 must pass target/control/replacement daemon-stop regression in the new v0.4.35 workflow before any Release or stable mutation.
- v0.4.34 remains an immutable failed tag and must not be reused.

## Git 状态

- candidate implementation: `0ab416acf52918b59d5798ff00fae10d9c6495cb`
- exact-install report HEAD before this summary: `e35b5ed4855dfabc4360cb7f72757a60f950f92d`
- worktree before report update: clean
