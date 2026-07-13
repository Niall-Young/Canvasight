# Skill composition contract

Canvasight supports three separate Skill decisions. Keep their intent and validation metadata distinct.

## Canvas-level content Skills

Use `contentMode: "canvasight-default"` when Canvasight supplies the content framework. Omitted `contentMode` means this mode and must preserve existing behavior.

Use `contentMode: "skill-led"` when an explicitly invoked `$Skill` or a Codex-routed professional Skill supplies the content method and conclusions. Set `contentSkills` with exactly one `primary`; add an `augment` only when it contributes a compatible, non-duplicative specialty. An explicit `$Skill` takes priority over implicit description routing. If two Skills have incompatible content requirements, ask the user which direction to keep before calling `write_canvasight_graph`.

In `skill-led` mode, do not add default business, domain, maturity, or guidance content merely to satisfy Canvasight's canonical contracts. Still cover every node created or updated by the write, state every compound responsibility, describe every edge between covered nodes, pass revision and atomic-write checks, and preserve horizontal left-to-right topology.

Professional Skills provide content only. Canvasight is the sole writer of nodes, edges, revisions, and `.scatter` state. Ignore or translate any professional Skill request for vertical layout, custom coordinates, direct file writes, or a competing persistence format.

## Node-level Skill assignments

A node-level assignment means that a Skill should execute only for that node's visible responsibility. It is represented twice in one write:

1. The node body contains the editable token `$skill-name`.
2. `frameworkManifest.skillAssignments[nodeId]` contains the matching metadata:

```json
{
  "node-id": [
    {
      "name": "skill-name",
      "source": "ai-selected",
      "rationale": "The node responsibility is an explicit match for the Skill description."
    }
  ]
}
```

Use `source: "user-explicit"` when the user names the Skill for that node in the request or when preserving an existing user-authored assignment. It remains allowed when autonomous assignment is disabled and does not require a rationale.

Use `source: "ai-selected"` only when `get_canvasight_graph_context` reports `preferences.aiSkillAssignmentEnabled: true`. Query `list_canvasight_skills` using the node's responsibility, compare only the returned name and description metadata, and assign only an unambiguous match. Every AI-selected entry requires a responsibility-specific rationale. A broad, adjacent, or merely plausible Skill is not a match; leave that node unassigned.

Every assignment must reference a final candidate node and exactly match a `$skill-name` token in its body. Multiple Skills are allowed when each has a distinct responsibility-specific role. Never add hidden Page fields or remove existing visible assignments merely because the preference is off.

If Skill discovery is unavailable, continue the graph write without autonomous assignments and preserve any user-explicit tokens. Treat the returned advisory as recoverable; do not guess names or descriptions.

## Manual node selection

Users may type or select `$skill-name` directly in a node. Preserve these tokens as ordinary, visible, copyable body text. The UI interaction is not evidence that the Skill should lead the whole canvas; promote it to `contentSkills` only when the user clearly asks that Skill to shape the canvas-level content.
