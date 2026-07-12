# Validation and repair loop

Validation is a pre-write quality gate, not a user-facing report. `write_canvasight_graph` evaluates the complete candidate Page after applying the proposed graph or operations and commits only a passing candidate.

## Coverage rules

- For `create`, `analyze`, `organize`, `decide`, and `execute`, include every canonical key from the selected primary-domain and maturity references.
- For `refine`, include at least one relevant primary-domain key and one relevant maturity key for the touched content. Validate the final Page's complete structure while leaving unrelated content unchanged.
- For each secondary domain, include at least one relevant canonical key; do not import its entire contract unless the request truly requires it.
- Coverage values contain final node IDs. Every referenced node must exist and substantively contain the promised content.
- One node may satisfy multiple related keys only when they support one named responsibility and `semanticStructure` explains why the content belongs together. A generic root, placeholder, or overloaded prose node cannot satisfy an entire contract.
- `semanticRelationships` uses final edge IDs. Every edge connecting covered nodes must declare an allowed relationship type and a source-target-specific rationale.

## Required repair loop

1. Submit the best complete candidate with `frameworkManifest`.
2. On rejection, parse machine-readable violations by `code`, `coverageKey`, `nodeIds`, and suggested correction.
3. Preserve passing nodes and requirements. Change only the failed content or invalid operations.
4. Rebuild coverage against the corrected final Page and resubmit with the newest revision when required.
5. Allow at most three total validation attempts, including the first submission.

Do not write a partial candidate between attempts. Do not treat warnings about style as successful completion when domain, maturity, structure, evidence, or revision requirements fail.

## Delivery behavior

After a passing write, tell the user what was created or changed, not the internal violation history. If all three attempts fail, the document must remain unchanged. Report only the genuine blocker: missing source/input, inaccessible evidence, conflicting requirements, or concurrent edits that cannot be reconciled. Do not dump validator diagnostics on the user or claim the canvas was updated.

## Content rejection signals

Reject coverage backed only by empty bodies, headings repeated as body text, placeholders, or vague claims such as “keep it simple” and “ensure quality.” Analysis must distinguish confirmed fact, inference, and question. Product/UX graphs must keep definition, flow, and design as the main structure; implementation and QA remain supporting branches.

Reject an AI-authored candidate that requests vertical flow, uses dependency progress in a direction other than left to right, omits a covered-node edge from `semanticRelationships`, or turns reading order, numbering, or loosely ordered work into an unsupported full-chain topology. `exploration-map`, `decision-map`, and `structured-outline` never permit a covered-node full chain; `execution-plan` permits one only with `dependency`/`sequence` edges, and `system-map` only with `dependency`/`flow`/`navigation` edges. Repair the relationship metadata and topology together, preserving a consecutive edge only when its declared rationale is genuine.

Treat `mixed_responsibilities`, `hidden_submodules`, `parent_duplicates_children`, and `relationship_missing` as semantic repair instructions. Split independently actionable or verifiable content, move repeated detail out of the parent, and connect the resulting relationship. If combined content truly expresses one inseparable conclusion, keep it together and make the responsibility and reason explicit in `semanticStructure`.

Do not repair semantic violations by padding, mechanically splitting prose, forcing a fixed depth, or targeting node, branch, coverage, or character counts. Repair the responsibility boundaries and relationships instead.
