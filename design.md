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
- Destructive actions require confirmation or an easy undo path.
- Dragging, resizing, zooming, and panning should feel stable and should not conflict with text selection or form input.

## States

Every primary surface should define:

- Empty state: useful next action, not generic filler copy.
- Loading state: compact and non-disruptive.
- Error state: clear cause, recovery action, and preserved user input where possible.
- Disabled state: visible reason when the reason is not obvious.
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

