---
schema_version: 1
report_id: integration-summary-native-widget-binding-reuse-timeout
report_type: integration-summary
status: resolved
owner: Main Thread
created_by: Main Thread
priority: critical
version: 1
agent_id: /root
thread_id: 019f5694-1746-7223-bd64-8cbca20eb319
created_at: 2026-07-12T14:04:28Z
updated_at: 2026-07-12T14:04:28Z
depends_on:
  - 20260710-1506-development-issue-native-open-attempt-refactor
  - solution-native-widget-binding-reuse-timeout
related_files:
  - plugins/canvasight/mcp/server.mjs
  - plugins/canvasight/src/lib/widgetBridge.ts
  - plugins/canvasight/src/lib/canvasightApi.ts
  - plugins/canvasight/src/main.tsx
  - plugins/canvasight/src/App.tsx
  - plugins/canvasight/tests/mcp-smoke.mjs
verification_status: passed
verification_evidence:
  - automated runtime, build, daemon and plugin checks passed
  - native host acceptance remains explicitly unverified
---

# 原生 Widget 复用绑定超时集成总结

## 本轮目标与结果

修复已挂载 Canvasight 容器拒绝新 open binding、导致新 attempt 停在 `starting` 并于 15 秒超时的问题。运行时现在按服务端 binding 世代切换会话，重新挂载 App，并把默认等待统一为 30 秒。

## Agent 决策

- Development Agent：完成绑定世代、bridge rebind、React 重挂载、异步隔离、超时诊断和版本同步。
- Test Supervisor Agent：补齐红灯复现与新/旧/重复 binding、旧异步回执、私有元数据、默认/显式超时回归。
- Design Agent / Customer Support / Design Standards：同步设计基线和双语 README；不新增用户恢复流程。
- Project Management Agent：记录基线和混合工作树，只允许选择性暂存本轮 hunk。
- Product、Development Standards、Skill Expert：本轮不改变产品范围、AGENTS.md 或技能触发合同，由 Main Thread 完成无改动复核。

## 验证记录

- 通过：typecheck、build、test:markdown、test:widget-runtime、test:mcp、test:dev-server、plugin validator、git diff check。
- 精确安装：`canvasight@canvasight-local` `0.4.4+codex.20260712135359`。
- 未通过：Agent Team 全库 validator；既有 legacy 根目录报告、旧模板和 QUEUE schema 不符合当前 validator，未在本轮迁移。
- 未执行：重启后的真实 Codex native-host 五项验收，因此关联 issue 不关闭。

## Git 与范围

- 用户提供基线：`2d44998bdd468fd9a54164925f7b9d1302557c0f`。
- 实施时 HEAD：`2f4c22960b454a97a27b3c2268744db770f33eec`，包含已完成的节点菜单删除修复，未回退。
- 工作树同时含 software-product guidance 交付；README、server、MCP tests、ROSTER 和 QUEUE 必须按 hunk 隔离。
- 计划提交：`fix: 修复原生画布复用启动超时`。

## 未解决风险

重启 Codex Desktop 后仍需在新任务验证首次 fullscreen ready、复用右侧容器再次打开、真实控件、Run 回到新任务以及迟到 metadata 不回退。完成前不得宣称 native widget 已在真实宿主修复。
