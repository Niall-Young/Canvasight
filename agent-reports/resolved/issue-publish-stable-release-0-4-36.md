---
schema_version: 1
report_id: issue-publish-stable-release-0-4-36
report_type: issue
status: resolved
owner: Project Management Agent
created_by: Main Thread
priority: critical
version: 4
agent_id: /root/project_management_agent
thread_id: null
created_at: 2026-07-26T06:25:03Z
updated_at: 2026-07-26T06:55:43Z
depends_on:
  - issue-codex-react-185-sidebar-recovery
related_files:
  - .github/workflows/canvasight-release.yml
  - plugins/canvasight/.codex-plugin/plugin.json
  - plugins/canvasight/package.json
  - plugins/canvasight/package-lock.json
  - plugins/canvasight/mcp/server.source.mjs
  - plugins/canvasight/mcp/server.mjs
  - plugins/canvasight/dist
verification_status: passed
verification_evidence:
  - The user explicitly authorized publishing a new Release so the original reporter can update and test.
  - At preflight, local package metadata was synchronized at 0.4.36 before the v0.4.36 tag and Release existed.
  - Release-preflight commit 2567c4b595d4eee43b6ee3cbcde7ded098f94c5e froze the plugin/workflow baseline while origin/stable was still v0.4.35; the final tagged candidate is 474491162abeb9ec9553d1c790df56485e6d8ef2.
  - Local release verification, bundle freshness, typecheck, reproducible build, updater, clean distribution, MCP registration/runtime, concurrency, dev-server, Markdown, rich-text, Skills and plugin validation pass.
  - Widget runtime passed three sequential isolated runs on the same 0.4.36 bytes; the earlier save-count observation is archived as non-reproducible rather than represented as fixed.
  - Installed-cache parity passes for all 584 tracked plugin files with no dependency, Vite-cache or numbered duplicate artifacts.
  - Release workflow now downloads the GitHub-hosted assets, verifies their exact names and checksum, inspects the extracted snapshot and probes MCP registration before the final stable fast-forward.
  - The maintainer explicitly confirmed the exact 0.4.36 internal native release gate after exercising canvas control, Refresh, same-task Run and late-state stability.
  - Release workflow 30191751214 passed Ubuntu, macOS and Windows Node 20.19 plus the guarded publish/stable job at commit 474491162abeb9ec9553d1c790df56485e6d8ef2.
  - GitHub-hosted zip checksum is 1edc00205c56be38cdffb31245761c49341fe6f48c3242d2dd931cb0d7bc4d6c; the extracted snapshot passed cleanliness, version, plugin validation and 16-tool MCP registration checks.
  - origin/main, origin/stable and v0.4.36 all dereference to 474491162abeb9ec9553d1c790df56485e6d8ef2 before this report-only closure.
  - Original reporter smartLanny has not tested 0.4.36; Issue #2 must remain open after publication.
solution_report: agent-reports/resolved/solution-publish-stable-release-0-4-36.md
---

# 发布 Canvasight 0.4.36 并推进 stable 更新通道

## TL;DR

在完整本地、原生与三平台门禁通过后发布 `v0.4.36`，验证完整 Release 资产，再将 `stable` 普通快进到同一 tag 提交，使 smartLanny 能通过正式更新通道复验 GitHub Issue #2。

## Closure Criteria

- [x] 版本字段、MCP bundle、dist 与 Skill frontmatter 一致
- [x] 本地发布矩阵和 plugin validator 通过
- [x] exact 0.4.36 原生 ready、画布控件、Refresh、同任务 Run 与 late-state 门槛通过
- [x] `v0.4.36` tag 指向当前 `origin/main` HEAD
- [x] Windows、macOS、Ubuntu Node 20.19 release workflow 全部通过
- [x] GitHub Release 资产、checksum 与插件快照验证通过
- [x] `stable` 普通 fast-forward 到 exact tag commit
- [x] Issue #2 保持 Open，等待 smartLanny 更新后复验

## 当前状态

resolved / passed。`v0.4.36` 已通过三平台矩阵、GitHub 托管资产回读和独立复核；`stable` 已普通快进到 exact tag commit。Issue #2 仍保持 Open，等待 smartLanny 复验。

## 处理结果

已发布非草稿、非预发布的 `v0.4.36` Release；zip 与 checksum 资产完整，`stable`、tag 与发布候选 commit 一致。

## 修改文件

- `.github/workflows/canvasight-release.yml`
- Agent Team 发布记录；候选实现与 0.4.36 插件生成物保持不可变。

## 验证方式

- `npm run release:verify -- 0.4.36`
- 完整本地测试与 plugin validator
- exact native widget acceptance
- tag-triggered `.github/workflows/canvasight-release.yml`
- Release zip/checksum/manifest/MCP registration audit
- remote main/stable/tag dereference audit

## 后续风险

- 原始报告者尚未验证 Issue #2；本次发布只提供正式可安装版本，不得自动关闭 issue。
- GitHub Actions 提示 `actions/checkout@v4` 与 `actions/setup-node@v4` 的 Node 20 action runtime 已弃用并被强制到 Node 24；项目矩阵仍明确使用 Node 20.19，后续应单独升级 action runtime。
