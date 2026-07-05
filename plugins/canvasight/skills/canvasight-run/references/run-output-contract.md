# Canvasight Run Output Contract

After `await_canvasight_run`, read `structuredContent.codexMode` first. If it is missing, treat `structuredContent.planMode === true` as `codexMode: "plan"`; otherwise default to `codexMode: "chat"`.

Then read `structuredContent.agentTeam`.

- If `structuredContent.agentTeam.enabled === true`, use the `canvasight-agent-team` skill before executing the returned Markdown.
- If Agent Team work is actually used, check whether the target project `AGENTS.md` contains persistent roster and report protocol rules before assigning role agents. Create or update `AGENTS.md` only when the user requested durable Agent Team setup or the project rules allow that edit; otherwise record the gap or ask before writing.
- Use `structuredContent.agentTeam.recommendedRoles` as suggestions for which fixed roster roles to call. Reuse or resume existing role agents first; create a role only when that required role is missing.
- Use `structuredContent.agentTeam.reportProtocol` for the report queue shape when a blocker, high-risk issue, or cross-role handoff appears.
- If `structuredContent.agentTeam.enabled === false`, handle the Run as a normal Canvasight task unless the project `AGENTS.md` imposes its own workflow.

## Chat

For `chat`, continue as a normal Codex task using the returned Markdown as context.

## Plan

For `plan`, treat the Canvasight run as an explicit request to use Codex's native Plan mode.

`structuredContent.codexNative.status` must be `applied` before editing files, running side-effectful commands, or carrying out the work. If it is missing, failed, disabled, or skipped, stop and report that native Plan mode was not opened instead of silently downgrading to prose-only planning.

## Goal

For `goal`, treat the Canvasight run as an explicit request to use Codex's native Goal mode.

`structuredContent.codexNative.status` must be `applied` before editing files, running side-effectful commands, or carrying out the work. If it is missing, failed, disabled, or skipped, stop and report that native Goal mode was not opened instead of silently downgrading to a normal task.

## Prohibited Paths

Canvasight mode selection is a structured MCP contract backed by Codex app-server native requests. It must not reintroduce UI automation, Accessibility scripting, DOM clicks, clipboard paste, or `codex://threads/new` to toggle Codex controls.
