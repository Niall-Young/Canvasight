---
name: canvasight-update
description: Check for or install official stable Canvasight plugin releases. Use when the user asks “更新 Canvasight”, “升级 Canvasight”, “把 Canvasight 更新到最新版”, “检查 Canvasight 更新”, “Canvasight 有更新吗”, “update/upgrade Canvasight”, “check for Canvasight updates”, or whether the installed Canvasight version is current. Do not use for ordinary Canvasight troubleshooting, development-checkout Git pulls, canvas content edits, or updates to unrelated Codex plugins.
---

# Canvasight Update

Use the bundled updater as the only update path. It compares the installed plugin with the latest official GitHub Release and, for an install request, upgrades the complete plugin snapshot through the `canvasight-local` marketplace. Do not copy individual Skills, MCP files, web assets, or cache entries.

## Choose The Operation

- Resolve the plugin root as two directories above this `SKILL.md`.
- For a check-only request, run `node <plugin-root>/scripts/update-canvasight.mjs --check`. Never run `--update`, marketplace commands, or installation commands.
- For an explicit install or upgrade request, run `node <plugin-root>/scripts/update-canvasight.mjs --update`.
- Run exactly that one bundled-updater command and no other shell command. Do not run `npm install`, `npm ci`, another package manager, builds, tests, release preparation or verification, direct `codex plugin` or marketplace commands, Git commands, cleanup, or duplicate-file repair before or after it. The updater owns every permitted check, install, verification, and rollback step.
- Parse the script's JSON result. Do not infer success from partial command output or run recovery commands outside the script.

## Report The Result

- `update_available`: report the installed and latest versions and say that no files were changed.
- `up_to_date`: reply `你当前使用的 Canvasight vX.Y.Z 已经是最新版，无需更新。` Do not mention restart.
- `updated`: reply `Canvasight 已更新到 vX.Y.Z。请重新加载或重启 Codex Desktop，然后新建任务并重新 @Canvasight。重启由你自行完成。`
- `ahead_of_release`: report that the installed version is newer than the latest official Release and was not downgraded. Do not mention restart.
- `local_source`: report that Canvasight is installed from a local development checkout, so automatic update stopped without changing it. Do not replace, pull, or edit the checkout.
- `unsupported_source`: report that the installed source is not the official `Niall-Young/Canvasight` release source and was left unchanged.
- `version_unknown`: report that the version could not be verified and the current installation was preserved.
- `release_mismatch`, `update_failed`, `rollback_failed`, or `error`: state the script's concise error and whether rollback succeeded. Never claim the update succeeded.

Only `updated` means a new plugin version was installed and permits a restart notice. For every other status, do not ask the user to restart. Never delete or modify project `.scatter` data, attachments, `~/.canvasight`, user source code, other plugins or Skills, unrelated Codex configuration, or a developer checkout.
