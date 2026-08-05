---
status: resolved
report_type: integration-summary
owner: main-thread
created_by: main-thread
priority: high
created_at: 2026-08-05 18:22
updated_at: 2026-08-05 18:22
related_files:
  - AGENTS.md
---

# 固化 XYFlow Edge 端点与层级防回归规则

## 本轮目标

- 把本轮 Edge 悬空回归的真实根因、禁止方案和浏览器验收条件明确写入 `AGENTS.md`。

## Agent 状态

- Product Agent：席位受并发上限限制；Main Thread 确认不涉及产品范围变化。
- Design Agent：审查几何贴边与按钮遮挡的职责分离。
- Development Agent：审查实现规则、禁止方案和可执行措辞。
- Test Supervisor Agent：提供真实 DOM 数值与浏览器验收门槛。
- Customer Support Agent：席位受并发上限限制；Main Thread 执行 README 门禁。
- Design Standards Expert：席位受并发上限限制；本轮不改变产品设计基线。
- Development Standards Lead：席位受并发上限限制；Main Thread 代行并更新其所有文件 `AGENTS.md`。
- Project Management Agent：席位受并发上限限制；Main Thread 执行选择性暂存和提交检查。
- Skill Expert Agent：席位受并发上限限制；无 Skill 变化。

## Agent 输入

- Design Agent：端点只负责贴边，按钮遮挡只由层级处理。
- Development Agent：明确当前 20 px Handle 的 inward 半宽换算，禁止 raw/direct 与 outward inverse。
- Test Supervisor Agent：要求真实浏览器两端 gap `<= 0.5 CSS px`，并保留 hit-test、Edge 点击、Group 内 Edge 与拖线回归。

## 报告状态变更

- 新增本 integration summary。

## 已解决

- `AGENTS.md` 明确记录当前 XYFlow 坐标语义与 `left: x + 10` / `right: x - 10`。
- 明确禁止用端点外移、禁用 Edge pointer events 或提高 Group 层级处理按钮遮挡。
- 明确真实浏览器几何与交互验收，静态断言或截图不能单独满足门禁。

## 未解决

- 无。

## 风险

- XYFlow 或 Handle 尺寸升级时必须同步换算并重新执行浏览器验收。

## 下一轮分派

- 无。

## 已完成改动

- 在根 `AGENTS.md` 的 Implementation Standards 中新增三条 Edge 防回归规则。

## 处理结果

已完成。

## 修改文件

- `AGENTS.md`
- `ROSTER.md`
- `agent-reports/QUEUE.md`
- `agent-reports/resolved/20260805-1822-integration-summary.md`

## 验证方式

- 逐条核对规则与 `ScatterEdge.tsx`、`app.css` 和本轮真实浏览器证据。
- `git diff --check`。
- Good README 影响门禁。

## 验证记录

- 当前实现：20 px Handle，左 `x + 10`、右 `x - 10`。
- 当前层级：nodes `auto`，Group `0`，Edge SVG `1`，Task/Asset `2`。
- 浏览器门槛写为两端绝对 gap `<= 0.5 CSS px`。
- README: unchanged；本轮只新增内部开发与验收规范，不改变用户能力、命令或工作流。

## 回写状态

- `agent-reports/QUEUE.md` 已更新。
- Agent Team role 状态已回写 `ROSTER.md`。

## 未解决 / 后续风险

- 预先存在的未跟踪 `plugins/canvasight/dist/favicon 2.png` 与 `index 2.html` 保持未修改且不进入提交。

## Git 状态

- branch: `main`
- baseline: `bd4c6a9cf4508df4ef85ab0d0eee08972b3acf4d`
- commit: pending `docs: 固化连线几何规则`
- worktree: 提交前等待选择性暂存与 staged diff 检查。
