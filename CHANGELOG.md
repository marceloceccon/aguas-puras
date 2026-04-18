# Changelog

All notable changes to AguasPuras. Follows [Keep a Changelog](https://keepachangelog.com) + [Semantic Versioning](https://semver.org).

## [Unreleased]

### Added
- **OSS-hardening pass (D32–D38)** — closing the quality gap between pilot MVP and audit-ready codebase:
  - `packages/shared` — single source of truth for v2 ABIs (`WaterSampleRegistry`, `FieldAgentRegistry`) and the EAS canonical codec (`encodeLatLon`, `dataHash`, `attestationUID`, `attestationMessage`). Both apps `workspace:*`-depend on it.
  - Foundry fuzz tests (7 new cases) + 3 protocol invariants driven by a dedicated handler contract. Each invariant survives 256 sequences × ~500 calls = 128,000 handler calls.
  - Vitest suites: 45 unit tests across `packages/shared` (9), `apps/web` (31), `apps/capture` (5). Cover ECIES round-trip, admin auth (including body-binding), study validation, filter logic, rate limiter.
  - `CONTRIBUTING.md`, `CHANGELOG.md`.
- **Inbox hardening** — `/api/samples/pending` POST now rejects duplicates (409), unregistered or deactivated field agents (403, on-chain check against `FieldAgentRegistry.isActive`), and per-wallet submissions more frequent than the configurable `INBOX_RATE_LIMIT_SECONDS` (429 + `Retry-After`).
- **CI** runs typechecks for all four Node workspaces + Vitest suites for the three with tests + `next build` for the web app, on top of the existing Foundry test + gas-snapshot gate.

### Changed
- **Admin signature** (`/api/studies` POST and DELETE) binds to `keccak256(body)` in addition to method + pathname + timestamp. Tamper with the body after signing and the signature fails. See `apps/web/lib/admin-auth.ts`.
- `applyFilter` in the dashboard filter library now case-insensitively compares attester on both sides; callers no longer need to pre-lowercase.

### Security
- MITM-replayed signed admin requests can no longer be used to mutate a different payload than the one the admin approved.
- Spam vector on the Laboratory inbox closed for wallets that are not on-chain-registered field agents.

## [2.0.0] — 2026-04-18 — Institutional Evolution

### Added
- **§0 Institutional Backbone** in the spec: CNPJ Foundation + DAO digital twin; Fireblocks (Safe hybrid in pilot); roles; fiat/crypto separation; no-economic-incentives MVP.
- **§12 Privacy, Roles & Real-World Mapping** in the spec: role-to-bylaws table, data classification, ECIES encryption details, LGPD/GDPR RTBF runbook.
- `FieldAgentRegistry.sol` — field agents self-register with an IPFS CID pointing at ECIES-encrypted personal data; Data Owner publishes the secp256k1 pubkey on-chain; deactivate + key rotation are the RTBF levers.
- `eth-crypto` ECIES helper + `/register` field-agent flow in the Capture PWA.
- Laboratory `/publish` + `/review` wallet-gated dashboards in the web app.
- `POST /api/samples/pending` — CORS-enabled cross-origin inbox that verifies field-agent signature + UID integrity.
- `SECURITY.md` with disclosure channel, pre-deploy checklist, audit cadence (internal → Sherlock/Cantina → continuous bounty), Privacy posture (LGPD + GDPR), Data Owner key lifecycle.

### Changed
- **`WaterSampleRegistry` v2** — AccessControl-based with `PUBLISHER_ROLE` / `REVIEWER_ROLE` / `DATA_OWNER_ROLE`. Two-step `publishSample` → `reviewAndSign` workflow with on-chain separation of duties. Field agents pay no gas.
- Capture PWA flow rewrites: camera → watermark → form → sign envelope → POST inbox. No more direct registry calls from the field.
- Ponder schema: three tables (`sample`, `field_agent`, `data_owner_key`); old `collector` table removed.

### Removed
- `CollectorRegistry.sol` (functionally subsumed by `FieldAgentRegistry.sol`).

## [1.2.0] — 2026-04-18 — Decision resolutions + hardening

### Added
- Pinata IPFS proxy (`/api/pin`), Signed admin API (`AguasPuras admin` header + `ADMIN_ALLOWLIST` + `STUDIES_API_ENABLED`), Network-keyed EAS schema UIDs, WalletConnect connector, Basescan verify flow, Safe-compatible deploy runbook.
- `SECURITY.md` v1.
- All 8 blocking decisions marked Resolved in spec.

## [1.1.0] — 2026-04-18 — Phase 5 + dashboard polish

### Added
- Public dashboard filters (from/to/param/attester) + CSV export.
- `/verify/[uid]` chain-direct verification page (no indexer dependency).
- CollectorRegistry indexing + Approved-collectors card (later replaced by FieldAgentsCard in 2.0.0).
- Image watermark (ISO + GPS + collector burned into pixels before hashing).
- Production service worker for app-shell offline.
- `DEVELOPING.md` + GitHub Actions CI.

## [1.0.0] — 2026-04-17 — MVP (Phases 1–4)

### Added
- `packages/contracts` — Foundry + `WaterSampleRegistry` + `CollectorRegistry` + Deploy.s.sol.
- `apps/capture` — Next.js 15 PWA with camera + GPS + form + wallet-sign + registry submit + IndexedDB drafts.
- `packages/indexer` — Ponder 0.9 indexer + GraphQL at `:42069`.
- `apps/web` — Public dashboard + sample detail + wallet-gated admin studies composer.
- In-repo `/studies/` versioned JSON (per `specification.md §8`).
