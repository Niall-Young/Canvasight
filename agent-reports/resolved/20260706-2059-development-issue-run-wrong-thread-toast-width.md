---
status: resolved
report_type: issue
owner: Development Agent
created_by: main-thread
priority: critical
created_at: 2026-07-06 20:59
updated_at: 2026-07-06 20:59
related_files:
  - plugins/canvasight/vite.config.ts
  - plugins/canvasight/src/App.tsx
  - plugins/canvasight/src/lib/canvasightApi.ts
  - plugins/canvasight/src/styles/app.css
  - plugins/canvasight/tests/dev-server-smoke.mjs
solution_report: agent-reports/resolved/20260706-2059-development-solution-run-wrong-thread-toast-width.md
---

# Canvasight Run 错发线程且 toast 过宽

## TL;DR

裸 `127.0.0.1:5173` 页面会把启动 dev server 的旧 `CODEX_THREAD_ID` 当作 Run 目标，导致 toast 显示已发送但当前可见 thread 没有消息；Run toast 也被局部 CSS 覆盖成固定长条。

## 发现者

main-thread

## 提交 Agent

main-thread

## 建议交接 Agent

Development Agent

## 问题描述

用户在 Codex 内置浏览器打开 Canvasight 后点击有内容节点的 Run，页面显示“已发送到当前 Codex thread”，但当前可见 Codex thread 没有新增消息。截图中 toast 横向铺开，视觉上不是 hug-content。

## 现象

- 当前可见 thread `打开画面` 的 id 是 `019f3755-9941-7560-8eb4-8c6a937e0035`。
- 最近一次直接 run 验证返回 `turn/start` sent 的目标是旧开发 thread `019f2af1-d6ed-7793-b0e3-047d83bcbfb1`。
- `open_canvasight` 工具在用户打开页的 thread 中不可用，因此该 thread 只通过浏览器控制打开了裸 `5173` 页面，没有完成 Canvasight claim。
- `.canvas-run-toast-viewport .kit-toast` 把全局 hug-content toast 覆盖为 `width: 100%`。

## 复现方式

1. 在一个 Codex thread 中启动或复用 Canvasight dev server。
2. 在另一个 Codex thread 中仅用 Codex 内置浏览器打开 `http://127.0.0.1:5173/`。
3. 点击有内容节点的 Run。
4. 观察页面显示 sent toast，但当前可见 thread 没有收到消息。

## 影响范围

- 裸 dev 页面和浏览器兜底打开路径。
- Canvasight Run 到 Codex thread 的用户信任。
- Run toast 的视觉反馈宽度。

## 证据

- `codex_app.list_threads("打开画面")` 显示当前可见 thread id 为 `019f3755-9941-7560-8eb4-8c6a937e0035`。
- 直接 HTTP run 结果曾返回 `threadId: 019f2af1-d6ed-7793-b0e3-047d83bcbfb1`。
- `plugins/canvasight/vite.config.ts` 中 `ensureDevDaemonSession` 会在没有 project claim 时 fallback 到 `process.env.CODEX_THREAD_ID` 并创建 daemon session。
- `plugins/canvasight/src/styles/app.css` 中 `.canvas-run-toast-viewport .kit-toast` 设置了 `width: 100%`。

## 初步归因

运行时把进程环境中的旧 thread id 当作当前可见 thread；浏览器兜底打开没有可靠 host bridge 或 explicit claim 时仍允许显示 sent 成功。toast 过宽是 CSS 覆盖导致。

## 交付给哪个 Agent

Development Agent

## 需要回答的问题

- 裸 `5173` 页面是否应完全禁止使用 dev server 进程 `CODEX_THREAD_ID` 作为发送目标？
- 如何让浏览器兜底打开可以显式绑定当前 thread，而不是依赖旧环境变量？
- `sent` toast 在浏览器 fallback 下应如何避免误导？

## 相关文件

- `plugins/canvasight/vite.config.ts`
- `plugins/canvasight/src/App.tsx`
- `plugins/canvasight/src/lib/canvasightApi.ts`
- `plugins/canvasight/src/styles/app.css`
- `plugins/canvasight/tests/dev-server-smoke.mjs`

## 期望结果

裸 dev 页面没有 explicit claim 时不得显示发送成功，也不得向旧 thread 发送；带 explicit claim 的页面才可以直发到绑定 thread。Run toast 宽度应随内容收缩，并保持最大宽度和移动端安全边距。

## Closure Criteria

- [x] 问题原因明确
- [x] 方案报告已回写
- [x] 修改文件已记录
- [x] 验证方式已记录
- [x] 后续风险已记录

## 当前状态

resolved

## 处理结果

已修复。裸 dev 页面不再使用启动进程的旧 `CODEX_THREAD_ID` 作为发送目标；未显式 claim 时返回 `unbound_dev_session`。浏览器 URL 可通过 `threadId` 参数完成当前线程绑定，Run toast 改为内容自适应宽度。

## 修改文件

- `plugins/canvasight/vite.config.ts`
- `plugins/canvasight/src/App.tsx`
- `plugins/canvasight/src/lib/canvasightApi.ts`
- `plugins/canvasight/src/lib/translations.ts`
- `plugins/canvasight/src/styles/app.css`
- `plugins/canvasight/tests/dev-server-smoke.mjs`
- `plugins/canvasight/skills/canvasight-open/SKILL.md`
- `plugins/canvasight/skills/canvasight-open/references/open-workflow.md`
- `plugins/canvasight/skills/canvasight-run/SKILL.md`
- `plugins/canvasight/skills/canvasight-run/references/run-output-contract.md`
- `README.md`
- `AGENTS.md`
- `design.md`

## 验证方式

- `npm run typecheck`
- `npm run test:dev-server`
- `npm run test:mcp`
- `npm run build`
- `python3 /Users/niallyoung/.codex/skills/.system/plugin-creator/scripts/validate_plugin.py /Users/niallyoung/Desktop/Canvasight/plugins/canvasight`
- 浏览器可见验证：未绑定裸 `5173` 点击 Run 显示 `当前页面未绑定 Codex thread`，toast 宽度 277px。

## 后续风险

浏览器 fallback 仍然不能自动读取 Codex 当前可见 thread；必须通过 `render_canvasight_canvas_widget`、`open_canvasight`、`claim_canvasight_thread` 或带 `threadId` 的 dev URL 建立绑定。
