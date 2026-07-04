# Canvasight 产品审查问题报告

## 发现者
产品 Agent

## 现象
初始迁入的 Scatter 客户端代码仍包含 Electron 桌面壳概念，包括虚拟点击发送链路、侧边项目列表、启动页、权限和成就等客户端功能。

## 影响范围
如果不裁剪，会偏离 Canvasight 插件目标：网页画布操作，Run 后通过 MCP 返回当前 Codex 线程。

## 复现步骤
1. 检查迁入前的 Scatter `App.tsx`。
2. 搜索 `runAssistant`、`accessibility`、`Sidebar`、`splash`、`translucentBackground`。

## 证据
产品 Agent 报告指出旧入口中存在 `window.scatter.runAssistant`、Accessibility 权限检查、Sidebar recent projects 和启动页分支。

## 初步归因
上游 Scatter 是 Electron 客户端，迁入时需要显式替换运行入口和信息架构。

## 交付给哪个 Agent
主线程集成负责人、设计 Agent、开发 Agent

## 需要回答的问题
- 哪些组件只保留源码、不进入渲染路径？
- 项目路径入口如何替代左侧 recent project IA？
- 如何保留视觉语言但去掉背景模糊、玻璃态和启动页？
