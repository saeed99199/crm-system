#!/bin/sh
set -e

echo "Running prisma db push..."
bunx prisma db push --accept-data-loss

echo "Running seed..."
bun run src/seed-run.ts

echo "Starting server..."
exec bun run src/index.ts
