---
status: resolved
report_type: solution
owner: Development Agent
created_by: Main Thread
priority: high
created_at: 2026-08-05 14:15
updated_at: 2026-08-05 14:15
related_issue: agent-reports/resolved/20260805-1407-issue-edge-endpoint-gap-regression.md
related_files:
  - plugins/canvasight/src/components/ScatterEdge.tsx
  - plugins/canvasight/tests/asset-presentation-smoke.mjs
---

# 修复持久 Edge 端点悬空回归

## 负责 Agent

Development Agent

## 对应问题

`agent-reports/resolved/20260805-1407-issue-edge-endpoint-gap-regression.md`

## Root Cause

当前 @xyflow/react 传给自定义 Edge 的 `sourceX/targetX` 位于 20px Handle 外缘，而不是 Handle 中心或节点边界。上一轮向外偏移 10px 进一步扩大空隙；直接使用原始坐标也仍有半个 Handle 宽度的空隙。

## 调研过程

- 用用户截图对应的已有 Edge 建立真实浏览器红态。
- 分别测量节点边界、Handle 外缘/中心及 SVG path 端点。
- 证伪“直接使用 sourceX/targetX”的假设。
- 对 inward 方案复测两端 gap、按钮命中、Edge 点击及拖线。

## 可选方案

- 方案 A：向节点外侧偏移 10px；实测 gap 约 `7.2px`，失败。
- 方案 B：直接使用 `sourceX/targetX`；坐标位于 Handle 外缘，实测同样失败。
- 方案 C：左侧 `x + 10`、右侧 `x - 10`，向节点内侧换算半个 Handle 宽度；实测 gap 接近 0。

## 推荐方案

采用方案 C，并保留上一轮 `Group 0 < Edge 1 < Task/Asset 2` 的层级修复。端点几何负责贴边，层级负责按钮覆盖，两个职责不再混用。

## 实施步骤

1. 恢复 `nodeEdgeX` 的 inward 换算：左 `+10`、右 `-10`。
2. 保持 path 和 EdgeCap 共用换算后的节点边界坐标。
3. 更新 smoke 断言，锁定半个 20px Handle 的 inward 几何并明确拒绝 outward 公式。
4. 用 Playwright 对真实 SVG path 和节点边界做像素回归。

## 风险与回滚

风险是 XYFlow 后续改变 Handle 坐标语义；测试同时检查源码契约和真实浏览器几何，升级时必须重新验证。

## 处理结果

已修复。

## 修改文件

- `plugins/canvasight/src/components/ScatterEdge.tsx`
- `plugins/canvasight/tests/asset-presentation-smoke.mjs`
- `plugins/canvasight/dist/index.html`
- `plugins/canvasight/dist/assets/*`

## 验证方式

- 左右 Edge 与节点边缘误差分别约 `0.000085px`、`0.000022px`。
- hover/selected 按钮 hit-test 顶层为 icon/button，无 Edge 穿透。
- Edge 点击高亮、Group 内 Edge、拖线预览和真实新建 Edge：PASS。
- 控制台：0 errors、0 warnings。
- `npm run test:asset-presentation`、`npm run typecheck`、`npm run build`、`npm run check:mcp-bundle`：PASS。
- Plugin validation：PASS。

## 后续风险

native-host 保持 unverified；本轮不把浏览器证据描述为原生 Widget 验收。
