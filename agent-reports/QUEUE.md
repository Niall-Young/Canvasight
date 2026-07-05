# Agent Report Queue

This is the active queue index for the Canvasight Agent Team. It points to report files instead of duplicating their full content.

Protocol effective from `2026-07-05 19:14`. Older Markdown files directly under `agent-reports/` are legacy records and do not need retroactive migration.

## Open

None.

## Assigned

None.

## Recently Resolved

- `agent-reports/resolved/20260705-2323-integration-summary-open-target-system-browser.md` - integrated Codex in-app browser as the default Canvasight open target.
- `agent-reports/resolved/20260705-2323-development-solution-open-target-system-browser.md` - removed default system-browser launch and added explicit external-browser opt-in.
- `agent-reports/resolved/20260705-2323-product-issue-open-target-system-browser.md` - resolved Canvasight opening directly in the system browser.
- `agent-reports/resolved/20260705-2311-integration-summary-agent-team-agents-md-persistence.md` - integrated default AGENTS.md persistence for Canvasight Agent Team across Codex threads.
- `agent-reports/resolved/20260705-2311-development-solution-agent-team-agents-md-persistence.md` - changed Agent Team bootstrap from opt-in AGENTS.md edits to default minimal persistence.
- `agent-reports/resolved/20260705-2311-product-issue-agent-team-agents-md-persistence.md` - resolved cross-thread loss of Agent Team rules when AGENTS.md was not updated.
- `agent-reports/resolved/20260705-2257-integration-summary-agents-md-bootstrap.md` - integrated AGENTS.md bootstrap rules into Agent Team skill, Run contract, README, and version bump.
- `agent-reports/resolved/20260705-2257-development-solution-agents-md-bootstrap.md` - implemented controlled AGENTS.md bootstrap behavior for Canvasight Agent Team.
- `agent-reports/resolved/20260705-2257-product-issue-agents-md-bootstrap.md` - resolved ambiguity around whether the skill requires project AGENTS.md updates.
- `agent-reports/resolved/20260705-2242-integration-summary-agent-team-persistent-roster.md` - integrated persistent Agent Team roster, report status write-back, docs, version bump, and verification.
- `agent-reports/resolved/20260705-2242-development-solution-agent-team-persistent-roster.md` - implemented fixed-role reuse and report communication rules in Canvasight Agent Team skill.
- `agent-reports/resolved/20260705-2239-product-issue-agent-team-persistent-roster.md` - resolved Agent Team one-off agent ambiguity.
- `agent-reports/resolved/20260705-2226-integration-summary-agent-team-skill-toggle.md` - integrated configurable Agent Team skill, settings toggle, Run payload, docs, and verification.
- `agent-reports/resolved/20260705-2226-development-solution-agent-team-skill-toggle.md` - implemented Agent Team setting, Run protocol, skill, docs, and tests.
- `agent-reports/resolved/20260705-2211-product-issue-agent-team-skill-toggle.md` - resolved configurable Agent Team skill and default-on settings toggle.
- `agent-reports/resolved/20260705-2201-integration-summary-project-guidance-nodes.md` - integrated automatic missing AGENTS.md / design.md nodes for software-product graphs.
- `agent-reports/resolved/20260705-2153-product-issue-project-guidance-nodes.md` - resolved project guidance node generation rules.
- `agent-reports/resolved/20260705-2201-development-solution-project-guidance-nodes.md` - implemented MCP-backed project guidance node creation and tests.
- `agent-reports/resolved/20260705-1950-integration-summary-ai-template-reuse.md` - integrated AI graph template reuse across MCP, skill, README, and tests.
- `agent-reports/resolved/20260705-1941-product-issue-ai-template-reuse.md` - tracked the AI graph template reuse gap through resolution.
- `agent-reports/resolved/20260705-1948-development-solution-ai-template-reuse.md` - implemented MCP template listing and graph template reuse.
- `agent-reports/resolved/20260705-1925-product-issue-figma-color-variables-plugin.md` - triaged the Figma color variables plugin request as a software-product planning task.
- `agent-reports/resolved/20260705-1925-integration-summary.md` - completed the agent-report protocol dry run for the Figma plugin request.
- `agent-reports/resolved/20260705-1914-integration-summary.md` - established the file-system Agent report protocol.

## Archived / Legacy

- Existing root-level `agent-reports/*.md` files remain audit history unless a current task reopens them.
