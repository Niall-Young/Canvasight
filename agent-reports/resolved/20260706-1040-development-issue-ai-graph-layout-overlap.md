---
status: resolved
report_type: issue
owner: Development Agent
created_by: user
priority: high
created_at: 2026-07-06 10:40
updated_at: 2026-07-06 11:01
related_files:
  - plugins/canvasight/mcp/server.mjs
  - plugins/canvasight/tests/mcp-smoke.mjs
  - plugins/canvasight/skills/canvasight-graph-writer/references/graph-writing.md
solution_report: agent-reports/resolved/20260706-1101-development-solution-ai-graph-layout.md
---

# AI 生成画布默认布局堆叠

## TL;DR

`write_canvasight_graph` 默认布局只按固定 grid / horizontal / vertical 坐标排列，没有理解连线层级和节点安全尺寸，导致真实生成的复杂画布节点挤成一坨。

## 发现者

user

## 提交 Agent

user

## 建议交接 Agent

Development Agent, Design Agent, Test Supervisor Agent, Skill Expert Agent

## 问题描述

用户截图显示 AI 生成的产品任务画布中，多层节点、补充文档节点和扇出节点互相靠得太近，边线穿插严重，整体不可读。当前 MCP 默认布局使用 `index % 3` 或线性坐标，缺少按边关系计算层级、按层内节点数量分布、按节点尺寸留白的逻辑。

## 现象

生成好的画布节点聚集在中心区域，长文本节点和补充节点与主流程混在一起，用户无法快速理解结构。

## 复现方式

1. 使用 `write_canvasight_graph` 生成一个 software-product 或 task-plan 画布。
2. 让一个 root 节点连接多个下游节点，并带 2 层以上后续任务。
3. 打开 Canvasight 观察节点是否按层级散开。

## 影响范围

- `write_canvasight_graph` 默认布局。
- AI 生成产品规划、代码架构、文章梳理和任务计划画布的可读性。
- 自动补充 `AGENTS.md` / `design.md` guidance nodes 的位置。

## 证据

- 截图中节点在中心堆叠，多个下游节点和长文本节点互相贴近。
- `normalizeGraphNodePosition()` 当前只按 `index` 和固定 `460 x 260` fallback 排列。

## 初步归因

布局算法缺少 DAG / edge-aware 分层步骤，也没有保留足够的节点间距；guidance nodes 作为普通追加节点进入固定 grid 后更容易与主图混在一起。

## 交付给哪个 Agent

Development Agent

## 需要回答的问题

- 如何在不覆盖显式 `position/x/y` 的情况下，为未定位节点自动分层？
- 默认 horizontal / grid / vertical 是否都应使用边关系避让？
- smoke test 应如何覆盖 fan-out、多层、显式 position 和 guidance nodes？

## 相关文件

- `plugins/canvasight/mcp/server.mjs`
- `plugins/canvasight/tests/mcp-smoke.mjs`
- `plugins/canvasight/skills/canvasight-graph-writer/references/graph-writing.md`

## 期望结果

AI 生成的画布默认按连线层级展开，父节点在左、子节点在右，同层节点上下错开，孤立节点单独分区，显式传入 position 的节点不被覆盖。

## Closure Criteria

- [ ] 问题原因明确
- [ ] 方案报告已回写
- [ ] 修改文件已记录
- [ ] 验证方式已记录
- [ ] 后续风险已记录

## 当前状态

resolved

## 处理结果

已修复。`write_canvasight_graph` 现在会在存在连线时按依赖层级自动布局，父节点在左、子节点在右，同层节点纵向展开；孤立节点放到主连通图下方单独分区；显式 `position` / `x` / `y` 坐标按轴保留。

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
- `agent-reports/QUEUE.md`
- `agent-reports/resolved/20260706-1101-development-solution-ai-graph-layout.md`
- `agent-reports/resolved/20260706-1101-integration-summary-ai-graph-layout.md`

## 验证方式

- `npm run test:mcp`
- `npm run typecheck`
- `python3 /Users/niallyoung/.codex/skills/.system/skill-creator/scripts/quick_validate.py /Users/niallyoung/Desktop/Canvasight/plugins/canvasight/skills/canvasight-graph-writer`
- `npm run build`
- `npm run test:dev-server`
- `python3 /Users/niallyoung/.codex/skills/.system/plugin-creator/scripts/validate_plugin.py /Users/niallyoung/Desktop/Canvasight/plugins/canvasight`
- `codex plugin add canvasight@canvasight-local`
- `codex plugin list`
- 浏览器 DOM 验证 `http://127.0.0.1:5173/` 载入样例画布后 10 个节点、9 条边、0 个节点重叠。

## 后续风险

当前已打开的 Codex thread 不会热刷新旧 MCP tool 进程；需要新开或 reload Codex thread 后才会调用已安装的 `canvasight@canvasight-local` 0.1.16。项目级 Vite dev server 和 Canvasight daemon 已重启到 0.1.16。
