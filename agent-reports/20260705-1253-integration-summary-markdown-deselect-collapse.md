# Markdown 取消选择后面板状态集成总结

## 本轮目标
修复右侧 Markdown 面板在取消节点选择后清空且无法收起的问题。

## 已解决
- 新增独立 `markdownNodeId` 保存预览目标。
- Markdown 生成改为使用预览目标节点，而不是当前画布选中节点。
- 右上 Markdown 按钮在面板打开时不再因为无选中节点而禁用。
- 运行节点后会把运行节点设为 Markdown 预览目标。
- Markdown 下载文件名优先使用预览节点标题。

## 未解决
- 暂无。

## 下一轮分派
- 测试监督 Agent：执行类型检查、构建、MCP smoke 和浏览器交互复现验证。

## 验收记录
- `npm run typecheck -- --pretty false` 通过。
- `npm run build` 通过。
- `npm run test:mcp` 通过。
- 插件校验脚本通过。
- 浏览器复现验证通过：
  - 初始加载 `Canvasight`，画布中有 6 个任务节点。
  - 选中第一个节点后 Markdown 按钮可用。
  - 打开 Markdown 后，drawer 为 `right-drawer is-markdown is-open`，源码内容长度为 828。
  - 点击画布空白取消选择后，选中节点数为 0，但 Markdown 内容长度仍为 828，按钮 `disabled=false`，`aria-pressed=true`。
  - 再点击 Markdown 按钮后，drawer 为 `right-drawer is-markdown is-collapsed`，`aria-pressed=false`。
  - 浏览器控制台 warn/error 为空。
