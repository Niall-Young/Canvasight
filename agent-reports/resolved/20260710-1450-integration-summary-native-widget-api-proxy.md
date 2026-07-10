---
status: resolved
report_type: integration-summary
owner: main-thread
created_by: main-thread
priority: critical
created_at: 2026-07-10 14:50
updated_at: 2026-07-10 14:50
related_files:
  - plugins/canvasight/mcp/server.mjs
  - plugins/canvasight/src/lib/canvasightApi.ts
  - plugins/canvasight/src/lib/widgetBridge.ts
  - plugins/canvasight/tests/mcp-smoke.mjs
  - agent-reports/assigned/20260710-1359-development-issue-native-widget-bootstrap-architecture-reset.md
---

# 原生 Widget API 代理集成总结

## 本轮目标

- 处理真实 0.2.0 widget 从 Starting 进入 Connecting 后永久不 ready 的问题。
- 消除 sandboxed native widget 对 localhost JSON fetch 的启动依赖。
- 用真实 session GET、ready POST 和 await ready 回归门禁替换手工 ready 假绿。

## Agent 状态

- Development Agent（`/root/development`）：完成只读根因分析；建议 native API 改走 MCP proxy。
- Test Supervisor Agent（`/root/test_supervisor`）：识别手工 app-ready 假绿，提出真实 API/ready 与 direct-detail globals 测试。
- Customer Support Agent（`/root/customer_support`）：确认 README 中英 FAQ 和 troubleshooting reference 需要覆盖 Connecting 语义。
- Product、Design、Design Standards、Development Standards、Project Management、Skill Expert：受三并发子 Agent 限制，由 main-thread 明确执行各自 scope/UX/design.md/AGENTS.md/git/skill checklist；未创建重复角色。

## Agent 输入

- Connecting 证明 metadata 已解析，不证明 session API 或 ready 成功。
- timeout 的默认 `reactMounted:false` 不能单独证明 React 未运行。
- 直接 localhost fetch 在真实 native host 中不可作为可靠 API 路线。
- 测试必须禁止手工 ready 代替真实 session/ACK 链。

## 报告状态变更

- 1359 critical issue 写入真实 0.2.0 复测和第二阶段修复，保持 assigned。
- 新建 1450 development solution。
- 新建本 integration summary。

## 已解决

- Native JSON APIs 统一使用 app-only MCP proxy，浏览/dev 仍使用直接 daemon fetch。
- Proxy 具有路径和方法 allowlist，不向 widget 暴露 daemon token。
- Widget resource read 等待 daemon，CSP 在资源返回时包含精确 origin。
- OpenAI globals 兼容 nested/direct event detail。
- Tests 断言 native 零 localhost fetch，真实 proxy session GET/ready POST 与 await ready。
- README、design、AGENTS 和 troubleshooting reference 更新。
- 版本 `0.2.0+codex.20260710064916` 构建并安装。

## 未解决

- 新版本仍需 Codex Desktop reload/restart 后在真实 host 验证 ready、完整画布、控件和 Run。

## 风险

- 附件图片资源仍由 daemon URL 提供，依赖已修复的 exact-origin resource CSP；真实附件显示待验收。
- 真实 host 验收前不得关闭 1359 issue或宣称已修复。

## 下一轮分派

- main-thread：用户重启 Codex 后复测 open + await ready，随后验证控件与同任务 Run。
- Test Supervisor：复核真实证据。
- Project Management：验收通过后 stage/commit。

## 已完成改动

- Runtime、tests、dist、version、docs、standards、troubleshooting reference 和 reports 已同步。

## 处理结果

实现和自动验证完成；真实 native-host 交付仍标记 `unverified`。

## 修改文件

- Runtime：`server.mjs`、`canvasightApi.ts`、`widgetBridge.ts`
- Test/build/version：`mcp-smoke.mjs`、`dist/`、四处版本文件
- Contracts/docs：`AGENTS.md`、`design.md`、`README.md`、troubleshooting reference
- Reports：QUEUE、1359 issue、1450 solution、本 summary

## 验证方式

- build、MCP smoke、markdown smoke、dev-server smoke
- plugin validator、skill validator、diff check
- exact-version install and `codex plugin list`

## 验证记录

- 所有自动验证通过。
- 安装缓存：`/Users/niallyoung/.codex/plugins/cache/canvasight-local/canvasight/0.2.0+codex.20260710064916`。

## 回写状态

- QUEUE、1359 issue、solution 和 integration summary 已回写。

## 未解决 / 后续风险

- 真实 ready/control/Run acceptance pending。

## Git 状态

- branch: `main`
- base commit: `71c82a2`
- worktree: dirty，未 stage/commit，等待真实 host 验收
