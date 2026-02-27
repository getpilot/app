# `@pilot/app`

Main product app (dashboard, automations, contacts, sidekick, billing).

## Local Development

From repo root:

```bash
pnpm install
pnpm --filter @pilot/app dev
```

App runs on `http://localhost:3000` by default.

## Useful Scripts

From repo root:

```bash
pnpm --filter @pilot/app dev
pnpm --filter @pilot/app build
pnpm --filter @pilot/app check-types
pnpm --filter @pilot/app lint
```

## Monorepo Dependencies

- `@pilot/ui` for UI components/styles
- `@pilot/db` for DB client/schema
- `@pilot/types` for shared domain types
- `@pilot/config` for eslint/postcss/tsconfig

## App-Specific Notes

The app uses shared DB package config from `packages/db`.

```bash
pnpm --filter @pilot/app db:generate
pnpm --filter @pilot/app db:migrate
pnpm --filter @pilot/app db:push
pnpm --filter @pilot/app db:studio
```

## Deployment

Deploy this app as its own Vercel project with root directory set to:

`apps/app`
