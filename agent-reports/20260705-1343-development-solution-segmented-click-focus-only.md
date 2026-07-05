# 修复 Codex 模式分段控件点击只聚焦不切换
## 负责 Agent
开发 Agent
## Root Cause
`TaskNode` 从 Switch 切换为 Segmented 后，失去了旧 Switch 对节点内控件事件的隔离。React Flow 会监听节点内 pointer/mouse 事件用于选择、拖拽、框选等画布交互，导致分段按钮在真实点击路径下只表现为 focus/active，而没有稳定提交状态更新。
## 调研过程
对比 `src/components/ui/switch.tsx` 和 `src/components/ui/segmented.tsx` 后确认：Switch 在容器和 Root 上都执行 `event.stopPropagation()`；SegmentedItem 只是普通 button。Playwright 验证也显示点击后只有 active 状态，无 selected 状态变化。
## 可选方案
1. 只在 `TaskNode` 的三段控件外层增加 pointer/mouse/click 事件阻断。
2. 在通用 `SegmentedItem` 内统一阻断 canvas 事件，并继续调用原始 `onClick`。
3. 给 React Flow 增加更多 `nodrag/nopan` 选择器配置。
## 推荐方案
采用方案 2。Segmented 本身就是交互控件，统一在 UI kit 组件内阻断 pointer/mouse/click 冒泡，能同时保护节点内和 drawer 内使用场景，不需要每个调用点重复实现。
## 实施步骤
1. 在 `SegmentedItem` 中显式处理 `onPointerDown`、`onMouseDown`、`onClick`。
2. 事件处理先 `stopPropagation()`，再调用调用方传入的 handler。
3. 保留 `type="button"`、`role="tab"`、`aria-selected` 和现有 class 结构。
## 风险与回滚
风险是右侧 drawer 的 Segmented 点击事件也会停止冒泡；该控件本身不依赖父级 click bubbling，影响可控。回滚方式是把事件阻断移回 `TaskNode` 局部。
## 验证方式
重新运行 TypeScript、构建、MCP smoke；在浏览器中点击 `Plan` 和 `Goal`，确认 `.scatter/scatter.json`、Markdown 预览和 MCP Run payload 均同步对应模式。
