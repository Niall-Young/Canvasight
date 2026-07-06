---
status: resolved
report_type: solution
owner: Development Agent
created_by: Development Agent
priority: high
created_at: 2026-07-06 11:01
updated_at: 2026-07-06 11:01
related_issue: agent-reports/resolved/20260706-1040-development-issue-ai-graph-layout-overlap.md
related_files:
  - plugins/canvasight/mcp/server.mjs
  - plugins/canvasight/tests/mcp-smoke.mjs
  - plugins/canvasight/skills/canvasight-graph-writer/SKILL.md
  - plugins/canvasight/skills/canvasight-graph-writer/references/graph-writing.md
---

# AI 生成画布分层布局修复

## 负责 Agent

Development Agent

## 对应问题

`agent-reports/resolved/20260706-1040-development-issue-ai-graph-layout-overlap.md`

## Root Cause

`write_canvasight_graph` 的默认坐标生成只基于节点 index 和固定网格，没有使用 edge 关系计算层级，也没有为节点实际尺寸预留足够间距。复杂 software-product / task-plan 图会把多层节点、扇出节点和自动补充的 guidance 节点压在同一块区域里。

## 调研过程

- 复核 MCP 的 `normalizeGraphNodePosition()`，确认默认步长为旧的 `460 x 260`，不足以容纳当前任务节点卡片。
- 复核用户截图，问题集中在 root 扇出、多层依赖、补充文档节点同时出现时。
- Development Agent 建议在 edge 校验后做 DAG 分层，并按轴保留显式坐标。
- Design Agent 要求父节点在左、子节点在右，同层节点错开，孤立节点和补充节点不要挤进主流程。
- Test Supervisor Agent 要求 smoke 覆盖 fan-out、显式坐标、孤立节点、guidance nodes 和坐标重复回归。
- Skill Expert Agent 要求更新 graph-writer skill，不新增无关 skill。

## 可选方案

- 方案 A：只放大原有 grid 间距。实现简单，但仍然不理解连接关系，多层图会继续难读。
- 方案 B：要求 AI 每次都显式传坐标。短期可用，但把布局责任推给模型，无法保证稳定。
- 方案 C：MCP 默认执行 edge-aware 分层布局，同时显式坐标优先。实现成本适中，能让 AI 生成图默认可读。

## 推荐方案

采用方案 C。默认布局应该由 Canvasight 兜底，AI 只需要表达节点和连线结构；当 AI 或用户已经提供 `position` / `x` / `y` 时，MCP 不覆盖对应坐标轴。

## 实施步骤

1. 在 `mcp/server.mjs` 增加节点尺寸、层间距和行间距常量。
2. 增加 `graphLayoutLayers()`，按 edge 关系把 connected nodes 分层。
3. 增加 `edgeAwareGraphNodePositions()`，按层计算坐标，并把 isolated nodes 放到主图下方单独分区。
4. 增加 `applyGraphAutoLayout()`，在 edge 校验后统一应用布局，同时按轴保留显式坐标。
5. 扩展 MCP smoke：fan-out、多层 product graph、显式坐标、孤立节点、坐标不重复。
6. 更新 graph-writer skill、README、design baseline，并同步插件版本到 `0.1.16`。

## 风险与回滚

风险：已有没有显式坐标的 AI 图在重新生成后位置会变化。回滚方式是恢复 `normalizeGraphNodePosition()` 的 index fallback 逻辑并移除 edge-aware 自动布局。

## 处理结果

已修复。

## 修改文件

- `plugins/canvasight/mcp/server.mjs`
- `plugins/canvasight/tests/mcp-smoke.mjs`
- `plugins/canvasight/skills/canvasight-graph-writer/SKILL.md`
- `plugins/canvasight/skills/canvasight-graph-writer/references/graph-writing.md`
- `README.md`
- `design.md`
- `plugins/canvasight/.codex-plugin/plugin.json`
- `plugins/canvasight/package.json`
- `plugins/canvasight/package-lock.json`

## 验证方式

- `npm run test:mcp`
- `npm run typecheck`
- `python3 /Users/niallyoung/.codex/skills/.system/skill-creator/scripts/quick_validate.py /Users/niallyoung/Desktop/Canvasight/plugins/canvasight/skills/canvasight-graph-writer`
- `npm run build`
- `npm run test:dev-server`
- `python3 /Users/niallyoung/.codex/skills/.system/plugin-creator/scripts/validate_plugin.py /Users/niallyoung/Desktop/Canvasight/plugins/canvasight`
- `codex plugin add canvasight@canvasight-local`
- `codex plugin list`
- 浏览器 DOM 验证：样例画布渲染 10 个节点、9 条边、0 个节点重叠。

## 后续风险

当前已打开的 Codex thread 不会热刷新旧 MCP tool 进程；新开或 reload Codex thread 后才会使用已安装的 `canvasight@canvasight-local` 0.1.16。项目级 dev server 和 daemon 已重启到 0.1.16。
