---
status: resolved
report_type: solution
owner: development-agent
created_by: main-thread
priority: critical
created_at: 2026-07-07 10:31
updated_at: 2026-07-07 10:36
related_issue: agent-reports/resolved/20260706-2213-development-issue-run-widget-bridge-not-attached.md
related_files:
  - plugins/canvasight/mcp/server.mjs
  - plugins/canvasight/src/App.tsx
  - plugins/canvasight/src/lib/canvasightApi.ts
  - plugins/canvasight/src/lib/translations.ts
  - plugins/canvasight/src/styles/app.css
  - plugins/canvasight/tests/mcp-smoke.mjs
  - plugins/canvasight/skills/canvasight/SKILL.md
  - plugins/canvasight/skills/canvasight-open/SKILL.md
  - plugins/canvasight/skills/canvasight-open/references/open-workflow.md
  - plugins/canvasight/skills/canvasight-run/SKILL.md
  - plugins/canvasight/skills/canvasight-run/references/run-output-contract.md
  - plugins/canvasight/skills/canvasight-troubleshooting/SKILL.md
  - plugins/canvasight/skills/canvasight-troubleshooting/references/troubleshooting.md
  - README.md
  - design.md
  - AGENTS.md
---

# Run 投递确认与诊断方案

## 负责 Agent

development-agent

## 对应问题

`agent-reports/resolved/20260706-2213-development-issue-run-widget-bridge-not-attached.md`

## Root Cause

Canvasight 原来把 Codex app-server 的 `turn/start` RPC 成功结果当成“已经发送到当前 Codex thread”的证明，但这个结果只能说明请求被某个 app-server 进程接受，不能证明当前可见线程已经收到用户消息。

前端还存在一个状态映射错误：当后端返回 `sent` 时，UI 仍可能展示 browser fallback queued 文案，导致用户看到“进入队列”或“已发送”的判断都不可信。

## 调研过程

- 对照用户截图中的 toast 文案，确认普通 `127.0.0.1` 页面经常不在 native widget bridge 环境里。
- 阅读 `canvasightApi.canSendFollowUpMessage()`、`App.tsx` Run 分支和 `mcp/server.mjs` app-server 投递逻辑，确认存在 widget bridge、browser fallback queue、app-server direct 三条路径。
- 验证 `codex app-server --help` 支持 `--listen stdio://`，保留当前 stdio app-server 通道。
- 按外部方案检查缺口：必须监听 app-server notification，不能只看 RPC response；必须给 UI 暴露诊断信息；必须让 fallback queued 成为明确状态。

## 可选方案

- 方案 A：继续把 `turn/start` RPC result 视为发送成功。风险是继续误报，用户看不到任何真实消息。
- 方案 B：只保留 `await_canvasight_run` 队列，完全取消 app-server direct。实现稳定，但放弃自动投递体验。
- 方案 C：app-server direct 只有在收到匹配的 `turn/started`、`item/started` 或 `turn/completed` notification 后才算 `sent`；否则回落到队列，并在 UI 说明当前需要 `await_canvasight_run` 接收。

## 推荐方案

采用方案 C。它不依赖虚拟点击、剪贴板或 DOM 自动化，同时不再对用户谎报“已发送”。如果 Codex Desktop 当前版本可以发出匹配 notification，Canvasight 直接显示 sent；如果不能，就明确进入队列等待当前 thread 的工具调用接收。

## 实施步骤

1. 在 MCP server 中为 app-server 请求序列加入 notification 解析和短等待确认。
2. 为 `startCodexTurn` 增加 `clientUserMessageId`，只接受匹配 thread、turn 或 client message id 的确认。
3. 让未确认的 app-server `turn/start` 返回 `queued`，reason 为 `turn_start_unverified`。
4. 修复前端 `sent` 状态映射，区分 widget bridge、confirmed app-server、browser fallback queue 和 unverified queue。
5. 增加 Canvasight bridge diagnostics 面板，暴露 iframe、host bridge、session/thread、window.openai 与 MCP bridge 状态。
6. 为 MCP tool descriptors 增加 `outputSchema` 和 nested `_meta.ui.resourceUri`。
7. 更新 skill、README、`design.md` 和 `AGENTS.md`，把“确认后 sent，未确认 queued”的边界写成项目规则。
8. 扩展 MCP smoke test，覆盖 confirmed sent 与 unconfirmed queued 两条路径。

## 风险与回滚

风险：真实 Codex Desktop 版本可能仍不发出可匹配 app-server notification，导致普通浏览器/dev 页面继续进入 queued 状态。

回滚：回滚本次提交即可恢复旧行为；但旧行为会重新出现 false sent 或错误 toast，不建议回滚到误报状态。

## 处理结果

已修复。Canvasight 现在只有在 widget bridge 或 app-server confirmation 可验证时才显示已发送；否则显示明确的 queued/fallback 文案，并保留 Run payload 给 `await_canvasight_run`。

## 修改文件

- `plugins/canvasight/mcp/server.mjs`
- `plugins/canvasight/src/App.tsx`
- `plugins/canvasight/src/lib/canvasightApi.ts`
- `plugins/canvasight/src/lib/translations.ts`
- `plugins/canvasight/src/styles/app.css`
- `plugins/canvasight/tests/mcp-smoke.mjs`
- `plugins/canvasight/skills/canvasight/SKILL.md`
- `plugins/canvasight/skills/canvasight-open/SKILL.md`
- `plugins/canvasight/skills/canvasight-open/references/open-workflow.md`
- `plugins/canvasight/skills/canvasight-run/SKILL.md`
- `plugins/canvasight/skills/canvasight-run/references/run-output-contract.md`
- `plugins/canvasight/skills/canvasight-troubleshooting/SKILL.md`
- `plugins/canvasight/skills/canvasight-troubleshooting/references/troubleshooting.md`
- `README.md`
- `design.md`
- `AGENTS.md`

## 验证方式

- `node --check plugins/canvasight/mcp/server.mjs`
- `node --check plugins/canvasight/tests/mcp-smoke.mjs`
- `npm run typecheck`
- `npm run build`
- `npm run test:dev-server`
- `npm run test:mcp`
- `python3 /Users/niallyoung/.codex/skills/.system/plugin-creator/scripts/validate_plugin.py /Users/niallyoung/Desktop/Canvasight/plugins/canvasight`
- Playwright browser smoke：打开 `http://127.0.0.1:5173/`，打开 diagnostics panel，确认页面渲染与诊断字段可见。

## 后续风险

真实 native widget host bridge 和 Codex Desktop app-server notification 是否能在用户当前桌面版本中产生可见消息，仍需要安装 `canvasight@canvasight-local 0.1.32` 后在新线程或重载会话里实测。本次修复的核心是消除误报，并把未确认路径变成可诊断、可回收的队列状态。
