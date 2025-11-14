#!/bin/bash

set -e

echo "🔧 Fixing Supabase migration state..."
echo ""
echo "This script will:"
echo "  1. Stop the local Supabase instance"
echo "  2. Remove Docker volumes to clear migration state"
echo "  3. Restart Supabase"
echo "  4. Run db:reset to apply migrations"
echo ""

# Check if supabase CLI is available
if ! command -v supabase &> /dev/null; then
    echo "❌ Error: supabase CLI is not installed or not in PATH"
    echo "Please install it from: https://supabase.com/docs/guides/cli/getting-started"
    exit 1
fi

# Stop Supabase
echo "🛑 Stopping Supabase..."
supabase stop --no-backup

# Start Supabase fresh (this will create new volumes)
echo "🚀 Starting Supabase with fresh state..."
supabase start

# Reset database to apply all migrations
echo "📦 Applying migrations..."
supabase db reset

echo ""
echo "✅ Done! Your Supabase instance has been reset with the correct migration order."
echo ""
echo "The migrations are now applied in this order:"
echo "  1. 20240101000000_initial_schema.sql"
echo "  2. 20240101000001_helper_functions.sql (defines get_user_organization_ids)"
echo "  3. 20240101000002_rls_policies.sql (uses the function)"
echo "  4. ... remaining migrations"
