# @aguas/contracts

Base-chain Solidity contracts for AguasPuras. Foundry-based.

## Setup

Install Foundry:

```bash
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

Install submodules (inside this package):

```bash
pnpm install:deps
```

## Commands

| Command | Purpose |
|---|---|
| `pnpm build` | Compile all contracts |
| `pnpm test` | Run tests (-vv) |
| `pnpm test:gas` | Gas report |
| `pnpm snapshot` | Update `.gas-snapshot` |
| `pnpm anvil` | Local fork-able chain on :8545 (chain id 8453) |
| `pnpm deploy:local` | Deploy to local anvil (Foundry default key) |
| `pnpm deploy:sepolia` | Deploy + Basescan verify on Base Sepolia (requires `.env`) |
| `pnpm verify:sepolia <addr> <Contract>` | Verify an already-deployed contract |
| `pnpm verify:base <addr> <Contract>` | Same for mainnet |

## Contracts

- `WaterSampleRegistry.sol` — immutable sample index, keyed by EAS attestation UID. Lab-wallet-only lab-readings update.
- `CollectorRegistry.sol` — owner-gated collector allowlist.

Both contracts are intentionally dependency-light (no OpenZeppelin) for minimalism and audit clarity.
