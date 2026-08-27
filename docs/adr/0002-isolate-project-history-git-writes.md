# Isolate Project History Git writes from user state

Status: Accepted for D0; implementation is blocked on the R0-07 safety probe.

## Context

Project History should protect the net code state produced by a Codex turn without requiring the user to understand Git. A snapshot must not stage files, move `HEAD`, switch a branch, rewrite a user ref, hide changes in a stash, or make the current checkout harder to understand. This is especially important when a project already has staged, unstaged, untracked, renamed, ignored, or externally edited files.

## Decision

Canvasight will implement snapshots as a daemon-internal Git service. V1 will not expose snapshot, worktree, commit, merge, or push as model-visible MCP tools. Enabling protection and every consequential Git action must begin with an explicit native-widget authorization.

The service will use this transaction:

1. Resolve the repository and its common Git directory without changing the process or repository working directory.
2. Acquire a Canvasight project lock and capture a pre-operation fingerprint: symbolic/detached `HEAD`, `HEAD` object, index checksum, porcelain-v2 worktree state, and all non-Canvasight refs.
3. Build the candidate tree through a temporary index outside the user's index. Start from the selected base tree, then add/remove only paths allowed by the project scope and exclusion policy. Record excluded or unsupported paths as coverage gaps; never silently treat an incomplete tree as complete.
4. Write Git objects first, verify the candidate tree and metadata, and create a commit object whose parent is the previous Canvasight snapshot or the selected base.
5. Atomically compare-and-swap only a ref below `refs/canvasight/snapshots/`. A concurrent ref change fails closed and is retried from fresh evidence.
6. Capture the post-operation fingerprint. Success requires the user's `HEAD`, index, worktree, and non-Canvasight refs to match the pre-operation fingerprint. A concurrent external edit aborts the receipt and triggers a fresh scan instead of displaying a false protected state.
7. Remove temporary indexes and locks. Objects written before a failed ref update remain unreachable and may be collected later; no user ref is rolled back because none was changed.

The snapshot tree represents the allowed net filesystem state, not the user's staging intent. The real index remains byte-for-byte untouched. Sensitive files, generated outputs, unsupported submodule/LFS states, and project exclusions are omitted and surfaced in the snapshot's coverage metadata.

Restore never overwrites the active checkout. "Continue from here" will create an isolated worktree at the selected snapshot and bind a new Codex task through an approved host contract. If worktree creation, restoration, or task creation fails, Canvasight removes only resources created by that transaction and leaves the source task and checkout unchanged.

## Forbidden operations

- No `checkout`, `switch`, `reset`, `stash`, or writes through the user's index.
- No movement or deletion of user branches, tags, remotes, or other non-Canvasight refs.
- No automatic code push. Confirmed nodes may be offered for explicit remote sync later.
- No Git write triggered only by chat text, a Run payload, a private deep link, or UI automation.
- No green/protected status before the ref update, fingerprint comparison, and durable receipt all succeed.

## Verification gate

R0-07 must exercise tracked, staged, unstaged, untracked, renamed, deleted, ignored, excluded, and failure-injection fixtures. It must retain commands, exit codes, before/after fingerprints, snapshot reads, and isolated restoration evidence. Any unexplained user-state difference stops the Git-write route.
