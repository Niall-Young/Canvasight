---
status: resolved
report_type: integration-summary
owner: main-thread
created_by: main-thread
priority: high
created_at: 2026-08-05 14:15
updated_at: 2026-08-05 14:15
related_files:
  - agent-reports/resolved/20260805-1407-issue-edge-endpoint-gap-regression.md
  - agent-reports/resolved/20260805-1415-development-solution-edge-endpoint-gap.md
  - plugins/canvasight/src/components/ScatterEdge.tsx
  - plugins/canvasight/tests/asset-presentation-smoke.mjs
---

# 集成 Edge 贴边回归修复

## 本轮目标

- 修复上一轮引入的持久 Edge 与节点边缘悬空回归。
- 同时保留连接按钮不被 Edge 穿透的层级修复。

## Agent 状态

- Product Agent：席位受并发上限限制；Main Thread 确认无领域或产品范围变化。
- Design Agent：根据真实 DOM 证据修正端点语义结论。
- Development Agent：完成 inward 半 Handle 几何修复与回归断言。
- Test Supervisor Agent：完成 outward、direct 红测与 inward 绿测，最终判定 PASS。
- Customer Support Agent：席位受并发上限限制；Main Thread 执行 README 门禁，决定无需更新。
- Design Standards Expert：席位受并发上限限制；Main Thread 确认 `design.md` 现有层级与连接点规范仍准确。
- Development Standards Lead：席位受并发上限限制；Main Thread 确认无流程或命令变化。
- Project Management Agent：席位受并发上限限制；Main Thread 执行同等 Git 基线、选择性暂存与提交检查。
- Skill Expert Agent：席位受并发上限限制；无 Skill 文件变化。

## Agent 输入

- Product Agent：Main Thread 判断为纯回归修复。
- Design Agent：最终确认当前 XYFlow 坐标位于 Handle 外缘，需 inward 半 Handle。
- Development Agent：恢复左 `+10`、右 `-10` 并增强测试。
- Test Supervisor Agent：真实 DOM 证明 direct/outward 均悬空，inward gap 接近 0。
- Customer Support Agent：README 不涉及能力、命令、安装或工作流变化。
- Design Standards Expert：`design.md` 无需更新。
- Development Standards Lead：`AGENTS.md` 无需更新。
- Project Management Agent：基线 `4b9d8e0b9348b3a9a061786f82f41922888bae34`；只暂存本轮文件。
- Skill Expert Agent：不适用。

## 报告状态变更

- `agent-reports/assigned/20260805-1407-issue-edge-endpoint-gap-regression.md` -> `agent-reports/resolved/20260805-1407-issue-edge-endpoint-gap-regression.md`
- 新增 solution 与 integration summary。

## 已解决

- 持久 Edge 左右端点重新与节点边界连续连接。
- hover/selected 时黑色连接按钮仍覆盖 Edge，并优先接收事件。
- Edge 点击、Group 内 Edge 和拖线连接未回归。

## 未解决

- 真实 Codex native Widget 未在本轮执行 exact-version host acceptance。

## 风险

- XYFlow 升级若改变 Handle 坐标语义，必须重新运行真实浏览器几何测试。

## 下一轮分派

- 无；后续发布时执行 native-host acceptance。

## 已完成改动

- 把错误的 outward 端点换算恢复为 inward 半个 Handle 宽度。
- 增加防止 outward/direct 回归的静态契约。
- 重建 web distribution。

## 处理结果

已完成。

## 修改文件

- `plugins/canvasight/src/components/ScatterEdge.tsx`
- `plugins/canvasight/tests/asset-presentation-smoke.mjs`
- `plugins/canvasight/dist/index.html`
- `plugins/canvasight/dist/assets/*`
- `agent-reports/QUEUE.md`
- `ROSTER.md`
- 本轮 issue、solution 与 integration summary。

## 验证方式

- Playwright 真实像素几何、按钮 hit-test、Edge 点击、Group 内 Edge、拖线连接。
- 自动化、类型检查、构建、MCP bundle freshness、plugin validation 与 Git diff checks。

## 验证记录

- outward：两侧约 `7.2px` gap，FAIL。
- direct：path 与 Handle 外缘重合，两侧约 `7.2px` gap，FAIL。
- inward：左右 gap 约 `0.000085px` 与 `0.000022px`，PASS。
- hover/selected：按钮命中顶层为 icon/button，PASS。
- Edge 点击、Group 内 Edge、真实拖线新建：PASS。
- 浏览器控制台：0 errors、0 warnings。
- `npm run test:asset-presentation`、`npm run typecheck`、`npm run build`、`npm run check:mcp-bundle`：PASS。
- Plugin validation：PASS。
- README: unchanged；纯回归修复，不改变能力、命令、安装或工作流说明。

## 回写状态

- `agent-reports/QUEUE.md` 已更新。
- issue 已移入 resolved 并关联 solution。
- solution 与 integration summary 已写入。

## 未解决 / 后续风险

- native-host 保持 unverified。
- 预先存在的未跟踪 `plugins/canvasight/dist/favicon 2.png` 与 `index 2.html` 已保持原始哈希并明确排除在提交外。

## Git 状态

- branch: `main`
- baseline: `4b9d8e0b9348b3a9a061786f82f41922888bae34`
- commit: pending `fix: 恢复连线贴边`
- worktree: 提交前等待选择性暂存与 staged diff 检查。
