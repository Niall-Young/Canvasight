---
schema_version: 1
report_id: issue-publish-stable-release-0-4-31
report_type: issue
status: assigned
owner: Project Management Agent
created_by: Main Thread
priority: high
version: 2
agent_id: /root/project_management_agent
thread_id: 019f7415-32a4-7980-831d-146e54c7d842
created_at: 2026-07-18T07:49:34Z
updated_at: 2026-07-18T07:57:32Z
depends_on:
  - issue-publish-stable-release-0-4-30
  - issue-native-refresh-save-stalls-across-mcp-shim-restart
  - solution-native-refresh-save-recovery
related_files:
  - .github/workflows/canvasight-release.yml
  - plugins/canvasight/.codex-plugin/plugin.json
  - plugins/canvasight/package.json
  - plugins/canvasight/package-lock.json
  - plugins/canvasight/mcp/server.source.mjs
  - plugins/canvasight/mcp/server.mjs
  - plugins/canvasight/dist
  - plugins/canvasight/src/App.tsx
  - plugins/canvasight/src/lib/translations.ts
  - plugins/canvasight/src/store/scatterStore.ts
  - plugins/canvasight/tests/widget-runtime-smoke.mjs
verification_status: not_started
verification_evidence:
  - Development Agent prepared synchronized 0.4.31 artifacts and resolved the save-recovery implementation issue; independent Test Supervisor release approval and exact native-host acceptance remain pending.
  - Independent Test Supervisor passed the full isolated local release matrix and approved commit/install only.
  - Commit 64dd801e11436e2f9b00b5df463b9d8a0aa58fd3 was installed exactly as canvasight@canvasight-local 0.4.31; every tracked plugin file and the MCP/web hashes match the installed cache.
---

# 发布 Canvasight 0.4.31 并推进 stable 更新通道

## TL;DR

以修复原生 Refresh 保存恢复闭环的 0.4.31 取代禁止发布的 0.4.29 与 0.4.30；等待 Test Supervisor 放行和 Main Thread 冻结范围后，完成 exact 安装、宿主重启、完整原生验收、三平台 Release、资产、stable 与 updater 闭环。

## 问题描述

0.4.29 的 daemon home 隔离缺陷和 0.4.30 的原生 Refresh 保存阻断都在正式发布前被真实验收拦截，两者均禁止发布且未产生远端 tag、Release 或 stable mutation。Development Agent 已修复 transient dirty、失败保存重试和 Refresh save flush，并准备 0.4.31 候选；正式发布仍需独立 Test 放行与真实 Codex 原生宿主验收。

## 影响范围

候选安装、Codex Desktop 原生 widget、GitHub tag/Release、三平台 CI、Release 资产、`stable` 与 updater。

## Closure Criteria

- [ ] 0.4.31 版本字段、MCP bundle 与 web dist 一致，候选 scope 通过 Test Supervisor 独立放行
- [ ] exact 0.4.31 安装后重启 Codex Desktop，并在新建且重新 `@Canvasight` 的任务完成 instance-bound fullscreen ready
- [ ] 真实 Refresh 成功且不丢本地更改、不出现伪 dirty 或永久保存阻断
- [ ] 同任务节点 Run 通过原生 widget host bridge 到达同一 Codex 任务
- [ ] A→B→A 导航无白屏，迟到 metadata 不会回退 Connecting
- [ ] `v0.4.31` 三平台 Windows/macOS/Ubuntu Node 20.19 工作流全部通过
- [ ] Release zip 与 SHA-256 资产存在、可下载且校验一致
- [ ] `stable`、tag、Release commit 完全一致
- [ ] updater live check 能发现 0.4.31，equal-version 路径保持零 mutation

## 当前状态

assigned 给 Project Management Agent。commit/install 门禁已通过，exact 0.4.31 已安装；等待 Codex Desktop 重启后在新任务完成完整原生验收。重启前不得 push、tag、创建 Release 或推进 `stable`。

## Baseline 与 Dirty Scope

- branch: `main`
- baseline HEAD: `ad8cb3da327501dbbce1f0660955dc8cc5c360c3`
- upstream: 本地 `main` 在 `origin/main` 之前 2 个提交；尚未推送
- worktree: dirty，当前均按 0.4.31 修复/发布记录的 task-owned 候选审计，尚未获得 Main Thread 的冻结清单
- report/roster scope: `ROSTER.md`、`agent-reports/QUEUE.md`、0.4.30 blocked report、resolved Refresh issue/solution、本 0.4.31 publish issue
- runtime/source scope: 0.4.31 manifest/package/lock/MCP source/generated bundle、`src/App.tsx`、`src/lib/translations.ts`、`src/store/scatterStore.ts`、`tests/widget-runtime-smoke.mjs`
- generated web scope: `dist/index.html`，删除旧 `dist/assets/index-BbobkC2E.js` 并新增 `dist/assets/index-RwS6j5NK.js`

## 处理结果

已提交并安装 exact 0.4.31 候选，尚未发布。0.4.29 与 0.4.30 保持禁止发布；两者均无远端 tag、Release、workflow 或 stable mutation。

## 修改文件

- 本报告。

## 验证方式

- Test Supervisor 独立候选矩阵与 scoped diff 审计。
- exact 0.4.31 安装哈希、宿主重启后原生 ready/Refresh/Run/A→B→A/late-metadata 验收。
- GitHub Actions 三平台 Node 20.19、Release zip/SHA-256、tag/Release/stable refs 与 updater live check。

## 安装证据

- candidate commit: `64dd801e11436e2f9b00b5df463b9d8a0aa58fd3`
- installed path: `/Users/niallyoung/.codex/plugins/cache/canvasight-local/canvasight/0.4.31`
- MCP SHA-256: `1c2bebff364b3984b940bc3a9eb6c28324c13e7c74340cce889077701b9b9843`
- dist index SHA-256: `a1e0ff22a4b9fde0be75e71808d0d6691380dc11874a25f538361de8ddfa2f5c`
- dist JS SHA-256: `2bdfad87bd58fb5e157f6153b35554b15a7c082159d5412df4e0a4148a419acc`
- installed-cache plugin validator: passed

## 后续风险

- 任何候选代码或构建产物变化都会使 Test 放行、安装哈希和原生验收证据失效。
- 所有 lifecycle 自动化必须在 exact 安装与原生验收之前完成；原生验收后不得再运行会启动或停止 daemon 的测试。
- 不得复用 0.4.29/0.4.30 tag 身份，也不得通过浏览器 fallback、跳过 Refresh、手工清 dirty 或重复点击降格验收。
- Release 必须先发布并验证，再以普通 fast-forward 推进 `stable`；失败时不得 force-push、回退或删除受保护的 `stable`。
