---
schema_version: 1
report_id: integration-summary-native-widget-representation-rejection-0-4-33
report_type: integration-summary
status: resolved
owner: Main Thread
created_by: Main Thread
priority: high
version: 1
agent_id: /root
thread_id: 019f744d-c7f1-7383-8195-7478c2cd835e
created_at: 2026-07-18T10:50:41Z
updated_at: 2026-07-18T10:50:41Z
depends_on:
  - issue-native-widget-task-switch-remount-blank-0-4-32
  - issue-publish-stable-release-0-4-33
  - solution-native-widget-task-switch-remount-presentation-retry-0-4-33
related_files:
  - plugins/canvasight/src/App.tsx
  - plugins/canvasight/src/lib/widgetBridge.ts
  - plugins/canvasight/tests/widget-runtime-smoke.mjs
verification_status: passed
verification_evidence:
  - Exact 0.4.33 restarted-host A to B to A reproduced the white Canvasight panel.
  - Same instance completed hydration before recovery and reported verified 788 by 794 ready only after the user collapsed and reopened the Codex sidebar.
  - Worktree was clean, no v0.4.33 tag exists, and origin stable remains v0.4.28.
---

# 0.4.33 原生 task-return re-presentation 否决总结

## 本轮目标

- 用 exact 0.4.33 验证两次有界 fullscreen re-presentation 是否能消除任务往返白屏。

## 处理结果

失败。首次打开通过 strict ready；从另一个 Codex 任务切回后，fresh `widget-defac5c1-0d7e-470e-8498-8fa7688b078c` 于 `10:46:42.025Z` 完成项目水合，但右侧面板保持纯白。用户点击 Codex 侧栏折叠/展开按钮后，同一实例才在 `10:46:51.854Z` 以 788×794 上报 verified ready。

## Agent 输入

- Development Agent：SDK 没有与侧栏 collapse/reopen 等价的安全 actuator；teardown 无 reopen，禁止使用。inline→fullscreen 只能作为一次性受控实验。
- Test Supervisor Agent：真实宿主失败优先于全部 fake-host 通过；下一实验必须严格有界、无重复水合/保存/size-changed/false-ready，并检查闪烁与 winning instance。
- Project Management Agent：0.4.33 永久禁发，远端保持 v0.4.28；下一 runtime 候选必须使用 0.4.34。
- Main Thread：README、design.md、AGENTS.md 与 Skill 均无需因失败实验更新；报告与发布门禁需回写。

## 验证记录

- 首次 accepted instance：`widget-f0b38f19-0d58-4d77-81a7-d68dbdb707a3`，fullscreen 788×794，完整 ready。
- task-return fresh instance：`widget-defac5c1-0d7e-470e-8498-8fa7688b078c`，hydration 后约 9.8 秒仅在宿主侧栏 toggle 后 ready。
- 截图：toggle 前纯白；toggle 后同一 Canvasight Page 正常显示。

## 未解决 / 后续风险

- 目前没有已验证的插件内安全恢复动作。下一候选最多验证一次 host-supported inline→fullscreen pulse，并必须带 presentation diagnostics；若仍失败，停止盲目升版并归为 Codex host presentation/layout 缺陷。
- 用户当前手工恢复仍是折叠并重新打开 Codex 侧栏，但该操作不能作为 Release acceptance。

## Git 状态

- HEAD: `328815871d78c8e2b44df5ae6a1cff265687d13e`
- worktree before report update: clean
- origin/main: `ca0015ae3baacebf58a82ac09b2c9e645d2e470f`
- origin/stable: `73ecda757031b534705c3b214f3d63ffa00bfc65` (v0.4.28)
- v0.4.33 tag/Release: absent
