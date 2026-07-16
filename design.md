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
- Valid image attachments must render thumbnails from the actual image content. Loading and error states must use neutral, unmistakable, recoverable feedback and must never imitate image content or appear to be a real thumbnail.
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

## Inline Framework Confirmation

Framework confirmation is a compact MCP UI embedded directly below the current Codex tool response. It is a conversation component, not a reduced canvas workspace. It uses its own inline widget resource and startup path; rendering it must never open or attach the fullscreen Canvasight widget, request fullscreen display mode, switch a Page, show the topbar or canvas, start a project session, connect to the daemon, or read and write `.scatter` state.

The form reuses the same React component language, centralized design tokens, form controls, typography, focus treatment, and theme rules as the Canvasight workspace. New visual rules belong in the shared `app.css` token system rather than in MCP server HTML or a second approximate stylesheet. The inline form's outermost container is a transparent, fill-width boundary with `box-sizing: border-box`, 24px padding, 16px radius, and a 1px semantic light-gray border that adapts to the active theme. It has no shadow or opaque desktop-card background, and must not imitate a desktop window, add browser chrome, or use ornamental canvas imagery.

### Card Structure

- Use one compact flat form containing a concise title, optional one- or two-line explanation, one to three question groups, and a single footer action. The transparent outer boundary is the form itself; do not draw a second card inside it or the Codex message container.
- Question groups use a clear prompt followed by two or three preset choices. Keep labels scannable and descriptions secondary; avoid repeating the prompt inside every option.
- Mark at most one recommended option per question with a quiet `推荐` or `Recommended` badge. Recommendation may guide attention, but must not preselect an answer or visually overpower the user's alternatives.
- Every question exposes one custom-answer field. The field belongs to that question and stays visually connected to its preset choices.
- Custom-answer textareas use the same `background-input` surface token as other editable input controls in both light and dark themes; they must not fall back to the raised or card surface.
- The primary footer action is `确认并继续` in Chinese or `Confirm and continue` in English. It is disabled until every question has a valid answer.

Use the existing compact Canvasight spacing and radius scale: the form should read as a dense work control, not as a settings page. Separate question groups with spacing or a light divider rather than wrapping the whole form or every group in nested cards. Keep the footer flat and stable so validation messages do not move the submit action unexpectedly.

### Selection And Submission States

- Single-select questions use radio semantics. Selecting a preset clears that question's custom answer; entering a non-empty custom answer clears its preset selection.
- Multi-select questions use checkbox semantics. Multiple presets and a non-empty custom answer may be submitted together.
- Preset choice items follow the established Scatter UI kit project-select pattern in both themes: input-surface background, 12px radius, 12px vertical and 16px horizontal padding, 12px control-to-copy gap, and 14px/22px regular label and description text. A persistent selected item adds only the 1px connecting-border and no shadow; it never receives a blue or primary-tinted row fill. The focus token is reserved for actual keyboard focus. Because the inline form has no opaque outer card background, the input-surface rows remain visually separate from the host message surface without inventing another selection style.
- Checkbox and radio controls remain 16px square with a 2px connecting-border. Checkbox corners use the 6px radius and radio controls are fully round. Selected controls use the theme's dark-background token with the inverted-token check or centered 8px radio dot; never hard-code black or white, so the same component reverses correctly in dark mode.
- Custom-answer labels must name their purpose, such as `自定义答案`; placeholder text alone is not a label. Whitespace-only input is not a valid answer.
- Before submission, validation stays local to the unanswered question and uses both text and state, never color alone. Do not show errors merely because the card first rendered.
- While sending, keep the selected values visible, disable editable controls and duplicate submission, and give the action a compact progress state.
- After the host bridge confirms success, lock the card and replace the editable body or footer with a concise answer summary plus a clear sent state. The original choices remain auditable in the conversation.
- If sending fails, preserve every selection and custom answer, restore interaction, show persistent inline error text, and change the action to an explicit retry. Never display success before the bridge Promise resolves.
- `confirmationId` identifies one submission. Repeated clicks, late callbacks, or host retries must not produce a second user message from the same successful component.

### Message-Surface Behavior

The inline component fills the available host width and requests content-driven height that includes its border and padding. It reports size changes as validation, custom input, error, and submitted-summary states change. The outer container and all descendants must resolve within the available inline width; they must not impose a fixed or intrinsic minimum width that creates horizontal scrolling. It must not create an internal page scrollbar at its normal supported widths or clip the footer, bottom border, focus treatment, or final content row. Height changes should be immediate and stable, without animated jumps that move the surrounding conversation unpredictably.

At narrow message widths, the form remains fill-width with no horizontal scrolling: options stack vertically, text wraps naturally, and the primary action expands to the available content width. At wider widths, keep a readable single-column question flow; do not turn separate questions into a dense grid. Long labels and user-authored custom answers wrap without clipping controls or pushing the form beyond its host width.

Light and dark themes use the same semantic surface, text, border, accent, success, error, and focus tokens as the main workspace. Host-provided theme changes must update the card without a reload. Contrast, disabled states, recommendation badges, and error states must remain distinguishable in both themes.

Each question is a semantic `fieldset` with a `legend`; radio and checkbox controls retain their native group behavior. All options, custom inputs, and submission controls are keyboard reachable with a visible focus ring. Arrow-key behavior for radio groups, Space for checkboxes, ordinary text editing, and IME composition must remain intact. The sent summary and persistent error use appropriately polite or assertive live-region semantics, while focus remains stable unless a failed submission requires moving it to the error heading.

This confirmation path is reserved for consequential Graph Writer ambiguity. Ordinary wording, node counts, decorative preferences, and facts recoverable from the repository, active Page, conversation, or relevant Skills do not justify interrupting the message flow with a card.

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
- External AI writes and task-local autosave coordinate through one document revision contract, but AI writes use a context-bound rebase policy rather than the manual task-to-task policy below. AI captures the target Page and its base snapshot before generation; later Page switching, navigation, or unrelated edits must not retarget or reject the write. Structural and framework validation still runs against the AI candidate before any merge becomes visible.

## Skill Composition

Canvasight supports three related but distinct Skill paths without turning the canvas into a Skill manager:

- A canvas-level content Skill may lead the professional content framework for one AI write. It contributes content decisions only; Canvasight remains the sole owner of Pages, nodes, edges, revisions, validation, persistence, and left-to-right placement.
- AI may assign a Skill to one node responsibility only when the global opt-in is enabled and the Skill description clearly matches. The assignment is visible as editable `$skill-name` text in the node body; it is not a hidden node field.
- A user may always type `$` in an editing node to search enabled Skills, or type `$skill-name` manually when discovery is unavailable. Multiple Skills are allowed and old tokens remain editable even if the catalog later changes.

The `$` picker is a compact combobox anchored to the active textarea caret, not a node-side panel. It is rendered through a viewport-level Portal with fixed physical dimensions, so it never inherits XYFlow pan or zoom transforms. Its normal state has no title bar or refresh action, is approximately 288 px wide, shows only four to five result rows, and scrolls internally for additional matches. Placement prefers the available space above or below the caret, falls back to the left or right only when vertical space is insufficient, and clamps to the visible viewport without covering the caret's current text line. Fuzzy search must expose every matching item from the fully loaded Skill catalog; scrolling may limit what is visible at once, but a top-N cutoff must not hide matches. Ordinary textarea composition, IME behavior, Arrow keys, Enter/Tab selection, Escape dismissal, explicit manual entry, and accessible combobox/listbox ARIA semantics must remain available without resizing the Page layout or replacing ordinary textarea editing.

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

## Concurrent Editing Across Codex Tasks

The same Canvasight project may be open in multiple Codex tasks without locking an entire Page. Every manual save compares three complete document states: `base`, the last version confirmed to that task; `local`, that task's current edits; and `current`, the latest daemon-backed project state.

- Changes to different Pages or different node and edge IDs merge automatically. Identical changes to the same object coalesce without creating a conflict.
- Nodes and edges are atomic merge objects. Divergent changes to the same object, divergent Page names, delete-versus-edit, and deleting a node while another task changes one of its incident edges are true conflicts.
- When one Page has a true conflict, the original Page keeps the complete first-saved `current` version. The later-saving task's complete `local` Page becomes one conflict-copy Page; do not partially merge that task's non-conflicting changes from the conflicted Page into the original. Non-conflicting Pages in the same save may still merge normally.
- Delete conflicts preserve recoverable content. If `current` deleted a Page that `local` edited, restore the edited local Page as a conflict copy. If `local` deleted a Page that `current` edited, keep the current Page and preserve the local pre-delete snapshot as a conflict copy.
- A conflict copy preserves all later-task content and topology, uses unique Page, node, and edge IDs, and becomes an ordinary user-controlled Page after creation. It must never be automatically merged, deleted, expired, or silently replaced.
- Only the later-saving task switches locally to its conflict copy. Other tasks never jump to another Page because of a concurrent save; they may refresh shared document content while keeping their own local navigation context.
- `activePageId`, viewport, selection, and other task-local orientation state are not content-conflict inputs. Concurrent navigation must not create a conflict, overwrite another task's orientation, or force automatic relayout.

Conflict feedback is persistent until the user explicitly closes it. Do not use an auto-dismissing toast for any of these three outcomes:

- When the original Page still exists: “先保存的版本保留在原页面，你的完整版本已保存为冲突副本”. Include a “查看原页面” action.
- When another task deleted the original Page while the local task edited it: “原页面已被另一任务删除，你的版本已恢复为冲突副本”. Do not show a view-original action.
- When the local task deleted a Page that another task edited: “删除未执行；另一任务的版本保留在原页面，删除前内容已保存为冲突副本”. Include a “查看原页面” action.

Tasks that did not create the conflict copy receive only persistent informational feedback that a new conflict copy was discovered. They do not switch Pages. “查看原页面” changes only the current task's local Page selection and must not mutate the shared project's active Page or another task's viewport.

## Concurrent AI And Manual Editing

An AI graph write is bound to the Page and base snapshot returned by its graph context, not to whichever Page happens to be active when generation finishes. Within the project write lock, Canvasight validates the AI candidate against that base and rebases it onto the latest document state.

- Manual Page switching, viewport movement, selection changes, and node dragging do not retarget or reject the AI write. The AI result always returns to the Page captured by its context.
- Changes to different nodes, edges, or Pages merge automatically. Non-conflicting AI changes remain on the original target Page even when another object on that Page has a conflict.
- When manual and AI edits diverge on the same node, edge, or Page identity, the latest manual semantic content stays on the original Page. Canvasight also preserves the AI candidate as one complete AI conflict-copy Page with unique Page, node, and edge IDs so no AI content or topology is lost.
- If the captured target Page was manually deleted, Canvasight must not recreate it in place. The complete validated AI candidate becomes an AI recovery-copy Page.
- Existing nodes always keep their latest manually arranged positions. AI placement and relayout may position newly added nodes around the latest occupied bounds, but dragging alone is not a semantic conflict and AI relayout must not move existing manual nodes.
- Context-bound retries are idempotent: a repeated mutation must return its prior result without another revision or another conflict/recovery copy. An expired or unavailable context asks the AI to read fresh context and rebuild; it must not guess a target Page.

AI conflict feedback is persistent until explicitly dismissed: “你正在编辑的版本已保留，AI 结果已保存为冲突副本”. Include a “查看 AI 版本” action. The feedback must not automatically switch Pages; the action changes only the current task's local Page selection and must not mutate another task's orientation. AI recovery copies use equivalent persistent wording that explains the original Page was deleted and the AI result was recovered as a copy.

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
- Project document revisions advance once for each real daemon-mediated document write, including AI graph writes and manual canvas saves. Unchanged saves, failed saves, and idempotent retries do not advance the revision.
- Modern manual saves include their confirmed `base` document and revision, current `local` document, and a stable mutation ID. A stale base triggers the three-way concurrent-editing contract instead of discarding local input. Legacy clients without that contract remain strict and receive `stale_document`.
- Context-bound AI graph writes carry the captured Page, base revision, and stable mutation identity. A stale revision triggers the AI/manual rebase contract above; legacy AI calls without a valid context remain strict and receive `stale_document`. Automatic rebasing must never bypass graph or framework validation.
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
