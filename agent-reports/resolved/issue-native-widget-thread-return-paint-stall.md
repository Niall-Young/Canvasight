---
schema_version: 1
report_id: issue-native-widget-thread-return-paint-stall
report_type: issue
status: resolved
owner: Development Agent
created_by: Main Thread
priority: high
version: 4
agent_id: /root/development_agent
thread_id: null
created_at: 2026-07-17T15:51:40Z
updated_at: 2026-07-18T01:59:28Z
depends_on: []
related_files:
  - plugins/canvasight/src/App.tsx
  - plugins/canvasight/tests/widget-runtime-smoke.mjs
verification_status: passed
verification_evidence:
  - Automated build, widget runtime, MCP, distribution, release and plugin validation passed for 0.4.29.
  - User confirmed on 2026-07-18 that the original Codex Desktop thread-return white-screen symptom is resolved.
  - The user accepted the concrete A to B to A white-screen issue as resolved; broader native-host controls remain integration-level residual risk.
solution_report: agent-reports/resolved/solution-native-widget-thread-return-paint-stall.md
---

# Native Widget 返回 Thread 后首帧长时间白屏

## TL;DR

Codex 在 Thread 往返时可能重建 Canvasight WebView；项目 hydration 已完成后，启动流程仍连续等待两个无界 `requestAnimationFrame`，被后台/恢复中的宿主节流时会让首帧和 ready 延迟数秒到十余秒。

## 问题描述

用户从 Canvasight 所在 Thread 切换到其他 Thread，再返回并打开画布时，右侧 native widget 先显示纯白区域，等待一段时间后画布才出现。画布数据最终可见，但白屏期间没有可靠进度反馈。

## 证据与归因

- 同一 Session/OpenAttempt 在 Thread 往返期间产生多个新的 `widgetInstanceId`，部分实例停在 `hydrating_project` 后未 ready。
- 一次异常实例的 session/project API 已完成，随后约 15.9 秒才调用 widget-ready；daemon API 仅耗时几十到数百毫秒。
- `App.tsx` 在 hydration 后连续等待两次只有 rAF、没有 timeout fallback 的 `nextPaint()`。
- 现有 widget runtime smoke 只隐藏和恢复同一 iframe，没有覆盖物理实例重建或 rAF 暂停。

## 期望结果

- native widget readiness 不依赖无界 rAF；rAF 被节流时应通过短时 timeout fallback 继续尺寸验证。
- 正常前台路径仍优先等待真实绘制帧，不虚报 React/project/canvas ready。
- 自动化覆盖 fresh widget instance 的 rAF 暂停场景，并确认 ready 仍携带完整实例与非零画布证据。
- 真实 Codex native-host 完成 Thread A → B → A 往返验收；缺少该证据时交付必须标记 `unverified`。

## Closure Criteria

- [x] 有界 paint yield 替代无界双 rAF，且 timer/rAF 清理正确。
- [x] 回归测试在 rAF 不回调时仍于有界时间内 verified ready。
- [x] typecheck、build、widget runtime、MCP、plugin distribution 与 plugin validator 通过。
- [x] 插件运行时版本与生成 MCP/web 产物同步。
- [x] 用户在真实 Codex Desktop 中确认原始 Thread 往返白屏症状已解决。

## 当前状态

0.4.29 实现与自动化验证完成；用户已确认原始 Thread 返回白屏症状消失，本 issue 关闭。有效画布控制、同任务 Run 与迟到 metadata 未形成的完整证据继续作为集成级显式风险记录，不扩大本次用户确认的范围。

## 处理结果

- rAF 最多等待 200ms，timeout fallback 会取消未决 frame。
- hidden / zero-size 实例不会提前 ready；恢复可见、fullscreen、正尺寸并命中应用表面后才提交实例绑定的 ready evidence。
- fresh-instance smoke 覆盖隐藏等待、恢复后 1 秒内 ready、完整证据、清理和无迟到 ready。

## 修改文件

- `plugins/canvasight/src/App.tsx`
- `plugins/canvasight/tests/widget-runtime-smoke.mjs`
- 四处 0.4.29 版本字段、生成 MCP bundle 与 web dist

## 验证方式

- `npm run release:prepare -- 0.4.29`
- `npm run test:widget-runtime`
- `npm run check:mcp-bundle`
- `npm run test:mcp`
- `npm run test:plugin-distribution`
- `npm run release:verify -- 0.4.29`
- plugin validator

## 后续风险

- 用户已提供真实宿主中原始往返白屏症状消失的验收反馈；exact 版本身份、画布控制、同任务 Run 和迟到 metadata 未在本轮形成完整证据。
- Agent Team validator 仍被仓库既有 legacy report/template/QUEUE schema debt 阻断。
