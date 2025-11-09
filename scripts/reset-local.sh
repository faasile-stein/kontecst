#!/bin/bash

# Reset Local Development Environment
# This script completely resets the local Supabase database

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

print_header "Reset Local Development Environment"

print_warning "This will delete all data in your local database!"
read -p "Are you sure you want to continue? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_info "Reset cancelled"
    exit 0
fi

# Create backup directory
mkdir -p supabase/backups

# Backup current database
if supabase status >/dev/null 2>&1; then
    print_info "Creating backup before reset..."
    BACKUP_FILE="supabase/backups/pre-reset-$(date +%Y%m%d-%H%M%S).sql"
    supabase db dump -f "$BACKUP_FILE"
    print_success "Backup created: $BACKUP_FILE"
fi

# Reset database
print_info "Resetting database..."
supabase db reset

print_success "Database reset complete!"

print_info "All migrations have been reapplied"
print_info "Database is now in a clean state"
echo ""
print_info "Visit http://127.0.0.1:54323 to manage your database"
echo ""
