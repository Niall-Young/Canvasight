---
status: resolved
report_type: solution
owner: Development Agent
created_by: Main Thread
priority: high
created_at: 2026-08-05 13:56
updated_at: 2026-08-05 13:56
related_issue: agent-reports/resolved/20260805-1348-issue-edge-over-connect-button.md
related_files:
  - plugins/canvasight/src/styles/app.css
  - plugins/canvasight/src/components/ScatterEdge.tsx
  - plugins/canvasight/tests/asset-presentation-smoke.mjs
---

# 修复 Edge 覆盖连接按钮的层级与端点

## 负责 Agent

Development Agent

## 对应问题

`agent-reports/resolved/20260805-1348-issue-edge-over-connect-button.md`

## Root Cause

nodes 容器的固定 `z-index: 1` 形成独立堆叠上下文，而 XYFlow 在含 Group 成员的连接上把 Edge SVG 提升到 `z-index: 2`。节点内部连接按钮即使设置局部层级，也无法越过父堆叠上下文，导致 Edge path、交互热区和端帽覆盖按钮。

## 调研过程

- 比较 Edge、nodes 容器、Task/Asset 和 Group 的 computed `z-index`。
- 在左右按钮中心执行 `elementsFromPoint`，确认修复前 Edge path 位于按钮之前。
- 排除禁用 Edge pointer events 的做法，因为它会破坏 Edge 点击和选中。
- 检查 Group 内 Edge 与拖线预览，避免只修图片 Asset 的局部样式。

## 可选方案

- 方案 A：仅提高按钮局部 `z-index`；无法跨越 nodes 父堆叠上下文。
- 方案 B：禁用 Edge pointer events；会破坏 Edge 点击/选中。
- 方案 C：取消 nodes 统一堆叠上下文，显式保持 Group `0`、Edge `1`、Task/Asset `2`，并让端点停在按钮外缘。

## 推荐方案

采用方案 C。它直接修复根因，保留 Edge 的 20 px 交互热区和选中反馈，并让 Group 背景继续位于组内连线下方。

## 实施步骤

1. 把 `.react-flow__nodes` 改为 `z-index: auto`，取消父级层叠限制。
2. 将每条 XYFlow Edge SVG 固定为 `z-index: 1`，保留 Group `0` 与 Task/Asset `2`。
3. 将 ScatterEdge 左右端点和端帽移动到 20 px 连接按钮的外缘。
4. 扩充 Asset presentation smoke，锁定层级、端点、点击热区、选中高亮和连接预览契约。

## 风险与回滚

风险集中在 Edge 点击、Group 内连线和拖线预览。浏览器已逐项通过；如需回滚，可恢复三个源码/测试文件及对应构建产物。

## 处理结果

已修复。

## 修改文件

- `plugins/canvasight/src/styles/app.css`
- `plugins/canvasight/src/components/ScatterEdge.tsx`
- `plugins/canvasight/tests/asset-presentation-smoke.mjs`
- `plugins/canvasight/dist/index.html`
- `plugins/canvasight/dist/assets/*`

## 验证方式

- Playwright hover、selected、Edge 点击、Group 内 Edge、拖线预览和真实新建 Edge：PASS。
- 浏览器控制台：0 errors、0 warnings。
- `npm run test:asset-presentation`：PASS。
- `npm run typecheck`：PASS。
- `npm run build`：PASS。
- `npm run check:mcp-bundle`：PASS。
- Plugin validation：PASS。

## 后续风险

未执行真实 Codex native Widget 验收；本轮只声明开发浏览器表面通过。
