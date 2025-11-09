# Local Development Setup

This guide will help you set up Kontecst for local development with Supabase.

## Prerequisites

- Node.js >= 18.0.0
- pnpm >= 8.0.0
- Docker Desktop (required for Supabase)

## 🚀 Automated Setup (Recommended)

The fastest way to get started:

```bash
# One command to set up everything!
./scripts/setup-local.sh
```

This script will:
- ✅ Check all prerequisites (Docker, pnpm, Supabase CLI)
- ✅ Install dependencies if needed
- ✅ Start Supabase and wait for it to be ready
- ✅ Extract credentials automatically
- ✅ Create and configure all `.env` files
- ✅ Optionally start development servers

**That's it!** Your environment is ready. Visit http://localhost:3000

### Other Helpful Scripts

```bash
# Stop all local services
./scripts/stop-local.sh

# Reset database (with automatic backup)
./scripts/reset-local.sh
```

## 📖 Manual Setup

If you prefer to set things up manually or want more control:

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Set Up Local Supabase

First, make sure Docker Desktop is running, then:

```bash
# Start Supabase (this will pull Docker images on first run)
supabase start
```

This command will:
- Pull and start all required Docker containers (Postgres, Auth, Storage, etc.)
- Apply all database migrations from `supabase/migrations/`
- Display your local Supabase credentials

The output will look like this:

```
Started supabase local development setup.

         API URL: http://127.0.0.1:54321
     GraphQL URL: http://127.0.0.1:54321/graphql/v1
  S3 Storage URL: http://127.0.0.1:54321/storage/v1/s3
          DB URL: postgresql://postgres:postgres@127.0.0.1:54322/postgres
      Studio URL: http://127.0.0.1:54323
    Inbucket URL: http://127.0.0.1:54324
      JWT secret: super-secret-jwt-token-with-at-least-32-characters-long
        anon key: eyJh... (long JWT token)
service_role key: eyJh... (long JWT token)
   S3 Access Key: 625729a08b95bf1b7ff351a663f3a23c
   S3 Secret Key: 850181e4652dd023b7a98c58ae0d2d34bd487ee0cc3254aed6eda37307425907
       S3 Region: local
```

### 3. Configure Environment Variables

Copy the output from `supabase start` and update your `.env` files:

#### Root `.env`

```bash
# Supabase (use values from 'supabase start' output)
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_ANON_KEY=<anon key from output>
SUPABASE_SERVICE_KEY=<service_role key from output>

# Database
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres

# File Proxy
NEXT_PUBLIC_FILE_PROXY_URL=http://localhost:3001

# Encryption (generate with: openssl rand -hex 32)
ENCRYPTION_KEY=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef

# Environment
NODE_ENV=development
```

#### `apps/web/.env`

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key from output>
SUPABASE_SERVICE_KEY=<service_role key from output>

# File Proxy Service
NEXT_PUBLIC_FILE_PROXY_URL=http://localhost:3001

# OpenAI (optional, for embeddings)
OPENAI_API_KEY=sk-...
```

#### `apps/proxy/.env`

```bash
# Server
PORT=3001
NODE_ENV=development

# Supabase
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_SERVICE_KEY=<service_role key from output>

# Encryption
ENCRYPTION_KEY=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef
ENCRYPTION_ALGORITHM=aes-256-gcm

# Storage
STORAGE_PATH=/data/files

# Logging
LOG_LEVEL=info
```

### 4. Start Development Servers

```bash
# Start all services
pnpm dev

# Or use the helper script
./scripts/dev.sh
```

This will start:
- Next.js web app on http://localhost:3000
- File proxy service on http://localhost:3001

## Useful Commands

```bash
# View Supabase status
supabase status

# Stop Supabase
supabase stop

# Reset database (drops all data and re-runs migrations)
supabase db reset

# Access Supabase Studio (database management UI)
# Open http://127.0.0.1:54323 in your browser

# View logs
supabase logs

# Run database migrations
supabase db push

# Generate TypeScript types from database
supabase gen types typescript --local > packages/database/types/supabase.ts
```

## Database Management

### Supabase Studio

Access the Supabase Studio at http://127.0.0.1:54323 to:
- Browse and edit data
- Run SQL queries
- Manage authentication
- Configure storage buckets
- View API documentation

### Creating New Migrations

```bash
# Create a new migration
supabase migration new your_migration_name

# This creates a file in supabase/migrations/
# Edit the file to add your SQL changes

# Apply the migration
supabase db reset
```

## Troubleshooting

### Docker Issues

If you see "Cannot connect to Docker daemon":
1. Make sure Docker Desktop is installed and running
2. Restart Docker Desktop
3. Try `supabase stop` then `supabase start`

### Port Conflicts

If ports are already in use, you can modify them in `supabase/config.toml`:
- API: port 54321
- Database: port 54322
- Studio: port 54323
- Inbucket: port 54324

### Reset Everything

```bash
# Stop Supabase
supabase stop --no-backup

# Remove all volumes (WARNING: deletes all data)
supabase stop --backup

# Start fresh
supabase start
```

## Testing

```bash
# Run tests
pnpm test

# Run linting
pnpm lint

# Type check
pnpm type-check
```

## Next Steps

1. Visit http://localhost:3000 to see the web app
2. Visit http://127.0.0.1:54323 to access Supabase Studio
3. Check the main [README.md](../README.md) for more information
