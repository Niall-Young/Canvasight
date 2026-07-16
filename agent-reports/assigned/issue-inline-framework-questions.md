---
schema_version: 1
report_id: issue-inline-framework-questions
report_type: issue
status: blocked
owner: Test Supervisor Agent
created_by: Main Thread
priority: high
version: 7
agent_id: /root/test_supervisor_agent
thread_id: null
created_at: 2026-07-14T05:38:01Z
updated_at: 2026-07-16T14:13:27Z
depends_on: []
related_files:
  - plugins/canvasight/mcp/server.source.mjs
  - plugins/canvasight/src/App.tsx
  - plugins/canvasight/src/styles/app.css
  - plugins/canvasight/src/lib/widgetBridge.ts
  - plugins/canvasight/tests/widget-runtime-smoke.mjs
  - design.md
  - plugins/canvasight/skills/canvasight-graph-writer/SKILL.md
verification_status: failed
verification_evidence:
  - The user supplied real Codex Desktop inline-host screenshots on 2026-07-16; the component renders, but dark-theme visual acceptance fails because the outer card duplicates the host container and unselected choices merge into the background.
  - Version 0.4.27 build, release verification, composed widget runtime, clean distribution, bundle freshness, plugin validation, light/dark computed styles, and four visual snapshots passed after the correction.
  - The exact 0.4.27 snapshot is installed and byte-identical for MCP and dist entry files, but a restarted Codex Desktop new-task inline submission and fullscreen regression acceptance are still missing.
  - The user supplied a second real-host screenshot on 2026-07-16 and explicitly rejected the flat outer form: the component must own a fill-width outer container with 24px padding, 16px radius, a light-gray border, and no horizontal scrolling or clipping.
  - Version 0.4.28 build, release verification, composed widget runtime, clean distribution, bundle freshness, plugin validation, complete light/dark captures, and installed-cache byte comparisons passed for the restored outer container.
  - The Agent Team validator still fails on pre-existing legacy root reports, old templates, and queue-format debt unrelated to this UI change.
solution_report: agent-reports/resolved/solution-inline-framework-fill-container.md
---

# 消息内框架确认组件

## TL;DR

Canvasight Graph Writer 缺少一个直接嵌入 Codex 消息流的结构化确认组件，关键歧义目前只能依赖普通文字询问或被模型猜测。

## 发现者

Main Thread

## 提交 Agent

Main Thread

## 建议交接 Agent

Development Agent

## 问题描述

Graph Writer 在目标、范围、框架维度或关键关系存在会改变最终图结构的歧义时，需要暂停写图，并用 Canvasight 自有 inline MCP UI 一次收集一至三个问题。每题提供二至三个预设选项和自定义输入，AI 可选择单选或多选；提交后通过同一 Codex 任务的原生消息 bridge 自动继续。

## 现象

- 当前插件只注册主 Canvasight fullscreen Widget resource。
- Graph Writer Skill 仅要求在冲突或缺失证据时“ask the user”，没有稳定的结构化提问工具。
- 现有 bridge 已支持 `ui/message` 和 `window.openai.sendFollowUpMessage`，但只服务主画布 Run。

## 复现方式

1. 请求 Canvasight 梳理一个存在两个以上关键产品方向的框架。
2. Graph Writer 无法在消息中渲染 Canvasight 风格的选择卡片。
3. 用户必须阅读普通文字并手动组织回复，或模型自行选择方向。

## 影响范围

MCP tool/resource 注册、Widget bridge、React 根入口、Graph Writer Skill、设计基线、双语 README、版本产物与宿主验收。

## 证据

- 当前资源列表只有 `ui://widget/canvasight/canvas.html`。
- `write_canvasight_graph` 前没有结构化关键歧义确认步骤。
- 现有 bridge 已具备同任务消息回传能力，可复用但必须保持 inline/fullscreen 路径隔离。
- 用户的真实 Codex Desktop 截图显示 inline 组件外层重复使用边框、圆角、背景和阴影，形成双层容器。
- 暗色主题中 `--color-background-input` 与 `--color-background-surface` 同为 `#1C1C1C`，未选中项没有可见表面边界或底色层级。

## 初步归因

插件早期仅实现了全屏画布 App，没有为 Graph Writer 的对话内决策收集建立独立 MCP UI surface 和工具契约。

## 交付给哪个 Agent

Development Agent

## 需要回答的问题

- 如何让第二 resource 复用真实 `app.css` 与 React bundle，但绝不启动 daemon 或请求 fullscreen？
- 如何让单选、多选、自定义输入和消息回传保持类型化、可访问且可测试？
- 如何确保确认后的新回合重新读取 graph context，而不是复用过期 revision？

## 相关文件

- `plugins/canvasight/mcp/server.source.mjs`
- `plugins/canvasight/src/App.tsx`
- `plugins/canvasight/src/lib/widgetBridge.ts`
- `plugins/canvasight/skills/canvasight-graph-writer/SKILL.md`

## 期望结果

关键歧义会在当前 Codex 消息中显示 Canvasight 风格 inline 卡片；提交后同一任务收到可审计答案并自动继续，主 fullscreen Canvasight 行为保持不变。

## Closure Criteria

- [x] 新 tool/resource 和 schema 已实现
- [x] inline 组件不启动 daemon、不请求 fullscreen
- [x] 单选、多选、自定义输入与 bridge 回传已自动化验证
- [x] Graph Writer 触发、去重和降级规则已验证
- [x] 文档、版本、生成产物与 Agent Team 报告已同步
- [x] 原生宿主缺失证据已如实记录
- [x] 旧版“完全扁平外框”验收已由用户真实宿主反馈废止并由新版容器契约替代
- [x] 暗色与亮色主题下，未选中、选中、聚焦三种选项状态均通过自动化与截图验证
- [x] 外层容器按最新验收恢复 24px padding、16px radius 和浅灰描边
- [x] 容器 fill 宿主可用宽度，padding 计入总宽，窄宽无水平滚动或裁切
- [x] 自动高度覆盖完整 document、外框和上下 padding，完整亮暗截图显示四边和底部按钮
- [ ] 重启后的 Codex Desktop 新任务完成 exact 0.4.28 inline 提交与 fullscreen 回归

## 当前状态

blocked：0.4.28 已完成 fill-width 外框、自动高度、自动化、完整截图、版本化安装和快照一致性检查；等待重启 Codex Desktop 后在新任务完成真实 inline 提交与 fullscreen 回归。

## 处理结果

按用户最新截图恢复透明 outer boundary：24px padding、16px radius、语义浅灰描边、fill 宿主宽度且无横向滚动；内部 Scatter Figma Kit 选择控件保持不变。0.4.28 已安装；真实宿主复验待重启。

## 修改文件

- 见 `agent-reports/resolved/solution-inline-framework-fill-container.md`。

## 验证方式

- `npm run build`
- `npm run test:widget-runtime`
- `npm run release:verify -- 0.4.28`
- `npm run test:plugin-distribution`
- `npm run check:mcp-bundle`
- plugin validator、四态 CDP 截图与安装缓存字节一致性检查
- 安装新版本并重启 Codex Desktop 后，在新任务调用 `ask_canvasight_framework_questions`，确认消息内渲染、同任务续跑及 fullscreen open/Run 回归。

## 后续风险

当前任务仍持有旧插件资源快照；在重启后 exact 0.4.28 真实宿主复验前，不得宣称 native inline 已完全验收。
