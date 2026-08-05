---
status: resolved
report_type: solution
owner: Development Agent
created_by: Development Agent
priority: critical
created_at: 2026-08-05 20:28
updated_at: 2026-08-05 20:37
related_issue: agent-reports/resolved/20260805-2016-issue-edge-single-parent-cardinality.md
related_files:
  - plugins/canvasight/src/App.tsx
  - plugins/canvasight/src/components/TaskNode.tsx
  - plugins/canvasight/src/components/AssetNode.tsx
  - plugins/canvasight/src/store/scatterStore.ts
  - plugins/canvasight/mcp/server.source.mjs
  - plugins/canvasight/tests/single-parent-edge-smoke.mjs
  - plugins/canvasight/tests/concurrent-document-smoke.mjs
  - plugins/canvasight/tests/mcp-smoke.mjs
---

# Edge 单父约束全链路修复

## 负责 Agent

Development Agent

## 对应问题

`agent-reports/resolved/20260805-2016-issue-edge-single-parent-cardinality.md`

## Root Cause

单父规则只存在于目标 Handle 开始拖动时的一条局部交互路径。`isConnectionAllowed`、React Flow 批量 `onEdgesChange`、Zustand Store、普通文档保存、AI Graph Writer 校验以及 manual/AI 三方合并都没有共享“每个 target 最多一条入边”的持久化不变量，因此不同入口和不同 Edge id 可产生多父图。

## 调研过程

先运行 `tests/single-parent-edge-smoke.mjs` 得到稳定红测：已有 `parent-a -> child` 时，`parent-b -> child` 仍返回 `true`。随后逐层审计 UI 连线、React Flow EdgeChange、Store 变更入口、文档 normalize/read/save、AI candidate validation、manual 三方合并和 AI rebase。确认旧脏文档必须在 read/normalize 时原样保留，约束应落在 mutation/save boundary，并以 target 入边基数的“不增坏”规则允许历史数据继续编辑和逐步修复。

## 可选方案

- 方案 A：加载时只保留每个 target 的第一条 Edge。实现简单，但会静默删除历史用户数据，无法接受。
- 方案 B：加载保持无损；UI/Store 阻止新违规；普通保存相对 base/current 做 delta-aware 校验；AI candidate 严格要求单父；并发合并产生第二父时进入 conflict copy。

## 推荐方案

采用方案 B。它把新数据约束为严格单父，同时保持旧数据可读取、可保存无关编辑、可逐步从 3→2→1 修复，且不会把并发分支悄悄合并成脏图。

## 实施步骤

1. 手动连接与 `onEdgesChange` 逐条校验 target 是否已有入边，阻止批量 add 绕过；拖线开始只记录连接上下文，不预先改变 selection，拒绝路径保持 UI 状态不变。Task/Asset 已占用的左 target Handle 同时关闭 XYFlow 的通用、start 与 end 可连接状态且不渲染 add-parent button，删除唯一入边后由 Store selector 即时恢复；右 source Handle 不受影响。
2. Store 在 `setEdges`、`replaceCanvasLive`、`commitCanvasChange` 增加 Edge mutation backstop。
3. 普通保存按 `candidateCount <= max(1, baseCount)` 校验，保留/减少 legacy 违规，拒绝增加；Group 旧违规只能原样保留或删除。
4. AI 新图 normalize 与 Graph Structure validation 严格拒绝多父；AI rebase 合并产生第二父时保留 current Page，并创建完整 AI conflict copy。
5. manual/manual 并发为同 target 添加不同父边时记录 `edge-target` 冲突，保留 current Page 与完整 local conflict copy。
6. 同步版本至 `0.5.3`，重建 `mcp/server.mjs` 和 web distribution。

## 风险与回滚

Store 的 backstop 对不符合约束的变更采用整次拒绝，调用者目前没有可见错误提示；UI 主要入口已提前校验，因此正常交互不会触发无反馈拒绝。若需回滚，可恢复 UI/Store/MCP 约束与 0.5.3 生成产物，但不需要迁移 `.scatter` 数据，因为本次没有改写 schema 或加载结果。

## 处理结果

已修复。根节点可保持 0 入边；Task/Asset target 最多 1 入边；Group 不能成为新 Edge 端点；旧脏数据加载无损且只能保持或改善；manual/manual 和 manual/AI 并发第二父都转入 conflict copy；被拒绝的第二父拖线不会改变 selection；已占用 target 不再显示或暴露为可连接。

## 修改文件

- `plugins/canvasight/src/App.tsx`
- `plugins/canvasight/src/components/TaskNode.tsx`
- `plugins/canvasight/src/components/AssetNode.tsx`
- `plugins/canvasight/src/store/scatterStore.ts`
- `plugins/canvasight/mcp/server.source.mjs`
- `plugins/canvasight/mcp/server.mjs`
- `plugins/canvasight/tests/single-parent-edge-smoke.mjs`
- `plugins/canvasight/tests/concurrent-document-smoke.mjs`
- `plugins/canvasight/tests/mcp-smoke.mjs`
- `plugins/canvasight/package.json`
- `plugins/canvasight/package-lock.json`
- `plugins/canvasight/.codex-plugin/plugin.json`
- `plugins/canvasight/dist/index.html`
- `plugins/canvasight/dist/assets/index-CeQwbNUm.js`

## 验证方式

- 红测：`node tests/single-parent-edge-smoke.mjs` 在修复前稳定失败，第二父返回 `true`。
- 绿测：`npm run test:single-parent`
- `npm run test:mcp`
- `npm run test:concurrency`
- `npm run typecheck`
- `npm run check:mcp-bundle`
- `npm run build`
- `npm run release:verify -- 0.5.3`
- `git diff --check`
- Test Supervisor 浏览器门禁发现拒绝后 selection 切换的副作用；修复后同场景独立复测已通过。
- 占用 target affordance 的 Task/Asset 静态契约已加入 `test:single-parent` 并通过，包括显式关闭 `isConnectableStart` / `isConnectableEnd`；最终 web build 由 Main Thread 完成。

## 后续风险

Test Supervisor 已在最终源码上通过 Task/Asset 占用态、第二父真实拖线拒绝、selection/history/revision 零副作用、删除唯一入边后恢复和 fresh console 0 errors/warnings。Native Codex host 不属于本轮 invariant 门禁，保持 unverified。历史多父图不会自动清理，用户需要显式删除多余 Edge。验证构建期间被 Vite `emptyOutDir` 清理的两个任务前 untracked dist 副本已由 Main Thread 从可证明来源精确恢复，SHA-1 分别为 `9dc0c4b8fd82938d878f1153c584a555b747b5a5` 与 `cda29c8e4899a3036661f93c4def5bf1b8b4ce47`，没有遗留数据损失。
