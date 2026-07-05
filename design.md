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
