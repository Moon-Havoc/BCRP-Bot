# Database package

PostgreSQL schema and Prisma client for server-side BCRP applications. A PostgreSQL server and database are not provisioned by this package.

1. Install PostgreSQL locally (or use an existing trusted instance) and create a database/user.
2. Copy the root `.env.example` to `.env`, then set `DATABASE_URL` to your local connection string.
3. From the monorepo root run `pnpm db:validate`, then `pnpm db:generate`.
4. For a new local database, run `pnpm db:migrate` to create/apply a migration.

Prisma schema is in `prisma/schema.prisma`. Commit migrations in `prisma/migrations`; never edit migrations that have been applied to shared environments.
