# Canvasight Run Output Contract

Canvasight Run can arrive in two ways:

- Native widget delivery: the Canvasight Codex widget receives the host bridge and sends the Run as a follow-up message to the current Codex thread.
- Await fallback: browser/dev fallback pages queue the payload, then the current thread calls `await_canvasight_run` and receives Markdown plus `structuredContent`.

Default plugin Run clicks should come from native widget delivery. Browser URL and bare dev Run clicks require an explicit current-thread claim before daemon direct delivery; without that claim they must report `unbound_dev_session` instead of sending to a launch-thread fallback. A `sent` result from an isolated app-server process is not sufficient evidence that the live Codex Desktop thread received the Markdown.

For await fallback, after `await_canvasight_run`, read `structuredContent.codexMode` first. If it is missing, treat `structuredContent.planMode === true` as `codexMode: "plan"`; otherwise default to `codexMode: "chat"`.

Then read `structuredContent.agentTeam`.

- If `structuredContent.agentTeam.enabled === true`, use the `canvasight-agent-team` skill before executing the returned Markdown.
- If Agent Team work is actually used, check whether the target project `AGENTS.md` contains persistent roster and report protocol rules before assigning role agents. Create a missing `AGENTS.md` or append the missing Agent Team section by default so the workflow survives a new Codex thread. If existing project rules explicitly forbid this edit or conflict with Canvasight defaults, create an issue/risk report and ask before changing them.
- Prefer `structuredContent.agentTeam.agentsMd` when present. `created`, `appended`, `updated`, or `unchanged` confirms the durable rule is ready. `failed` means report the write error before continuing. `skipped` is acceptable only when Agent Team is disabled; if it was skipped by project rule, report that constraint before continuing.
- Use `structuredContent.agentTeam.recommendedRoles` as suggestions for which fixed roster roles to call. Reuse or resume existing role agents first; create a role only when that required role is missing.
- Use `structuredContent.agentTeam.reportProtocol` for the report queue shape when a blocker, high-risk issue, or cross-role handoff appears.
- If `structuredContent.agentTeam.enabled === false`, handle the Run as a normal Canvasight task unless the project `AGENTS.md` imposes its own workflow.

## Chat

For `chat`, continue as a normal Codex task using the returned Markdown as context.

## Plan

For `plan`, treat the Canvasight run as an explicit request to use Codex's native Plan mode.

For native widget delivery, the follow-up turn itself is the evidence that Canvasight reached the current thread. For await fallback payloads, `structuredContent.codexNative.status` must be `applied` before editing files, running side-effectful commands, or carrying out the work in Plan mode. If it is missing, failed, disabled, or skipped, stop and report that native Plan mode was not opened instead of silently downgrading to prose-only planning.

## Goal

For `goal`, treat the Canvasight run as an explicit request to use Codex's native Goal mode.

For native widget delivery, the follow-up turn itself is the evidence that Canvasight reached the current thread. For await fallback payloads, `structuredContent.codexNative.status` must be `applied` before editing files, running side-effectful commands, or carrying out the work in Goal mode. If it is missing, failed, disabled, or skipped, stop and report that native Goal mode was not opened instead of silently downgrading to a normal task.

## Prohibited Paths

Canvasight mode selection is a structured MCP contract backed by Codex app-server native requests. It must not reintroduce UI automation, Accessibility scripting, DOM clicks, clipboard paste, or `codex://threads/new` to toggle Codex controls.
