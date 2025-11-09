#!/bin/bash

# Local Development Setup Script
# This script sets up the complete local development environment with Supabase

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print colored output
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

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Get project root directory
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

print_header "Kontecst Local Development Setup"

# Check prerequisites
print_info "Checking prerequisites..."

if ! command_exists docker; then
    print_error "Docker is not installed. Please install Docker Desktop first."
    echo "Visit: https://docs.docker.com/desktop/"
    exit 1
fi

if ! docker info >/dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker Desktop."
    exit 1
fi

if ! command_exists supabase; then
    print_error "Supabase CLI is not installed."
    print_info "Installing Supabase CLI..."

    # Detect OS and architecture
    OS="$(uname -s)"
    ARCH="$(uname -m)"

    case "$OS" in
        Linux*)
            if [ "$ARCH" = "x86_64" ]; then
                SUPABASE_URL="https://github.com/supabase/cli/releases/latest/download/supabase_linux_amd64.tar.gz"
            elif [ "$ARCH" = "aarch64" ] || [ "$ARCH" = "arm64" ]; then
                SUPABASE_URL="https://github.com/supabase/cli/releases/latest/download/supabase_linux_arm64.tar.gz"
            fi
            ;;
        Darwin*)
            if [ "$ARCH" = "arm64" ]; then
                SUPABASE_URL="https://github.com/supabase/cli/releases/latest/download/supabase_darwin_arm64.tar.gz"
            else
                SUPABASE_URL="https://github.com/supabase/cli/releases/latest/download/supabase_darwin_amd64.tar.gz"
            fi
            ;;
        *)
            print_error "Unsupported operating system: $OS"
            exit 1
            ;;
    esac

    curl -L "$SUPABASE_URL" | tar -xz -C /tmp
    sudo mv /tmp/supabase /usr/local/bin/supabase
    sudo chmod +x /usr/local/bin/supabase
    print_success "Supabase CLI installed"
fi

if ! command_exists pnpm; then
    print_error "pnpm is not installed. Please install pnpm first."
    echo "Run: npm install -g pnpm"
    exit 1
fi

print_success "All prerequisites met"

# Check if Supabase is already running
if supabase status >/dev/null 2>&1; then
    print_warning "Supabase is already running"
    read -p "Do you want to reset and restart? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_info "Stopping Supabase..."
        supabase stop
        print_success "Supabase stopped"
    else
        print_info "Using existing Supabase instance"
        SUPABASE_ALREADY_RUNNING=true
    fi
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    print_header "Installing Dependencies"
    pnpm install
    print_success "Dependencies installed"
fi

# Start Supabase
if [ "$SUPABASE_ALREADY_RUNNING" != "true" ]; then
    print_header "Starting Supabase"
    print_info "This may take a few minutes on first run (pulling Docker images)..."

    # Start Supabase and capture output
    SUPABASE_OUTPUT=$(supabase start 2>&1)
    echo "$SUPABASE_OUTPUT"

    if [ $? -ne 0 ]; then
        print_error "Failed to start Supabase"
        exit 1
    fi

    print_success "Supabase started successfully"
else
    # Get status output
    SUPABASE_OUTPUT=$(supabase status 2>&1)
fi

# Extract credentials from output
print_header "Configuring Environment Variables"

# Parse Supabase output
API_URL=$(echo "$SUPABASE_OUTPUT" | grep "API URL:" | awk '{print $3}')
ANON_KEY=$(echo "$SUPABASE_OUTPUT" | grep "anon key:" | awk '{print $3}')
SERVICE_KEY=$(echo "$SUPABASE_OUTPUT" | grep "service_role key:" | awk '{print $3}')
DB_URL=$(echo "$SUPABASE_OUTPUT" | grep "DB URL:" | awk '{print $3}')

if [ -z "$API_URL" ] || [ -z "$ANON_KEY" ] || [ -z "$SERVICE_KEY" ]; then
    print_error "Failed to extract Supabase credentials"
    print_info "Please manually configure .env files from the output above"
    exit 1
fi

print_info "Extracted credentials:"
echo "  API URL: $API_URL"
echo "  Anon Key: ${ANON_KEY:0:20}..."
echo "  Service Key: ${SERVICE_KEY:0:20}..."

# Generate encryption key
ENCRYPTION_KEY=$(openssl rand -hex 32 2>/dev/null || cat /dev/urandom | tr -dc 'a-f0-9' | fold -w 64 | head -n 1)

# Function to create .env file from template
create_env_file() {
    local template=$1
    local output=$2
    local env_type=$3

    print_info "Creating $output..."

    if [ -f "$output" ]; then
        print_warning "$output already exists"
        read -p "Overwrite? (y/N) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_info "Skipping $output"
            return
        fi
    fi

    if [ ! -f "$template" ]; then
        print_warning "Template $template not found, creating from scratch"

        if [ "$env_type" = "root" ]; then
            cat > "$output" <<EOF
# Supabase
SUPABASE_URL=$API_URL
SUPABASE_ANON_KEY=$ANON_KEY
SUPABASE_SERVICE_KEY=$SERVICE_KEY

# Database
DATABASE_URL=$DB_URL

# File Proxy
NEXT_PUBLIC_FILE_PROXY_URL=http://localhost:3001

# Encryption
ENCRYPTION_KEY=$ENCRYPTION_KEY

# Environment
NODE_ENV=development
EOF
        elif [ "$env_type" = "web" ]; then
            cat > "$output" <<EOF
# Supabase
NEXT_PUBLIC_SUPABASE_URL=$API_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=$ANON_KEY
SUPABASE_SERVICE_KEY=$SERVICE_KEY

# File Proxy Service
NEXT_PUBLIC_FILE_PROXY_URL=http://localhost:3001

# OpenAI (optional, for embeddings)
# OPENAI_API_KEY=sk-...
EOF
        elif [ "$env_type" = "proxy" ]; then
            cat > "$output" <<EOF
# Server
PORT=3001
NODE_ENV=development

# Supabase
SUPABASE_URL=$API_URL
SUPABASE_SERVICE_KEY=$SERVICE_KEY

# Encryption
ENCRYPTION_KEY=$ENCRYPTION_KEY
ENCRYPTION_ALGORITHM=aes-256-gcm

# Storage
STORAGE_PATH=/data/files

# Logging
LOG_LEVEL=info
EOF
        fi
    else
        # Copy template and replace values
        cp "$template" "$output"

        # Use sed to replace values (cross-platform compatible)
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            sed -i '' "s|SUPABASE_URL=.*|SUPABASE_URL=$API_URL|g" "$output"
            sed -i '' "s|NEXT_PUBLIC_SUPABASE_URL=.*|NEXT_PUBLIC_SUPABASE_URL=$API_URL|g" "$output"
            sed -i '' "s|SUPABASE_ANON_KEY=.*|SUPABASE_ANON_KEY=$ANON_KEY|g" "$output"
            sed -i '' "s|NEXT_PUBLIC_SUPABASE_ANON_KEY=.*|NEXT_PUBLIC_SUPABASE_ANON_KEY=$ANON_KEY|g" "$output"
            sed -i '' "s|SUPABASE_SERVICE_KEY=.*|SUPABASE_SERVICE_KEY=$SERVICE_KEY|g" "$output"
            sed -i '' "s|DATABASE_URL=.*|DATABASE_URL=$DB_URL|g" "$output"
            sed -i '' "s|ENCRYPTION_KEY=.*|ENCRYPTION_KEY=$ENCRYPTION_KEY|g" "$output"
        else
            # Linux
            sed -i "s|SUPABASE_URL=.*|SUPABASE_URL=$API_URL|g" "$output"
            sed -i "s|NEXT_PUBLIC_SUPABASE_URL=.*|NEXT_PUBLIC_SUPABASE_URL=$API_URL|g" "$output"
            sed -i "s|SUPABASE_ANON_KEY=.*|SUPABASE_ANON_KEY=$ANON_KEY|g" "$output"
            sed -i "s|NEXT_PUBLIC_SUPABASE_ANON_KEY=.*|NEXT_PUBLIC_SUPABASE_ANON_KEY=$ANON_KEY|g" "$output"
            sed -i "s|SUPABASE_SERVICE_KEY=.*|SUPABASE_SERVICE_KEY=$SERVICE_KEY|g" "$output"
            sed -i "s|DATABASE_URL=.*|DATABASE_URL=$DB_URL|g" "$output"
            sed -i "s|ENCRYPTION_KEY=.*|ENCRYPTION_KEY=$ENCRYPTION_KEY|g" "$output"
        fi
    fi

    print_success "Created $output"
}

# Create .env files
create_env_file ".env.local.example" ".env" "root"
create_env_file ".env.local.example" "apps/web/.env" "web"
create_env_file ".env.local.example" "apps/proxy/.env" "proxy"

print_header "Setup Complete!"

print_success "Local Supabase is running with the following services:"
echo ""
echo "  📊 Supabase Studio:  http://127.0.0.1:54323"
echo "  🔌 API:              $API_URL"
echo "  📧 Email Testing:    http://127.0.0.1:54324"
echo "  🗄️  Database:         $DB_URL"
echo ""

print_info "Next steps:"
echo "  1. Start development servers:"
echo "     ${GREEN}pnpm dev${NC}"
echo ""
echo "  2. Visit http://localhost:3000 to see your app"
echo "  3. Visit http://127.0.0.1:54323 for Supabase Studio"
echo ""
print_info "Useful commands:"
echo "  ${BLUE}supabase status${NC}     - View Supabase status"
echo "  ${BLUE}supabase stop${NC}       - Stop Supabase"
echo "  ${BLUE}supabase db reset${NC}   - Reset database"
echo "  ${BLUE}./scripts/stop-local.sh${NC} - Stop everything"
echo ""

# Ask if user wants to start dev servers
read -p "Start development servers now? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_info "Starting development servers..."
    echo ""
    exec pnpm dev
fi
