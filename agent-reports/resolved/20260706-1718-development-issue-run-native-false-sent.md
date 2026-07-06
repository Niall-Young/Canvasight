---
status: resolved
report_type: issue
owner: Development Agent
created_by: main-thread
priority: critical
created_at: 2026-07-06 17:18
updated_at: 2026-07-06 17:18
related_files:
  - plugins/canvasight/mcp/server.mjs
  - plugins/canvasight/tests/dev-server-smoke.mjs
  - plugins/canvasight/tests/mcp-smoke.mjs
solution_report: agent-reports/resolved/20260706-1718-development-solution-run-native-false-sent.md
---

# Canvasight Run direct delivery returned false sent through an isolated app-server

## TL;DR

`codex app-server --stdio` 启动的是隔离 app-server，不是当前 Codex Desktop UI 正在显示的 live thread 服务；它返回 `turn/start` 成功也不会让用户当前窗口出现消息。

## 发现者

main-thread

## 提交 Agent

main-thread

## 建议交接 Agent

Development Agent, Product Agent, Test Supervisor Agent

## 问题描述

用户多次点击节点 Run 后，Canvasight 页面和 daemon 回执显示 `sent`，但当前 Codex 输入区或对话流没有出现 Canvasight Markdown。继续诊断后发现：Canvasight daemon 通过 `/Applications/Codex.app/Contents/Resources/codex app-server --stdio` 自己启动了一个 app-server，该进程能读写会话文件并返回 `turn/start` 成功，但不等同于 Codex Desktop 当前窗口里的 live app-server。

## 现象

- 点击节点 Run。
- Canvasight 返回 `delivery.status = sent`。
- Codex Desktop 当前 thread 没有新增用户消息。
- 用户看到输入框为空，认为按钮没有作用。

## 复现方式

1. 在 Codex Desktop 当前 thread 打开 `http://127.0.0.1:5173/`。
2. claim 当前 Canvasight 项目后点击有内容的节点 Run。
3. 用 daemon 诊断接口观察返回 `sent`。
4. 读取当前 Codex thread，确认没有新增 Canvasight Run 消息。
5. 单独执行 `codex app-server --stdio` 的 `thread/resume` / `thread/read`，只能看到磁盘 idle history，看不到当前 Desktop live in-progress turn。

## 影响范围

- Chat Run direct delivery。
- Plan / Goal 原生模式 direct delivery。
- dev server 旧说明里 claim 后 direct send 的用户预期。
- smoke test 对 fake app-server 的覆盖语义。

## 证据

- 独立 app-server `turn/start` 可返回 turn id，但当前 Codex UI 没有对应消息。
- `codex app-server proxy` 需要 live app-server control socket，当前 `~/.codex/app-server-control/app-server-control.sock` 不存在。
- Codex Desktop 进程持有当前 thread jsonl 文件，但未暴露默认 control socket 给插件进程。

## 初步归因

Canvasight 把隔离 app-server 的协议成功误判成“当前 Codex Desktop thread 已收到”。这不是前端点击事件或坐标问题，而是 runtime 通道错误。

## 交付给哪个 Agent

Development Agent

## 需要回答的问题

- 默认是否还能使用 native direct delivery？
- 如果没有 live app-server 控制通道，Run 状态应该如何反馈给用户？
- 测试如何防止 fake app-server 掩盖 false-positive sent？

## 相关文件

- `plugins/canvasight/mcp/server.mjs`
- `plugins/canvasight/tests/dev-server-smoke.mjs`
- `plugins/canvasight/tests/mcp-smoke.mjs`

## 期望结果

没有可靠 live app-server 通道时，Canvasight 不返回 `sent`，而是把 payload 放入队列，并由当前 Codex thread 通过 `await_canvasight_run` 领取。

## Closure Criteria

- [x] 问题原因明确
- [x] 方案报告已回写
- [x] 修改文件已记录
- [x] 验证方式已记录
- [x] 后续风险已记录

## 当前状态

resolved

## 处理结果

已修复。默认 native direct delivery 改为显式 opt-in，默认 Run 进入队列，UI 显示等待当前 Codex thread 接收。

## 修改文件

- `plugins/canvasight/mcp/server.mjs`
- `plugins/canvasight/src/App.tsx`
- `plugins/canvasight/src/lib/translations.ts`
- `plugins/canvasight/tests/dev-server-smoke.mjs`
- `plugins/canvasight/tests/mcp-smoke.mjs`
- `plugins/canvasight/skills/canvasight-run/SKILL.md`
- `plugins/canvasight/skills/canvasight-run/references/run-output-contract.md`
- `plugins/canvasight/skills/canvasight-open/references/open-workflow.md`
- `plugins/canvasight/skills/canvasight-troubleshooting/references/troubleshooting.md`
- `README.md`

## 验证方式

- `npm run typecheck`
- `npm run test:dev-server`
- `npm run test:mcp`
- `npm run build`
- `python3 /Users/niallyoung/.codex/skills/.system/plugin-creator/scripts/validate_plugin.py /Users/niallyoung/Desktop/Canvasight/plugins/canvasight`

## 后续风险

当前修复牺牲了默认 direct-send 体验，换取不再伪装成功。若 Codex Desktop 后续提供稳定 live app-server socket，需要重新实现 direct delivery 并保留 queued fallback。
