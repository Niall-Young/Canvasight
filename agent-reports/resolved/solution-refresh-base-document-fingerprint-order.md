---
schema_version: 1
report_id: solution-refresh-base-document-fingerprint-order
report_type: solution
status: resolved
owner: Development Agent
created_by: Development Agent
priority: high
version: 3
agent_id: /root/development_agent
thread_id: 019f7450-40ec-7df0-81de-862b1f8af621
created_at: 2026-07-18T08:43:21Z
updated_at: 2026-07-18T09:57:09Z
depends_on:
  - issue-refresh-base-document-fingerprint-order
related_files:
  - plugins/canvasight/src/App.tsx
  - plugins/canvasight/src/lib/canvasightApi.ts
  - plugins/canvasight/mcp/server.source.mjs
  - plugins/canvasight/mcp/server.mjs
  - plugins/canvasight/tests/widget-runtime-smoke.mjs
  - plugins/canvasight/tests/concurrent-document-smoke.mjs
  - plugins/canvasight/.codex-plugin/plugin.json
  - plugins/canvasight/package.json
  - plugins/canvasight/package-lock.json
verification_status: passed
verification_evidence:
  - Read-only comparison confirmed that the daemon authoritative documentVersion and raw document hash are c33ca15b181dc02a5dd18b29f277f3da70a0d6007563cd573fdd68af54d06faf, while frontend normalizeDocument changes the hash to a45ee18fc5f004b734e9267bbb8a41540889c7d396b923c9b420732e1622efb2.
  - Source inspection confirmed both open-project hydration and save-success handling currently store display-normalized documents in baseDocumentRef.
  - Source inspection confirmed server modern-save validation recomputes an order-sensitive JSON.stringify fingerprint before writing a mutation receipt and returns invalid_document_base on mismatch.
  - 0.4.32 implementation and the complete local candidate matrix pass, including strict two-Page raw-base preservation and sanitized widget API failure diagnostics.
---

# 分离 authoritative save base 与 display normalization

## 负责 Agent

Development Agent

## 对应问题

`agent-reports/resolved/issue-refresh-base-document-fingerprint-order.md`（最终版本：4）

## Root Cause

Canvasight 的现代并发保存契约要求 `base.revision`、`base.version` 和 `base.document` 指向 daemon 返回的同一份 authoritative revision。0.4.31 虽然保留了 daemon 的 revision 与 documentVersion，却把 `result.document` 先交给前端 `normalizeDocument`，再把重建后的对象写入 `baseDocumentRef.document`。

`normalizeDocument` 是显示层适配器：它以 `emptyDocument` 为 fallback、重建 Page，并覆盖 legacy 顶层镜像。这个过程可以保持语义，却不能保证 daemon JSON 的字段插入顺序或未来扩展字段原样不变。真实文档的顶层顺序从 daemon 的 `version, projectName, updatedAt, viewport, nodes, edges, activePageId, pages` 变为前端的 `version, projectName, updatedAt, activePageId, pages, viewport, nodes, edges`。

server 在现代保存入口对 `normalizeScatterDocument(body.base.document)` 使用 `JSON.stringify` 计算 SHA-256，并与 `body.base.version` 及 durable history 比较。因该 fingerprint 对字段顺序敏感，来自同一 revision 的 display-normalized base 被判为不同文档，返回 HTTP 409 / `invalid_document_base`。失败发生在 mutation receipt 写入之前，所以现场 revision 保持 14、receipts 为空。

用户验收前执行的缩放会通过 `handleMoveEnd` 持久化 viewport，因此产生 pending save 是正常行为；错误不在 Refresh 的 dirty 判定、daemon 健康、session 绑定或 native ready，而在 authoritative base 被显示层对象替换。

## 调研过程

1. 核对 accepted 0.4.31 session、ready attempt、widget instance、revision-state、scatter 文件及 lifecycle，确认 daemon/session 健康且保存没有形成 receipt。
2. 对照 live authoritative documentVersion、raw JSON hash 与前端 `normalizeDocument` 后的 hash，确认语义相同但 fingerprint 不同。
3. 检查 `applyOpenedProject`：它把 normalized `document` 同时用于显示和 `baseDocumentRef`。
4. 检查 save success：它同样把 `normalizedResult` 写入下一轮 `baseDocumentRef`，所以只修首次 open 仍会在第一次成功保存后复发。
5. 检查 server `/document`：base fingerprint/version/history 三项校验均位于写入与 receipt 生成之前，和现场状态吻合。
6. 排除 clean-refresh 自身缺陷：完全无持久化变化时 `hasPendingLocalSave` 可直接跳过保存；本次验收中的缩放属于真实 viewport 变化。

## 可选方案

- 方案 A：在前端明确分离 authoritative raw base 与 display-normalized document。daemon 响应原对象只用于并发 base；normalized 副本只进入 Zustand/UI。保留当前 server revision history 和 fingerprint 契约。
- 方案 B：把 server fingerprint 改为递归稳定排序或其他 canonical serialization，并迁移现有 revision-state/history。该方案会改变所有现存 documentVersion 的身份，涉及兼容、历史迁移、mutation receipt 与 AI/manual 并发路径，超出本次发布阻断修复范围。
- 方案 C：忽略或放宽 `base.version` 校验。该方案会削弱 stale/conflict 防护，不能接受。

## 推荐方案

采用方案 A。authoritative base 是协议数据，不是显示模型；它必须和 daemon 返回的 `documentVersion` 保持同源、原样和同一 revision。显示层可以继续规范化，以维持 UI 类型和 legacy 兼容。server 的严格 fingerprint/history 校验不变，避免为修复前端所有权错误而扩大持久化协议风险。

同时补充脱敏错误诊断：用户仍看到本地化的安全失败文案，但 native/widget lifecycle 或等价可采集诊断必须记录失败请求的 route、HTTP status 和 error code（例如 `invalid_document_base`），不得记录 token、完整文档、节点正文或附件内容。自动化必须证明 widget API error envelope 的 code 没有在 Refresh 包装层被完全丢失。

## 实施步骤

1. 在 `applyOpenedProject` 中建立两个明确变量：authoritative `result.document` 用于 `baseDocumentRef.document`；`normalizeDocument(projectPath, result.document)` 仅用于 observed persistent value、导航保留和 `setProjectDocument`。
2. 在 save success 中保持相同边界：`baseDocumentRef.document` 保存原始 `result.document`；`normalizedResult` 继续用于冲突页显示、本地变更 rebase 和 Zustand 更新。两处都必须修复，否则下一轮保存仍会复发。
3. 不修改 server 的 `documentFingerprint`、revision history、mutation receipt 或 stale/conflict 判定语义。
4. 在 widget API 失败路径增加脱敏诊断事件，至少包含 session/open-attempt 可关联信息、route、status、code；Refresh 可以继续显示泛化文案，但测试应能观察到底层 `invalid_document_base`。如在前端提供 helper，只暴露 `CanvasightApiError` 的 status/code/message，不暴露 payload 中的用户内容。
5. 在 `widget-runtime-smoke.mjs` 添加真实 daemon 字段顺序 fixture：open 响应保留 legacy 镜像在 `activePageId/pages` 前的 authoritative 顺序，UI normalization 后执行仅 viewport 变化，再点击 Refresh。断言一次 save 成功、随后 open refresh 成功，且提交的 `base.document` 是原始 open 响应，不是 normalized display 对象。
6. 同一 fixture 使用非空多页文档，并包含可识别的 Page 扩展/`conflict` 元数据，证明 authoritative base 不因显示 normalization 丢字段。另断言完全无持久化变化的 clean Refresh 不发送 save。
7. 增加失败诊断用例：注入 409 / `invalid_document_base` envelope，断言刷新被安全取消、用户文案不泄露内容、诊断层保留 route/status/code。
8. 在 `concurrent-document-smoke.mjs` 覆盖真实 open-response raw base 的 viewport 保存，并保留现有 cross-task merge、conflict copy、mutation replay 和 daemon-restart idempotency。组合覆盖重新 hydrate/remount 后首次保存、同 session 多实例从共同 raw base 并发、shim/daemon transport retry；稳定 `clientMutationId` 的重放不得产生第二次写入。
9. 将发布身份提升到稳定版 `0.4.32`。同步 `.codex-plugin/plugin.json`、`package.json`、`package-lock.json` 和 `mcp/server.source.mjs` 的 `SERVER_VERSION`，随后重新生成 `mcp/server.mjs` 与 web `dist`。不得继续发布或覆盖 0.4.31。
10. 运行 targeted 测试后执行完整候选矩阵：typecheck、build、MCP bundle check、widget runtime、concurrency、MCP smoke、plugin distribution、update、dev server、skills、markdown/markdown export、plugin validator 和 `release:verify -- 0.4.32`。按 release reproducibility 规则核对生成物不含绝对路径且版本一致。
11. 安装 exact 0.4.32 后重载/重启 Codex Desktop，创建并标记新 task，通过正常 `@Canvasight` / `open_canvasight` 路径验证 instance-bound fullscreen ready。真实 native acceptance 至少覆盖：完全 clean Refresh 不保存、缩放后保存并刷新成功、一个有意义的 canvas 控件、同 task Run、A→B→A/remount 后首次保存、多实例/late metadata 不回退 Connecting，以及必要的 shim restart 后新 task 行为。

## 风险与回滚

- 风险：后续开发者再次把 normalized UI document 写入 base。通过变量命名、raw-key-order fixture 和多页扩展字段断言固定边界。
- 风险：保留 raw 对象时被 UI 原地修改。进入 store 前必须使用独立 normalized 对象，且不得把 authoritative base 引用交给可变 UI；测试应在编辑后断言 raw base 未变。
- 风险：多实例从同一 base 写入仍可能形成合法冲突。继续依赖现有三方合并、mutation receipt 和 stable clientMutationId，不用本修复绕开并发协议。
- 风险：诊断记录泄露项目内容。事件只记录枚举/标识字段和 route/status/code，禁止记录 request/response body、token、节点正文、附件或绝对用户数据。
- 回滚：若前端分离引入显示回归，可回滚 App 层两处引用和对应测试；不得回滚 server 严格校验，也不得恢复发布 0.4.31。若 exact 0.4.32 native acceptance 失败，停止发布并保留上一 stable，不得用重复 Refresh 掩盖失败。

## 处理结果

0.4.32 已在 hydration 与 save-success 两个边界保留 daemon 原始 `result.document`，显示层继续使用 normalized 副本；server fingerprint/history 契约未改。严格 widget fixture 使用真实 daemon 键序、两个 Page、conflict/扩展字段并在每次保存前比对完整 authoritative base。MCP lifecycle 失败事件只记录 pathname/method/status/code/instance identity，自动化证明 query 与绝对项目路径不会进入日志。完整本地矩阵与 exact native clean/zoom Refresh 均通过；task-switch 白屏属于独立宿主 presentation issue。

## 修改文件

- `plugins/canvasight/src/App.tsx`
- `plugins/canvasight/mcp/server.source.mjs`
- `plugins/canvasight/mcp/server.mjs`
- `plugins/canvasight/tests/widget-runtime-smoke.mjs`
- `plugins/canvasight/tests/mcp-smoke.mjs`
- 0.4.32 manifest/package/lock/web distribution
- `agent-reports/resolved/solution-refresh-base-document-fingerprint-order.md`

## 验证方式

- 已完成 live raw/normalized fingerprint 对照与 source-level 保存路径检查。
- `npm run test:widget-runtime`、`npm run test:mcp`、`npm run test:concurrency`、`npm run typecheck`、`npm run build`、`npm run check:mcp-bundle` 均通过。
- distribution、update、dev-server、skills、markdown、markdown-export、`release:verify -- 0.4.32`、MCP registration probe 与 plugin validator 均通过。
- exact 0.4.32 install、Desktop 重启与真实 native Refresh acceptance 已完成。

## 后续风险

- 方案不迁移 order-sensitive fingerprint；这是有意保留的兼容边界。任何 canonical fingerprint 改造必须另立数据格式与 revision-history 迁移设计。
- authoritative base 修复已由 exact native Refresh 证明；不得因独立 remount/presentation issue 回滚该边界。
