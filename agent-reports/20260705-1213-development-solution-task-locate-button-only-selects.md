# 恢复任务清单定位按钮切换画布视图
## 负责 Agent
开发 Agent
## Root Cause
`RightDrawer` 中任务条目的 `onLocate` 原本只调用 `onSelectNode`，没有执行任何 viewport 操作。补充 viewport 操作后又发现 action 容器默认 `pointer-events: none`，在 active 但非 hover/focus-visible 状态下点击定位图标会落到外层任务项，仍然只触发选择。
## 调研过程
1. 检查 `RightDrawer.tsx`，确认 `onLocate={() => onSelectNode(...)}` 只选中任务。
2. 增加 `locateNode` 后浏览器验证发现节点仍不可见，说明点击没有进入定位逻辑。
3. 使用 `elementFromPoint` 检查定位按钮中心点，发现命中 `.kit-task-item.is-active`，action 容器和按钮 `pointer-events` 为 `none`。
4. 验证全局画布定位按钮可正常移动 viewport，说明 React Flow 实例有效。
5. 将任务项外层从原生 `button` 改为 `div role="button"`，内部 action 改为真正的 `button`，并为 active/focus-within 状态开启 action pointer events。
6. 浏览器复测：点击定位按钮后 viewport 从 `translate(-669.127px, 310.178px) scale(0.723559)` 变为 `translate(418.161px, 228.261px) scale(0.723559)`，目标节点 `visibleInCanvas=true`。
## 可选方案
1. 只把 `onLocate` 从 select 改成 fitView。无法解决点击命中外层任务项的问题。
2. 让整个任务项点击都定位画布。会改变任务列表的选中行为，不符合“定位按钮”这个局部操作。
3. 分离任务项和 action button 语义，定位按钮独立触发 `locateNode`，并用 `setCenter` 移动画布 viewport。
## 推荐方案
采用方案 3。任务项点击仍只负责选择；定位 action 独立负责选中并切换画布视图，交互边界清晰。
## 实施步骤
1. `RightDrawer` 增加 `onLocateNode` prop，定位按钮接入该回调。
2. `App.tsx` 增加 `locateNode`，先选中节点，再用 `flowInstanceRef.current.setCenter(...)` 移动画布 viewport。
3. `TaskItem` 外层改为 `div role="button"` 并保留 Enter/Space 键盘选择。
4. `TaskItem` 内部运行/定位 action 改为 `button type="button"`，阻止冒泡。
5. CSS 为 `.kit-task-item.is-active` 和 `:focus-within` 状态开启 action 的 opacity 与 pointer events。
## 风险与回滚
风险：任务项语义从原生 button 改为 role button，需要保留键盘 Enter/Space 行为。已在组件内处理。回滚时可恢复外层 button 和旧 `onLocate`，但会重新出现定位按钮只选中的问题。
## 验证方式
1. Browser：定位按钮中心点命中 SVG/Button，不再命中外层任务项。
2. Browser：目标节点离屏时点击定位按钮，viewport transform 变化，目标节点回到可视画布内。
3. Browser：任务项 active 状态仍正常，控制台无 error/warn。
4. `npm run typecheck -- --pretty false`
5. `npm run build`
6. `npm run test:mcp`
7. 插件校验通过。
8. `codex plugin add canvasight@canvasight-local` 通过。
