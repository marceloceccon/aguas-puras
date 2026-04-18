# Contributing to AguasPuras

Thank you for wanting to help clean up the water. This project is open-source
public-goods infrastructure; contributions that widen the pilot, harden
security, or lower the bar for other cities to fork are very welcome.

## Before you start

- Read [`README.md`](README.md) for the mission and [`specification.md`](specification.md) for the system spec.
- Run through [`DEVELOPING.md`](DEVELOPING.md) to boot the full stack locally.
- Review [`SECURITY.md`](SECURITY.md) for the disclosure channel and LGPD posture — do not open public issues for security problems.

## Setup

```bash
pnpm install
cd packages/contracts && pnpm install:deps
```

You need Node 22, pnpm 10+, and Foundry (`forge` + `anvil`).

## Workflow

1. **Fork** the repo on GitHub. Clone your fork locally.
2. **Branch** off `main` with a short, kebab-case name that describes the change:
   `fix/admin-signature-replay`, `feat/field-agent-avatar`, `docs/portuguese-readme`.
3. **Commit** using the Conventional Commits style the existing history uses:
   - `feat(<scope>): …` — new user-visible capability.
   - `fix(<scope>): …` — bug fix.
   - `test(<scope>): …` — tests only.
   - `docs(<scope>): …` — documentation only.
   - `chore(<scope>): …` — tooling, deps, build config.
   - `refactor(<scope>): …` — restructuring without behaviour change.
   - Append `!` for breaking changes: `feat(contracts)!: …`.
   - Scope examples: `contracts`, `capture`, `web`, `indexer`, `shared`, `spec`, `ci`.
4. **Test** before pushing. At a minimum:
   ```bash
   cd packages/contracts && pnpm test             # 37 tests, ~3.5 min incl invariants
   pnpm --filter @aguas/shared test                # 9 tests
   pnpm --filter @aguas/web test                   # 31 tests
   pnpm --filter @aguas/capture test               # 5 tests
   pnpm --filter @aguas/capture typecheck
   pnpm --filter @aguas/web typecheck
   pnpm --filter @aguas/web build
   ```
   CI runs the same in [`.github/workflows/ci.yml`](.github/workflows/ci.yml).
5. **Open a PR** against `main`. Describe what changed and why; link any related issue. If the PR touches contracts, include the new `forge test --gas-report` output for the changed function. If it touches the spec, update the relevant status tag and the master footer.

## Code style

- **TypeScript**: strict mode. No `any` unless you leave a one-line comment explaining why.
- **Solidity**: 0.8.24. Custom errors (never `require(..., "msg")`). Minimal external dependencies — OZ AccessControl + forge-std are the current set; argue the case if you want another.
- **Tests**: every contract state transition has a happy path + at least one revert path. Fuzz + invariants for anything touching the state machine. For off-chain, ≥ 80% statement coverage on new `lib/*` files.
- **Comments**: lead with intent, not restatement. Document "why" and "when to apply", not "what".
- **Public APIs**: if you add or change a public type, update `packages/shared/src/` first — the shared package is the single source of truth.

## Security-sensitive contributions

If your change affects:
- Contract storage layout
- Role assignment logic
- Signature verification (admin auth or field-agent envelope)
- Encryption (`apps/capture/lib/encryption.ts`)
- Rate limiting
- Path-traversal or file-write logic

…please flag it in the PR title with `[security]` and be prepared to address audit-style review. The checklist in [`SECURITY.md`](SECURITY.md) is the target for any such PR.

## Translating

Portuguese is the production language for the Foundation's regulator-facing
docs. PRs improving [`README-br.md`](README-br.md) or adding Portuguese versions of
`DEVELOPING.md` and `SECURITY.md` are very welcome.

## License

By contributing, you agree that your contributions are licensed under the same
terms as the project (see [`LICENSE`](LICENSE)).

## Code of conduct

Be direct, kind, and on-mission. No gatekeeping. We are building a public good
for a city that needs it. Behaviour that gets in the way of that gets reverted
and escalated to the Foundation board.
