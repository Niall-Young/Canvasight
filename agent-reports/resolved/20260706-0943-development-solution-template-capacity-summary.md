---
status: resolved
report_type: solution
owner: development-agent
created_by: development-agent
priority: medium
created_at: 2026-07-06 09:43
updated_at: 2026-07-06 09:43
related_issue: agent-reports/resolved/20260706-0943-product-issue-template-capacity-summary.md
related_files:
  - plugins/canvasight/mcp/server.mjs
  - plugins/canvasight/src/App.tsx
  - plugins/canvasight/tests/mcp-smoke.mjs
---

# 模板容量与摘要优先读取方案

## 负责 Agent

Development Agent

## 对应问题

`agent-reports/resolved/20260706-0943-product-issue-template-capacity-summary.md`

## Root Cause

模板保存和 AI 扫描共用了完整模板列表：保存时缺少用户确认的容量策略，读取时缺少轻量索引和按 ID 获取完整模板的二段式接口。

## 调研过程

- 检查 MCP server 的模板读写路径，确认持久层曾经通过 slice 控制数量，用户不可见。
- 检查 React 模板侧栏，确认没有容量显示或删除入口。
- 检查 graph-writer skill，确认 AI 模板复用只说明先列出模板，但工具本身返回完整内容。
- 检查测试，确认 MCP smoke 没覆盖容量上限、摘要列表和完整模板读取分离。

## 可选方案

- 方案 A：继续在保存时自动删除最旧模板。实现简单，但用户数据会被静默移除，不符合产品预期。
- 方案 B：保存到 200 个后拒绝写入，GUI 提示用户删除或显式替换最旧模板。AI 读取拆成 summary list 和 get-by-id。实现稍多，但行为可见、可审计、上下文稳定。

## 推荐方案

采用方案 B。容量属于用户资产边界，必须显式告知；AI 读取模板属于上下文成本边界，必须摘要优先。

## 实施步骤

1. 在共享类型中定义 `nodeTemplateLimit = 200` 和 `NodeTemplateSummary`。
2. 服务端移除静默裁剪，新增 409 `template_limit_reached`，支持显式 `replaceOldest`。
3. `list_canvasight_node_templates` 返回摘要；新增 `get_canvasight_node_template` 返回完整模板。
4. GUI 侧栏显示容量、支持删除模板；保存满额时打开模板侧栏和模态提示。
5. 更新 API client、本地 fallback、翻译、样式和 smoke test。
6. 更新 README、design.md、AGENTS.md、graph-writer skill。

## 风险与回滚

风险是外部调用方如果依赖 `list_canvasight_node_templates` 直接拿完整 `body`，需要改为二段式调用。回滚方式是恢复旧 list contract，但不建议回滚，因为旧行为会增加上下文风险。

## 处理结果

已修复

## 修改文件

- plugins/canvasight/shared/types.ts
- plugins/canvasight/mcp/server.mjs
- plugins/canvasight/src/lib/canvasightApi.ts
- plugins/canvasight/src/App.tsx
- plugins/canvasight/src/components/ConfirmDialog.tsx
- plugins/canvasight/src/components/RightDrawer.tsx
- plugins/canvasight/src/lib/translations.ts
- plugins/canvasight/src/styles/app.css
- plugins/canvasight/tests/mcp-smoke.mjs
- plugins/canvasight/package.json
- plugins/canvasight/package-lock.json
- plugins/canvasight/.codex-plugin/plugin.json
- plugins/canvasight/skills/canvasight-graph-writer/SKILL.md
- plugins/canvasight/skills/canvasight-graph-writer/references/graph-writing.md
- README.md
- design.md
- AGENTS.md

## 验证方式

- `python3 /Users/niallyoung/.codex/skills/.system/skill-creator/scripts/quick_validate.py plugins/canvasight/skills/canvasight-graph-writer`
- `npm run typecheck`
- `npm run test:mcp`
- `npm run build`
- `python3 /Users/niallyoung/.codex/skills/.system/plugin-creator/scripts/validate_plugin.py /Users/niallyoung/Desktop/Canvasight/plugins/canvasight`
- `git diff --check`
- Playwright 打开模板侧栏，验证容量 `0 / 200`、注入 200 个模板后显示 `200 / 200`、删除模板弹出应用内确认 dialog。

## 后续风险

当前摘要是正文前 240 字符的确定性预览，不需要 AI，不会额外消耗模型调用。未来如需更高质量的语义匹配，应单独增加本地索引、分页或用户触发的摘要生成流程。
