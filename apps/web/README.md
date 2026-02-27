# `@pilot/web`

Marketing and waitlist site for Pilot.

## Local Development

From repo root:

```bash
pnpm install
pnpm --filter @pilot/web dev
```

Site runs on `http://localhost:3001` by default.

## Useful Scripts

From repo root:

```bash
pnpm --filter @pilot/web dev
pnpm --filter @pilot/web build
pnpm --filter @pilot/web check-types
pnpm --filter @pilot/web lint
```

## Monorepo Dependencies

- `@pilot/ui` for shared shadcn/tailwind UI layer
- `@pilot/types` for shared types
- `@pilot/config` for eslint/postcss/tsconfig

## App-Specific Notes

`apps/web` sends waitlist submissions to the app API endpoint.

Set `WAITLIST_API_TOKEN` consistently where required by your environment.

## Deployment

Deploy this app as a separate Vercel project with root directory set to:

`apps/web`
