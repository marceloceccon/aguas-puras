# Security Policy

AguasPuras is open-source public-goods infrastructure. We want vulnerabilities
reported, fixed, and disclosed cleanly.

## Reporting a vulnerability

Email **marcelo@ceccon.org** with subject `[AguasPuras Security]`. Please do
not open public issues for security problems until a fix is merged and
deployed. Expect an acknowledgement within 48 hours.

## Audit policy (decision #7, resolved 2026-04-18)

| Phase                | Review                                           |
|----------------------|--------------------------------------------------|
| Local + Sepolia now  | Internal review using the checklist below.       |
| Before Base mainnet  | External audit: Sherlock or Cantina contest.     |
| Post-launch          | Continuous — Immunefi-style bounty is planned.   |

## Internal self-checklist

Run through this before every Sepolia deploy and before asking an external
auditor to look at the code.

### Contracts (`packages/contracts/`)

- [ ] `forge test -vv` → all tests pass.
- [ ] `forge test --gas-report` → `registerSample` stays `< 150_000` gas.
- [ ] `forge snapshot --check` → no silent gas regressions.
- [ ] All externally-callable functions have explicit visibility (`external` /
      `public`) — never accidental default.
- [ ] All `msg.sender`-gated functions either use `onlyOwner` pattern or an
      explicit custom-error guard.
- [ ] No `tx.origin` anywhere in `src/`.
- [ ] Constructors reject the zero address for every role.
- [ ] Immutable variables (`labWallet`) really are immutable and cannot be
      mutated by any code path.
- [ ] Events are emitted for every state-changing path (indexer relies on it).
- [ ] Tests cover happy path + revert cases + event emission + gas budget.
- [ ] `forge build --sizes` → no contract is near the EIP-170 24 KiB limit.

### Off-chain (apps + indexer)

- [ ] No server-held secret leaks into `NEXT_PUBLIC_*` envs (`PINATA_JWT`,
      `DEPLOYER_PRIVATE_KEY`, `BASESCAN_API_KEY` stay server-only).
- [ ] `apps/web/app/api/pin` (capture) — 10 MB cap, `image/*` only, rejects
      non-multipart.
- [ ] `apps/web/app/api/studies` — `requireAdmin()` is the first thing the
      POST/DELETE handler calls; signature + timestamp + allowlist + kill-
      switch all enforced.
- [ ] `STUDIES_API_ENABLED` is explicitly `"true"` only on envs that should
      accept admin writes; defaults to closed.
- [ ] `ADMIN_ALLOWLIST` on production contains only the operator's Safe
      address(es); no EOAs.
- [ ] Study filename sanitizer rejects `..` path-traversal attempts
      (`lib/studies.ts::sanitize`).
- [ ] `apps/capture/lib/eas.ts::schemaUIDFromEnv` refuses to return a malformed
      UID; a misconfigured env stops the flow early.
- [ ] Dashboard falls back cleanly when the indexer is unreachable (no 500s
      at `/`).

### Deploy hygiene

- [ ] Registry + collector addresses match across `apps/capture/.env.local`,
      `apps/web/.env.local`, and `packages/indexer/.env.local`.
- [ ] EAS schema UID in env matches the UID registered via easscan.org for
      the same chain.
- [ ] Basescan verify completed for every deployed contract; the ABI visible
      on the explorer matches `packages/contracts/out/*.json`.
- [ ] Ownership of `CollectorRegistry` and `WaterSampleRegistry.labWallet`
      transferred to the Safe before the first public attestation.

## Known good properties

- Contracts have zero external dependencies (`forge-std` is test-only) —
  audit surface is exactly the two `.sol` files in `src/`.
- `WaterSampleAttestation` EAS schema is non-revocable: once a sample is
  attested, history cannot be mutated by the attester.
- Images are watermarked (ISO timestamp + GPS + collector) before hashing,
  so the on-chain dataHash covers the watermarked bytes — tampering with
  the image invalidates the chain record.
- Pinata JWT stays server-side (`/api/pin` proxy); the client never sees it.
- Admin write paths require a fresh wallet signature (300s window) by an
  address on the operator-controlled allowlist; the default production
  posture is a closed kill-switch (`STUDIES_API_ENABLED=true` required).

## Out-of-scope

- Phishing of collector wallets (wallet security is the collector's
  responsibility).
- Pinata / Basescan / Base RPC availability (third-party uptime).
- Social engineering of Safe signers.
