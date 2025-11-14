# Development Scripts

This directory contains scripts to help with local development and testing of the Kontecst platform.

## Available Scripts

### 🚀 Setup Script (`setup.sh`)

Initial setup script for first-time development environment configuration.

**Usage:**
```bash
pnpm setup
# or
./scripts/setup.sh
```

**What it does:**
- Checks for required prerequisites (Node.js, pnpm, Docker)
- Installs project dependencies
- Creates `.env` files from examples
- Generates encryption keys
- Provides configuration instructions
- Guides through database migration setup

**When to use:**
- First time setting up the project
- After cloning the repository
- When resetting your development environment

---

### 🎯 Development Start Script (`dev.sh`)

Comprehensive script that starts all services needed for development.

**Usage:**
```bash
pnpm dev:start
# or
./scripts/dev.sh
```

**What it does:**
1. Checks prerequisites (Node.js, pnpm, Docker)
2. Installs dependencies if needed
3. Verifies environment files exist
4. Starts Docker services (PostgreSQL + pgvector)
5. Waits for database to be ready
6. Starts development servers (Next.js + Fastify)

**Services started:**
- **Next.js Web App** → `http://localhost:3000`
- **Fastify File Proxy** → `http://localhost:3001`
- **PostgreSQL + pgvector** → `localhost:5432`

**Note:** Press `Ctrl+C` to stop the development servers. Docker containers will continue running.

---

### 🛑 Stop Script (`stop.sh`)

Stops all running services including Docker containers.

**Usage:**
```bash
pnpm dev:stop
# or
./scripts/stop.sh
```

**What it does:**
- Stops and removes Docker containers
- Cleans up Docker networks

**Note:** This only stops Docker services. If dev servers are running in another terminal, you'll need to stop them separately with `Ctrl+C`.

---

### 📊 Status Script (`status.sh`)

Checks the status of all development services.

**Usage:**
```bash
pnpm dev:status
# or
./scripts/status.sh
```

**What it shows:**
- Docker container status
- Web app availability (port 3000)
- File proxy availability (port 3001)
- Database availability (port 5432)
- Quick links to all services

**Example output:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Kontecst Service Status
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ℹ Docker Services:
SERVICE    STATUS              PORTS
postgres   Up 2 minutes        0.0.0.0:5432->5432/tcp

ℹ Development Servers:
✓ Running - Next.js Web App (http://localhost:3000)
✓ Running - Fastify File Proxy (http://localhost:3001)
✓ Running - PostgreSQL + pgvector (localhost:5432)
```

---

### 🔧 Fix Database Reset Script (`fix-db-reset.sh`)

Fixes migration state issues when `pnpm db:reset` fails due to renamed or reordered migrations.

**Usage:**
```bash
./scripts/fix-db-reset.sh
```

**What it does:**
1. Stops the local Supabase instance
2. Removes Docker volumes to clear cached migration state
3. Restarts Supabase with fresh state
4. Runs `db:reset` to apply all migrations in correct order

**When to use:**
- When you get errors like "function does not exist" during `db:reset`
- After migrations have been renamed or reordered
- When Supabase's internal migration tracking is out of sync with actual migration files

**Example error this fixes:**
```
ERROR: function get_user_organization_ids(uuid) does not exist (SQLSTATE 42883)
```

**Note:** This will completely reset your local Supabase instance and re-apply all migrations. Any local data will be lost, but seed data will be reloaded.

---

## Quick Reference

| Command | Description |
|---------|-------------|
| `pnpm setup` | First-time setup |
| `pnpm dev:start` | Start all services |
| `pnpm dev:stop` | Stop all services |
| `pnpm dev:status` | Check service status |
| `./scripts/fix-db-reset.sh` | Fix Supabase migration state issues |
| `pnpm docker:logs` | View Docker logs |
| `pnpm dev` | Start dev servers only (no Docker setup) |

## Troubleshooting

### Services won't start

1. **Check prerequisites:**
   ```bash
   node --version  # Should be 18+
   pnpm --version  # Should be 8+
   docker --version
   ```

2. **Make sure Docker is running:**
   - Start Docker Desktop
   - Verify with: `docker info`

3. **Check for port conflicts:**
   ```bash
   # On macOS/Linux
   lsof -i :3000  # Next.js
   lsof -i :3001  # Fastify
   lsof -i :5432  # PostgreSQL

   # On Windows (PowerShell)
   netstat -ano | findstr :3000
   netstat -ano | findstr :3001
   netstat -ano | findstr :5432
   ```

### Environment configuration issues

1. **Missing .env files:**
   - Run `pnpm setup` to create them
   - Or manually copy `.env.example` files

2. **Invalid configuration:**
   - Check Supabase URL and keys
   - Verify OpenAI API key
   - Ensure encryption key is set

### Database connection issues

1. **Wait for PostgreSQL to be ready:**
   ```bash
   docker compose exec postgres pg_isready -U postgres
   ```

2. **Check Docker logs:**
   ```bash
   pnpm docker:logs
   ```

3. **Reset database:**
   ```bash
   pnpm dev:stop
   docker compose down -v  # Remove volumes
   pnpm dev:start
   ```

### Migration errors

If you encounter errors when running `pnpm db:reset`, such as:
- `ERROR: function get_user_organization_ids(uuid) does not exist`
- Migration file ordering issues
- Supabase trying to apply non-existent migration files

**Solution:**
```bash
./scripts/fix-db-reset.sh
```

This script will:
1. Stop Supabase
2. Clear cached migration state
3. Restart and apply migrations in correct order

**Root cause:** Migration files were renamed/reordered, but Supabase's Docker volumes still contain old migration tracking data.

### Permission errors on scripts

Make scripts executable:
```bash
chmod +x scripts/*.sh
```

## Development Workflow

### Starting a Development Session

```bash
# 1. Start all services
pnpm dev:start

# 2. In another terminal, check status
pnpm dev:status

# 3. Access the application
# Open http://localhost:3000 in your browser
```

### Ending a Development Session

```bash
# Stop dev servers (in the terminal running them)
Ctrl+C

# Stop Docker services
pnpm dev:stop
```

### Checking Service Health

```bash
# Quick status check
pnpm dev:status

# Detailed Docker logs
pnpm docker:logs

# Follow specific service logs
docker compose logs -f postgres
docker compose logs -f <service-name>
```

## Script Requirements

All scripts require:
- **Bash** (comes with macOS/Linux, use Git Bash on Windows)
- **Node.js 18+**
- **pnpm 8+**
- **Docker Desktop**
- **OpenSSL** (for encryption key generation)

## Configuration Files

Scripts will look for and create these configuration files:

```
.
├── .env                    # Root environment variables
├── apps/
│   ├── web/
│   │   └── .env           # Next.js environment variables
│   └── proxy/
│       └── .env           # Fastify proxy environment variables
```

### Required Environment Variables

**apps/web/.env:**
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
OPENAI_API_KEY=your_openai_key
```

**apps/proxy/.env:**
```bash
ENCRYPTION_KEY=your_64_char_hex_key
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Additional Resources

- [Main README](../README.md) - Project overview and features
- [Development Guide](../docs/DEVELOPMENT.md) - Detailed development documentation
- [Architecture](../docs/ARCHITECTURE.md) - System architecture overview
- [API Documentation](../docs/API.md) - API endpoints and usage
