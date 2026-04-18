# @aguas/indexer

Ponder indexer for AguasPuras. Reads `WaterSampleRegistry` events on Base and
exposes a GraphQL API consumed by `apps/web`.

## Dev

```bash
cp .env.example .env.local   # edit REGISTRY_ADDRESS + start block
pnpm --filter @aguas/indexer dev
```

GraphQL endpoint defaults to `http://localhost:42069/graphql`.

## Networks

| PONDER_NETWORK | chain id | RPC default |
|---|---|---|
| `anvil`       | 31337 | `http://127.0.0.1:8545` |
| `baseSepolia` | 84532 | `https://sepolia.base.org` |
| `base`        | 8453  | `https://mainnet.base.org` |

## Schema

One table, `sample`, keyed by `attestationUID` (bytes32). Lab readings are
populated lazily via `LabReadingsUpdated` events so the indexer never blocks
on off-chain lab uploads.

## Notes

- `ponder dev` runs an in-memory SQLite store; for production, set
  `DATABASE_URL` to a Postgres instance.
- `disableCache: true` on the anvil network prevents stale RPC caching during
  local development; remove for testnet/mainnet.
