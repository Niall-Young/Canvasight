---
status: resolved
report_type: issue
owner: Development Agent
created_by: Test Supervisor Agent
priority: high
created_at: 2026-07-10 19:20
updated_at: 2026-07-10 20:00
related_files:
  - plugins/canvasight/mcp/server.mjs
  - plugins/canvasight/tests/mcp-smoke.mjs
solution_report: agent-reports/resolved/20260710-2000-development-solution-project-scatter-run-binding.md
---

# .scatter 项目持久化与 Run 线程绑定混淆

## TL;DR

画布内容已按项目目录的 `.scatter/scatter.json` 持久化，但 native widget 的 Run 预检仍读取会话上的 `codexThreadId`；旧线程的 thread-store 损坏时，Plan/Goal 会在 `sendMessage` 前被阻断，容易被用户理解为画布也没有按项目切换。

## 发现者

用户反馈，Test Supervisor Agent 复核。

## 提交 Agent

Test Supervisor Agent

## 建议交接 Agent

Development Agent

## 问题描述

应明确区分两条契约：`.scatter` 决定内容和项目文件夹归属；Run 必须发送回当前原生 widget 所在的 Codex 任务。现有实现把项目路径到线程的临时 claim 留在 daemon session 中，且 widget Run 对该线程执行 `thread/resume` / Plan 设置预检。损坏的历史 rollout 因而阻断 Plan/Goal，即使当前打开的是另一个项目。

## 现象

Plan Run 报 `Canvasight Run blocked before sendMessage: failed to read thread ... rollout does not start with session metadata`；用户在其他项目打开画布仍见相同错误。

## 复现方式

1. 打开项目 A 的 native Canvasight widget，令其绑定一个 thread-store 无法 resume 的线程。
2. 选择 Plan 节点并点击 Run。
3. 观察 Plan 预检在 `sendMessage` 前失败；切换项目内容不应改变该旧 widget 的线程身份。

## 影响范围

native widget Plan/Goal Run；项目切换时的绑定提示、重新打开/claim 行为，以及 `.scatter` 与会话运行目标的用户心智模型。

## 证据

- `readScatterDocument` / `writeScatterDocument` 读写 `<projectPath>/.scatter/scatter.json`。
- `createSession` 保存 `session.projectPath` 与 `session.codexThreadId`；`applyCodexNativeMode` 以该线程执行 `thread/resume`。
- 现有 MCP smoke 已断言 thread-store 退化时 Chat 可降级而 Plan 必须阻断（约 2765 行）。
- 现有跨客户端 smoke 已断言同一 project 的 claim 可改为新的当前线程（约 3155、3249 行），但没有覆盖“损坏旧线程 + 在新项目重新 native 打开”的回归路径。

## 初步归因

不是 `.scatter` 文件跨项目污染的直接证据；是项目持久化和 Codex 当前任务投递被混为同一“绑定”概念，且重新 native 打开是否总能以当前项目路径与当前线程创建/claim 独立会话需要实现审计与回归覆盖。

## 交付给哪个 Agent

Development Agent

## 需要回答的问题

- native `open_canvasight` 是否应以显式当前 projectPath 作为优先级最高的内容来源，并为该 project/current thread 建立新会话？
- 重新打开不同项目时，旧 session/claim 是否可能被 UI 或 daemon 错误复用？
- 如何保留 Plan/Goal 的模式安全性，同时给出明确的“内容属于 .scatter、Run 属于当前任务”恢复路径？

## 相关文件

- `plugins/canvasight/mcp/server.mjs`
- `plugins/canvasight/src/App.tsx`
- `plugins/canvasight/tests/mcp-smoke.mjs`

## 期望结果

每个项目只从其目录 `.scatter` 读取/写入画布；在当前项目重新 native 打开时，Run 使用当前 widget/current Codex 任务，不会继续把另一个项目的旧会话线程当作目标；若当前任务本身不可 resume，错误应明确说明这是 Codex 任务状态故障而非 `.scatter` 项目切换失败。

## Closure Criteria

- [x] 项目 `.scatter` 与 Run 线程契约在实现和文案中明确
- [x] 覆盖损坏旧线程与重新打开不同项目的回归测试
- [x] Plan/Goal 不发生未切换模式的假成功
- [x] 验证方式与残余 Codex thread-store 风险已记录

## 当前状态

resolved

## 处理结果

已修复项目解析的静默默认目录回退，并明确将 `.scatter` 中的历史线程字段迁出文档。native 打开无法读取当前 Codex task 的项目目录时，现在返回结构化错误；显式 `projectPath` 仍可正常打开。已覆盖 session hydration 在 thread/resume 失败时保留显式项目目录。

## 修改文件

- `plugins/canvasight/mcp/server.mjs`
- `plugins/canvasight/tests/mcp-smoke.mjs`
- `plugins/canvasight/.codex-plugin/plugin.json`
- `plugins/canvasight/package.json`
- `plugins/canvasight/package-lock.json`

## 验证方式

- `npm run typecheck`
- `npm run test:mcp`
- `npm run build`

## 后续风险

真实 Codex thread-store 损坏无法由 Canvasight 修复；Plan/Goal 仍会安全阻断，但不会再因为项目目录解析失败而静默改用另一个项目的 `.scatter`。
