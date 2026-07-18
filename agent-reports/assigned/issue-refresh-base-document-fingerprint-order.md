---
schema_version: 1
report_id: issue-refresh-base-document-fingerprint-order
report_type: issue
status: assigned
owner: Development Agent
created_by: Main Thread
priority: high
version: 3
agent_id: /root/development_agent
thread_id: 019f7450-40ec-7df0-81de-862b1f8af621
created_at: 2026-07-18T08:40:39Z
updated_at: 2026-07-18T09:02:34Z
depends_on:
  - issue-publish-stable-release-0-4-31
related_files:
  - plugins/canvasight/src/App.tsx
  - plugins/canvasight/mcp/server.source.mjs
  - plugins/canvasight/tests/widget-runtime-smoke.mjs
  - plugins/canvasight/tests/mcp-smoke.mjs
verification_status: passed
verification_evidence:
  - User observed a one-click native Refresh failure without an intentional content edit in the verified exact-0.4.31 widget.
  - Live authoritative documentVersion and raw JSON hash are c33ca15b181dc02a5dd18b29f277f3da70a0d6007563cd573fdd68af54d06faf, while the same document after frontend normalizeDocument hashes to a45ee18fc5f004b734e9267bbb8a41540889c7d396b923c9b420732e1622efb2.
  - 0.4.32 separates the raw authoritative save base from the display-normalized document at both hydration and save-success boundaries.
  - Strict composed-widget coverage rejects any key-order or extension-field drift across a two-Page conflict document; clean Refresh, viewport-save Refresh, retry, remount and multi-instance paths pass.
  - MCP smoke proves failed widget API diagnostics retain pathname, method, status and code without leaking projectPath or query text.
  - The complete local 0.4.32 candidate matrix and plugin validation pass.
---

# Refresh 保存基准文档因字段顺序被判版本不匹配

## TL;DR

前端把 daemon 返回的 authoritative document 归一化后保存为并发写入 base，重排了 JSON 字段顺序；server 使用 order-sensitive fingerprint 校验 base，导致语义相同的真实多页文档保存必然返回 `invalid_document_base`，Refresh 因而失败。

## 问题描述

exact 0.4.31 在 verified native widget 中执行真实 Refresh 时显示“保存当前更改失败，刷新已取消；请重试”。用户没有主动编辑内容。文档 revision 未推进，说明保存未成功。

## 现象

- accepted task：`019f744d-c7f1-7383-8195-7478c2cd835e`
- session：`session-mrq3rbdl-214329ad`
- ready attempt：`open-mrq3rbdl-e08223ec591e`
- ready widget：`widget-ba18b1b9-1986-40a8-84ff-c8f541ae2290`
- screenshot：`保存当前更改失败，刷新已取消；请重试`
- document revision 仍为 14，receipts 为空，`.scatter/scatter.json` 未推进。

## 复现方式

1. 打开具有既有 revision 和非空多页内容的真实 Canvasight 项目。
2. 前端在 `applyOpenedProject` 中把 daemon document 经 `normalizeDocument` 后写入 `baseDocumentRef`。
3. 触发任何需要 flush 的 Refresh 保存路径。
4. server 对 `normalizeScatterDocument(body.base.document)` 重新计算 order-sensitive SHA-256，并与 daemon 原始 `documentVersion` 比较。
5. 因 JSON 键插入顺序不同，语义相同的 base 被拒绝为 `invalid_document_base`。

## 影响范围

真实多页/既有 revision 项目的 native Refresh、普通手动保存、失败重试、并发保存和 0.4.31 发布门禁。

## 证据

- daemon authoritative `documentVersion`: `c33ca15b181dc02a5dd18b29f277f3da70a0d6007563cd573fdd68af54d06faf`
- daemon raw document JSON hash: 同为 `c33ca15b...`
- frontend `normalizeDocument` 后 hash: `a45ee18fc5f004b734e9267bbb8a41540889c7d396b923c9b420732e1622efb2`
- server raw 顶层字段顺序：`version, projectName, updatedAt, viewport, nodes, edges, activePageId, pages`
- frontend 重组顺序：`version, projectName, updatedAt, activePageId, pages, viewport, nodes, edges`
- server `document` handler 在 `invalid_document_base` 检查前使用 `JSON.stringify` fingerprint。

## 初步归因

显示层归一化文档和并发保存的 authoritative base 被错误复用为同一对象。并发 base 必须保留 daemon 返回的精确 authoritative document，不能用 UI normalization 产物替代。

## 交付给哪个 Agent

Development Agent

## 需要回答的问题

- `applyOpenedProject` 和 save success 是否都应把原始 `result.document` 保存到 `baseDocumentRef`，显示状态继续使用 `normalizeDocument`？
- 针对 key-order mismatch、真实多页文档、A→B→A/remount、多 instance 和 transport retry，应增加哪些组合回归？

## Closure Criteria

- [x] authoritative base 与 display-normalized document 明确分离
- [x] key-order mismatch 的真实多页保存回归通过
- [x] clean Refresh 不发起保存；真实 pending change 可保存后刷新
- [x] remount、多实例和 shim restart 组合覆盖通过
- [ ] 使用 0.4.32+ 新身份完成完整矩阵、exact install、重启和 native acceptance

## 当前状态

0.4.32 本地实现与自动化矩阵通过；保持 assigned，等待 exact install、Codex Desktop 重启与真实 native acceptance。

## 处理结果

0.4.31 已被真实 native Refresh 否决；0.4.32 已完成 authoritative raw base 分离、严格多页回归和脱敏失败诊断，本地门禁通过。

## 修改文件

- `plugins/canvasight/src/App.tsx`
- `plugins/canvasight/mcp/server.source.mjs`
- `plugins/canvasight/mcp/server.mjs`
- `plugins/canvasight/tests/widget-runtime-smoke.mjs`
- `plugins/canvasight/tests/mcp-smoke.mjs`
- 0.4.32 同步版本与 web distribution 产物
- 本报告及对应 solution report

## 验证方式

- live document hash 对照。
- targeted widget runtime regression。
- 完整本地候选矩阵与真实 native host acceptance。

## 后续风险

不得通过重复 Refresh、重新打开或手工清 dirty 覆盖失败证据；任何修复必须升 0.4.32+。
