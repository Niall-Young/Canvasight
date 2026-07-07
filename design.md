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

- Topbar: compact global commands for project/workspace actions, running flows, opening the task list, and accessing settings.
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

## Codex Run Modes

Node-level Codex mode controls are part of the core workflow:

- Chat mode uses a chat icon and sends the node as a normal Codex conversation prompt.
- Plan mode uses a task/planning icon and enters Codex planning behavior.
- Goal mode uses a target-style icon and starts a goal-oriented Codex run.

These modes should be represented as a segmented control or similarly compact option set. The selected mode must be visually obvious, but the control should not dominate the node.

Run is a submit action, not a Markdown preview action. A successful Run should report whether the payload was sent to the current Codex thread, delivered to a waiting thread, or queued for `await_canvasight_run`. Markdown preview remains a separate drawer command for reviewing generated content and must not be used as the only visual proof that a Run was sent.

Normal plugin Run delivery happens from the Codex native widget host bridge. The native widget should host the Canvasight app directly and use the project daemon only for APIs, avoiding a localhost iframe inside the widget. Browser URL and bare dev-server surfaces are fallback contexts; they require an explicit current-thread claim before the payload can be scoped to a thread queue. The app must not label app-server `turn/start` acceptance as sent unless a matching `turn/started`, `item/started`, or `turn/completed` notification confirms the target turn. It must label unbound, queued, verified app-server sent, and current-thread widget sent states distinctly. Diagnostics should stay compact and expose environment/delivery metadata without showing full Run Markdown.

## Icon Semantics

Canvasight uses app-local SVG icons through the shared icon registry. Icons should map to the object or command they actually represent:

- Task list drawer: list icon, not a generic task or checkbox icon.
- Goal mode: target-style icon, not a generic flag.
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
- Inline name or title editing should commit when focus leaves or the user clicks outside the input. `Enter` commits and `Escape` cancels.

## AI-Generated Canvas

Canvasight supports Codex or other AI agents writing `.scatter/scatter.json` to create pages, nodes, edges, and attachments. AI-generated canvas content should feel like normal editable canvas state, not a separate imported artifact.

- When a Canvasight project is open, it becomes active canvas context for later medium or complex requests. Product planning, codebase architecture analysis, article mapping, complex fixes, and multi-step task plans should prefer a graph-first pass before direct execution when decomposition would help.
- In active Canvasight context, user phrases such as "用画布", "放到画布", "写到画布", or "use Canvasight to plan/break down this" refer to Canvasight graph writing by default. Only treat them as HTML canvas or frontend drawing work when the user explicitly says so.
- Active canvas context is a bias, not a hard override. Small direct commands, simple questions, Run payloads, and requests that explicitly ask for immediate direct execution should remain direct.
- AI-created nodes must use the same visual language, spacing, handles, attachments, and mode controls as manually created nodes.
- AI-created edges must use the same connection rules and relationship highlighting as user-created edges.
- AI-generated layouts should avoid overlapping nodes by default and should preserve a readable flow direction. When edges are present, generated nodes should be arranged by dependency layers rather than by simple index grid.
- Explicit node coordinates from the user or AI should be preserved; automatic layout should only fill missing coordinates.
- AI output should use the requested write mode to decide whether to append, replace the active Page, or replace the document. Task classification must not silently change Page behavior.
- AI-generated content must remain fully editable by the user.
- External AI writes and browser autosave must coordinate through a document revision contract. When AI writes a graph through the daemon, open browser sessions should reload the newer document automatically; stale browser saves must be rejected and reload the latest `.scatter/scatter.json` instead of overwriting externally generated Pages.

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
- Default state is enabled.
- The label should describe the action clearly, such as "开启 Agent Team" in Chinese and "Agent Team" in English.
- Turning it off should remove the Agent Team protocol from generated Run Markdown, while leaving normal canvas editing, Page behavior, templates, and Run submission unchanged.
- When enabled, the protocol should stay concise and should recommend only task-relevant roles. Do not expose a large role dashboard or make users manage reports manually from the app UI.

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
