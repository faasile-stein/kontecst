# Development Scripts

This directory contains utility scripts for managing the Kontecst development environment.

## Local Supabase Scripts

### `setup-local.sh`

**One-command setup for local development with Supabase.**

```bash
./scripts/setup-local.sh
```

This script:
- ✅ Checks all prerequisites (Docker, pnpm, Supabase CLI)
- ✅ Installs Supabase CLI if not present
- ✅ Installs npm dependencies if needed
- ✅ Starts local Supabase (pulls Docker images on first run)
- ✅ Automatically extracts API keys and credentials
- ✅ Creates and configures all `.env` files with proper values
- ✅ Generates secure encryption keys
- ✅ Optionally starts development servers

**Interactive prompts:**
- Asks before overwriting existing `.env` files
- Asks before resetting if Supabase is already running
- Optionally starts dev servers after setup

**First-time run:** May take 2-5 minutes to download Docker images.

**Subsequent runs:** Usually completes in under 10 seconds.

---

### `stop-local.sh`

**Stops all local development services.**

```bash
./scripts/stop-local.sh
```

This script:
- Stops Supabase and all Docker containers
- Optionally creates a database backup before stopping
- Kills any processes running on development ports (3000, 3001, etc.)

**Features:**
- Prompts to create backup before stopping
- Safely cleans up all running services
- Provides instructions for restarting

---

### `reset-local.sh`

**Resets the local database to a clean state.**

```bash
./scripts/reset-local.sh
```

This script:
- ⚠️ **Destroys all local database data**
- Creates automatic backup before reset
- Reapplies all migrations from `supabase/migrations/`
- Useful for starting fresh or testing migrations

**Use cases:**
- Testing database migrations
- Cleaning up test data
- Starting with a fresh schema
- Debugging migration issues

**Safety features:**
- Requires explicit confirmation
- Creates timestamped backup in `supabase/backups/`
- Cannot be run accidentally

---

## Quick Reference

```bash
# First-time setup
./scripts/setup-local.sh

# Daily development
./scripts/setup-local.sh  # Quick start
./scripts/stop-local.sh   # Stop when done

# Database management
./scripts/reset-local.sh  # Reset database

# Other utilities
./scripts/dev.sh          # Start dev servers
./scripts/stop.sh         # Stop dev servers
./scripts/status.sh       # Check status
```

See [Local Development Guide](../docs/LOCAL_DEVELOPMENT.md) for detailed documentation.
