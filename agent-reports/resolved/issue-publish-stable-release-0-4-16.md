---
schema_version: 1
report_id: issue-publish-stable-release-0-4-16
report_type: issue
status: resolved
owner: Project Management Agent
created_by: Main Thread
priority: high
version: 5
agent_id: /root
thread_id: 019f5eb0-4d27-7df0-9f98-af747871f372
created_at: 2026-07-14T03:35:43Z
updated_at: 2026-07-14T03:58:02Z
depends_on: []
solution_report: agent-reports/resolved/solution-release-stable-0-4-16.md
related_files:
  - README.md
  - agent-reports/resolved/integration-summary-canvasight-0-4-16-release-candidate.md
  - agent-reports/resolved/solution-release-stable-0-4-16.md
  - plugins/canvasight/.codex-plugin/plugin.json
  - plugins/canvasight/package.json
  - plugins/canvasight/package-lock.json
  - plugins/canvasight/mcp/server.source.mjs
  - plugins/canvasight/mcp/server.mjs
  - plugins/canvasight/dist
  - plugins/canvasight/scripts/prepare-release.mjs
  - plugins/canvasight/tests/concurrent-document-smoke.mjs
  - .github/workflows/canvasight-release.yml
verification_status: passed
verification_evidence:
  - npm run release:verify -- 0.4.16 passed with all five version fields synchronized and seven packaged Skills.
  - npm run check:mcp-bundle passed; the committed self-contained MCP bundle is current.
  - Exact installed Canvasight 0.4.16 produced an instance-bound native fullscreen ready acknowledgement.
  - The user confirmed a meaningful canvas-control interaction and a node Run reaching this same Codex Task from the accepted native instance.
  - Main Thread rechecked the exact widget instance after those interactions and its instance-bound fullscreen ready acknowledgement remained verified; late evidence did not return it to Connecting.
  - integration-summary-canvasight-0-4-16-release-candidate records the complete Node 20.19 local release matrix, plugin validation, native acceptance, documentation review, and the frozen seven-path commit scope.
  - GitHub Actions workflow 29304633410 passed Windows, macOS, Ubuntu, and Publish jobs.
  - Public v0.4.16 is neither draft nor prerelease and contains exactly the plugin zip and SHA-256 asset; checksum, unpacked plugin validation, and Node 20.19 15-tool registration passed.
  - GitHub latest is v0.4.16 and tag, stable, and release-time main all resolve to ba7ef87910262a510333f5399fbdf44068fec8a7.
  - The local unauthenticated updater check hit HTTP 403 only because GitHub core rate limit remaining was zero; authenticated GitHub API independently confirmed the same Release and ref state.
---

# 发布 Canvasight 0.4.16 并推进 stable 更新通道

## TL;DR

将当前 main 的完整插件快照作为 v0.4.16 发布，在三平台发布门禁通过后确认 GitHub Release 与 stable 均指向同一提交。

## 问题描述

仓库当前插件版本为 0.4.16，但官方最新 Release 与 stable 仍停在 0.4.11，后续插件更新无法获取 0.4.12 至 0.4.16 的已完成改动。

## 影响范围

GitHub tag、Release 资产、stable 分支、完整插件快照和自更新发现路径。

## 期望结果

- v0.4.16 tag 指向发布时的 main HEAD。
- Windows、macOS、Linux 发布矩阵全部通过。
- 正式 GitHub Release 资产可下载且校验文件有效。
- stable 最终快进到与 v0.4.16 和 Release 完全一致的提交。
- 不纳入预先存在的 `.gitignore` 修改。

## Closure Criteria

- [x] 本地 release、build、runtime、distribution 和 plugin validation 门禁通过
- [x] 发布提交与 tag 已推送
- [x] GitHub Actions 三平台矩阵通过
- [x] GitHub Release 已发布并验证资产
- [x] stable 与 tag 提交一致
- [x] updater 官方 latest Release 与 stable 输入已认证确认均为 v0.4.16 和同一提交

## 当前状态

resolved

## Native-host 验收证据

- 精确安装的 Canvasight 0.4.16 已完成 instance-bound fullscreen ready 确认。
- 用户已确认完成有意义的画布控件操作，并从该验收实例完成节点 Run，结果到达同一 Codex Task。
- Main Thread 在交互后再次核对同一精确 widget instance，ready 仍为 verified，late evidence 未使界面退回 Connecting。
- 原生宿主 blocker 已解除；正式发布、`stable` 与 updater 官方输入已完成闭环。

## 基线证据

- branch: `main`
- baseline HEAD: `49813c2ae618d4af4f9ab239c0f94303920a29e8`
- pre-existing worktree: `.gitignore` modified by a separate artifact-cleanup delivery
- latest official Release/stable: `v0.4.11` / `083331bc24d949e8b229590bd9cb1fa66ef77cc9`

## 后续风险

- 本地未认证 updater `--check` 因 GitHub core rate limit remaining=0 返回 HTTP 403；已认证 API 已确认 Release 与 refs 完全一致，该诊断残余不是 release mismatch。
- 后续正式更新继续以 latest GitHub Release 与 `stable` 同 commit 为安全安装前提。

## 处理结果

Canvasight v0.4.16 已正式发布，`stable` 已推进到同一提交，后续插件更新将使用该完整快照。

## 修改文件

- `agent-reports/resolved/solution-release-stable-0-4-16.md`
- `agent-reports/resolved/issue-publish-stable-release-0-4-16.md`
- 最终 integration summary、ROSTER 与 QUEUE closure 由 Main Thread 接续。

## 验证方式

- GitHub Actions workflow `29304633410`
- Release zip 与 SHA-256 asset/checksum
- 解包插件 validator 与 Node 20.19 15-tool registration
- GitHub latest、tag、stable 与 release-time main commit 对齐
