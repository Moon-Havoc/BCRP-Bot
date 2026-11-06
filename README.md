# BCRP

BCRP is a TypeScript monorepo for the Beach Coast Roleplay Discord management platform. It contains a persistent Discord bot, a Next.js dashboard, a small internal API service, and shared packages for data, validation, permissions, Discord UI, and ER:LC API access.

The dashboard and bot are separate applications. The bot is designed for a persistent Node.js host; do not deploy its Discord Gateway process as a bounded serverless function. See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) and the beginner-friendly [docs/DEVELOPMENT_GUIDE.md](docs/DEVELOPMENT_GUIDE.md).

## Quick start

Requirements: Node.js 24 or newer and pnpm 10 or newer. From this folder:

```sh
pnpm install
cp .env.example .env
```

Edit `.env` only on your machine. Set up PostgreSQL and a `DATABASE_URL` before running migrations. Discord credentials are only needed to connect the bot or register commands. The dashboard can run without OAuth in this foundation phase.

Run the services in separate terminal windows:

```sh
pnpm dev:dashboard
pnpm dev:api
pnpm dev:bot
```

Then visit `http://localhost:3000` for the dashboard and `http://localhost:4000/health` for API health. The API reports process health only; it does not imply a database connection. The default bot health endpoint is `http://127.0.0.1:4001/health` and reports not-ready until Discord Gateway login succeeds. See [local setup instructions](docs/DEVELOPMENT_GUIDE.md#run-the-project-on-your-mac).

## Verification

```sh
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm db:validate
pnpm db:generate
```

The database schema can be validated and a client generated without a running database. `pnpm db:migrate` requires a PostgreSQL server/database configured in `.env`.

## Project status

This is the initial application foundation plus a first moderation command set (`/warn`, `/note`, `/timeout`, `/kick`, `/ban`, `/unban`, `/case`) that records cases and audit entries. Tickets, staff operations, OAuth login, and ER:LC feature workflows are not implemented. The dashboard uses honest setup/empty states. The ER:LC package only calls the documented server-information endpoint; its server key remains optional and server-side.
