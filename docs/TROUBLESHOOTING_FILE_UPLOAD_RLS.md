# Troubleshooting: File Upload RLS Policy Error

## Problem

File uploads fail with error:
```
new row violates row-level security policy for table "files"
```

## Root Cause

The `files` table has RLS (Row-Level Security) enabled but is **missing INSERT, UPDATE, and DELETE policies**. The migration file `supabase/migrations/20240101000008_fix_files_insert_policy.sql` exists but has not been applied to your database.

## Solution Options

### Option 1: Apply Migration via Supabase CLI (Recommended)

If you have Docker and Supabase CLI set up locally:

```bash
# Start local Supabase (applies all migrations automatically)
npx supabase start

# Or if already running, push migrations
npx supabase db push

# Or reset database to apply all migrations from scratch
npx supabase db reset
```

### Option 2: Apply SQL Manually via Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to: **SQL Editor**
3. Copy and paste the following SQL:

```sql
-- Add INSERT policy for files table
-- Users can insert files into package versions that belong to packages they own
CREATE POLICY "Package owners can create files in their versions"
  ON files FOR INSERT
  WITH CHECK (
    package_version_id IN (
      SELECT pv.id FROM package_versions pv
      JOIN packages p ON p.id = pv.package_id
      WHERE p.owner_id = auth.uid()
    )
  );

-- Add UPDATE policy for files table
-- Users can update files in package versions that belong to packages they own
CREATE POLICY "Package owners can update files in their versions"
  ON files FOR UPDATE
  USING (
    package_version_id IN (
      SELECT pv.id FROM package_versions pv
      JOIN packages p ON p.id = pv.package_id
      WHERE p.owner_id = auth.uid()
    )
  );

-- Add DELETE policy for files table
-- Users can delete files in package versions that belong to packages they own
CREATE POLICY "Package owners can delete files in their versions"
  ON files FOR DELETE
  USING (
    package_version_id IN (
      SELECT pv.id FROM package_versions pv
      JOIN packages p ON p.id = pv.package_id
      WHERE p.owner_id = auth.uid()
    )
  );
```

4. Click **Run** to execute the SQL
5. Verify the policies were created successfully

### Option 3: Apply via Database Migrations Dashboard

1. Go to your Supabase project dashboard
2. Navigate to: **Database** → **Migrations**
3. Click **New migration**
4. Upload or paste the content from:
   - File: `supabase/migrations/20240101000008_fix_files_insert_policy.sql`
5. Run the migration

### Option 4: Apply via psql (Local Development)

If you're running a local PostgreSQL database:

```bash
# Connect to your database
psql postgresql://kontecst:kontecst_dev_password@localhost:5432/kontecst

# Run the migration file
\i supabase/migrations/20240101000008_fix_files_insert_policy.sql

# Verify policies
\dp files
```

## Verification

After applying the policies, verify they exist:

```sql
-- Check RLS policies on files table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'files';
```

You should see 4 policies:
1. "Users can view files in accessible package versions" (SELECT)
2. "Package owners can create files in their versions" (INSERT)
3. "Package owners can update files in their versions" (UPDATE)
4. "Package owners can delete files in their versions" (DELETE)

## How the Policies Work

The RLS policies ensure that:

- **INSERT**: Only package owners can add files to their package versions
- **UPDATE**: Only package owners can modify files in their package versions
- **DELETE**: Only package owners can remove files from their package versions
- **SELECT**: Users can view files in packages they have access to

The policies work by:
1. Checking `auth.uid()` - the currently authenticated user
2. Joining through `package_versions` → `packages` tables
3. Verifying the package's `owner_id` matches the current user

## Related Files

- Migration file: `supabase/migrations/20240101000008_fix_files_insert_policy.sql`
- Initial RLS policies: `supabase/migrations/20240101000001_rls_policies.sql`
- File upload API: `apps/web/src/app/api/files/route.ts`

## Additional Context

The file upload API route (`apps/web/src/app/api/files/route.ts`) already includes:
- Authentication check (lines 9-17)
- Manual authorization check (lines 48-62)
- These policies provide database-level security as a second layer of defense

This is a "defense in depth" security model where both application-level and database-level access controls work together.
