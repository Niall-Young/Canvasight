---
schema_version: 1
report_id: integration-summary-plugin-independent-stable-install
report_type: integration-summary
status: resolved
owner: Main Thread
created_by: Main Thread
priority: high
version: 1
agent_id: /root
thread_id: 019f7012-d49e-73b2-9e4c-d65be95feeb1
created_at: 2026-07-17T12:45:51Z
updated_at: 2026-07-17T12:45:51Z
depends_on:
  - issue-plugin-install-depends-on-project-directory
  - solution-plugin-independent-stable-install
related_files:
  - README.md
  - ROSTER.md
  - agent-reports/QUEUE.md
  - agent-reports/resolved/issue-plugin-install-depends-on-project-directory.md
  - agent-reports/resolved/solution-plugin-independent-stable-install.md
verification_status: passed
verification_evidence:
  - CLI 0.139.0 and 0.137.0 resolve the independent installation from outside the repository.
  - Official stable snapshot and immutable cache agree at Canvasight 0.4.28.
  - Canvas and user-state hashes are unchanged.
  - Plugin validation passed; Agent Team validation remains blocked only by pre-existing legacy report/template/queue debt.
---

# Canvasight 独立稳定安装集成总结

## 本轮目标

- 消除插件对桌面开发仓库目录的运行依赖。
- 保留 Canvasight 0.4.28、启用状态、画布数据和用户设置。
- 补齐中英文安装与故障恢复说明。

## Agent 状态

- Product Agent：Main Thread 代行；范围限定为安装来源转换，不升级或修改运行时代码。
- Design Agent：无 UI 改动，不需重建。
- Development Agent：核验并复核 local -> official Git stable 转换。
- Test Supervisor Agent：完成双 CLI、外部 cwd、snapshot/cache 和数据完整性复核。
- Customer Support Agent：审查全部必需来源并确认 README 需要中英文同步更新。
- Design Standards Expert：无视觉/交互变化，`design.md` 不变。
- Development Standards Lead：无持久流程变化，`AGENTS.md` 不变。
- Project Management Agent：记录 clean baseline `73ecda7` 并规定报告范围的选择性 Git 闭环。
- Skill Expert Agent：Skills 和触发边界未变化，不需更新。

## 已解决

- `canvasight-local` marketplace root 从桌面仓库切换到 Codex 管理的 Git snapshot。
- Canvasight 仍为 installed/enabled 0.4.28，source path 不再包含桌面仓库。
- README 明确正式独立安装、本地开发安装、目录删除症状和迁移方法。

## 验证

- Git snapshot：官方 origin、`stable`、HEAD `73ecda757031b534705c3b214f3d63ffa00bfc65`、clean。
- Codex CLI 0.139.0 与 0.137.0 均从项目外解析相同的 marketplace root 和插件路径。
- Snapshot/cache manifest、MCP bundle 与 web build 哈希一致。
- `.scatter/scatter.json`、`~/.canvasight/preferences.json`、`~/.canvasight/state.json` 前后 SHA-256 相同；附件目录仍为转换前文件。
- Plugin validator passed。
- Agent Team validator 被既有 legacy reports、旧模板和 QUEUE 格式债务阻断；本轮未扩大该债务。

## 未解决 / 后续风险

- 当前 Desktop 尚未重启，不能在旧宿主任务中完成 native-host acceptance。用户需完全重启 Codex Desktop，新建任务并重新 `@Canvasight`。
- 当前 CLI 以 `config.toml` marketplace 记录和 Git checkout 为权威状态；没有 `.codex-marketplace-install.json` 属正常行为，不应手工补文件。

## Git 状态

- branch: `main`
- baseline: `73ecda757031b534705c3b214f3d63ffa00bfc65`
- approved scope: `README.md`, `ROSTER.md`, `agent-reports/QUEUE.md`, and the three current resolved reports
- planned subject: `docs: 说明 Canvasight 独立安装`
- external environment state: not staged; Codex marketplace/config/cache updated in place
