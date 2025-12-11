# Copilot Instructions — Aragon App (Next.js)

These notes make AI agents productive in this repo fast. Focus on conventions, commands, and where things live.

## Big Picture
- Frontend app for managing DAOs on Aragon OSx using Next.js 16 + React 19 + TypeScript.
- Talks to Aragon OSx via the Aragon SDK/subgraph and uses the Aragon Governance UI Kit.
- Wallet/chain stack: `wagmi` + `viem` + Reown AppKit; data via TanStack Query.
- Harmony support exists; update addresses in `src/shared/constants/networkDefinitions.ts`.

## Key Paths
- App router pages: `src/app/**` (Next 16).
- Shared constants/utilities: `src/shared/**` (e.g., `featureFlags`, `constants`, helpers).
- Plugins/features modules: `src/plugins/**`, `src/modules/**`, `src/daos/**`.
- Global setup: `initPluginRegistry.ts`, `instrumentation.ts`, `middleware.ts`.
- Config: `next.config.mjs`, `eslint.config.js`, `prettier.config.js`, `postcss.config.js`.

## Environment/Envs
- Use `.env.*` per environment (see table in `README.md`). Local dev reads `.env.local`.
- The `dev` script runs `scripts/setupEnv.sh` to prepare env values (`pnpm run setup local`).
- Sentry config files: `sentry.edge.config.ts`, `sentry.server.config.ts` (only active if DSN is set).

## Install, Run, Test
- Package manager: `pnpm` with Corepack. Commands:
  - Install: `pnpm install`
  - Dev server: `pnpm dev` (uses Turbopack)
  - Build: `pnpm build`
  - Start: `pnpm start`
  - Lint/format: `pnpm lint`, `pnpm lint:fix`, `pnpm prettify`, `pnpm prettify:fix`
  - Types: `pnpm type-check`
  - Tests: `pnpm test`, `pnpm test:watch`, `pnpm test:coverage`
- Troubleshooting (from README): `pnpm approve-builds`, `pnpm store prune`, and ensure `corepack enable`.

## Patterns & Conventions
- Data fetching: TanStack Query (+ devtools) with hooks colocated near features; prefer server components where possible, mark client components explicitly.
- Forms: `react-hook-form` (+ devtools), validation done at component boundaries.
- UI: Aragon Governance UI Kit + Tailwind v4; keep styles utility-first and avoid ad-hoc globals.
- Web3: `wagmi` connectors via Reown AppKit; ensure chain IDs map to `networkDefinitions.ts`.
- Security: Sanitize user HTML with `isomorphic-dompurify`; never render untrusted HTML without sanitation.

## Cross-Repo Integration
- OSx contract addresses must match deployed networks; update `networkDefinitions.ts` when deploying OSx.
- Backend API endpoints are consumed by modules in `src/**` (check `backendApiMocks.ts` during local dev).

## Example Tasks (Do It This Way)
- Add a network: extend `src/shared/constants/networkDefinitions.ts` (rpcUrls, contracts addresses, explorer URLs), then expose it in the selector.
- Add a feature flag: create flag in `src/shared/featureFlags`, wire in `README.md` example there, and guard the UI/route.
- Add a data view: create a `src/modules/<feature>` folder with a server component for data loading and a client component for interactivity; use a TanStack Query key scoped to the feature.

## CI/Deploy Notes
- Env-driven deployments (Preview/Develop/Staging/Prod) per README; local is `.env.local`.
- `vercel.json` config is present; ensure build uses `next build --no-lint` as per scripts.
