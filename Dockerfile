# syntax=docker/dockerfile:1

FROM node:24-bookworm AS build
WORKDIR /repo
RUN corepack enable
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm db:generate
RUN pnpm exec esbuild apps/bot/src/index.ts apps/bot/src/commands/*.ts apps/bot/src/events/*.ts \
      --bundle --platform=node --format=esm --target=node20 --splitting \
      --outdir=/out/dist --outbase=apps/bot/src \
      --external:discord.js --external:@prisma/client --external:prisma \
      --banner:js="import { createRequire } from 'node:module'; const require = createRequire(import.meta.url);"

FROM node:24-bookworm
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /out/dist ./dist
COPY --from=build /repo/packages/database/prisma ./prisma
RUN npm init -y >/dev/null \
    && npm install --no-audit --no-fund discord.js@14.28.1 @prisma/client@6.19.3 prisma@6.19.3 \
    && npx prisma generate --schema=./prisma/schema.prisma
CMD ["node", "dist/index.js"]
