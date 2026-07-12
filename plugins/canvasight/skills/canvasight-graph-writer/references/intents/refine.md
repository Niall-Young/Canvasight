# Intent: refine

Use for supplementing, correcting, splitting, removing, or deepening an existing Canvasight graph.

## Thinking contract

- Read current Page context first and identify the exact affected node IDs and relationships.
- Preserve all content, positions, and edges outside the requested change.
- Reuse stable IDs for updated nodes; create new IDs only for new nodes.
- When splitting a node, keep its role clear and reconnect descendants deliberately rather than duplicating the branch.
- Update coverage to reference the final node IDs after the patch.
- Scope coverage to the touched branch: include at least one relevant primary-domain key and one relevant maturity key. Do not expand unrelated branches merely because the existing Page predates framework metadata or lacks a complete domain contract.
- Infer output from the current node/edge topology after reading context. Do not claim to inherit persisted framework metadata because Canvasight does not store it in the Page.

Default to `merge-active-page`. Use replacement modes only when the user explicitly requests a redo or reset.
