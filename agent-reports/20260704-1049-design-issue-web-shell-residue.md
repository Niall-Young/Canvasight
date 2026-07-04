# Canvasight Scatter Renderer Web Design Audit

Date: 2026-07-04
Mode: read-only review, except this report file
Canvasight path: `/Users/niallyoung/Desktop/Canvasight/plugins/canvasight`
Scatter upstream: `https://github.com/Niall-Young/Scatter.git`
Scatter commit reviewed: `fa61fb77843914a5cde7200a34bfb0c95ba1809e` (`main`, Release 5.1.24, 2026-05-22T21:02:01+08:00)

## Scope

The review compares current Canvasight plugin source with Scatter upstream renderer and CSS. Current Canvasight already contains a near-direct copy of Scatter renderer files under `plugins/canvasight/src`, plus a Canvasight-specific `src/lib/canvasightApi.ts` adapter and a looser `src/types/global.d.ts`. The source review did not run the app, install dependencies, or open a browser.

Primary product instruction:

- Preserve Scatter renderer component and CSS language.
- Web version must not show the left project list.
- Web version must not keep desktop client background blur, glass, translucency, vibrancy, or startup background/splash.

Design baseline alignment:

- `design.md` asks for a practical canvas-centered workspace, direct working surface as first screen, compact persistent controls, visible object state, stable panels, and no ornamental backgrounds.

## Design Acceptance Checklist

Use this as the handoff checklist for implementation and QA.

### First Screen And Layout

- [ ] The first visible screen is the Canvasight working canvas or a useful canvas-empty state, not Scatter startup/splash, not a landing page, and not a project picker.
- [ ] No left project list is mounted in the DOM: no `.sidebar`, `.project-list`, `ProjectItem`, recent-project rows, or sidebar collapse animation.
- [ ] The app layout does not reserve the old 288px left rail. Canvas should occupy the available width by default.
- [ ] Topbar does not include sidebar toggle or add-project controls that imply a hidden left project list.
- [ ] The 92px Electron traffic-light offset in the topbar is removed or redesigned for browser chrome.
- [ ] Canvas, right drawer, bottom toolbar, zoom control, undo/redo, and run/task/markdown controls remain visually close to Scatter.
- [ ] The right drawer can open for task list and Markdown without pushing the canvas into an unusable width.
- [ ] Empty/loading/error states are work-focused and compact. Empty state should point to the next Canvasight action, not "Select or create your project."

### Background And Material Treatment

- [ ] `body`, `#root`, `.app-shell`, `.workspace`, and `.canvas-shell` render on solid opaque web surfaces.
- [ ] No `backdrop-filter`, `-webkit-backdrop-filter`, Electron `vibrancy`, or browser-simulated glass material is present.
- [ ] No `data-translucent="true"` mode exists in the rendered HTML.
- [ ] `--color-background` and `--color-background-canvas` are opaque colors in both light and dark modes.
- [ ] Transparent backgrounds remain only where they are component internals, such as icon buttons, scrollbars, React Flow pane, and text fields.
- [ ] Shadows remain subtle and used only to clarify layering, as Scatter does for nodes, toolbar, popovers, and drawer overlays.

### Component Language To Preserve

- [ ] Keep Scatter's neutral token set, system font stack, compact type scale, thin borders, and restrained blue accent.
- [ ] Keep React Flow canvas behavior and styling: transparent React Flow pane over a solid canvas shell, selected/active edge color, custom connection path, fit/undo/redo controls, bottom toolbar, and zoom dropdown.
- [ ] Keep task node language: 400px node width, small header, white card body, subtle sunken shell, hover/selected shadow, selected border, inline title/body editing, attachment chips, footer reveal, effort dropdown, and plan switch.
- [ ] Keep right drawer language: tasks list, Markdown source/preview segmented control, copy/download buttons, resize handle for Markdown, thin custom scrollbars.
- [ ] Keep core UI kit affordances: icon buttons, tooltips with delay, dropdown menus, select triggers, toggles/switches, checkboxes, segmented control with moving white indicator, toast styling, disabled states, and focus-visible states.
- [ ] Keep motion that preserves orientation: sidebar removal aside, drawer open/close, toolbar hover, node footer reveal, segmented indicator, switch thumb, and reduced-motion fallbacks.

### Accessibility And Responsive Checks

- [ ] Keyboard focus remains visible on toolbar buttons, dropdown items, node connect buttons, form fields, drawer controls, and toasts.
- [ ] Tooltips or accessible labels exist for icon-only controls.
- [ ] Core actions do not depend on color alone. Selected node, active tool, disabled run, and active drawer need shape, border, icon, text, or state in addition to color.
- [ ] At desktop viewports, text does not truncate except where designed with ellipsis.
- [ ] At narrow widths, secondary panels collapse or become drawers before the canvas becomes unusable.
- [ ] Toolbar stays reachable without wrapping into unstable rows.

## Styles And Components To Remove

Remove or avoid carrying these into the web app:

- Left project list shell:
  - `App.tsx` still imports and renders `Sidebar` at lines 53 and 2218-2230.
  - `.app-shell` still reserves `grid-template-columns: 288px minmax(0, 1fr)` at CSS lines 193-195.
  - `.sidebar`, `.sidebar-actions`, `.project-list`, `.kit-project-item`, and project search UI remain in CSS and components.
- Sidebar-specific topbar controls:
  - `Topbar` still receives `sidebarCollapsed`, `onToggleSidebar`, and `onCreateProject`; web Canvasight should not expose a left-project-list mental model.
  - CSS keeps Electron titlebar spacing and `-webkit-app-region` at lines 1066-1078 and 1105-1116.
- Startup/splash:
  - `App.tsx` keeps `isSplashWindow` and the splash branch at lines 583-585 and 2184-2204.
  - CSS keeps `.startup-shell` and `.startup-panel` at lines 207-225.
  - `startup-bulb.jpg` / `startup-toolbox.png` should not be requested or used as launch backgrounds.
- Translucency/glass:
  - `shared/types.ts` keeps `translucentBackground` in settings with default `true`.
  - `App.tsx` keeps state and dataset wiring at lines 562, 624, and 1117.
  - CSS keeps translucent token overrides at lines 115-123 and backdrop blur at lines 227-232.
  - `SettingsDialog` still exposes the "Translucent background" switch at lines 172-176.
- Desktop client material:
  - Upstream Electron `windowVisualOptions()` uses `transparent: true`, `backgroundColor: "#00000000"`, and `vibrancy: "fullscreen-ui"` at `src/main/index.ts` lines 143-147. Do not reproduce this in web.
- Scatter brand/startup copy:
  - `index.html` title is still `Scatter`.
  - Startup heading is still `Scatter`.
  - Empty project copy still says select/create project through translations.

## Styles And Components To Keep

Keep these unless a later product decision explicitly changes them:

- Token structure: `--color-text`, `--color-background-*`, `--color-primary`, semantic colors, border weights, shadows, radius scale, system font stack, and compact text sizes.
- Canvas container: bordered solid canvas shell, subtle radius, React Flow pane, selected edge and connection path styling.
- Node styling: `.task-node`, `.task-node-card`, `.task-title`, `.task-body`, `.node-connect-button`, `.node-edge-cap`, attachment chips, hover/selected reveal states.
- Toolbar language: bottom-centered `.canvas-toolbar`, bottom-left `.canvas-actions`, 32px icon buttons, compact zoom trigger and menu.
- Right drawer: task list, Markdown source/preview, segmented control, copy/download, resize handle, thin scrollbars.
- UI kit: `.kit-button`, `.kit-icon-button`, `.kit-toolbar-item`, `.kit-dropdown-menu`, `.kit-select-trigger`, `.kit-toggle`, `.kit-checkbox`, `.kit-segmented`, `.kit-toast`, `.kit-tooltip`.
- Interaction states: hover, focus-visible, selected, disabled, active, loading spinner, reduced-motion fallbacks.

Note: Canvasight `design.md` generally recommends 6px-8px radii for cards and panels. Scatter's component language uses larger `--radius-lg: 18px` and `--radius-xl: 24px`. Because this task explicitly says to preserve Scatter style/component language, treat the existing radius scale as acceptable for this migration pass unless the product owner asks for a Canvasight-token pass later.

## Visual Verification Suggestions

Run these after the implementation pass, not during this read-only review.

### DOM And Computed Style Checks

- Assert no `.sidebar`, `.project-list`, `.kit-project-item`, `.startup-shell`, or `.startup-panel` exists in the active app DOM.
- Assert `document.documentElement.dataset.translucent !== "true"` and no translucent mode is toggled from settings.
- Assert computed `backdrop-filter` and `-webkit-backdrop-filter` are `none` on app shell, canvas shell, and any startup-related element.
- Assert `body`, `.app-shell`, and `.canvas-shell` computed background colors are opaque in light and dark modes.
- Assert the browser network panel does not request `startup-bulb.jpg` or `startup-toolbox.png`.

### Screenshot States

- Capture desktop light mode at 1440x920: canvas occupies the page, no left rail, topbar compact, toolbar visible.
- Capture desktop dark mode at 1440x920: same layout, no transparent/vibrancy effect, contrast still readable.
- Capture 1280x800: canvas remains primary, toolbar does not wrap, drawer can open without breaking the canvas.
- Capture a narrow review/editing width: secondary controls collapse before text overlaps.
- Capture an empty session: useful Canvasight next action, not project-list copy.
- Capture a populated canvas: at least two nodes connected, selected node, hover node, and visible connection handle.
- Capture right drawer tasks view and Markdown view, including source/preview segmented switch and resize handle.
- Capture settings/dialog/popover states and verify overlays do not blur or dim the whole app unless that overlay behavior is intentionally designed.

### Interaction Checks

- Add node, select node, edit title/body, attach/remove a file chip, connect nodes, duplicate/delete node from menu.
- Pan, zoom to each preset, fit canvas, undo/redo.
- Open/close task drawer and Markdown drawer; resize Markdown drawer.
- Switch segmented source/preview and confirm the moving indicator remains aligned.
- Navigate toolbar and node controls by keyboard; focus rings remain visible.
- Toggle theme and language if kept; verify no translucent switch remains.

### Automated Visual Guards

- Add a Playwright or browser check that fails when `.sidebar` exists or when `.app-shell` grid reserves a 288px left column.
- Add a computed-style check that fails on any `backdrop-filter` not equal to `none`.
- Add a screenshot diff guard for a "no left rail" desktop canvas state.
- Add a pixel or computed-style check that the body background alpha is 1.

## Issue Reports

### P1 - Left project list remains mounted and layout reserves left rail

**Evidence:** `App.tsx` imports and renders `Sidebar`; `.app-shell` reserves a 288px first column. Current code points: `src/App.tsx:53`, `src/App.tsx:2218`, `src/styles/app.css:193`.

**Impact:** Violates the explicit web requirement "不显示左侧项目列表" and keeps the app oriented around Scatter's local-project launcher rather than Canvasight's web canvas workspace.

**Expected:** No sidebar DOM, no project list, no 288px reserved column, no sidebar toggle/add-project affordance.

**Suggested fix:** Remove `Sidebar` from the main app shell, flatten `.app-shell` to a single workspace column, redesign topbar leading actions around Canvasight session/source controls, and delete or isolate project-list CSS from the web bundle.

### P1 - Translucent/glass mode is still active in settings, state, and CSS

**Evidence:** `defaultAppSettings.translucentBackground` is true, `App.tsx` writes `dataset.translucent`, CSS adds rgba backgrounds and `backdrop-filter`, and SettingsDialog exposes the switch. Current code points: `shared/types.ts:25`, `src/App.tsx:562`, `src/App.tsx:1117`, `src/styles/app.css:115`, `src/styles/app.css:227`, `src/components/SettingsDialog.tsx:172`.

**Impact:** Violates "不要客户端背景模糊、玻璃态、半透明/vibrancy" and creates fragile browser visual behavior across platforms.

**Expected:** No translucent preference, no translucent dataset, no backdrop filters, and opaque app/canvas backgrounds.

**Suggested fix:** Remove translucent settings from web UI and rendered CSS path. Keep only opaque light/dark tokens. If data compatibility is needed, ignore the field in web runtime instead of exposing it.

### P1 - Startup/splash surface remains in the web renderer

**Evidence:** `App.tsx` branches on `?window=splash` and renders Scatter splash with startup image; CSS includes full-screen startup shell and panel. Current code points: `src/App.tsx:583`, `src/App.tsx:2184`, `src/styles/app.css:207`.

**Impact:** Violates "不要启动页背景" and conflicts with `design.md` first-screen rule that the app should open on the working surface.

**Expected:** Web Canvasight has no splash route, no startup background image, and no startup copy. The first screen is the canvas or canvas-empty state.

**Suggested fix:** Remove the splash branch and startup image import from web runtime. Delete or tree-shake startup CSS/assets if they are not needed by any other surface.

### P1 - Canvasight web adapter exists but App still calls `window.scatter`

**Evidence:** `src/lib/canvasightApi.ts` defines session and REST methods, but `App.tsx` still calls `window.scatter.*` throughout, for example `getRecentProjects`, settings, project open/save, attachments, run assistant, and reveal-in-folder.

**Impact:** Even if the visual migration is corrected, the web app can fail before visual QA because the Electron preload API is absent in a browser. It also keeps project-list behavior coupled to Electron's recent-project APIs.

**Expected:** App uses Canvasight's web session API contract, with no Electron preload dependency in browser runtime.

**Suggested fix:** Introduce a typed API boundary that maps Canvasight session APIs to the existing renderer needs, then remove recent-project and Electron-only calls from the web surface.

### P2 - Topbar still carries desktop-window chrome assumptions

**Evidence:** CSS uses a fixed 44px topbar, `padding-left: 92px`, and `-webkit-app-region` drag/no-drag markers. Current code points: `src/styles/app.css:1066`, `src/styles/app.css:1076`, `src/styles/app.css:1078`, `src/styles/app.css:1116`.

**Impact:** Browser UI may show unexplained left dead space and non-web semantics. This can make the no-sidebar layout look visually off even after the sidebar is removed.

**Expected:** Topbar spacing is designed for browser workspace controls, not macOS traffic lights.

**Suggested fix:** Remove Electron drag-region rules from the web bundle and reset topbar leading alignment after sidebar removal.

### P2 - Scatter naming and project copy can leak into Canvasight

**Evidence:** `index.html` title is `Scatter`; startup h1 is `Scatter`; translations include project-list and startup strings.

**Impact:** Brand/copy mismatch makes the product feel like an embedded Scatter client rather than Canvasight.

**Expected:** Canvasight naming and copy appear wherever user-facing text remains. Removed surfaces should not keep dead translations that can accidentally reappear.

**Suggested fix:** Rename web title and surviving strings. Delete or quarantine Scatter startup/project-list translations after those surfaces are removed.

### P2 - AGENTS current-command section is stale relative to plugin package scripts

**Evidence:** Root `AGENTS.md` says no project commands are defined, while `plugins/canvasight/package.json` defines `dev`, `build`, `typecheck`, `preview`, and `test:mcp`.

**Impact:** Future agents may skip verification or assume no build system exists.

**Expected:** Once implementation changes are allowed, root instructions and README should reflect the plugin commands or explicitly scope them to `plugins/canvasight`.

**Suggested fix:** In a later non-read-only pass, update AGENTS/README command documentation without changing app behavior.

## Recommended Implementation Order

1. Wire the web API boundary first so the app can render in a browser without Electron preload.
2. Remove sidebar/project-list surfaces and collapse app shell to a single workspace.
3. Remove splash/startup surfaces and assets from the web path.
4. Remove translucent/glass settings and CSS; keep opaque tokens.
5. Adjust topbar spacing and actions after sidebar removal.
6. Run build, browser-visible checks, and screenshot verification across light/dark and drawer states.

## Review Limits

- No browser-visible verification was performed in this read-only pass.
- No source file changes were made by this audit, except adding this report.
- Current Canvasight source is untracked in Git (`plugins/` and `.agents/` are untracked), so compare carefully before editing in a later pass.
