# Vendored skill sources

The project keeps local snapshots of the non-standard skills required by `design-brepjs-family`. Built-in Codex skills are deliberately excluded.

| Project copy | Source snapshot |
| --- | --- |
| `codebase-design/` | `/Users/viktar/.agents/skills/codebase-design/`, unversioned local snapshot copied 2026-08-28 |
| `typescript-best-practices/` | pstack `0.14.5`, `skills/typescript-best-practices/` |
| `principle-type-system-discipline/` | pstack `0.14.5`, `skills/principle-type-system-discipline/` |
| `principle-boundary-discipline/` | pstack `0.14.5`, `skills/principle-boundary-discipline/` |
| `principle-encode-lessons-in-structure/` | pstack `0.14.5`, `skills/principle-encode-lessons-in-structure/` |
| `poteto-mode/references/codex-host.md` | pstack `0.14.5`, shared Codex host mapping required by the pstack snapshots |

The pstack source root for this snapshot was `/Users/viktar/.codex/plugins/cache/personal/pstack/0.14.5/skills/`. The stable form is `<codex-home>/plugins/cache/personal/pstack/<version>/skills/`.

## Update the snapshots

When pstack or the local `codebase-design` skill changes:

1. Replace each project copy with the corresponding source directory listed above. Preserve the relative paths, including `typescript-best-practices/references/patterns.md` and `poteto-mode/references/codex-host.md`.
2. Copy `codebase-design` from `/Users/viktar/.agents/skills/codebase-design/`.
3. Update the pstack version and snapshot date in this file.
4. Run the Codex `skill-creator` `quick_validate.py` script against every directory containing a `SKILL.md`.
5. Run the repository typecheck and full test suite, then review the vendored diff before committing.

Keep the snapshots byte-for-byte aligned with their sources. Put project-specific Family rules in `design-brepjs-family`, not in the vendored dependencies.
