---
status: resolved
report_type: issue
owner: Development Agent
created_by: main-thread
priority: critical
created_at: 2026-07-06 20:18
updated_at: 2026-07-06 20:33
related_files:
  - plugins/canvasight/src/App.tsx
  - plugins/canvasight/src/lib/translations.ts
  - plugins/canvasight/src/styles/app.css
  - plugins/canvasight/skills/canvasight-open/SKILL.md
  - plugins/canvasight/skills/canvasight-open/references/open-workflow.md
  - plugins/canvasight/skills/canvasight-run/SKILL.md
solution_report: agent-reports/resolved/20260706-2033-development-solution-browser-fallback-run-silent.md
---

# 浏览器 fallback Run 点击无可见反馈

## TL;DR

用户在裸 `127.0.0.1:5173` 浏览器 fallback 页面点击节点 Run，看不到 Codex 新消息，也看不到足够明确的错误/排队反馈。

## 发现者

main-thread

## 提交 Agent

main-thread

## 建议交接 Agent

Development Agent

## 问题描述

Canvasight 0.1.26 已新增 native widget bridge，但当前 Codex thread 没有热刷新出 `render_canvasight_canvas_widget` 工具，用户实际打开的是 `http://127.0.0.1:5173/` 浏览器 fallback。该页面没有 Codex host bridge，Run 点击不能直接发送到当前 Codex thread，只能走 daemon 队列或报未绑定会话。当前 UI 将结果写入 `setStatus`，但顶部状态区域已按网页化要求移除，导致用户看到“点击没有反应”。

## 现象

- 用户截图 URL 为 `http://127.0.0.1:5173/`，不是 native widget。
- Codex 当前会话未暴露 `render_canvasight_canvas_widget`。
- `await_canvasight_run` 曾返回 MCP `Transport closed`，旧 MCP transport 不稳定。
- 点击节点 Run 后，Codex 输入框没有收到 Markdown，页面也没有醒目的失败或 fallback 提示。

## 复现方式

1. 在未刷新插件工具集的 Codex thread 中打开 Canvasight。
2. 系统 fallback 到 `open_canvasight` / `127.0.0.1:5173` 浏览器页面。
3. 在有内容节点上点击 Run。
4. 观察当前 Codex thread 没有自动出现新消息，页面没有足够可见的状态说明。

## 影响范围

- 浏览器 fallback / dev 页面 Run。
- 旧 thread 没有 native widget tool 的迁移体验。
- 用户对“Run 直达当前 Codex thread”的信任。

## 证据

- 用户最新截图显示地址栏为 `127.0.0.1:5173`。
- `plugins/canvasight/src/App.tsx` 仅通过 `setStatus` 写 Run 结果。
- `plugins/canvasight/src/components/Topbar.tsx` 当前不会持续展示主状态。
- 当前 skill list 曾指向旧 `0.1.25` cache，而磁盘只保留 `0.1.26` cache。

## 初步归因

浏览器 fallback 没有 native widget host bridge，本不具备直发能力；同时 UI 反馈和 skill 文档没有强制阻止“用 fallback 当正常 Run 入口”的误用。

## 交付给哪个 Agent

Development Agent

## 需要回答的问题

- 浏览器 fallback Run 后如何给出明显、准确、不会误导的反馈？
- skill/open 文档是否应禁止把 `open_canvasight` 当成正常直发路径？
- 是否需要版本 bump 来避免 Codex 继续使用旧缓存？

## 相关文件

- `plugins/canvasight/src/App.tsx`
- `plugins/canvasight/src/lib/translations.ts`
- `plugins/canvasight/src/styles/app.css`
- `plugins/canvasight/skills/canvasight-open/SKILL.md`
- `plugins/canvasight/skills/canvasight-open/references/open-workflow.md`
- `plugins/canvasight/skills/canvasight-run/SKILL.md`

## 期望结果

- native widget 页面点击 Run 成功时仍显示已发送。
- 浏览器 fallback 页面点击 Run 时，不再“无反应”：必须明确显示已排队/未绑定/无法直发的提示。
- skill 文档明确：没有 `render_canvasight_canvas_widget` 时不能假装 Run 会直发，必须要求刷新/新 thread 或显式 fallback 接收。
- 插件版本 bump，减少旧缓存继续生效的概率。

## Closure Criteria

- [x] 问题原因明确
- [x] 方案报告已回写
- [x] 修改文件已记录
- [x] 验证方式已记录
- [x] 后续风险已记录

## 当前状态

resolved

## 处理结果

已修复浏览器 fallback 无声失败：Run 后显示明确 toast，说明当前页面不能直发 Codex thread，并提示用 `await_canvasight_run` 或 native widget 重新打开。已同步 skill、README 和版本。

## 修改文件

- `README.md`
- `agent-reports/QUEUE.md`
- `plugins/canvasight/.codex-plugin/plugin.json`
- `plugins/canvasight/mcp/server.mjs`
- `plugins/canvasight/package.json`
- `plugins/canvasight/package-lock.json`
- `plugins/canvasight/scripts/dev-server.mjs`
- `plugins/canvasight/src/App.tsx`
- `plugins/canvasight/src/components/ui/toast.tsx`
- `plugins/canvasight/src/lib/translations.ts`
- `plugins/canvasight/src/styles/app.css`
- `plugins/canvasight/skills/canvasight-open/SKILL.md`
- `plugins/canvasight/skills/canvasight-open/references/open-workflow.md`
- `plugins/canvasight/skills/canvasight-run/SKILL.md`
- `plugins/canvasight/skills/canvasight-troubleshooting/references/troubleshooting.md`

## 验证方式

- `npm run typecheck`
- `npm run build`
- `npm run test:mcp`
- `npm run test:dev-server`
- `python3 /Users/niallyoung/.codex/skills/.system/plugin-creator/scripts/validate_plugin.py /Users/niallyoung/Desktop/Canvasight/plugins/canvasight`
- Playwright：打开 `http://127.0.0.1:5173`，点击有内容节点 Run，DOM 验证 `.canvas-run-toast-viewport` 文案出现。

## 后续风险

旧 Codex thread 仍不会热刷新 MCP tool descriptor；如果当前 thread 没有 `render_canvasight_canvas_widget`，必须新开或 reload 后才能走 native widget 直发。
