---
status: resolved
report_type: issue
owner: Development Agent
created_by: main-thread
priority: critical
created_at: 2026-07-10 09:08
updated_at: 2026-07-10 09:48
related_files:
  - plugins/canvasight/mcp/server.mjs
  - plugins/canvasight/.mcp.json
  - plugins/canvasight/skills/canvasight-open/SKILL.md
  - plugins/canvasight/tests/mcp-smoke.mjs
solution_report: agent-reports/resolved/20260710-0927-development-solution-native-run-contract-gaps.md
---

# Native Widget Run 合同仍存在硬失败点

## TL;DR

Canvasight 在 native tool transport 恢复后，仍会因 capability 误判、线程未绑定、模式预检默认禁用、初始 widget 数据未恢复、active rollout 瞬态读取竞争、daemon 启动竞争和 stdout EPIPE 递归而无法可靠 Run。

## 发现者

main-thread

## 提交 Agent

main-thread

## 建议交接 Agent

Development Agent

## 问题描述

Canvasight 额外要求 host 声明 `hostCapabilities.message` 才允许 `mcpApp.sendMessage`，而标准 MCP App 可以用实际发送 Promise 判定结果。Native open 同时没有强制传入 active task 的 `CODEX_THREAD_ID`，空 `CANVASIGHT_CODEX_NATIVE` 会禁用 Chat / Plan / Goal 预检，且 widget 依赖单次 tool-result 通知。当前 rollout 正在写入时，独立 app-server 的 `thread/resume` 还可能短暂读失败。

## 现象

- 用户持续看到 native bridge not ready。
- `open_canvasight` 可成功但曾返回 `codexThreadId: null`。
- MCP 子进程环境不含 `CODEX_THREAD_ID`。
- 默认 `nativeCodexEnabled()` 曾返回 false。
- `thread/resume` 偶发 `rollout does not start with session metadata`。
- 多个 MCP shim 同时启动多个 daemon，分别等待不同 token 后超时。
- host stdout 关闭后旧 shim 递归触发 EPIPE，lifecycle 日志曾增长到 19.7 GB。

## 复现方式

1. 调用 native open 但不显式传 `threadId`。
2. 模拟 MCP App 已连接但 host 未声明 `message` capability。
3. 仅通过 `window.openai.toolResponseMetadata` 提供初始 tool result。
4. 模拟前两次 `thread/resume` rollout 读取失败。

## 影响范围

Native widget 启动、Run bridge、Chat / Plan / Goal preflight、skills 打开流程与真实宿主验收。

## 证据

- Cowart 在 MCP App 握手成功后调用 `App.sendMessage`，以 Promise 结果判定发送。
- OpenAI Apps SDK 将 `ui/message` 定义为 follow-up transport，并提供 `window.openai.sendFollowUpMessage` 兼容层。
- 当前 task shell 可读 `CODEX_THREAD_ID`，MCP 子进程不保证继承。
- smoke 能稳定复现 capability 缺失、初始 globals 和瞬态 resume 失败。

## 初步归因

之前分别修复 transport、打开路径和 bridge adapter，但未把 host capability 兼容、显式线程绑定、默认预检、初始数据恢复和 rollout 竞争作为一个原子 Run 合同验收。

## 交付给哪个 Agent

Development Agent；当前工具策略不允许创建固定子 Agent，本轮由 main thread 执行 Development、Test、Skill、Docs 与 PM checklist。

## 需要回答的问题

- MCP App 已连接但未声明 message capability 时，是否能以实际 send Promise 判定？已回答：能。
- Native open 如何保证 mode preflight 绑定当前 task？已回答：工具 schema 强制 `threadId`。
- Widget 如何从初始 tool response metadata 启动？已回答：读取 `window.openai.toolResponseMetadata`。
- 瞬态 rollout 读取失败如何处理？已回答：仅重试 `thread/resume` 读取竞争。

## 相关文件

- `plugins/canvasight/mcp/server.mjs`
- `plugins/canvasight/.mcp.json`
- `plugins/canvasight/skills/canvasight-open/SKILL.md`
- `plugins/canvasight/tests/mcp-smoke.mjs`

## 期望结果

Native open 显式绑定当前 task id；bridge 连接后实际发送，Promise resolve 才显示 sent；Chat / Plan / Goal 预检默认启用并在失败时阻断发送。

## Closure Criteria

- [x] 问题原因明确
- [x] 方案报告已回写
- [x] 修改文件已记录
- [x] 验证方式已记录
- [x] 后续风险已记录

## 当前状态

resolved

## 处理结果

已修复 capability 假阴性、threadId 缺失、native 预检默认关闭、初始 tool result 丢失、瞬态 resume 读取竞争、daemon single-flight 和 EPIPE 日志失控。

## 修改文件

- `plugins/canvasight/mcp/server.mjs`
- `plugins/canvasight/.mcp.json`
- `plugins/canvasight/tests/mcp-smoke.mjs`
- Canvasight open/run/troubleshooting skills
- `README.md`
- `AGENTS.md`
- `design.md`

## 验证方式

- `npm run test:mcp`
- `npm run test:markdown`
- `npm run typecheck`
- `npm run build`
- `npm run test:dev-server`
- plugin validator 与全部 Canvasight skill quick validate

## 后续风险

Codex App 不允许 Computer Use 控制自身，无法在本轮自动点击 widget Run；当前 task 的旧 `0.1.45` transport 在清理后不会热重建。缓存级 `0.1.48` native open 已通过，最终 UI 发送仍需由加载新 transport 的 native widget host Promise 验收。
