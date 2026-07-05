# 集成汇总
## 本轮目标
Canvasight 打开后自动创建并进入默认 workspace，不再要求用户手动填写本地项目路径。
## 已解决
- MCP `open_canvasight({})` 现在会自动选择默认项目路径并创建 `.scatter/scatter.json`。
- 前端初始化在 session 无路径时会使用默认路径自动打开 workspace。
- Vite dev server 增加本地 Canvasight API，直接打开 `http://127.0.0.1:5173/` 也能读取和保存 `.scatter`。
- 浏览器验证 5173 已自动加载当前 repo 下 `.scatter` 的 6 个节点和 5 条边，路径输入空状态不再出现。
## 未解决
- dev API 与 MCP server 有重复实现，后续如果扩展 API，需要同步维护。
## 验证记录
- `npm run typecheck -- --pretty false`：通过。
- `npm run build`：通过。
- `npm run test:mcp`：通过。
- 插件校验：通过。
- `codex plugin add canvasight@canvasight-local`：通过。
- `codex plugin list`：确认 `canvasight@canvasight-local` 指向 `/Users/niallyoung/Desktop/Canvasight/plugins/canvasight`。
- Browser：`http://127.0.0.1:5173/` 标题为 Canvasight，`hasProjectInput=false`，`hasReactFlow=true`，`nodeCount=6`，`edgeCount=5`，控制台无 error/warn。
## 下一轮分派
无新的阻断问题。若继续发现插件入口和 dev 入口行为差异，应交付开发 Agent 把重复 API 抽为共享模块。
