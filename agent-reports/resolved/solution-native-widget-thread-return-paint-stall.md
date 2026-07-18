---
schema_version: 1
report_id: solution-native-widget-thread-return-paint-stall
report_type: solution
status: resolved
owner: Development Agent
created_by: Main Thread
priority: high
version: 2
agent_id: /root/development_agent
thread_id: null
created_at: 2026-07-17T16:08:09Z
updated_at: 2026-07-18T01:59:28Z
depends_on:
  - issue-native-widget-thread-return-paint-stall
related_files:
  - plugins/canvasight/src/App.tsx
  - plugins/canvasight/tests/widget-runtime-smoke.mjs
verification_status: passed
verification_evidence:
  - 0.4.29 composed production widget smoke passed the hidden zero-size fresh-instance recovery gate.
  - MCP, clean distribution, release and plugin validation passed.
  - User confirmed the original Codex Desktop A to B to A white-screen symptom is resolved.
---

# Native Widget Thread 返回首帧白屏解决方案

## Root Cause

Codex 在 Thread 往返时会重建或恢复 native WebView。Canvasight 完成 session/project hydration 后连续等待两个无 timeout 的 `requestAnimationFrame`；后台或尚未合成的 WebView 会暂停 rAF，导致首帧与 ready 延迟，部分实例被宿主替换前始终无法完成。

## 实施结果

- 将 paint yield 改为 rAF 与 200ms timer 竞争，任一完成都会清理另一分支。
- 增加 30 秒有界 renderable gate；只有当前 binding、document visible、fullscreen、canvas connected、CSS visible、正尺寸且应用表面可命中时才上报 ready。
- hidden/zero-size 状态等待 `visibilitychange`、host context、`ResizeObserver` 或 100ms bounded signal，避免后台虚报 ready 或过早失败。
- fresh widget fixture 在 rAF 永不回调、初始 hidden+0×0 时确认 650ms 内无 ready；恢复后要求 1 秒内完整 ready，并检查 rAF cancel 与移除后无迟到 ready。

## 风险与回滚

- 30 秒是启动 wall-clock 上限；真实宿主若让 fresh instance 隐藏超过该上限，会进入可见失败态而不是无限白屏。
- 回滚可撤销 App paint/presentation gate 和对应 smoke hunk；不涉及 `.scatter` 数据格式。

## 验证

- `release:prepare 0.4.29`、widget runtime、MCP smoke、clean distribution、release verify、plugin validator 均通过。
- Test Supervisor 解除代码 blocker，放行 exact 0.4.29 native-host 验收。
- 用户已在真实 Codex Desktop 中确认原始 A → B → A 白屏症状解决；关联 issue 已关闭。
