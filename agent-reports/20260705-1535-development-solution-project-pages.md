# 项目 Page 工作区方案

## 负责 Agent
开发 Agent

## Root Cause
Canvasight 的持久化和前端 store 都以项目为唯一画布边界。根级 `nodes/edges` 既是存储结构也是运行上下文，无法表达项目内多个隔离工作区。

## 调研过程
- 检查 MCP server 的 `normalizeScatterDocument` 和 `writeScatterDocument`，确认 v1 文档可扩展字段。
- 检查 Zustand store，确认 undo/redo、selection、drawer 都按单画布状态工作。
- 检查 App 保存/加载路径，确认 `toDocument()` 是保存投影入口。
- 检查 UI 样式，确认左上角适合放紧凑浮动 PageSwitcher，不恢复旧左侧项目栏。

## 可选方案
1. 升级到 `.scatter` v2：结构清晰，但会破坏当前 v1 兼容。
2. 每个 page 写独立文件：隔离强，但会扩大 MCP 与附件路径复杂度。
3. 在 v1 内新增 `pages` 和 `activePageId`，同时保留根级 active page 投影。

## 推荐方案
采用方案 3。`pages` 作为 canonical 多画布数据，根级 `viewport/nodes/edges` 始终同步当前 active page，兼容旧文件和旧消费者。

## 实施步骤
1. 扩展共享类型 `ScatterPage`、`ScatterDocument.pages`、`activePageId`。
2. MCP server 读取旧文件时把根级画布 hydrate 成默认 page，保存时保留 active page 投影。
3. Store 增加 `pages/activePageId`、page 切换/新增/重命名/删除，并在切 page 时清空跨页 history 和 selection。
4. App 新增左上角 PageSwitcher：当前 page 下拉、新建按钮、更多菜单重命名/删除。
5. 保存 debounce 序列化完整 pages，运行 Markdown 继续只使用当前 page 的 `nodes/edges`。
6. MCP smoke test 增加 pages 兼容断言，浏览器验证 page 隔离交互。

## 风险与回滚
- 风险：旧文件没有 pages。已通过 normalize 自动迁移成默认 Page 1。
- 风险：附件上传期间切 page。store 已按 node 所属 page 写回附件 metadata。
- 风险：undo/redo 跨页串状态。切 page 时重置 history。
- 回滚：移除 PageSwitcher 和 store pages 逻辑，保留根级 `nodes/edges` 即可回到单画布模型。

## 验证方式
- `npm run typecheck`
- `npm run test:mcp`
- `npm run build`
- 插件校验脚本
- 浏览器验证：新建 Page、在 Page 2 添加节点、切回 Page 1 和 Page 2，确认节点/边隔离。
