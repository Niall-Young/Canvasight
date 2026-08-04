---
schema_version: 1
report_id: issue-asset-nodes-semantic-groups
report_type: issue
status: resolved
owner: Development Agent
created_by: Main Thread
priority: high
version: 3
agent_id: /root/development_agent
thread_id: null
created_at: 2026-08-04T11:54:22Z
updated_at: 2026-08-04T12:56:19Z
depends_on: []
related_files:
  - plugins/canvasight/shared/types.ts
  - plugins/canvasight/src
  - plugins/canvasight/mcp/server.source.mjs
  - plugins/canvasight/tests
  - plugins/canvasight/skills/canvasight-graph-writer
  - design.md
  - README.md
verification_status: passed
verification_evidence:
  - Canvasight 0.5.0 automated matrix passed
  - Browser UI verified Group collapse and Asset preview persistence
solution_report: agent-reports/resolved/solution-asset-nodes-semantic-groups.md
---

# Canvasight 资产节点与语义 Group

## TL;DR

Canvasight 已从纯文字任务图升级为支持 `task | asset | group` 的多模态、单层语义画布，并保持 v1 文档兼容。

## 问题描述

原有 `task` 单节点模型无法让参考图片、输入文件、候选方案和产出成为可连接的一等对象；缺少 Group 也使复杂画布只能依靠 Page 与 Edge 表达全部结构。

## 影响范围

- `.scatter` 文档兼容、修订与并发合并。
- React/XYFlow 节点、拖拽、复制、折叠和 Run。
- Graph Context、Graph Writer、验证与布局。
- Markdown/ZIP 导出、Skills、双语 README 与设计基线。

## 已确认边界

- 首版交付 Asset Node 与单层、唯一归属的语义 Group。
- Group Run 只包含组内成员和内部关系。
- 空白画布导入创建 Asset Node；任务节点内导入仍为附件，可手动提升。
- 资产角色固定为 input、reference、option、output。
- 删除 Group 只解除成员；折叠时跨组边聚合到 Group 边界。
- 图片生成、嵌套 Group、多重归属、Group 模板和远端发布不在本轮。

## Closure Criteria

- [x] v1/v2 兼容和一次性备份通过验证
- [x] Asset Node 导入、提升、连接、复制、搜索和 Run 完成
- [x] Group 创建、归属、折叠、聚合边、安全删除和 Run 完成
- [x] Graph Context/Writer、布局、并发与幂等覆盖新模型
- [x] README、design.md、Skills、版本和自包含 MCP bundle 同步
- [x] 自动化和浏览器可见验证通过；真实 native widget 证据明确标记为 `unverified`

## 当前状态

resolved

## 处理结果

实现完成，见 `agent-reports/resolved/solution-asset-nodes-semantic-groups.md`。

## 修改文件

- `plugins/canvasight/shared/types.ts`
- `plugins/canvasight/mcp/server.source.mjs`
- `plugins/canvasight/src/`
- `plugins/canvasight/tests/`
- `plugins/canvasight/skills/canvasight-graph-writer/`
- `README.md`
- `design.md`

## 验证方式

- 构建、MCP、并发、Markdown、Widget、分发、更新、插件和 Skill 验证。
- Playwright 浏览器验证创建/折叠 Group、导入图片 Asset、重载持久化和控制台无错误。

## 后续风险

- 未在重启后的真实 Codex Desktop fullscreen Widget 中完成精确 0.5.0 的 ready、上传、Group Run 与迟到元数据验收，交付状态为 `unverified`。
- Agent Team 全库校验仍被大量历史报告和旧 QUEUE 格式阻塞，本轮新增报告遵循现行 schema，未扩大范围重写历史审计记录。
