---
name: canvasight-imagegen
description: "Generate new raster images with Codex imagegen and add every final result to the active Canvasight Page as a managed Asset Node. Use when the user invokes @Canvasight or otherwise asks to generate, create, draw, or render a new image directly into Canvasight. Do not use for editing an existing Canvasight Asset in place."
---

# Canvasight Image Generation

Generate with the system `$imagegen` Skill, then import the accepted bitmap outputs through Canvasight's atomic generated-image tool. Never hand-edit `.scatter`, pass an unmanaged path to `write_canvasight_graph`, or substitute browser automation.

## Workflow

1. Read the active task's exact `CODEX_THREAD_ID`.
2. Reuse a Canvasight native widget only when this task already has verified fullscreen ready evidence. Otherwise follow `canvasight-open`: call `open_canvasight` with that `threadId`, preserve its `sessionId` and `openAttemptId`, then call `await_canvasight_widget_ready`. Stop before generation unless the result is verified `status: "ready"` with React, project hydration, rendered canvas, and visible non-zero canvas evidence.
3. Call `get_canvasight_graph_context` with the same `threadId`. Preserve its `projectPath`, `contextId`, `documentRevision`, and active Page identity before starting image generation. Later Page switches must not retarget the import.
4. Invoke the system `$imagegen` Skill. Use its built-in tool path by default, one call per requested final image or variant. Follow its transparency, inspection, retry, and CLI-consent rules exactly.
5. Keep only outputs that pass imagegen inspection. Call `add_canvasight_generated_images` with:
   - the exact `threadId` and captured `projectPath`;
   - the captured `contextId` and `documentRevision` as `expectedRevision`;
   - one stable unique `clientMutationId` for this exact batch, reused only for retries;
   - one `{ "path", "title"? }` entry per final image, in the requested display order.
6. Treat `written`, `merged`, and `conflict-copy` as successful imports. Report the target Page, created node count, managed project-relative paths, final prompt set, and whether imagegen used the built-in or user-approved CLI path.

### Product-design option flow

When the request is to explore a product or UI design before frontend implementation:

1. Resolve the target surface, intended user, outcome, viewport, and hard constraints before generation.
2. Unless the user specifies another count, generate exactly three independent UI images. Each image is one distinct direction with a meaningfully different hierarchy, layout, or interaction model; never combine multiple directions into one image.
3. Import all accepted options as separate Asset Nodes in their visible result order, then stop for the user's selection. Do not choose a direction or start implementation on the user's behalf.
4. Tell the user to connect the chosen Asset to the implementation Task and Run from that Asset. Canvasight will treat the starting Asset as the selected primary reference, attach only its image path plus its downstream scope, and ask the receiving AI to reproduce that visual faithfully.
5. If the project exposes a matching product-design or image-to-code Skill, it may be named visibly in the downstream Task body. Do not persist a hidden Skill assignment or assume that an unavailable external Skill is installed.

## Boundaries

- This Skill creates new PNG, JPEG, or WebP Asset Nodes only. Do not use it to mutate or replace an existing Canvasight Asset.
- Import at most 16 final images per tool call. For a larger explicit request, use successive batches without dropping results.
- Do not generate anything when native Canvasight opening or ready verification fails; the requested result could not be delivered to the canvas.
- If imagegen fails, do not create a placeholder node. If import fails, keep the generated source and report the actionable Canvasight error.
- On `context_expired` or `context_revision_mismatch`, do not guess a different Page. Explain that the captured Page binding expired and ask the user to repeat the image request.
- Never expose daemon URLs, tokens, or managed absolute paths in the user-facing result.
