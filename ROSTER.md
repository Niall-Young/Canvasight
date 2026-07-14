# Canvasight Agent Team Roster

```yaml
schema_version: 1
roles:
  - role: Product Agent
    status: active
    agent_id: /root/product_agent
    thread_id: null
    created_at: 2026-07-11T11:08:45Z
    last_seen: 2026-07-14T06:22:20Z
    handoff_source: issue-pending-confirmations-bypass-inline-gate
    last_report: integration-summary-pending-confirmations-inline-gate
    rebuild_on_new_thread: true
    replaced_by: null
    notes: Reviewed the pending-confirmation gate and non-blocking open-question exception
  - role: Design Agent
    status: active
    agent_id: /root/design_agent
    thread_id: null
    created_at: 2026-07-11T11:08:45Z
    last_seen: 2026-07-14T05:56:32Z
    handoff_source: issue-inline-framework-questions
    last_report: integration-summary-inline-framework-questions
    rebuild_on_new_thread: true
    replaced_by: null
    notes: Rebuilt on the current thread to review the inline framework-question message component and update design.md
  - role: Design Standards Expert
    status: active
    agent_id: /root/design_standards_expert
    thread_id: null
    created_at: 2026-07-11T11:08:45Z
    last_seen: 2026-07-14T02:34:38Z
    handoff_source: issue-skill-picker-completeness-position
    last_report: integration-summary-skill-picker-caret-combobox
    rebuild_on_new_thread: true
    replaced_by: null
    notes: Rebuilt on the current thread to align design.md with the caret-anchored compact combobox contract
  - role: Development Agent
    status: active
    agent_id: /root/development_agent
    thread_id: 019f5f69-51fb-7f22-bdd0-0922f855b680
    created_at: 2026-07-11T11:08:45Z
    last_seen: 2026-07-14T07:06:04Z
    handoff_source: issue-update-creates-numbered-duplicates
    last_report: issue-update-creates-numbered-duplicates
    rebuild_on_new_thread: true
    replaced_by: null
    notes: Resolved numbered-duplicate workflow by proving updater non-causality and integrating the single-command update Skill guardrail
  - role: Development Standards Lead
    status: active
    agent_id: /root/development_standards_lead
    thread_id: null
    created_at: 2026-07-11T11:08:45Z
    last_seen: 2026-07-13T14:46:58Z
    handoff_source: issue-cross-thread-page-concurrent-edit
    last_report: integration-summary-human-ai-concurrent-rebase
    rebuild_on_new_thread: true
    replaced_by: null
    notes: Rebuilt on the current thread to synchronize durable context-bound AI rebase and concurrent-save standards
  - role: Test Supervisor Agent
    status: blocked
    agent_id: /root/test_supervisor_agent
    thread_id: 019f5f69-51fb-7f22-bdd0-0922f855b680
    created_at: 2026-07-11T11:08:45Z
    last_seen: 2026-07-14T07:06:04Z
    handoff_source: issue-update-creates-numbered-duplicates
    last_report: issue-update-creates-numbered-duplicates
    rebuild_on_new_thread: true
    replaced_by: null
    notes: Numbered-duplicate diagnosis and updater regression passed; prior native-host acceptance blockers remain unresolved and keep this seat blocked
  - role: Customer Support Agent
    status: active
    agent_id: /root/customer_support_agent
    thread_id: 019f5f69-51fb-7f22-bdd0-0922f855b680
    created_at: 2026-07-11T11:08:45Z
    last_seen: 2026-07-14T07:06:04Z
    handoff_source: issue-update-creates-numbered-duplicates
    last_report: issue-update-creates-numbered-duplicates
    rebuild_on_new_thread: true
    replaced_by: null
    notes: Confirmed the bilingual README already states the zero-mutation update contract; no README change required
  - role: Project Management Agent
    status: active
    agent_id: /root/project_management_agent
    thread_id: 019f5f69-51fb-7f22-bdd0-0922f855b680
    created_at: 2026-07-11T11:08:45Z
    last_seen: 2026-07-14T07:06:04Z
    handoff_source: issue-update-creates-numbered-duplicates
    last_report: issue-update-creates-numbered-duplicates
    rebuild_on_new_thread: true
    replaced_by: null
    notes: Rebuilding on the current thread for selective staging and commit closure of the numbered-duplicate workflow fix
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
