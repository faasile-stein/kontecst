#!/bin/bash

# Script to apply all Supabase migrations
# This ensures that all database schema changes are applied to your database

set -e

echo "========================================="
echo "Kontecst Database Migration Application"
echo "========================================="
echo ""

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI is not installed."
    echo ""
    echo "Install it with:"
    echo "  npm install -g supabase"
    echo "  # or"
    echo "  brew install supabase/tap/supabase"
    echo ""
    exit 1
fi

echo "✓ Supabase CLI is installed"
echo ""

# Check if we're in the right directory
if [ ! -d "supabase/migrations" ]; then
    echo "❌ Not in the project root directory."
    echo "Please run this script from the kontecst repository root."
    exit 1
fi

echo "✓ Found migrations directory"
echo ""

# Check if Supabase is running locally
echo "Checking Supabase status..."
if supabase status &> /dev/null; then
    echo "✓ Supabase is running locally"
    echo ""

    # Apply migrations
    echo "Applying migrations..."
    supabase db push

    echo ""
    echo "✅ All migrations have been applied successfully!"
    echo ""

    # Show migration status
    echo "Migration status:"
    supabase migration list
else
    echo ""
    echo "⚠️  Supabase is not running locally."
    echo ""
    echo "Choose an option:"
    echo "  1. Start Supabase locally: supabase start"
    echo "  2. Push to remote project: supabase db push --linked"
    echo ""
    echo "For remote deployment, make sure you've linked your project:"
    echo "  supabase link --project-ref <project-ref>"
    echo ""
fi

echo ""
echo "========================================="
echo "Important Functions to Verify:"
echo "========================================="
echo "The following database functions should now be available:"
echo "  • increment_version_stats(version_id, file_count, size_bytes)"
echo "  • recalculate_version_stats(version_id)"
echo "  • lock_version(version_id, user_id)"
echo "  • unlock_version(version_id, user_id)"
echo "  • publish_version(version_id, user_id)"
echo "  • unpublish_version(version_id, user_id)"
echo ""
echo "If locking doesn't work, verify the lock_version function exists:"
echo "  SELECT routine_name FROM information_schema.routines"
echo "  WHERE routine_schema = 'public' AND routine_name LIKE '%lock%';"
echo ""
