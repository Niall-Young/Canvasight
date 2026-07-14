---
schema_version: 1
report_id: issue-update-creates-numbered-duplicates
report_type: issue
status: resolved
owner: Development Agent
created_by: Main Thread
priority: high
version: 4
agent_id: /root/development_agent
thread_id: 019f5f69-51fb-7f22-bdd0-0922f855b680
created_at: 2026-07-14T06:58:09Z
updated_at: 2026-07-14T07:08:28Z
depends_on: []
related_files:
  - plugins/canvasight/scripts/update-canvasight.mjs
  - plugins/canvasight/tests/update-canvasight-smoke.mjs
  - plugins/canvasight/skills/canvasight-update/SKILL.md
  - plugins/canvasight/tests/skills-smoke.mjs
  - plugins/canvasight/node_modules
  - plugins/canvasight/dist
verification_status: passed
verification_evidence:
  - The development checkout and installed cache each contain 239 byte-identical files whose names add a space and 2 before the extension.
  - The 239 source duplicates share birthtime 2026-07-14T03:41:01Z, one second after an archived task ran npm ci in the Desktop checkout.
  - Real updater checks and isolated plugin list/add probes created no new numbered files; plugin add only copied existing pollution.
  - Skill Expert Agent made the update workflow a single bundled-updater command and added exact smoke assertions forbidding npm, build, release, Git, cleanup, and direct plugin commands.
  - Main Thread removed 1661 numbered files only when a canonical sibling existed and cmp confirmed byte identity; the repository node_modules and active 0.4.18 cache now each contain zero numbered files.
  - Eleven unmatched numbered files remain only in abandoned plugin-install-* temporary directories and were intentionally preserved.
solution_report: agent-reports/resolved/solution-update-numbered-duplicates-file-provider.md
---

# 检查或更新 Canvasight 会生成编号重复文件

## TL;DR

用户每次检查更新或执行更新后都会看到 `原文件名 2.ext` 一类副本，且是否存在新版本都可能发生。

## 发现者

Main Thread

## 提交 Agent

Main Thread

## 建议交接 Agent

Development Agent

## 问题描述

更新检查被定义为只读，但当前本地开发安装、插件缓存和历史 `dist` 中出现批量编号副本，说明检查或插件状态读取路径触发了不应有的安装/复制副作用。

## 现象

- `plugins/canvasight/node_modules` 有 239 个 `* 2*` 文件。
- 当前 `0.4.18` 插件缓存也有 239 个同名副本。
- 多个 `plugin-install-*` 临时目录残留 52 至 229 个副本。
- 抽样副本与原文件 SHA-256 完全一致。

## 复现方式

1. 记录开发目录、插件缓存和临时安装目录的编号副本数量。
2. 走 Canvasight `--check` 或 `--update` 实际路径。
3. 比较副本数量、临时目录和文件时间戳变化。

## 影响范围

污染开发工作区、安装缓存和安装临时目录；可能放大插件快照、造成构建噪声并掩盖真正的更新结果。

## 证据

- 抽样 `tinyglobby/README 2.md` 与 `README.md` 内容哈希一致。
- 既有集成总结已记录四个 `plugins/canvasight/dist/* 2.*` 未跟踪副本。

## 初步归因

已排除 `codex plugin list --available --json` 与 updater：副本生成时间精确对应 File Provider 管理的 Desktop checkout 中一次 `npm ci`，后续 cache 和临时安装目录只是复制了已污染源树。

## 交付给哪个 Agent

Development Agent

## 需要回答的问题

- `--check` 的哪条 Codex CLI 调用产生写入？
- 怎样保持检查完全只读，同时不破坏官方 stable 更新和回滚合同？
- 怎样用隔离 fixture 回归“没有新增文件”？

## 相关文件

- `plugins/canvasight/scripts/update-canvasight.mjs`
- `plugins/canvasight/tests/update-canvasight-smoke.mjs`

## 期望结果

检查无任何文件系统写入；无更新时更新操作也不写入；有更新时只安装一个完整不可变快照，不制造编号副本或残留临时安装目录。

## Closure Criteria

- [x] 问题原因明确
- [x] 方案报告已回写
- [x] 修改文件已记录
- [x] 验证方式已记录
- [x] 后续风险已记录

## 当前状态

resolved

## 处理结果

已解决。updater 本身保持不变；更新 Skill 已收紧为只运行一个 bundled-updater 命令，不再附带会触发 File Provider 冲突的依赖重装、构建、发布、Git、清理或直接 plugin 命令。Main Thread 另完成一次性保守清理：只删除存在 canonical sibling 且 `cmp` 字节一致的 1661 个编号副本。

## 修改文件

- `agent-reports/resolved/solution-update-numbered-duplicates-file-provider.md`
- `agent-reports/resolved/issue-update-creates-numbered-duplicates.md`
- `agent-reports/QUEUE.md`
- `ROSTER.md`
- `plugins/canvasight/skills/canvasight-update/SKILL.md`
- `plugins/canvasight/tests/skills-smoke.mjs`

## 验证方式

- 真实 updater `--check` 前后文件计数无变化。
- 隔离 `CODEX_HOME` 中普通/`--available` list 不写文件，重复 plugin add 的编号文件计数保持 239。
- `stat` 对齐 birthtime 与归档任务 `npm ci` 时间；`xattr` 确认 Desktop 属于 iCloud File Provider。
- `npm run test:skills` 通过，并由 Skill quick validator 确认 `canvasight-update` 有效。
- 清理后 `plugins/canvasight/node_modules` 与活动 `0.4.18` cache 的编号文件计数均为 0；废弃 `plugin-install-*` 临时目录中的 11 个无匹配 sibling 文件保留。

## 后续风险

仓库继续位于 File Provider 同步 Desktop 时，未来 `npm ci` / `npm install` 仍可能再次触发冲突。废弃 `plugin-install-*` 临时目录仍有 11 个没有 canonical sibling、无法证明字节重复的编号文件，因此按安全边界保留；updater 不自动删除它们。
