#!/bin/bash

# Kontecst Development Environment Startup Script
# This script sets up and starts all services needed for local development

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print functions
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

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
check_prerequisites() {
    print_header "Checking Prerequisites"

    local all_good=true

    # Check Node.js
    if command_exists node; then
        NODE_VERSION=$(node --version)
        print_success "Node.js $NODE_VERSION installed"
    else
        print_error "Node.js is not installed. Please install Node.js 18 or higher."
        all_good=false
    fi

    # Check pnpm
    if command_exists pnpm; then
        PNPM_VERSION=$(pnpm --version)
        print_success "pnpm $PNPM_VERSION installed"
    else
        print_error "pnpm is not installed. Install it with: npm install -g pnpm"
        all_good=false
    fi

    # Check Docker
    if command_exists docker; then
        DOCKER_VERSION=$(docker --version | cut -d ' ' -f3 | cut -d ',' -f1)
        print_success "Docker $DOCKER_VERSION installed"
    else
        print_error "Docker is not installed. Please install Docker Desktop."
        all_good=false
    fi

    # Check Docker Compose
    if docker compose version >/dev/null 2>&1; then
        print_success "Docker Compose installed"
    else
        print_error "Docker Compose is not available."
        all_good=false
    fi

    # Check Supabase CLI
    if command_exists supabase; then
        SUPABASE_VERSION=$(supabase --version | cut -d ' ' -f1)
        print_success "Supabase CLI $SUPABASE_VERSION installed"
    else
        print_error "Supabase CLI is not installed. Install it with: brew install supabase/tap/supabase"
        print_info "Or visit: https://supabase.com/docs/guides/cli/getting-started"
        all_good=false
    fi

    if [ "$all_good" = false ]; then
        print_error "Please install missing prerequisites before continuing."
        exit 1
    fi

    echo ""
}

# Install dependencies
install_dependencies() {
    print_header "Installing Dependencies"

    if [ ! -d "node_modules" ]; then
        print_info "Installing dependencies with pnpm..."
        pnpm install
        print_success "Dependencies installed"
    else
        print_info "Dependencies already installed. Run 'pnpm install' manually to update."
    fi

    echo ""
}

# Check and create environment files
setup_env_files() {
    print_header "Setting Up Environment Files"

    local needs_config=false

    # Check root .env
    if [ ! -f ".env" ]; then
        if [ -f ".env.example" ]; then
            cp .env.example .env
            print_warning "Created .env from .env.example - Please configure it!"
            needs_config=true
        else
            print_warning ".env file not found and no .env.example available"
        fi
    else
        print_success ".env file exists"
    fi

    # Check web app .env
    if [ ! -f "apps/web/.env" ]; then
        if [ -f "apps/web/.env.example" ]; then
            cp apps/web/.env.example apps/web/.env
            print_warning "Created apps/web/.env from .env.example - Please configure it!"
            needs_config=true
        else
            print_warning "apps/web/.env file not found"
        fi
    else
        print_success "apps/web/.env file exists"
    fi

    # Check proxy .env
    if [ ! -f "apps/proxy/.env" ]; then
        if [ -f "apps/proxy/.env.example" ]; then
            cp apps/proxy/.env.example apps/proxy/.env
            print_warning "Created apps/proxy/.env from .env.example - Please configure it!"
            needs_config=true
        else
            print_warning "apps/proxy/.env file not found"
        fi
    else
        print_success "apps/proxy/.env file exists"
    fi

    if [ "$needs_config" = true ]; then
        echo ""
        print_warning "IMPORTANT: Please configure the following in your .env files:"
        print_info "  1. Supabase URL and keys (from your Supabase project)"
        print_info "  2. OpenAI API key (for embeddings)"
        print_info "  3. Encryption key (generate with: openssl rand -hex 32)"
        echo ""
        read -p "Press Enter when you've configured the .env files, or Ctrl+C to exit..."
    fi

    echo ""
}

# Start Docker services
start_docker() {
    print_header "Starting Docker Services"

    # Check if Docker daemon is running
    if ! docker info >/dev/null 2>&1; then
        print_error "Docker daemon is not running. Please start Docker Desktop."
        exit 1
    fi

    print_info "Starting PostgreSQL with pgvector..."
    docker compose up -d

    print_success "Docker services started"
    echo ""
}

# Start Supabase local instance
start_supabase() {
    print_header "Starting Supabase"

    # Check if Supabase is already running
    if supabase status >/dev/null 2>&1; then
        print_warning "Supabase is already running"
        print_info "Stopping existing instance..."
        supabase stop
    fi

    print_info "Starting Supabase local instance..."

    # Start Supabase (this will pull Docker images if needed and apply migrations)
    if supabase start; then
        print_success "Supabase started successfully"
        echo ""
        print_info "Supabase Studio: http://127.0.0.1:54323"
        print_info "Supabase API: http://127.0.0.1:54321"
        print_info "Supabase DB: postgresql://postgres:postgres@127.0.0.1:54322/postgres"
        echo ""
    else
        print_error "Failed to start Supabase"
        print_info "Check Supabase logs with: supabase status"
        exit 1
    fi
}

# Wait for PostgreSQL to be ready
wait_for_postgres() {
    print_header "Waiting for PostgreSQL"

    print_info "Waiting for database to be ready..."

    local max_attempts=30
    local attempt=0

    while [ $attempt -lt $max_attempts ]; do
        if docker compose exec -T postgres pg_isready -U postgres >/dev/null 2>&1; then
            print_success "PostgreSQL is ready"
            echo ""
            return 0
        fi

        attempt=$((attempt + 1))
        echo -n "."
        sleep 1
    done

    echo ""
    print_error "PostgreSQL failed to start within 30 seconds"
    print_info "Check logs with: docker compose logs postgres"
    exit 1
}

# Run database migrations
run_migrations() {
    print_header "Database Migrations"

    print_success "Supabase migrations applied automatically on startup"
    print_info "Migration files are located in: supabase/migrations/"
    print_info "To add new migrations, use: supabase migration new <migration_name>"

    echo ""
}

# Display test credentials
display_test_credentials() {
    print_header "Test User Credentials"

    echo -e "${GREEN}Test User:${NC}"
    echo -e "  Email:    ${YELLOW}test@kontecst.dev${NC}"
    echo -e "  Password: ${YELLOW}testuser123${NC}"
    echo ""
    echo -e "${GREEN}Admin User:${NC}"
    echo -e "  Email:    ${YELLOW}admin@kontecst.dev${NC}"
    echo -e "  Password: ${YELLOW}adminuser123${NC}"
    echo ""
    print_warning "These are test credentials for local development only!"

    echo ""
}

# Start development servers
start_dev_servers() {
    print_header "Starting Development Servers"

    print_info "Starting Next.js web app and Fastify proxy service..."
    echo ""
    print_success "Services:"
    print_info "  Web app:         http://localhost:3000"
    print_info "  File proxy:      http://localhost:3001"
    print_info "  Supabase Studio: http://127.0.0.1:54323"
    print_info "  Supabase API:    http://127.0.0.1:54321"
    print_info "  PostgreSQL:      localhost:5432"
    print_info "  Supabase DB:     localhost:54322"
    echo ""
    print_info "Press Ctrl+C to stop all services"
    echo ""

    # Start dev servers
    pnpm dev
}

# Cleanup function
cleanup() {
    echo ""
    print_header "Shutting Down"

    print_info "Stopping development servers..."
    print_warning "Supabase is still running. Stop it with: supabase stop"
    print_warning "Docker services are still running. Stop them with: pnpm docker:down"

    exit 0
}

# Register cleanup function
trap cleanup SIGINT SIGTERM

# Main execution
main() {
    clear

    print_header "Kontecst Development Environment"
    echo ""

    check_prerequisites
    install_dependencies
    setup_env_files
    start_supabase
    start_docker
    wait_for_postgres
    run_migrations
    display_test_credentials
    start_dev_servers
}

# Run main function
main
