# Output: system-map

Use for repositories, services, information architecture, data/state flows, and interacting product surfaces.

- Group by responsibility or boundary, not arbitrary file count.
- Give independently operating surfaces, modules, transformations, or stores their own nodes and connect their actual relationship; do not hide a system boundary inside a component's body.
- Use directed edges for execution, dependency, navigation, or data flow; state the relation in node bodies when ambiguous.
- Keep evidence/source nodes near the component they substantiate.
- Arrange entry points at the left, transformations in the middle, and outcomes or persistence at the right. Use vertical space only to separate parallel branches within the same left-to-right dependency level.
