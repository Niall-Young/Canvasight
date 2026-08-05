---
status: resolved
report_type: integration-summary
owner: main-thread
created_by: main-thread
priority: critical
created_at: 2026-08-05 20:43
updated_at: 2026-08-05 20:43
related_files:
  - agent-reports/resolved/20260805-2016-issue-edge-single-parent-cardinality.md
  - agent-reports/resolved/20260805-2028-development-edge-single-parent-solution.md
  - plugins/canvasight/src/App.tsx
  - plugins/canvasight/src/components/TaskNode.tsx
  - plugins/canvasight/src/components/AssetNode.tsx
  - plugins/canvasight/src/store/scatterStore.ts
  - plugins/canvasight/mcp/server.source.mjs
---

# 集成 Edge 单父硬约束

## 本轮目标

- 强制 Task/Asset target 最多一条入边，根节点允许零入边，出边仍可分支。
- 覆盖手动拖线、批量 EdgeChange、Store、普通保存、AI Graph Writer 和并发重基。
- 拒绝第二父时保持既有 Edge、selection、history、revision 和 receipts 不变。
- 已占用 target 不再暴露左侧 add-parent 入口，删除唯一入边后立即恢复。

## Agent 状态

- Product Agent：席位受并发上限限制；Main Thread 确认本轮不改变 Page/Group/Run 身份与权限，仅收紧既有 Edge cardinality。
- Design Agent：定义单前驱语义、零副作用拒绝、占用态入口和 legacy 脏数据边界。
- Development Agent：完成 UI、Store、daemon、Graph Writer、并发和回归实现。
- Test Supervisor Agent：完成 fresh project 的真实浏览器拖线、状态、持久化和独立自动化矩阵。
- Customer Support Agent：席位受并发上限限制；Main Thread 执行 Good README 门禁并同步中英文功能、使用与开发命令。
- Design Standards Expert：席位受并发上限限制；Main Thread 同步 `design.md` 的单前驱和占用 target 交互基线。
- Development Standards Lead：席位受并发上限限制；Main Thread 将跨入口单父不变量、legacy 减坏和并发冲突规则写入 `AGENTS.md`。
- Project Management Agent：席位受并发上限限制；Main Thread 执行 baseline、选择性暂存、staged diff 检查和中文 conventional commit。
- Skill Expert Agent：席位受并发上限限制；本轮无 Skill 文件或触发边界变化，Main Thread 确认不适用。

## Agent 输入

- Design Agent：根节点 0 入边合法；目标第一条入边后不可再连接；拒绝不得改变 UI/数据状态；旧脏数据不得静默删边。
- Development Agent：使用 delta-aware 保存约束支持 legacy 数据保持或逐步 3→2→1 修复，AI candidate 严格单父，并发多父进入 conflict copy。
- Test Supervisor Agent：初测发现拒绝后 selection 改变和占用 target 入口仍可见，推动两轮修复；最终全部 PASS。
- Main Thread：补强文档、版本、报告、构建保护、真实当前 QA 页面复核和 Git 收口。

## 报告状态变更

- `agent-reports/assigned/20260805-2016-issue-edge-single-parent-cardinality.md` -> `agent-reports/resolved/20260805-2016-issue-edge-single-parent-cardinality.md`
- 新增 Development solution 与本 integration summary。

## 已解决

- `isConnectionAllowed` 与 React Flow 批量 add 不再允许同 target 第二父。
- Store backstop 覆盖直接 Edge mutation，拒绝发生在 history/save 前。
- Task/Asset 占用 target 隐藏左侧加号并关闭 XYFlow connectable/start/end；右 source 不受影响。
- 普通保存不允许引入或增加多父违规；旧脏文档加载无损，可保持或减少违规。
- AI 新图多父 candidate 被拒且 scatter bytes/revision 不变。
- manual/manual 与 manual/AI 并发给同 target 添加不同父边时产生合法 conflict copy，不再合并成脏图。

## 未解决

- 历史已经存在的多父 Edge 不会自动删除；用户必须明确选择并删除多余 Edge。
- Native Codex host 不属于本轮 browser/daemon invariant 门禁，保持 unverified。

## 风险

- Store backstop 的兜底拒绝没有额外 toast；正常 UI 在此之前已通过不可连接状态与连接校验阻止操作。

## 下一轮分派

- 无；后续正式发布时执行 exact-version native-host acceptance。

## 已完成改动

- 统一 UI、Store、保存、Graph Writer 和并发层的单父约束。
- 修复拒绝拖线的 selection 副作用和占用 target 的误导入口。
- 增加 `test:single-parent`、MCP candidate/revision、legacy 减坏、manual/manual 和 manual/AI 并发门禁。
- 同步版本至 `0.5.3` 并重建 MCP/Web distribution。
- 同步 `README.md`、`design.md`、`AGENTS.md`、`ROSTER.md` 与 Agent reports。

## 处理结果

已完成。

## 修改文件

- `plugins/canvasight/src/App.tsx`
- `plugins/canvasight/src/components/TaskNode.tsx`
- `plugins/canvasight/src/components/AssetNode.tsx`
- `plugins/canvasight/src/store/scatterStore.ts`
- `plugins/canvasight/mcp/server.source.mjs`
- `plugins/canvasight/mcp/server.mjs`
- `plugins/canvasight/tests/single-parent-edge-smoke.mjs`
- `plugins/canvasight/tests/mcp-smoke.mjs`
- `plugins/canvasight/tests/concurrent-document-smoke.mjs`
- package/version 与 `dist` 产物
- `README.md`、`design.md`、`AGENTS.md`、`ROSTER.md`、`agent-reports/`

## 验证方式

- 红测先连续两次稳定失败，再以同一专项门禁转绿。
- 独立自动化、类型检查、生产构建、bundle freshness、release verify、plugin validation 与 Git diff checks。
- Fresh browser 项目实际拖线，检查 Edge ids/count、selection、Undo/Redo、revision、documentVersion、receipts、target/source affordance 和 console。

## 验证记录

- `npm run test:single-parent`：PASS。
- `npm run test:mcp`：PASS；AI 多父 candidate 被拒，scatter bytes 与 revision 不变。
- `npm run test:concurrency`：PASS；manual/manual、manual/AI conflict copy 与 legacy preserve/reduce/reject 全覆盖。
- `npm run test:markdown`、`npm run test:asset-presentation`、`npm run typecheck`：PASS。
- `npm run build`、`npm run check:mcp-bundle`、`npm run release:verify -- 0.5.3`：PASS。
- Plugin validation、`git diff --check`、staged `git diff --cached --check`：PASS。
- Browser：Task/Asset 第一父成功；第二父真实拖线被拒且所有状态不变；占用 target 无 add-parent/连接能力；Undo 删除唯一入边后立即恢复；fresh console 0 errors / 0 warnings。
- README: updated；中英文均明确单父规则与 `test:single-parent` 开发门禁。

## 回写状态

- `agent-reports/QUEUE.md` 已更新。
- issue 已移入 resolved 并关联 solution。
- solution 与 integration summary 已写入。
- Agent Team role 状态已回写 `ROSTER.md`。

## 未解决 / 后续风险

- native-host 保持 unverified。
- 任务前未跟踪 `plugins/canvasight/dist/favicon 2.png` 与 `index 2.html` 在验证构建后按原始 SHA-1 `9dc0c4b8fd82938d878f1153c584a555b747b5a5` / `cda29c8e4899a3036661f93c4def5bf1b8b4ce47` 精确恢复，并继续排除在提交外。

## Git 状态

- branch: `main`
- baseline: `6fab98f91bc53faff3bd8af2dfff09412b758cc6`
- implementation commit: `9da71fb3c61cbfe39eeb1edb2d15313660460268` (`fix: 强制节点单父连接`)
- worktree: integration summary 待提交；两份预先存在的未跟踪 dist 副本保持原哈希并排除。
