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

# Step 4: Generate and set encryption key
print_step "Step 4: Generating encryption key..."
echo ""

if command_exists openssl; then
    ENCRYPTION_KEY=$(openssl rand -hex 32)

    # Update proxy .env file with the generated key
    if [ -f "apps/proxy/.env" ]; then
        # Check if ENCRYPTION_KEY already has a real value (not the placeholder)
        if grep -q "ENCRYPTION_KEY=generate-a-secure-32-byte-key-here" apps/proxy/.env || grep -q "ENCRYPTION_KEY=$" apps/proxy/.env; then
            # macOS and Linux compatible sed
            if [[ "$OSTYPE" == "darwin"* ]]; then
                sed -i '' "s|ENCRYPTION_KEY=.*|ENCRYPTION_KEY=$ENCRYPTION_KEY|" apps/proxy/.env
            else
                sed -i "s|ENCRYPTION_KEY=.*|ENCRYPTION_KEY=$ENCRYPTION_KEY|" apps/proxy/.env
            fi
            print_success "Encryption key generated and saved to apps/proxy/.env"
        else
            print_info "Encryption key already configured in apps/proxy/.env"
        fi
    fi

    # Also set in root .env if it exists
    if [ -f ".env" ]; then
        if grep -q "ENCRYPTION_KEY=.*" .env && ! grep -q "ENCRYPTION_KEY=$ENCRYPTION_KEY" .env; then
            if [[ "$OSTYPE" == "darwin"* ]]; then
                sed -i '' "s|ENCRYPTION_KEY=.*|ENCRYPTION_KEY=$ENCRYPTION_KEY|" .env
            else
                sed -i "s|ENCRYPTION_KEY=.*|ENCRYPTION_KEY=$ENCRYPTION_KEY|" .env
            fi
        fi
    fi
else
    print_warning "OpenSSL not found. Generate encryption key manually with: openssl rand -hex 32"
fi

echo ""

# Step 5: Configuration instructions
print_header "Configuration Required"
echo ""
echo "Before running the application, you need to configure the following:"
echo ""
echo "1. Supabase Configuration:"
echo ""
echo "   Root .env file:"
echo "   - SUPABASE_URL=https://your-project.supabase.co"
echo "   - SUPABASE_ANON_KEY=your-anon-key"
echo "   - SUPABASE_SERVICE_KEY=your-service-role-key"
echo ""
echo "   Web app .env (apps/web/.env):"
echo "   - NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co"
echo "   - NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key"
echo ""
echo "   Proxy .env (apps/proxy/.env):"
echo "   - SUPABASE_URL=https://your-project.supabase.co"
echo "   - SUPABASE_SERVICE_KEY=your-service-role-key"
echo ""
echo "   Get these from: https://app.supabase.com/project/_/settings/api"
echo ""
echo "2. OpenAI API Key (apps/web/.env):"
echo "   - OPENAI_API_KEY=sk-..."
echo ""
echo "   Get this from: https://platform.openai.com/api-keys"
echo ""
if [ -n "$ENCRYPTION_KEY" ]; then
    echo "3. Encryption Key (apps/proxy/.env):"
    echo "   ✓ Already configured: ENCRYPTION_KEY=$ENCRYPTION_KEY"
else
    echo "3. Encryption Key (apps/proxy/.env):"
    echo "   - Generate with: openssl rand -hex 32"
fi
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
