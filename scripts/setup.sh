#!/bin/bash

# Kontecst Initial Setup Script
# Sets up the development environment for the first time

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

print_header() {
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
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

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

print_step() {
    echo -e "${CYAN}▶${NC} $1"
}

command_exists() {
    command -v "$1" >/dev/null 2>&1
}

clear

print_header "Kontecst Initial Setup"
echo ""
echo "This script will set up your development environment."
echo ""

# Step 1: Check prerequisites
print_step "Step 1: Checking prerequisites..."
echo ""

if ! command_exists node; then
    print_error "Node.js is not installed. Please install Node.js 18+ from https://nodejs.org/"
    exit 1
fi

if ! command_exists pnpm; then
    print_warning "pnpm is not installed. Installing pnpm globally..."
    npm install -g pnpm
    print_success "pnpm installed"
else
    print_success "pnpm is installed"
fi

if ! command_exists docker; then
    print_error "Docker is not installed. Please install Docker Desktop from https://www.docker.com/products/docker-desktop/"
    exit 1
fi

if ! docker info >/dev/null 2>&1; then
    print_error "Docker daemon is not running. Please start Docker Desktop."
    exit 1
fi

print_success "All prerequisites are installed"
echo ""

# Step 2: Install dependencies
print_step "Step 2: Installing dependencies..."
echo ""

pnpm install
print_success "Dependencies installed"
echo ""

# Step 3: Setup environment files
print_step "Step 3: Setting up environment files..."
echo ""

# Root .env
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        cp .env.example .env
        print_success "Created .env from .env.example"
    fi
else
    print_info ".env already exists"
fi

# Web app .env
if [ ! -f "apps/web/.env" ]; then
    if [ -f "apps/web/.env.example" ]; then
        cp apps/web/.env.example apps/web/.env
        print_success "Created apps/web/.env from .env.example"
    fi
else
    print_info "apps/web/.env already exists"
fi

# Proxy .env
if [ ! -f "apps/proxy/.env" ]; then
    if [ -f "apps/proxy/.env.example" ]; then
        cp apps/proxy/.env.example apps/proxy/.env
        print_success "Created apps/proxy/.env from .env.example"
    fi
else
    print_info "apps/proxy/.env already exists"
fi

echo ""

# Step 4: Generate encryption key
print_step "Step 4: Generating encryption key..."
echo ""

if command_exists openssl; then
    ENCRYPTION_KEY=$(openssl rand -hex 32)
    print_success "Encryption key generated: $ENCRYPTION_KEY"
    echo ""
    print_warning "Save this key to your apps/proxy/.env file as ENCRYPTION_KEY"
else
    print_warning "OpenSSL not found. Generate encryption key manually with: openssl rand -hex 32"
fi

echo ""

# Step 5: Configuration instructions
print_header "Configuration Required"
echo ""
echo "Before running the application, you need to configure the following:"
echo ""
echo "1. Supabase Configuration (apps/web/.env):"
echo "   - NEXT_PUBLIC_SUPABASE_URL"
echo "   - NEXT_PUBLIC_SUPABASE_ANON_KEY"
echo "   - SUPABASE_SERVICE_ROLE_KEY"
echo ""
echo "   Get these from: https://app.supabase.com/project/_/settings/api"
echo ""
echo "2. OpenAI API Key (apps/web/.env):"
echo "   - OPENAI_API_KEY"
echo ""
echo "   Get this from: https://platform.openai.com/api-keys"
echo ""
echo "3. Encryption Key (apps/proxy/.env):"
echo "   - ENCRYPTION_KEY=$ENCRYPTION_KEY"
echo ""

# Step 6: Database migrations
print_header "Database Migrations"
echo ""
print_info "After configuring Supabase, run the database migrations:"
echo ""
echo "  1. Go to your Supabase project dashboard"
echo "  2. Navigate to: Database > Migrations"
echo "  3. Upload and run all migrations from: packages/database/supabase/migrations/"
echo ""

# Step 7: Next steps
print_header "Next Steps"
echo ""
echo "Once you've configured the environment files and run migrations:"
echo ""
echo "  pnpm dev:start     - Start all development services"
echo "  pnpm dev:stop      - Stop all services"
echo "  pnpm dev:status    - Check service status"
echo "  pnpm docker:logs   - View Docker logs"
echo ""
print_success "Setup complete!"
echo ""
