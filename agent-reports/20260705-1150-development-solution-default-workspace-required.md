# 自动创建默认 Canvasight Workspace
## 负责 Agent
开发 Agent
## Root Cause
Canvasight 插件化后仍保留了客户端时期的“选择/输入项目路径”入口作为无路径 fallback。MCP `open_canvasight` 不传 `projectPath` 时 session 的 `projectPath` 为 `null`，前端因此进入路径输入空状态。直接 Vite dev server 还缺少 `/api`，即使前端尝试默认路径，也只能落到空白内存文档，读不到已有 `.scatter`。
## 调研过程
1. 检查 `App.tsx` 初始化流程，确认只有 `session.projectPath` 存在时才会打开 workspace。
2. 检查 MCP server，确认 `openProject` 已经能创建 `.scatter` 和 `scatter.json`，但 `createSession` 不会为无路径 session 补默认路径。
3. 检查 `vite.config.ts`，确认 dev server 只提供 Vite 静态服务，没有 Canvasight API。
4. 浏览器验证旧行为：空状态表单消失后，如果没有 API，只能显示空画布，无法读取当前 `.scatter` 里的节点。
## 可选方案
1. 只在前端写死默认路径。改动小，但 dev 入口无法真实读写 `.scatter`，附件和保存也会失败。
2. 只要求调用方始终传 `projectPath`。不符合用户“不需要用户来管”的要求，也容易再次出现空状态。
3. MCP server 和 Vite dev server 都提供默认 workspace：MCP 无参自动创建 `.scatter`；Vite dev 入口提供本地 API，直接读取当前 repo `.scatter`。
## 推荐方案
采用方案 3。MCP 入口和本地开发入口都不再依赖用户填路径；默认路径优先使用显式环境变量和当前 workspace，repo-local 开发时 fallback 到 Canvasight 仓库根目录。
## 实施步骤
1. MCP server 增加默认项目路径解析，`open_canvasight({})` 自动绑定并创建默认 workspace。
2. `toolOpenCanvasight` 打开 session 时立即调用 `openProject`，确保 `.scatter/scatter.json` 真实落盘。
3. 前端在 session 无路径或 session API 不可用时使用 `VITE_CANVASIGHT_DEFAULT_PROJECT_PATH` 自动打开 workspace。
4. Vite dev server 增加 Canvasight 本地 API 中间件，覆盖 session、open-project、document、attachments、asset 和 run 基础路由。
5. MCP smoke 增加无 `projectPath` 调用的自动创建断言。
## 风险与回滚
风险：Vite dev API 与 MCP server API 存在少量重复逻辑，后续改协议时需要同步。回滚时可移除 dev API 中间件、前端默认路径 fallback 和 MCP 默认路径解析，恢复手动路径输入 fallback。
## 验证方式
1. `npm run typecheck -- --pretty false`
2. `npm run build`
3. `npm run test:mcp`
4. 插件校验通过。
5. `codex plugin add canvasight@canvasight-local` 通过。
6. `codex plugin list` 确认 repo-local 插件路径。
7. 浏览器验证 `http://127.0.0.1:5173/`：不再显示路径输入；渲染 React Flow；读取当前 `.scatter` 的 6 个节点和 5 条边；无控制台 error/warn。
