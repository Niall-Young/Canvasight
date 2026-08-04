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

## Asset Node

```json
{
  "id": "homepage-reference",
  "type": "asset",
  "title": "Homepage reference",
  "description": "Spacing and hierarchy reference.",
  "role": "reference",
  "parentId": "visual-group",
  "asset": {
    "id": "existing-asset-id",
    "relativePath": ".scatter/assets/homepage-reference.png"
  }
}
```

An Asset Node references exactly one file already managed under the current project's `.scatter/assets` directory. Reuse the `id` and `relativePath` returned by `get_canvasight_graph_context`; the server resolves and validates the stored path. Never invent an absolute path or reference an external file. Allowed roles are `input`, `reference`, `option`, and `output`.

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
