# @aguas/capture

Field capture PWA for AguasPuras. Next.js 15 + OnchainKit + wagmi + viem.

## Dev

```bash
cp .env.local.example .env.local  # fill keys
pnpm install
pnpm dev
```

App serves on `http://localhost:3000`. Install to home screen for camera/geo on mobile.

## Stack

- Next.js 15 App Router, React 19, TypeScript strict
- OnchainKit (Coinbase Smart Wallet onboarding, Basenames-ready)
- wagmi v2 + viem v2
- Tailwind CSS
- IndexedDB (`idb-keyval`) for offline sample drafts
- EAS SDK for sample attestations

## PWA

- `public/manifest.webmanifest` + `public/icon.svg`
- No custom service worker yet — deferred until production caching strategy is finalized.

## Env

See `.env.local.example`. The EAS schema UID and registry address must be filled in before attestations can be submitted.
