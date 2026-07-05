---
status: resolved
report_type: issue
owner: Product Agent
created_by: Main thread
priority: medium
created_at: 2026-07-05 23:23
updated_at: 2026-07-05 23:23
related_files:
  - plugins/canvasight/mcp/server.mjs
  - plugins/canvasight/tests/mcp-smoke.mjs
  - plugins/canvasight/skills/canvasight-open/SKILL.md
  - plugins/canvasight/skills/canvasight-open/references/open-workflow.md
  - plugins/canvasight/skills/canvasight-troubleshooting/references/troubleshooting.md
  - README.md
solution_report: agent-reports/resolved/20260705-2323-development-solution-open-target-system-browser.md
agent_id: 019f31ba-5e18-7f33-a7c2-189dd10f0129
---

# Canvasight 默认打开到系统浏览器

## 提交 Agent

Main thread

## 建议交接 Agent

Development Agent, Test Supervisor Agent, Customer Support Agent

## 问题描述

用户发现 `open_canvasight` 当前会直接打开系统默认浏览器，而不是默认进入 Codex 侧边栏内置浏览器。这与 Canvasight 作为 Codex plugin 的使用预期不一致。

## 复现方式

1. 调用 `open_canvasight`。
2. 观察系统默认浏览器被 macOS `open <url>` 拉起。
3. Codex 侧边栏内置浏览器没有成为默认打开目标。

## 影响范围

- 打断 Codex 内侧边工作流。
- 可能让用户误以为 Canvasight 仍是外部网页/客户端，而不是 Codex plugin 侧边画布。
- 新线程恢复和 Run 交接仍可用，但打开体验不符合预期。

## 相关文件

- `plugins/canvasight/mcp/server.mjs`
- `plugins/canvasight/tests/mcp-smoke.mjs`
- `plugins/canvasight/skills/canvasight-open/SKILL.md`
- `plugins/canvasight/skills/canvasight-open/references/open-workflow.md`
- `plugins/canvasight/skills/canvasight-troubleshooting/references/troubleshooting.md`
- `README.md`

## 期望结果

`open_canvasight` 默认不再调用系统浏览器。tool result 应明确标记 `openTarget: codex_in_app_browser`，并保留完整 `browserUrl` 给 Codex 内置浏览器侧边栏打开。外部浏览器只作为显式开发调试选项。

## 当前状态

resolved

## Closure Criteria

- [x] 问题原因明确
- [x] 方案报告已回写
- [x] 修改文件已记录
- [x] 验证方式已记录
- [x] 后续风险已记录
