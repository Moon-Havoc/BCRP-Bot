# BCRP Development Guide

**Status:** Initial standards for the planned monorepo  
**Date:** 2026-11-04

This guide sets conventions for implementation and local development. Workspace package scripts are now being established; follow their current definitions in the root and app `package.json` files.

## Toolchain

- **Package manager:** pnpm workspaces. Commit `pnpm-lock.yaml`; use `pnpm install --frozen-lockfile` in CI.
- **Runtime:** select and pin a supported Node.js LTS after checking the chosen discord.js version's documented engine requirement. Keep CI, local development, dashboard, and bot runtime aligned. Avoid blindly pinning a moving `latest` runtime.
- **Language:** TypeScript with strict checking, ESM, explicit module boundaries, and minimal `any` use. Enable `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes` when compatible with dependencies.
- **Frameworks:** discord.js for the bot; Next.js App Router for the dashboard; Prisma/PostgreSQL; Tailwind CSS.
- **Internal API:** Fastify, bound to loopback during local development by default.
- **Validation:** Zod at all external boundaries: environment, HTTP input, job payloads, webhook payloads, and remote API responses.
- **Quality tools:** shared ESLint and formatter configuration; typecheck/lint/format-check/test scripts at root and workspace level.

## Workspace conventions

Use `apps/*` for deployable apps and `packages/*` for reusable libraries. Prefer package exports over deep imports. Keep domain rules framework-independent. Avoid circular dependencies and avoid sharing runtime code merely to remove a few lines of duplication.

Suggested naming:

- Files: kebab-case; React components and exported classes/types: PascalCase; functions and values: camelCase; environment variables: `UPPER_SNAKE_CASE`.
- Commands are organized by feature and have separate definition, validation, authorization, execution, and response rendering responsibilities.
- Database models use singular PascalCase Prisma model names and explicit table/field mappings only when useful for stable naming.
- IDs from Discord/Roblox remain strings; timestamps are UTC.

## TypeScript and error handling

- Keep `strict` enabled. Model expected failures with explicit result/error types at service boundaries; throw for exceptional failures and handle them at application boundaries.
- Do not swallow errors. Convert low-level errors to safe user-facing messages while retaining a redacted structured diagnostic.
- Add context to logs (service, operation, correlation/interaction ID, guild ID when appropriate); never log secrets or full sensitive payloads.
- Avoid unbounded in-memory state. Persist state that must survive process restarts.
- Keep functions small and cohesive; extract services when they encode reusable policy or external I/O.

## Inputs, authorization, and privacy

- Parse every user-controlled request with a Zod schema before using it.
- Authenticate and authorize independently: a valid session does not imply guild access or permission for a particular action.
- Enforce authorization on the server and again in the bot before executing queued Discord side effects.
- Check the bot's own Discord permissions and role hierarchy before attempting moderation/role actions; return a clear safe failure if Discord rejects the action.
- Use minimum OAuth scopes and Gateway intents. Do not request message content until a shipped feature needs it and the intent implications are reviewed.
- Restrict mentions using explicit `allowedMentions`; escape/format user content safely.
- Define retention, redaction, and deletion policies before collecting message content, staff records, or linked account data.

## Discord and Components V2

For new bot-authored message interfaces, use Discord Components V2 with `IS_COMPONENTS_V2`. That flag changes message semantics: traditional `content` and embeds are disabled, and message content is supplied through components. Build reusable containers, text displays, sections, separators, buttons, select menus, media galleries, and thumbnails from current supported API/library types.

Use a coastal design system: navy, muted blue, white, clear hierarchy, restrained decoration, readable spacing, and useful labels. Use buttons only for implemented actions. Every interactive control must have authorization, input validation, loading/defer behavior, error handling, and a test. Give components stable custom IDs with versioned/feature-prefixed formats, for example `mod:case:2:<opaque-id>`; never put secrets or trusted permissions in IDs.

Legacy message composition may be retained only for a specific compatibility need, and must not be described as Components V2. Re-check current Discord docs and discord.js support when implementing.

## Database and migrations

- Prisma is the only normal schema/migration path. Commit migrations and inspect generated SQL for destructive or locking operations.
- Do not modify migrations already applied outside local development; create a forward migration.
- Use transactions for logically atomic writes and audit records. Avoid long transactions around Discord/ER API calls.
- Add unique constraints and idempotency keys for retried events/jobs.
- Do not assume remote side effects and local writes can be one atomic transaction. Use outbox/job state and reconciliation.
- Keep database access server-side. Use connection pooling appropriate to serverless invocations; set a sensible bot connection budget.
- Seed only deterministic development/test data. Never copy production user data into tests or previews.

## Configuration and secrets

- Validate environment variables at process startup with separate schemas for bot and dashboard.
- Maintain `.env.example` using fake placeholders only; never commit real `.env` files, tokens, OAuth secrets, database URLs, or ER:LC keys.
- Keep bot token, OAuth client secret, cookie/session secret, database credentials, and ER:LC server key server-side. Do not prefix secrets with browser-public variable names.
- Provide secrets through the deployment environment or a local ignored file. Rotate exposed credentials promptly; never request credentials in chat or paste them into docs.
- Fail startup clearly when required production configuration is missing; do not silently fall back to insecure values.

## Logging, monitoring, and operations

- Structured JSON logs with severity and consistent service/operation fields.
- Correlate web requests, Discord interactions, and bot jobs with request/interaction/job IDs.
- Redact authorization headers, tokens, cookies, API keys, private message content, and unnecessary personal data.
- Separate liveness (process exists) from readiness (dependencies and required initialization available).
- Keep operational state observable: Gateway status, database connectivity, job lag/failure counts, external API status, and last successful backup.
- For the T430, use a managed service unit, restart-on-failure, least-privilege OS account, firewall, patching, disk monitoring, and off-host backups.

## Testing standard

Implementation tasks should add and run tests relevant to the change. Prefer fast unit tests for pure domain logic; integration tests for Prisma repositories and Discord/ER adapters with mocked network boundaries; and a small number of end-to-end tests for high-value flows. Never call live moderation or ER:LC endpoints in ordinary automated tests.

Test authorization denials as carefully as success paths. Test malformed inputs, missing permissions, role hierarchy, Discord/API rate limits, retries, duplicate jobs, bot restarts, and migration compatibility where applicable. No tests were run for this documentation-only initialization.

## Pull request and change workflow

1. Inspect the current code, docs, tests, and repository instructions before changing behavior.
2. State intended changes and meaningful risks before major architecture changes.
3. Keep changes focused; preserve existing behavior unless the task explicitly changes it.
4. Update docs and feature inventory with user-visible behavior or operational changes.
5. Run formatter, lint, typecheck, and affected tests; report exact commands and results.
6. Review the diff for secrets, permission gaps, unintended deletions, and generated files.
7. Use migrations for schema changes and provide rollout notes for incompatible transitions.

Suggested pull request sections: purpose, user-visible changes, security/permission impact, migration/deployment notes, verification commands/results, and known limitations.

## Initial command convention (target)

The workspace exposes root scripts including:

```text
pnpm lint
pnpm format:check
pnpm typecheck
pnpm test
pnpm --filter @bcrp/database prisma:generate
pnpm --filter @bcrp/database prisma:migrate:dev
pnpm dev:bot
pnpm dev:api
pnpm dev:dashboard
pnpm --filter @bcrp/bot commands:check
pnpm --filter @bcrp/bot commands:register
```

The ER:LC API pack is available to the project owner, but its actual key must remain local/server-side and is not needed for installation or type checking.

## Run the project on your Mac

### 1. Install prerequisites

Install Node.js 24 or newer and pnpm 10 or newer. In Terminal, move into the project folder and install dependencies:

```sh
cd /Users/howard/BCRP
node --version
pnpm --version
pnpm install
cp .env.example .env
```

Open `.env` in a text editor and replace only values you have configured. Do not paste real secrets into chat or commit `.env`. The example Discord and ER:LC values are deliberately fake.

### 2. Optional database setup

PostgreSQL is not installed or started by this project. Install/start PostgreSQL separately, create a local database and database user, and put its connection URL in `DATABASE_URL` in `.env`. Then run:

```sh
pnpm db:validate
pnpm db:generate
pnpm db:migrate
```

The first two commands validate the schema and generate Prisma's client; they do not prove the database is reachable. The migration command needs a running PostgreSQL server and an existing empty database. Database connection has not been assumed.

### 3. Start the dashboard

In a Terminal window:

```sh
cd /Users/howard/BCRP
pnpm dev:dashboard
```

Open [http://localhost:3000](http://localhost:3000). The dashboard is in setup mode. Feature screens show honest empty states and OAuth is not implemented yet.

### 4. Start the API

In a second Terminal window:

```sh
cd /Users/howard/BCRP
pnpm dev:api
```

Visit [http://localhost:4000/health](http://localhost:4000/health). The public health response confirms only that the API process responds. The API also requires `API_AUTH_SECRET` (at least 32 characters) before it starts; set a random local development value in `.env`. It listens on loopback by default. No feature routes connect to PostgreSQL yet.

### 5. Check slash command definitions without connecting

Run:

```sh
pnpm --filter @bcrp/bot commands:check
```

This loads and prints the local `/ping` command definition without logging into Discord. To register the command with Discord, set valid `DISCORD_TOKEN` and `DISCORD_APPLICATION_ID` in `.env`; optionally set `DISCORD_DEV_GUILD_ID` to register it only in that test server. Then run:

```sh
pnpm commands:register
```

Registration makes a real change in Discord. It does not require starting the Gateway bot. Without real Discord credentials, registration and Gateway connectivity cannot be verified.

### 6. Start the bot

In another Terminal window, set valid `DISCORD_TOKEN` and `DISCORD_APPLICATION_ID` in `.env`, then run:

```sh
cd /Users/howard/BCRP
pnpm dev:bot
```

The process validates config, loads commands/events, opens a loopback-only health endpoint at `http://127.0.0.1:4001/health`, and then connects to Discord. It uses only the `Guilds` Gateway intent. Stop with Control+C for graceful shutdown. Fake example values will fail validation and cannot produce Discord connectivity.

### 7. Run quality checks

```sh
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm --filter @bcrp/dashboard build
```

These are local checks only. API health, command definition loading, and static checks do not prove database connectivity, Discord connectivity, or successful real Discord command registration.

## Official references

- [Discord Components Overview](https://discord.com/developers/docs/components/overview)
- [Discord Message Resource](https://discord.com/developers/docs/resources/message)
- [Discord OAuth2](https://discord.com/developers/docs/topics/oauth2)
- [discord.js](https://discord.js.org/docs)
- [ER:LC API docs](https://apidocs.erlc.gg/)
- [Vercel Limits](https://vercel.com/docs/limits)
