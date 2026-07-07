---
status: resolved
report_type: issue
owner: Development Agent
created_by: main-thread
priority: critical
created_at: 2026-07-07 16:42
updated_at: 2026-07-07 17:12
related_files:
  - plugins/canvasight/src/App.tsx
  - plugins/canvasight/src/lib/canvasightApi.ts
  - plugins/canvasight/mcp/server.mjs
  - plugins/canvasight/skills/canvasight-open/SKILL.md
  - plugins/canvasight/skills/canvasight-open/references/open-workflow.md
solution_report: agent-reports/resolved/20260707-1712-development-solution-manual-project-path-gate.md
---

# 打开画布时出现手动项目路径输入页

## 提交 Agent

main-thread

## 建议交接 Agent

Development Agent

## 问题描述

用户在 Codex 项目中打开 Canvasight 后看到居中的项目路径输入页：`Enter a local project path to open a Canvasight workspace.`。用户明确要求 Canvasight 应该在当前 Codex 项目里自动创建/打开 `.scatter`，不应要求用户手动输入路径。

## 现象

- 前端在 thread-only fallback URL 下不会自动打开默认项目，这是上一轮为了避免误绑 Canvasight repo 加的保护。
- 但当前 UX 变成手动输入项目路径，违背“在哪个项目打开就创建在哪个项目”的产品要求。
- `.mcp.json` 将 MCP server `cwd` 固定为插件目录，工具默认路径如果拿不到当前项目也会偏向插件仓库。

## 复现方式

1. 在某个 Codex 项目 thread 中点击 Canvasight 打开画布。
2. Canvasight 页面加载为 thread-only fallback 或缺少 projectPath 的状态。
3. 页面出现路径输入框而不是自动打开当前项目。

## 影响范围

- Canvasight 初次打开体验。
- 非 Canvasight 项目 `.scatter` 自动创建。
- 用户对“项目绑定”的信任。

## 相关文件

- `plugins/canvasight/src/App.tsx`
- `plugins/canvasight/src/lib/canvasightApi.ts`
- `plugins/canvasight/mcp/server.mjs`
- `plugins/canvasight/skills/canvasight-open/SKILL.md`
- `plugins/canvasight/skills/canvasight-open/references/open-workflow.md`

## 期望结果

- 正常打开 Canvasight 时必须自动绑定当前 Codex 项目路径，并在该项目下创建/打开 `.scatter`。
- 不再展示大号手动路径输入页作为默认空状态。
- 如果 fallback 链路确实拿不到当前项目路径，应显示明确的不可恢复错误，要求通过插件工具重新打开，而不是让用户手动填路径。

## 当前状态

resolved

## 处理结果

已修复。Canvasight 不再在 thread-only fallback 或缺少 session project 时展示手动项目路径输入页；打开时会通过当前 Codex thread 解析项目 `cwd`，并在该项目下创建/打开 `.scatter`。AI 写图、claim、await 的默认项目解析也改为优先当前 thread 项目，避免掉回插件仓库。

## 修改文件

- `plugins/canvasight/src/App.tsx`
- `plugins/canvasight/src/lib/canvasightApi.ts`
- `plugins/canvasight/src/styles/app.css`
- `plugins/canvasight/vite.config.ts`
- `plugins/canvasight/mcp/server.mjs`
- `plugins/canvasight/tests/dev-server-smoke.mjs`
- `plugins/canvasight/tests/mcp-smoke.mjs`
- `plugins/canvasight/skills/canvasight-open/SKILL.md`
- `plugins/canvasight/skills/canvasight-open/references/open-workflow.md`
- `plugins/canvasight/skills/canvasight-troubleshooting/references/troubleshooting.md`
- `README.md`
- `AGENTS.md`

## 验证方式

- `npm run typecheck`
- `npm run test:dev-server`
- `npm run build`
- `npm run test:mcp`
- `python3 /Users/niallyoung/.codex/skills/.system/plugin-creator/scripts/validate_plugin.py /Users/niallyoung/Desktop/Canvasight/plugins/canvasight`
- `npm run dev:status`
- `codex plugin add canvasight@canvasight-local`
- `codex plugin list`
- `POST /api/sessions/local/resolve-thread-project` 使用当前 `CODEX_THREAD_ID` 返回当前项目路径。

## 后续风险

旧 Codex thread 可能仍加载旧插件工具描述，需要 reload 或新开 thread 才能看到 0.1.37 的 MCP 工具。裸 `http://127.0.0.1:5173/` 没有任何 thread 上下文时仍只能作为开发页面，不代表真实项目打开入口。
