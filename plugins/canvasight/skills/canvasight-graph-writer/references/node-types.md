# Canvasight v2 node types

Use these shapes only through `write_canvasight_graph`. Do not edit `.scatter/scatter.json` directly.

## Task Node

```json
{
  "id": "visual-brief",
  "type": "task",
  "title": "Define the visual direction",
  "body": "Turn the approved references into an executable brief.",
  "parentId": "visual-group"
}
```

Task Nodes own executable, decidable, or verifiable responsibilities. Only Task Nodes participate in framework responsibility coverage and node-level `$Skill` assignment.

Task `body` is persisted Markdown. Read [task-body-markdown.md](task-body-markdown.md) before creating or updating it. New inline `attachments` are forbidden; existing legacy attachments remain readable and can be removed or atomically promoted with `promote-attachment`.

## Asset Node

```json
{
  "id": "homepage-reference",
  "type": "asset",
  "title": "Homepage reference",
  "description": "Spacing and hierarchy reference.",
  "parentId": "visual-group",
  "asset": {
    "id": "existing-asset-id",
    "relativePath": ".scatter/assets/homepage-reference.png"
  }
}
```

An Asset Node references exactly one file already managed under the current project's `.scatter/assets` directory. Reuse the `id` and `relativePath` returned by `get_canvasight_graph_context`; the server resolves and validates the stored path. Never invent an absolute path, MIME, `kind`, or external file reference. Image, managed SVG, video, and ordinary files all use this same node shape; Canvasight infers their presentation from the validated file.

Asset Nodes do not receive node-level Skills, satisfy Task responsibility coverage, or run independently. They are node-shaped attachments: connect an Asset into an ordinary Task flow and it travels with that Task's Run; leave it outside the Task's reachable flow and it is unrelated. Product-design candidates use this same rule without a special selection state. The persisted `role` field remains readable only for legacy schema compatibility. Do not author it as current intent; express evidence, dependency, output, or other meaning with Edge direction, labels, and surrounding context.

To promote a legacy Task attachment, first read its lightweight handle from the Task's `legacyAttachments`, then use a modern context-bound merge:

```json
{
  "op": "promote-attachment",
  "nodeId": "visual-brief",
  "attachmentId": "existing-attachment-id",
  "assetNodeId": "visual-brief-reference",
  "edgeId": "visual-brief-reference-edge",
  "edgeLabel": "Attachment"
}
```

Canvasight validates the existing managed file, removes only that inline reference, creates the Asset in the same Group, and adds `Task -> Asset` atomically. Reuse the same `clientMutationId` only when retrying this exact operation.

## Group Node

```json
{
  "id": "visual-group",
  "type": "group",
  "title": "Visual direction",
  "description": "References and the decisions they inform.",
  "width": 1120,
  "height": 520
}
```

A Group is one non-nested semantic container. Task/Asset membership is stored through `parentId`; never create a containment Edge for the same relationship and never connect an Edge to a Group. One Task/Asset may have at most one `parentId`.

To move an existing Task/Asset into a Group:

```json
{ "op": "update-node", "nodeId": "visual-brief", "changes": { "parentId": "visual-group" } }
```

To remove it from a Group, pass an explicit null value:

```json
{ "op": "update-node", "nodeId": "visual-brief", "changes": { "parentId": null } }
```

Group collapse state is human-owned Page view state. Never submit or modify `viewState` in an AI graph write.
