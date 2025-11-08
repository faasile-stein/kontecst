# Development Guide

This guide covers local development setup and workflows for Kontecst.

## Prerequisites

- **Node.js**: 18.x or higher
- **pnpm**: 8.x or higher
- **Docker**: Latest version
- **Docker Compose**: Latest version
- **Supabase Account**: For auth and database

## Initial Setup

### 1. Clone and Install

```bash
git clone https://github.com/your-org/kontecst.git
cd kontecst
pnpm install
```

### 2. Environment Variables

```bash
# Copy example env file
cp .env.example .env

# Generate encryption key
openssl rand -hex 32
```

Edit `.env` and add:

```bash
# Supabase (get from your Supabase project)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-role-key

# Database
DATABASE_URL=postgresql://kontecst:kontecst_dev_password@localhost:5432/kontecst

# File Proxy
NEXT_PUBLIC_FILE_PROXY_URL=http://localhost:3001

# Encryption (use the key you generated)
ENCRYPTION_KEY=your-64-char-hex-key

# Stripe (optional for local dev)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
```

Also copy env files for each app:

```bash
cp apps/web/.env.example apps/web/.env
cp apps/proxy/.env.example apps/proxy/.env
```

### 3. Start Local Database

```bash
pnpm docker:up
```

This starts:
- PostgreSQL with pgvector on port 5432
- pgAdmin on port 5050

### 4. Set Up Supabase

You have two options:

#### Option A: Use Supabase Cloud (Recommended)

1. Create a project at [supabase.com](https://supabase.com)
2. Copy your project URL and keys to `.env`
3. Run migrations:

```bash
cd packages/database
npx supabase link --project-ref your-project-ref
npx supabase db push
```

#### Option B: Use Local Supabase

```bash
cd packages/database
npx supabase init
npx supabase start
npx supabase db reset
```

### 5. Start Development Servers

```bash
pnpm dev
```

This starts:
- Next.js web app: http://localhost:3000
- File proxy service: http://localhost:3001

## Development Workflow

### Project Structure

```
kontecst/
├── apps/
│   ├── web/              # Next.js web application
│   │   ├── src/
│   │   │   ├── app/      # Next.js App Router pages
│   │   │   ├── components/
│   │   │   └── lib/      # Utilities and Supabase client
│   │   └── public/
│   │
│   └── proxy/            # File proxy service
│       ├── src/
│       │   ├── routes/   # API routes
│       │   ├── services/ # Business logic
│       │   └── middleware/
│       └── Dockerfile
│
├── packages/
│   ├── database/         # Supabase migrations
│   │   └── supabase/
│   │       └── migrations/
│   │
│   └── shared/           # Shared code
│       ├── types.ts      # TypeScript types
│       ├── constants.ts  # Constants
│       └── utils.ts      # Utility functions
│
├── docker/               # Docker configs
└── docs/                 # Documentation
```

### Common Tasks

#### Run Type Checks

```bash
pnpm type-check
```

#### Run Linting

```bash
pnpm lint
```

#### Build All Apps

```bash
pnpm build
```

#### Clean Build Artifacts

```bash
pnpm clean
```

### Working with the Database

#### Create a New Migration

```bash
cd packages/database
npx supabase migration new your_migration_name
```

Edit the generated file in `supabase/migrations/`, then apply:

```bash
npx supabase db reset  # Local
# or
npx supabase db push   # Cloud
```

#### Generate TypeScript Types

```bash
cd packages/database
pnpm generate-types
```

This creates `types/supabase.ts` with type-safe database types.

#### View Database

Use pgAdmin at http://localhost:5050:
- Email: admin@kontecst.local
- Password: admin

Add server:
- Host: postgres
- Port: 5432
- Database: kontecst
- Username: kontecst
- Password: kontecst_dev_password

### Working with the File Proxy

#### Test Encryption

```bash
cd apps/proxy

# Start the service
pnpm dev

# In another terminal, test the encryption
curl -X GET http://localhost:3001/health
```

#### View Logs

```bash
# File proxy logs
docker logs -f kontecst-proxy

# PostgreSQL logs
docker logs -f kontecst-postgres
```

### Working with Next.js

#### Create a New Page

```bash
# Create a new route in apps/web/src/app/
mkdir -p apps/web/src/app/packages
touch apps/web/src/app/packages/page.tsx
```

#### Create a New Component

```bash
# Create in apps/web/src/components/
touch apps/web/src/components/PackageCard.tsx
```

#### Add a New API Route

```bash
# Create in apps/web/src/app/api/
mkdir -p apps/web/src/app/api/packages
touch apps/web/src/app/api/packages/route.ts
```

## Testing

### Manual Testing

1. Start all services: `pnpm dev`
2. Open http://localhost:3000
3. Sign up for an account
4. Create a package
5. Upload a `.md` file
6. Test file retrieval

### Testing File Encryption

```bash
# Generate a test file
echo "# Test Package" > test.md

# Upload via API (requires auth token)
curl -X POST http://localhost:3001/api/files/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@test.md" \
  -F "packageId=your-package-id" \
  -F "version=1.0.0"

# Retrieve the file
curl -X GET http://localhost:3001/api/files/your-package-id/1.0.0/test.md \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Debugging

### Next.js Debugging

Add to `.vscode/launch.json`:

```json
{
  "type": "node",
  "request": "launch",
  "name": "Next.js: debug server-side",
  "runtimeExecutable": "pnpm",
  "runtimeArgs": ["dev"],
  "cwd": "${workspaceFolder}/apps/web",
  "skipFiles": ["<node_internals>/**"]
}
```

### File Proxy Debugging

The proxy service uses `tsx watch` for hot reloading. Add breakpoints in your IDE or use `console.log`.

### Database Queries

Use Supabase Studio or pgAdmin to inspect database state and run queries.

## Common Issues

### Port Already in Use

```bash
# Check what's using the port
lsof -i :3000
lsof -i :3001
lsof -i :5432

# Kill the process
kill -9 <PID>
```

### Docker Issues

```bash
# Stop all containers
pnpm docker:down

# Remove volumes (WARNING: deletes data)
docker compose down -v

# Restart
pnpm docker:up
```

### Database Connection Issues

```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# Check logs
docker logs kontecst-postgres

# Verify connection
psql postgresql://kontecst:kontecst_dev_password@localhost:5432/kontecst
```

### pnpm Install Fails

```bash
# Clear pnpm cache
pnpm store prune

# Remove node_modules
rm -rf node_modules apps/*/node_modules packages/*/node_modules

# Reinstall
pnpm install
```

## Performance Tips

### Faster Development Builds

The monorepo is configured for fast incremental builds:
- Next.js uses Turbopack in dev mode
- TypeScript project references
- pnpm for fast package management

### Reduce Docker Resource Usage

Edit `docker-compose.yml` to limit resources:

```yaml
services:
  postgres:
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 1G
```

## Git Workflow

### Branch Naming

- `feature/package-editor` - New features
- `fix/upload-bug` - Bug fixes
- `docs/api-guide` - Documentation
- `refactor/storage-service` - Refactoring

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add markdown editor component
fix: resolve file upload race condition
docs: update architecture diagram
refactor: extract encryption service
```

### Pull Requests

1. Create a branch
2. Make changes
3. Run `pnpm type-check` and `pnpm lint`
4. Commit with conventional commits
5. Push and create PR
6. Wait for CI checks
7. Request review

## Next Steps

- Read [ARCHITECTURE.md](./ARCHITECTURE.md) for system design
- Read [DEPLOYMENT.md](./DEPLOYMENT.md) for production deployment
- Check [API.md](./API.md) for API documentation
