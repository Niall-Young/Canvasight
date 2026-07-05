# Dev server 仍绑定启动它的 Codex thread

## 发现者
用户 / 产品 Agent

## 现象
用户在新 Codex thread 输入“运行项目”后打开 `http://127.0.0.1:5173/`，归档该 thread 后刷新页面出现 `ERR_CONNECTION_REFUSED`。

## 影响范围
- 本地开发预览 URL `127.0.0.1:5173` 在 thread 归档后失效。
- 用户会误以为项目级常驻修复没有生效。
- “运行项目”这一常用入口仍要求用户保留启动 thread。

## 复现步骤
1. 在新 Codex thread 输入“运行项目”。
2. Agent 启动 `npm run dev`，浏览器打开 `http://127.0.0.1:5173/`。
3. 归档该 thread。
4. 刷新浏览器页面。

## 证据
- 截图显示当前 URL 是 `127.0.0.1:5173`，这是 Vite dev server，不是插件 daemon URL。
- 原 `package.json` 中 `npm run dev` 是前台 `vite --host 127.0.0.1`。

## 初步归因
插件 daemon 已独立于 MCP thread，但开发入口 `npm run dev` 仍由 thread 前台进程托管。

## 交付给哪个 Agent
开发 Agent、测试监督 Agent、客服 Agent

## 需要回答的问题
- `npm run dev` 是否应改成项目级持久 dev server？
- 如何提供明确的停止入口，避免误杀其他 Vite 进程？
- README/AGENTS 是否要区分插件 daemon 和本地 dev server？
