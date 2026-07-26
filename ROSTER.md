# Canvasight Agent Team Roster

```yaml
schema_version: 1
roles:
  - role: Product Agent
    status: active
    agent_id: /root/product_agent
    thread_id: null
    created_at: 2026-07-11T11:08:45Z
    last_seen: 2026-07-26T03:10:31Z
    handoff_source: issue-node-rich-text-editor
    last_report: issue-node-rich-text-editor
    rebuild_on_new_thread: true
    replaced_by: null
    notes: Reviewing rich-text v1 scope, Markdown compatibility, and acceptance boundaries
  - role: Design Agent
    status: active
    agent_id: /root/design_agent
    thread_id: null
    created_at: 2026-07-11T11:08:45Z
    last_seen: 2026-07-26T04:51:20Z
    handoff_source: issue-node-rich-text-editor
    last_report: issue-node-rich-text-editor
    rebuild_on_new_thread: true
    replaced_by: null
    notes: Approved Enter-to-exit inline code behavior and increased fenced-code separation for the reported rich-text regression
  - role: Design Standards Expert
    status: active
    agent_id: /root/design_standards_expert
    thread_id: null
    created_at: 2026-07-11T11:08:45Z
    last_seen: 2026-07-26T05:29:57Z
    handoff_source: issue-node-rich-text-editor
    last_report: issue-node-rich-text-editor
    rebuild_on_new_thread: true
    replaced_by: null
    notes: Confirmed Markdown backtick versus single-quotation semantics plus Enter and terminal-Space exit behavior in design.md
  - role: Development Agent
    status: active
    agent_id: /root/development_agent
    thread_id: null
    created_at: 2026-07-11T11:08:45Z
    last_seen: 2026-07-26T05:48:26Z
    handoff_source: solution-node-rich-text-editor
    last_report: solution-node-rich-text-editor
    rebuild_on_new_thread: true
    replaced_by: null
    notes: Closed rich-text inline-code semantics and React 185 recovery after exact 0.4.36 user native acceptance
  - role: Development Standards Lead
    status: active
    agent_id: /root/development_standards_lead
    thread_id: null
    created_at: 2026-07-11T11:08:45Z
    last_seen: 2026-07-18T12:19:00Z
    handoff_source: issue-windows-cli-daemon-state-cleanup-0-4-34
    last_report: integration-summary-windows-daemon-stop-candidate-0-4-35
    rebuild_on_new_thread: true
    replaced_by: null
    notes: Confirmed the 0.4.35 lifecycle fix needs no AGENTS.md or command-reference update
  - role: Test Supervisor Agent
    status: active
    agent_id: /root/test_supervisor_agent
    thread_id: 019f744e-868a-7ff2-990a-97ebc5777c67
    created_at: 2026-07-11T11:08:45Z
    last_seen: 2026-07-26T05:51:42Z
    handoff_source: issue-widget-viewport-recovery-save-count
    last_report: issue-widget-viewport-recovery-save-count
    rebuild_on_new_thread: true
    replaced_by: null
    notes: Passed final React 185 and rich-text native closure; owns the separate baseline-origin viewport save-count fixture risk
  - role: Customer Support Agent
    status: active
    agent_id: /root/customer_support_agent
    thread_id: null
    created_at: 2026-07-11T11:08:45Z
    last_seen: 2026-07-26T05:29:57Z
    handoff_source: issue-node-rich-text-editor
    last_report: issue-node-rich-text-editor
    rebuild_on_new_thread: true
    replaced_by: null
    notes: Re-reviewed required product and Skill files; Markdown backticks are already documented by contract and the Space exit refinement needs no bilingual README change
  - role: Project Management Agent
    status: active
    agent_id: /root/project_management_agent
    thread_id: 019f744e-6e66-7290-be73-bb49037d45c3
    created_at: 2026-07-11T11:08:45Z
    last_seen: 2026-07-26T05:54:02Z
    handoff_source: integration-summary-canvasight-0-4-36-native-acceptance-closure
    last_report: integration-summary-canvasight-0-4-36-native-acceptance-closure
    rebuild_on_new_thread: true
    replaced_by: null
    notes: Owns selective staging, staged-manifest review, diff checks, and the final Chinese conventional commit for the verified 0.4.36 native acceptance closure
  - role: Skill Expert Agent
    status: active
    agent_id: /root/skill_expert_agent
    thread_id: 019f5f69-51fb-7f22-bdd0-0922f855b680
    created_at: 2026-07-11T11:08:45Z
    last_seen: 2026-07-14T07:06:04Z
    handoff_source: issue-update-creates-numbered-duplicates
    last_report: issue-update-creates-numbered-duplicates
    rebuild_on_new_thread: true
    replaced_by: null
    notes: Hardened and validated the update Skill against extra npm, build, release, install, Git, and cleanup side effects
```
