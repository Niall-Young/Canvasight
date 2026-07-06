# Agent Report Queue

This is the active queue index for the Canvasight Agent Team. It points to report files instead of duplicating their full content.

Protocol effective from `2026-07-05 19:14`. Older Markdown files directly under `agent-reports/` are legacy records and do not need retroactive migration.

## Open

None.

## Assigned

None.

## Recently Resolved

- `agent-reports/resolved/20260706-1101-integration-summary-ai-graph-layout.md` - integrated edge-aware default graph layout, validation, docs, reports, and version 0.1.16.
- `agent-reports/resolved/20260706-1101-development-solution-ai-graph-layout.md` - implemented dependency-layer graph layout with explicit coordinate preservation.
- `agent-reports/resolved/20260706-1040-development-issue-ai-graph-layout-overlap.md` - resolved AI-generated Canvasight graphs clumping into unreadable layouts.
- `agent-reports/resolved/20260706-1035-integration-summary-active-canvas-routing.md` - integrated active Canvasight context routing so later medium or complex requests prefer graph-first handling.
- `agent-reports/resolved/20260706-1035-development-solution-active-canvas-routing.md` - added MCP routing metadata, Skill trigger updates, docs, tests, and version 0.1.15.
- `agent-reports/resolved/20260706-1024-product-issue-active-canvas-routing.md` - resolved the gap where an opened Canvasight canvas did not bias later structured requests toward the canvas.
- `agent-reports/resolved/20260706-1006-integration-summary-compact-plugin-icon.md` - integrated a dedicated Canvasight compact plugin icon for the installed plugins list.
- `agent-reports/resolved/20260706-1006-development-solution-compact-plugin-icon.md` - added a separate composer icon asset and bumped Canvasight to 0.1.14.
- `agent-reports/resolved/20260706-1006-product-issue-compact-plugin-icon.md` - resolved the installed plugins list still showing the fallback Canvasight icon.
- `agent-reports/resolved/20260706-0957-integration-summary-logo-favicon.md` - integrated the new Canvasight plugin logo and browser favicon assets.
- `agent-reports/resolved/20260706-0943-integration-summary-template-capacity-summary.md` - integrated template capacity management and summary-first AI template reads.
- `agent-reports/resolved/20260706-0943-development-solution-template-capacity-summary.md` - implemented 200-template limit handling, delete/manage UI, and MCP get-by-id template retrieval.
- `agent-reports/resolved/20260706-0943-product-issue-template-capacity-summary.md` - resolved global template capacity and AI context blow-up risk.
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
