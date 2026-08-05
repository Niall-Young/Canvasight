# File Asset Node Design QA

## Evidence

- Source visual truth: `/var/folders/n5/q0bmv3hd3rv1q8_rkkmbp59w0000gn/T/codex-clipboard-4b08cdbc-7e4a-4ece-986a-e518bd5a141f.png`
- Browser-rendered implementation: `output/playwright/file-asset-rich-layout-final-guide.png`
- Focused implementation: `output/playwright/file-asset-rich-layout-final-guide-node.png`
- Hover state: `output/playwright/file-asset-rich-layout-final-guide-hover.png`
- Unknown-format fallback: `output/playwright/file-asset-rich-layout-final-unknown.png`
- Media regressions: `output/playwright/file-asset-rich-layout-final-image-unchanged.png`, `output/playwright/file-asset-rich-layout-final-video-unchanged.png`
- Combined comparison input: `output/playwright/design-qa/file-asset-layout-comparison.png`
- Viewport: 1280 × 720 CSS px, desktop canvas, dark theme, canvas zoom 72% for the focused node capture.
- Pixel/density normalization: source 938 × 294 px; full implementation 1280 × 720 px; focused implementation 260 × 98 px, representing the 360 × 132 CSS-px node at 72% canvas zoom. The combined comparison normalizes both inputs to 520 px width and centers them in equal 520 × 220 frames. The reference is a layout example rather than a same-theme or same-scale pixel target.
- State: `guide.md` file Asset at rest and hovered; `unknown-fallback.bin`; existing image and video Assets; persistent Edges and both relationship handles.

## Findings

- No actionable P0/P1/P2 differences remain.
- Typography: the implementation keeps the reference's two-line hierarchy with a 16/22 medium filename and a muted 12 px metadata line. Ellipsis protects the horizontal layout.
- Spacing and layout rhythm: the format icon and text form one horizontal row with a 16 px gap. Side and bottom padding are 16 px, matching a plain Task card; the 60 px top padding includes the persistent classification-control row and the same 16 px content clearance. No inner gray card remains.
- Colors and visual tokens: the card uses Canvasight's surface, divider, radius, shadow, and text tokens. The reference's light-only palette was not copied into the active dark theme.
- Image quality and asset fidelity: the visible file icon is the exact user-supplied SVG loaded through the existing icon registry. It remains vector content; no generated, handcrafted, or substitute icon is used. Image and video Assets preserve their direct-media surfaces.
- Copy and content: ordinary files show the actual filename and `FORMAT · SIZE`; unsupported formats use the supplied unknown-file icon. Image/video filename and size stay hidden as specified.
- Affordances: classification stays at the upper-left; More remains opaque and appears only on hover/focus/selection/open; left and right handles remain vertically centered and their persisted Edge caps sit on the visible node boundary.

## Full-view comparison

The 1280 × 720 browser capture confirms that the compact file card fits the surrounding canvas density, remains visually subordinate to Task content, and does not reintroduce an outer/inner card stack. Existing image and video surfaces retain their distinct direct-media treatment.

## Focused comparison

The combined comparison shows the same core composition as the source: one white surface, format icon on the left, and a two-line text stack on the right. The implementation is intentionally taller because Canvasight keeps the required classification dropdown in the upper-left; the content row remains aligned and evenly padded below it.

## Comparison history

1. Earlier P1 finding: the file Asset used a centered generic icon, exposed no filename or metadata, left excessive empty space, and did not use the supplied format artwork.
2. Fix: added the eight supplied SVGs to the existing registry, mapped the supported formats with unknown fallback, and replaced the centered layout with a compact horizontal icon/name/metadata row on a single surface.
3. Post-fix evidence: `output/playwright/design-qa/file-asset-layout-comparison.png` plus the focused rest/hover/unknown captures. No remaining P0/P1/P2 issue was found.

## Open Questions

- None for this delivery. The reference is used for layout direction; Canvasight theme, role control, and 360 px node width remain intentional product constraints.

## Implementation Checklist

- [x] Use exact supplied SVG assets through the existing icon registry.
- [x] Map PDF, MD, PPT, CSV, XLS, DOC, and common code extensions.
- [x] Route every other ordinary-file format to the supplied unknown icon.
- [x] Show a horizontal filename and format/size summary on one white surface.
- [x] Preserve image/video surfaces, role/More controls, and connected Edge geometry.
- [x] Verify the rendered browser state and console.

## Follow-up Polish

- None required for acceptance.

final result: passed
