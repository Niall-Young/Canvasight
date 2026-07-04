# Canvasight 集成总结

## 已处理
- 已创建 repo-local 插件骨架：`plugins/canvasight`。
- 已迁入 Scatter renderer 组件、样式、assets、store 和 Markdown 逻辑。
- 已新增网页 API client：`plugins/canvasight/src/lib/canvasightApi.ts`。
- 已替换 `App.tsx`，当前渲染路径不再使用 Sidebar、启动页、成就墙、设置弹窗、Accessibility 权限或虚拟点击发送链路。
- 已实现 MCP server：`open_canvasight`、`await_canvasight_run`、`close_canvasight`。
- 已保持 `.scatter/scatter.json` v1 和 `.scatter/assets` 兼容，并限制 asset API 只能读取 `.scatter/assets` 下的文件。
- 已注册 repo-local marketplace：`.agents/plugins/marketplace.json`。

## 验证结果
- 插件校验通过：`validate_plugin.py /Users/niallyoung/Desktop/Canvasight/plugins/canvasight`。
- 构建通过：`npm run build`。
- MCP smoke 通过：`npm run test:mcp`。
- Codex 插件解析通过：`canvasight@canvasight-local` 显示为 installed, enabled，路径为 `/Users/niallyoung/Desktop/Canvasight/plugins/canvasight`。
- Browser 视觉/交互验证通过：没有左侧项目列表、启动页、背景模糊或玻璃态；桌面和 390px 移动视口无横向溢出；Run payload 可由 `await_canvasight_run` 返回 Markdown 和结构化数据。
- 当前线程工具发现 P1 已分析：repo-local plugin、cache、MCP `tools/list` 均有效；当前已打开线程不会热刷新新安装 MCP tools。README/AGENTS 已补充“安装或重装后新开线程/重载再验收”的口径。

## 未解决
- Vite 仍提示主 JS chunk 大于 500 kB。当前原因是保留 Scatter 组件与 assets 体系，属于 v1 可接受的体积风险，不阻断插件化交付。
- Browser MCP 的 `domSnapshot()` 在本环境返回 `incrementalAriaSnapshot is not a function`，本轮改用浏览器 evaluate、控制台检查和截图完成视觉验证。
- 当前线程的 `tool_search` 仍看不到 Canvasight MCP tools，这是 Codex 会话刷新边界；最终端到端工具发现需要在新线程或重载后的线程里验收。

## 下一轮分派
- 新线程/重载线程：确认 `open_canvasight`、`await_canvasight_run`、`close_canvasight` 可见。
