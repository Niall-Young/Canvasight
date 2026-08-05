---
schema_version: 1
report_id: issue-group-asset-node-visual-semantics
report_type: issue
status: blocked
owner: Test Supervisor Agent
created_by: Main Thread
priority: medium
version: 3
agent_id: /root/test_supervisor_agent
thread_id: null
created_at: 2026-08-05T02:09:42Z
updated_at: 2026-08-05T02:35:00Z
depends_on: []
related_files:
  - plugins/canvasight/src/components/GroupNode.tsx
  - plugins/canvasight/src/components/AssetNode.tsx
  - plugins/canvasight/src/App.tsx
  - plugins/canvasight/src/styles/app.css
  - plugins/canvasight/src/lib/translations.ts
  - design.md
verification_status: failed
verification_evidence:
  - Canvasight 0.5.1 local automation and browser-visible workflow passed
  - Exact restarted Codex Desktop native-host acceptance was not available
solution_report: agent-reports/resolved/solution-group-asset-node-visual-semantics.md
---

# Group 与 Asset Node 视觉语义不一致

## TL;DR

现有 Group 使用过重的黑色方框和左侧折叠入口，Asset 同时暴露编辑、角色标签与 Run，均偏离轻量容器和纯文件对象的产品语义。

## 问题描述

Group 的黑色外框抢占画布视觉层级；折叠/展开入口与其余操作分居两侧，且与菜单图标不一致。适应内容藏在菜单中，频繁操作成本过高。Asset 仍呈现为可编辑、可运行的任务型节点，文件卡片不够突出，角色标签也占用主界面注意力。

## 影响范围

- Group 容器、工具栏、折叠与适应内容交互。
- Asset 图片/文件布局、连接点、角色管理、文件操作与可访问性。
- 设计基线、双语文案判断和浏览器可见回归验证。

## 已确认边界

- Group 保留标题、说明、成员计数与 Group Run；去除重黑方框。
- 折叠/展开和适应内容作为右侧外显按钮，并从更多菜单移除。
- Asset 只呈现受管文件，不提供标题/说明编辑、Run 或复制。
- Asset 保留左右连接点和打开文件能力；更多菜单只承载显式更换文件、角色分类与删除等文件管理动作，角色以可选状态呈现。
- 更换文件保留节点 ID、位置、Group 归属、Edge 和角色，只替换受管文件引用及显示元数据；旧受管文件不被删除。
- 不修改 `.scatter` v2 持久化字段或 Graph Writer 合同。

## Closure Criteria

- [x] Group 外框、工具栏位置和菜单内容符合已确认方向
- [x] Asset 文件/图片卡片扩大并符合 Canvasight 配色
- [x] Asset 不再支持文字编辑、Run 或复制
- [x] 角色选择仅存在于更多菜单且当前值清晰可辨
- [x] 显式更换文件保留节点关系、位置、归属与角色
- [x] 类型检查、构建和浏览器可见验证通过
- [x] README 与 design.md 由对应职责完成影响判断
- [ ] 精确 0.5.1 的真实 Codex native-host 验收通过

## 当前状态

blocked

## 处理结果

本地实现、设计审查、自动化矩阵和浏览器可见验证已通过，解决方案见 `agent-reports/resolved/solution-group-asset-node-visual-semantics.md`。由于无法在本轮重启 Codex Desktop 并验收精确安装的 0.5.1 原生 Widget，本 issue 移交 Test Supervisor Agent 并保持 blocked。

## 修改文件

- `plugins/canvasight/src/App.tsx`
- `plugins/canvasight/src/components/AssetNode.tsx`
- `plugins/canvasight/src/components/GroupNode.tsx`
- `plugins/canvasight/src/components/RightDrawer.tsx`
- `plugins/canvasight/src/components/TaskNode.tsx`
- `plugins/canvasight/src/lib/translations.ts`
- `plugins/canvasight/src/styles/app.css`
- `README.md`
- `design.md`
- Canvasight 0.5.1 版本与生成分发快照

## 验证方式

- 通过构建、MCP bundle、MCP、并发、Widget runtime、插件分发、Markdown、release 和 plugin validation。
- 通过最终 0.5.1 Playwright fixture：Group 展开/折叠/适应内容/菜单、Asset 文件与图片卡、分类单选、连接点、替换文件保持关系及控制台无错误。
- 未验证真实 Codex native host。

## 后续风险

- 需安装精确 0.5.1、重启 Codex Desktop，并在新建且重新标记的任务中验证实例绑定 fullscreen ready、daemon 代理图片预览、Group 折叠/展开、Group Run 回到同一任务以及迟到元数据不让 UI 回退到 Connecting；在此之前不得宣称 native Widget 已验收或 ready。
