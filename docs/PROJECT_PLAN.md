# BCRP Project Plan

**Status:** Initial architecture baseline; monorepo foundation implemented and locally verified  
**Updated:** 2026-11-04  
**Workspace status at initialization:** Empty; the first implementation phase is now creating the monorepo and app/package foundations.

## Product direction

BCRP is a first-party Discord management platform for Beach Coast Roleplay, an Emergency Response: Liberty County (ER:LC) Roblox community. The product will combine a persistent Discord bot with a separate web dashboard, sharing a TypeScript monorepo and PostgreSQL data model. It may learn from the feature breadth of existing tools such as Ducky Pro and Sector, but must use original branding, UX, code, and implementation.

The first release should establish dependable foundations and a small, complete vertical slice. Long-term feature aspirations are inventoried in [FEATURE_INVENTORY.md](FEATURE_INVENTORY.md); they are not a commitment to deliver every system in the first release.

## Established decisions

These are user-established constraints: TypeScript, discord.js, Next.js, Vercel for the dashboard, PostgreSQL, Prisma, Tailwind CSS, Discord OAuth2, pnpm, GitHub, Discord Components V2, a separate bot and dashboard application in one monorepo, and a persistent Node.js bot service. Keep the budget at $0 where reasonably possible. Explain significant proposed deviations and seek approval before changing these choices.

## Initial scope

1. Create the monorepo, repository conventions, CI checks, configuration validation, logging, and docs.
2. Establish database schema/migrations, guild configuration, dashboard identity and authorization model, and an auditable action model.
3. Implement bot startup, health/ready reporting, slash-command registration, and shared Components V2 design primitives.
4. Deliver a narrow end-to-end vertical slice: configure one guild, view bot/guild status in the dashboard, and execute one permission-checked action with audit history.
5. Add subsequent feature modules only after the foundation is stable and the behavior, required Discord intents/permissions, data retention, and acceptance criteria are specified.

No application feature implementation was included in this initialization task.

## Proposed monorepo

```text
apps/
  bot/                 Persistent discord.js Gateway process
  dashboard/           Next.js App Router UI, OAuth callbacks, server API
  api/                 Internal Fastify HTTP service
packages/
  config/              Zod environment/config schemas
  database/            Prisma schema, initial migration, client access
  shared/              Shared validation, API response types, constants
  permissions/         Discord/guild/staff/department/rank/dashboard checks
  logger/              Structured logging and redaction
  discord-ui/          Components V2 builders and coastal design primitives
  erlc/                Typed ER:LC API client (documented routes only)
docs/
  PROJECT_PLAN.md
  ARCHITECTURE.md
  DEVELOPMENT_GUIDE.md
  FEATURE_INVENTORY.md
```

Root pnpm, TypeScript, ESLint, Prettier, Vitest, and CI configuration are kept at the repository root.

The initial design favored dashboard server routes as the API boundary. The implementation prompt explicitly requests a separate `apps/api` service, so this foundation adds a small internal Fastify API while preserving the security boundary: it is not a general bot-control surface. This is a deliberate, user-directed architecture adjustment. More detail is in [ARCHITECTURE.md](ARCHITECTURE.md).

## Foundation implementation status

This phase establishes the workspace, shared packages, initial Prisma model, bot and API runtimes, dashboard shell, CI, and local developer setup. It does not deliver complete moderation, staff, ticket, OAuth, or ER:LC feature workflows.

**Verified locally:** pnpm install; Prettier check; ESLint; TypeScript checks; 11 unit/integration tests; Prisma schema validation and client generation; Next.js production build across all 15 requested routes; local API health/auth smoke checks; offline slash-command loading for `/ping`. The API health endpoint confirms process health only. No database server was configured, and no Discord token/API key was used, so database connectivity, Discord Gateway login, live command registration, and live ER:LC calls remain unverified.

## Hosting and cost direction

- **Dashboard:** Next.js on Vercel, using the free offering only while its current account and usage terms fit the project. Server-side code handles OAuth secrets and database access.
- **Bot:** persistent Node.js process on the available Ubuntu Dell PowerEdge T430. Use a service manager (for example systemd), restart policy, health checks, controlled deployments, and backups. Hosting is not truly free if electricity, network, hardware maintenance, or backup storage are counted.
- **Database:** PostgreSQL. Prefer a free self-hosted instance on the server for a $0 baseline, with the operational risk that the same host may run both bot and database. Revisit managed PostgreSQL if uptime, recovery, or isolation requirements exceed the host's capability; check current pricing before choosing a paid provider.
- **ER:LC:** optional adapter. The owner confirms the ER:LC private server API pack is already purchased. A server key is still required at runtime and must remain private; this foundation does not include or request the key.
- **GitHub:** source of truth once the owner creates/configures the repository. This workspace currently has no `.git` directory.

## Delivery roadmap

### Phase 0 — Repository bootstrap

Initialize GitHub repository, pnpm workspace, Node/pnpm version policy, TypeScript strict settings, lint/format/typecheck scripts, CI, `.env.example` with placeholders only, local development instructions, and secret handling. Decide and pin a supported Node LTS compatible with the selected current discord.js release; re-check upstream requirements at implementation time.

**Exit:** clean install is reproducible; CI validates formatting, lint, types, and tests; no credentials are committed.

### Phase 1 — Platform foundation

Create app/package skeletons, Prisma/PostgreSQL setup and first migration, structured logging, centralized error boundaries, Zod config parsing, health/status reporting, and data-access conventions. Establish dashboard Discord OAuth2 with secure sessions and guild-level authorization checks. Define staff/admin role mapping and server-side authorization policy before enabling write actions.

**Exit:** migrations apply on a clean database; bot can connect/reconnect to Gateway as a persistent process; dashboard can authenticate and show only authorized guilds; sensitive values remain server-side.

### Phase 2 — Discord interaction foundation

Set up slash commands, explicit minimal Gateway intents, permission checks, interaction error handling, command registration workflow, and Components V2 layout/builders. Components V2 messages use the `IS_COMPONENTS_V2` flag and component content rather than conventional message content/embeds. Add visual/accessibility conventions and interaction tests.

**Exit:** one complete command and one interactive Components V2 flow are permission-checked, logged, and tested against Discord's current API/library behavior.

### Phase 3 — Vertical slice

Implement guild configuration, a dashboard status view, an audited moderation or configuration action, and durable propagation to the bot where a live Discord action is required. Use an outbox/job table with idempotency and retry state rather than relying on an ephemeral HTTP call to a sleeping process. Keep database transactions short and surface actionable errors.

**Exit:** one feature can be configured, invoked from Discord or dashboard, persisted, audited, retried safely, and observed end-to-end.

### Phase 4 — Core community operations

Build moderation cases/warnings, automoderation configuration, audit/event logs, welcome/verification, role workflows, tickets, suggestions, and application flows in prioritized modules. Each module needs an owner workflow, permission matrix, data lifecycle, and acceptance tests.

### Phase 5 — Staff operations and ER integration

Add staff/departments/ranks, applications, records, shifts/quotas, leave, and staff analytics. Extend the initial ER:LC client only against documented endpoints, with typed response validation, timeout/retry/rate-limit behavior, and feature flags. The owner has confirmed the API pack is purchased; keep the runtime key in server-only configuration. Do not infer unsupported game-side controls.

### Phase 6 — Advanced operations and scale

Consider dispatch/incidents, Roblox account linking, workflow automation, analytics, notifications, sharding, job workers, and service separation based on observed load. Add retention controls, restore drills, operational dashboards, and security review before broadening access.

## Quality and release gates

- Strict TypeScript; input validation at trust boundaries with Zod.
- Automated unit/integration tests for domain rules, permissions, API adapters, and critical flows. Tests are required for implementation work; no tests were run for this documentation-only task.
- CI runs typecheck, lint, formatting check, and relevant test suites.
- Every database change is represented by a Prisma migration and reviewed for safe rollout/rollback implications.
- Every privileged action is authorized server-side and produces an audit record.
- No fake buttons, placeholder successful actions, unsupported ER API claims, embedded credentials, or silent feature removals.
- Update docs and feature inventory as behavior changes.

## Key risks and open decisions

1. **Vercel and the bot:** Vercel Functions are request-oriented, have bounded execution, and Vercel documents that Functions do not support acting as a WebSocket server. Discord Gateway requires a stable, long-lived WebSocket session. Run the bot on the T430 or another persistent Node host, not as a Vercel Function.
2. **Home-host reliability:** residential connectivity, power, ISP policy, hardware failure, and the single-host database/bot failure domain can affect availability. Establish monitoring, backups, restore procedure, and recovery targets before production use.
3. **Cost assumptions:** Vercel free eligibility/limits and ER:LC API pack pricing can change. Confirm at time of deployment. PostgreSQL self-hosting still has power and operational costs.
4. **Discord privileged intents:** message logging, content-based automod, and some member/presence data depend on intents, permissions, and potentially Discord approval. Request only what an implemented feature needs.
5. **OAuth2 authorization:** being able to log in does not authorize every guild action. Guild ownership, bot installation, dashboard role policy, and action-specific permission checks must be handled explicitly.
6. **Shared database coupling:** both apps sharing PostgreSQL is economical and simple initially, but requires schema discipline, migrations compatible across deployed versions, pooled web connections, and controlled bot job claiming.
7. **Components V2 support:** use current Discord API and discord.js support. Do not silently fall back to embeds for a V2 feature; document any per-message legacy UI kept for a specific constraint.

## Initial source references

- [Discord Components Overview](https://discord.com/developers/docs/components/overview) — Components V2 flag and legacy coexistence.
- [Discord Message Resource](https://discord.com/developers/docs/resources/message) — `IS_COMPONENTS_V2` flag and message rules.
- [ER:LC Private Server API docs](https://apidocs.erlc.gg/) — API pack prerequisite, server-key header, documented endpoints/webhooks.
- [Vercel Limits](https://vercel.com/docs/limits) — Functions do not support acting as a WebSocket server.
- [Vercel Function duration](https://vercel.com/docs/functions/configuring-functions/duration) — request execution is bounded by plan/runtime configuration.
- [discord.js documentation](https://discord.js.org/docs) — current package installation/runtime requirements; re-check for the pinned version.
