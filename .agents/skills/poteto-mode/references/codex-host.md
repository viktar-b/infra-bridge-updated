# Codex host mapping

Apply this mapping whenever an upstream pstack instruction names a Cursor-only construct. The
workflow's intent remains the same; the host mechanism changes.

## Authority and scope

- Higher-priority Codex instructions, the user's request, repository `AGENTS.md` files, and current
  permission rules override pstack.
- A pstack workflow does not authorize a branch change, destructive git command, deploy, merge,
  message, or other external mutation that the user did not authorize.
- Preserve the current branch unless the user explicitly requests another branch. Treat upstream
  worktree, reset, merge, and push directions as conditional on the active repository rules.

## Skills and commands

- A Cursor slash skill such as `/how` means the Codex skill `$how`.
- `/create-skill` means `$skill-creator`.
- `/loop` means a Codex goal continuation, heartbeat, or bounded wait when that capability is
  available and the request actually calls for continued or scheduled work. Do not emulate it with
  long blocking sleeps.
- If an optional skill from another Cursor plugin is missing, perform the underlying work directly
  with available Codex capabilities and disclose the missing optional dependency only when it
  materially changes the result.

## Delegation

- Cursor `Task` calls map to Codex collaboration sub-agents. Use a concrete, bounded task name and
  give each worker the minimum context needed.
- `subagent_type: generalPurpose` means an ordinary Codex sub-agent.
- `subagent_type: poteto-agent` means an ordinary Codex sub-agent instructed to read `$poteto-mode`
  before starting its bounded task.
- `subagent_type: Comment Sicko` means an ordinary read-only reviewer given the Comment Sicko
  prompt embedded in `$no-comments`.
- "Launch in one message" means start the independent workers before waiting for results, within
  the current concurrency limit. Drain every worker before producing the aggregate verdict.
- Never create a user-visible Codex task as a substitute for a sub-agent unless the user explicitly
  asks for a new task.
- If delegation is unavailable or prohibited by the current session, run the same lanes serially
  and preserve the requested independent review boundaries.

## Model routing

- Read `~/.codex/pstack-models.md` when it exists. It contains optional role-to-model preferences.
- `inherit-parent` and `auto` both mean to omit the model override.
- Treat Cursor-only model slugs in upstream examples as role hints, not callable Codex model IDs.
  Use only model IDs exposed by the current Codex collaboration capability. Otherwise inherit the
  parent model.
- When a model override is used, follow the current Codex agent tool's context-fork requirements.
  Never invent or guess a model ID.

## Host capabilities

- Cursor transcript paths map to Codex task-history inspection capabilities. Read only tasks that
  are in scope for the user's request.
- Cursor cloud agents map to Codex sub-agents unless the user explicitly requests separate tasks.
- `control-cli` maps to the terminal or shell capability available in Codex.
- `control-ui` maps to the available browser or computer-use capability.
- A `deslop` pass maps to a focused diff review that removes generated-looking boilerplate,
  needless indirection, and unrelated churn while preserving behavior.
- Cursor rules under `~/.cursor/rules/` map to the pstack-specific Codex configuration file
  `~/.codex/pstack-models.md`; do not write Cursor configuration.

## Waiting and persistence

- Use Codex agent waits for active sub-agents and Codex heartbeat or automation mechanisms for a
  user-requested recurring monitor.
- Keep waits bounded and communicate progress during long work. A quiet external system is normal;
  it is not a reason to create another polling loop.
