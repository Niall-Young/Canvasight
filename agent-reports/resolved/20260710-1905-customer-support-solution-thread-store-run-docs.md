---
status: resolved
report_type: solution
owner: Customer Support Agent
created_by: Customer Support Agent
priority: high
created_at: 2026-07-10 19:05
updated_at: 2026-07-10 19:05
related_issue: agent-reports/assigned/20260710-1905-development-issue-persistent-thread-store-run-block.md
related_files:
  - README.md
  - plugins/canvasight/mcp/server.mjs
  - plugins/canvasight/skills/canvasight-run/SKILL.md
  - plugins/canvasight/skills/canvasight-troubleshooting/SKILL.md
---

# Run 的 Codex thread-store 预检失败文档决策

## 负责 Agent

Customer Support Agent

## 对应问题

用户在已验证的 Canvasight 原生 widget 点击 Run 时收到：`Canvasight Run blocked before sendMessage: failed to read thread ... rollout ... does not start with session metadata`。

## Root Cause

现有 README 仅说明通用的 Chat / Plan / Goal 预检可能阻断发送，未覆盖 Codex 无法读取绑定任务本地 rollout/session metadata 的具体症状、边界与安全恢复方式。该错误发生在 Canvasight 调用 widget `sendMessage` 前，因此不应让用户误以为节点 Markdown、host bridge 或 browser fallback 可以修复它。

## 调研过程

已核对 `AGENTS.md`、`design.md`、`plugins/canvasight/package.json`、`plugins/canvasight/mcp/server.mjs` 和全部 `plugins/canvasight/skills/*/SKILL.md`。当前 server 已将 `failed to read thread`、`rollout does not start with session metadata` 和 `thread-store internal error` 识别为 `thread/resume` 可重试错误；但 Run 在 `applyCodexNativeMode` 未成功时仍明确抛出 `Canvasight Run blocked before sendMessage`。README 的中英文 FAQ 只覆盖 generic preflight、fallback 和 `Transport closed`。

## 可选方案

- 方案 A：不更新 README，把此错误作为内部诊断细节。
- 方案 B：在中英文 FAQ 增加一条可操作的 thread-store / rollout metadata Run 阻断说明。

## 推荐方案

采用方案 B。修复或重试策略会直接改变用户在 Run 被阻断后的操作，README 必须在同一交付中说明该错误发生在发送前、不会丢失为已发送，以及正确恢复路径。

## 实施步骤

1. 在中英文 FAQ 的 “Run 为什么没有出现在当前任务？” 后增加对应条目。
2. 说明这是 Codex 读取当前任务本地 session/rollout metadata 失败，不是 Canvasight 节点内容错误。
3. 说明 Chat 在预检重试仍失败时可继续由同一已验证 native widget 的 host bridge 发送，但只有 `sendMessage` Promise 成功才算已发送；Plan/Goal 必须在重载后的新任务重试。
4. 明确 browser fallback、手动 dev server 和重复显示“已发送”都不是恢复方案。

## 建议文案

中文：**Run 显示 `failed to read thread` 或 `rollout does not start with session metadata` 怎么办？** 这表示 Codex 在 Canvasight 调用 `sendMessage` 前无法读取当前任务的本地 session/rollout metadata，不是节点内容错误。Canvasight 先重试可恢复的预检错误；Chat 若仍无法恢复，可继续交给同一已验证 native widget 的 host bridge，只有 `sendMessage` Promise 成功才算已发送。Plan/Goal 不能跳过预检：保留节点内容，重载或重启 Codex 后新建任务、重新打开 Canvasight 再试。browser fallback 和 dev 页面不能修复原生任务存储。

English: **What if Run shows `failed to read thread` or `rollout does not start with session metadata`?** Codex could not read the current task's local session/rollout metadata before Canvasight calls `sendMessage`; this is not a node-content error. Canvasight first retries recoverable preflight errors. If Chat still cannot recover, it may proceed to the same verified native widget's host bridge, and it is sent only when the `sendMessage` Promise resolves. Plan/Goal cannot bypass preflight: keep the node content, reload or restart Codex, create a new task, reopen Canvasight, and retry. Browser fallback and dev pages cannot repair native task storage.

## 风险与回滚

若 Development Agent 最终提供无需新任务的可靠自动恢复，README 应改为该已验证路径；在此之前不得承诺重试已成功或将 browser fallback 描述成修复。文档变更可独立回滚，不影响 runtime。

## 处理结果

README 已增加中英文 FAQ，记录 thread-store/rollout metadata 预检边界、Chat 的 bridge-only 成功条件，以及 Plan/Goal 的新任务恢复要求。本报告不代表真实 host Run 已送达。

## 修改文件

- `agent-reports/resolved/20260710-1905-customer-support-solution-thread-store-run-docs.md`
- `agent-reports/QUEUE.md`
- `README.md`

## 验证方式

- 对照 server 的 `isRetryableThreadResumeError` 和 Run 阻断路径确认错误类别及发送前边界。
- 对照 README、Run 与 troubleshooting skills 确认现有 FAQ 未提供该症状的恢复说明。

## 后续风险

本轮尚未验证真实 Codex host 对损坏 rollout 的恢复。README 只能承诺已验证的修复或保守的新任务恢复，不能声称同一任务已修复或消息已送达。
