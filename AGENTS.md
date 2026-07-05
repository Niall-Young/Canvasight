# AGENTS.md

## Project Context

Canvasight is an early-stage repo-local Codex plugin. The active product lives under `plugins/canvasight` as a Vite, React, TypeScript, XYFlow, Zustand, and Radix UI application. Preserve room for the final stack, but do not treat the repository as an empty baseline anymore.

The plugin opens a canvas workspace for arranging task nodes, attachments, and prompt flows. Running a node or flow sends Markdown and structured run data back to the current Codex thread through MCP.

Use `design.md` as the product and UI design baseline when adding user-facing screens.

## Working Rules

- Read the existing file tree before making changes.
- Keep changes scoped to the user's request.
- Do not rewrite or remove user changes unless explicitly asked.
- Prefer small, reviewable commits and focused files over broad refactors.
- Add dependencies only when they solve a concrete implementation need.
- When introducing a build system, document the commands in this file and in the project README if one exists.

## Implementation Standards

- Follow the conventions already present in the codebase once source files exist.
- Prefer typed, explicit data structures for product state and UI contracts.
- Keep business logic separate from presentation when the framework makes that practical.
- Make UI components reusable only after the same pattern appears more than once or clearly belongs to a shared system.
- Avoid placeholder-only screens for core flows; build the usable workflow first.
- Keep canvas state, persistence, and MCP contracts explicit. Do not hide run behavior inside presentation components when it can live in store or runtime helpers.
- Use the existing app icon registry in `src/components/ui/icon.tsx` and SVG assets under `src/assets/icons` before adding another icon path.

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

- `npm run dev` starts the Vite web app.
- `npm run typecheck` runs TypeScript checks.
- `npm run build` builds the web app into `dist/`.
- `npm run preview` previews the built web app.
- `npm run test:mcp` runs the MCP smoke test once implemented.

Plugin validation runs from the repo root:

- `python3 /Users/niallyoung/.codex/skills/.system/plugin-creator/scripts/validate_plugin.py /Users/niallyoung/Desktop/Canvasight/plugins/canvasight`

After installing or reinstalling `canvasight@canvasight-local`, verify MCP tools from a new Codex thread or a reloaded session. Existing open threads may not hot-refresh newly installed plugin tools.
