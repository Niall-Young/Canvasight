---
schema_version: 1
report_id: issue-skill-composition-node-assignment
report_type: issue
status: assigned
owner: Development Agent
created_by: Main Thread
priority: high
version: 2
agent_id: null
thread_id: null
created_at: 2026-07-13T13:06:19Z
updated_at: 2026-07-13T13:31:00Z
depends_on: []
related_files:
  - plugins/canvasight/mcp/server.source.mjs
  - plugins/canvasight/src
  - plugins/canvasight/skills/canvasight-graph-writer
  - plugins/canvasight/README.md
  - design.md
  - AGENTS.md
verification_status: not_started
verification_evidence:
  - Automated, browser, release, and clean-distribution gates passed for 0.4.12.
  - Native host acceptance awaits a Codex Desktop restart and a newly tagged task.
solution_report: agent-reports/resolved/solution-skill-composition-node-assignment.md
---

# Skill 组合与节点级 Skill 分配缺失

## TL;DR

Canvasight 目前不能读取 Codex 当前项目启用的 Skill，也不能让用户或 AI 将 Skill 精确分配给节点，画布级专业 Skill 与节点级执行 Skill 也缺少可验证的组合协议。

## 发现者

Main Thread

## 提交 Agent

Main Thread

## 建议交接 Agent

Development Agent

## 问题描述

在保持 Canvasight 为唯一图写入者和固定左到右布局的前提下，需要接入 Codex `skills/list`，提供轻量 Skill 发现、全局 AI 节点分配偏好、节点正文 `$skill-name` 选择器、graph manifest 校验、Run 节点映射，以及画布级 `skill-led` 内容组合。

## 现象

- 节点 textarea 没有 `$` Skill 搜索和键盘选择。
- graph writer 无法声明或校验画布级、节点级 Skill 分配。
- Run Markdown 不会说明不同 Skill 只服务于对应节点职责。
- 设置中没有默认关闭的 AI 节点 Skill 分配开关。

## 复现方式

1. 打开任意任务节点，在正文输入 `$`。
2. 尝试让 AI 将不同专业 Skill 分给不同节点。
3. 运行包含多个 `$skill-name` 的下游流程。

## 影响范围

MCP runtime、Widget API、偏好持久化、graph writer 协议、任务节点编辑器、Run Markdown、设计基线、Skill 文档、中英文 README、版本与验证产物。

## 证据

- 当前 `TaskNode.tsx` 只有普通 textarea 编辑流程。
- 当前 `frameworkManifest` 不接受 `contentMode`、`contentSkills` 或 `skillAssignments`。
- 当前 Widget API 严格允许列表不包含 skills/preferences。

## 初步归因

Canvasight 已具备图框架与唯一写入边界，但尚未建立 Codex Skill 发现、职责级匹配和可见正文 token 之间的契约。

## 交付给哪个 Agent

Development Agent；Product Agent 与 Skill Expert Agent并行审查，其他受影响角色由 Main Thread 在并发限制下代行。

## 需要回答的问题

- 如何在不暴露本地路径和 Skill 正文的情况下复用 `skills/list`？
- 如何区分用户显式分配与默认关闭的 AI 自主分配？
- 如何让专业 Skill 主导内容而不放弃 Canvasight 的 revision、语义关系和水平布局校验？

## 相关文件

- `plugins/canvasight/mcp/server.source.mjs`
- `plugins/canvasight/src/`
- `plugins/canvasight/skills/canvasight-graph-writer/`
- `plugins/canvasight/README.md`
- `design.md`
- `AGENTS.md`

## 期望结果

用户、Codex 路由和 AI 拆解都能在明确边界内组合 Skill；所有写图仍由 Canvasight 完成并保持水平拓扑；失败可恢复且不泄露路径。

## Closure Criteria

- [x] Skill discovery、preferences、Widget API 和 MCP schema 完成并验证
- [x] 手动 `$` 选择器与 AI 节点分配校验完成
- [x] `skill-led` 内容模式与默认模式回归完成
- [x] Run 节点—Skill 映射完成
- [x] 文档、版本、构建和分发验证完成
- [ ] Agent Team 全库 validator 的历史报告债务清理
- [ ] 原生验收完成，或明确保持 assigned/unverified

## 当前状态

assigned

## 处理结果

0.4.12 实现、自动化和浏览器验证完成；已安装到本地 Codex 插件注册。真实原生宿主需重启 Codex 后在新任务验收，因此 issue 保持 assigned/unverified。

## 修改文件

- 见 `agent-reports/resolved/solution-skill-composition-node-assignment.md`。

## 验证方式

- 自动化、浏览器和分发门禁已通过。
- 原生宿主验收尚未开始：当前任务不能在升级后自行重启 Codex Desktop。

## 后续风险

0.4.12 已安装，但需要重启 Codex Desktop 后新建并重新 `@Canvasight` 的任务验证真实 Skill 路由、同任务 Run 和固定水平布局。Agent Team 全库 validator 仍被历史 legacy reports/templates 阻断，本轮报告不改写历史记录。
