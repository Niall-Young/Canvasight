# 客服 Agent 与双语 README 方案

## 负责 Agent
Customer Support Agent

## Root Cause
README 缺少稳定的信息架构和明确维护角色，导致产品用途、功能、安装、使用和 FAQ 容易随代码迭代脱节。

## 调研过程
- 检查 README 当前内容，确认只有简短插件说明和命令。
- 检查 AGENTS.md 当前角色规则，确认没有 README 专职角色。
- 汇总当前 Canvasight 能力：网页画布、节点、连接、Page、附件、Markdown、Chat/Plan/Goal、最近项目恢复和 MCP tools。

## 可选方案
1. 拆分 `README.zh.md` 和 `README.en.md`：文件清楚，但维护两个文件容易不同步。
2. 一个 README 内做中文/English 锚点切换：轻量、直接，适合当前 repo-local 插件。
3. 引入文档站点：过重，当前不需要。

## 推荐方案
采用方案 2。README 顶部提供 `中文 | English` 切换锚点，两个章节镜像覆盖产品用途、核心功能、基础用法、插件安装、MCP tools、数据存储、开发命令、插件校验和 FAQ。

## 实施步骤
1. 在 AGENTS.md 增加 Customer Support Agent 职责。
2. 重写 README 为中英文双语切换结构。
3. 后续每次用户可见功能、命令、安装、工作流或 troubleshooting 变化时，由 Customer Support Agent 判断是否更新 README。

## 风险与回滚
- 风险：中英文内容长期不同步。通过 Customer Support Agent 职责约束同次更新。
- 风险：README 过长。保持支持型信息架构，避免实现细节膨胀。
- 回滚：恢复原 README 和移除 AGENTS.md 中的客服角色。

## 验证方式
- `git diff --check`
- 人工检查 README 锚点、章节完整性和中英文内容一致性。
