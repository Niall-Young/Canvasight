---
schema_version: 1
report_id: issue-cross-thread-page-concurrent-edit
report_type: issue
status: assigned
owner: Test Supervisor Agent
created_by: Main Thread
priority: high
version: 10
agent_id: /root/test_supervisor_agent
thread_id: null
created_at: 2026-07-13T14:27:47Z
updated_at: 2026-07-13T15:02:38Z
depends_on: []
related_files:
  - plugins/canvasight/src/App.tsx
  - plugins/canvasight/src/lib/canvasightApi.ts
  - plugins/canvasight/mcp/server.source.mjs
  - plugins/canvasight/tests
solution_report: agent-reports/resolved/solution-cross-thread-page-concurrent-edit.md
verification_status: failed
verification_evidence:
  - Automated typecheck, concurrency, widget, MCP, Skill, build, bundle, distribution, update, release, and plugin validation passed for 0.4.14.
  - codex plugin add installed canvasight@canvasight-local 0.4.14 at /Users/niallyoung/.codex/plugins/cache/canvasight-local/canvasight/0.4.14.
  - Native Codex host acceptance is unavailable until Codex Desktop is restarted after the 0.4.14 install.
---

# 不同 Codex Task 并发编辑同一 Page 会丢失后保存内容

## TL;DR

两个 Codex task 同时编辑同一项目 Page 时，当前完整文档乐观锁会让后保存者收到 `stale_document` 并直接重载磁盘内容，未保存修改可能丢失。

## 问题描述

Canvasight 需要以 base、local、current 三份文档执行三方合并：不同节点修改自动合并；同一 Page 内出现同节点、同连线、删除与编辑或 Page 元数据冲突时，原 Page 保留先保存版本，后保存者的完整本地 Page 保存为冲突副本。

## 现象

- 保存接口只接受完整 `document` 与 `expectedRevision`。
- revision 过期时服务端返回 `409 stale_document`。
- 前端收到过期错误后立即载入服务端文档，无法保留后保存者的完整本地版本。

## 复现方式

1. 在两个不同 Codex task 中打开同一项目与同一 Page。
2. 两边修改同一节点，先后触发自动保存。
3. 第二个 task 收到 `stale_document` 并重载先保存内容。

## 影响范围

同项目多 task 的自动保存、Page/节点/连线并发编辑、daemon 重启后的 revision 连续性，以及与 AI graph write 的竞争。

## 期望结果

- 不同节点或不同 Page 的修改自动合并。
- 同一 Page 出现真实冲突时，先保存内容留在原 Page，后保存者的完整 Page 进入冲突副本。
- AI 使用 `get_canvasight_graph_context` 返回的 `contextId` 与稳定 mutation ID 在 daemon 内自动重基；人工与 AI 修改同一对象时，人工版本留在原 Page，AI 完整结果进入 AI 冲突副本。
- 节点坐标独立于语义内容合并，人工最新位置优先；切换 Page 不得让 AI 改写错误 Page，冲突后不自动跳转 Page。
- 保存请求幂等，一次事务最多推进一个 revision，daemon 重启后不回退或重复建副本。
- 老客户端继续使用严格 `stale_document` 合同。

## Closure Criteria

- [x] 三方合并与冲突分类有单元/集成测试
- [x] 冲突副本完整、ID 唯一且连线无悬空
- [x] mutation 重试与 daemon 重启保持幂等
- [ ] 前端不会用保存响应覆盖请求期间产生的新编辑
- [x] README、版本字段和生成产物按运行时变更同步
- [x] 自动验证通过；真实 native-host 缺失证据被准确记录

## 当前状态

实现、自动门禁和精确 0.4.14 安装已经完成。Main Thread 将该 issue 明确交接给 Test Supervisor Agent，等待重启 Codex Desktop 后执行真实 native-host 双 task 验收；在此之前保持 assigned/failed，不声称原生宿主已验证。

## 后续风险

真实 Codex 双 task native-host 验收需要重启 Codex Desktop；当前 composed widget smoke 也未提供可控延迟响应，因此“请求期间继续编辑不被旧响应覆盖”仍缺浏览器级竞态证据。
