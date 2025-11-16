# File Upload 404 Error - Resolution Guide

## Problem Summary

When attempting to save a file via `POST http://localhost:3002/api/files`, you encountered a **404 Not Found** error.

## Root Causes Identified

### 1. Port Mismatch ❌
- **Attempted**: `http://localhost:3002/api/files`
- **Correct**: `http://localhost:3000/api/files`
- The Next.js development server runs on port **3000** by default, not 3002

### 2. Missing Environment Configuration ⚠️
- The `/api/files` API route exists at: `apps/web/src/app/api/files/route.ts`
- It requires Supabase environment variables to function
- Without these variables, the route fails to initialize properly

## Solution

### Step 1: Configure Supabase Environment Variables

Edit the file `apps/web/.env.local` (already created from .env.example) and add your Supabase credentials:

```bash
# Required for file upload API
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_KEY=your-service-role-key-here
```

#### Option A: Local Supabase (Recommended for Development)

```bash
# Install Supabase CLI (if not already installed)
brew install supabase/tap/supabase  # macOS
# or
npm install -g supabase  # Other platforms

# Start local Supabase from project root
cd /home/user/kontecst
supabase start

# Copy the displayed credentials into apps/web/.env.local
# Look for:
# - API URL (use for NEXT_PUBLIC_SUPABASE_URL)
# - anon key (use for NEXT_PUBLIC_SUPABASE_ANON_KEY)
# - service_role key (use for SUPABASE_SERVICE_KEY)
```

#### Option B: Supabase Cloud

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to Settings → API
4. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **Anon key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **Service role key** → `SUPABASE_SERVICE_KEY`

### Step 2: Start the Development Server

```bash
cd /home/user/kontecst
pnpm dev

# Or start just the web app:
cd /home/user/kontecst/apps/web
pnpm dev
```

The server will be available at: **http://localhost:3000**

### Step 3: Test the File Upload API

The API endpoint will now be accessible at:
```
POST http://localhost:3000/api/files
```

## API Endpoint Details

### POST /api/files

**Purpose**: Upload markdown files to a package version

**Request Format**: `multipart/form-data`

**Required Fields**:
- `file`: File (must be .md or .markdown)
- `packageVersionId`: string (UUID of the package version)
- `path`: string (path within the package, e.g., "docs/intro.md")

**Authentication**: Requires authenticated user session (Supabase auth)

**Response**: Returns the created file object with metadata

**Constraints**:
- Max file size: 10 MB
- Only markdown files (.md, .markdown) allowed
- User must be the package owner or a team member

## Verifying the Fix

1. **Check server is running**:
   ```bash
   curl http://localhost:3000
   # Should return 200 and HTML
   ```

2. **Check API route exists**:
   ```bash
   curl http://localhost:3000/api/files
   # Should return 400 or 401, not 404
   ```

3. **Test file upload** (with authentication):
   Use the web interface at `http://localhost:3000/dashboard` to upload files through the UI

## Current Port Configuration

| Service | Port | URL |
|---------|------|-----|
| Web App (Next.js) | 3000 | http://localhost:3000 |
| File Proxy | 3001 | http://localhost:3001 |
| Supabase Studio | 54323 | http://127.0.0.1:54323 |
| Supabase API | 54321 | http://127.0.0.1:54321 |
| PostgreSQL | 54322 | localhost:54322 |

## Changing the Port (Optional)

If you specifically need to run on port 3002:

Edit `apps/web/package.json`:
```json
{
  "scripts": {
    "dev": "next dev -p 3002"
  }
}
```

Then access the API at: `http://localhost:3002/api/files`

## Additional Notes

- The `.env.local` file has been created but needs your actual credentials
- The file upload implementation is already complete at: `apps/web/src/app/api/files/route.ts:20`
- The client-side upload component is at: `apps/web/src/components/upload/file-upload.tsx:76`
