---
schema_version: 1
report_id: solution-release-matrix-native-session-isolation
report_type: solution
status: resolved
owner: Development Agent
created_by: Development Agent
priority: high
version: 1
agent_id: /root/development_agent
thread_id: 019f730b-0404-75f0-a460-3a080f0addd6
created_at: 2026-07-18T02:46:35Z
updated_at: 2026-07-18T02:46:35Z
depends_on:
  - issue-release-matrix-invalidates-native-session
related_files:
  - plugins/canvasight/mcp/server.source.mjs
  - plugins/canvasight/mcp/server.mjs
  - plugins/canvasight/tests/mcp-smoke.mjs
  - plugins/canvasight/tests/widget-runtime-smoke.mjs
  - plugins/canvasight/.codex-plugin/plugin.json
  - plugins/canvasight/package.json
  - plugins/canvasight/package-lock.json
verification_status: passed
verification_evidence:
  - npm run release:prepare -- 0.4.30 passed, including MCP generation, typecheck, and Vite build
  - npm run test:mcp passed with CLI-home control/target isolation coverage
  - npm run test:widget-runtime passed with isolated daemon cleanup
  - npm run release:verify -- 0.4.30 and npm run check:mcp-bundle passed
  - git diff --check passed
---

# 隔离发布矩阵的 Canvasight daemon 清理目标

## 负责 Agent

Development Agent

## 对应问题

`agent-reports/resolved/issue-release-matrix-invalidates-native-session.md`

## Root Cause

`tests/widget-runtime-smoke.mjs` 的 `finally` 清理器使用 `--stop-daemon --canvasight-home=<temporary-home>`，但 MCP runtime 的 `canvasightHome()` 只读取环境变量 `CANVASIGHT_HOME`，完全忽略已经出现在 daemon/stopper 命令行中的 `--canvasight-home`。测试清理器没有同时设置环境变量，因此 `--stop-daemon` 实际读取默认 `~/.canvasight/daemon.json`，停止承载原生验收 Session 的 PID 90995，并移除默认 state。

下一次原生 widget API 请求由 installed shim PID 97857 处理时，看不到默认 state；它进入 `before_spawn` orphan 清理分支，停止仍存活的 90995 并创建新 daemon 8245。Session 只存在于旧进程内，因此刷新与 Run 均返回 `stage=session / Session not found`。

## 调研过程

- lifecycle 日志确认 02:27:22Z 的 verified ready 绑定 daemon PID 90995。
- 02:29:48Z 的 `daemon_stop_orphans / before_spawn` 来自 installed shim PID 97857，而不是 `test:mcp` 子进程。
- 审计完整发布矩阵后确认 `test:mcp`、distribution probe 和 registration probe 均使用临时 `CANVASIGHT_HOME`。
- 审计 `widget-runtime-smoke.mjs` 发现唯一有 CLI home、但缺环境变量的 stopper。
- 最小实验确认仅传 CLI 的旧 runtime 会落到默认 home；正确同时传 env 与 CLI 的独立 daemon 在完整 `test:mcp` 后保持存活，排除 `test:mcp` 自身跨 home 杀 daemon。

## 可选方案

- 方案 A：只修改 widget runtime 测试，为 stopper 补 `CANVASIGHT_HOME` 环境变量。
- 方案 B：runtime 正式解析 `--canvasight-home`，并为测试 stopper 同时传 env 与 CLI；增加 control/target 双 daemon 隔离回归。

## 推荐方案

采用方案 B。CLI 参数已经由 runtime 生成并用于进程识别，继续让它只作为可见标签而不参与路径解析，会让任何未来 stopper 或 daemon 调用再次误落默认 home。明确 `CLI > CANVASIGHT_HOME env > ~/.canvasight` 后，父 shim、daemon child 与 stopper 使用同一目标；调用方双传作为额外防线。

## 实施步骤

1. 在 `server.source.mjs` 解析最后一个非空 `--canvasight-home=`，并让它优先于环境变量和默认 home。
2. 在 widget runtime smoke 清理器中同时传入临时 home 的 env 与 CLI。
3. 在 MCP smoke 中启动 control/target 两个临时 daemon，让 stopper 的 env 指向 control、CLI 指向 target，断言只停止 target。
4. 按 MCP runtime 变更规则把版本从 0.4.29 升至 0.4.30，并重新生成自包含 MCP bundle 和 web snapshot。

## 风险与回滚

CLI home 现在具有最高优先级；这是 daemon child 和 stopper 现有命令契约所需行为。若发现第三方调用错误传入 CLI home，可回滚 runtime 解析，但必须保留所有测试 cleanup 的显式环境变量，且会重新暴露 CLI/env 语义分裂风险。

## 处理结果

已修复自动化矩阵误停默认 daemon 的隔离缺陷。0.4.29 候选因该 runtime 缺陷被 0.4.30 取代；真实 Codex 原生验收仍由发布 issue 在安装 exact 0.4.30 并重启宿主后执行，本报告不声称原生验收已经通过。

## 修改文件

- `plugins/canvasight/mcp/server.source.mjs`
- `plugins/canvasight/mcp/server.mjs`
- `plugins/canvasight/tests/mcp-smoke.mjs`
- `plugins/canvasight/tests/widget-runtime-smoke.mjs`
- `plugins/canvasight/.codex-plugin/plugin.json`
- `plugins/canvasight/package.json`
- `plugins/canvasight/package-lock.json`

## 验证方式

- `npm run release:prepare -- 0.4.30`
- `npm run test:mcp`
- `npm run test:widget-runtime`
- `npm run release:verify -- 0.4.30`
- `npm run check:mcp-bundle`
- `git diff --check`

## 后续风险

- exact 0.4.30 必须重新安装并重启 Codex Desktop 后再做 instance-bound ready、真实控件、同任务 Run 与 late-metadata 原生验收。
- 原生验收必须放在所有可能启动或停止 daemon 的自动化矩阵之后；验收后不得再次运行生命周期测试。
- 仓库 Agent Team 全量 validator 仍被大量历史 legacy 报告和既有 QUEUE 格式不一致阻断，不属于本次 runtime 修复。
