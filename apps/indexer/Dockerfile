# Production Dockerfile for Kradl Multi-Chain EVM Event Indexer
FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.33.0 --activate
WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/web/package.json ./apps/web/
COPY apps/indexer/package.json ./apps/indexer/

RUN pnpm install --frozen-lockfile --filter @kradl/shared --filter @kradl/indexer --filter @kradl/web

COPY packages/shared ./packages/shared
COPY apps/web/prisma ./apps/web/prisma
COPY apps/indexer ./apps/indexer

RUN pnpm --filter @kradl/shared build
RUN pnpm --filter @kradl/web db:generate

ENV NODE_ENV=production
CMD ["pnpm", "--filter", "@kradl/indexer", "start"]
