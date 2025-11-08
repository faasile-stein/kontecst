#!/bin/bash

# Kontecst Development Environment Status Script
# Checks the status of all services

set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_header() {
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

print_success() {
    echo -e "${GREEN}✓ Running${NC} - $1"
}

print_error() {
    echo -e "${RED}✗ Stopped${NC} - $1"
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

check_service() {
    local service=$1
    local port=$2
    local name=$3

    if nc -z localhost $port >/dev/null 2>&1; then
        print_success "$name (http://localhost:$port)"
    else
        print_error "$name (expected on port $port)"
    fi
}

print_header "Kontecst Service Status"
echo ""

# Check Docker containers
print_info "Docker Services:"
if docker compose ps --format json 2>/dev/null | grep -q "running"; then
    docker compose ps --format "table {{.Service}}\t{{.Status}}\t{{.Ports}}"
else
    print_error "No Docker services running"
fi

echo ""

# Check web services
print_info "Development Servers:"

# Check Next.js (port 3000)
check_service "nextjs" 3000 "Next.js Web App"

# Check Fastify proxy (port 3001)
check_service "proxy" 3001 "Fastify File Proxy"

# Check PostgreSQL (port 5432)
check_service "postgres" 5432 "PostgreSQL + pgvector"

echo ""

# Show service URLs
print_header "Service URLs"
echo ""
echo "  📱 Web Application:   http://localhost:3000"
echo "  🔐 File Proxy:        http://localhost:3001"
echo "  🗄️  PostgreSQL:        localhost:5432"
echo "  📊 Docker Logs:       pnpm docker:logs"
echo ""
