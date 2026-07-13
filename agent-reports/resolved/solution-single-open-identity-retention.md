---
schema_version: 1
report_id: solution-single-open-identity-retention
report_type: solution
status: resolved
owner: Development Agent
created_by: Development Agent
priority: high
version: 1
agent_id: /root/development_agent
thread_id: 019f5bba-8c7e-7152-b3a3-0fbc17041ed6
created_at: 2026-07-13T14:04:57Z
updated_at: 2026-07-13T14:04:57Z
depends_on:
  - issue-duplicate-native-canvas-open
related_issue: issue-duplicate-native-canvas-open
related_files:
  - plugins/canvasight/mcp/server.source.mjs
  - plugins/canvasight/skills/canvasight-open/SKILL.md
  - plugins/canvasight/skills/canvasight-open/references/open-workflow.md
  - plugins/canvasight/tests/mcp-smoke.mjs
  - README.md
verification_status: passed
verification_evidence:
  - MCP smoke proves one native open call creates one matching Session and OpenAttempt and awaits that same identity.
  - Safe text identity matches structuredContent and excludes daemon URLs, origins, and tokens.
  - Build, typecheck, bundle freshness, clean distribution, release, plugin, and Skill validation pass for 0.4.13.
---

# 单次打开身份保留与安全文本回退

## 负责 Agent

Development Agent；Skill Expert Agent 审查并实现 Skill 合同，Main Thread 完成集成、文档和验证。

## 对应问题

`agent-reports/assigned/issue-duplicate-native-canvas-open.md`

## Root Cause

调用包装器只转发首次 `open_canvasight` 的文本内容时，会丢失结构化 `sessionId` 与 `openAttemptId`。旧 Skill 没有明确禁止为了恢复身份再次调用 open，导致一次用户动作创建两个 Session/OpenAttempt。

## 调研过程

- 对照原始任务 transcript，确认第一次包装器仅转发 `content`，第二次才序列化完整结果。
- 对照 lifecycle log，确认第一 attempt 已 ready 后仍创建了第二 attempt。
- 验证结构化输出 Schema 已包含所需身份，因此无需新增字段或运行时强制幂等。

## 可选方案

- 运行时强制同 thread/project 幂等：会改变用户显式重新打开语义，本轮不采用。
- 只改 Skill：不能保护只转发文本的包装器，不足以覆盖本次根因。
- Skill 单次调用约束加 MCP 安全文本身份：采用。

## 推荐方案

每个用户级打开动作只调用一次 `open_canvasight`，保留完整结果并立即以同一组身份执行 `await_canvasight_widget_ready`。MCP 文本同时输出安全的 Session/OpenAttempt 和精确 await 参数，结构化结果仍是 canonical source；身份丢失时标记原 attempt `unverified` 并进入 troubleshooting，不静默重开。

## 实施步骤

1. 收紧 `canvasight-open` 主流程和参考合同，加入低自由度单次调用示例与 no-reopen 失败规则。
2. 在原生打开文本中返回安全身份和下一步 exact await，不暴露 daemon URL、origin 或 token。
3. 增加 Skill、文本身份、单次 attempt 和同 identity ready 回归测试。
4. 同步双语 README，升级并安装 0.4.13 完整插件快照。

## 风险与回滚

- 本方案不关闭或 supersede 已存在的旧实例，因此保留用户主动重新打开能力。
- 对同项目多实例、未变文档 autosave 和 revision 竞争的运行时保护不在本方案内，父 issue 保持 assigned。
- 回滚只需恢复 Skill、文本和版本提交，不涉及 `.scatter` 数据迁移。

## 处理结果

已完成计划中的双层防重，并安装 `canvasight@canvasight-local` 0.4.13。

## 修改文件

- MCP source/generated bundle、打开 Skill/参考、MCP smoke、双语 README 和同步版本文件。

## 验证方式

- `npm run test:mcp`
- `npm run typecheck`
- `npm run build`
- `npm run check:mcp-bundle`
- `npm run test:plugin-distribution`
- `npm run test:skills`
- `npm run release:verify -- 0.4.13`
- Plugin validation 与 `canvasight-open` Skill validation

## 后续风险

Codex Desktop 尚未在 0.4.13 安装后重启，真实 native-host 的单工具卡片、控件、同任务 Run 与 late metadata 验收仍未完成；父 issue 保持 assigned/unverified。
