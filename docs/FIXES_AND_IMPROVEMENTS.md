# Recent Fixes and Improvements

This document describes the recent fixes and improvements made to the Kontecst platform.

## Overview

This update addresses several critical issues and adds comprehensive API documentation:

1. **Version Number Preset** - Automatically suggests next version number
2. **File Count and Size Display** - Fixed stats not updating correctly
3. **Version Locking** - Ensured database functions are properly applied
4. **API Documentation** - Added comprehensive OpenAPI/Swagger documentation
5. **API Tests** - Added test suite for all user-facing endpoints

---

## 1. Version Number Preset ✅

### Status: Already Working

When creating a new version, the form now automatically presets the version number to the latest version + 1.

### How It Works

- If your package has a version `1.0.0`, the form will suggest `1.0.1`
- If no versions exist, it suggests `1.0.0`
- The version field is pre-filled but can be changed

### Location

File: `apps/web/src/app/dashboard/packages/[id]/versions/new/page.tsx`

Lines 36-46:
```typescript
if (data.package_versions && data.package_versions.length > 0) {
  const latestVersion = data.package_versions[0].version
  const [major, minor, patch] = latestVersion.split('.').map(Number)
  setFormData({
    ...formData,
    version: `${major}.${minor}.${patch + 1}`,
    copyFromVersion: latestVersion
  })
}
```

---

## 2. File Count and Size Display Fix

### The Problem

Package versions were showing "0 files" and "0 KB" even when files were present.

### The Solution

We've added several tools to fix and prevent this issue:

#### A. Recalculate Stats for Single Version

**Endpoint**: `POST /api/packages/:id/versions/:versionId/recalculate-stats`

**Usage**:
```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  https://kontecst.com/api/packages/PACKAGE_ID/versions/VERSION_ID/recalculate-stats
```

**What it does**: Recounts all files and recalculates total size for the specified version.

#### B. Recalculate Stats for All Versions (Admin)

**Endpoint**: `POST /api/admin/recalculate-stats`

**Usage**:
```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  https://kontecst.com/api/admin/recalculate-stats
```

**Response**:
```json
{
  "message": "Stats recalculation complete",
  "total": 10,
  "updated": 10,
  "errors": []
}
```

**What it does**: Recalculates file counts and sizes for ALL versions you own.

#### C. Database Function

The underlying database function is:

```sql
CREATE OR REPLACE FUNCTION recalculate_version_stats(version_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE package_versions
  SET
    file_count = (
      SELECT COUNT(*)
      FROM files
      WHERE package_version_id = version_id
    ),
    total_size_bytes = (
      SELECT COALESCE(SUM(size_bytes), 0)
      FROM files
      WHERE package_version_id = version_id
    )
  WHERE id = version_id;
END;
$$;
```

#### D. Automatic Updates

Stats are automatically updated when:
- **Uploading a file**: Increments `file_count` and `total_size_bytes`
- **Deleting a file**: Decrements `file_count` and `total_size_bytes`
- **Copying a version**: Calculates total from all copied files

### How to Fix Existing Data

1. **Via API** (recommended):
   ```bash
   curl -X POST \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     https://kontecst.com/api/admin/recalculate-stats
   ```

2. **Via Database**:
   ```sql
   -- For all versions
   SELECT recalculate_version_stats(id) FROM package_versions;

   -- For a specific version
   SELECT recalculate_version_stats('version-uuid-here');
   ```

---

## 3. Version Locking Fix

### The Problem

Error: `Could not find the function public.lock_version(user_id, version_id) in the schema cache`

### The Solution

This error occurs when the database migration hasn't been applied.

#### Apply Migrations

Run the migration script:

```bash
# From the project root
./scripts/apply-migrations.sh
```

Or manually:

```bash
# If using local Supabase
supabase db push

# If using remote Supabase
supabase db push --linked
```

#### Verify Migration

Check if the `lock_version` function exists:

```sql
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('lock_version', 'unlock_version');
```

Expected result:
```
 routine_name  | routine_type
---------------+--------------
 lock_version  | FUNCTION
 unlock_version| FUNCTION
```

#### Migration File

The migration is located at:
- `supabase/migrations/20241114000002_add_version_locking.sql`

It adds:
- `is_locked` column to `package_versions`
- `locked_at` column
- `locked_by` column
- `lock_version(version_id, user_id)` function
- `unlock_version(version_id, user_id)` function

#### Usage

**Lock a version**:
```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  https://kontecst.com/api/packages/PACKAGE_ID/versions/VERSION_ID/lock
```

**Unlock a version**:
```bash
curl -X DELETE \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  https://kontecst.com/api/packages/PACKAGE_ID/versions/VERSION_ID/lock
```

**What locking does**:
- Prevents file uploads to the version
- Prevents file modifications
- Prevents file deletions
- Auto-generates a changelog by comparing with previous version
- Sets `is_locked = true`, `locked_at = NOW()`, `locked_by = user.id`

---

## 4. API Documentation

### New API Documentation Page

We've added a comprehensive API documentation page using Swagger UI.

**Access it at**: `https://kontecst.com/api-docs`

Or locally: `http://localhost:3000/api-docs`

### Features

- **Interactive Documentation**: Test endpoints directly in the browser
- **Request/Response Examples**: See example payloads and responses
- **Authentication Support**: Add your JWT token or API key
- **Schema Definitions**: View all data models and types

### OpenAPI Specification

The OpenAPI specification is available at:
- URL: `https://kontecst.com/openapi.json`
- File: `apps/web/public/openapi.json`

### Documented Endpoints

#### Packages
- `GET /api/packages` - List all packages
- `POST /api/packages` - Create a package
- `GET /api/packages/:id` - Get package details
- `PATCH /api/packages/:id` - Update package
- `DELETE /api/packages/:id` - Delete package

#### Versions
- `GET /api/packages/:id/versions` - List versions
- `POST /api/packages/:id/versions` - Create version
- `POST /api/packages/:id/versions/:versionId/lock` - Lock version
- `DELETE /api/packages/:id/versions/:versionId/lock` - Unlock version
- `POST /api/packages/:id/versions/:versionId/recalculate-stats` - Recalculate stats

#### Files
- `POST /api/files` - Upload a file
- `GET /api/files?packageVersionId=:id` - List files
- `GET /api/files/:id` - Get file details
- `PATCH /api/files/:id` - Update file content
- `DELETE /api/files/:id` - Delete file

#### Search
- `POST /api/search` - Semantic search

#### Admin
- `POST /api/admin/recalculate-stats` - Recalculate all version stats

---

## 5. API Tests

### Test Suite

We've added a comprehensive test suite for all user-facing API endpoints.

**Location**: `apps/web/tests/`

**Test Files**:
- `tests/api/packages.test.ts` - Package endpoint tests
- `tests/api/versions.test.ts` - Version endpoint tests
- `tests/api/files.test.ts` - File endpoint tests

### Running Tests

```bash
# Install dependencies first
cd apps/web
pnpm install

# Run tests
pnpm test

# Run tests with UI
pnpm test:ui

# Run tests once (CI mode)
pnpm test:run
```

### Test Coverage

Tests cover:
- Authentication and authorization
- Input validation
- Error handling
- File size limits
- Version locking constraints
- Stats updates
- Duplicate prevention

---

## Setup Instructions

### Prerequisites

1. **Node.js 18+** and **pnpm**
2. **Supabase CLI** (for migrations)

### Installation

```bash
# Install dependencies
pnpm install

# Apply database migrations
./scripts/apply-migrations.sh

# Start development server
pnpm dev
```

### First-Time Setup

1. **Apply Migrations**:
   ```bash
   ./scripts/apply-migrations.sh
   ```

2. **Fix Existing Stats** (if you have existing data):
   ```bash
   # Via API (after server is running)
   curl -X POST \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     http://localhost:3000/api/admin/recalculate-stats
   ```

3. **Install New Dependencies**:
   ```bash
   cd apps/web
   pnpm install
   ```

   New dependencies added:
   - `swagger-ui-react` - For API documentation UI
   - `vitest` - For testing
   - `@vitest/ui` - Test UI
   - `@vitejs/plugin-react` - Vite React plugin

---

## Troubleshooting

### Issue: Version Locking Still Doesn't Work

**Solution**:
1. Verify migrations are applied:
   ```bash
   supabase migration list
   ```

2. Check database function exists:
   ```sql
   SELECT routine_name FROM information_schema.routines
   WHERE routine_schema = 'public' AND routine_name = 'lock_version';
   ```

3. If function is missing, re-apply the migration:
   ```bash
   supabase db push
   ```

### Issue: File Stats Still Show 0

**Solution**:
1. Use the admin endpoint to recalculate:
   ```bash
   curl -X POST \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     http://localhost:3000/api/admin/recalculate-stats
   ```

2. Check if files actually exist:
   ```sql
   SELECT package_version_id, COUNT(*), SUM(size_bytes)
   FROM files
   GROUP BY package_version_id;
   ```

3. Verify the `increment_version_stats` function exists:
   ```sql
   SELECT routine_name FROM information_schema.routines
   WHERE routine_schema = 'public' AND routine_name = 'increment_version_stats';
   ```

### Issue: API Docs Page Shows Blank

**Solution**:
1. Ensure you've installed new dependencies:
   ```bash
   cd apps/web
   pnpm install
   ```

2. Check that `openapi.json` exists:
   ```bash
   ls apps/web/public/openapi.json
   ```

3. Clear Next.js cache:
   ```bash
   pnpm clean
   pnpm dev
   ```

---

## Summary

All requested features have been implemented:

✅ **Version Preset**: Automatically suggests next version number
✅ **File Stats Fix**: Added recalculation endpoints and fixed display
✅ **Version Locking**: Migration script ensures database functions exist
✅ **API Documentation**: Comprehensive Swagger UI documentation
✅ **API Tests**: Full test suite for user-facing endpoints

For questions or issues, please check:
- `/api-docs` - Interactive API documentation
- `docs/API.md` - API reference guide
- `docs/TROUBLESHOOTING_FILE_UPLOAD_RLS.md` - File upload issues
- `docs/DEVELOPMENT.md` - Development setup guide
