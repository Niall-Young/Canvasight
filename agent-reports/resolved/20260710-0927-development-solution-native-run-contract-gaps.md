---
status: resolved
report_type: solution
owner: Development Agent
created_by: main-thread
priority: critical
created_at: 2026-07-10 09:27
updated_at: 2026-07-10 09:48
related_issue: agent-reports/resolved/20260710-0908-development-issue-native-run-contract-gaps.md
related_files:
  - plugins/canvasight/mcp/server.mjs
  - plugins/canvasight/.mcp.json
  - plugins/canvasight/tests/mcp-smoke.mjs
---

# 修复 Native Widget 原子 Run 合同

## 负责 Agent

Development Agent，由 main thread 代执行。

## 对应问题

`agent-reports/resolved/20260710-0908-development-issue-native-run-contract-gaps.md`

## Root Cause

Bridge readiness 错把 advisory capability 当硬门槛；native open 未强制当前 task id；native app-server 预检默认关闭；widget 未消费 host 初始 globals；active rollout 写入竞争会导致 `thread/resume` 瞬态失败。

## 调研过程

对照 Cowart 当前实现和 OpenAI Apps SDK 协议，检查当前 MCP transport、Codex task 环境、app-server 请求和 widget bootstrap。确认 MCP stdio 已可用，故障已从 transport 层收敛到 Run 合同本身。

## 可选方案

- 方案 A：继续把 `hostCapabilities.message` 作为硬门槛。会保留假阴性。
- 方案 B：显式绑定 thread，默认开启预检，实际调用 bridge，并用 Promise 判定。采用。
- 方案 C：回退 app-server `turn/start` 或浏览器自动化。违反 Run 合同，不采用。

## 推荐方案

统一执行 `prepareWidgetRun -> applyCodexMode -> sendFollowUpMessage`；只有 native preflight 和 bridge Promise 都成功才显示 sent。

## 实施步骤

1. Native open schema 强制 `threadId`，缺失时返回 `current_thread_id_required`。
2. `.mcp.json` 默认开启 native Codex preflight。
3. MCP App 握手后尝试 `sendMessage`，不再依赖 capability 声明。
4. 支持 `window.openai.toolResponseMetadata` 初始结果。
5. 仅对 `thread/resume` rollout 读取竞争做有限重试。
6. 为 daemon 启动增加跨进程锁和 owner-safe state 清理，为 stdout EPIPE 增加单次关闭处理和 5 MB 日志上限。
7. 补齐 runtime、schema、bridge、daemon、stdio、skill 合同测试和文档。

## 风险与回滚

真实 host 若拒绝 `ui/message`，Promise 会失败并阻断 sent；不会伪造成功。回滚可恢复上一提交，但会重新引入已确认假阴性。

## 处理结果

已修复。

## 修改文件

- `plugins/canvasight/mcp/server.mjs`
- `plugins/canvasight/.mcp.json`
- `plugins/canvasight/tests/mcp-smoke.mjs`
- Canvasight skills 与双语文档
- 版本文件同步到 `0.1.48`

## 验证方式

- MCP smoke 覆盖 capability 缺失仍尝试、Promise reject 失败、初始 globals、显式 threadId、三种模式、resume 重试、并发 daemon single-flight 和 stdout EPIPE 退出。
- Markdown、typecheck、build、dev-server、plugin validator、skill validator 全部通过。
- 安装缓存 `0.1.48` 的 JSON-RPC native open 返回 `status=opened`、显式当前 task id、widget output template，且公开结果不含 localhost。
- 默认状态目录最终只保留一个 `0.1.48` cache daemon；19.7 GB 失控日志清理后稳定在 KB 级。

## 后续风险

宿主级点击验收无法由 Codex 对自身执行 Computer Use；当前 task 清理旧 transport 后也不会热重建，最终 UI 证据必须来自加载 `0.1.48` transport 的 native widget 实际点击。
