# 集成摘要

## 本轮目标
修复“运行项目”启动的 `127.0.0.1:5173` dev server 仍随 Codex thread 归档而停止的问题。

## 已完成
- 新增 persistent dev server manager。
- `npm run dev` 改为启动或复用 detached Vite dev server。
- 新增 `npm run dev:stop`、`npm run dev:status`、`npm run dev:foreground`。
- 新增 `npm run test:dev-server` 覆盖 dev server 生命周期。
- README 和 AGENTS 已同步中英文/命令说明。

## 未解决
- 机器重启或用户手动 `npm run dev:stop` 后，旧 `5173` 仍需重新 `npm run dev`。

## 下一轮分派
- 测试监督 Agent 继续关注真实浏览器刷新后的可访问性。
- 客服 Agent 后续维护“插件 daemon”和“dev server”两条入口的差异说明。
