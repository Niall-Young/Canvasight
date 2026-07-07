---
status: resolved
report_type: integration-summary
owner: main-thread
created_by: main-thread
priority: critical
created_at: 2026-07-07 20:44
updated_at: 2026-07-07 20:44
related_files:
  - plugins/canvasight/mcp/server.mjs
  - plugins/canvasight/src/lib/canvasightApi.ts
  - plugins/canvasight/tests/mcp-smoke.mjs
  - plugins/canvasight/package.json
  - README.md
  - AGENTS.md
  - design.md
---

# OpenAI Compatibility Bridge 集成总结

## 本轮目标

- 修复新/reloaded Codex thread 中 native widget 已渲染但 host bridge 仍不可用的问题。
- 在不回退到 browser fallback、app-server `turn/start`、虚拟点击、剪贴板或 Accessibility 的前提下，支持 MCP Apps `ui/message` 和 Codex/OpenAI compatibility `window.openai.sendFollowUpMessage` 两种 native widget bridge transport。
- 让 Run 失败时显示具体 `bridgeTransport` / `bridgeReason`，不再只有泛化的 bridge-not-ready toast。

## Agent 状态

- Product Agent：主线程代执行；确认 OpenAI compatibility bridge 属于 native widget transport，不改变 browser fallback 队列语义。
- Design Agent：主线程代执行；诊断面板新增紧凑 bridge 字段，不改变主工作区结构。
- Development Agent：主线程代执行；完成 widget bridge adapter、前端 readiness、版本同步。
- Test Supervisor Agent：主线程代执行；完成 runtime bridge harness、MCP smoke、build、typecheck、dev-server、plugin validation。
- Customer Support Agent：主线程代执行；README 中英文已同步 0.1.41 行为。
- Design Standards Expert：主线程代执行；design.md 已同步 bridge transport 语义。
- Development Standards Lead：主线程代执行；AGENTS.md 已同步 0.1.41 runtime contract。
- Project Management Agent：主线程代执行；待最终 stage/commit。
- Skill Expert Agent：主线程代执行；按 skill-creator guidance 保持 SKILL.md 简洁并校验相关 skills。

## Agent 输入

- Product Agent：Run 成功只能来自 native widget bridge Promise resolve。
- Design Agent：诊断要显示 transport/reason，而不是扩大 toast 或引入新流程。
- Development Agent：adapter 优先 `mcp_ui_message`，再使用 `openai_compat_followup`；普通 browser/dev 页面仍硬失败或队列。
- Test Supervisor Agent：需要执行内联 widget script，证明两条 bridge 分支可运行。
- Customer Support Agent：README 需要把 0.1.41 作为最新排障版本。
- Design Standards Expert：design.md 需要明确 OpenAI compatibility bridge 不是 fallback。
- Development Standards Lead：AGENTS.md 需要记录版本和运行时边界。
- Project Management Agent：提交应使用中文 conventional commit。
- Skill Expert Agent：skill 更新只写必要触发/操作信息，避免冗余说明。

## 报告状态变更

- 新增 `agent-reports/resolved/20260707-2044-integration-summary-openai-compat-bridge.md`。
- `agent-reports/QUEUE.md` 已追加本轮集成记录。
- `agent-reports/open/20260707-1127-development-issue-current-thread-mcp-transport-closed.md` 保持 open；本轮修的是新/reloaded thread widget bridge adapter，不是旧 thread MCP transport 已关闭的问题。

## 已解决

- Widget shell 新增明确 bridge state：`bridgeTransport`、`mcpInitialized`、`hostCapabilitiesMessage`、`openaiFollowUpAvailable`、`lastBridgeError`、`reason`。
- `sendFollowUpMessage` 先尝试 MCP Apps `ui/message`，再尝试 `window.openai.sendFollowUpMessage`，两者都不可用时抛出包含 bridge state 的错误。
- 前端 `canSendFollowUpMessage()` 改为读取 adapter readiness，不再仅检查函数是否存在。
- 诊断面板新增 bridge transport、reason、MCP initialized、host message capability、OpenAI follow-up availability。
- `test:mcp` 通过 VM harness 执行真实 widget bridge script，覆盖 `mcp_ui_message`、`openai_compat_followup`、`host_message_capability_missing`、`openai_followup_missing`。
- 版本同步到 `0.1.41`，插件已重装，stale `0.1.40` dev server 已重启为 `0.1.41`。

## 未解决

- 真实 GUI 中是否显示 `bridgeTransport=mcp_ui_message` 或 `openai_compat_followup` 仍需要用户在 new/reloaded Codex thread 调 `open_canvasight` 后验收。

## 风险

- 如果 Codex Desktop 在 native widget 中既不提供 MCP Apps `ui/message`，也不提供 `window.openai.sendFollowUpMessage`，Canvasight 会继续硬失败并显示具体 bridge state；下一步应继续修 host/descriptor 兼容性，不回退到 browser fallback 成功路径。

## 下一轮分派

- 如用户真机仍失败，Development Agent 读取 diagnostics 的 `bridgeTransport`、`bridgeReason`、`lastBridgeError` 后继续定位 host support 或 descriptor 承载问题。

## 已完成改动

- Widget shell bridge adapter 和 bridge state。
- Frontend readiness/diagnostics。
- MCP smoke bridge runtime harness。
- README、AGENTS、design.md、Canvasight skills。
- Version bump and rebuilt tracked `dist`.

## 处理结果

已完成

## 修改文件

- `plugins/canvasight/mcp/server.mjs`
- `plugins/canvasight/src/lib/canvasightApi.ts`
- `plugins/canvasight/src/App.tsx`
- `plugins/canvasight/src/lib/translations.ts`
- `plugins/canvasight/tests/mcp-smoke.mjs`
- `plugins/canvasight/package.json`
- `plugins/canvasight/package-lock.json`
- `plugins/canvasight/.codex-plugin/plugin.json`
- `plugins/canvasight/dist/index.html`
- `plugins/canvasight/dist/assets/index-CPERwd0x.js`
- `plugins/canvasight/dist/assets/index-DRRrHScH.js`
- `README.md`
- `AGENTS.md`
- `design.md`
- `plugins/canvasight/skills/canvasight/SKILL.md`
- `plugins/canvasight/skills/canvasight-open/SKILL.md`
- `plugins/canvasight/skills/canvasight-open/references/open-workflow.md`
- `plugins/canvasight/skills/canvasight-run/SKILL.md`
- `plugins/canvasight/skills/canvasight-run/references/run-output-contract.md`
- `plugins/canvasight/skills/canvasight-troubleshooting/references/troubleshooting.md`
- `agent-reports/QUEUE.md`
- `agent-reports/resolved/20260707-2044-integration-summary-openai-compat-bridge.md`

## 验证方式

- `npm run test:markdown`
- `npm run typecheck`
- `npm run build`
- `npm run test:mcp`
- `npm run test:dev-server`
- `python3 /Users/niallyoung/.codex/skills/.system/plugin-creator/scripts/quick_validate.py <modified-skill>`
- `python3 /Users/niallyoung/.codex/skills/.system/plugin-creator/scripts/validate_plugin.py /Users/niallyoung/Desktop/Canvasight/plugins/canvasight`
- `codex plugin add canvasight@canvasight-local`
- `codex plugin list`
- `npm run dev:status`

## 验证记录

- `npm run test:markdown` passed.
- `npm run typecheck` passed.
- `npm run build` passed.
- `npm run test:mcp` passed, including bridge adapter VM harness.
- `npm run test:dev-server` passed.
- Modified Canvasight skills passed `quick_validate.py`.
- Plugin validation passed.
- `codex plugin add canvasight@canvasight-local` installed cache `0.1.41`.
- `codex plugin list` shows `canvasight@canvasight-local installed, enabled 0.1.41`.
- `npm run dev:status` first reported stale `serverVersion=0.1.40 expected=0.1.41`; `npm run dev` restarted it; final status is `running ... serverVersion=0.1.41`.

## 回写状态

- `agent-reports/QUEUE.md` 已更新。
- 本轮没有新增 issue report。
- 本轮 integration summary 已写入。

## 未解决 / 后续风险

- 需要 new/reloaded Codex thread 真机验收 diagnostics 和 Chat/Plan/Goal Run。

## Git 状态

- branch: main
- commit: pending
- worktree: dirty before final stage/commit
