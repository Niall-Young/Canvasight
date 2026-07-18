# Canvasight Agent Team Roster

```yaml
schema_version: 1
roles:
  - role: Product Agent
    status: active
    agent_id: /root/product_agent
    thread_id: null
    created_at: 2026-07-11T11:08:45Z
    last_seen: 2026-07-18T12:11:52Z
    handoff_source: issue-windows-cli-daemon-state-cleanup-0-4-34
    last_report: integration-summary-windows-daemon-stop-candidate-0-4-35
    rebuild_on_new_thread: true
    replaced_by: null
    notes: Confirmed 0.4.35 only tightens internal daemon stop completion and adds no product-contract change
  - role: Design Agent
    status: active
    agent_id: /root/design_agent
    thread_id: null
    created_at: 2026-07-11T11:08:45Z
    last_seen: 2026-07-17T15:38:15Z
    handoff_source: issue-manual-canvas-latest-revision-refresh
    last_report: issue-manual-canvas-latest-revision-refresh
    rebuild_on_new_thread: true
    replaced_by: null
    notes: Specified the right global toolbar refresh action, busy feedback, safe-save wording, and accessibility states
  - role: Design Standards Expert
    status: active
    agent_id: /root/design_standards_expert
    thread_id: null
    created_at: 2026-07-11T11:08:45Z
    last_seen: 2026-07-17T15:59:50Z
    handoff_source: issue-manual-canvas-latest-revision-refresh
    last_report: integration-summary-manual-canvas-latest-revision-refresh
    rebuild_on_new_thread: true
    replaced_by: null
    notes: Added the Manual Canvas Refresh placement, safety, feedback, and navigation-preservation contract
  - role: Development Agent
    status: active
    agent_id: /root/development_agent
    thread_id: 019f7450-40ec-7df0-81de-862b1f8af621
    created_at: 2026-07-11T11:08:45Z
    last_seen: 2026-07-18T12:19:00Z
    handoff_source: issue-windows-cli-daemon-state-cleanup-0-4-34
    last_report: solution-windows-cli-daemon-state-cleanup-0-4-35
    rebuild_on_new_thread: true
    replaced_by: null
    notes: Ownership-safe Windows daemon-state cleanup passed local and Windows Node 20.19 target/control/replacement regression
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
    last_seen: 2026-07-18T11:57:46Z
    handoff_source: issue-windows-cli-daemon-state-cleanup-0-4-34
    last_report: integration-summary-test-supervisor-0-4-35-native-acceptance
    rebuild_on_new_thread: true
    replaced_by: null
    notes: Independently passed exact 0.4.35 native gate; Windows Node 20.19 and complete release matrix subsequently passed
  - role: Customer Support Agent
    status: active
    agent_id: /root/customer_support_agent
    thread_id: null
    created_at: 2026-07-11T11:08:45Z
    last_seen: 2026-07-18T11:57:46Z
    handoff_source: issue-windows-cli-daemon-state-cleanup-0-4-34
    last_report: integration-summary-windows-daemon-stop-candidate-0-4-35
    rebuild_on_new_thread: true
    replaced_by: null
    notes: Reviewed bilingual README and all seven Skills; no user documentation change is needed for the internal lifecycle fix
  - role: Project Management Agent
    status: active
    agent_id: /root/project_management_agent
    thread_id: 019f744e-6e66-7290-be73-bb49037d45c3
    created_at: 2026-07-11T11:08:45Z
    last_seen: 2026-07-18T12:19:00Z
    handoff_source: issue-publish-stable-release-0-4-35
    last_report: integration-summary-release-closure-0-4-35
    rebuild_on_new_thread: true
    replaced_by: null
    notes: Completed guarded v0.4.35 tag, three-platform workflow, Release asset and stable fast-forward closure; v0.4.34 remains frozen
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
