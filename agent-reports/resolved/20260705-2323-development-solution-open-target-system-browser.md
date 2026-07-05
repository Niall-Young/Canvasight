---
status: resolved
report_type: solution
owner: Development Agent
created_by: Main thread
priority: medium
created_at: 2026-07-05 23:23
updated_at: 2026-07-05 23:27
related_files:
  - plugins/canvasight/mcp/server.mjs
  - plugins/canvasight/tests/mcp-smoke.mjs
  - plugins/canvasight/skills/canvasight-open/SKILL.md
  - plugins/canvasight/skills/canvasight-open/references/open-workflow.md
  - plugins/canvasight/skills/canvasight-troubleshooting/references/troubleshooting.md
  - README.md
solution_report:
agent_id:
---

# 修复 Canvasight 默认打开目标

## Linked Issue

`agent-reports/resolved/20260705-2323-product-issue-open-target-system-browser.md`

## 负责 Agent

Development Agent

## Root Cause

`toolOpenCanvasight` 在验证 URL 可访问后调用 `openBrowser(url)`。该函数在 macOS 上执行系统命令 `open <url>`，因此会拉起系统默认浏览器，而不是 Codex 侧边栏内置浏览器。

## 调研过程

- 复查 `canvasight-open` skill，确认期望流程是 Codex 使用 in-app Browser 打开完整 `browserUrl`。
- 复查 `server.mjs`，确认当前实现有系统浏览器副作用。
- 复查 Codex app-server 可见能力，未发现稳定的 MCP server 直接控制侧边栏浏览器方法。

## 可选方案

1. 保留系统 `open`，让用户手动关闭外部浏览器。
2. MCP server 尝试使用未公开 app-server 方法打开侧边栏。
3. 默认停止系统浏览器副作用，把打开目标显式返回为 `codex_in_app_browser`；外部浏览器仅通过显式环境变量开启。

## 推荐方案

采用方案 3。它消除错误副作用，并保留未来由 Codex host / Browser skill 按 `browserUrl` 打开侧边栏的稳定路径。

## 实施步骤

- 将 `openBrowser` 改为 `openExternalBrowser`。
- 默认跳过外部浏览器；仅 `CANVASIGHT_OPEN_EXTERNAL_BROWSER=1` 或 legacy `CANVASIGHT_OPEN_BROWSER=1` 时打开外部浏览器。
- `open_canvasight` structuredContent 增加 `openTarget: "codex_in_app_browser"` 和 `externalBrowser` 状态。
- 更新 MCP smoke 对 `openTarget` 和 `externalBrowser.status` 的断言。
- 更新 README、open skill、troubleshooting 文档。
- bump 到 `0.1.11`。

## 风险与回滚

- 风险：如果某些非 Codex 环境依赖自动外部浏览器打开，需要显式设置环境变量。
- 缓解：README 和 troubleshooting 已记录 `CANVASIGHT_OPEN_EXTERNAL_BROWSER=1`。
- 回滚：恢复 `openBrowser(url)` 默认调用，并降回 `0.1.10`。

## 验证方式

- 已通过：`npm run typecheck`
- 已通过：`npm run test:mcp`
- 已通过：`npm run build`
- 已通过：`python3 /Users/niallyoung/.codex/skills/.system/plugin-creator/scripts/validate_plugin.py /Users/niallyoung/Desktop/Canvasight/plugins/canvasight`
- 已通过：`python3 /Users/niallyoung/.codex/skills/.system/skill-creator/scripts/quick_validate.py plugins/canvasight/skills/canvasight-open`
- 已通过：`python3 /Users/niallyoung/.codex/skills/.system/skill-creator/scripts/quick_validate.py plugins/canvasight/skills/canvasight-troubleshooting`
- 已通过：`git diff --check`
- 已通过：`rg` 检查外部浏览器默认打开路径已移除，`openTarget` 覆盖 server、tests、README。

## 处理结果

已修复。

## 修改文件

- `plugins/canvasight/mcp/server.mjs`
- `plugins/canvasight/tests/mcp-smoke.mjs`
- `plugins/canvasight/skills/canvasight-open/SKILL.md`
- `plugins/canvasight/skills/canvasight-open/references/open-workflow.md`
- `plugins/canvasight/skills/canvasight-troubleshooting/references/troubleshooting.md`
- `README.md`
- `plugins/canvasight/package.json`
- `plugins/canvasight/package-lock.json`
- `plugins/canvasight/.codex-plugin/plugin.json`

## 后续风险

当前 MCP server 不能直接驱动 Codex 侧边栏浏览器。下一步如果 Codex app-server 提供稳定 browser navigation 方法，可以把 `openTarget` 从提示契约升级为直接 native navigation。
