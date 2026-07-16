---
schema_version: 1
report_id: solution-inline-framework-flat-form-contrast
report_type: solution
status: resolved
owner: Development Agent
created_by: Development Agent
priority: high
version: 1
agent_id: /root/development_agent
thread_id: null
created_at: 2026-07-16T13:50:05Z
updated_at: 2026-07-16T13:50:05Z
depends_on:
  - issue-inline-framework-questions
related_files:
  - design.md
  - plugins/canvasight/src/styles/app.css
  - plugins/canvasight/tests/widget-runtime-smoke.mjs
  - plugins/canvasight/dist/index.html
  - plugins/canvasight/.codex-plugin/plugin.json
verification_status: passed
verification_evidence:
  - Version 0.4.27 build, release verification, composed widget runtime, clean distribution, MCP bundle freshness, and plugin validation passed.
  - Light and dark selected, unselected, focus, responsive, and flat outer-form computed-style assertions passed.
  - Four CDP screenshots confirm the selected row has no blue fill and the outer form has no duplicate card chrome.
---

# 消息内框架表单去外卡并恢复既有选择控件

## 负责 Agent

Development Agent；Design Agent、Test Supervisor Agent 与 Main Thread 完成复审和集成。

## 对应问题

`agent-reports/assigned/issue-inline-framework-questions.md`

## Root Cause

inline resource 已经被 Codex 消息面承载，但表单自身仍绘制 max-width、边框、圆角、opaque surface 和阴影，形成第二层卡片。暗色下该 outer surface 又与 `background-input` 同值，导致未选 preset row 融入父面。第一次修复错误地发明了 primary 蓝色整行 selected fill，偏离刚完成验收的 Scatter Figma Kit 合同。

## 推荐方案

只移除 inline form 的外层卡片 chrome，让 Codex 消息面成为唯一外容器；选择项严格保留既有 Figma 合同：`background-input`、12px radius、selected connecting border、no shadow、focus border，以及原有 radio/checkbox mark。禁止给 selected row 增加 primary 或蓝色填充。

## 处理结果

- 外层 form 现在 full-width、transparent、无 border/radius/shadow，不再卡片套卡片。
- 选项恢复既有中性 input surface；selected 只增加 connecting border，蓝色仅保留在 recommendation badge。
- 多问题间只保留 compact divider，不再出现额外大空带。
- 设计基线明确禁止 primary-tinted selected row。
- 0.4.27 已安装到 Canvasight 本地 marketplace cache。

## 修改文件

- `plugins/canvasight/src/styles/app.css`
- `plugins/canvasight/tests/widget-runtime-smoke.mjs`
- `design.md`
- 0.4.27 版本字段、MCP bundle 与 `dist/` 发行产物

## 验证方式

- `npm run build`
- `npm run test:widget-runtime`
- `npm run release:verify -- 0.4.27`
- `npm run test:plugin-distribution`
- `npm run check:mcp-bundle`
- plugin validator、四态 CDP 截图、安装缓存字节一致性检查

## 后续风险

当前 Codex 任务不会热更新插件资源。重启 Codex Desktop 后仍需在新任务验证 exact 0.4.27 inline 提交和 fullscreen 回归；该 blocker 继续由原 issue 管理。
