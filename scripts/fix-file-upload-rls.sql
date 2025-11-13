-- Quick Fix: Apply missing RLS policies for file uploads
--
-- This script adds INSERT, UPDATE, and DELETE policies to the files table.
-- Run this if you're experiencing: "new row violates row-level security policy for table 'files'"
--
-- Usage:
--   Option 1 - Supabase Dashboard: Copy and paste into SQL Editor
--   Option 2 - psql: psql <your-connection-string> -f scripts/fix-file-upload-rls.sql
--   Option 3 - Supabase CLI: npx supabase db push (applies all pending migrations)
--
-- This is the same SQL from: supabase/migrations/20240101000008_fix_files_insert_policy.sql

-- Check if policies already exist (will error if they do, which is safe to ignore)
DO $$
BEGIN
    -- Add INSERT policy for files table
    -- Users can insert files into package versions that belong to packages they own
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'files'
        AND policyname = 'Package owners can create files in their versions'
    ) THEN
        CREATE POLICY "Package owners can create files in their versions"
          ON files FOR INSERT
          WITH CHECK (
            package_version_id IN (
              SELECT pv.id FROM package_versions pv
              JOIN packages p ON p.id = pv.package_id
              WHERE p.owner_id = auth.uid()
            )
          );
        RAISE NOTICE 'Created INSERT policy';
    ELSE
        RAISE NOTICE 'INSERT policy already exists';
    END IF;

    -- Add UPDATE policy for files table
    -- Users can update files in package versions that belong to packages they own
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'files'
        AND policyname = 'Package owners can update files in their versions'
    ) THEN
        CREATE POLICY "Package owners can update files in their versions"
          ON files FOR UPDATE
          USING (
            package_version_id IN (
              SELECT pv.id FROM package_versions pv
              JOIN packages p ON p.id = pv.package_id
              WHERE p.owner_id = auth.uid()
            )
          );
        RAISE NOTICE 'Created UPDATE policy';
    ELSE
        RAISE NOTICE 'UPDATE policy already exists';
    END IF;

    -- Add DELETE policy for files table
    -- Users can delete files in package versions that belong to packages they own
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'files'
        AND policyname = 'Package owners can delete files in their versions'
    ) THEN
        CREATE POLICY "Package owners can delete files in their versions"
          ON files FOR DELETE
          USING (
            package_version_id IN (
              SELECT pv.id FROM package_versions pv
              JOIN packages p ON p.id = pv.package_id
              WHERE p.owner_id = auth.uid()
            )
          );
        RAISE NOTICE 'Created DELETE policy';
    ELSE
        RAISE NOTICE 'DELETE policy already exists';
    END IF;
END $$;

-- Verify policies were created
SELECT
    schemaname,
    tablename,
    policyname,
    cmd as operation
FROM pg_policies
WHERE tablename = 'files'
ORDER BY cmd;

-- Expected output: 4 policies (SELECT, INSERT, UPDATE, DELETE)
