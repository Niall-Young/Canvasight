---
schema_version: 1
report_id: integration-summary-refresh-base-fingerprint-0-4-32
report_type: integration-summary
status: resolved
owner: Main Thread
created_by: Main Thread
priority: high
version: 1
agent_id: /root
thread_id: 019f744d-c7f1-7383-8195-7478c2cd835e
created_at: 2026-07-18T09:07:00Z
updated_at: 2026-07-18T09:07:00Z
depends_on:
  - issue-refresh-base-document-fingerprint-order
  - solution-refresh-base-document-fingerprint-order
  - integration-summary-test-supervisor-0-4-32-local-matrix
  - issue-publish-stable-release-0-4-32
related_files:
  - ROSTER.md
  - agent-reports/QUEUE.md
  - plugins/canvasight/src/App.tsx
  - plugins/canvasight/mcp/server.source.mjs
  - plugins/canvasight/mcp/server.mjs
  - plugins/canvasight/tests/widget-runtime-smoke.mjs
  - plugins/canvasight/tests/mcp-smoke.mjs
  - plugins/canvasight/dist
verification_status: passed
verification_evidence:
  - Main Thread reproduced the exact raw-versus-normalized document fingerprint mismatch from the user's accepted 0.4.31 native session.
  - Development review confirmed both non-null baseDocumentRef write sites now preserve result.document and no normalized-to-base path remains.
  - Test Supervisor independently passed the final 0.4.32 local release matrix and candidate hash audit.
  - Agent Team full validator remains globally blocked by pre-existing legacy reports, templates and QUEUE schema debt unrelated to this scope.
---

# 集成 0.4.32 Refresh 保存基线修复

## 本轮目标

- 解释并修复用户真实 Refresh 失败，永久停止 0.4.31 发布。
- 准备可提交、可 exact install 的 0.4.32 本地候选。

## Agent 状态与角色决策

- Product Agent：保存失败属于既有 Refresh 核心流程阻断；产品范围不扩张。
- Design Agent：无布局、交互或视觉语义变化，`design.md` 无需修改。
- Development Agent：只读复核两处 authoritative base 边界与并发语义，核心实现通过；其指出的 query 日志隐私风险已修复。
- Test Supervisor Agent：独立完整矩阵与最终 hash 审计通过，正式 native-host/Node 20.19 门禁仍待完成。
- Customer Support Agent：无新增用户功能、命令或工作流，README 无需修改；错误文案保持既有安全提示。
- Design Standards Expert：无设计基线变化。
- Development Standards Lead：无持久流程变化，`AGENTS.md` 无需修改。
- Project Management Agent：确认 baseline HEAD `5e772a07761924ee75ec862ea601bc760f501b15`、远端仍为 v0.4.28，0.4.31 永久禁止发布。
- Skill Expert Agent：无 Skill 文件或触发边界变化。

## 已完成改动

- hydration 与 save success 均用 daemon 原始 `result.document` 作为 `baseDocumentRef.document`；normalized 副本只用于显示。
- 保留 server 现有 fingerprint、revision history、receipt 与冲突语义，不做数据迁移。
- widget runtime 用真实键序、两个 Page、conflict/扩展字段严格比对每次 base；覆盖 clean/pending Refresh、失败重试、remount 和 multi-instance。
- widget API 失败 lifecycle 只记录 pathname/method/status/code/attempt/instance，MCP smoke 证明敏感 query 与项目路径不泄露。
- 版本与生成物同步至 0.4.32。

## 验证记录

- typecheck、build、MCP bundle、widget runtime、MCP、concurrency、distribution、update 15/15、dev-server、diagnose、Markdown、Markdown export、Skills、release verify 与 plugin validator 全部通过。
- 生成物绝对路径扫描、`git diff --check` 与 Test Supervisor candidate hash 稳定性检查通过。
- Agent Team validator 已运行但被大量既有 legacy report/template/QUEUE schema debt 全局阻断；未修改这些用户拥有且与本修复无关的历史文件。

## 未解决 / 后续风险

- exact 0.4.32 尚未安装；Codex Desktop 尚未重启，真实 native acceptance 未完成。
- 0.4.32 Release、三平台 Node 20.19 workflow、资产、`stable` 与 updater live verification 尚未执行。
- exact native acceptance 前禁止任何 push、tag、Release 或 `stable` 变更。

## Git 状态

- branch: `main`
- baseline HEAD: `5e772a07761924ee75ec862ea601bc760f501b15`
- approved scope: 本 summary 的 related_files，加 0.4.32 manifest/package/lock、替换后的 web asset、issue/solution/Test Supervisor reports 与 0.4.31 blocked report。
- planned commit: `fix: 修复 Refresh 保存基线指纹漂移`
- commit: 待 Project Management Agent selective stage/commit。
- worktree: dirty，仅待最终 scoped Git closure；无远端 mutation。
