---
schema_version: 1
report_id: issue-publish-stable-release-0-4-31
report_type: issue
status: blocked
owner: Project Management Agent
created_by: Main Thread
priority: high
version: 5
agent_id: /root/project_management_agent
thread_id: 019f744d-c7f1-7383-8195-7478c2cd835e
created_at: 2026-07-18T07:49:34Z
updated_at: 2026-07-18T08:42:24Z
depends_on:
  - issue-publish-stable-release-0-4-30
  - issue-native-refresh-save-stalls-across-mcp-shim-restart
  - solution-native-refresh-save-recovery
  - issue-native-widget-zero-size-0-4-31
  - issue-refresh-base-document-fingerprint-order
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
verification_status: failed
verification_evidence:
  - Development Agent prepared synchronized 0.4.31 artifacts and resolved the save-recovery implementation issue; independent Test Supervisor release approval and exact native-host acceptance remain pending.
  - Independent Test Supervisor passed the full isolated local release matrix and approved commit/install only.
  - Commit 64dd801e11436e2f9b00b5df463b9d8a0aa58fd3 was installed exactly as canvasight@canvasight-local 0.4.31; every tracked plugin file and the MCP/web hashes match the installed cache.
  - Restarted-host native acceptance failed for open-mrq3iskg-315c191b8e1b: fullscreen and React mounted, but projectHydrated/canvas visibility remained false with zero dimensions until the 30000ms failure.
  - Controlled foreground retry open-mrq3rbdl-e08223ec591e reached verified fullscreen ready on widget-ba18b1b9-1986-40a8-84ff-c8f541ae2290 with all readiness evidence true and a 788 by 794 visible canvas.
  - The user then performed the requested native Refresh flow and received the visible error 保存当前更改失败，刷新已取消；请重试; revision remained 14 with no mutation receipt.
  - Live hash comparison proved that frontend normalizeDocument changed the authoritative base fingerprint from c33ca15b... to a45ee18f..., causing the modern save to fail with invalid_document_base before any write.
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

blocked，verification failed。0.4.31 虽完成受控前台 ready，但真实 native Refresh 保存被 `invalid_document_base` 阻断，版本永久禁止发布。不得 push、tag、创建 Release 或推进 `stable`；任何修复必须升级为 0.4.32+ 并重新走完整候选门禁。

## Baseline 与 Dirty Scope

- branch: `main`
- baseline HEAD: `ad8cb3da327501dbbce1f0660955dc8cc5c360c3`
- upstream: 本地 `main` 在 `origin/main` 之前 2 个提交；尚未推送
- worktree: dirty，当前均按 0.4.31 修复/发布记录的 task-owned 候选审计，尚未获得 Main Thread 的冻结清单
- report/roster scope: `ROSTER.md`、`agent-reports/QUEUE.md`、0.4.30 blocked report、resolved Refresh issue/solution、本 0.4.31 publish issue
- runtime/source scope: 0.4.31 manifest/package/lock/MCP source/generated bundle、`src/App.tsx`、`src/lib/translations.ts`、`src/store/scatterStore.ts`、`tests/widget-runtime-smoke.mjs`
- generated web scope: `dist/index.html`，删除旧 `dist/assets/index-BbobkC2E.js` 并新增 `dist/assets/index-RwS6j5NK.js`

## 处理结果

已提交并安装 exact 0.4.31 候选，但真实原生 Refresh 门禁失败，0.4.31 永久禁止发布。0.4.29 与 0.4.30 同样保持禁止发布；三个版本均无远端 tag、Release、workflow 或 stable mutation。

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
- failed native attempt: `open-mrq3iskg-315c191b8e1b`
- failed widget instance: `widget-3f03522d-93d7-4bc6-8164-52d638083613`
- failed native evidence: fullscreen + React mounted, but `projectHydrated=false`, `canvasVisible=false`, `canvasWidth=0`, `canvasHeight=0`
- controlled foreground ready attempt: `open-mrq3rbdl-e08223ec591e`
- controlled foreground ready widget: `widget-ba18b1b9-1986-40a8-84ff-c8f541ae2290`
- controlled foreground ready evidence: verified fullscreen, all render evidence true, 788×794 at `2026-07-18T08:26:07.557Z`
- failed native Refresh screenshot: `保存当前更改失败，刷新已取消；请重试`
- failure state: revision 14, receipts empty, no successful scatter document write
- root cause: display-normalized base hash `a45ee18f...` does not match authoritative documentVersion `c33ca15b...`

## 后续风险

- 任何候选代码或构建产物变化都会使 Test 放行、安装哈希和原生验收证据失效。
- 已观察到的原生失败不可通过重复打开获得一次成功后忽略；若需 runtime/web 修复，必须使用新版本身份重新走完整门禁。
- 0.4.31 的 Refresh 失败已确认是代码缺陷而非用户操作；该版本身份不得恢复发布资格。
- 所有 lifecycle 自动化必须在 exact 安装与原生验收之前完成；原生验收后不得再运行会启动或停止 daemon 的测试。
- 不得复用 0.4.29/0.4.30 tag 身份，也不得通过浏览器 fallback、跳过 Refresh、手工清 dirty 或重复点击降格验收。
- Release 必须先发布并验证，再以普通 fast-forward 推进 `stable`；失败时不得 force-push、回退或删除受保护的 `stable`。
