---
schema_version: 1
report_id: integration-summary-test-supervisor-0-4-32-local-matrix
report_type: integration-summary
status: resolved
owner: Test Supervisor Agent
created_by: Test Supervisor Agent
priority: high
version: 1
agent_id: /root/test_supervisor_agent
thread_id: 019f744e-868a-7ff2-990a-97ebc5777c67
created_at: 2026-07-18T09:04:46Z
updated_at: 2026-07-18T09:04:46Z
depends_on:
  - issue-refresh-base-document-fingerprint-order
  - solution-refresh-base-document-fingerprint-order
  - issue-publish-stable-release-0-4-31
related_files:
  - plugins/canvasight/src/App.tsx
  - plugins/canvasight/mcp/server.source.mjs
  - plugins/canvasight/mcp/server.mjs
  - plugins/canvasight/tests/widget-runtime-smoke.mjs
  - plugins/canvasight/tests/mcp-smoke.mjs
  - plugins/canvasight/.codex-plugin/plugin.json
  - plugins/canvasight/package.json
  - plugins/canvasight/package-lock.json
  - plugins/canvasight/dist
verification_status: passed
verification_evidence:
  - Independent final-snapshot widget runtime passed strict JSON.stringify equality for an authoritative two-Page document with conflict metadata and extension fields, covering clean Refresh, viewport save, retry, remount and multi-instance paths without invalid_document_base.
  - Independent final-snapshot MCP smoke passed and proved failed widget API lifecycle events retain pathname, method, status and code without recording sensitive projectPath or query text.
  - release:verify 0.4.32, current MCP bundle, typecheck, reproducible build, concurrency, clean 16-tool distribution, updater 15/15, dev server, registration, Markdown, Markdown export, Skills and plugin validation all passed.
  - Candidate source, generated MCP, test and web artifact SHA-256 hashes were identical before and after the final matrix.
---

# Test Supervisor 0.4.32 本地发布矩阵

## 本轮目标

- 独立审查 0.4.32 authoritative save base 修复及其回归边界。
- 在隔离的 Canvasight homes 下运行完整本地发布候选矩阵。
- 明确自动化放行范围与仍需真实 Codex native host 完成的门禁。

## Agent 状态与输入

- Test Supervisor Agent：独立执行最终快照 diff 审查、targeted tests、完整本地矩阵和残余风险判断。
- Development Agent：提供 raw authoritative base 与 display normalization 分离方案及失败诊断边界。
- Main Thread：在矩阵期间完成 lifecycle pathname 脱敏和两 Page conflict/扩展字段 fixture 收口；Test Supervisor 在收口后的最终快照重新验证。
- 其他固定角色：本报告不改变产品、设计、README、Skill 或项目流程，不代替 Main Thread 的集成与 Project Management 的 Git 收口。

## Diff 审查

- `applyOpenedProject` 使用 daemon 原始 `result.document` 作为 `baseDocumentRef.document`，normalized 文档只进入 observed/UI 状态。
- 保存成功后同样以原始 `result.document` 更新下一轮 base，避免首次保存后重新引入 fingerprint 漂移。
- server 的严格 order-sensitive fingerprint、revision history、mutation receipt 和 stale/conflict 语义未被放宽。
- widget fixture 使用 daemon 真实顶层键顺序，并包含两个 Page、Page 扩展字段和 conflict metadata；每次 save 都对 `base.document` 与最后 authoritative document 做完整 `JSON.stringify` 等值检查。
- `canvasight_widget_api_error` 只记录 pathname、method、status、code、attempt/instance identity，不记录 query、项目路径、请求体、节点内容或 token；MCP smoke 用含敏感 query 的失败请求验证不泄露。

## 验证记录

- 本地运行时：Node `v25.9.0`、npm `11.12.1`。本机没有可用的 Node 20.19 runtime；正式三平台 Node 20.19 仍是 tag workflow 门禁。
- `npm run test:widget-runtime`：passed，最终两 Page/扩展字段 fixture 通过。
- `npm run test:mcp`：最终快照 passed。并行验证期间旧测试草稿曾把公共 Skills GET 的错误 attempt 当作应失败并触发断言；收口后改用合法身份的 DELETE 产生 405，同时验证 lifecycle 脱敏，独立串行复跑通过。
- `npm run release:verify -- 0.4.32`：passed；manifest、package、lock、lock root、server 均为 `0.4.32`，7 Skills。
- `npm run check:mcp-bundle`：passed；生成 bundle 为 `978230` bytes。
- `npm run typecheck`、`npm run build`：passed；web 产物为 `dist/assets/index-DeKhEjgh.js`。
- `npm run test:concurrency`：passed。
- `npm run test:plugin-distribution`：passed，16 tools，无 `node_modules` 或 cache。
- `npm run test:update`：15/15 passed。
- `npm run test:dev-server`：passed。
- `npm run diagnose:mcp`：passed，0.4.32 注册 16 tools。
- `npm run test:markdown`、`npm run test:markdown-export`、`npm run test:skills`：passed。
- plugin validator、`git diff --check`、生成物绝对项目路径扫描和候选前后 SHA-256 稳定性检查：passed。
- Vite 仅报告现有大 chunk warning，不是本轮功能或发布阻断。

## 候选稳定性证据

- `src/App.tsx`: `e461aa04777e7d798203fd3963d253c18c33bee0882cf7c147fd1bc44a9ea4c7`
- `mcp/server.source.mjs`: `4b82a79045f6939747165e5fbdc31748486107bd11aabc3dd0e101c6c7141a48`
- `mcp/server.mjs`: `80b6de9df6db16a2dc52d75845bb221f89f825cdb5d2d7140b4e7431a1a2621f`
- `tests/widget-runtime-smoke.mjs`: `2e779f9fac0ea9e5e81dd29d0f458e381a66e7e0c229cef408a261bb2285003f`
- `tests/mcp-smoke.mjs`: `f3f3a4787e733fc681772067b6de3fc986b3f1e29b97abb3514b6a33101e5f94`
- `dist/index.html`: `957d07f70ac96de29063731bbb7f06d22d2f8880198d7b34e0f89d168a7bfac0`
- `dist/assets/index-DeKhEjgh.js`: `690c7b15e98eec5e91ecf5f0967378009cfa659084a20ee0cb0512cac4130fa0`

## 处理结果

本地 0.4.32 自动化候选门禁通过，Test Supervisor 放行 Main Thread 冻结 commit/install scope；本报告不放行正式 Release。

## 修改文件

- `agent-reports/resolved/integration-summary-test-supervisor-0-4-32-local-matrix.md`
- `ROSTER.md`
- `agent-reports/QUEUE.md`

## 未解决 / 后续风险

- 尚未 selective commit 或 exact install 0.4.32；当前验证绑定 dirty worktree 的上述最终 hashes。
- 必须安装与最终提交完全一致的 0.4.32 snapshot，重启 Codex Desktop，并在新建且重新 `@Canvasight` 的任务完成 instance-bound fullscreen ready。
- 真实 native acceptance 必须覆盖：完全 clean Refresh 不保存；缩放/viewport 持久变化后单击 Refresh 保存成功且无 `invalid_document_base`；一个有意义控件；same-task node Run；A→B→A/remount 后首次保存；多实例/late metadata 不回退 Connecting。
- exact native acceptance 前完成所有可能启动/停止 daemon 的本地自动化；验收后不得再次运行 lifecycle 测试。
- 正式 Release 仍需 Windows/macOS/Ubuntu Node 20.19 workflow、Release zip/SHA-256、tag/main/stable/ref 一致性与 updater live/equal-version 验证。
- Agent Team 全量 validator 的既有 legacy report/template/QUEUE 债务不属于本候选修复；Main Thread 的集成总结需继续显式记录。

## Git 状态

- branch: `main`
- baseline HEAD: `5e772a07761924ee75ec862ea601bc760f501b15`
- worktree: dirty，包含 0.4.32 source/tests/version/generated artifacts 与 Agent Team 报告；Test Supervisor 未 stage、commit、install、push、tag 或发布。
- commit: 尚未由 Project Management Agent 在 Main Thread 冻结范围后创建。
