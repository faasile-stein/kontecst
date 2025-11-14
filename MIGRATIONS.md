# Database Migrations Guide

This document explains how database migrations work in the Kontecst project.

## Overview

Kontecst uses [Supabase](https://supabase.com) for database management, which provides a robust migration system. All migrations are automatically applied when you start the local development environment.

## Migration Locations

Migrations are stored in two locations:

- **Primary**: `supabase/migrations/` - Used by Supabase CLI
- **Secondary**: `packages/database/supabase/migrations/` - Backup copy

The `dev:start` script automatically syncs these directories before starting Supabase.

## Automatic Migration Application

When you run `pnpm dev:start`, migrations are automatically:

1. **Synced** between the two migration directories
2. **Applied** by Supabase when starting the local instance
3. **Verified** with a migration status check

You don't need to manually run migrations during normal development!

## Creating New Migrations

### Method 1: Using pnpm scripts (Recommended)

```bash
# Create a new migration
pnpm migrations:new your_migration_name

# This creates a new file in supabase/migrations/
# Edit the file to add your SQL changes
```

### Method 2: Using Supabase CLI directly

```bash
supabase migration new your_migration_name
```

## Migration Commands

```bash
# Sync migrations between directories
pnpm migrations:sync

# Create a new migration
pnpm migrations:new <name>

# Check migration status
pnpm migrations:status

# Apply pending migrations
pnpm migrations:apply

# Reset database and re-run all migrations
pnpm db:reset
```

## Migration Best Practices

1. **Always test migrations locally** before pushing to remote
2. **Use descriptive names** for migrations (e.g., `add_user_preferences_table`)
3. **Keep migrations atomic** - each migration should do one thing
4. **Never edit applied migrations** - create a new migration instead
5. **Run `pnpm migrations:sync`** after creating a migration to keep directories in sync

## Migration File Naming

Migrations follow this naming convention:

```
YYYYMMDDHHMMSS_description.sql
```

Example:
```
20241114000002_fix_audit_events_rls.sql
```

## Troubleshooting

### Migrations not applying

```bash
# Check migration status
pnpm migrations:status

# Force reset database
pnpm db:reset
```

### Migration directories out of sync

```bash
# Manually sync migrations
pnpm migrations:sync
```

### Supabase not starting

```bash
# Check Supabase status
supabase status

# Stop and restart
supabase stop
pnpm dev:start
```

## Viewing Applied Migrations

You can view migration history in multiple ways:

1. **Supabase Studio**: Visit http://127.0.0.1:54323 → Database → Migrations
2. **CLI**: Run `pnpm migrations:status`
3. **Database**: Query the `supabase_migrations.schema_migrations` table

## Production Migrations

For production deployments:

1. Migrations in `supabase/migrations/` are automatically applied by Supabase
2. You can also apply them via the Supabase dashboard: Project → Database → Migrations
3. Or use the CLI: `supabase db push --project-ref your-project-ref`

## Example: Creating a Migration

```bash
# 1. Create the migration
pnpm migrations:new add_user_settings

# 2. Edit the file: supabase/migrations/20241114120000_add_user_settings.sql
# Add your SQL:
CREATE TABLE user_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  theme TEXT DEFAULT 'light',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

# 3. Sync to backup location
pnpm migrations:sync

# 4. Apply the migration
supabase db reset  # or restart: pnpm dev:start

# 5. Verify
pnpm migrations:status
```

## Important Notes

- ✅ Migrations run automatically on `pnpm dev:start`
- ✅ Migrations are synced automatically before Supabase starts
- ✅ Migration status is displayed during startup
- ⚠️  Always commit both migration directories to git
- ⚠️  Never delete or modify applied migrations

## Related Documentation

- [Supabase Migrations Guide](https://supabase.com/docs/guides/cli/local-development#database-migrations)
- [Supabase CLI Reference](https://supabase.com/docs/reference/cli/introduction)
