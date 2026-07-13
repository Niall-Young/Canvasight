# Canvasight Design Baseline

## Product Direction

Canvasight is a canvas-centered product for turning loosely structured inputs into inspectable, organized visual work. The product should feel like a practical workspace: fast to scan, easy to manipulate, and calm enough for repeated daily use.

The first screen of the app should be the actual working surface, not a marketing landing page.

## Audience

Primary users are people who need to understand, organize, compare, or refine complex information visually. Assume they value speed, clarity, and control over decorative presentation.

## Experience Principles

- Make the canvas the main event.
- Keep navigation predictable and persistent.
- Show one clear active context at a time.
- Make object state visible: selected, edited, locked, archived, loading, errored.
- Prefer direct manipulation where it saves time, and precise controls where accuracy matters.
- Preserve user orientation with stable panels, stable dimensions, and clear transitions.

## Information Architecture

Recommended top-level structure:

- Canvas: the main working area.
- Inspector: contextual properties for the selected item.
- Source or Library panel: reusable inputs, cards, assets, or records.
- Toolbar: creation, navigation, zoom, view mode, undo/redo, and export controls.
- Status area: save state, sync state, selection count, and lightweight feedback.

Avoid scattering core actions across multiple unrelated panels.

## Current Workspace Baseline

The active implementation is a Codex plugin workspace, not a landing page. The first viewport should open directly into the working app:

- Topbar: compact global commands for project/workspace actions, running flows, opening the task list, and accessing settings. Do not add a manual workspace Diagnostics toolbar button or panel.
- Canvas: the dominant surface, powered by draggable task nodes and visible connections.
- Task node: the primary editable object, with title, prompt/body content, attachments, connection affordances, run controls, and mode controls.
- Right drawer: contextual workspace surfaces such as task list, Markdown/run output, and related inspection views.
- Sidebar or project list: secondary navigation only; it must not compete visually with the active canvas.
- Toast/status layer: short-lived feedback for save, run, achievement, and error events.
- Run toast width should hug its content with a modest max-width and mobile safe margins. It must not stretch into a full horizontal banner unless the message itself requires wrapping.

Keep these regions stable. Opening drawers, changing node state, or hovering connected edges should clarify the current context without resizing the canvas unpredictably.

## Task Node Design

Task nodes should feel like compact work objects rather than document cards:

- A selected node should expose editing and run controls clearly.
- Title and body editing should preserve text input behavior, including IME composition.
- Attachments should appear as compact chips with file size and removal affordances.
- Parent and child connection handles should remain discoverable on the left and right edges.
- Hovering a connected edge or related node should create a visible relationship highlight.
- Running, loading, errored, selected, and editing states must be visually distinct.
- Multi-select actions should work without making a single node look editable when it is only selected as part of a group.

Node controls should stay small and predictable. Do not add large descriptive text inside nodes to explain the app.

## Codex Run

Node Run is a single Chat submission action. It uses a play icon and sends the node as a normal Codex conversation prompt; there is no Plan or Goal mode selector.

Run is a submit action, not a Markdown preview action. A successful node Run should report sent only after the native widget host bridge accepts the message. Browser/dev fallback surfaces may report queued output for `await_canvasight_run`, but they must never display a native sent state. Markdown preview remains a separate review command and is not proof that a Run reached Codex.

Normal plugin Run delivery happens through the Codex native widget host bridge. Native open binds the active Codex task before rendering and hosts the Canvasight app directly. Native widget JSON APIs travel through an app-only MCP proxy to the project daemon so startup and editing do not depend on sandboxed localhost fetches; browser/dev surfaces may still call the daemon directly. Local daemon URLs and tokens must not appear as the user-facing open result. Routine delivery feedback should stay compact and distinguish queued from sent delivery without exposing full Run Markdown; it must not become a manual diagnostics workspace surface.

## Markdown Review And Export

The Markdown drawer is a review surface with one stable export action. It must not offer Clipboard-dependent copying in the native widget.

- Export Markdown alone as a `.md` file when the reviewed Run scope has no attachments.
- Export a `.zip` when that scope includes attachments: place the Markdown at the archive root and the related files under `assets/`; the archived Markdown refers only to those relative asset paths.
- While an export is being prepared, keep the single export action visibly busy and unavailable for a duplicate click. If preparation or packaging fails, restore the action and show concise, in-drawer error feedback; do not rely on a host-level or transient toast for this failure.

## Native Widget Startup

The React application shell owns startup feedback and must render on the widget resource's first paint. Session metadata, daemon connection, and initial project data are progressive startup dependencies; none may block the shell from mounting.

Use one monotonic startup state machine: `starting → connecting_bridge → connecting_session → hydrating_project → ready | failed`. A repeated or late host event may confirm the current stage but must never move the visible UI backward.

When Codex reuses an existing Canvasight widget for a newer open request, that newer binding starts a fresh startup sequence in the same workspace frame. The previously bound canvas must stop accepting input immediately and must not remain visible as if it belonged to the new task. Duplicate metadata for the current binding may confirm progress; metadata from an older binding is ignored and must not replace or regress the active workspace.

- `starting`: the widget resource is active and the React shell is committing. Show the workspace skeleton immediately; do not leave a standalone static fallback covering React.
- `connecting_bridge`: the React shell is mounted and is establishing the MCP Apps bridge plus fullscreen host context.
- `connecting_session`: attempt, session, thread, and fullscreen widget instance are bound; the app-only MCP API proxy and initial session health check are pending.
- `hydrating_project`: bridge and session API are usable, and the initial `.scatter` project is loading into application state and the canvas DOM.
- `ready`: the actual React commit, MCP Apps bridge, fullscreen host context, session API, project hydration, and a visible, non-zero-size canvas DOM have all been verified for the same open attempt and widget instance. Only this stage may clear startup feedback and enable Run.
- `failed`: a stage deadline, React render, bridge, host context, session, hydration, or canvas visibility requirement failed. Failed is terminal for that attempt; late events must not restore or obscure loading feedback.

During all non-terminal startup stages, preserve the recognizable workspace frame with a topbar and canvas skeleton. Session-dependent controls are visibly disabled and removed from keyboard order. The status label remains compact, names the current operation, uses `aria-live="polite"`, and does not imply success.

Failed replaces the skeleton with a persistent panel in the React tree. It must include the failed stage, a short human-readable reason, Reconnect, Reopen in a new task, and Copy diagnostics actions. Diagnostics copied from the panel must redact daemon URLs, credentials, access tokens, and user-home path segments. The failure heading receives focus, the panel uses an assertive live region, all actions are keyboard reachable with visible focus, and recovery never depends on a transient toast.

An ErrorBoundary around the workspace must route uncaught React render errors to the same Failed panel with stage `react_render`. Reconnect resets the boundary and starts a new attempt through an injected runtime callback; the UI component itself must not invent session, task, or navigation behavior.

Every non-terminal stage has a bounded runtime deadline. Missing session metadata still has a hard 10-second deadline from bootstrap start. No startup stage may remain on screen indefinitely, and an error must not be hidden in console output, diagnostics, or a dismissed toast while the main surface continues to look busy.

MCP tool completion, widget resource loading, script loading, daemon health, and browser/dev rendering are supporting signals only. They are not Ready. Native opening succeeds only when the real widget runtime's ready acknowledgement is observed after React mount and the initial session/API health check.

Browser and bare-dev fallback surfaces are clearly labeled diagnostic or fallback contexts. They may help isolate canvas and daemon behavior and may queue Run output after an explicit task claim, but they must never present themselves as native widget success or satisfy native readiness.

## Icon Semantics

Canvasight uses app-local SVG icons through the shared icon registry. Icons should map to the object or command they actually represent:

- Task list drawer: list icon, not a generic task or checkbox icon.
- Run: play icon.
- New workspace or project: folder-plus or equivalent add-container icon.
- Sidebar and drawer controls: directional panel icons that match the panel being opened.

When an icon appears in both the topbar and canvas toolbar for the same command, use the same visual symbol in both places.

## Visual Style

Canvasight should use a restrained, professional interface:

- Neutral base surfaces with clear contrast.
- Limited accent colors reserved for selection, active tools, warnings, and success states.
- Thin borders and subtle shadows only where they clarify layering.
- Cards and panels should use small radius, generally `6px` to `8px`.
- Avoid one-note palettes dominated by a single hue.
- Avoid decorative gradient blobs, ornamental backgrounds, and oversized illustration-first layouts.

## Layout

- The canvas should occupy the largest area of the viewport.
- Toolbars should be compact and stable in height.
- Side panels should use fixed or constrained widths with responsive collapse behavior.
- Controls should not resize the canvas unexpectedly.
- Use stable dimensions for boards, tiles, icon buttons, and repeated objects so hover and loading states do not cause layout shift.
- Text inside compact controls, triggers, segmented controls, and toolbar buttons must not push icons or affordances out of alignment. Reserve fixed space for leading and trailing icons, and truncate long labels with ellipsis.
- Page, workspace, and record switchers should have a stable width contract: long names use single-line truncation, while icons, chevrons, add buttons, and overflow buttons keep their fixed size and position. Truncated switcher names should expose the full name through hover/focus tooltips.
- Compact triggers must use `min-width: 0` on the text region and non-shrinking icon slots so localized strings and renamed pages cannot distort the control.

## Typography

- Use a clean system sans-serif stack unless a brand typeface is introduced.
- Keep headings compact inside tool panels.
- Reserve large display type for marketing surfaces or document-style exports, not the app workspace.
- Do not scale text directly with viewport width.
- Letter spacing should remain `0` unless a specific component requires otherwise.

## Interaction Patterns

- Icon buttons should use recognizable icons and include tooltips for less common actions.
- Selection should be visually obvious without hiding the content.
- Contextual actions should appear near the object or in the inspector, not both unless there is a strong reason.
- Destructive actions require either an app-local confirmation dialog or an immediate undo path.
- Do not use native browser `alert`, `confirm`, or `prompt` for product workflows. Canvasight confirmations must use the app dialog system so visual style, localization, focus behavior, and keyboard handling stay consistent.
- Destructive dialogs must be modal: show an overlay, keep the background inert, trap focus inside the dialog, and return focus to the triggering control after closing.
- Backdrop clicks must not dismiss destructive confirmation dialogs. Users should explicitly choose Cancel, Close, or the destructive action.
- Dialog copy must name the affected object and the consequence. For page deletion, mention that nodes and connections in that page will be deleted.
- Destructive action buttons should use the destructive visual style; Cancel should remain visually available and safe as the non-destructive escape.
- Dragging, resizing, zooming, and panning should feel stable and should not conflict with text selection or form input.
- Zoom limits are stable interaction boundaries. Once the canvas reaches minimum or maximum zoom, continued input in that direction must be a no-op: preserve the rendered viewport, focal point, and zoom indicator without flashing, fitting, or resetting.
- Inline name or title editing should commit when focus leaves or the user clicks outside the input. `Enter` commits and `Escape` cancels.

## AI-Generated Canvas

Canvasight supports Codex or other AI agents writing `.scatter/scatter.json` to create pages, nodes, edges, and attachments. AI-generated canvas content should feel like normal editable canvas state, not a separate imported artifact.

- When a Canvasight project is open, it becomes active canvas context for later medium or complex requests. Product planning, codebase architecture analysis, article mapping, complex fixes, and multi-step task plans should prefer a graph-first pass before direct execution when decomposition would help.
- In active Canvasight context, user phrases such as "用画布", "放到画布", "写到画布", or "use Canvasight to plan/break down this" refer to Canvasight graph writing by default. Only treat them as HTML canvas or frontend drawing work when the user explicitly says so.
- Active canvas context is a bias, not a hard override. Small direct commands, simple questions, Run payloads, and requests that explicitly ask for immediate direct execution should remain direct.
- AI-created nodes must use the same visual language, spacing, handles, attachments, and mode controls as manually created nodes.
- AI-created edges must use the same connection rules and relationship highlighting as user-created edges.
- Every AI-generated or AI-relayout canvas uses a left-to-right primary axis, regardless of domain, intent, maturity, output framework, or graph type. Sources, topics, or entry points start on the left; dependent layers, details, evidence, decisions, and results continue to the right. The Y axis is reserved for ordering siblings, parallel branches, and items at the same dependency depth.
- Normal AI writes use service-owned automatic placement: nodes are arranged by semantic dependency layers, parents center over complete subtrees, and full node bounds must not overlap. Article and document reading order is expressed by the vertical ordering of sibling section nodes within the same horizontal layer; it must not switch the graph to a top-to-bottom primary flow.
- Content sequence is not automatically an edge or dependency. Article sections, product pages, capabilities, acceptance items, and parallel tasks should connect only when there is a real containment, dependency, navigation, evidence, decision, or delivery relationship. AI generation and repair must preserve meaningful branches and must not turn independent responsibilities into a mechanical single chain, whether vertical or horizontal.
- `layoutPolicy: preserve-explicit` is reserved for preserving coordinates deliberately authored or arranged by the user. It must not be used to introduce a non-horizontal AI-created layout. Existing user coordinates remain untouched by unrelated incremental edits; when topology changes require whole-Page placement, AI relayout returns to the left-to-right invariant.
- AI output should use the requested write mode to decide whether to append, replace the active Page, or replace the document. Task classification must not silently change Page behavior.
- An active Page is a continuing thinking space, not disposable AI output. When the user refers to the current canvas, an existing node, or asks to continue, refine, expand, or remove content, AI should inspect that Page and apply a minimal merge instead of creating another Page or replacing unrelated content.
- AI canvas generation should combine intent, domain, maturity, and output structure. Domain contracts define content completeness; output structure controls topology only and must not flatten product, design, technical, and verification content into an undifferentiated branch.
- Framework writes must review both node responsibility and edge meaning: `semanticStructure` records covered-node cohesion, while `semanticRelationships` records the type and rationale of every edge between covered nodes. A passing layout therefore needs both valid coordinates and a defensible semantic topology.
- AI decomposition follows semantic responsibility rather than node counts, body length, coverage count, branch count, or fixed depth. A node owns one clearly named responsibility; independently executable, decidable, verifiable, or deliverable content becomes related nodes, while inseparable content may remain together with an explicit cohesion reason.
- Candidate AI writes must pass structural and framework coverage validation before becoming visible canvas state. Validation feedback is an internal repair signal for the AI; users should receive the corrected editable result rather than a raw checklist of generation defects.
- AI-generated content must remain fully editable by the user.
- External AI writes and browser autosave must coordinate through a document revision contract. When AI writes a graph through the daemon, open browser sessions should reload the newer document automatically; stale browser saves must be rejected and reload the latest `.scatter/scatter.json` instead of overwriting externally generated Pages.

## Skill Composition

Canvasight supports three related but distinct Skill paths without turning the canvas into a Skill manager:

- A canvas-level content Skill may lead the professional content framework for one AI write. It contributes content decisions only; Canvasight remains the sole owner of Pages, nodes, edges, revisions, validation, persistence, and left-to-right placement.
- AI may assign a Skill to one node responsibility only when the global opt-in is enabled and the Skill description clearly matches. The assignment is visible as editable `$skill-name` text in the node body; it is not a hidden node field.
- A user may always type `$` in an editing node to search enabled Skills, or type `$skill-name` manually when discovery is unavailable. Multiple Skills are allowed and old tokens remain editable even if the catalog later changes.

The `$` picker is anchored to the node body and supports composition input, fuzzy search, Arrow keys, Enter/Tab selection, Escape dismissal, refresh, and an explicit manual-entry fallback. It must not resize the Page layout or replace ordinary textarea editing.

`skill-led` content generation skips Canvasight's default professional content completion, but it never skips responsibility coverage, semantic relationships, revision checks, atomic writes, or horizontal topology. External requests for vertical layout, coordinates, or direct `.scatter` writes are treated only as content advice. Conflicting professional Skills require user resolution before writing.

## Global Node Templates

Node templates are reusable local assets, not project files. They should feel like a compact library inside the existing drawer system:

- The template drawer should show the current template count against the maximum capacity.
- The template library is capped at 200 saved templates. Saving template 201 must not silently delete an older template.
- When the library is full, Canvasight should use an app-local modal dialog that lets users manage the template drawer or explicitly replace the oldest template.
- Users must have a direct way to delete templates from the template drawer.
- AI template discovery should be summary-first: list operations show lightweight previews, counts, and ids. Full prompt bodies and attachment metadata are loaded only for a selected template.

## AI-Generated Task Structure

AI-generated canvas content may use scenario classification as a generation strategy, but classification should shape the task structure, not become visible navigation architecture by default.

- AI classification is used to decide what nodes, edges, labels, and prompt structure to generate.
- Classification should not require creating one Page per category.
- Generated nodes should reflect the work structure through clear titles, concise prompts, and meaningful connections.
- Classification metadata should remain optional and implementation-facing unless it improves user understanding.
- Users should experience the result as a normal editable canvas, not as a taxonomy dashboard.

Common generation strategies:

- Product or feature development: include product goals, user workflows, scope boundaries, design style, technical architecture, verification, and missing project guidance such as `AGENTS.md` or `design.md` when relevant.
- Article or document reading: follow the source structure, including thesis, sections, arguments, evidence, conclusion, and questions.
- Codebase inspection: follow the real repository structure, including entry commands, directories, core modules, data flow, interfaces, risks, and verification paths.
- Task planning: organize objective, evidence, constraints, steps, blockers, verification, and delivery.

## Page Model

Pages are independent canvas workspaces inside a project. A Page is a user-controlled workspace boundary, not an AI scenario category.

- Users may create Pages for separate workflows, experiments, versions, branches, topics, or temporary drafts.
- AI may create, select, or update Pages only when the write mode or explicit user request calls for it.
- Incremental AI edits preserve untouched nodes, edges, coordinates, and Page identity by default. When a split or relationship change invalidates the existing geometry, an explicit whole-Page relayout may reposition nodes while preserving their IDs, content, edges, and Page identity.
- One Page may contain multiple task scenarios when the user's workflow calls for it.
- One task scenario may span multiple Pages when the user intentionally separates it.
- Page names should describe the user's workspace intent, not automatically mirror hidden AI classification.
- Switching Pages should preserve each Page's own nodes, edges, viewport, selection, and local editing context.

## Capability Boundaries

Canvasight separates the user-facing canvas experience from AI/operator capabilities. The visible product remains a canvas workspace, not a skill directory or automation dashboard.

- AI capabilities should appear through normal canvas objects, commands, dialogs, drawers, and status feedback.
- Skill boundaries must not leak into primary navigation unless users need to choose a visible workflow mode.
- Users should not need to understand which skill handled a task to inspect or edit the resulting canvas.
- When multiple AI capabilities produce canvas content, their output should share the same node, edge, attachment, Page, and drawer patterns.
- Errors from skill-driven actions should be shown as product errors with recovery paths, not as raw agent or implementation failures.

AI capability information architecture:

- Canvas: the shared destination for generated or manually edited task structures.
- Page: a user-controlled workspace boundary, independent from skill categories.
- Node: the smallest editable task unit, regardless of whether it was created by the user, AI, or a template.
- Edge: a visible dependency or reasoning relationship between nodes.
- Drawer: contextual review surface for task lists, Markdown output, templates, and generated summaries.
- Dialog: focused confirmation, setup, or settings surface.
- Toolbar: compact access to common commands and workspace modes.

## Agent Team Setting

Canvasight can include an Agent Team / agent-report protocol section in generated Run Markdown. This is a workflow capability, not a primary canvas object.

- The setting belongs in the existing Settings dialog as a compact switch.
- Default state is disabled so normal Runs do not incur Agent Team coordination and report overhead unless the user explicitly opts in.
- The label should describe the action clearly, such as "开启 Agent Team" in Chinese and "Agent Team" in English.
- Turning it off should remove the Agent Team protocol from generated Run Markdown, while leaving normal canvas editing, Page behavior, templates, and Run submission unchanged.
- When enabled, the protocol should stay concise and should recommend only task-relevant roles. Do not expose a large role dashboard or make users manage reports manually from the app UI.

## Settings Scope

Settings contains only active user-configurable Canvasight workflow preferences, such as the Agent Team switch and the global "Allow AI to choose Skills for nodes" switch. AI Skill assignment defaults off, persists across projects, and does not affect manual `$Skill` editing. Do not show a Codex current-model row or editable model field: model selection was supporting the retired Plan and Goal paths, while Chat Run uses the current Codex task context. Do not move manual workspace Diagnostics into Settings; startup-failure recovery retains its dedicated persistent diagnostics actions.

## Canvas File Protocol

The `.scatter/scatter.json` file is a user-editable and AI-editable canvas protocol.

- External file writes must be validated before becoming visible canvas state.
- Project document revisions should advance on every daemon-mediated document write, including AI graph writes and browser saves.
- Browser saves should include the expected document revision. If the expected revision is stale, the app should preserve user orientation as much as possible, reject the stale write, and reload the latest valid document.
- Invalid or partially valid canvas files should show a recoverable error instead of blanking the workspace.
- Unknown fields should be preserved when possible to protect forward compatibility.
- Missing optional fields should fall back to stable defaults.
- New AI-generated nodes should have deterministic, readable layout defaults and enough spacing to keep text, handles, and edges from overlapping.

## States

Every primary surface should define:

- Empty state: useful next action, not generic filler copy.
- Loading state: compact and non-disruptive.
- Error state: clear cause, recovery action, and preserved user input where possible.
- Disabled state: visible reason when the reason is not obvious.
- Confirmation dialogs should preserve user context: opening or closing a dialog must not change selection, canvas position, drawer state, or current page unless the confirmed action itself requires it.
- Offline or unsaved state if persistence is added.

## Accessibility

- Maintain keyboard access for core commands.
- Use visible focus states.
- Keep contrast suitable for long work sessions.
- Do not rely on color alone for status.
- Ensure text and controls do not overlap at mobile or desktop sizes.

## Responsive Behavior

Desktop is the primary workspace target. Smaller screens should preserve core review and light editing flows:

- Collapse secondary panels before reducing canvas usability.
- Keep the active object visible when panels open.
- Move dense property controls into drawers or tabs on narrow screens.
- Keep toolbar actions reachable without wrapping into unstable rows.
- On narrow or constrained widths, preserve command affordances before showing full labels. Labels may truncate, but icons and click targets must remain visible and usable.

## Naming And Tone

Use concise, work-focused language. Prefer verbs that match concrete actions:

- Create
- Select
- Group
- Archive
- Export
- Compare
- Inspect
- Restore

Avoid instructional text that explains obvious UI mechanics inside the app.

## Implementation Notes

When the frontend stack is chosen, translate this baseline into concrete tokens:

- Surface colors
- Text colors
- Accent colors
- Border color
- Radius scale
- Spacing scale
- Shadow scale
- Focus ring
- Panel and toolbar dimensions

Keep those tokens centralized rather than duplicating raw values across components.
