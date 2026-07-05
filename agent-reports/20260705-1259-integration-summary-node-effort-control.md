# 节点思考深度控件移除集成总结

## 本轮目标
移除真实任务节点里的思考深度下拉控件。

## 已解决
- 删除 `TaskNode` 的 effort 下拉 UI。
- 删除 `TaskNode` 内部 effort 菜单状态和相关 import。
- 保留节点附件按钮和 Plan mode 开关。
- 保留 shared 类型、默认 effort 和 UI kit 组件，避免破坏数据兼容。

## 未解决
- 暂无。

## 下一轮分派
- 测试监督 Agent：执行类型检查、构建、MCP smoke、插件校验和浏览器可视验证。

## 验收记录
- `npm run typecheck -- --pretty false` 通过。
- `npm run build` 通过，构建模块数从 715 降到 714，真实节点路径不再打入 removed effort menu 依赖。
- `npm run test:mcp` 通过。
- 插件校验脚本通过。
- 浏览器可视验证通过：
  - 页面标题为 `Canvasight`，画布正常渲染。
  - 选中任务节点后，`.task-node-effort-picker` 数量为 0。
  - `.task-node-effort-menu` 数量为 0。
  - 第一个任务节点文本中不包含 `极高` 或 `Extra high`。
  - 第一个任务节点仍包含 `计划模式`。
  - footer 文本为 `添加附件计划模式`。
  - 浏览器控制台 warn/error 为空。
