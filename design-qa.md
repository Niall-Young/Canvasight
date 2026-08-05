# Asset Classification Removal Design QA

## Evidence

- Source visual truth: `/var/folders/n5/q0bmv3hd3rv1q8_rkkmbp59w0000gn/T/codex-clipboard-d4656bb8-caf4-4d20-9cf7-531cbb79a449.png`
- Browser baseline: `output/playwright/asset-classification-removal-baseline.png`
- Baseline open state: `output/playwright/asset-classification-removal-baseline-open.png`
- Browser-rendered implementation: `output/playwright/asset-classification-removal-final-overview.png`
- Focused media result: `output/playwright/asset-classification-removal-final-image.png`
- More-open result: `output/playwright/asset-classification-removal-final-more-open.png`
- File results: `output/playwright/asset-classification-removal-final-guide.png`, `output/playwright/asset-classification-removal-final-unknown.png`
- Combined comparison input: `output/playwright/design-qa/asset-classification-removal-comparison.png`
- Viewport: 1280 × 720 CSS px, desktop Canvasight canvas, dark theme, canvas zoom 72%.
- Pixel/density normalization: user source 498 × 466 px; baseline and final overview 1280 × 720 px; focused image capture 137 × 60 px, representing the 360 px Asset at 72% canvas zoom. The combined comparison scales both focused states to 500 px width with Lanczos resampling and centers them in equal 520 × 480 panels. The source is a negative-state annotation whose requested target is removal, not a same-state pixel clone.
- State: four persisted Asset types (image, MD file, video, unknown file); classification menu open in the source/baseline, all Assets at rest and hovered after removal, More open on the final unknown Asset.

## Findings

- No actionable P0/P1/P2 differences remain.
- Information architecture and copy: the redundant Input/Reference/Option/Output control and menu are absent from every Asset. Accessible names contain only filenames, and Run Markdown no longer emits `Asset role`.
- Typography: removal introduces no substitute label or explanatory text. Existing filename and metadata hierarchy remains unchanged.
- Spacing and layout rhythm: image/video keep direct-media surfaces with no added top-left reservation. File Assets shrink from 132 px to a 112 px minimum and use `16px 56px 16px 16px`, preserving Task-aligned padding while reserving the More safe area.
- Colors and visual tokens: no new colors or classification states remain. Hover/open More continues to use the opaque Canvasight surface and existing shadow.
- Image quality and asset fidelity: media assets and supplied file-format SVGs are unchanged; no generated or substitute asset was introduced.
- Affordances: More remains in the upper-right and contains only Replace file and Delete. Direct Open, image/video controls, both Handles, and Edge geometry remain available.

## Full-view comparison

The final 1280 × 720 overview shows four Asset types with no upper-left label or reserved control strip. The canvas is materially quieter, and the connected image/file evidence remains understandable through placement, Edge direction, labels, and surrounding Tasks.

## Focused comparison

The combined comparison puts the user's open classification state beside the final image Asset. The entire upper-left trigger and four-item menu are gone, no replacement badge appears, and the image itself is again the complete visible surface. The separately captured More-open state confirms management actions remain reachable without reintroducing classification.

## Primary interactions and regressions

- Four Asset types: role trigger `0`, role option `0`, radio menu item `0`.
- More: hidden at rest; opaque on hover/open; menu contains only Replace file and Delete.
- Files: MD and unknown icons, filename, metadata, and right-side safe area verified.
- Image: natural ratio preserved; no file copy or wrapper regression.
- Video: native controls, ready media, and transparent wrapper preserved.
- Handles/Edges: left/right gaps below `0.0001px`; caps remain inside connection buttons; Group `0` < Edge `1` < Asset `2`.
- Console: 0 errors, 0 warnings in a fresh browser session.

## Comparison history

1. P1 baseline: every Asset exposed a persistent classification capsule; opening it covered the media with a large four-item menu, duplicating relationship meaning already carried by connections.
2. Fix: removed the trigger, options, radio group, accessible role suffix, and Run Markdown role line; retained the persisted field only for v2 compatibility. Right-aligned More and reclaimed file-card padding.
3. Post-fix evidence: final overview, focused media/file captures, More-open capture, and combined comparison. No remaining P0/P1/P2 issue was found.

## Open Questions

- None. Legacy `role` remains data-compatible but is intentionally invisible, non-editable, and excluded from Run Markdown.

## Implementation Checklist

- [x] Remove Asset classification trigger and options from all media/file variants.
- [x] Do not move classification into More.
- [x] Remove role from accessible naming and Run Markdown.
- [x] Keep legacy v2 role readable without migration.
- [x] Reclaim file-card space and protect the More safe area.
- [x] Preserve media, file icons, opening, replacement/deletion, Handles, and Edges.
- [x] Verify the rendered browser state, interactions, and console.

## Follow-up Polish

- None required for acceptance.

final result: passed
