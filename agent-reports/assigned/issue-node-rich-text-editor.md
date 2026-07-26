---
schema_version: 1
report_id: issue-node-rich-text-editor
report_type: issue
status: assigned
owner: Development Agent
created_by: Main Thread
priority: high
version: 1
agent_id: /root/development_agent
thread_id: null
created_at: 2026-07-26T03:10:31Z
updated_at: 2026-07-26T03:10:31Z
depends_on: []
related_files:
  - plugins/canvasight/src/components/TaskNode.tsx
  - plugins/canvasight/src/styles/app.css
  - plugins/canvasight/shared/types.ts
verification_status: not_started
verification_evidence: []
solution_report:
---

# 节点正文缺少富文本编辑能力

## TL;DR

节点正文目前是纯文本 `textarea`；用户要求以现有 `design.md` 为唯一视觉基线，提供无工具栏、Markdown 即时触发的所见即所得编辑，同时保持 Markdown 字符串合同不变。

## 发现者

User

## 提交 Agent

Main Thread

## 建议交接 Agent

Development Agent

## 问题描述

节点正文无法直接呈现标题、强调、列表、引用、代码和链接。实现必须兼容模板、Skill、Run、并发保存、IME 与 XYFlow 节点交互。

## 现象

正文始终显示 Markdown 原始字符，缺少富文本输入规则和只读渲染。

## 复现方式

1. 打开任意 Canvasight Page 并创建节点。
2. 在正文输入 `## 标题`、`- 列表` 或 `**粗体**`。
3. 内容仍由普通 `textarea` 显示。

## 影响范围

节点编辑、Markdown 持久化、模板、Skill Picker、Run 输出、节点高度与原生 Widget 视觉验收。

## 证据

- `TaskNode.tsx` 使用受控 `textarea`。
- `ScatterNodeData.body`、模板和 Run 链路均以 Markdown `string` 为合同。
- 用户明确要求样式只能来自当前 `design.md`。

## 初步归因

当前产品只实现了纯文本编辑控件，尚无富文本文档模型、Markdown 输入规则或序列化层。

## 交付给哪个 Agent

Development Agent

## 需要回答的问题

- 如何在不改变 `body: string` 和文档 schema 的前提下实现富文本编辑？
- 如何保持 `$Skill`、IME、撤销事务、节点拖拽和自动高度行为？
- 如何完全覆盖 `design.md`，而不泄漏编辑器默认样式？

## 相关文件

- `plugins/canvasight/src/components/TaskNode.tsx`
- `plugins/canvasight/src/styles/app.css`
- `plugins/canvasight/src/lib/markdown.ts`

## 期望结果

节点正文支持计划内常用格式的 Markdown 即时转换；无工具栏、无独立编辑框；读写态视觉稳定；底层仍保存 Markdown；现有 Run、模板、Skill 与并发合同通过回归。

## Closure Criteria

- [ ] 富文本编辑与只读渲染完成
- [ ] Markdown 字符串合同和未知内容保护完成
- [ ] `$Skill`、IME、XYFlow 交互和节点尺寸通过验证
- [ ] `design.md` 与双语 README 已同步
- [ ] 自动化、浏览器与原生 Widget 验收证据已记录

## 当前状态

assigned

## 处理结果

由 Development Agent 实施，Main Thread 集成。

## 修改文件

- 待实施

## 验证方式

- 待验证

## 后续风险

Tiptap Markdown 扩展的往返规范、未知 Markdown 保留和真实原生宿主验收需要重点验证。
