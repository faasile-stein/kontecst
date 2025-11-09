#!/bin/bash

# Stop Local Development Environment
# This script stops all local development services

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_header() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

# Get project root directory
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

print_header "Stopping Local Development Environment"

# Check if Supabase is running
if command -v supabase >/dev/null 2>&1; then
    if supabase status >/dev/null 2>&1; then
        print_info "Stopping Supabase..."

        # Ask about backup
        read -p "Create backup before stopping? (Y/n) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Nn]$ ]]; then
            supabase db dump -f "supabase/backups/backup-$(date +%Y%m%d-%H%M%S).sql"
            print_success "Database backup created in supabase/backups/"
        fi

        supabase stop
        print_success "Supabase stopped"
    else
        print_info "Supabase is not running"
    fi
else
    print_warning "Supabase CLI not found"
fi

# Kill any running Node processes from this project (optional)
print_info "Checking for running Node processes..."

# Find and kill processes running on development ports
PORTS=(3000 3001 54321 54322 54323 54324)
for PORT in "${PORTS[@]}"; do
    PID=$(lsof -ti:$PORT 2>/dev/null || true)
    if [ ! -z "$PID" ]; then
        print_info "Stopping process on port $PORT (PID: $PID)..."
        kill -9 $PID 2>/dev/null || true
        print_success "Stopped process on port $PORT"
    fi
done

print_header "All Services Stopped"

print_info "To start again, run:"
echo "  ${GREEN}./scripts/setup-local.sh${NC}"
echo ""
