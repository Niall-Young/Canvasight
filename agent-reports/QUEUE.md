# Agent Report Queue

This is the active queue index for the Canvasight Agent Team. It points to report files instead of duplicating their full content.

Protocol effective from `2026-07-05 19:14`. Older Markdown files directly under `agent-reports/` are legacy records and do not need retroactive migration.

## Open

- None.

## Assigned

- None.

## Recently Resolved

- `agent-reports/resolved/20260710-1013-integration-summary-native-widget-module-bootstrap.md` - fixed native widget app bootstrap as an ES module, documented the current sidebar fallback, and installed Canvasight 0.1.49.
- `agent-reports/resolved/20260710-1013-development-solution-native-widget-module-bootstrap.md` - resolved the blank `Canvasight ready` widget shell and added module bootstrap coverage.
- `agent-reports/assigned/20260710-1003-test-issue-native-widget-shell-only.md` - resolved high-priority native widget shell-only issue; report status is resolved and links to its solution.
- `agent-reports/resolved/20260710-0927-integration-summary-native-run-contract.md` - integrated current-task binding, bridge Promise readiness, resume retry, cross-path daemon single-flight, EPIPE/log cap, tests, docs, and version 0.1.48.
- `agent-reports/resolved/20260710-0927-development-solution-native-run-contract-gaps.md` - fixed native widget Run capability false negatives and preflight/bootstrap gaps without browser fallback success.
- `agent-reports/resolved/20260710-0908-development-issue-native-run-contract-gaps.md` - resolved the remaining native widget Run contract failures.
- `agent-reports/resolved/20260708-1215-integration-summary-open-canvas-zh-trigger.md` - integrated Chinese “打开画布” skill trigger coverage, smoke assertions, README note, version 0.1.45 reinstall, and recorded reload/new-thread validation need.
- `agent-reports/resolved/20260707-2152-integration-summary-mcp-stdio-transport-lifecycle.md` - integrated Canvasight 0.1.44 MCP stdio lifecycle logging, JSON-RPC error hardening, stale daemon cleanup, tests, docs, reinstall, and recorded current-thread hot-swap limitation.
- `agent-reports/resolved/20260707-2152-development-solution-mcp-stdio-transport-lifecycle.md` - fixed MCP stdio lifecycle opacity and stale daemon cleanup while preserving native widget-only Run success.
- `agent-reports/resolved/20260707-2152-development-issue-mcp-stdio-transport-lifecycle.md` - resolved visible Canvasight tool `Transport closed` lacking plugin-side lifecycle diagnostics.
- `agent-reports/resolved/20260707-2119-integration-summary-transport-closed-skill-contract.md` - documented visible Canvasight MCP `Transport closed` as `canvasight_mcp_transport_closed`, updated skills/docs/tests, bumped version 0.1.43, and kept recovery to reload/new thread instead of browser fallback.
- `agent-reports/resolved/20260707-2119-skill-solution-transport-closed-contract.md` - resolved the skill contract gap for current-thread Canvasight MCP transport closed failures.
- `agent-reports/resolved/20260707-1127-development-issue-current-thread-mcp-transport-closed.md` - closed after writing the `Transport closed` recovery contract into Canvasight skills; live transport recovery remains reload/new thread.
- `agent-reports/resolved/20260707-2102-integration-summary-open-tool-discovery.md` - integrated lazy-loaded native tool discovery, blocked generic localhost normal-open fallback, clarified browser_fallback_no_bridge diagnostics, docs, tests, version 0.1.42, reinstall, and dev-server refresh.
- `agent-reports/resolved/20260707-2044-integration-summary-openai-compat-bridge.md` - integrated native widget bridge adapter for MCP `ui/message` and OpenAI compatibility `sendFollowUpMessage`, diagnostics, tests, docs, version 0.1.41, validation, reinstall, and dev-server refresh.
- `agent-reports/resolved/20260707-2020-integration-summary-native-widget-bridge.md` - integrated native widget bridge open-result contract, hid localhost data from public output, kept browser fallback diagnostic-only, bumped 0.1.40, validated and reinstalled.
- `agent-reports/resolved/20260707-1951-integration-summary-node-run-bridge-only.md` - integrated bridge-only node Run contract, native mode preflight, fallback queue-only behavior, tests, docs, and version 0.1.39.
- `agent-reports/resolved/20260707-1805-integration-summary.md` - integrated default native-enabled dev daemon, Run pre-claim fallback, diagnostic fetch errors, version 0.1.38, validation, and plugin reinstall.
- `agent-reports/resolved/20260707-1805-development-solution-run-failed-to-fetch.md` - fixed browser fallback Run `Failed to fetch` / native-disabled daemon reuse.
- `agent-reports/resolved/20260707-1745-product-issue-run-failed-to-fetch.md` - resolved Canvasight Run click showing generic `Failed to fetch`.
- `agent-reports/resolved/20260707-1712-integration-summary.md` - integrated current-thread project cwd auto-open, removed manual project path gate, docs, version 0.1.37, validation, and reinstall.
- `agent-reports/resolved/20260707-1712-development-solution-manual-project-path-gate.md` - fixed Canvasight opening by resolving the current Codex thread cwd instead of asking for a manual project path.
- `agent-reports/resolved/20260707-1642-product-issue-manual-project-path-gate.md` - resolved manual project path gate during Canvasight open.
- `agent-reports/resolved/20260707-1513-integration-summary.md` - integrated browser fallback project-path binding, thread-only URL guard, docs, skills, version 0.1.36, and validation.
- `agent-reports/resolved/20260707-1513-development-solution-browser-fallback-project-drift.md` - fixed generic browser fallback opening the default Canvasight repo when projectPath was missing.
- `agent-reports/resolved/20260707-1501-development-issue-browser-fallback-project-drift.md` - resolved thread-only fallback project drift to default Canvasight repo.
- `agent-reports/resolved/20260707-1452-integration-summary-dev-daemon-start-timeout.md` - integrated stale dev server detection, auto-restart, daemon single-flight, docs, version 0.1.35, and validation.
- `agent-reports/resolved/20260707-1452-development-solution-dev-daemon-start-timeout.md` - fixed `Canvasight daemon did not start in time` caused by stale Vite dev server middleware.
- `agent-reports/resolved/20260707-1442-development-issue-dev-daemon-start-timeout.md` - resolved browser fallback Run timeout from stale `0.1.30` dev server reuse.
- `agent-reports/resolved/20260707-1340-integration-summary-widget-daemon-csp-origin.md` - integrated exact daemon origin CSP fix, docs, version 0.1.34, and validation.
- `agent-reports/resolved/20260707-1340-development-solution-widget-daemon-csp-origin.md` - injected current daemon exact origin into widget CSP metadata and tightened smoke coverage.
- `agent-reports/resolved/20260707-1340-development-issue-widget-daemon-fetch-failed.md` - resolved native widget direct app `Failed to fetch` risk caused by missing exact daemon origin in widget CSP.
- `agent-reports/resolved/20260707-1203-integration-summary-native-widget-direct-app.md` - integrated the native widget direct-app fix, agent reviews, verification, docs, and residual risks.
- `agent-reports/resolved/20260707-1203-development-solution-native-widget-direct-app.md` - implemented native widget direct app hosting instead of localhost iframe and documented residual host risks.
- `agent-reports/resolved/20260707-1147-development-issue-native-widget-iframe-blocked.md` - resolved Codex native widget content being blocked by removing the actual localhost iframe from the widget resource.
- `agent-reports/resolved/20260707-1127-integration-summary-current-thread-mcp-transport-closed.md` - diagnosed that the current screenshot is correct browser fallback and the live thread MCP transport is closed.
- `agent-reports/resolved/20260707-1031-integration-summary-run-delivery-confirmation.md` - integrated confirmed Run delivery semantics, diagnostics, docs, skills, tests, and version 0.1.32.
- `agent-reports/resolved/20260707-1031-development-solution-run-delivery-confirmation.md` - implemented app-server notification confirmation, explicit queued fallback, and Run status diagnostics.
- `agent-reports/resolved/20260706-2213-development-issue-run-widget-bridge-not-attached.md` - resolved Canvasight Run direct-send ambiguity by requiring widget bridge or app-server confirmation before reporting sent.
- `agent-reports/resolved/20260706-2213-integration-summary-run-widget-diagnosis-report.md` - delivered a Markdown diagnosis report for the unresolved Canvasight Run widget bridge delivery failure without changing runtime code.
- `agent-reports/resolved/20260706-2202-development-solution-open-defaults-widget.md` - changed default `open_canvasight` path to native widget and split browser fallback into an explicit tool.
- `agent-reports/resolved/20260706-2202-integration-summary-open-defaults-widget.md` - integrated default native widget opening, explicit browser fallback, docs, tests, version 0.1.31, validation, and plugin reinstall.
- `agent-reports/resolved/20260706-2150-development-issue-open-defaults-browser-not-widget.md` - resolved default Canvasight open path using browser fallback and causing Run queue instead of widget direct delivery.
- `agent-reports/resolved/20260706-2141-integration-summary-run-false-sent-drops-payload.md` - integrated false-sent removal, queue-first fallback, docs/tests/version, and browser-visible verification.
- `agent-reports/resolved/20260706-2141-development-solution-run-false-sent-drops-payload.md` - implemented queue-first Run fallback and removed unverified sent semantics.
- `agent-reports/resolved/20260706-2128-development-issue-run-false-sent-drops-payload.md` - resolved browser/dev Run showing sent while current thread had no message and payload was not queued.
- `agent-reports/resolved/20260706-2059-integration-summary-run-wrong-thread-toast-width.md` - integrated explicit dev-thread claim routing and compact Run toast.
- `agent-reports/resolved/20260706-2059-development-solution-run-wrong-thread-toast-width.md` - removed stale `CODEX_THREAD_ID` dev fallback and added URL/local claim handling.
- `agent-reports/resolved/20260706-2059-development-issue-run-wrong-thread-toast-width.md` - resolved Run being sent to an old thread while the UI claimed current-thread success.
- `agent-reports/resolved/20260706-2043-integration-summary-dev-native-disabled.md` - integrated default daemon native Run delivery for browser/dev pages after current-thread claim.
- `agent-reports/resolved/20260706-2043-development-solution-dev-native-disabled.md` - made native `turn/start` delivery default-on and corrected tests/docs.
- `agent-reports/resolved/20260706-2043-development-issue-dev-native-disabled.md` - resolved test/default mismatch where real dev pages had native Run delivery disabled.
- `agent-reports/resolved/20260706-2033-integration-summary-browser-fallback-run-silent.md` - integrated visible Run feedback for browser fallback, skill/README wording, version 0.1.27, dev server status version, validation, plugin reinstall.
- `agent-reports/resolved/20260706-2033-development-solution-browser-fallback-run-silent.md` - implemented explicit browser fallback queued toast and docs.
- `agent-reports/resolved/20260706-2018-development-issue-browser-fallback-run-silent.md` - resolved browser fallback Run appearing silent and not direct-sending to current Codex thread.
- `agent-reports/resolved/20260706-2003-integration-summary.md` - integrated Cowart-style Canvasight native widget bridge, docs, skills, tests, version 0.1.26, and plugin reinstall.
- `agent-reports/resolved/20260706-2003-development-solution-run-widget-bridge.md` - implemented `render_canvasight_canvas_widget`, widget resource, frontend bridge, and fallback handling.
- `agent-reports/resolved/20260706-1935-development-issue-run-widget-bridge.md` - resolved Canvasight Run not reaching the current Codex thread by using native widget host bridge delivery.
- `agent-reports/resolved/20260706-1718-integration-summary-run-native-false-sent.md` - integrated default queued Run fallback, explicit native opt-in, docs, tests, and version 0.1.25.
- `agent-reports/resolved/20260706-1718-development-solution-run-native-false-sent.md` - fixed false-positive direct delivery through isolated Codex app-server.
- `agent-reports/resolved/20260706-1718-development-issue-run-native-false-sent.md` - resolved Canvasight Run returning sent without reaching the current Codex Desktop thread.
- `agent-reports/resolved/20260706-1656-development-issue-run-native-timeout-status.md` - resolved timeout diagnostics and superseded the issue with the isolated app-server root cause.
- `agent-reports/resolved/20260706-1645-integration-summary-turn-start-thread-not-loaded.md` - integrated same-connection `thread/resume` before Canvasight native Run delivery and bumped Canvasight to 0.1.23.
- `agent-reports/resolved/20260706-1645-development-solution-turn-start-thread-not-loaded.md` - implemented the notLoaded Codex thread Run delivery fix.
- `agent-reports/resolved/20260706-1638-development-issue-turn-start-thread-not-loaded.md` - resolved direct `turn/start` failure against notLoaded Codex threads.
- `agent-reports/resolved/20260706-1626-integration-summary-chat-settings-update-model-required.md` - integrated Chat Run direct `turn/start` delivery without settings update and installed Canvasight 0.1.22.
- `agent-reports/resolved/20260706-1626-development-solution-chat-settings-update-model-required.md` - changed Chat native handling to skip `thread/settings/update` and strengthened run smoke tests.
- `agent-reports/resolved/20260706-1618-development-issue-chat-settings-update-model-required.md` - resolved Chat Run being blocked by real app-server `thread/settings/update` requiring `model`.
- `agent-reports/resolved/20260706-1612-integration-summary-app-server-settings-required.md` - integrated required `collaborationMode.settings` support for Codex app-server Run delivery.
- `agent-reports/resolved/20260706-1612-development-solution-app-server-settings-required.md` - added default/plan settings payloads and strict app-server smoke assertions.
- `agent-reports/resolved/20260706-1606-development-issue-app-server-settings-required.md` - resolved `Invalid request: missing field settings` after real Canvasight Run clicks.
- `agent-reports/resolved/20260706-1557-integration-summary-run-click-not-delivered.md` - integrated the fix for real Run clicks not starting a Codex turn because app-server payloads contained null values.
- `agent-reports/resolved/20260706-1557-development-solution-run-click-not-delivered.md` - removed null optional fields from Codex app-server requests and tightened native smoke tests.
- `agent-reports/resolved/20260706-1549-product-issue-run-click-not-delivered.md` - resolved real Canvasight Run clicks queueing instead of sending to the current Codex thread.
- `agent-reports/resolved/20260706-1536-integration-summary-current-thread-claim.md` - integrated current-thread claim routing so archived launch threads do not own future Canvasight Run output.
- `agent-reports/resolved/20260706-1536-development-solution-current-thread-claim.md` - implemented `claim_canvasight_thread`, daemon claim/resolve APIs, and thread-filtered Run delivery.
- `agent-reports/resolved/20260706-1519-product-issue-current-thread-claim.md` - resolved the missing current Codex thread claim mechanism for persistent Canvasight pages.
- `agent-reports/resolved/20260706-1511-integration-summary-dev-run-not-sent.md` - integrated daemon-backed Run delivery for bare dev pages with explicit unbound dev-session failure.
- `agent-reports/resolved/20260706-1511-development-solution-dev-run-not-sent.md` - implemented Vite dev Run proxying through the Canvasight daemon and expanded dev-server smoke coverage.
- `agent-reports/resolved/20260706-1457-development-issue-dev-run-not-sent.md` - resolved bare `5173` dev page Run not sending Markdown to Codex.
- `agent-reports/resolved/20260706-1446-integration-summary-graph-write-session-drift.md` - integrated daemon-backed AI graph writes, document revision sync, stale-save rejection, docs, skills, tests, and version 0.1.18.
- `agent-reports/resolved/20260706-1446-development-solution-graph-write-session-drift.md` - implemented project document revision, per-project write lock, stale save handling, and dev API parity.
- `agent-reports/resolved/20260706-1429-development-issue-graph-write-session-drift.md` - resolved AI graph writes drifting from current Canvasight browser sessions and stale autosave overwrites.
- `agent-reports/resolved/20260706-1422-integration-summary-page-name-tooltip.md` - integrated full-name hover/focus tooltips for truncated Page switcher and menu names.
- `agent-reports/resolved/20260706-1422-development-solution-page-name-tooltip.md` - implemented Page name tooltip support using the existing TooltipAnchor and long-text tooltip styling.
- `agent-reports/resolved/20260706-1410-development-issue-page-name-tooltip.md` - resolved truncated Page names lacking full-name tooltip access.
- `agent-reports/resolved/20260706-1402-integration-summary-run-direct-thread-delivery.md` - integrated direct Run delivery to the bound Codex thread with await fallback, docs, skills, tests, and version 0.1.17.
- `agent-reports/resolved/20260706-1402-development-solution-run-direct-thread-delivery.md` - implemented Codex app-server turn/start delivery for Canvasight Run.
- `agent-reports/resolved/20260706-1349-development-issue-run-not-sent-to-thread.md` - resolved Run clicking only opening Markdown without sending to the current Codex thread.
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
