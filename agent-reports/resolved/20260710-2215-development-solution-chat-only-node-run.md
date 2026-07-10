---
status: resolved
report_type: solution
owner: Development Agent
created_by: Development Agent
priority: high
created_at: 2026-07-10 22:15
updated_at: 2026-07-10 22:15
related_issue: native Plan and Goal Run cannot be truthfully controlled by the Desktop widget host
related_files:
  - plugins/canvasight/shared/types.ts
  - plugins/canvasight/src/components/TaskNode.tsx
  - plugins/canvasight/src/lib/markdown.ts
  - plugins/canvasight/mcp/server.mjs
---

# 节点 Run 收敛为 Chat

## 负责 Agent

Development Agent

## 对应问题

节点的 Plan / Goal 选项会产生无法由原生 widget bridge 确认的模式语义，导致普通消息被误标或被阻断。

## Root Cause

当前宿主 bridge 只支持发送后续消息，没有当前 task 的 Plan / Goal 模式切换及确认 API。

## 推荐方案

移除节点的 Plan / Goal 控件与数据合同，旧持久化节点和旧请求统一归一化为 Chat，保留标题、提示词、附件和运行内容。

## 实施步骤

1. 删除节点及通用 CanvasNode 的 Plan / Goal 控件与类型字段。
2. Markdown 与 Run payload 改为 Chat-only，不再声明请求模式。
3. MCP 服务器剥离旧模式数据、归一化旧输入为 Chat，并仅执行 Chat native preflight。

## 处理结果

已修复。

## 修改文件

- `plugins/canvasight/shared/types.ts`
- `plugins/canvasight/src/components/TaskNode.tsx`
- `plugins/canvasight/src/components/ui/canvas-node.tsx`
- `plugins/canvasight/src/App.tsx`
- `plugins/canvasight/src/lib/markdown.ts`
- `plugins/canvasight/src/lib/canvasightApi.ts`
- `plugins/canvasight/src/lib/translations.ts`
- `plugins/canvasight/mcp/server.mjs`

## 验证方式

- `npm run typecheck`

## 后续风险

历史 `.scatter` 文件会在下次加载/保存时移除旧模式字段并以 Chat 运行；不会丢失节点正文、标题或附件。
