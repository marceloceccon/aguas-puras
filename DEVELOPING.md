# Developing AguasPuras

This is the operational companion to [`README.md`](README.md) (pitch) and
[`specification.md`](specification.md) (authoritative spec + status log).
Everything here is reproducible from a clean clone.

## Prerequisites

- Node 22 (`.nvmrc` pins it)
- pnpm 10+ (`packageManager` in `package.json` pins it)
- Foundry (`forge` + `anvil`) for contracts. Install via:
  ```bash
  curl -L https://foundry.paradigm.xyz | bash
  foundryup
  ```

## One-time setup

```bash
pnpm install                               # install all workspace deps
cd packages/contracts && pnpm install:deps # pull forge-std submodule
```

## Running the full stack locally

Open 5 terminals.

```bash
# 1. Local chain (chain id 31337).
anvil --host 127.0.0.1 --port 8545
```

```bash
# 2. Deploy contracts. Prints the two addresses; the defaults match below.
cd packages/contracts
pnpm test           # 20/20 pass, registerSample ~52k gas
pnpm deploy:local   # WaterSampleRegistry → 0x5FbDB2315678afecb367f032d93F642f64180aa3
                    # CollectorRegistry   → 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
```

```bash
# 3. Ponder indexer → GraphQL at :42069.
cd packages/indexer
cp .env.example .env.local  # or export inline below
PONDER_NETWORK=anvil \
REGISTRY_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3 \
COLLECTOR_REGISTRY_ADDRESS=0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512 \
REGISTRY_START_BLOCK=0 \
  pnpm dev
```

```bash
# 4. Capture PWA → http://localhost:3000
cd apps/capture
cp .env.local.example .env.local   # set NEXT_PUBLIC_REGISTRY_ADDRESS + CHAIN_ID=31337
pnpm dev
```

```bash
# 5. Public dashboard + admin → http://localhost:3001
cd apps/web
cp .env.local.example .env.local   # same addresses + CHAIN_ID=31337
pnpm dev
```

Visit `http://localhost:3001/` for the dashboard, `/admin` for the wallet-gated
studies composer, and `/verify/<uid>` for chain-direct attestation verification.

## Deploying to Base Sepolia

All 8 blocking decisions are resolved (see `specification.md` footer). For
testnet deploys the EOA path is appropriate; mainnet must go through the Safe.

```bash
cd packages/contracts
cp .env.example .env
#  Edit .env:
#    BASE_SEPOLIA_RPC_URL  = your RPC endpoint
#    DEPLOYER_PRIVATE_KEY  = funded Sepolia key (transfers ownership to OWNER after)
#    LAB_WALLET            = Safe multisig address (decision #2)
#    OWNER                 = same Safe (decision #3)
#    BASESCAN_API_KEY      = Basescan key (decision #6)

export $(grep -v '^#' .env | xargs)
pnpm deploy:sepolia
```

This deploys + verifies in one shot. The printed registry addresses go into
`apps/web/.env.local`, `apps/capture/.env.local`, and
`packages/indexer/.env.local` (see each app's `.env.*.example`).

## Deploying to Base mainnet (Safe multisig, 2-of-3)

Mainnet deploys do **not** use `DEPLOYER_PRIVATE_KEY`. Two supported flows:

1. **Safe Transaction Builder**: paste the `Deploy.s.sol` calldata (produced by
   `forge script script/Deploy.s.sol --sig 'run()' --rpc-url base --sender $OWNER`)
   into the Safe UI's Transaction Builder and collect signatures.

2. **Forge + propose-via-safe** (scripted): run
   `forge script --sender $OWNER --unlocked --rpc-url base` to simulate, then
   use [safe-cli](https://github.com/5afe/safe-cli) to broadcast the proposal.

After deploy, verify separately:

```bash
cd packages/contracts
forge verify-contract <registry-address> src/WaterSampleRegistry.sol:WaterSampleRegistry --chain base
forge verify-contract <collector-address> src/CollectorRegistry.sol:CollectorRegistry --chain base
```

## Registering the EAS schema

One-shot per Base network. Use easscan.org (UI) or the EAS SDK (headless):

```
Schema: uint256 timestamp,uint256 lat,uint256 lon,string collectorName,string imageCid,string labReadingsJson,string notes
Resolver: 0x0000000000000000000000000000000000000000
Revocable: false
```

Paste the returned UIDs into `apps/capture/.env.local`:
`NEXT_PUBLIC_EAS_SCHEMA_UID_BASE` and `NEXT_PUBLIC_EAS_SCHEMA_UID_BASE_SEPOLIA`.

## Package-level commands

| Package             | Key scripts |
|---------------------|-------------|
| `@aguas/contracts`  | `pnpm build`, `pnpm test`, `pnpm test:gas`, `pnpm anvil`, `pnpm deploy:local` |
| `@aguas/indexer`    | `pnpm dev`, `pnpm start`, `pnpm codegen`, `pnpm serve` |
| `@aguas/capture`    | `pnpm dev`, `pnpm build`, `pnpm typecheck` |
| `@aguas/web`        | `pnpm dev`, `pnpm build`, `pnpm typecheck` |

Root shortcuts: `pnpm dev:capture`, `pnpm build:capture`, `pnpm test:contracts`,
`pnpm build:contracts`.

## Studies

Versioned JSON files at `/studies/` (workspace root). Read by `apps/web` via
server-component `fs`. Add a new study by:
1. Connecting a wallet to `/admin` on the dashboard.
2. Either saving locally (`/api/studies` POST, dev-only) or downloading the
   generated JSON and committing it to the repo.

## CI

`.github/workflows/ci.yml` runs on every push and PR:
- `forge test -vv` (contracts)
- `pnpm typecheck` for each Node workspace
- `pnpm --filter @aguas/web build` (also validates server component + route
  compilation for the dashboard)

## Troubleshooting

- **Ponder can't connect (ECONNREFUSED :8545)** — anvil isn't running, or
  `PONDER_RPC_URL_31337` points somewhere else.
- **Dashboard shows 0 samples even after capture** — the Ponder indexer is
  down, or `NEXT_PUBLIC_PONDER_URL` in `apps/web/.env.local` doesn't match
  where Ponder is listening.
- **`forge install` complains about `--no-commit`** — you're on Foundry 1.5+,
  which removed the flag; `pnpm install:deps` already drops it.

## Pilot readiness checklist

Open decisions surfaced in `specification.md` are the blocker list for public
launch; see the master footer in that file for the current list.
