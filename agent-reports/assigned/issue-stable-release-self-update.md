---
schema_version: 1
report_id: issue-stable-release-self-update
report_type: issue
status: assigned
owner: Development Agent
created_by: Main Thread
priority: high
version: 3
agent_id: /root/development_agent
thread_id: null
created_at: 2026-07-13T12:04:53Z
updated_at: 2026-07-13T12:18:15Z
depends_on: []
related_files:
  - plugins/canvasight/skills/canvasight-update/SKILL.md
  - plugins/canvasight/scripts/update-canvasight.mjs
  - plugins/canvasight/scripts/prepare-release.mjs
  - .github/workflows/canvasight-release.yml
  - README.md
  - AGENTS.md
solution_report: agent-reports/resolved/solution-stable-release-self-update.md
verification_status: not_started
verification_evidence:
  - Local macOS updater, build, MCP, distribution, plugin, and Skill gates pass.
  - Windows, macOS, and Linux release matrix awaits the v0.4.11 tag.
---

# Canvasight 缺少正式 Release 与自然语言自更新链路

## TL;DR

建设完整插件 Release、`stable` 发布和自然语言检查/更新能力，使用户升级整个插件快照，同时绝不修改用户项目数据。

## 发现者

Main Thread

## 提交 Agent

Main Thread

## 建议交接 Agent

Development Agent

## 问题描述

当前仓库只有开发分支和本地 marketplace，尚无正式 GitHub Release、稳定更新分支或插件内更新 Skill。旧用户不能用自然语言安全检查并安装完整新版本。

## 现象

- GitHub 尚无正式 Release 和 `stable` 分支。
- 插件没有 `canvasight-update` Skill 与更新执行脚本。
- 发布流程没有同时验证网页、MCP bundle、Skills 和无依赖插件分发。

## 复现方式

1. 查看 GitHub Release 和远程分支。
2. 检查插件 Skills、package scripts 与工作流。
3. 尝试说“检查 Canvasight 更新”或“更新 Canvasight”。

## 影响范围

正式发布、旧用户升级、插件完整快照安装、失败回滚、跨平台验证和用户文档。

## 证据

- 当前正式版本为 `0.4.10+codex.20260713151335`。
- `gh release list --repo Niall-Young/Canvasight` 无结果。
- 远程只有 `main`。

## 初步归因

早期 repo-local 安装模式尚未升级为 Release 驱动的稳定分发模型。

## 交付给哪个 Agent

Development Agent

## 需要回答的问题

- 如何保证最新版检查零修改？
- 如何保护本地 checkout、自定义 fork 和所有用户数据？
- 如何在 marketplace 已切换后可靠恢复旧来源？
- 如何保证 Release、插件 manifest 与 `stable` 一致？

## 相关文件

- `plugins/canvasight/skills/canvasight-update/`
- `plugins/canvasight/scripts/`
- `.github/workflows/`
- `README.md`
- `AGENTS.md`

## 期望结果

用户可检查更新或安装最新正式完整插件；最新版、开发版、本地来源、自定义 fork 和失败路径均安全停止或恢复；只有真实安装后提示用户自行重启 Codex。

## Closure Criteria

- [x] 更新 Skill、主 Skill 路由和脚本完成
- [ ] Release 准备脚本、三系统验证、Release 与 `stable` 推进完成
- [x] 最新版零修改、成功升级、来源保护与失败回滚测试通过
- [x] 用户数据与本地 checkout 不被访问或修改
- [x] 中英文 README 与工程规范同步
- [ ] 完整 `v0.4.11` 插件已发布

## 当前状态

assigned

## 处理结果

实现与本地门禁完成，等待 tag 触发三系统 Release 验证和正式发布。

## 修改文件

- 见 `agent-reports/resolved/solution-stable-release-self-update.md`。

## 验证方式

- `npm run test:update`：15/15。
- build、MCP smoke、clean distribution、plugin validation、Skill validation：通过。

## 后续风险

Release 发布和 `stable` 推进必须在全部三系统验证通过后执行；发布前 issue 保持 assigned。
