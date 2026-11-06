# BCRP Feature Inventory

**Status:** Long-term product inventory; no features implemented yet  
**Date:** 2026-11-04

This document tracks requested product scope, dependencies, and implementation cautions. Listing a feature does not imply that Discord or ER:LC provides a particular capability. Features move to “implemented” only when working behavior, authorization, documentation, and tests are verified.

## Status definitions

- **Planned:** included in the product vision, not implemented.
- **Foundation:** architectural work required before feature delivery.
- **In progress:** actively being implemented with a scoped acceptance definition.
- **Implemented:** shipped and verified against acceptance criteria.
- **Blocked:** a named dependency or policy prevents implementation.

Current state: monorepo/tooling, database schema, permission primitives, API health/auth boundary, bot startup/command loader, Components V2 text card, and dashboard setup shell are **Foundation** and locally verified. The `/ping` command is implemented but has not been registered or run against Discord. Basic moderation slash commands (`/warn`, `/note`, `/timeout`, `/kick`, `/ban`, `/unban`, `/case`) are implemented with Discord permission checks and `ModerationCase`/`AuditLog` persistence, but have not been registered or exercised against a live guild/database. The documented ER:LC server-information client is implemented but has not been called with a live key. Other product workflows listed below remain **Planned**.

## Platform foundation

| Capability                      | Status     | Notes/dependencies                                                              |
| ------------------------------- | ---------- | ------------------------------------------------------------------------------- |
| Monorepo and CI                 | Foundation | pnpm workspace, TypeScript, lint, format, tests, GitHub repository setup        |
| Bot lifecycle                   | Foundation | Persistent Node.js service, reconnect handling, least-privilege Gateway intents |
| Dashboard identity              | Foundation | Discord OAuth2, secure session, guild-level authorization                       |
| Database and audit              | Foundation | PostgreSQL/Prisma migrations, audit model, retention policy                     |
| Components V2 design system     | Foundation | `IS_COMPONENTS_V2`; reusable layouts and interactions                           |
| Configuration and observability | Foundation | Zod environment/input schemas; structured redacted logs                         |

## Discord management

| Capability                   | Status      | Dependencies and cautions                                                                                                                                                               |
| ---------------------------- | ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Moderation                   | In progress | `/warn` `/note` `/timeout` `/kick` `/ban` `/unban` `/case` implemented with permission checks, case records, and audit logs; not yet verified against a live guild or database          |
| Warnings and case management | In progress | Cases recorded via `ModerationCase` + `AuditLog`; retention/appeal policy and dashboard views still pending                                                                             |
| Automoderation               | In progress | `/automod` manages native Discord AutoMod rules (invites, links, spam, mention spam, keywords) with no privileged intent; custom BCRP rules still pending                               |
| Message logging              | In progress | Delete/edit events logged to a configured channel via `/log-config`; requires Message Content intent for body text; retention/deletion policy still pending                             |
| Member logging               | In progress | Join/leave/nickname/role/timeout/ban events logged via `/log-config`; audit trail in `AuditLog` for moderation actions                                                                  |
| Role management              | Planned     | Bot role position and permissions; dashboard authorization and audit                                                                                                                    |
| Welcome and verification     | In progress | `/welcome-config` + join-event welcome card + DM/channel Verify button assigning a role; `/verify-setup` locks channels to verified/staff; captcha-style abuse resistance still pending |
| Custom commands              | Planned     | Safe templating, permission policy, mention restrictions, rate limits                                                                                                                   |
| Permissions                  | Planned     | Explicit guild/feature/action policy across dashboard and bot                                                                                                                           |

## ER:LC integration

| Capability                     | Status     | Dependencies and evidence boundary                                                                    |
| ------------------------------ | ---------- | ----------------------------------------------------------------------------------------------------- |
| Official API client            | Foundation | Owner confirms API pack is purchased; server key is required at runtime and remains local/server-side |
| Server information             | Foundation | Typed client for the documented `GET /v2/server` endpoint with documented optional query flags only   |
| Player information/counts      | Planned    | Verify exact documented API shape and server entitlement before promising                             |
| In-game moderation commands    | Planned    | Implement only if explicitly supported by official API docs; never infer commands                     |
| Server announcements           | Planned    | Verify documented command/action and limits before implementing                                       |
| Session management/live panels | Planned    | Build on documented status/events; define polling/webhook behavior and stale-data display             |
| Game information and logs      | Planned    | Confirm availability/retention and exact documented scope first                                       |
| ER:LC event webhooks           | Planned    | Official docs advertise event webhooks; validate signature/authentication mechanism as documented     |

**Constraint:** The owner confirms the private server API pack is purchased. The server key is still required but was not requested or added. No endpoint inventory beyond the current official reference should be assumed; inspect its current v2 reference before adding routes.

## Staff management

| Capability                     | Status  | Dependencies and cautions                                                         |
| ------------------------------ | ------- | --------------------------------------------------------------------------------- |
| Staff applications             | Planned | Form builder, status workflow, reviewer permissions, data retention               |
| Department applications        | Planned | Department/rank model and reviewer workflow                                       |
| Department management          | Planned | Guild configuration and audit                                                     |
| Rank management                | Planned | Discord roles may mirror, but must not be assumed identical to, BCRP rank records |
| Promotions/demotions           | Planned | Authorization, reason, audit, optional Discord role side effect                   |
| Staff warnings/strikes/records | Planned | Sensitive staff data policy and access controls                                   |
| Shift tracking/clock in/out    | Planned | Anti-abuse rules, timezone display, durable state                                 |
| Weekly quotas                  | Planned | Configurable periods, transparent calculation and corrections                     |
| Leave requests                 | Planned | Approval workflow and privacy controls                                            |
| Staff activity statistics      | Planned | Define source data and retention; avoid misleading activity proxies               |

## Community management

| Capability                    | Status      | Dependencies and cautions                                                                                                 |
| ----------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------- |
| Tickets                       | In progress | Panel + `/ticket` opens private channels with claim/close buttons and audit logs; transcripts and dashboard views pending |
| Application builder           | Planned     | Schema/versioning, form validation, access-controlled review                                                              |
| Suggestions                   | Planned     | Voting rules, anti-abuse, status workflow                                                                                 |
| Polls                         | Planned     | Discord-native feature suitability and accessible results                                                                 |
| Giveaways                     | Planned     | Eligibility, draw transparency, restart-safe timers                                                                       |
| Events                        | Planned     | Discord scheduled events and/or BCRP-specific workflow; clarify ownership                                                 |
| Announcements                 | Planned     | Role/mention controls and audit                                                                                           |
| Reaction/button roles         | Planned     | Prefer buttons/selects for new UI; role hierarchy/authorization checks                                                    |
| Customizable welcome messages | Planned     | Safe variables, mention restrictions, preview/test flow                                                                   |

## Advanced systems

| Capability                       | Status  | Dependencies and cautions                                                                       |
| -------------------------------- | ------- | ----------------------------------------------------------------------------------------------- |
| Dispatch and incident management | Planned | Define whether system is in-Discord, game-linked, or both; ER API capabilities must be verified |
| Roblox account linking           | Planned | Secure proof-of-control approach; Roblox API terms and identity privacy review                  |
| Automation workflows             | Planned | Versioned triggers/actions, permission model, loop prevention, execution audit                  |
| Analytics                        | Planned | Data definitions, aggregation, access control, retention, and privacy                           |
| Dashboard notifications          | Planned | Durable notification state and delivery preferences                                             |
| Customizable configurations      | Planned | Guild-scoped schema validation, safe defaults, audit and migration strategy                     |

## Suggested prioritization

1. Foundation and single-guild vertical slice.
2. Configuration, moderation cases, and audit history.
3. Tickets and applications as bounded, high-value workflows.
4. Staff operations after access/privacy policy is approved.
5. ER:LC connector after confirming API pack access and documenting endpoint-level acceptance criteria.
6. Advanced automation/analytics after the data model and operational reliability are proven.

Priorities should be revisited with the community owner and real usage. Do not optimize for a long checklist at the expense of reliable, permission-safe workflows.

## Feature completion checklist

- User and staff workflows and acceptance criteria documented.
- Actual external API/library capability verified; no fabricated support.
- Permissions and role hierarchy tested, including denial paths.
- Zod validation, safe errors, rate limiting, and audit record where applicable.
- Database migrations and retention/privacy implications addressed.
- Components V2 used for new Discord message UI; all visible controls work.
- Structured logs and recovery behavior added for background work.
- Automated tests run and documentation updated.
