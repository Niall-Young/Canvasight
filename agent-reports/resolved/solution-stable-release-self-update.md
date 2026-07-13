---
schema_version: 1
report_id: solution-stable-release-self-update
report_type: solution
status: resolved
owner: Development Agent
created_by: Development Agent
priority: high
version: 2
agent_id: /root/development_agent
thread_id: null
created_at: 2026-07-13T12:18:15Z
updated_at: 2026-07-13T12:30:11Z
depends_on:
  - issue-stable-release-self-update
related_issue: issue-stable-release-self-update
related_files:
  - .gitattributes
  - plugins/canvasight/scripts/update-canvasight.mjs
  - plugins/canvasight/scripts/prepare-release.mjs
  - plugins/canvasight/vite.config.ts
  - plugins/canvasight/dist/index.html
  - plugins/canvasight/tests/update-canvasight-smoke.mjs
  - plugins/canvasight/skills/canvasight-update/SKILL.md
  - .github/workflows/canvasight-release.yml
verification_status: passed
verification_evidence:
  - Updater smoke tests pass 15 of 15 cases.
  - Release metadata verifies as 0.4.11 with seven Skills.
  - Build, MCP smoke, clean distribution, plugin validation, and Skill validation pass.
---

# Canvasight 正式 Release 与完整插件自更新方案

## 负责 Agent

Development Agent

## 对应问题

`agent-reports/assigned/issue-stable-release-self-update.md`

## Root Cause

早期 repo-local 分发没有稳定 Release 通道、整包更新器、失败回滚和正式发布门禁，旧版本无法通过自然语言安全升级。

## 调研过程

- 验证 Codex marketplace upgrade/add 的 JSON 输出、重复安装、Git ref 跟踪和来源恢复行为。
- 区分 marketplace 的 Git/local 来源，避免把官方 Git marketplace 内部相对插件路径误判为开发 checkout。
- 验证 Release tag、`stable` 和安装来源必须锁定同一 commit。
- 验证回滚必须按旧 commit SHA 恢复，不能重新追踪已经前进的 `stable`。

## 可选方案

- 逐文件覆盖 cache：无法可靠覆盖未来新增/删除文件，且会绕过 Codex 插件管理，否决。
- 只分发 updater Skill：无法更新 MCP、UI 和其他 Skills，否决。
- 通过官方 marketplace 安装完整稳定快照：采用。

## 推荐方案

更新器先只读比较版本和验证官方 Release 身份，只有旧版本且来源可更新时才刷新或迁移 `canvasight-local` marketplace，再用 `codex plugin add canvasight@canvasight-local` 安装完整快照并复核版本。失败时按旧 SHA 恢复插件和原跟踪 ref。

## 实施步骤

1. 新增中英文更新 Skill 和 Canvasight 主索引路由。
2. 新增无第三方运行依赖的 check/update 脚本及 15 项状态、来源、数据隔离和回滚测试。
3. 新增 Release 准备/校验脚本，统一版本并生成 MCP/web 构建产物。
4. 新增 Windows、macOS、Linux 发布矩阵；验证后创建 draft、推进 `stable`、再公开 Release。
5. 同步双语 README、工程规则和 `0.4.11` 版本。

## 风险与回滚

- 更新失败按旧 commit SHA 恢复；恢复失败明确返回 `rollback_failed`，绝不报告成功。
- 发布矩阵通过后先公开并验证 Release，最后只用普通快进推进 `stable`；快进失败会删除本轮 Release，不 force-push、回退或删除受保护的 `stable`。
- Release build 不嵌入机器绝对项目路径，插件文本统一 LF checkout；Skill frontmatter 校验显式归一 CRLF，保证三系统快照与验证一致。
- 更新器不访问或修改 `.scatter`、附件、`~/.canvasight`、项目源码和其他插件。

## 处理结果

已修复。

## 修改文件

- 更新器、Release 准备脚本、跨平台发布工作流、更新 Skill、测试、版本文件、MCP bundle、README、AGENTS 和 Agent Team 报告。

## 验证方式

- `npm run test:update`
- `npm run release:verify -- 0.4.11`
- `npm run typecheck && npm run build && npm run test:mcp`
- `npm run check:mcp-bundle && npm run test:plugin-distribution`
- plugin validation、Skill validation、`git diff --check`

## 后续风险

跨平台实机门禁以 `v0.4.11` tag 触发后的 GitHub Actions matrix 为最终发布证据；在它通过前 issue 保持 assigned，最终发布闭环尚未完成。
