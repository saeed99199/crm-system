FROM oven/bun:1 AS base
WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .
RUN bunx prisma generate

ENV NODE_ENV=production

EXPOSE 3000

CMD bunx prisma db push --accept-data-loss && bun run src/seed-run.ts && bun run src/index.ts
