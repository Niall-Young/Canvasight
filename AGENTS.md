# AGENTS.md

## Project Context

Canvasight is an early-stage repo-local Codex plugin. The active product lives under `plugins/canvasight` as a Vite, React, TypeScript, XYFlow, Zustand, and Radix UI application. Preserve room for the final stack, but do not treat the repository as an empty baseline anymore.

The plugin opens a canvas workspace for arranging task nodes, attachments, and prompt flows. The web app is served by a project-level local daemon that outlives thread-local MCP shim processes. Normal plugin use renders Canvasight inside a Codex native widget through `open_canvasight`; callers must read the active task's `CODEX_THREAD_ID` and pass it as `threadId` because MCP child processes may not inherit it and Chat / Plan / Goal preflight requires an explicit target. The widget directly hosts the built app instead of iframe-loading localhost. Native widget JSON APIs route through the app-only `canvasight_widget_api` MCP tool, which proxies a strict allowlist to the daemon; the sandboxed widget must not depend on direct localhost fetches for startup or editing. Widget CSP must still include the daemon's exact origin before resource delivery for daemon-backed attachment assets. Native open tool results must not publicly expose daemon `127.0.0.1` URLs or tokens. Running a node sends Markdown for that node plus downstream children to the current Codex thread through the widget host bridge after native Chat / Plan / Goal preflight. The widget bridge may use standard MCP Apps `ui/message` or the Codex/OpenAI compatibility `window.openai.sendFollowUpMessage`; both count as native widget host bridge transports, not browser fallback. A successful MCP App handshake makes `sendMessage` callable even if the host omits the advisory `hostCapabilities.message` declaration; only the send Promise result determines sent/failed. Browser URLs and bare dev pages are fallback/development surfaces: after a current-thread claim they only queue payloads for `await_canvasight_run`; they must not report app-server `turn/start` as a successful Run path.

`open_canvasight` tool completion means only that the MCP call created a provisional `OpenAttempt`; it is not proof that the canvas opened. Callers must pass its `sessionId`, `openAttemptId`, and exact `threadId` to `await_canvasight_widget_ready`. Native opening succeeds only when that result is verified for a concrete fullscreen `widgetInstanceId` with React mounted, project hydration complete, and a visible non-zero canvas. Until that acknowledgement is observed, the result is `unverified`; agents must not say the canvas is "opened", "ready", or "fixed" based on tool output, another renderer, resource reads, daemon health, browser fallback, or synthetic harnesses alone.

Use `design.md` as the product and UI design baseline when adding user-facing screens.

## Working Rules

- Read the existing file tree before making changes.
- Keep changes scoped to the user's request.
- Do not rewrite or remove user changes unless explicitly asked.
- Prefer small, reviewable commits and focused files over broad refactors.
- Add dependencies only when they solve a concrete implementation need.
- When introducing a build system, document the commands in this file and in the project README if one exists.

## Agent Roles

- Main thread: owns integration, architecture decisions, conflict handling, verification, and final delivery.
- Product Agent: keeps the plugin aligned with the product goal of a browser canvas that returns output to Codex.
- Design Agent: protects the web UI direction, component language, visual density, and removal of old desktop-shell residue.
- Development Agent: owns implementation across MCP, persistence, React, and build/runtime behavior.
- Test Supervisor Agent: owns smoke tests, build checks, plugin validation, and browser-visible verification.
- Customer Support Agent: owns user-facing README documentation. On every user-visible feature, command, installation, workflow, or troubleshooting change, this agent must decide whether `README.md` needs an update. When it does, update README in the same delivery. README must keep a bilingual switch structure with Chinese and English sections, and must explain what Canvasight is for, its main features, basic usage, plugin setup, development commands, and common questions.
  Before updating README, check `AGENTS.md`, `design.md`, `plugins/canvasight/package.json`, `plugins/canvasight/mcp/server.mjs`, and all `plugins/canvasight/skills/*/SKILL.md` files so commands, tool names, and feature descriptions stay current. Do not present development-only commands as normal user workflow.
- Skill Expert Agent: owns Codex Skill trigger boundaries, frontmatter descriptions, `SKILL.md` concision, reference splitting, and skill validation. This role should review any change under `plugins/canvasight/skills/`. If a dedicated subagent cannot be created because of tool thread limits, the main thread must perform the role explicitly using the `skill-creator` guidance and record the limitation in `agent-reports/`.
- Design Standards Expert: owns `design.md`. This agent updates the design baseline when user-facing layout, interaction, visual language, icon semantics, or design-system rules change. Before UI implementation finishes, this agent checks whether `design.md` still matches the actual product direction.
- Development Standards Lead: owns `AGENTS.md`. This agent keeps repo workflow, agent roles, command references, verification rules, and implementation standards current. Any durable process change must be reflected here in the same delivery.
- Project Management Agent: owns git hygiene and delivery closure. At task start it records the baseline HEAD and worktree status. After the Main Thread freezes the integration scope and required verification passes, it reviews the scoped diff, selectively stages only files or hunks owned by the current delivery, checks the staged diff, and creates a small Chinese conventional commit with a prefix such as `feat:` or `fix:`. It must not stage pre-existing, user-owned, unrelated, ambiguous, conflicted, or failed-verification changes; when safe commit closure is impossible, it records the exact blocker and leaves those changes unstaged.

## Agent Team Lifecycle

- Maintain nine persistent role subagents when tool limits allow it: Product, Design, Development, Test Supervisor, Customer Support, Design Standards Expert, Development Standards Lead, Project Management, and Skill Expert.
- Do not close these fixed subagents after a task finishes. Keep them available so the main thread can continue assigning follow-up work to the same role instance.
- Reuse the fixed subagent for its role. Do not create a second Product, Design, Development, Test, Customer Support, Design Standards, Development Standards, Project Management, or Skill Expert agent unless the user explicitly rebuilds the team again.
- When the fixed roster is created or rebuilt, record each role, purpose, and agent id in the next `agent-reports/resolved/*-integration-summary.md`.
- Historical extra subagents from earlier experiments should not receive new work. If their ids are unavailable, leave them alone and continue only with the fixed roster.
- There is no "small change" exception. Every code, UI, document, command, build artifact, or workflow change must go through the fixed agent team responsibilities before final delivery.
- If a required fixed subagent cannot be spawned or reused because of tool limits, record the limitation in the integration summary and have the main thread explicitly perform that role's checklist for the current delivery.
- The Main Thread owns integration, validation, and final delivery and declares the verified commit-ready scope. The Project Management Agent owns final scoped staging and commit. If that seat is unavailable, the Main Thread must execute the same closure checklist; Main Thread ownership is not a reason to leave verified task-owned changes uncommitted.

## Agent Reports

- Use `/Users/niallyoung/Desktop/Canvasight/agent-reports/` for cross-agent Markdown communication and integration records.
- Treat `agent-reports/` as the file-system queue for the Agent Team. New reports must use one of these status folders:
  - `agent-reports/open/` for newly discovered issues that are not yet accepted by an owner.
  - `agent-reports/assigned/` for issues handed to a responsible Agent and waiting for analysis or implementation.
  - `agent-reports/resolved/` for solution reports, completed integration summaries, and issues with a recorded fix.
  - `agent-reports/archived/` for closed/no-action/legacy reports that should remain auditable but are not active.
- Existing Markdown files directly under `agent-reports/` are legacy records. Do not move or rewrite them unless a current task needs that specific report.
- Use `agent-reports/QUEUE.md` as the active queue index. Every new issue, assignment, solution, unresolved-risk note, or closure must update the queue in the same delivery.
- Every new report must start with YAML frontmatter containing at least:
  - `status`: `open`, `assigned`, `resolved`, or `archived`.
  - `report_type`: `issue`, `solution`, or `integration-summary`.
  - `owner`: responsible Agent role, or `main-thread` when the main thread owns it.
  - `created_by`: submitting Agent role.
  - `priority`: `low`, `medium`, `high`, or `critical`.
  - `created_at`: local timestamp in `YYYY-MM-DD HH:mm` format.
  - `updated_at`: local timestamp in `YYYY-MM-DD HH:mm` format.
- Use `agent-reports/_templates/issue.md`, `agent-reports/_templates/solution.md`, and `agent-reports/_templates/integration-summary.md` as the required body structure for new reports.
- For blockers or high-risk issues, create an issue report in `open/`, assign it by moving or writing it under `assigned/` and setting `status: assigned`, then hand it to the owning Agent for a solution report before implementation.
- When an issue is resolved, the responsible Agent or main thread must write a solution report in `resolved/` and update the issue report with:
  - `status: resolved`
  - `solution_report: <relative path>`
  - `处理结果`
  - `修改文件`
  - `验证方式`
  - `后续风险`
- For every integration round, write a `resolved/YYYYMMDD-HHMM-integration-summary.md` using the integration template. It must record completed work, unresolved risks, role decisions, verification, git status, and any report state changes.
- Before commit, inspect `git diff --cached --name-only`, `git diff --cached --stat`, and run `git diff --cached --check`; staged paths must match the Main Thread's approved scope. Any post-stage edit requires a fresh review. After commit, re-read `git status --short` and record the commit subject and hash as delivery evidence. Broad staging such as `git add -A` or `git add .` is forbidden when the worktree contains pre-existing or unrelated changes.
- A final delivery is not complete while an issue report relevant to the delivered scope remains `open` or `assigned` without an explicit unresolved-risk note in the integration summary.

## Implementation Standards

- Follow the conventions already present in the codebase once source files exist.
- When Canvasight is already open or recently attached, treat medium or complex follow-up requests as active canvas context. Prefer `write_canvasight_graph` before direct execution when the request benefits from decomposition, dependencies, stages, or visual review. Do not force graph writing for small direct commands, simple questions, Canvasight Run payloads, or requests that explicitly ask for immediate direct execution.
- Before changing an existing Canvasight Page, call `get_canvasight_graph_context`, preserve its `documentRevision`, and select Page behavior from the user's write intent. Use `merge-active-page` for continue/refine/expand/remove requests that target the current Page, `append-page` for an explicitly new canvas, `replace-active-page` only for an explicit current-Page rewrite, and `replace-document` only for an explicit full reset.
- AI graph generation combines intent, primary domain, optional secondary domain, maturity, and output topology through `frameworkManifest`. Submit coverage, `semanticStructure` responsibilities, and explicit `semanticRelationships` for covered-node edges. Decompose by independently understandable, executable, decidable, verifiable, or deliverable responsibilities; never use node counts, body length, coverage counts, branch counts, or fixed depth as quality thresholds. Semantic order is not automatically a dependency: articles, product surfaces, capabilities, verification, and ordered work must branch unless an edge records a real containment, dependency, sequence, evidence, decision, navigation, or flow relationship. Validation failures are internal repair instructions: correct the candidate and retry, up to three rounds, before writing or reporting completion. Do not expose a raw violation list as the delivered user result.
- Prefer typed, explicit data structures for product state and UI contracts.
- Keep business logic separate from presentation when the framework makes that practical.
- Make UI components reusable only after the same pattern appears more than once or clearly belongs to a shared system.
- Avoid placeholder-only screens for core flows; build the usable workflow first.
- Keep canvas state, persistence, and MCP contracts explicit. Do not hide run behavior inside presentation components when it can live in store or runtime helpers.
- Use the existing app icon registry in `src/components/ui/icon.tsx` and SVG assets under `src/assets/icons` before adding another icon path.
- Git-backed plugin installs must be runnable from the installed snapshot without `node_modules`, package-manager lifecycle scripts, or network access. The editable MCP source is `mcp/server.source.mjs`; `mcp/server.mjs` is the generated self-contained installed entry. Rebuild and verify that entry whenever MCP source or bundled dependencies change.
- When MCP runtime behavior changes, bump the plugin version in `.codex-plugin/plugin.json`, `package.json`, `package-lock.json`, and `mcp/server.source.mjs` `SERVER_VERSION` together, then regenerate `mcp/server.mjs`. Codex may keep versioned plugin cache entries, so changing runtime code without a version bump can leave users running stale MCP servers.
- MCP list tools that can expose large user-authored content should return lightweight summaries by default and provide a separate by-id read path for full content.
- Persistent user-asset features with capacity limits must reject or ask for explicit replacement at the limit. Do not silently evict older user data through list slicing or hidden cleanup.
- Plugin self-update installs the complete immutable plugin snapshot from the latest official GitHub Release through the `canvasight-local` marketplace; it must never patch individual cached MCP, Skill, UI, or asset files. Keep plugin name `canvasight`, plugin id `canvasight@canvasight-local`, marketplace name `canvasight-local`, official repository `Niall-Young/Canvasight`, and release branch `stable` stable unless an explicit migration is designed.
- The updater must compare versions before any mutating CLI call. Equal versions are a zero-mutation success, newer local versions are never downgraded, unrecognized versions fail closed, and local checkouts or custom forks are never replaced. A real update must verify official source, Release/manifest version agreement, installed version, and rollback any marketplace switch that occurred before a later failure.
- Generic plugin updates must not read, rewrite, migrate, delete, or recreate `.scatter/scatter.json`, `.scatter/assets`, `~/.canvasight`, project source, other plugins/Skills, local development checkouts, or unrelated Codex configuration. Data-format migrations require a separate backward-compatible design.
- `main` is the development branch. After the tagged version passes the release matrix, publish and verify the complete GitHub Release first, then fast-forward `stable` to that exact tag commit as the final release step. If publishing or verification fails, do not change `stable`; if the final `stable` fast-forward fails, delete the just-published Release and leave the previous `stable` untouched. Release recovery must not depend on force-pushing, rewinding, or deleting a protected `stable` branch. Do not publish a Release whose tag, manifest, package, MCP `SERVER_VERSION`, generated MCP bundle, or built web snapshot disagree.
- Release web builds must be reproducible across checkout paths and operating systems: never compile a developer or CI absolute project path into `dist`, keep plugin text inputs LF through `.gitattributes`, and make release validators accept CRLF checkout input where Windows can still supply it.

## Design Standards

- Use `design.md` as the source of truth for layout, tone, interaction patterns, and visual direction.
- Product surfaces should be direct and work-focused. Avoid marketing-style hero pages unless the request is specifically for a landing page.
- Prioritize dense but readable interfaces: clear hierarchy, compact controls, predictable navigation, and strong empty/loading/error states.
- Use established controls for their jobs: selects for switching records, tabs for view modes, toggles for binary settings, sliders or numeric inputs for values, and icon buttons for common tools.
- Preserve the current workspace model: compact topbar, canvas-first layout, task nodes as the primary editable objects, contextual drawers for task lists and Markdown/run output, and node-level Codex mode controls.
- When changing iconography, update both the visual asset and the semantic command it represents. For example, the task-list drawer should use a list icon, and the Goal Codex mode should use a target-style icon.

## Verification

When commands exist, run the narrowest useful verification before finishing:

- Lint/typecheck for code changes.
- Unit tests for shared logic changes.
- Browser-visible verification for browser UI changes.
- Build verification before claiming a project is ready to run or deploy.

Native widget changes have a separate mandatory acceptance gate:

- Synthetic VM, DOM, metadata-shape, postMessage, MCP smoke, build, and plugin validation are supporting checks only. They cannot replace native-host acceptance.
- Install the exact delivered plugin version. If the version changed while Codex Desktop was already running, reload/restart the Codex host before creating and tagging a new task; creating a task alone can retain the app-level plugin registry snapshot. Then invoke the normal `@Canvasight` / `open_canvasight` path.
- Observe the instance-bound fullscreen ready acknowledgement, confirm the full canvas is visible, exercise at least one meaningful canvas control, confirm a node Run reaches the same Codex task through that accepted instance, and verify late metadata cannot return the UI to Connecting.
- A browser or bare-dev fallback can diagnose canvas and daemon behavior, but cannot satisfy any native-widget acceptance item.
- If the real Codex native-host check cannot be performed, record the exact missing evidence and mark the delivery `unverified`. Do not close the relevant issue as resolved and do not claim the native widget is fixed, opened, ready, or successfully delivered.

If verification cannot be run because the project has no scripts yet, state that clearly in the final response.

## Current Commands

Canvasight is currently implemented as a repo-local Codex plugin under `plugins/canvasight`.

Run plugin commands from `/Users/niallyoung/Desktop/Canvasight/plugins/canvasight`:

- Normal plugin opening reads the active task's `CODEX_THREAD_ID`, passes it as `threadId` to `open_canvasight`, and renders the native widget for that task. If `open_canvasight` is not visible, use `tool_search` for `canvasight open_canvasight render_canvasight_canvas_widget` before declaring the native tool unavailable. Use `open_canvasight_browser_fallback` only when the user explicitly requests the fallback or for diagnostics.
- `get_canvasight_graph_context` returns the active Page's lightweight node, edge, position, Page-summary, and document-revision context before an AI update. `write_canvasight_graph` keeps legacy append/replace modes and revision-protected `merge-active-page` operations. Every AI-created or AI-relayouted graph uses a left-to-right horizontal topology; domain, output, `graphType`, reading order, and task sequence never create a vertical exception. Legacy `vertical` and `grid` inputs are compatibility aliases normalized to horizontal. Normal AI writes use `layoutPolicy: auto`; use `preserve-explicit` only to protect explicitly user-authored coordinates, and use `relayout-page` after topology changes that invalidate the whole Page's placement.
- Native open requires an explicit current `threadId` and normal mode preflight. Public output returns `sessionId` plus `openAttemptId` but must not expose daemon URLs or tokens; widget-only session data stays in `_meta.widgetData`. A completed open response remains provisional until the fullscreen instance emits complete ready evidence.
- Native widget session/API requests use the app-only `canvasight_widget_api` MCP proxy. Browser/dev surfaces keep direct daemon fetches. Resource reads must wait for the daemon so widget CSP contains its exact origin before attachment assets can load.
- Native Run uses the widget host bridge and is sent only when the bridge Promise resolves. Browser/dev Run is diagnostic-only: after a current-thread claim it queues for `await_canvasight_run` and must not report app-server `turn/start` as sent.
- `npm run dev` starts or reuses the project-level persistent Canvasight dev server at `http://127.0.0.1:5173/`, stops stale version-mismatched processes, and exits after the server is ready. Bare dev mode uses the latest explicit thread claim, resolves that task's Codex project, and returns `unbound_dev_session` when no claim exists; it must not invent a project from the dev process environment or show a normal-use project-path gate.
- MCP shim and daemon lifecycle must remain version-matched, single-flight, diagnosable, safe across stale installed/source processes, and bounded in lifecycle-log size. A closed transport requires a reloaded or new Codex task; localhost fallback is not a native recovery.
- `npm run dev:stop` stops the persistent Canvasight dev server.
- `npm run dev:status` reports whether the persistent Canvasight dev server is `running`, `stopped`, or `stale` because the recorded dev server or daemon `serverVersion` no longer matches the current package version.
- `npm run dev:foreground` starts Vite in the foreground when live terminal logs are explicitly needed.
- `npm run daemon` manually starts the project-level Canvasight daemon for development/debugging.
- `npm run daemon:stop` manually stops the project-level Canvasight daemon for development/debugging.
- `npm run typecheck` runs TypeScript checks.
- `npm run build` regenerates the self-contained MCP entry, runs TypeScript checks, and builds the web app into `dist/`.
- `npm run build:mcp` regenerates the self-contained installed MCP entry from `mcp/server.source.mjs`.
- `npm run check:mcp-bundle` rebuilds the MCP entry in memory and fails if the committed `mcp/server.mjs` is stale.
- `npm run preview` previews the built web app.
- `npm run test:markdown` verifies node Run Markdown includes the current node plus downstream children in stable order.
- `npm run test:dev-server` verifies the persistent dev server lifecycle.
- `npm run test:mcp` runs the MCP smoke test, including daemon persistence across MCP process restarts, concurrent daemon single-flight, stdout-close/EPIPE handling, and newline plus `Content-Length` JSON-RPC transports.
- `npm run test:plugin-distribution` copies the plugin without `node_modules` and verifies that the installed MCP entry completes registration with all expected tools.
- `npm run test:update` verifies read-only checks, complete stable installs, protected local/custom/development sources, rollback, version boundaries, and cross-platform CLI invocation without touching real Codex state.
- `npm run release:prepare -- <version>` synchronizes the release version across plugin manifest, package metadata, and MCP source, then regenerates the committed MCP and web distribution artifacts. Use a plain stable semver such as `0.4.11`.
- `npm run release:verify -- <version>` performs the read-only release gate for synchronized version fields, plugin identity, required built assets, and valid Skill frontmatter.
- `npm run diagnose:mcp` performs an isolated MCP registration probe without opening the canvas or starting the daemon. It reports manifest Node-command resolution, executable/runtime details, `initialize`, `tools/list`, required open tools, and lifecycle-log stages; on Windows it can also be run as `node .\tests\mcp-registration-probe.mjs` to avoid PowerShell script-policy shims.

Plugin validation runs from the repo root:

- `python3 /Users/niallyoung/.codex/skills/.system/plugin-creator/scripts/validate_plugin.py /Users/niallyoung/Desktop/Canvasight/plugins/canvasight`

After installing, reinstalling, or upgrading `canvasight@canvasight-local`, reload/restart Codex Desktop before verifying MCP tools in a newly created and newly tagged task. Existing tasks do not hot-refresh plugin tools, and a new task created by the same unreloaded desktop process can still retain its app-level plugin registry snapshot.

<!-- canvasight-agent-team:start -->
## Canvasight Agent Team

When Canvasight Agent Team mode is enabled, follow the versioned role-registry and report protocol. This section governs new Agent Team work only: Markdown files directly under `agent-reports/` remain legacy history and must not be moved, renamed, or rewritten merely to migrate them. New protocol reports belong in the status subdirectories below.

### Role Registry

`ROSTER.md` at the project root is the durable registry for role seats and their runtime mapping. It records the schema role name, seat status, `agent_id`, `thread_id`, timestamps, handoff/replacement data, and the last linked report. It is not an issue tracker and does not make a role process persistent across threads.

Use only these schema role names for roster seats and report ownership: Product Agent, Design Agent, Design Standards Expert, Development Agent, Development Standards Lead, Test Supervisor Agent, Customer Support Agent, Project Management Agent, and Skill Expert Agent. `Main Thread` is the reserved integration coordinator and does not need a roster seat.

- Read `ROSTER.md`, the latest relevant integration summary, and linked reports before recreating a role on a new thread.
- Reuse a live seat when its runtime mapping is still valid. Otherwise mark only the required seat `rebuilding`, rebuild it, and write its new runtime mapping back to the roster.
- Do not create all roles by default or duplicate an active seat. Create only the roles whose owned surfaces are affected by the current work.
- Valid seat states are `active`, `inactive`, `blocked`, `rebuilding`, `replaced`, and `missing`.

### Versioned Reports And Queue

Use `agent-reports/` for versioned cross-agent reports and `agent-reports/QUEUE.md` as the derived index of active issues:

```text
agent-reports/
  QUEUE.md        # derived index: open, assigned, and blocked issues only
  open/           # open issues
  assigned/       # assigned and blocked issues
  resolved/       # resolved issues, solutions, and integration summaries
  archived/       # auditable, verified closed history
```

- Use `issue-<kebab-slug>.md`, `solution-<kebab-slug>.md`, and `integration-summary-<kebab-slug>.md`; `report_id` is the filename without `.md`.
- Every new report uses the current schema fields, including `schema_version`, `report_id`, `version`, runtime identity, dependencies, related files, and verification status/evidence. Use RFC 3339 UTC timestamps.
- The report is authoritative for an issue's owner, status, dependencies, and verification evidence. `ROSTER.md` is authoritative only for role-seat state. `agent-reports/QUEUE.md` is derived from reports and is never a source of truth.
- A report has exactly one active scalar `owner`. A role may take it only through an explicit handoff, blocker-driven reassignment, or recorded Main Thread reassignment.
- Use optimistic concurrency for every report write: read the current `owner`, `status`, and `version`; re-read immediately before writing; abort and re-read if they changed; then increment `version` and update `updated_at` atomically. `updated_at` alone is not a write guard.
- If a report and roster disagree on ownership, keep the report and synchronize the affected roster seat afterwards. If a queue row differs from its report, regenerate the queue row from the report.

### Operating Rules

- Write state in this strict order: **report -> affected roster seat -> derived queue**. Never update the queue first.
- On acceptance, write the issue as `assigned` in `assigned/`. On a blocker, keep it in `assigned/` with status `blocked` and record the blocker and next owner. On resolution, create the linked solution report, update and move the issue to `resolved/`, then write an integration summary that records roster changes, validation, unresolved work, and risks.
- Archive only verified resolved material after its integration summary records the closure.
- Preserve existing project rules in this file; record any conflict with this protocol and ask for direction before replacing a conflicting collaboration workflow.
- The Main Thread owns integration, conflict handling, validation, and final delivery. Run `node plugins/canvasight/skills/canvasight-agent-team/scripts/validate-agent-team.mjs --root /Users/niallyoung/Desktop/Canvasight` before delivering Agent Team protocol changes.
<!-- canvasight-agent-team:end -->
