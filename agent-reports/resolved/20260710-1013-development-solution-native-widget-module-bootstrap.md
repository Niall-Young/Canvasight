---
status: resolved
report_type: solution
owner: main-thread
created_by: main-thread
priority: high
created_at: 2026-07-10 10:13
updated_at: 2026-07-10 10:13
related_issue: agent-reports/assigned/20260710-1003-test-issue-native-widget-shell-only.md
related_files:
  - plugins/canvasight/mcp/server.mjs
  - plugins/canvasight/tests/mcp-smoke.mjs
  - plugins/canvasight/.codex-plugin/plugin.json
  - plugins/canvasight/package.json
  - plugins/canvasight/package-lock.json
---

# 原生 widget 模块加载修复

## 负责 Agent

Development Agent 完成根因复现与修复建议；因角色执行被中断，主线程按该方案完成实现、验证与文档同步。

## 对应问题

`agent-reports/assigned/20260710-1003-test-issue-native-widget-shell-only.md`

## Root Cause

widget shell 从 `text/plain` 中取出 Vite bundle 后以普通 script 动态插入。bundle 的顶层变量在真实 Codex widget 宿主发生重复声明，抛出 `Identifier 'Hg' has already been declared`，React root 没有挂载。shell 又无条件写入 `Canvasight ready`，误把失败展示为成功。

## 解决方案

- 动态插入的 bundle 显式使用 `script.type = "module"`，保持 Vite 的模块作用域。
- 加载期间显示 `Loading Canvasight...`；成功后清除 bootstrap 状态；模块错误显示可恢复错误，而不再显示错误的 ready 状态。
- MCP smoke harness 模拟 module 成功与失败事件，断言模块类型和可见失败提示。
- 所有 MCP runtime 版本统一提升到 `0.1.49`。

## 处理结果

模块化 bootstrap 已修复，原生 host 不再以普通 script 执行 bundle。

## 修改文件

- `plugins/canvasight/mcp/server.mjs`
- `plugins/canvasight/tests/mcp-smoke.mjs`
- `plugins/canvasight/.codex-plugin/plugin.json`
- `plugins/canvasight/package.json`
- `plugins/canvasight/package-lock.json`

## 验证方式

- `npm run test:mcp`
- `npm run typecheck`
- `npm run build`
- plugin validator
- Codex in-app browser fallback visible interaction check

## 后续风险

正在打开的 Codex thread 不会热刷新 widget resource。安装 `0.1.49` 后需要 reload 或新开 thread，才能完成真实 native widget 宿主验收。
