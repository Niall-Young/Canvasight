---
schema_version: 1
report_id: solution-update-numbered-duplicates-file-provider
report_type: solution
status: resolved
owner: Development Agent
created_by: Development Agent
priority: high
version: 4
agent_id: /root/development_agent
thread_id: 019f5f69-51fb-7f22-bdd0-0922f855b680
created_at: 2026-07-14T07:05:00Z
updated_at: 2026-07-14T07:09:28Z
depends_on:
  - issue-update-creates-numbered-duplicates
related_issue: issue-update-creates-numbered-duplicates
related_files:
  - plugins/canvasight/scripts/update-canvasight.mjs
  - plugins/canvasight/tests/update-canvasight-smoke.mjs
  - plugins/canvasight/skills/canvasight-update/SKILL.md
verification_status: passed
verification_evidence:
  - The 239 numbered source duplicates were born at 2026-07-14T03:41:01Z, one second after an archived task ran npm ci in the Desktop checkout.
  - The Desktop directory is managed by the com.apple.CloudDocs.iCloudDriveFileProvider domain.
  - A real updater --check and repeated plain and --available plugin listings created no new numbered files or plugin-install directories.
  - An isolated plugin add copied the 239 already polluted source files once; a second add kept the count at 239.
  - Main Thread removed 1661 numbered files only after canonical-sibling and byte-identity checks; repository node_modules and the active 0.4.18 cache now have zero numbered files.
  - Eleven unmatched files remain only under abandoned plugin-install-* temporary directories and were preserved.
---

# Desktop File Provider 依赖重装生成编号副本的开发结论

## 负责 Agent

Development Agent

## 对应问题

`agent-reports/resolved/issue-update-creates-numbered-duplicates.md`

## Root Cause

编号副本不是 Canvasight updater 或 `codex plugin list --available --json` 生成的。仓库位于 macOS iCloud File Provider 管理的 `Desktop`；归档任务在 `2026-07-14T03:41:00Z` 于 `plugins/canvasight` 执行 `npm ci`，239 个 `原文件名 2.ext` 副本统一出生于下一秒 `2026-07-14T03:41:01Z`。后续本地插件安装把已污染的源码树复制到 cache 和 `plugin-install-*` 临时目录，因此这些位置是传播结果，不是生成源。

## 调研过程

1. 对开发 checkout、`0.4.18` cache 和残留 `plugin-install-*` 目录统计编号副本并抽样核对 SHA-256。
2. 对照文件 birthtime 与归档任务时间线，定位到 `npm ci` 的下一秒。
3. 检查 `Desktop` 扩展属性，确认 `com.apple.CloudDocs.iCloudDriveFileProvider` 管理域。
4. 运行真实 updater `--check`、普通与 `--available` plugin list，前后编号副本和临时目录均不增加。
5. 使用隔离 `CODEX_HOME` 安装本地插件：首次安装复制源树已有 239 个副本，第二次仍为 239，没有生成更多编号文件。

## 可选方案

- 推测性改写 updater 查询或自动删除编号文件：证据不支持，且自动删除可能误伤用户文件，否决。
- 在更新 Skill 中明确检查/更新只运行 bundled updater，不附带 `npm ci`、`npm install`、build 或 release 验证：采用，由 Skill Expert Agent 审查实施。
- 将开发 checkout 移出 iCloud Desktop/File Provider 同步目录：作为开发环境的根治建议，由 Main Thread 与用户确认。

## 推荐方案

保持 `update-canvasight.mjs` 与 updater smoke tests 不变；它们现有的零 mutation 测试和真实复核均通过。收紧 `canvasight-update` Skill 的执行边界，禁止在检查或更新任务中额外重装依赖或运行构建/发布门禁。现有副本只在明确确认字节一致并获得清理授权后处理，不由通用 updater 自动删除。

## 实施步骤

1. Development Agent 完成因果诊断、真实命令复核与隔离安装复核。
2. Skill Expert Agent 已在 `canvasight-update` Skill 中加入“只运行 updater”的明确禁止项，并通过 Skill smoke 与 quick validator。
3. Main Thread 已完成一次性保守清理：仅在 canonical sibling 存在且 `cmp` 字节一致时删除，共 1661 个；没有匹配 sibling 的文件不删除。

## 风险与回滚

不修改 updater 代码，因此没有运行时回归或版本 bump。Skill 约束若影响合法更新流程，可回滚该文字变更；不得通过回滚或清理删除 `.scatter`、用户资产或未确认相同的文件。

## 处理结果

已明确根因并排除 updater 代码缺陷；开发侧没有做推测性代码修改，Skill Expert Agent 已完成工作流防护，Main Thread 已完成经字节一致性确认的一次性副本清理。

## 修改文件

- `agent-reports/resolved/solution-update-numbered-duplicates-file-provider.md`
- `agent-reports/resolved/issue-update-creates-numbered-duplicates.md`
- `agent-reports/QUEUE.md`
- `ROSTER.md`
- `plugins/canvasight/skills/canvasight-update/SKILL.md`
- `plugins/canvasight/tests/skills-smoke.mjs`

## 验证方式

- 对 updater `--check`、plugin list、隔离 `CODEX_HOME` plugin add 做前后文件计数。
- 用 `stat` 对齐编号副本 birthtime 与归档任务 `npm ci` 时间。
- 用 `shasum -a 256` 确认抽样副本与原文件字节一致。
- 用 `xattr -l /Users/niallyoung/Desktop` 确认 File Provider 管理域。
- 清理后复核：repo `node_modules` 为 0，活动 `0.4.18` cache 为 0；仅废弃 `plugin-install-*` 临时目录保留 11 个无匹配 sibling 文件。

## 后续风险

只要开发 checkout 仍位于 File Provider 同步目录，未来依赖重装仍可能触发同类同步冲突。废弃 `plugin-install-*` 临时目录中的 11 个文件因缺少 canonical sibling，不能证明为安全重复项并已刻意保留；通用 updater 仍不得自动清理。
