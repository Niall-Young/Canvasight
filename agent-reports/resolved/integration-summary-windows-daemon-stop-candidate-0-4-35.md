---
schema_version: 1
report_id: integration-summary-windows-daemon-stop-candidate-0-4-35
report_type: integration-summary
status: resolved
owner: Main Thread
created_by: Main Thread
priority: high
version: 2
agent_id: /root
thread_id: 019f744d-c7f1-7383-8195-7478c2cd835e
created_at: 2026-07-18T11:57:46Z
updated_at: 2026-07-18T12:01:22Z
depends_on:
  - issue-windows-cli-daemon-state-cleanup-0-4-34
  - issue-publish-stable-release-0-4-34
related_files:
  - plugins/canvasight/.codex-plugin/plugin.json
  - plugins/canvasight/package.json
  - plugins/canvasight/package-lock.json
  - plugins/canvasight/mcp/server.source.mjs
  - plugins/canvasight/mcp/server.mjs
  - plugins/canvasight/tests/mcp-smoke.mjs
verification_status: passed
verification_evidence:
  - release:prepare and release:verify synchronize 0.4.35 across manifest, package, lock, SERVER_VERSION, generated MCP bundle and web dist.
  - typecheck, build, check:mcp-bundle, markdown, markdown-export, skills, widget-runtime, MCP, concurrency, dev-server, plugin-distribution, updater, diagnose:mcp and plugin validation pass locally.
  - Enhanced MCP regression proves target PID/state completion, control-home byte identity and immediate replacement-daemon safety.
  - Commit 0ab416acf52918b59d5798ff00fae10d9c6495cb is installed into the immutable 0.4.35 cache with tracked=582, missing=0 and mismatch=0.
---

# 0.4.35 Windows daemon stop 本地候选集成总结

## 本轮目标

- 修复 Windows `--stop-daemon --canvasight-home=<target>` 成功退出后残留目标 `daemon.json`，并建立 replacement-safe 回归。

## Agent 状态

- Product Agent：确认仅收紧内部 daemon 停止完成语义，不改变用户、画布、Run 或持久化合同。
- Design Agent：无 UI、交互或视觉变更，Main Thread 按不适用处理。
- Development Agent：实现 ownership-safe state cleanup 与显式 stop completion。
- Test Supervisor Agent：补齐双 home 字节隔离、PID/health、立即 replacement 与二次 stop 回归。
- Customer Support Agent：检查双语 README 与 7 个 Skills，决定 README 无需更新。
- Design Standards Expert：无用户可见设计变更，`design.md` 无需更新。
- Development Standards Lead：确认没有新增 durable rule、命令或工作流，`AGENTS.md` 无需更新。
- Project Management Agent：0.4.34 失败边界已单独提交；0.4.35 仅在验证通过后选择性提交。
- Skill Expert Agent：无 Skill 文件或触发边界变化，不适用。

## 已解决

- Stopper 不再在发出 SIGTERM 后立即报告成功；它等待目标 PID 退出。
- Windows daemon 无法运行异步 SIGTERM 清理时，stopper 只删除仍匹配原 pid、token、pluginRoot 的状态。
- 测试证明控制 home 不受 CLI-selected target stop、replacement start/stop 影响。

## 未解决

- Windows Node 20.19 的权威 GitHub Actions gate 尚未运行。
- Exact 0.4.35 安装已完成；Codex Desktop 重启和 native acceptance 尚未完成。

## 已完成改动

- 同步版本 `0.4.35` 并生成自包含 MCP bundle。
- 加强 `test:mcp` 的跨平台生命周期与隔离断言。

## 验证记录

- `npm run release:prepare -- 0.4.35`
- `npm run release:verify -- 0.4.35`
- `npm run typecheck`
- `npm run build`（由 release:prepare 执行）
- `npm run check:mcp-bundle`
- `npm run test:markdown`
- `npm run test:markdown-export`
- `npm run test:skills`
- `npm run test:widget-runtime`
- `npm run test:mcp`（增强测试后再次通过）
- `npm run test:concurrency`
- `npm run test:dev-server`
- `npm run test:plugin-distribution`
- `npm run test:update`
- `npm run diagnose:mcp`
- plugin validator passed
- `codex plugin add canvasight@canvasight-local --json` → exact `0.4.35`
- installed cache parity → `tracked=582 missing=0 mismatch=0`
- Agent Team validator 已运行，但仍被既有 legacy 根报告、旧模板和 QUEUE 格式历史债务阻断；本轮新报告没有独立字段错误。

## 未解决 / 后续风险

- macOS 本地 Node 25 不能替代 Windows Node 20.19；0.4.35 workflow 失败时同样不得创建 Release 或推进 stable。
- v0.4.34 tag 永久保留且不得复用。

## Git 状态

- branch: `main`
- baseline commit: `c985fbb5cd2903cb1a9876a707965ce9c4cb8421`
- candidate commit: `0ab416acf52918b59d5798ff00fae10d9c6495cb` (`fix: 修复 Windows daemon 停止清理`)
- worktree before exact-install report update: clean
