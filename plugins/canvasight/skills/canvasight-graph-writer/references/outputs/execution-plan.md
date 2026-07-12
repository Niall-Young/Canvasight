# Output: execution-plan

Use a staged dependency graph from objective and prerequisites through work, verification, delivery, and recovery.

- Separate parallel branches only when they can progress independently.
- Pair each implementation stage with its verification rather than placing all tests in an unrelated final branch.
- Show blockers and stop conditions before the work they prevent.
- Put release, handoff, rollback, and unresolved risk at the end of the applicable path.
