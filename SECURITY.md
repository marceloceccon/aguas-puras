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

- [ ] `forge test -vv` → all tests pass (currently 27/27).
- [ ] `forge test --gas-report` → `publishSample` stays `< 150_000` gas.
- [ ] `forge snapshot --check` → no silent gas regressions.
- [ ] All externally-callable functions have explicit visibility (`external` /
      `public`) — never accidental default.
- [ ] All role-gated functions use OZ `AccessControl` `onlyRole()` modifiers;
      no ad-hoc `msg.sender`-vs-address comparisons.
- [ ] Separation-of-duties: `reviewAndSign` explicitly rejects a publisher
      self-reviewing their own sample (on-chain guard).
- [ ] `DATA_OWNER_ROLE` paths (`updateLabReadings`, `deactivate`,
      `setDataOwnerPublicKey`) are gated; constructors reject zero admin.
- [ ] `FieldAgentRegistry.setDataOwnerPublicKey` validates length (65) and
      prefix (0x04); rejects compressed keys.
- [ ] No `tx.origin` anywhere in `src/`.
- [ ] Constructors reject the zero address for every role.
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

- [ ] `NEXT_PUBLIC_REGISTRY_ADDRESS` and `NEXT_PUBLIC_FIELD_AGENT_REGISTRY_ADDRESS`
      match across `apps/capture/.env.local`, `apps/web/.env.local`, and
      `packages/indexer/.env.local`.
- [ ] EAS schema UID in env matches the UID registered via easscan.org for
      the same chain (`NEXT_PUBLIC_EAS_SCHEMA_UID_{BASE,BASE_SEPOLIA}`).
- [ ] Basescan verify completed for both contracts; the ABI visible on the
      explorer matches `packages/contracts/out/*.json`.
- [ ] `DEFAULT_ADMIN_ROLE` on both registries transferred to the Foundation
      Safe (or Fireblocks vault) before the first public attestation.
- [ ] `PUBLISHER_ROLE`, `REVIEWER_ROLE`, `DATA_OWNER_ROLE` granted to distinct
      lab-staff wallets; reviewer set does not intersect publisher set.
- [ ] `FieldAgentRegistry.dataOwnerPublicKey` is non-empty and the
      corresponding private key is inside the Foundation's custody
      (Fireblocks vault / Safe signer).
- [ ] Pinata JWT, Basescan key, deployer private key, and other server-only
      secrets are set in deployment env and do NOT appear in git-tracked files.

## Privacy posture (LGPD + GDPR)

AguasPuras processes Brazilian residents' personal data. LGPD (Lei nº 13.709)
applies. GDPR applies by extension for EU-resident field agents. Our
implementation keeps personal data off-chain, encrypted, and custodially
controlled.

### Data classification

| Class | Storage | Plaintext visible to |
|---|---|---|
| Public    | Base chain: timestamp, lat, lon, imageCid, labReadingsJson, fieldAgent wallet, attestationUID. IPFS-pinned sample image. | Everyone |
| Encrypted | IPFS blob (ECIES ciphertext): name, CPF, email, phone, kit serial, address | `DATA_OWNER_ROLE` holders only |

### Encryption design

- Library: [`eth-crypto`](https://github.com/pubkey/eth-crypto) — ECIES over
  secp256k1 with AES-256 payload. The Data Owner's wallet key doubles as the
  decryption key.
- Target pubkey is published on-chain by
  `FieldAgentRegistry.setDataOwnerPublicKey(bytes)` (65-byte uncompressed,
  0x04-prefixed). Field agents read it before encrypting; no DNS-level trust
  required.
- Ciphertext envelope: `{iv, ephemPublicKey, ciphertext, mac, version:
  "eth-crypto-v1", encryptedAt}`. Pinned to IPFS; only the CID lands on-chain.

### Right to be forgotten (LGPD Art. 18 / GDPR Art. 17)

1. Data Owner calls `FieldAgentRegistry.deactivate(agent)`. Indexer flips
   `active=false`; dashboards stop surfacing the record.
2. Data Owner calls `setDataOwnerPublicKey(<new-pubkey>)`, rotating. Pre-
   rotation blobs remain decryptable by the old private key (retain for audit,
   destroy per retention policy); post-rotation blobs cannot be decrypted by
   any previous key.
3. The Foundation runs a scheduled un-pin on Pinata for the agent's blob CID.
   The CID stays on-chain forever (audit trail); the content is no longer
   retrievable via public gateways.
4. CNPJ legal/accounting records the deletion in an auditable log: agent
   wallet, request date, executor, rotation tx hash, un-pin confirmation.

### Data Owner key lifecycle

- Private key generation: inside a Fireblocks HSM-backed vault, key never
  exported. Pilot bootstrap may use a Safe signer (flagged in the privacy
  officer appointment doc).
- `setDataOwnerPublicKey` enforces `length == 65 && pubkey[0] == 0x04`;
  rejects compressed keys.
- Rotation triggers: quarterly cadence, personnel change, suspected
  compromise, completed RTBF request. Every rotation emits
  `DataOwnerPublicKeyUpdated(by, pubkey)` for transparency.
- Decryption happens off-chain on the Data Owner's workstation; plaintext
  personal data never leaves Fireblocks-controlled endpoints.

### Role holders + Foundation bylaws

All lab-role and admin-role wallets are Fireblocks-controlled (Safe-
controlled during the pilot). The Foundation bylaws appoint role holders;
on-chain `grantRole` / `revokeRole` by the `DEFAULT_ADMIN_ROLE` is the
execution layer. Appointments and revocations are minuted at board meetings.

## Known good properties

- v2 contracts depend only on OpenZeppelin v5.6.1 (AccessControl) +
  `forge-std` (test-only). Audit surface: two `.sol` files in `src/`.
- `WaterSampleAttestation` EAS schema is non-revocable.
- Two-step workflow with on-chain separation-of-duties: publisher ≠ reviewer.
- Images are watermarked (ISO timestamp + GPS + collector) before hashing;
  the on-chain dataHash covers the watermarked bytes.
- Pinata JWT stays server-side (`/api/pin` proxy); the client never sees it.
- Admin write paths require a fresh wallet signature (300s window) by an
  address on the `ADMIN_ALLOWLIST`; default posture is `STUDIES_API_ENABLED`
  kill-switch closed.
- Personal-data plaintext never touches the chain. Only ECIES ciphertext CIDs.
- Field agents pay no gas; all write transactions come from Foundation-
  controlled role wallets.

## Out-of-scope

- Phishing of field-agent wallets (wallet security is the agent's
  responsibility).
- Pinata / Basescan / Base RPC availability (third-party uptime).
- Social engineering of Safe / Fireblocks signers.
- Plaintext personal data being exfiltrated from a Data Owner's compromised
  workstation (this is a custodial obligation of the Foundation, not an
  on-chain guarantee).
