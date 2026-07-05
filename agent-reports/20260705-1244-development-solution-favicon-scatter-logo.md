# 使用 Scatter logo 作为 Canvasight favicon

## 负责 Agent
开发 Agent

## Root Cause
Canvasight 网页插件缺少公开 favicon 资源和 HTML 入口声明，浏览器没有可解析的 Scatter logo 图标。

## 调研过程
1. 在当前 Canvasight 工作区搜索 `favicon`、`logo`、`scatter`、`ico` 等资源，未找到独立 Scatter logo。
2. 从原 Scatter 仓库临时浅克隆，定位到 `resources/icons/app-icon-256.png`、`resources/app-icon.png` 和多尺寸 iconset。
3. 确认 `app-icon-256.png` 是 Scatter 紫蓝节点连线 logo，适合作为网页 favicon。

## 可选方案
1. 使用原仓库 `resources/icons/app-icon-256.png` 作为 `public/favicon.png`。
2. 使用 `app-icon.ico` 作为传统 favicon。
3. 重新绘制 SVG favicon。

## 推荐方案
采用方案 1。PNG 资源直接来自原 Scatter logo，Vite 会原样从 `public/` 服务并复制到 `dist/`，实现成本低且和原客户端图标保持一致。

## 实施步骤
1. 创建 `plugins/canvasight/public/`。
2. 复制原 Scatter `app-icon-256.png` 为 `plugins/canvasight/public/favicon.png`。
3. 在 `plugins/canvasight/index.html` 增加 `rel="icon"` 和 `rel="apple-touch-icon"` 声明。
4. 运行类型检查、构建、MCP smoke、插件校验和浏览器 favicon 请求验证。

## 风险与回滚
风险较低。若浏览器缓存旧 favicon，可刷新或重新打开标签页。回滚时删除 `public/favicon.png` 并移除 HTML 中两行 link 声明即可。

## 验证方式
1. `npm run typecheck -- --pretty false`
2. `npm run build`
3. `npm run test:mcp`
4. 插件校验脚本
5. 浏览器中检查 `<link rel="icon">` 和 `/favicon.png` 响应。
