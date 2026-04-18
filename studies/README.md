# /studies

Versioned JSON studies that aggregate on-chain AguasPuras samples into
human-readable findings.

Each file is one study. The schema lives in `apps/web/lib/types.ts::Study`.
Researchers can compose studies in the admin panel (`/admin` on the
dashboard) and either save locally (dev) or download the JSON and commit
it to this folder.

Studies published here are read by the public dashboard at build / request
time via server-component `fs` access — no external GitHub fetch.
