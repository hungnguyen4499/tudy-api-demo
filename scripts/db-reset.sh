#!/bin/bash

# Database Reset Script
# Resets database and applies all migrations

set -e

echo "⚠️  WARNING: This will delete all data in the database!"
read -p "Are you sure you want to continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "❌ Reset cancelled"
    exit 1
fi

echo "🔄 Resetting database..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ Error: DATABASE_URL is not set"
    echo "Please set DATABASE_URL in your .env file"
    exit 1
fi

yarn prisma migrate reset

echo "✅ Database reset completed!"
echo "📝 Regenerating Prisma Client..."
yarn prisma generate

echo "✨ Done!"

