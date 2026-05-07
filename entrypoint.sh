#!/bin/sh
set -e

echo "⏳ Running Prisma migrations..."
npx prisma db push --skip-generate
echo "✅ Database schema synced"

echo "🚀 Starting Next.js dev server..."
exec npm run dev
