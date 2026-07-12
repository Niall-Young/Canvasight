---
schema_version: 1
report_id: issue-ai-graph-universal-horizontal-topology
report_type: issue
status: assigned
owner: Development Agent
created_by: Main Thread
priority: high
version: 2
agent_id: /root/development_agent
thread_id: null
created_at: 2026-07-12T14:31:13Z
updated_at: 2026-07-12T14:44:47Z
depends_on: []
related_files:
  - plugins/canvasight/mcp/server.mjs
  - plugins/canvasight/skills/canvasight-graph-writer/SKILL.md
  - plugins/canvasight/tests/mcp-smoke.mjs
verification_status: failed
verification_evidence:
  - Automated LTR, topology, typecheck, build, MCP, Markdown, skill, and plugin checks passed
  - Exact plugin version 0.4.5+codex.20260712223248 installed and listed
  - Codex Desktop was not restarted, so the planned native-host article/product visible-canvas check remains unverified
---

# AI 画布仍允许纵向布局和机械单链

## TL;DR

Graph Writer reference、MCP schema、运行时和测试仍把文章提纲纵向布局作为正式能力，并允许复杂产品图退化成机械单链。

## 问题描述

用户要求所有 AI 创建、替换、合并和重排的 Canvasight 图统一采用从左到右的拓扑。当前 `article-outline`、`structured-outline`、显式 `vertical/grid` 参数和缺失的语义拓扑校验共同允许纵向长链写入。

## 复现与证据

1. 以 `graphType: software-product` 调用 `write_canvasight_graph`，同时传入 `layout: vertical`。
2. 将 18 个独立产品职责连接成 17 条连续单链边。
3. 当前服务会接受候选并按约 6460px 高度纵向排布；自动布局只重算坐标，不修复错误拓扑。

## 期望结果

- 所有 AI 自动布局固定左到右，旧 `vertical/grid` 输入兼容接收但归一为水平。
- 阅读顺序通过兄弟排序和真实关系表达，不再决定画布方向。
- 语义拓扑校验拒绝无依据地把独立职责机械串联成单链。
- 用户明确保留的手工坐标继续由 `preserve-explicit` 保护。

## Closure Criteria

- [x] Skill/reference、runtime/schema、tests 和中英文文档同步更新
- [x] 全部 graphType 和 framework output 均通过水平布局回归
- [x] 旧方向参数兼容归一并返回 advisory
- [x] 插件版本同步提升、验证并重新安装
- [x] 原生 Canvasight 验收结果或缺失证据被准确记录

## 当前状态

实现与自动验证完成。保持 assigned，等待 Codex Desktop 重启后在新建并重新标记的任务中完成原生文章图、产品图、节点操作和可见方向验收。

## 处理结果

自动布局、schema、语义关系、机械单链校验、技能规范、文档和回归测试均已实现；原生宿主证据尚未取得。

## 修改文件

- `plugins/canvasight/mcp/server.mjs`
- `plugins/canvasight/tests/mcp-smoke.mjs`
- `plugins/canvasight/skills/canvasight-graph-writer/`
- `README.md`、`design.md`、`AGENTS.md` 与版本文件

## 验证方式

- `npm run test:mcp`、`npm run test:markdown`、`npm run typecheck`、`npm run build`
- Graph Writer skill validation、plugin validation、`codex plugin list`

## 后续风险

当前 Codex Desktop 进程仍可能持有旧插件注册快照；重启前不能声称新 schema 已由真实 native host 发现，也不能声称可见画布验收完成。
