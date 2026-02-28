# Contributing to Pilot

Thanks for contributing to Pilot.

Pilot is positioned as an AI sales system, not a flow-builder bot. Contributions should improve reliability, sales workflow depth, and safe automation behavior.

## Ground rules

- Keep pull requests focused and small.
- Prefer typed, testable, incremental changes.
- Preserve data ownership and self-hosting friendliness.
- Prioritize safe automation patterns (HRN, throttling, risk controls).

## Prerequisites

- **Node.js** (v18 or higher)
- **pnpm** package manager
- **PostgreSQL** database (or compatible like Neon)
- **Instagram Developer Account** (for API features)

## Development setup

1. Fork and clone the repository.

```bash
git clone https://github.com/getpilot/app.git
cd app
```

2. Install dependencies.

```bash
pnpm install
```

3. Configure environment.

```bash
cp .env.example .env.local
```

4. Run database setup.

```bash
pnpm --filter app db:generate
pnpm --filter app db:migrate

# Optional
pnpm --filter app db:studio
```

5. Start development.

```bash
# Main product app only
pnpm --filter app dev

# Marketing app only
pnpm --filter web dev

# Both apps in parallel via Turborepo
pnpm dev
```

Default local URLs:

- `apps/app` -> `http://localhost:3000`
- `apps/web` -> `http://localhost:3001`

### Monorepo package layout

- `@pilot/ui` -> shared UI components and styles
- `@pilot/db` -> shared schema, DB client, migrations
- `@pilot/instagram` -> shared Instagram transport layer and webhook utilities
- `@pilot/core` -> shared business logic and orchestration
- `@pilot/types` -> shared domain types
- `@pilot/config` -> shared config presets

## Running tests and quality checks

Current testing is mostly manual/user-acceptance oriented.

### Manual testing checklist

1. **Development testing**
- Instagram login
- Contact management
- Automation creation
- Sidekick interactions
- DB operations and API endpoints

2. **Integration testing**
- Instagram API connectivity
- Webhook functionality
- Real-time behavior

3. **User journey testing**
- Onboarding completion
- First automation setup
- Contact workflow and analytics checks

### Required code quality checks

```bash
pnpm lint
pnpm check-types
pnpm build
```

### Useful Turborepo checks

```bash
# Targeted checks
pnpm build:app
pnpm build:web
pnpm check-types:app
pnpm check-types:web

# Changed-only graph build
pnpm build:affected
```

Turbo local cache is in `.turbo/`.
For remote cache in CI/dev machines, set `TURBO_TEAM` and `TURBO_TOKEN`.

## Branch and PR workflow

1. Create a feature branch.

```bash
git checkout -b feat/your-change
```

2. Run checks before pushing.

```bash
pnpm lint
pnpm check-types
pnpm build
```

3. Open a PR with:
- Problem statement
- Approach and tradeoffs
- Screenshots for UI changes
- Migration notes (if schema changed)

## What to include for UI work

- Before/after screenshots
- Mobile and desktop behavior
- Empty/loading/error state handling

## What to include for data/model work

- Drizzle schema updates and migrations
- Backfill strategy if needed
- Query/index impact notes

## Deployment notes

The project is configured for deployment on Vercel with supporting services.

### Production deployment

This monorepo deploys two separate Vercel projects:

1. `apps/app` (main product app)
2. `apps/web` (marketing website)

Set each Vercel project root directory accordingly.

### Required environment variables

```env
BETTER_AUTH_SECRET=""
BETTER_AUTH_URL=""

DATABASE_URL=""

GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

POLAR_ACCESS_TOKEN=""
POLAR_ORG_SLUG=""

INSTAGRAM_CLIENT_ID=""
INSTAGRAM_CLIENT_SECRET=""
NEXT_PUBLIC_APP_URL=""

NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=""
CLOUDINARY_API_KEY=""
CLOUDINARY_API_SECRET=""

GOOGLE_GENERATIVE_AI_API_KEY=""

NODE_ENV="development"

SENTRY_AUTH_TOKEN=""
SENTRY_DSN=""
```

### Service notes

- **Database**: Neon PostgreSQL recommended in production
- **Migrations**: Run DB migration scripts before/with deploy
- **Monitoring**: Sentry is integrated for errors/performance
- **Other services**: Inngest, Polar, Cloudinary

### Waitlist integration

`apps/app/src/app/api/waitlist/route.ts` is used by the marketing site.

Set `WAITLIST_API_TOKEN` consistently where required by your environments.

## Tech stack

### Core framework

- [Next.js](https://nextjs.org/)
- [React](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Node.js](https://nodejs.org/en/)

### Database and ORM

- [Drizzle ORM](https://orm.drizzle.team/)
- [PostgreSQL](https://www.postgresql.org/)
- [Neon](https://neon.tech/)

### Authentication and authorization

- [Better Auth](https://better-auth.com/)
- [NextAuth.js](https://next-auth.js.org/)

### UI and styling

- [Tailwind CSS](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Radix UI](https://www.radix-ui.com/)
- [Lucide React](https://lucide.dev/)

### AI and external APIs

- [Vercel AI SDK](https://sdk.vercel.ai/)
- [Google AI](https://ai.google.dev/)
- [Instagram API](https://developers.facebook.com/docs/instagram)

### Tooling

- [Vercel](https://vercel.com/)
- [pnpm](https://pnpm.io/)
- [Turborepo](https://turborepo.com/)
- [ESLint](https://eslint.org/)
- [Sentry](https://sentry.io/)

## Docs expectations

- Update README when product behavior changes for users.
- Update ROADMAP when planned priority changes.
- Update [competitive-analysis.md](./competitive-analysis.md) when positioning assumptions change.

## Code style

- TypeScript-first, avoid `any`.
- Keep components composable and focused.
- Use server actions for authenticated write operations.
- Revalidate cache/path where needed after mutations.

## License

By contributing, you agree your contributions are licensed under the GNU AGPL v3.0 in [LICENSE](./LICENSE).
