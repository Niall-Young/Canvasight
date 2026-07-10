# Canvasight Run Output Contract

Canvasight Run can arrive in two ways:

- Native widget delivery: the Canvasight Codex widget receives the host bridge and sends the Run as a follow-up message to the current Codex thread. The bridge may be MCP Apps `ui/message` or Codex/OpenAI compatibility `window.openai.sendFollowUpMessage`.
- Await fallback: browser/dev fallback pages queue the payload, then the current thread calls `await_canvasight_run` and receives Markdown plus `structuredContent`.

Default plugin Run clicks must come from native widget delivery. Browser URL and bare dev Run clicks require an explicit current-thread claim before their queued payloads can target that thread; without that claim they must report `unbound_dev_session` instead of sending to a launch-thread fallback. Do not use app-server `turn/start`, virtual clicks, clipboard, Accessibility, or DOM automation as a Run success path.

Before native open, read the active task's `CODEX_THREAD_ID` and pass it as `threadId`. After `open_canvasight`, call `await_canvasight_widget_ready` with the returned `sessionId`, `openAttemptId`, and same `threadId`; require verified fullscreen readiness and all React/project/canvas evidence before treating the accepted instance as ready for Run. `ui/message` posts a Chat follow-up to the widget-owning task. A missing id is `current_thread_id_required` and must block opening. After `ui/initialize` resolves, a missing advertised `hostCapabilities.message` is not by itself a failure; actual `sendMessage` Promise rejection is the Chat delivery failure boundary.

If a Run toast or diagnostics shows `browser_fallback_no_bridge`, classify it as an opening-path error: the current page is browser fallback/dev, not a native widget. Do not keep debugging host bridge transports from that page. Reopen Canvasight through `open_canvasight`; if the native tool is not visible, call `tool_search` for `canvasight open_canvasight render_canvasight_canvas_widget` before declaring the thread stale.

If `open_canvasight`, `await_canvasight_widget_ready`, `open_canvasight_recent_project`, or `await_canvasight_run` is visible but fails with `Transport closed`, classify it as `canvasight_mcp_transport_closed`. The live Codex task's Canvasight MCP transport is closed, so the same task cannot open or verify the native widget or consume queued fallback Runs. Inspect `mcp-lifecycle.log` when available before asking for reload/new-task. Do not switch to browser fallback, app-server `turn/start`, virtual clicks, clipboard, Accessibility, or DOM automation as a substitute sent path.

For await fallback, normalize every Run to `codexMode: "chat"`. Older documents or queued payloads may still contain `codexMode: "plan"`, `codexMode: "goal"`, or `planMode: true`; retain their Markdown and other structured data, but treat those mode fields as legacy data and do not block or change the Codex task mode.

Then read `structuredContent.agentTeam`.

- If `structuredContent.agentTeam.enabled === true`, use the `canvasight-agent-team` skill before executing the returned Markdown.
- If Agent Team work is actually used, check whether the target project `AGENTS.md` contains persistent roster and report protocol rules before assigning role agents. Create a missing `AGENTS.md` or append the missing Agent Team section by default so the workflow survives a new Codex thread. If existing project rules explicitly forbid this edit or conflict with Canvasight defaults, create an issue/risk report and ask before changing them.
- Prefer `structuredContent.agentTeam.agentsMd` when present. `created`, `appended`, `updated`, or `unchanged` confirms the durable rule is ready. `failed` means report the write error before continuing. `skipped` is acceptable only when Agent Team is disabled; if it was skipped by project rule, report that constraint before continuing.
- Use `structuredContent.agentTeam.recommendedRoles` as suggestions for which fixed roster roles to call. Reuse or resume existing role agents first; create a role only when that required role is missing.
- Use `structuredContent.agentTeam.reportProtocol` for the report queue shape when a blocker, high-risk issue, or cross-role handoff appears.
- If `structuredContent.agentTeam.enabled === false`, handle the Run as a normal Canvasight task unless the project `AGENTS.md` imposes its own workflow.

## Chat

Continue as a normal Codex task using the returned Markdown as context. Canvasight node Run has no Plan or Goal mode.

## Prohibited Paths

Canvasight must not use independent app-server requests, UI automation, Accessibility scripting, DOM clicks, clipboard paste, or `codex://threads/new` to change Codex controls or modes.
