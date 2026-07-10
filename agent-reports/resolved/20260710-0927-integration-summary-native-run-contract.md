---
status: resolved
report_type: integration-summary
owner: main-thread
created_by: main-thread
priority: critical
created_at: 2026-07-10 09:27
updated_at: 2026-07-10 09:48
related_files:
  - plugins/canvasight/mcp/server.mjs
  - plugins/canvasight/.mcp.json
  - plugins/canvasight/tests/mcp-smoke.mjs
  - README.md
  - AGENTS.md
  - design.md
---

# Native Widget Run 合同集成总结

## 本轮目标

- 修复 native widget 已打开但 bridge/preflight 仍无法可靠 Run 的根因。
- 保持 browser fallback 不能伪装 sent。

## Agent 状态

- Product Agent：主线程代执行；保持当前节点加下游和 native-only 发送合同。
- Design Agent：主线程代执行；无新增 UI 布局，确认 sent/error 语义不变。
- Development Agent：主线程代执行；完成 bridge、thread、preflight、bootstrap 与 retry 修复。
- Test Supervisor Agent：主线程代执行；完成全套自动化验证。
- Customer Support Agent：主线程代执行；更新双语 README。
- Design Standards Expert：主线程代执行；确认并同步 Run 状态基线。
- Development Standards Lead：主线程代执行；更新 AGENTS 运行规则。
- Project Management Agent：主线程代执行；检查版本、范围和提交状态。
- Skill Expert Agent：主线程代执行；更新并校验 open/run/troubleshooting skills。

固定子 Agent 未创建：当前工具策略不允许在用户未明确要求时创建 subagent，全部角色 checklist 由主线程执行。

## Agent 输入

- Product/Design：不能用 browser fallback、虚拟点击、剪贴板或 app-server `turn/start` 伪造 sent。
- Development/Test：实际 bridge Promise 是成功边界，模式预检失败必须阻断。
- Docs/Standards/Skill：打开前必须读取并显式传入当前 task `CODEX_THREAD_ID`。
- PM：版本同步到 `0.1.48`，重装后核对 resolved plugin。

## 报告状态变更

- `agent-reports/assigned/20260710-0908-development-issue-native-run-contract-gaps.md` -> `agent-reports/resolved/20260710-0908-development-issue-native-run-contract-gaps.md`
- 新增 solution 与 integration summary。

## 已解决

- capability 缺失造成的 bridge 假阴性。
- native open 未绑定当前 task。
- native mode preflight 默认关闭。
- 初始 tool response metadata 未启动 app。
- active rollout 瞬态读取竞争。
- 并发 MCP shim 启动多个 daemon 并等待不同 token。
- stdout EPIPE 递归写错误导致 lifecycle 日志失控增长。

## 未解决

- Codex App 策略禁止 Computer Use 控制自身，无法自动点击 native widget 完成宿主 UI 验收。

## 风险

- 已打开 task 不会热刷新新 MCP descriptor；重装后的真实 widget 验收必须使用已加载 `0.1.48` 的宿主实例。

## 下一轮分派

- 若真实 host Promise 仍 reject，保留其具体 bridge state 和 Promise error，继续针对 descriptor/host 支持修复，不回退浏览器成功路径。

## 已完成改动

- Native Run 原子合同、显式 thread 绑定、初始 host globals、有限 resume retry、daemon single-flight 和 EPIPE/log cap。
- 版本、测试、skills、README、AGENTS、design 和 reports 同步。

## 处理结果

代码与自动化验证完成，宿主 UI 点击验收明确保留为未自动验证项。

## 修改文件

- `plugins/canvasight/mcp/server.mjs`
- `plugins/canvasight/.mcp.json`
- `plugins/canvasight/tests/mcp-smoke.mjs`
- `plugins/canvasight/package.json`、`package-lock.json`、`.codex-plugin/plugin.json`
- Canvasight open/run/troubleshooting/index skills
- `README.md`、`AGENTS.md`、`design.md`
- `agent-reports/`

## 验证方式

- `npm run test:mcp`
- `npm run test:markdown`
- `npm run typecheck`
- `npm run build`
- `npm run test:dev-server`
- plugin validator
- six Canvasight skill quick validates

## 验证记录

- 上述自动化验证全部通过。
- Vite 仅报告既有 chunk size warning。
- Computer Use 对 `com.openai.codex` 被策略禁止，未声称 UI 点击通过。
- `codex plugin list` 显示 `canvasight@canvasight-local installed, enabled 0.1.48`。
- 从安装缓存执行 `initialize -> open_canvasight` 成功，返回当前 task id，public result 不含 localhost，widget metadata 完整。
- 源码/cache 跨路径 daemon 收敛为一个 `0.1.48` 实例；`mcp-lifecycle.log` 从失控的 19.7 GB 清理后保持 KB 级。
- `npm run dev:status` 显示 `running ... serverVersion=0.1.48`。

## 回写状态

- `agent-reports/QUEUE.md` 已更新。
- issue 已移入 resolved 并关联 solution。
- integration summary 已写入。

## 未解决 / 后续风险

- 当前 task 的旧 `0.1.45` MCP transport 清理后返回 `Transport closed` 且不会热重建；等待加载 `0.1.48` transport 的 native widget host Promise 真机证据。

## Git 状态

- branch: main
- commit: pending
- worktree: dirty with scoped delivery files and pre-existing untracked duplicate dist artifacts excluded
