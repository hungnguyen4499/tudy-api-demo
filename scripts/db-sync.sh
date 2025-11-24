#!/bin/bash

# Database Sync Script
# Syncs Prisma schema to database

set -e

echo "🔄 Syncing Prisma schema to database..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ Error: DATABASE_URL is not set"
    echo "Please set DATABASE_URL in your .env file"
    exit 1
fi

# Check if using migrations or db push
if [ "$1" == "migrate" ]; then
    echo "📦 Using Prisma Migrate..."
    yarn prisma migrate dev
elif [ "$1" == "push" ]; then
    echo "⚡ Using Prisma DB Push (quick sync)..."
    yarn prisma db push
else
    echo "Usage: ./scripts/db-sync.sh [migrate|push]"
    echo ""
    echo "Options:"
    echo "  migrate  - Create and apply migrations (recommended for production)"
    echo "  push     - Quick sync without migrations (development only)"
    exit 1
fi

echo "✅ Database sync completed!"
echo "📝 Regenerating Prisma Client..."
yarn prisma generate

echo "✨ Done!"

