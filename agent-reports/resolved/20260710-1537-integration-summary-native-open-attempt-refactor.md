---
status: resolved
report_type: integration-summary
owner: main-thread
created_by: main-thread
priority: critical
created_at: 2026-07-10 15:37
updated_at: 2026-07-10 15:37
related_files:
  - agent-reports/assigned/20260710-1506-development-issue-native-open-attempt-refactor.md
  - agent-reports/resolved/20260710-1537-development-solution-native-open-attempt-refactor.md
---

# 原生打开链路 OpenAttempt 重构集成总结

## 本轮目标

- 保留画布 UI、Zustand、`.scatter`、daemon 持久化与公开工具名，替换 MCP 到 widget ready/Run 的内部链路。

## Agent 状态

- Product Agent：主线程执行范围与兼容性检查。
- Design Agent：`/root/design_agent_v2` 完成 startup/failure UI 与 design 基线。
- Development Agent：`/root/development_agent_v2` 部分实施后中断，主线程接管并完成。
- Test Supervisor Agent：`/root/test_supervisor_agent_v2` 完成回归与生产组合测试。
- Customer Support Agent：`/root/customer_support_agent` 完成双语 README。
- Design Standards Expert：主线程结合 Design 方案核对 `design.md`。
- Development Standards Lead：主线程更新 `AGENTS.md`。
- Project Management Agent：主线程核对 git scope；未提交，等待真实宿主验收。
- Skill Expert Agent：受并发槽位限制未创建；主线程按 skill-creator 指南更新并验证四个 skill。

## 已解决

- session 级假 ready 被 OpenAttempt 与 instance identity 替换。
- hidden/inline renderer 不能满足 fullscreen ready。
- Ready/Failed 不再被迟到 metadata、globals 或 app-ready 事件覆盖。
- production bundle 组合测试发现并修复 diagnostics 触发的 React maximum update depth 闭环。
- Run 仅允许已验收 fullscreen instance 发往绑定 task。

## 未解决

- 真实 Codex Desktop 五项验收需要宿主重启后新任务；当前 task 仍持有旧插件 registry/schema。

## 已完成改动

- 实现 OpenAttempt、实例注册表、两阶段 open/await、单调 startup、失败恢复、metadata 收敛与严格 Run 身份门禁。
- 增加完整 widget HTML + production bundle + fake fullscreen MCP host 的 Chrome 组合 smoke。
- 同步 README、design、AGENTS、skills、版本与 dist。

## 处理结果

实现与本地验证完成；native-host 状态保持 assigned/unverified。

## 验证记录

- build、widget-runtime、MCP、Markdown、dev-server：PASS。
- plugin validator、四个 skill quick validators、JS syntax、diff check：PASS。
- installed：`canvasight@canvasight-local 0.3.0+codex.20260710073625`。

## 回写状态

- `agent-reports/QUEUE.md` 已更新。
- development/design/test issue 保持 assigned，明确等待真实宿主验收。
- development/design/test/customer-support solution reports 已写入。

## 未解决 / 后续风险

- 重启 Codex Desktop 后必须在新 task 验证 fullscreen ready、完整画布、真实控件、同 task Run、迟到事件不回退 Connecting；失败则继续维护 critical issue，不得宣称 fixed。

## Git 状态

- branch: `main`
- commit: 未创建
- worktree: 本轮文件未提交；保留给真实宿主验收后的最终提交决策。
