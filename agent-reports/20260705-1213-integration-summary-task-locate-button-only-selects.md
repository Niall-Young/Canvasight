# 集成汇总
## 本轮目标
让任务清单条目里的定位按钮真正切换画布视图到对应节点，而不是只选中任务。
## 已解决
- 已确认原 `onLocate` 只调用选中逻辑，没有 viewport 操作。
- 已补充 `locateNode`，通过 React Flow `setCenter` 将目标节点移动到可视区域。
- 已修复任务项 action 命中问题：active/focus-within 状态下 action 容器开启 pointer events。
- 已把任务项内部 action 改为真实按钮，外层保留 role button 和键盘选择行为。
- 浏览器验证通过：离屏节点点击定位后回到画布可视区域。
## 未解决
- 无阻断问题。
## 验证记录
- Browser：点击前目标节点 `visibleInCanvas=false`，点击后 `visibleInCanvas=true`。
- Browser：viewport transform 从 `translate(-669.127px, 310.178px) scale(0.723559)` 变为 `translate(418.161px, 228.261px) scale(0.723559)`。
- Browser：控制台无 error/warn。
- `npm run typecheck -- --pretty false`：通过。
- `npm run build`：通过。
- `npm run test:mcp`：通过。
- 插件校验：通过。
- `codex plugin add canvasight@canvasight-local`：通过。
- `codex plugin list`：确认 `canvasight@canvasight-local` 指向 `/Users/niallyoung/Desktop/Canvasight/plugins/canvasight`。
## 下一轮分派
无新的 agent 分派。若后续发现任务项键盘或 hover 行为细节不一致，由测试监督 Agent 继续拆分交付给开发 Agent。
