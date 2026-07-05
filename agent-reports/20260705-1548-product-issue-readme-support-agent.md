# README 缺少客服 Agent 持续维护职责

## 发现者
产品 Agent

## 现象
Canvasight 功能、安装方式、MCP 工具和项目模型持续变化，但 README 之前仍偏开发说明，没有明确由专门角色维护用户视角文档，也没有中英文切换结构。

## 影响范围
- 新用户不了解 Canvasight 主要用来做什么。
- 功能更新后 README 容易滞后。
- 中文和英文读者需要分开阅读入口。

## 复现步骤
1. 打开 README。
2. 只能看到简短英文说明、开发命令和插件工具列表。
3. 找不到完整中文说明、英文说明切换、产品用途、功能介绍和常见问题。

## 证据
- README 原结构只有 `Development`、`Plugin` 和 MCP tools。
- AGENTS.md 原角色规则没有客服 Agent 或 README 维护职责。

## 初步归因
插件实现进展快，但文档职责仍分散在主线程，没有专门面向用户解释产品价值和使用方式的 Agent。

## 交付给哪个 Agent
Customer Support Agent

## 需要回答的问题
- README 应采用什么中英文切换结构？
- 哪些更新必须触发 README 审查？
- README 必须覆盖哪些用户支持内容？
