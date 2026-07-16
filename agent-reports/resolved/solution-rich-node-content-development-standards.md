---
schema_version: 1
report_id: solution-rich-node-content-development-standards
report_type: solution
status: resolved
owner: Development Standards Lead
created_by: Development Standards Lead
priority: medium
version: 2
agent_id: /root/development_standards_agent
thread_id: null
created_at: 2026-07-16T06:32:22Z
updated_at: 2026-07-16T06:33:47Z
depends_on:
  - issue-rich-node-content-editor
  - solution-rich-node-content-editor
related_files:
  - AGENTS.md
  - plugins/canvasight/package.json
  - plugins/canvasight/src/lib/richNodeContent.ts
  - plugins/canvasight/src/components/RichNodeBody.tsx
  - plugins/canvasight/shared/types.ts
  - plugins/canvasight/tests/rich-node-content-smoke.mjs
  - plugins/canvasight/README.md
  - design.md
verification_status: passed
verification_evidence:
  - Re-read issue-rich-node-content-editor immediately before writing this report and confirmed owner Development Agent, status assigned, version 2; this standards review does not change the issue, roster, or queue.
  - Reviewed AGENTS.md, ROSTER.md, the Agent Team schema and references, package.json, the full task implementation diff, and all current rich-node-content solution reports.
  - Confirmed the implementation changes UI, typed node data, persistence helpers, tests, docs, design baseline, and built web assets without changing MCP source, plugin manifest, package-lock.json, or runtime version fields.
  - npm run test:rich-content passed from plugins/canvasight; git diff --check passed for the reviewed implementation, test, README, and design paths.
  - Confirmed package.json contains build, typecheck, test:rich-content, test:markdown, test:markdown-export, test:skills, and test:concurrency scripts used by the verification matrix.
  - Ran the packaged Agent Team validator; full-repository validation remains blocked by pre-existing legacy report/template schema debt and QUEUE drift, and it did not report this solution file as invalid.
---

# 节点富内容工程规范与命令审查

## 负责 Agent

Development Standards Lead

## 对应问题

`agent-reports/assigned/issue-rich-node-content-editor.md`

## Root Cause

本轮新增轻量所见即所得正文、可选图片锚点和聚焦测试，需要确认它是否引入新的长期工程规则、命令、版本或发布约束。当前 `AGENTS.md` 已有较完整的类型、分层、持久化、并发兼容、设计基线、README、验证、MCP 版本同步和 Git 闭环规则，但命令索引需要与 `package.json` 对照审查。

## 调研过程

- 完整阅读 Canvasight Agent Team Skill、schema、角色选择与 report protocol，并核对 `ROSTER.md` 和父 issue 的唯一 owner、状态与版本。
- 审查实现 diff：`ScatterNodeData` 新增可选 typed anchor；解析/序列化放在独立纯函数模块；编辑 UI、store、上传入口与样式按现有边界接入；Run/Markdown/MCP runtime 未被改写。
- 对照 `AGENTS.md` 的 typed data、presentation/business separation、显式 persistence contract、三方并发向后兼容、`design.md` 权威、双语 README、typecheck/build/browser 验证和 MCP runtime version bump 条款。
- 对照 `package.json` 与测试报告核查本轮使用的命令，并实际执行新增 `npm run test:rich-content`。
- 核对 Git diff：`plugins/canvasight/mcp/`、`.codex-plugin/`、`package-lock.json` 没有本轮改动，因此没有 MCP runtime 版本同步触发条件。

## 可选方案

- 方案 A：为富内容实现新增专属 durable 工程规则。会重复 `AGENTS.md` 已有的 typed contract、分层、兼容、文档与验证要求，并把单项 UI 实现细节固化为仓库级规则。
- 方案 B：工程规则保持 no change，只记录命令索引差异并由 Main Thread 在不覆盖用户改动的前提下决定后续同步。采用此方案。

## 推荐方案

结论是 **durable 工程规则 no change**。当前规则已覆盖本轮实现、测试、设计、文档、兼容、版本和 Git 交付要求，不应为单个富内容 surface 再增加重复条款。

命令层面，`package.json` 新增了 `npm run test:rich-content`，而当前 `AGENTS.md` 的 Current Commands 未列出它；同一清单也未列出已有的 `test:markdown-export`。这属于命令索引漂移，不是富内容工程规则缺口。由于 `AGENTS.md` 在任务基线已是用户 owned 的未暂存修改，且本席位被明确禁止覆盖或修改它，本报告不写入该文件。Main Thread 可在用户改动边界允许时做一次独立、最小的命令索引同步，或在本轮 integration summary 中把该差异记为非阻断残余项。

## 实施步骤

1. 保持现有 typed data、兼容持久化、设计/README、验证和版本规则不变。
2. 把 `test:rich-content` 纳入本轮验证命令清单并以实际通过证据交付。
3. 不修改用户 owned `AGENTS.md`，不接管或更新父 issue、ROSTER、QUEUE；命令索引差异交由 Main Thread 闭环。

## 风险与回滚

- 若未来把 rich body 改成新的主真源、引入不可逆迁移、改 MCP/widget runtime、增加依赖或改变发布合同，应重新触发 Development Standards Lead，并按现有版本/迁移规则更新 `AGENTS.md`。
- 当前没有 MCP runtime 改动，不应仅因 web UI 与 built assets 变化强行触发四处 runtime version bump；若 Main Thread 决定进入正式发布，则仍需执行现行 release prepare/verify 与 Release/stable 流程。
- 命令索引缺少 `test:rich-content` 会降低后续维护者发现聚焦测试的概率，但不影响脚本可执行性或本轮实现正确性；回滚本轮实现时同步移除 package script 与测试文件即可。

## 处理结果

已完成工程规则、命令、版本与发布边界审查。确认本轮不需要新增 durable 工程规则，未修改 `AGENTS.md`、实现、父 issue、ROSTER 或 QUEUE。新增聚焦命令存在且可运行；命令索引差异已作为非阻断后续项明确记录。

## 修改文件

- `agent-reports/resolved/solution-rich-node-content-development-standards.md`

## 验证方式

- `npm run test:rich-content`：通过。
- `git diff --check -- <本轮实现、测试、README、design.md 路径>`：通过。
- `git diff --name-only -- plugins/canvasight/mcp plugins/canvasight/.codex-plugin plugins/canvasight/package-lock.json`：无输出，确认未触发 MCP runtime 版本同步。
- 静态核对 `plugins/canvasight/package.json` 的 build/typecheck/rich-content/Markdown/export/Skills/concurrency 命令与当前验证报告。
- `node plugins/canvasight/skills/canvasight-agent-team/scripts/validate-agent-team.mjs --root /Users/niallyoung/Desktop/Canvasight`：已运行；全仓被既有 legacy report/template 和 QUEUE 漂移阻断，输出未将本报告列为无效。

## 后续风险

- `AGENTS.md` Current Commands 暂未登记 `test:rich-content`，并已有 `test:markdown-export` 索引遗漏；因文件存在用户 owned 变更，本席位未修改。Main Thread 应避免把该用户改动纳入本轮提交，并在集成记录中说明命令索引同步状态。
- 全仓 Agent Team validator 的历史协议债务超出本轮工程规则审查范围，不能把该全局失败误归因于富内容实现或本报告。
- 本报告只证明工程规范与命令边界一致，不替代 Test Supervisor 的浏览器可见、IME、拖拽、链接、保存刷新和必要 native Widget 验收。
