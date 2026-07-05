# Canvasight stale plugin cache root cause integration summary

## Root cause

The failing screenshot matches the old `canvasight@canvasight-local` `0.1.0` MCP server from the versioned Codex plugin cache. That cached server did not contain the project-level daemon implementation. It served Canvasight from the thread-local MCP process, so the returned random `127.0.0.1` port could become unreachable when the thread-local process was replaced, closed, or cleaned up.

Local evidence:

- `~/.codex/plugins/cache/canvasight-local/canvasight/0.1.0/mcp/server.mjs` did not contain `--daemon`, `ensureDaemonServer`, or `browserUrl`.
- The source tree had daemon code but still reported plugin and server version `0.1.0`, so Codex could keep using a stale versioned cache.
- A real in-app Browser navigation to a current daemon URL succeeded, so the issue was not that Codex's in-app Browser cannot access local `127.0.0.1`.

## Completed work

- Bumped Canvasight from `0.1.0` to `0.1.1` in:
  - `plugins/canvasight/.codex-plugin/plugin.json`
  - `plugins/canvasight/package.json`
  - `plugins/canvasight/package-lock.json`
  - `plugins/canvasight/mcp/server.mjs` `SERVER_VERSION`
- Kept the `open_canvasight` reachability guard and explicit `browserUrl` field so failed daemon startup surfaces as a tool error instead of a browser error page.
- Updated MCP smoke tests to assert server version `0.1.1`, health version `0.1.1`, full browser URL, and root page reachability.
- Added AGENTS guidance requiring a plugin version bump whenever MCP runtime behavior changes.
- Updated README upgrade guidance so users can verify `codex plugin list` shows `0.1.1` or newer.
- Reinstalled the local plugin and confirmed Codex generated `~/.codex/plugins/cache/canvasight-local/canvasight/0.1.1`.

## Role decisions

- Product Agent: The product promise is that Canvasight opens a daemon-backed browser canvas; stale `0.1.0` cache violated that promise.
- Design Agent: No UI design change; `design.md` does not need an update for this runtime/cache fix.
- Development Agent: Version bump plus daemon health version alignment is the durable fix.
- Test Supervisor Agent: Verified both source tree and installed cache.
- Customer Support Agent: README needed upgrade/cache guidance because this is a user-visible installation failure mode.
- Development Standards Lead: AGENTS needed a durable rule so runtime changes do not ship under a stale plugin version again.
- Project Management Agent: Do not stage unrelated UI changes without a separate scope decision.

## Verification

- `npm run test:mcp` passed in `plugins/canvasight`.
- `npm run typecheck` passed in `plugins/canvasight`.
- `npm run build` passed in `plugins/canvasight`.
- Plugin validation passed.
- `codex plugin add canvasight@canvasight-local` installed cache path `~/.codex/plugins/cache/canvasight-local/canvasight/0.1.1`.
- `codex plugin list | rg -n 'canvasight|canvasight-local'` showed `canvasight@canvasight-local installed, enabled 0.1.1`.
- `npm run test:mcp` passed inside the installed `0.1.1` cache.
- In-app Browser `tab.goto()` successfully loaded a current daemon URL and rendered Canvasight.
- `git diff --check` passed.

## Remaining notes

- Users with already-open Codex threads still need a new thread or reload after reinstall because tool definitions and plugin servers do not hot-refresh reliably in existing threads.
- Existing dirty UI files and generated `dist` hash changes are present in the worktree; unrelated UI changes were not intentionally modified for this root-cause fix.
