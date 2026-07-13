---
schema_version: 1
report_id: solution-skill-composition-node-assignment
report_type: solution
status: resolved
owner: Development Agent
created_by: Main Thread
priority: high
version: 1
agent_id: /root/development_agent
thread_id: null
created_at: 2026-07-13T13:31:00Z
updated_at: 2026-07-13T13:31:00Z
depends_on:
  - issue-skill-composition-node-assignment
related_files:
  - plugins/canvasight/mcp/server.source.mjs
  - plugins/canvasight/src/components/TaskNode.tsx
  - plugins/canvasight/src/components/SettingsDialog.tsx
  - plugins/canvasight/src/lib/markdown.ts
  - plugins/canvasight/skills/canvasight-graph-writer/SKILL.md
verification_status: passed
verification_evidence:
  - MCP, dev-server, widget, Markdown, Skill picker, build, release, bundle, distribution, plugin, and Skill validation passed.
  - Browser verified catalog search, Enter and Tab insertion, multiple Skills, Escape, save, persistence, and restore defaults.
---

# Skill 组合与节点级 Skill 分配实现方案

## TL;DR

Canvasight 0.4.12 已实现画布级专业内容 Skill、AI 节点级 Skill 分配和用户手动 `$Skill` 选择，同时保持 Canvasight 唯一写入、revision 校验和固定左到右布局。

## 处理结果

- 复用 Codex app-server `skills/list`，按项目 cwd 返回启用 Skill 的脱敏摘要；新增 `list_canvasight_skills`、Widget `/api/skills` 和刷新/错误 advisory。
- 新增全局 `preferences.json` 与默认关闭的 `aiSkillAssignmentEnabled`；graph context 暴露偏好，write tool 在提交时重新读取并拒绝关闭状态下的 `ai-selected`。
- `frameworkManifest` 支持 `contentMode`、`contentSkills` 和 `skillAssignments`。`skill-led` 跳过默认专业内容补齐，但保留新增/更新节点 coverage、语义关系、revision、原子写入和水平拓扑校验。
- 节点 textarea 支持 `$` 模糊搜索、中文描述、IME、Arrow、Enter/Tab、Escape、刷新、多个 Skill 和手工输入回退，不新增 Page/node 持久化字段。
- Run Markdown 保留正文 `$skill-name`，另用不带 `$` 的节点—Skill 映射限制职责范围。
- 浏览器验证发现并修复 Vite dev API 未转发 `/api/skills` 与 `/api/preferences` 的 parity 缺口。

## 修改文件

- MCP、bundle、Widget/dev API：`plugins/canvasight/mcp/`、`plugins/canvasight/vite.config.ts`
- UI 与 Run：`plugins/canvasight/src/`、`plugins/canvasight/shared/types.ts`
- Skills 与文档：`plugins/canvasight/skills/canvasight-graph-writer/`、`README.md`、`design.md`、`AGENTS.md`
- 测试与发布：`plugins/canvasight/tests/`、manifest/package/lock、`dist/`

## 验证方式

- `npm run typecheck`
- `npm run test:mcp`
- `npm run test:dev-server`
- `npm run test:widget-runtime`
- `npm run test:markdown && npm run test:skills && npm run test:markdown-export`
- `npm run build && npm run check:mcp-bundle && npm run release:verify -- 0.4.12`
- `npm run test:plugin-distribution`
- Plugin validation 与 graph-writer Skill quick validation
- Codex in-app browser 可见交互验证

## 后续风险

- 多 Skill Run 的职责隔离在 V1 是 Markdown 指令契约，不是进程级隔离，必须在真实原生任务中观察 Codex 路由。
- 专业 Skill 内容冲突依赖 graph-writer 在写图前询问，schema 无法独立判断语义冲突。
- 0.4.12 已安装，但宿主尚未重启；原生 ready、同任务 Run、自动分配与 LTR 验收仍由 assigned issue 跟踪。
