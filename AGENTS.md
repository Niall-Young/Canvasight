# AGENTS.md

## Project Context

Canvasight is an early-stage repo-local Codex plugin. The active product lives under `plugins/canvasight` as a Vite, React, TypeScript, XYFlow, Zustand, and Radix UI application. Preserve room for the final stack, but do not treat the repository as an empty baseline anymore.

The plugin opens a canvas workspace for arranging task nodes, attachments, and prompt flows. The web app is served by a project-level local daemon that outlives thread-local MCP shim processes. Running a node or flow sends Markdown and structured run data to whichever Codex thread calls `await_canvasight_run`.

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
- Project Management Agent: owns git hygiene and delivery logs. This agent checks `git status`, keeps commits small and reviewable, writes Chinese conventional commit messages with prefixes such as `feat:` and `fix:`, and confirms staged files match the delivered scope.

## Agent Team Lifecycle

- Maintain nine persistent role subagents when tool limits allow it: Product, Design, Development, Test Supervisor, Customer Support, Design Standards Expert, Development Standards Lead, Project Management, and Skill Expert.
- Do not close these fixed subagents after a task finishes. Keep them available so the main thread can continue assigning follow-up work to the same role instance.
- Reuse the fixed subagent for its role. Do not create a second Product, Design, Development, Test, Customer Support, Design Standards, Development Standards, Project Management, or Skill Expert agent unless the user explicitly rebuilds the team again.
- When the fixed roster is created or rebuilt, record each role, purpose, and agent id in the next `agent-reports/resolved/*-integration-summary.md`.
- Historical extra subagents from earlier experiments should not receive new work. If their ids are unavailable, leave them alone and continue only with the fixed roster.
- There is no "small change" exception. Every code, UI, document, command, build artifact, or workflow change must go through the fixed agent team responsibilities before final delivery.
- If a required fixed subagent cannot be spawned or reused because of tool limits, record the limitation in the integration summary and have the main thread explicitly perform that role's checklist for the current delivery.

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
- A final delivery is not complete while an issue report relevant to the delivered scope remains `open` or `assigned` without an explicit unresolved-risk note in the integration summary.

## Implementation Standards

- Follow the conventions already present in the codebase once source files exist.
- Prefer typed, explicit data structures for product state and UI contracts.
- Keep business logic separate from presentation when the framework makes that practical.
- Make UI components reusable only after the same pattern appears more than once or clearly belongs to a shared system.
- Avoid placeholder-only screens for core flows; build the usable workflow first.
- Keep canvas state, persistence, and MCP contracts explicit. Do not hide run behavior inside presentation components when it can live in store or runtime helpers.
- Use the existing app icon registry in `src/components/ui/icon.tsx` and SVG assets under `src/assets/icons` before adding another icon path.
- When MCP runtime behavior changes, bump the plugin version in `.codex-plugin/plugin.json`, `package.json`, `package-lock.json`, and `mcp/server.mjs` `SERVER_VERSION` together. Codex may keep versioned plugin cache entries, so changing runtime code without a version bump can leave users running stale MCP servers.

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
- Browser-visible verification for UI changes.
- Build verification before claiming a project is ready to run or deploy.

If verification cannot be run because the project has no scripts yet, state that clearly in the final response.

## Current Commands

Canvasight is currently implemented as a repo-local Codex plugin under `plugins/canvasight`.

Run plugin commands from `/Users/niallyoung/Desktop/Canvasight/plugins/canvasight`:

- `npm run dev` starts or reuses the project-level persistent Canvasight dev server at `http://127.0.0.1:5173/`. The command exits after the server is ready; archiving the launching Codex thread should not stop the dev server.
- `npm run dev:stop` stops the persistent Canvasight dev server.
- `npm run dev:status` reports whether the persistent Canvasight dev server is running.
- `npm run dev:foreground` starts Vite in the foreground when live terminal logs are explicitly needed.
- `npm run daemon` manually starts the project-level Canvasight daemon for development/debugging.
- `npm run daemon:stop` manually stops the project-level Canvasight daemon for development/debugging.
- `npm run typecheck` runs TypeScript checks.
- `npm run build` builds the web app into `dist/`.
- `npm run preview` previews the built web app.
- `npm run test:dev-server` verifies the persistent dev server lifecycle.
- `npm run test:mcp` runs the MCP smoke test, including daemon persistence across MCP process restarts.

Plugin validation runs from the repo root:

- `python3 /Users/niallyoung/.codex/skills/.system/plugin-creator/scripts/validate_plugin.py /Users/niallyoung/Desktop/Canvasight/plugins/canvasight`

After installing or reinstalling `canvasight@canvasight-local`, verify MCP tools from a new Codex thread or a reloaded session. Existing open threads may not hot-refresh newly installed plugin tools.
