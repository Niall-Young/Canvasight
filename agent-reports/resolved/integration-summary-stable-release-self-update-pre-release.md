---
schema_version: 1
report_id: integration-summary-stable-release-self-update-pre-release
report_type: integration-summary
status: resolved
owner: Main Thread
created_by: Main Thread
priority: high
version: 2
agent_id: /root
thread_id: null
created_at: 2026-07-13T12:18:15Z
updated_at: 2026-07-13T12:30:11Z
depends_on:
  - issue-stable-release-self-update
  - solution-stable-release-self-update
related_files:
  - .github/workflows/canvasight-release.yml
  - plugins/canvasight/scripts/update-canvasight.mjs
  - plugins/canvasight/scripts/prepare-release.mjs
  - plugins/canvasight/skills/canvasight-update/SKILL.md
  - plugins/canvasight/tests/update-canvasight-smoke.mjs
  - README.md
  - AGENTS.md
verification_status: passed
verification_evidence:
  - All local macOS implementation and distribution gates pass.
  - First cross-platform run failed safely before publishing; deterministic build and CRLF fixes await retry.
---

# Canvasight 完整插件更新预发布集成总结

## 本轮目标

- 完成 `v0.4.11` 自然语言整包更新机制、稳定发布通道、失败恢复、测试和双语文档。
- 在正式 tag 前冻结并提交已通过本地门禁的范围。

## Agent 状态

- Product Agent：完成更新边界、来源判断、版本顺序与回滚门槛审查。
- Design Agent：本轮不改变 UI 或交互，由 Main Thread 检查现有界面 diff 为零。
- Development Agent：完成 updater、Release 准备脚本、测试和 workflow。
- Test Supervisor Agent：完成 15 项 updater、build、MCP、distribution、plugin 和 Skill 验证。
- Customer Support Agent：完成 README 中英文安装、更新、数据与首次升级说明。
- Design Standards Expert：本轮不改变设计基线，由 Main Thread 确认 `design.md` 未修改。
- Development Standards Lead：完成 `AGENTS.md` updater、发布顺序和命令审查。
- Project Management Agent：完成 baseline 与 scope 审查，等待选择性暂存和提交。
- Skill Expert Agent：完成更新 Skill 触发、主路由和状态话术审查。

## Agent 输入

- Product Agent：equal 必须在来源检查前零修改；official Git marketplace 不能按插件相对路径误判为 local；Release/tag/stable 必须同 commit；旧版本按 SHA 回滚。
- Development Agent：更新器只用 Codex marketplace/add 整包安装，失败显式恢复，只有 `updated` 提示用户自行重启。
- Test Supervisor Agent：三类哨兵证明 Skill、MCP、web 同时替换；用户数据树 hash 不变；回滚和 Windows `codex.cmd` 有覆盖。
- Customer Support Agent：中英文文档同步，首次从 `0.4.10` 手动升级和 `stable` 安装明确。
- Development Standards Lead：Release 先公开并验证，`stable` 作为最后一步普通快进；不依赖保护分支 force 回滚。
- Skill Expert Agent：更新与画布编辑、troubleshooting、开发 checkout Git pull 的触发边界分离。

## 报告状态变更

- 新建 `assigned/issue-stable-release-self-update.md`，保持 assigned 等待跨平台发布闭环。
- 新建 `resolved/solution-stable-release-self-update.md`，记录已完成实现和本地验证。

## 已解决

- 完整插件 Release 更新、来源保护、版本判断、安装后复核和 SHA 回滚实现完成。
- `v0.4.11` 五处版本一致，MCP bundle 和 web build 已重新生成。
- 双语用户流程、不可触碰的数据边界和工程发布规则已同步。

## 未解决

- 首轮 `v0.4.11` workflow `29249743724` 在 verify 阶段失败：macOS/Linux 发现 web build 内嵌绝对 checkout 路径导致 hash 漂移，Windows 发现 CRLF frontmatter 校验不兼容。Release 与 `stable` 均未公开。

## 风险

- Release 公开到 `stable` 最终快进之间存在很短的一致性窗口；更新器会在 tag/stable commit 不一致时以 `release_mismatch` 零修改拒绝安装。
- 如果 `stable` 普通快进失败，workflow 删除本轮 Release并保留旧 `stable`；Release 删除失败会明确红灯并需要人工处理。

## 下一轮分派

- Project Management Agent：选择性暂存并提交冻结范围。
- Main Thread：推送 main 和 `v0.4.11` tag，等待三系统 workflow，成功后完成 issue/queue/integration closure。

## 已完成改动

- 新增 updater Skill、执行脚本、Release 准备脚本、15 项测试和三系统发布 workflow。
- 更新主 Skill 路由、版本、MCP bundle、README、AGENTS 和 Agent Team 记录。
- 未修改 Canvas UI、现有 MCP tool 业务逻辑、Widget/Run/daemon 行为或 `design.md`。

## 处理结果

预发布实现完成，正式发布待 tag workflow。

## 修改文件

- 见本报告 `related_files`、版本/MCP 文件、ROSTER、QUEUE、issue 和 solution report。

## 验证方式

- `npm run test:update`
- `npm run release:verify -- 0.4.11`
- `npm run typecheck && npm run build && npm run test:mcp`
- `npm run check:mcp-bundle && npm run test:plugin-distribution`
- plugin validation、Skill quick validation、`git diff --check`

## 验证记录

- updater：15/15。
- plugin distribution：14 tools，无 `node_modules`/cache。
- `0.4.11` manifest/package/lock/MCP source 一致，7 Skills。
- build、MCP smoke、plugin validation、两项 Skill validation：通过。

## 回写状态

- `agent-reports/QUEUE.md` 保留 assigned row 并同步 version 3。
- issue report 已链接 solution 并记录本地验证。
- solution 与本预发布 integration summary 已写入。

## 未解决 / 后续风险

- 只有 tag workflow 三系统通过并成功公开 Release/快进 `stable` 后才能关闭 issue。
- Agent Team validator 仍被仓库既有 legacy 根报告、旧模板和 QUEUE schema 债务阻断；本轮新报告字段已按当前 schema 编写，未扩大范围迁移历史记录。

## Git 状态

- branch: `main`
- baseline: `308a22013776e2abec159d47ce7f6dea786094d6`
- commit: pending Project Management Agent closure
- worktree: scoped task-owned changes only
