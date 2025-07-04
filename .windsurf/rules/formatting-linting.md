---
trigger: always_on
description: Details of how to format and lint, with trunk and other tools.
globs:
---

# Trunk

- Use trunk if `.trunk/trunk.yaml` exists (https://trunk.io)
- Check ignored issues with `trunk check --show-existing`

# Formatting

- Prefer `trunk fmt [filename]` or `trunk fmt -a` (all files)

# Linting

- Prefer `trunk check [filename]` or `trunk check -a` (all files)
- Auto-fix with `trunk check --fix [filename]` or `trunk check --fix -a` (all files)
- Ignore warnings from `trunk-toolbox`

## TypeScript

- Regenerate types if necessary before linting.
  - `bun run types` or `bun run cf-typegen`.
- When `biome.json` exists:
  - Ensure `@biomejs/biome` is installed in devDependencies.
    - If not, add it and run `bun install`.
  - `bun run biome check [filename]` or `bun run biome check` (all files).
  - Safe fixes: `biome check --write [filename]` or `biome check --write` (all files).
  - Unsafe fixes: `biome check --write --unsafe [filename]` or `biome check --write --unsafe` (all files).
  - Validate unsafe fixes for functional parity.
- If a `lint` script (ie runnable with `bun run lint`) exists:
  - If it also runs `trunk`, prefer it to `trunk check`.
  - If it doesn't, run it was well as `trunk check`.
  - Also run Biome as described above if `biome.json` exists.
    - Skip it if the `lint` script invokes it.
- Run the `typecheck` script.
  - Example: `bun run typecheck`.
  - Run `bun run tsc --noEmit` directly if the `typecheck` script doesn't exist.

## Next.js Projects

- Also run `next lint` via package manager:
  - Bun: `bun run next lint`
  - pnpm: `pnpm run next lint`

## Biome

- When enabled in trunk or `biome.json` exists, run directly:
  - `biome check [filename]` or `biome check` (all files)
  - Safe fixes: `biome check --write [filename]` or `biome check --write` (all files)
  - Unsafe fixes: `biome check --write --unsafe [filename]` or `biome check --write --unsafe` (all files)
  - Validate unsafe fixes for functional parity
