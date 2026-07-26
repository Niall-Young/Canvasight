---
schema_version: 1
report_id: integration-summary-release-preflight-0-4-36
report_type: integration-summary
status: resolved
owner: Main Thread
created_by: Main Thread
priority: critical
version: 1
agent_id: /root
thread_id: 019f9d02-eb81-7972-aba6-a6661182857e
created_at: 2026-07-26T06:34:35Z
updated_at: 2026-07-26T06:34:35Z
depends_on:
  - issue-publish-stable-release-0-4-36
  - issue-codex-react-185-sidebar-recovery
  - issue-widget-viewport-recovery-save-count
related_files:
  - .github/workflows/canvasight-release.yml
  - ROSTER.md
  - agent-reports/QUEUE.md
  - agent-reports/assigned/issue-publish-stable-release-0-4-36.md
  - agent-reports/archived/issue-widget-viewport-recovery-save-count.md
verification_status: not_applicable
verification_evidence:
  - Local release and runtime matrix passes for exact 0.4.36.
  - Current main CI run 30190972233 passed Windows, macOS and Ubuntu Node 20.19 on the exact preflight baseline.
  - Release asset round-trip verification was simulated locally against a freshly zipped snapshot and passed checksum, version and MCP registration checks.
  - The native interactive maintainer gate remains pending and therefore no v0.4.36 tag, Release or stable mutation has occurred.
---

# Canvasight 0.4.36 发布预检与资产回读门槛

## 本轮目标

- 建立 v0.4.36 发布 issue 与受保护的 Release 流程。
- 完成 tag 前的本地自动化、候选字节一致性和公开 CI 证据审计。
- 在 `stable` 快进前验证 GitHub 实际托管的 Release 资产。

## Agent 输入

- Development Agent：确认无需运行 `release:prepare`；版本字段、bundle、dist 与 exact installed cache 一致，插件字节自 `4e39695` 后未变化。
- Test Supervisor Agent：本地矩阵、三次顺序 Widget runtime、584 个 tracked file cache parity 与 main 三平台 CI 通过；原生交互仍是唯一硬门槛。
- Project Management Agent：确认 tag、Release 不存在，stable 可普通快进；tag 必须等于当时 `origin/main` HEAD，由 tag workflow 独占 Release 与 stable 操作。
- Product Agent：Main Thread 代行；本次提供可安装修复候选，不改变产品合同，Issue #2 继续等待报告者复验。
- Design Agent / Design Standards Expert：Main Thread 代行；无 UI、交互或 `design.md` 变化。
- Customer Support Agent：Main Thread 代行并复核 `AGENTS.md`、`design.md`、package、MCP server、全部 Canvasight Skills 与双语 README；安装和更新方式未变化，无需 README 更新。
- Development Standards Lead：Main Thread 代行；现有 AGENTS 已要求 Release 验证后再推进 stable，本次 workflow 修复使实现符合既有规则，无需修改 AGENTS。
- Skill Expert Agent：无 Skill 文件或触发合同变化，不适用。

## 已完成

- `release:verify -- 0.4.36`、MCP bundle、typecheck、build 与 committed artifacts 可复现。
- updater、distribution、MCP diagnose/runtime、concurrency、dev-server、Markdown、Markdown export、rich-text 与 Skills smoke 通过。
- plugin validator 通过；main CI `30190972233` 三个平台通过。
- `test:widget-runtime` 在同一候选字节上连续三次顺序通过；原 save-count 观察归档为不可复现干扰，没有伪称修复。
- Release workflow 在 `gh release create` 后、stable push 前执行：
  - exact asset name 集合验证；
  - GitHub 托管资产下载；
  - SHA-256 校验；
  - 解压后的 manifest、cache/numbered-duplicate 检查；
  - release version 与 MCP registration probe。
- 任一资产回读失败进入既有 ERR trap：删除刚创建的 Release 并保持旧 stable。

## 未解决 / 后续风险

- exact 0.4.36 维护者原生画布控件、Refresh、同任务 Run 与 late-state 交互门槛仍待用户确认；未通过前禁止打 tag。
- tag workflow 尚未运行；Windows/macOS/Ubuntu release jobs、Release 资产与 stable identity 仍未产生。
- GitHub Issue #2 保持 Open；报告者验证是发布后证据，不是本预检的替代品。
- Agent Team validator 全仓仍受既有 legacy 报告、旧模板与旧 QUEUE 格式影响；本轮 touched reports 没有新增文件级 schema 错误。

## 验证记录

- `npm run release:verify -- 0.4.36`
- `npm run check:mcp-bundle`
- `npm run typecheck`
- `npm run build` + `git diff --exit-code -- mcp/server.mjs dist`
- `npm run test:update`
- `npm run test:plugin-distribution`
- `npm run diagnose:mcp`
- `npm run test:mcp`
- `npm run test:concurrency`
- `npm run test:dev-server`
- `npm run test:markdown`
- `npm run test:markdown-export`
- `npm run test:rich-text`
- `npm run test:skills`
- three sequential `npm run test:widget-runtime`
- plugin validator
- workflow YAML parse + local release-asset round-trip simulation

## Git 状态

- branch: `main`
- baseline HEAD: `883a0e6fd808299a88e667eca9af71f19450f85d`
- baseline origin/main: same
- origin/stable: `7f2451b488c65ec6b9ab57e972af07d70998cccf`
- approved preflight scope: workflow hardening plus reports in `related_files`
- excluded scope: plugin source/version/dist, tag, Release, stable and GitHub Issue #2 writes
- planned commit subject: `ci: 发布资产验证后再推进 stable`
- commit exception after preflight: exact native interactive gate remains incomplete
