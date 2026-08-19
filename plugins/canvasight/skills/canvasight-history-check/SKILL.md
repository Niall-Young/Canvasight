---
name: canvasight-history-check
description: "Validate one exact Canvasight Project History snapshot and record bounded functional evidence. Use only when a user-initiated History check prompt supplies a project path, node ID, snapshot ref/commit, current task ID, and short-lived Agent-check token; never trigger for ordinary testing, code review, Git work, or History browsing without that token."
---

# Canvasight History Check

Validate the protected snapshot named by the widget request, then report the result through `record_project_history_agent_check`.

## Workflow

1. Confirm the request includes the exact project path, History node, snapshot ref and commit, current task ID, and Agent-check token. Stop if any item is missing.
2. Read the project instructions and inspect the final diff represented by the snapshot.
3. Validate in an isolated checkout of that exact commit. Keep the user's current checkout, index, branches, and `main` unchanged.
4. Run relevant declared checks and perform functional acceptance that exercises the changed behavior. Do not treat build success alone as functional proof.
5. Choose `passed` only when the requested behavior was observed and relevant checks passed. Use `failed` for a defect, unavailable environment, missing prerequisite, or inconclusive result, and explain which one occurred.
6. Call `record_project_history_agent_check` exactly once with the supplied project path, current task ID, token, outcome, concise summary, and at most 20 short evidence items.
7. Return the same concise conclusion to the user. Do not expose the token in the response.

## Safety Boundary

- Never confirm a node, merge, commit, push, reset, or rewrite history.
- Never modify the current checkout to make a failing snapshot pass.
- Never reuse a token for another node, project, or later check.
- Never include secrets, full chat content, or large command output in evidence.
- If isolated validation cannot be completed safely, record `failed` with the blocker instead of guessing.
