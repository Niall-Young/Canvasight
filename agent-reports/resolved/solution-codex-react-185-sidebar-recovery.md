---
schema_version: 1
report_id: solution-codex-react-185-sidebar-recovery
report_type: solution
status: resolved
owner: Development Agent
created_by: Main Thread
priority: critical
version: 3
agent_id: /root/development_agent
thread_id: null
created_at: 2026-07-26T05:48:26Z
updated_at: 2026-07-26T06:19:29Z
depends_on:
  - issue-codex-react-185-sidebar-recovery
related_files:
  - plugins/canvasight/src/App.tsx
  - plugins/canvasight/src/lib/widgetBridge.ts
  - plugins/canvasight/mcp/server.source.mjs
  - plugins/canvasight/mcp/server.mjs
  - plugins/canvasight/tests/widget-runtime-smoke.mjs
  - plugins/canvasight/tests/mcp-smoke.mjs
verification_status: passed
verification_evidence:
  - The focused v0.4.35 red fixture reproduced three simultaneous historical Widgets each requesting an inline recovery pulse.
  - The 0.4.36 coordinator reduced project-thread recovery ownership to the latest eligible Widget while peers and stale bindings remain passive.
  - Native task A and test task B completed three A-to-B-to-A rounds with all returned A instances strict fullscreen ready.
  - Historical task A remained stable and ready for 60 seconds without React 185, Maximum update depth, uncaught, or fatal lifecycle evidence.
  - Exact 0.4.36 is installed locally and passes internal representative evidence; the maintainer never reproduced the reported failure, and the unpublished candidate is not yet available to the original reporter.
---

# Codex React #185 侧栏恢复解决方案

## 负责 Agent

Development Agent

## 对应问题

`issue-codex-react-185-sidebar-recovery`

## Root Cause

同一 project+thread 的多个历史 Widget 会各自执行一次有界 fullscreen/inline presentation pulse。单实例序列本身有界，但跨实例叠加形成宿主更新竞争，最终可能触发 React #185 / Maximum update depth。

## 推荐方案

在 daemon 建立 project+thread recovery coordinator：

- 只有最新 open attempt 的唯一 owner 可发起 presentation pulse。
- peer、旧 binding 与冷却期实例保持被动。
- 保留已通过的任务往返自动恢复，不退化为手工折叠/重开。
- 继续使用 exact instance ready acknowledgement 作为原生可见性门槛。

## 处理结果

0.4.36 修复候选已实现并通过自动化及部分内部原生代表性验证；维护者交互发布门槛、候选发布和原报告者复验仍待完成。本 solution report 不代表 GitHub Issue #2 已关闭。

## 修改文件

- `plugins/canvasight/mcp/server.source.mjs`
- `plugins/canvasight/mcp/server.mjs`
- `plugins/canvasight/src/App.tsx`
- `plugins/canvasight/src/lib/widgetBridge.ts`
- `plugins/canvasight/tests/mcp-smoke.mjs`
- `plugins/canvasight/tests/widget-runtime-smoke.mjs`

## 验证方式

- RED：v0.4.35 多历史 Widget presentation owner 回归。
- GREEN：0.4.36 隔离 build、Widget/MCP smoke 与统一候选矩阵。
- GREEN：A=`019f9ca3-8bf7-7ca3-b483-b839701d85bd`，B=`019f9ca4-88e7-74e3-852f-171ab4cebc6b`，三轮 A→B→A strict ready。
- GREEN：A 聚焦 60 秒无 React #185 或 fatal lifecycle evidence。
- PENDING / MAINTAINER：完成画布控件、Refresh、同任务 Run 与延迟元数据内部交互发布门槛。
- PENDING / REPORTER：可安装版本发布后，smartLanny 在原故障任务或同目录 fork 完成 60 秒稳定、A→B→A 返回，并在 GitHub Issue #2 反馈结果。

## 后续风险

- 当前 latest Widget runtime 的 viewport save-count fixture `5 !== 4` 来自既有 viewport recovery 合同，git blame 与 scoped diff 均确认不是本轮 React #185 或富文本修改；作为独立自动化风险记录，不推翻 exact native acceptance。
- 不得取消自动恢复来规避未来宿主问题。
