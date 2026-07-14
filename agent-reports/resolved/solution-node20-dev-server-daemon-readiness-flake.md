---
schema_version: 1
report_id: solution-node20-dev-server-daemon-readiness-flake
report_type: solution
status: resolved
owner: Development Agent
created_by: Development Agent
priority: high
version: 1
agent_id: /root/development_agent
thread_id: null
created_at: 2026-07-14T08:14:13Z
updated_at: 2026-07-14T08:14:13Z
depends_on:
  - issue-node20-dev-server-daemon-readiness-flake
related_issue: issue-node20-dev-server-daemon-readiness-flake
related_files:
  - plugins/canvasight/vite.config.ts
  - plugins/canvasight/tests/dev-server-smoke.mjs
  - plugins/canvasight/.codex-plugin/plugin.json
  - plugins/canvasight/package.json
  - plugins/canvasight/package-lock.json
  - plugins/canvasight/mcp/server.source.mjs
  - plugins/canvasight/mcp/server.mjs
verification_status: passed
verification_evidence:
  - Node 20.19.0 reproduced the pre-fix failure on the first or second fresh invocation with daemon readiness 500 responses and lost claim state.
  - The fixed code passed eight consecutive Node 20.19.0 dev-server smoke runs during development; final 0.4.20 passed five Main Thread and three independent Test Supervisor runs.
  - The regression starts two independent Vite processes against one CANVASIGHT_HOME and verifies stable daemon pid and token reuse.
  - Final release:prepare 0.4.20, release:verify 0.4.20, check:mcp-bundle, build, typecheck, and test:mcp passed.
---

# Node 20.19 dev-server daemon readiness single-flight 修复

## 负责 Agent

Development Agent

## 对应问题

`agent-reports/assigned/issue-node20-dev-server-daemon-readiness-flake.md`

## Root Cause

Vite 开发 API 与 MCP shim 各自维护 daemon 启动流程。MCP 使用 `daemon-start.lock` 做跨进程 single-flight，而 Vite 只使用当前配置模块内的 `daemonStartPromise`。当 Vite 配置被独立实例化、重载，或多个开发服务器指向同一 `CANVASIGHT_HOME` 时，不同模块实例可以同时派生 daemon。后启动的 daemon 覆盖 `daemon.json` 后，前一个 daemon 上已创建的 Session 和 thread claim 不存在于新进程，于是表现为 readiness 500、claim 后 Run 重新变成 `unbound_dev_session`，以及 preferences/skills 超时。

## 调研过程

- Node 20.19.0 在未修改版本上首轮通过、第二轮即复现 `500 !== 409`；另一次在首个 skills 请求直接返回 `Canvasight daemon did not start in time`。
- 给失败断言附带响应体后确认 500 不是断言波动，而是 Vite 代理层 daemon readiness 失败。
- claim 成功后 Run 偶发重新 unbound，证明健康 daemon 在相邻请求之间被另一个进程替换，而不是业务 Session 校验本身失败。
- 对照实现确认 `vite.config.ts` 没有使用 MCP 已有的文件锁，因此模块内 Promise 无法覆盖跨模块或跨 Vite 进程的启动竞争。

## 可选方案

- 仅延长 readiness timeout：不能阻止第二个 daemon 覆盖状态，拒绝。
- 把 daemon state 写入改成 last-writer 检查：仍会浪费进程并留下两个权威候选，拒绝。
- 让 Vite 与 MCP 复用同一个跨进程启动锁，并在锁内二次检查健康状态：采用。

## 推荐方案

在 Vite 开发运行时镜像 MCP 的 `daemon-start.lock` 合同。只有持锁者可以派生 daemon；等待者一旦观察到健康 state 就直接复用。派生命令显式传入 `--canvasight-home`，避免环境继承之外的 home 路由歧义。

## 实施步骤

1. 在 `vite.config.ts` 增加原子 `wx` 文件锁、stale lock 恢复和 token 校验释放。
2. 保留模块内 Promise 作为单模块快速路径，同时把真正 spawn 放在跨进程锁内。
3. 在 smoke 中并行启动两个 Vite 进程并让它们访问同一 home，验证 pid/token 不被替换。
4. 保持尚未发布的 0.4.20 候选版本，并重新生成、验证 MCP bundle 与 web snapshot。

## 风险与回滚

锁文件格式、超时和 stale 判定与 MCP 当前合同一致。若需回滚，可只撤销 Vite 锁与并发回归；版本产物必须作为同一发布候选整体回滚，不能单独恢复旧 bundle。

## 处理结果

Development Agent 实现与 focused verification 已通过，等待 Test Supervisor Agent 独立复验后关闭 issue。

## 修改文件

- `plugins/canvasight/vite.config.ts`
- `plugins/canvasight/tests/dev-server-smoke.mjs`
- `plugins/canvasight/.codex-plugin/plugin.json`
- `plugins/canvasight/package.json`
- `plugins/canvasight/package-lock.json`
- `plugins/canvasight/mcp/server.source.mjs`
- `plugins/canvasight/mcp/server.mjs`

## 验证方式

- Node 20.19.0 连续八次运行 `tests/dev-server-smoke.mjs`。
- `npm run check:mcp-bundle`
- `npm run release:verify -- 0.4.20`
- `npm run test:mcp`
- `npm run release:prepare -- 0.4.20` 内含 MCP build、typecheck 与 Vite production build。

## 后续风险

发布前仍需 Test Supervisor Agent 在独立进程中复跑 Node 20.19 重复回归。此次改动不改变正常用户的 daemon API、Session 合同或 native widget acceptance 结果。
