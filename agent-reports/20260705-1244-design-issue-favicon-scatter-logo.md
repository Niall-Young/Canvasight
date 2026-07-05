# Canvasight 网页 favicon 没有使用 Scatter logo

## 发现者
设计 Agent

## 现象
Canvasight 网页入口没有显式 favicon 声明，浏览器会使用默认图标或空图标，和用户要求的 Scatter 品牌识别不一致。

## 影响范围
影响 Canvasight 网页插件在浏览器标签页、收藏、任务切换等系统 UI 中的品牌展示。

## 复现步骤
1. 打开 Canvasight 插件网页。
2. 检查页面 `<head>` 中是否有 favicon 声明。
3. 查看浏览器是否请求 Scatter logo favicon。

## 证据
`plugins/canvasight/index.html` 原本只包含字符集、viewport 和 title，没有 favicon 相关 `<link>`。

## 初步归因
从 Electron 客户端迁移到 Vite 网页插件时，应用图标资源没有被接入网页 favicon 入口。

## 交付给哪个 Agent
开发 Agent

## 需要回答的问题
如何复用原 Scatter logo，并让 Vite 开发服务和构建产物都能稳定提供 favicon。
