# AGENTS.md

## Project Context

Canvasight is an early-stage project. The repository currently starts from a clean baseline, so agents should preserve room for the final stack and avoid assuming frameworks, commands, or deployment targets before they exist in the repo.

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

## Design Standards

- Use `design.md` as the source of truth for layout, tone, interaction patterns, and visual direction.
- Product surfaces should be direct and work-focused. Avoid marketing-style hero pages unless the request is specifically for a landing page.
- Prioritize dense but readable interfaces: clear hierarchy, compact controls, predictable navigation, and strong empty/loading/error states.
- Use established controls for their jobs: selects for switching records, tabs for view modes, toggles for binary settings, sliders or numeric inputs for values, and icon buttons for common tools.

## Verification

When commands exist, run the narrowest useful verification before finishing:

- Lint/typecheck for code changes.
- Unit tests for shared logic changes.
- Browser-visible verification for UI changes.
- Build verification before claiming a project is ready to run or deploy.

If verification cannot be run because the project has no scripts yet, state that clearly in the final response.

## Current Commands

No project commands are defined yet.

Update this section when a package manager, framework, test runner, or dev server is added.

