---
schema_version: 1
report_id: solution-skill-picker-completeness-position
report_type: solution
status: resolved
owner: Development Agent
created_by: Development Agent
priority: high
version: 2
agent_id: /root/development_agent
thread_id: 019f5bfd-a6a5-7b13-a1a9-d6924fa2100a
created_at: 2026-07-13T15:14:35Z
updated_at: 2026-07-14T02:34:38Z
depends_on:
  - issue-skill-picker-completeness-position
related_files:
  - design.md
  - plugins/canvasight/mcp/server.source.mjs
  - plugins/canvasight/mcp/server.mjs
  - plugins/canvasight/src/components/TaskNode.tsx
  - plugins/canvasight/src/lib/canvasightApi.ts
  - plugins/canvasight/src/lib/skills.ts
  - plugins/canvasight/src/lib/skillPickerPlacement.ts
  - plugins/canvasight/src/styles/app.css
  - plugins/canvasight/tests/mcp-smoke.mjs
  - plugins/canvasight/tests/skills-smoke.mjs
verification_status: passed
verification_evidence:
  - Automated MCP, Skill, typecheck, build, distribution, release and plugin validation passed for 0.4.15.
  - Playwright browser fallback displayed 171 options in a non-overlapping 336px viewport portal and passed refresh, keyboard scrolling, Enter insertion and Escape dismissal.
  - 0.4.16 independent browser verification passed caret geometry, four-direction collision handling, 288x228 sizing, 44px rows, scrolling, combobox ARIA, keyboard insertion, IME safety, and zoom isolation.
  - 0.4.16 build, Skill smoke, MCP bundle check, clean distribution, release verification, and plugin validation passed.
---

# 修复 Skill 目录截断并将选择器锚定输入光标

## 负责 Agent

Development Agent

## 对应问题

`agent-reports/assigned/issue-skill-picker-completeness-position.md`

## Root Cause

- 前端 `filterSkills` 默认只返回 8 项。
- Skill discovery 复用 native thread 的 Desktop-first runtime；没有 Codex.app 时会选 ChatGPT 内置 Codex，同一项目只解析约 65 项，而 PATH Codex 可解析约 171 项。
- picker 位于 XYFlow 节点 DOM 内，absolute + `width: 100%` 会继承画布 zoom，视觉尺寸失控并覆盖节点。
- 0.4.15 虽已改用 viewport Portal，但仍以整个节点为锚点、保留标题栏和 360px 高度；第二轮截图证明其远离输入位置且继续遮挡画布。

## 调研过程

确认 `skills/list` 无分页字段；截图中的排序和数量与前端 top-8 完全一致。对同一 cwd 实测 ChatGPT bundled 与 PATH Codex 的 enabled Skill 数量，确认第二层来源偏差。

## 推荐方案

Skill discovery 单独采用“专用 override、通用 override、Codex.app、PATH Codex、ChatGPT fallback”的 runtime 顺序；native open/Run 保持 Desktop-first。UI API 读取完整目录并去重，MCP 工具仍保留默认 50 条轻量摘要。picker 通过 body Portal 以 fixed 坐标布局，使用 textarea mirror 将 `selectionStart` 转为物理 viewport caret rect；优先在光标上下方放置，垂直空间不足时再退到左右，并做 8px 视口钳制。

## 实施步骤

1. 拆分 Skill runtime 选择并补双链路回归。
2. 移除 UI 默认 top-N，保留显式 limit 和 MCP 摘要上限。
3. 新增 caret 测量与 placement helper、Portal、视口/selection 监听、active item 自动滚动与完整 combobox/listbox ARIA。
4. 移除正常态标题栏，将弹层收紧到 288x228、每行 44px，并保留全量结果内部滚动。
5. 更新 `design.md`，同步 0.4.16 版本、MCP bundle 与 web dist。

## 风险与回滚

PATH Codex 与运行中宿主目录仍可能因版本不同短时漂移，可用 `CANVASIGHT_SKILLS_CODEX_BIN` 显式覆盖。

## 处理结果

自动化与独立 browser fallback 已验证完整目录和 caret-anchored combobox。真实 fullscreen native Widget 仍需重启升级后的 Codex Desktop 验收。

## 修改文件

- 见 frontmatter `related_files`，另含 0.4.16 manifest、package、lock 与 `dist/` 产物。

## 验证方式

- `npm run test:skills`
- `npm run typecheck`
- `npm run check:mcp-bundle`
- `npm run test:plugin-distribution`
- `npm run release:verify -- 0.4.16`
- plugin validator
- Playwright browser fallback 171 项、caret 几何、四向碰撞、滚动、ARIA、键盘、IME 与缩放检查

## 后续风险

真实 native host gate 未执行，父 issue 保持 assigned。README 中英文已准确描述当前项目 enabled Skills 与手工输入兜底，本轮无需更新。
