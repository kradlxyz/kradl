# Production Dockerfile for Kradl Web (Next.js 15 + pnpm monorepo)
FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.33.0 --activate
WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/web/package.json ./apps/web/
RUN pnpm install --frozen-lockfile --filter @kradl/shared --filter @kradl/web

COPY packages/shared ./packages/shared
COPY apps/web ./apps/web

RUN pnpm --filter @kradl/shared build
RUN pnpm --filter @kradl/web db:generate
RUN pnpm --filter @kradl/web build

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

EXPOSE 3000
CMD ["pnpm", "--filter", "@kradl/web", "start"]
