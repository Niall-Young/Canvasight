---
schema_version: 1
report_id: issue-publish-stable-release-0-4-36
report_type: issue
status: assigned
owner: Project Management Agent
created_by: Main Thread
priority: critical
version: 2
agent_id: /root/project_management_agent
thread_id: null
created_at: 2026-07-26T06:25:03Z
updated_at: 2026-07-26T06:34:35Z
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
verification_status: failed
verification_evidence:
  - The user explicitly authorized publishing a new Release so the original reporter can update and test.
  - Local package metadata is already synchronized at 0.4.36, while v0.4.36 tag and Release do not yet exist.
  - origin/main currently points to the exact local HEAD 883a0e6fd808299a88e667eca9af71f19450f85d; origin/stable remains at v0.4.35.
  - Local release verification, bundle freshness, typecheck, reproducible build, updater, clean distribution, MCP registration/runtime, concurrency, dev-server, Markdown, rich-text, Skills and plugin validation pass.
  - Widget runtime passed three sequential isolated runs on the same 0.4.36 bytes; the earlier save-count observation is archived as non-reproducible rather than represented as fixed.
  - Installed-cache parity passes for all 584 tracked plugin files with no dependency, Vite-cache or numbered duplicate artifacts.
  - Release workflow now downloads the GitHub-hosted assets, verifies their exact names and checksum, inspects the extracted snapshot and probes MCP registration before the final stable fast-forward.
  - The exact 0.4.36 maintainer interactive native gate remains incomplete, so tag creation is still blocked.
---

# 发布 Canvasight 0.4.36 并推进 stable 更新通道

## TL;DR

在完整本地、原生与三平台门禁通过后发布 `v0.4.36`，验证完整 Release 资产，再将 `stable` 普通快进到同一 tag 提交，使 smartLanny 能通过正式更新通道复验 GitHub Issue #2。

## Closure Criteria

- [ ] 版本字段、MCP bundle、dist 与 Skill frontmatter 一致
- [ ] 本地发布矩阵和 plugin validator 通过
- [ ] exact 0.4.36 原生 ready、画布控件、Refresh、同任务 Run 与 late-state 门槛通过
- [ ] `v0.4.36` tag 指向当前 `origin/main` HEAD
- [ ] Windows、macOS、Ubuntu Node 20.19 release workflow 全部通过
- [ ] GitHub Release 资产、checksum 与插件快照验证通过
- [ ] `stable` 普通 fast-forward 到 exact tag commit
- [ ] Issue #2 保持 Open，等待 smartLanny 更新后复验

## 当前状态

assigned / failed。自动化、候选字节一致性与 Release 资产回读门槛已通过或实现；exact 0.4.36 的维护者原生交互门槛仍未完成，暂不创建 tag。

## 处理结果

待执行。

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

- 原始报告者尚未验证 Issue #2；本次发布只提供可安装候选，不得自动关闭 issue。
- 任一发布或资产验证失败时不得推进 `stable`；workflow 必须按现有回滚合同删除失败 Release。
- 当前工作流加固尚需提交、推送并进入最终候选 commit；tag 必须指向当时的 exact `origin/main` HEAD。
