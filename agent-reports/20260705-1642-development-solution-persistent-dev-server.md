# 持久 dev server 方案

## 负责 Agent
开发 Agent

## Root Cause
`npm run dev` 直接运行前台 Vite。Codex thread 归档会停止该前台进程，因此 `127.0.0.1:5173` 断开。

## 调研过程
- 检查 `plugins/canvasight/package.json`，确认 `dev` 脚本仍是 `vite --host 127.0.0.1`。
- 用户截图 URL 为 `127.0.0.1:5173`，对应 Vite dev server。
- 这条路径没有走上一轮实现的 MCP project daemon。

## 可选方案
- 要求用户使用插件 daemon URL：不能解决“运行项目”入口。
- 保持前台 Vite：仍会被 thread 生命周期影响。
- 增加 detached dev server manager：`npm run dev` 启动或复用后台 Vite，并提供 `npm run dev:stop` 清理。

## 推荐方案
采用 detached dev server manager。

## 实施步骤
1. 新增 `scripts/dev-server.mjs` 管理 Vite 进程。
2. `npm run dev` 改为启动或复用持久 dev server。
3. 新增 `npm run dev:stop`、`npm run dev:status`、`npm run dev:foreground`。
4. 新增 `test:dev-server` 验证启动命令退出后 dev server 仍可访问。
5. README 和 AGENTS 同步说明 `npm run dev` 的新生命周期。

## 风险与回滚
- 风险：5173 被其他项目占用。脚本会检测是否是 Canvasight 页面，否则启动失败并提示。
- 风险：隐藏 Vite 日志影响调试。保留 `npm run dev:foreground`。
- 回滚：恢复 `dev` 为前台 Vite，但会重新出现 thread 归档后 5173 停止。

## 验证方式
- `npm run test:dev-server`
- `npm run typecheck`
- `npm run build`
- `git diff --check`
