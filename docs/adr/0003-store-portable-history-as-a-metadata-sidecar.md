# Store portable Project History as a metadata sidecar

Status: Accepted for D0; the exact remote ref strategy is blocked on the R0-08 portability probe.

## Context

Users may work on one project across multiple Codex tasks, worktrees, agents, and computers. The History canvas must recover its node summaries and layout without uploading private chat bodies or every automatic code snapshot. The data must also remain independent from the existing `.scatter` Workflow document and its revision model.

## Decision

Canvasight will keep an append-only, versioned Project History journal and rebuild derived indexes from it. Stable event IDs identify snapshots, feature lines, confirmations, merges, abandoned lines, coverage gaps, chat-location handles, and explicit layout edits. Formal history is not deleted; later events may correct metadata, roll back by creating a new path, or mark a line abandoned.

The portable sidecar contains only:

- schema and project identity versions;
- stable event relationships and referenced Git object IDs;
- short user-editable summaries, status, source, and coverage metadata;
- canvas layout and folding state;
- opaque Codex task/turn location handles when the host contract permits them.

It does not contain chat transcripts, source files, diffs, credentials, absolute local paths, daemon tokens, or automatic snapshot objects.

The first R0-08 candidate is a dedicated `refs/canvasight/history/<project-id>` ref. Sidecar commits contain metadata files only and advance through compare-and-swap. Remote sync uses an explicit refspec after one project-scoped authorization; ordinary auto-snapshot refs are never included. A new clone restores history through an explicit sidecar fetch because Git does not fetch custom refs by default.

If a remote rejects custom refs, R0-08 will test a dedicated orphan sidecar branch. Canvasight will not choose that fallback until push, fetch, clone recovery, migration, and conflict behavior have real evidence.

Concurrent sidecars merge by stable event ID. Identical events deduplicate. Conflicting immutable payloads are retained as explicit conflict variants rather than overwritten. Explicit layout edits use deterministic revision metadata and preserve both versions when an automatic merge is unsafe. Missing referenced Git objects remain visible as incomplete nodes.

Local storage and the sidecar use separate versioned contracts. Import is atomic: validate and migrate into temporary state, rebuild the index, then replace the active index. A failed import leaves the current history intact.

## Authorization boundary

- Local automatic snapshots remain local.
- A confirmed node is offered for remote code sync one node at a time.
- The metadata sidecar may auto-sync only after a clear project-scoped authorization that can be revoked.
- No model-visible Git write tool is introduced by this design.

## Verification gate

R0-08 must prove custom-ref and fallback behavior against disposable remotes, including push, fetch, fresh clone import, concurrent writers, missing objects, schema migration, revoked authorization, and failed updates. Until then Canvasight promises local history only.
