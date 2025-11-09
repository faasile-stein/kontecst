# Development Setup Guide

## Prerequisites

- Node.js 18+ and pnpm
- Docker Desktop
- Supabase CLI

## Quick Start

### 1. Install Supabase CLI

Choose the installation method for your platform:

**macOS/Linux (Homebrew):**
```bash
brew install supabase/tap/supabase
```

**Windows (Scoop):**
```powershell
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

**NPX (any platform):**
```bash
npx supabase <command>
```

See the [official installation guide](https://supabase.com/docs/guides/cli/getting-started#installing-the-supabase-cli) for more options.

### 2. Start Local Supabase

```bash
# Initialize Supabase (if not already done)
npx supabase init

# Start all Supabase services (Postgres, Auth, Storage, etc.)
npx supabase start
```

This will start local Supabase on these ports:
- API: http://localhost:54321
- Studio: http://localhost:54323
- Database: postgresql://postgres:postgres@localhost:54322/postgres

### 3. Install Dependencies

```bash
pnpm install
```

### 4. Environment Setup

The `.env` files have been pre-configured for local development with:
- Local Supabase URL and default keys
- Development encryption key (with auto-fallback)
- Local file proxy settings

**Note:** The encryption key will automatically use a development fallback if not set. This is safe for development but will warn you and prevent production use.

### 5. Start Development Servers

```bash
pnpm dev
```

This starts:
- Web app: http://localhost:3000
- File proxy: http://localhost:3001

## Troubleshooting

### Encryption Key Error

If you see "ENCRYPTION_KEY must be 32 bytes", the service will automatically fall back to a development key and show a warning. This is intentional for easy local development.

To set a custom key:
```bash
# Generate a secure key
openssl rand -hex 32

# Add to apps/proxy/.env
ENCRYPTION_KEY=<your-generated-key>
```

### Supabase Connection Error

If you see "Invalid supabaseUrl", make sure:
1. Supabase is running: `npx supabase status`
2. The URL in `.env` files matches: `http://127.0.0.1:54321`

### Port Conflicts

If ports 54321-54324 are in use:
- Stop Supabase: `npx supabase stop`
- Or change ports in `supabase/config.toml`

## Additional Commands

```bash
# Check Supabase status
npx supabase status

# Stop Supabase
npx supabase stop

# View Supabase Studio (database UI)
open http://localhost:54323

# Run migrations
npx supabase db push

# Reset database
npx supabase db reset
```

## Docker Services (Alternative)

If you don't want to use Supabase, you can use just PostgreSQL:

```bash
# Start only PostgreSQL with pgvector
pnpm docker:up

# Stop services
pnpm docker:down
```

Then update `.env` files to point to `postgresql://kontecst:kontecst_dev_password@localhost:5432/kontecst`
