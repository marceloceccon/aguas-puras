# @aguas/web

Public dashboard + admin panel for AguasPuras.

## Dev

```bash
cp .env.local.example .env.local   # edit Ponder URL if not localhost
pnpm install
pnpm --filter @aguas/web dev
```

Serves on `http://localhost:3001`.

Dependencies:
- `@aguas/indexer` should be running (`pnpm --filter @aguas/indexer dev`) so GraphQL at `:42069` is live.
- `/studies/*.json` files at the repo root are picked up automatically.

## Layout

- `/` — public dashboard: live map (Leaflet + OSM), time-series charts (Recharts), recent samples, studies feed.
- `/sample/[uid]` — sample detail with EAS explorer + tx explorer deep links.
- `/admin` — wallet-gated studies composer (see D11).

## Notes

- Studies live at the workspace root `/studies/` (per spec §8 rename) and are read via server-component `fs` calls.
- Leaflet is dynamically imported client-side (SSR off) via `SamplesMap → SamplesMapInner`.
